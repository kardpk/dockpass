export type BoatType =
  | "yacht"
  | "catamaran"
  | "motorboat"
  | "sailboat"
  | "pontoon"
  | "fishing"
  | "speedboat"
  | "other";

export type CharterType = "captained" | "bareboat" | "both";

export interface WizardAddon {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceCents: number;
  maxQuantity: number;
}

export interface WizardData {
  // Step 1 — Boat basics
  importUrl: string;
  importSuccess: boolean;
  boatName: string;
  boatType: BoatType | "";
  charterType: CharterType | "";
  yearBuilt: string;
  maxCapacity: string;
  photoUrls: string[];

  // Step 2 — Marina
  marinaName: string;
  marinaAddress: string;
  slipNumber: string;
  parkingInstructions: string;
  lat: number | null;
  lng: number | null;

  // Step 3 — Captain
  captainName: string;
  captainPhotoFile: File | null;
  captainPhotoPreview: string;
  captainBio: string;
  captainLicense: string;
  captainLanguages: string[];
  captainYearsExp: string;

  // Step 4 — Defaults
  whatToBring: string;
  houseRules: string;
  prohibitedItems: string;
  cancellationPolicy: string;

  // Step 5 — Waiver
  waiverText: string;

  // Step 6 — Addons
  addons: WizardAddon[];
}

export const INITIAL_WIZARD_DATA: WizardData = {
  importUrl: "",
  importSuccess: false,
  boatName: "",
  boatType: "",
  charterType: "",
  yearBuilt: "",
  maxCapacity: "",
  photoUrls: [],
  marinaName: "",
  marinaAddress: "",
  slipNumber: "",
  parkingInstructions: "",
  lat: null,
  lng: null,
  captainName: "",
  captainPhotoFile: null,
  captainPhotoPreview: "",
  captainBio: "",
  captainLicense: "",
  captainLanguages: ["en"],
  captainYearsExp: "",
  whatToBring: "",
  houseRules: "",
  prohibitedItems: "",
  cancellationPolicy: "",
  waiverText: "",
  addons: [],
};

export const STEP_TITLES: Record<number, string> = {
  1: "Your boat",
  2: "Marina & dock",
  3: "Captain profile",
  4: "Trip defaults",
  5: "Liability waiver",
  6: "Add-on menu",
};

export const TOTAL_STEPS = 6;
