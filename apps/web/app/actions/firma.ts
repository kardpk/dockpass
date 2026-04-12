"use server";

/**
 * Create a Firma signing request for a specific boat's waiver template.
 *
 * @param tripSlug  - Trip identifier for audit trail
 * @param guestName - Guest display name (for signing request title)
 * @param templateId - Per-boat Firma template ID (from boats.firma_template_id)
 * @param passengerDetails - Signer info for Firma recipient
 */
export async function createSignatureRequest(
  tripSlug: string,
  guestName: string,
  templateId: string,
  passengerDetails: { firstName: string; lastName: string; email: string }
) {
  try {
    const apiKey = process.env.FIRMA_API_KEY;

    if (!apiKey) {
      console.error("[Firma Action Error] Missing FIRMA_API_KEY");
      return { success: false, error: "System configuration error. Please contact support." };
    }

    if (!templateId) {
      console.error("[Firma Action Error] No template ID provided for this boat");
      return { success: false, error: "Waiver template not configured. Please contact Captain." };
    }

    const payload = {
      name: `Safety Waiver - ${guestName}`,
      template_id: templateId,
      recipients: [
        {
          first_name: passengerDetails.firstName,
          last_name: passengerDetails.lastName,
          email: passengerDetails.email,
          designation: "Signer",
          order: 1,
        },
      ],
      metadata: {
        trip_slug: tripSlug,
        guest_name: guestName,
      },
    };

    const response = await fetch(
      "https://api.firma.dev/functions/v1/signing-request-api/signing-requests",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Firma API Error]", response.status, errText);
      return { success: false, error: "Failed to generate signing request from partner." };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("[Firma Unexpected Request Error]", error);
    return { success: false, error: "An unexpected error occurred while generating waiver." };
  }
}
