import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { validateScrapingURL } from "@/lib/security/ssrf";
import { z } from "zod";

const importSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

/**
 * POST /api/dashboard/boats/import
 * Scrapes boat listing URL (Boatsetter, GetMyBoat).
 * Returns mock data in dev (no APIFY_API_TOKEN).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const { operator } = await requireOperator();
    if (!operator) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Rate limit: 5 per hour
    const { blocked } = await rateLimit(request, {
      key: `scrape:${operator.id}`,
      max: 5,
      window: 3600,
    });
    if (blocked) {
      return NextResponse.json(
        { error: "Too many imports. Try again in an hour." },
        { status: 429 }
      );
    }

    // 3. Parse + validate body
    const body = await request.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    // 4. SSRF protection
    const { valid, error: ssrfError } = validateScrapingURL(parsed.data.url);
    if (!valid) {
      return NextResponse.json(
        { error: ssrfError ?? "URL not allowed" },
        { status: 400 }
      );
    }

    const url = parsed.data.url.toLowerCase();

    // 5. Check for Apify token
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!apifyToken) {
      // Return mock data for development
      const isBoatsetter = url.includes("boatsetter");
      const isGetMyBoat = url.includes("getmyboat");

      if (!isBoatsetter && !isGetMyBoat) {
        return NextResponse.json(
          { error: "Only Boatsetter and GetMyBoat URLs are supported" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        data: {
          boatName: "Your Boat Name",
          boatType: "yacht" as const,
          maxCapacity: 8,
          marinaName: "Miami Beach Marina",
          marinaAddress: "300 Alton Rd, Miami Beach, FL 33139",
          captainName: "Captain Name",
          houseRules:
            "No red wine on deck.\nRemove shoes before boarding.\nNo smoking below deck.",
          whatToBring: "Sunscreen, towel, valid ID, non-marking shoes",
          cancellationPolicy:
            "Free cancellation 48 hours before. 50% refund 24-48 hours before.",
          photoUrls: [],
          _isMock: true,
        },
      });
    }

    // 6. Real Apify call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const apifyRes = await fetch(
        `https://api.apify.com/v2/acts/lukaskrivka~web-scraper/run-sync-get-dataset-items?token=${apifyToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            startUrls: [{ url: parsed.data.url }],
            maxPagesPerCrawl: 1,
          }),
        }
      );

      clearTimeout(timeout);

      if (!apifyRes.ok) {
        return NextResponse.json(
          { error: "Could not read listing" },
          { status: 500 }
        );
      }

      const results = await apifyRes.json();
      const item = Array.isArray(results) ? results[0] : null;

      if (!item) {
        return NextResponse.json(
          { error: "Could not read listing" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: {
          boatName: item.title || item.boatName || "Imported Boat",
          boatType: "yacht",
          maxCapacity: item.capacity || item.maxGuests || 8,
          marinaName: item.location || item.marinaName || "",
          marinaAddress: item.address || "",
          captainName: item.captainName || "",
          houseRules: item.rules || item.houseRules || "",
          whatToBring: item.whatToBring || "",
          cancellationPolicy: item.cancellationPolicy || "",
          photoUrls: item.photos || item.images || [],
          _isMock: false,
        },
      });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Import timed out. Try again." },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: "Could not read listing" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not read listing" },
      { status: 500 }
    );
  }
}
