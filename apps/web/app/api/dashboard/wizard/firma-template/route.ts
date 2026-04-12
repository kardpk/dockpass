import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * POST /api/dashboard/wizard/firma-template
 *
 * Receives a PDF file upload, stores it in Supabase Storage,
 * creates a Firma.dev template from the PDF, and returns
 * the templateId + editorJwt for the embedded template editor.
 */
export async function POST(req: Request) {
  try {
    // 1. Auth check — validate the operator is logged in
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const firmaApiKey = process.env.FIRMA_API_KEY;

    if (!firmaApiKey) {
      return NextResponse.json(
        { error: "Firma API key not configured" },
        { status: 500 }
      );
    }

    // Create authenticated client from cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    if (pdfFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF must be smaller than 10MB" },
        { status: 400 }
      );
    }

    // 3. Upload PDF to Supabase Storage
    const serviceSupabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileBuffer = await pdfFile.arrayBuffer();
    const fileName = `${user.id}/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error: uploadError } = await serviceSupabase.storage
      .from("waiver-pdfs")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[firma-template] Storage upload failed:", uploadError);
      // Non-fatal — continue with Firma even if storage fails
    }

    // 4. Get the public URL for the uploaded PDF
    const { data: urlData } = serviceSupabase.storage
      .from("waiver-pdfs")
      .getPublicUrl(fileName);

    const pdfUrl = urlData?.publicUrl;

    // 5. Create Firma template from the PDF
    const firmaRes = await fetch(
      "https://api.firma.dev/functions/v1/signing-request-api/templates",
      {
        method: "POST",
        headers: {
          Authorization: firmaApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Waiver - ${pdfFile.name}`,
          file_url: pdfUrl,
          metadata: {
            operator_id: user.id,
            created_via: "boat_wizard",
          },
        }),
      }
    );

    if (!firmaRes.ok) {
      const errText = await firmaRes.text();
      console.error("[firma-template] Firma API error:", firmaRes.status, errText);
      return NextResponse.json(
        { error: "Failed to create waiver template with signing provider" },
        { status: 502 }
      );
    }

    const { id: templateId } = await firmaRes.json();

    // 6. Generate a JWT for the embedded template editor
    const jwtRes = await fetch(
      "https://api.firma.dev/functions/v1/signing-request-api/embed/jwt",
      {
        method: "POST",
        headers: {
          Authorization: firmaApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: templateId,
          mode: "template_editor",
          expires_in: 3600, // 1 hour
        }),
      }
    );

    let editorJwt: string | null = null;
    if (jwtRes.ok) {
      const jwtData = await jwtRes.json();
      editorJwt = jwtData.token ?? jwtData.jwt ?? null;
    } else {
      console.error("[firma-template] JWT generation failed:", await jwtRes.text());
    }

    return NextResponse.json({
      templateId,
      editorJwt,
      pdfUrl,
    });
  } catch (error) {
    console.error("[firma-template] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
