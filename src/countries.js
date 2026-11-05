// Sample country list for the demo. Not a real sanctions or risk list.
export const COUNTRIES = {
  GB: "United Kingdom",
  US: "United States",
  IE: "Ireland",
  LU: "Luxembourg",
  NL: "Netherlands",
  SG: "Singapore",
  KY: "Cayman Islands",
  VG: "British Virgin Islands",
  AE: "United Arab Emirates",
  ZA: "South Africa",
  IR: "Iran",
  KP: "North Korea",
  MM: "Myanmar",
};

/** Countries this demo treats as high risk. */
export const HIGH_RISK = new Set(["IR", "KP", "MM"]);

export function countryName(code) {
  return COUNTRIES[code] ?? code ?? "";
}
