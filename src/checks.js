// Intake checks for a new client. Pure functions, so they can be tested without a browser.
import { HIGH_RISK, countryName } from "./countries.js";

/** Owners at or above this percentage must be identified. */
export const OWNERSHIP_THRESHOLD = 25;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSPORT_NUMBER = /^[A-Z0-9]{6,9}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isDate(s) {
  return ISO_DATE.test(s ?? "") && !Number.isNaN(Date.parse(s));
}

/**
 * Review one intake. `today` is an ISO date (YYYY-MM-DD).
 * Returns the status, a risk rating and the issues found. An issue with level "block" stops the case
 * going to screening until it is fixed; "warn" is shown to the analyst but does not stop it.
 */
export function reviewIntake(intake, today = new Date().toISOString().slice(0, 10)) {
  const issues = [];
  const block = (code, message) => issues.push({ level: "block", code, message });
  const warn = (code, message) => issues.push({ level: "warn", code, message });

  if (!intake.legalName?.trim()) block("name-missing", "Enter the client's legal name.");
  if (!["individual", "company"].includes(intake.clientType)) block("type-missing", "Choose whether the client is an individual or a company.");
  if (!intake.country) block("country-missing", "Choose the country of residence or incorporation.");
  if (intake.email && !EMAIL.test(intake.email)) block("email-invalid", "The contact email is not a valid address.");

  const owners = intake.owners ?? [];
  if (owners.length === 0) block("owners-missing", intake.clientType === "individual" ? "Add the client's identity details." : "Add at least one beneficial owner.");

  owners.forEach((o, i) => {
    const who = o.name?.trim() || `Owner ${i + 1}`;
    if (!o.name?.trim()) block("owner-name-missing", `Enter the name of owner ${i + 1}.`);
    if (!o.nationality) block("owner-nationality-missing", `Choose ${who}'s nationality.`);
    const pct = Number(o.ownership);
    if (!(pct > 0 && pct <= 100)) block("owner-ownership-invalid", `${who}'s ownership must be between 1 and 100%.`);
    if (!PASSPORT_NUMBER.test((o.passportNumber ?? "").toUpperCase())) block("passport-number-invalid", `Enter ${who}'s passport number (6 to 9 letters or digits).`);
    if (!isDate(o.passportExpiry)) block("passport-expiry-missing", `Enter ${who}'s passport expiry date.`);
  });

  const total = owners.reduce((s, o) => s + (Number(o.ownership) || 0), 0);
  if (total > 100) block("ownership-over-100", `Ownership adds up to ${total}%, which is more than 100%.`);
  if (owners.length && intake.clientType === "company" && !owners.some((o) => Number(o.ownership) >= OWNERSHIP_THRESHOLD))
    warn("no-controlling-owner", `No owner holds ${OWNERSHIP_THRESHOLD}% or more. Confirm who controls the company.`);

  const highRisk = [intake.country, ...owners.map((o) => o.nationality)].filter((c) => HIGH_RISK.has(c));
  if (highRisk.length) warn("high-risk-country", `High-risk country involved: ${[...new Set(highRisk)].map(countryName).join(", ")}. Enhanced checks apply.`);

  const blocked = issues.some((x) => x.level === "block");
  const risk = highRisk.length ? "High" : issues.some((x) => x.level === "warn") || owners.length > 3 ? "Medium" : "Low";
  return { status: blocked ? "Needs information" : "Ready for screening", risk, issues };
}
