import { NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import { getBoatTemplate, getDefaultsFromTemplate } from "@/lib/wizard/boat-templates";
import type { BoatTypeKey } from "@/app/dashboard/boats/new/types";

const VALID_TYPES: BoatTypeKey[] = [
  "motor_yacht",
  "fishing_charter",
  "catamaran",
  "power_catamaran",
  "pontoon",
  "snorkel_dive",
  "sailing_yacht",
  "speedboat",
  "wake_sports",
  "sunset_cruise",
  "center_console",
  "houseboat",
  "pwc",
  "other",
];

/**
 * GET /api/dashboard/wizard/template/[boatType]
 *
 * Returns the boat template + pre-filled defaults for the given type.
 * Requires authenticated operator.
 * Keeps the ~50KB boat-templates.ts server-only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boatType: string }> }
) {
  try {
    await requireOperator();

    const { boatType } = await params;

    if (!VALID_TYPES.includes(boatType as BoatTypeKey)) {
      return NextResponse.json(
        { error: `Invalid boat type: ${boatType}` },
        { status: 400 }
      );
    }

    const type = boatType as BoatTypeKey;
    const template = getBoatTemplate(type);
    const defaults = getDefaultsFromTemplate(type);

    return NextResponse.json({ template, defaults });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
