import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * POST /api/dashboard/wizard/upload-safety-image
 *
 * Uploads a safety card image to Supabase Storage bucket `safety-images`.
 * Returns the public URL for storage in the SafetyCard JSONB.
 *
 * Auth: Requires authenticated operator session.
 * Limits: JPEG/PNG/WebP, max 5MB, magic byte validation.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Magic byte signatures
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const WEBP_MAGIC = [0x52, 0x49, 0x46, 0x46]; // RIFF

function validateMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4));
  if (bytes[0] === JPEG_MAGIC[0] && bytes[1] === JPEG_MAGIC[1] && bytes[2] === JPEG_MAGIC[2]) return true;
  if (bytes[0] === PNG_MAGIC[0] && bytes[1] === PNG_MAGIC[1] && bytes[2] === PNG_MAGIC[2] && bytes[3] === PNG_MAGIC[3]) return true;
  if (bytes[0] === WEBP_MAGIC[0] && bytes[1] === WEBP_MAGIC[1] && bytes[2] === WEBP_MAGIC[2] && bytes[3] === WEBP_MAGIC[3]) return true;
  return false;
}

export async function POST(req: Request) {
  try {
    // 1. Auth
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { cookie: cookieStore.toString() } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const topicKey = formData.get("topic_key") as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 3. Validate MIME type
    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are accepted" },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB" },
        { status: 400 }
      );
    }

    // 5. Validate magic bytes (prevent extension spoofing)
    const fileBuffer = await imageFile.arrayBuffer();
    if (!validateMagicBytes(fileBuffer)) {
      return NextResponse.json(
        { error: "File content does not match a valid image format" },
        { status: 400 }
      );
    }

    // 6. Upload to Supabase Storage
    const serviceSupabase = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedTopic = (topicKey || "custom").replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${user.id}/safety/${sanitizedTopic}_${Date.now()}.${ext}`;

    const { error: uploadError } = await serviceSupabase.storage
      .from("safety-images")
      .upload(fileName, fileBuffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload-safety-image] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image to storage" },
        { status: 502 }
      );
    }

    // 7. Get public URL
    const { data: urlData } = serviceSupabase.storage
      .from("safety-images")
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: urlData?.publicUrl ?? null,
      fileName,
    });
  } catch (error) {
    console.error("[upload-safety-image] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
