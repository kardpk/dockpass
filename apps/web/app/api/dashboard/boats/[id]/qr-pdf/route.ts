import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { auditLog } from "@/lib/security/audit";

/**
 * GET /api/dashboard/boats/[id]/qr-pdf
 *
 * Generates a print-ready 4×4 inch PDF containing the permanent boat QR code.
 * The QR encodes: https://boatcheckin.com/board/[public_slug]
 *
 * Security:
 *   - Requires operator auth
 *   - Verifies boat belongs to authenticated operator
 *   - Audit logs every download
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: boatId } = await params;

  // 1. Auth: must be a logged-in operator
  const { operator } = await requireOperator();

  const supabase = createServiceClient();

  // 2. Verify boat ownership
  const { data: boat } = await supabase
    .from("boats")
    .select("id, boat_name, public_slug, short_board_token, marina_name")
    .eq("id", boatId)
    .eq("operator_id", operator.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!boat) {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }

  const publicSlug = boat.public_slug as string;
  const shortToken = (boat.short_board_token as string | null) ?? null;
  const boatName = boat.boat_name as string;
  // Prefer short URL — cleaner text in PDF + fewer QR modules = better print scan
  const boardingUrl = shortToken
    ? `https://boatcheckin.com/b/${shortToken}`
    : `https://boatcheckin.com/board/${publicSlug}`;

  // 3. Generate QR code as a PNG data buffer
  //    Level M = ~15% error correction — survives typical marine wear/scratches
  let qrPngBytes: Buffer;
  try {
    const dataUrl = await QRCode.toDataURL(boardingUrl, {
      errorCorrectionLevel: "M",
      width: 600,     // high resolution for print
      margin: 2,      // quiet zone
      color: {
        dark: "#0B1D3A",   // navy foreground
        light: "#FFFFFF",  // white background
      },
    });
    // Strip 'data:image/png;base64,' prefix
    const base64 = dataUrl.split(",")[1]!;
    qrPngBytes = Buffer.from(base64, "base64");
  } catch (err) {
    console.error("[qr-pdf] QR generation failed:", err);
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 });
  }

  // 4. Build PDF — 4×4 inches at 72 DPI = 288×288 points
  //    (pdf-lib works in points: 1 inch = 72pt)
  const PDF_PT = 288; // 4 inches
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PDF_PT, PDF_PT]);

  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Colours
  const navy = rgb(0.043, 0.114, 0.227);    // #0B1D3A
  const gold  = rgb(0.722, 0.533, 0.165);   // #B8882A
  const grey  = rgb(0.361, 0.431, 0.510);   // #5C6E82
  const white = rgb(1, 1, 1);

  // ── Background: white ──────────────────────────────────────────────
  page.drawRectangle({
    x: 0, y: 0,
    width: PDF_PT, height: PDF_PT,
    color: white,
  });

  // ── Top gold bar (4pt) ─────────────────────────────────────────────
  page.drawRectangle({
    x: 0, y: PDF_PT - 4,
    width: PDF_PT, height: 4,
    color: gold,
  });

  // ── Logo text: "BOATCHECKIN" ───────────────────────────────────────
  const logoText = "BOATCHECKIN";
  const logoFontSize = 7.5;
  const logoWidth = helveticaBold.widthOfTextAtSize(logoText, logoFontSize);
  page.drawText(logoText, {
    x: (PDF_PT - logoWidth) / 2,
    y: PDF_PT - 18,
    size: logoFontSize,
    font: helveticaBold,
    color: navy,
  });

  // ── QR code image ──────────────────────────────────────────────────
  // Embed as PNG; place centred with some margin
  const qrImage = await pdfDoc.embedPng(qrPngBytes);
  const qrSize = 196;  // ~2.72 inches — dominant element
  const qrX = (PDF_PT - qrSize) / 2;
  const qrY = PDF_PT - 30 - qrSize;  // 30pt from top (below logo)
  page.drawImage(qrImage, {
    x: qrX, y: qrY,
    width: qrSize, height: qrSize,
  });

  // ── Boat name ──────────────────────────────────────────────────────
  const nameFontSize = 13;
  const nameText = boatName.toUpperCase();
  const nameWidth = helveticaBold.widthOfTextAtSize(nameText, nameFontSize);
  page.drawText(nameText, {
    x: (PDF_PT - nameWidth) / 2,
    y: qrY - 16,
    size: nameFontSize,
    font: helveticaBold,
    color: navy,
  });

  // ── URL (monospace, small) ─────────────────────────────────────────
  const urlText = boardingUrl.replace("https://", "");
  const urlFontSize = 6;
  const urlWidth = courier.widthOfTextAtSize(urlText, urlFontSize);
  page.drawText(urlText, {
    x: (PDF_PT - urlWidth) / 2,
    y: qrY - 28,
    size: urlFontSize,
    font: courier,
    color: grey,
  });

  // ── Tagline at bottom ──────────────────────────────────────────────
  const tagline = "Scan to check in  ·  boatcheckin.com";
  const tagFontSize = 6.5;
  const tagWidth = helvetica.widthOfTextAtSize(tagline, tagFontSize);
  page.drawText(tagline, {
    x: (PDF_PT - tagWidth) / 2,
    y: 10,
    size: tagFontSize,
    font: helvetica,
    color: grey,
  });

  // ── Bottom gold bar (2pt) ──────────────────────────────────────────
  page.drawRectangle({
    x: 0, y: 0,
    width: PDF_PT, height: 2,
    color: gold,
  });

  // 5. Serialise PDF
  const pdfBytes = await pdfDoc.save();

  // 6. Audit log (fire-and-forget)
  auditLog({
    action: "boat_qr_downloaded",
    operatorId: operator.id,
    actorType: "operator",
    actorIdentifier: operator.id,
    entityType: "boat",
    entityId: boatId,
  });

  // 7. Return PDF
  const safeName = boatName.replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="boatcheckin-qr-${safeName}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
