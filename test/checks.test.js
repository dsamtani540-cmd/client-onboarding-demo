import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewIntake } from "../src/checks.js";

const TODAY = "2026-11-04";
const owner = (over = {}) => ({ name: "Ana Silva", nationality: "GB", ownership: 60, passportNumber: "K1234567", passportExpiry: "2030-05-01", ...over });
const company = (over = {}) => ({ legalName: "Harbour Holdings Ltd", clientType: "company", country: "GB", email: "ops@harbour.example", owners: [owner()], ...over });

test("a complete company intake is ready for screening at low risk", () => {
  const r = reviewIntake(company(), TODAY);
  assert.equal(r.status, "Ready for screening");
  assert.equal(r.risk, "Low");
  assert.deepEqual(r.issues, []);
});

test("missing name, type and owners are blocking", () => {
  const r = reviewIntake({ legalName: "", clientType: "", country: "", owners: [] }, TODAY);
  assert.equal(r.status, "Needs information");
  assert.deepEqual(r.issues.map((x) => x.code).sort(), ["country-missing", "name-missing", "owners-missing", "type-missing"]);
});

test("ownership over 100% is blocking", () => {
  const r = reviewIntake(company({ owners: [owner(), owner({ name: "Ben Ode", ownership: 50, passportNumber: "P7654321" })] }), TODAY);
  assert.ok(r.issues.some((x) => x.code === "ownership-over-100" && x.level === "block"));
});

test("no owner at or above 25% is a warning, not a block", () => {
  const owners = [10, 20, 15].map((pct, i) => owner({ name: `Owner ${i}`, ownership: pct, passportNumber: `A00000${i}` }));
  const r = reviewIntake(company({ owners }), TODAY);
  assert.equal(r.status, "Ready for screening");
  assert.equal(r.risk, "Medium");
  assert.ok(r.issues.some((x) => x.code === "no-controlling-owner" && x.level === "warn"));
});

test("a high-risk nationality raises the risk to High", () => {
  const r = reviewIntake(company({ owners: [owner({ nationality: "IR" })] }), TODAY);
  assert.equal(r.risk, "High");
  assert.ok(r.issues.some((x) => x.code === "high-risk-country"));
});

test("passport number and expiry date are required", () => {
  const r = reviewIntake(company({ owners: [owner({ passportNumber: "12", passportExpiry: "" })] }), TODAY);
  assert.deepEqual(r.issues.map((x) => x.code).sort(), ["passport-expiry-missing", "passport-number-invalid"]);
});

test("an invalid email is blocking", () => {
  const r = reviewIntake(company({ email: "not-an-email" }), TODAY);
  assert.ok(r.issues.some((x) => x.code === "email-invalid"));
});
