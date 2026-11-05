// Screens for the Client Onboarding demo: intake form, intake check and the intake queue.
import { reviewIntake } from "./checks.js";
import { COUNTRIES, countryName } from "./countries.js";

const STORE_KEY = "client-onboarding.queue.v1";
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);

/** Tiny element helper. Text is always set as text, never as HTML. */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "value") el.value = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

function sampleQueue() {
  const t = today();
  return [
    {
      id: "CO-1001",
      submitted: addDays(t, -6),
      legalName: "Harbour Holdings Ltd",
      clientType: "company",
      country: "GB",
      email: "ops@harbour.example",
      owners: [
        { name: "Ana Silva", nationality: "GB", ownership: 60, passportNumber: "K1234567", passportExpiry: addDays(t, 900) },
        { name: "Tom Reyes", nationality: "US", ownership: 40, passportNumber: "P8812345", passportExpiry: addDays(t, 1500) },
      ],
    },
    {
      id: "CO-1002",
      submitted: addDays(t, -3),
      legalName: "Northgate Capital SARL",
      clientType: "company",
      country: "LU",
      email: "finance@northgate.example",
      owners: [{ name: "Marc Weber", nationality: "LU", ownership: 75, passportNumber: "LX441098", passportExpiry: addDays(t, -40) }],
    },
    {
      id: "CO-1003",
      submitted: addDays(t, -1),
      legalName: "Priya Nair",
      clientType: "individual",
      country: "SG",
      email: "priya.nair@example.com",
      owners: [{ name: "Priya Nair", nationality: "SG", ownership: 100, passportNumber: "E7731209", passportExpiry: addDays(t, 45) }],
    },
  ];
}

function loadQueue() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null");
    if (Array.isArray(saved)) return saved;
  } catch {
    /* storage unavailable: use sample data */
  }
  return sampleQueue();
}
function saveQueue(q) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(q));
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

const blankOwner = () => ({ name: "", nationality: "", ownership: "", passportNumber: "", passportExpiry: "" });
let form = { legalName: "", clientType: "company", country: "", email: "", owners: [blankOwner()] };
let queue = loadQueue();

const countryOptions = (selected) => [h("option", { value: "" }, "Choose…"), ...Object.entries(COUNTRIES).map(([code, name]) => h("option", { value: code, selected: code === selected }, name))];

function ownerRow(o, i) {
  const set = (k) => (e) => {
    form.owners[i][k] = k === "passportNumber" ? e.target.value.toUpperCase() : e.target.value;
  };
  return h(
    "div",
    { class: "owner" },
    h("label", {}, "Full name", h("input", { value: o.name, oninput: set("name"), autocomplete: "off" })),
    h("label", {}, "Nationality", h("select", { onchange: set("nationality") }, countryOptions(o.nationality))),
    h("label", {}, "Ownership %", h("input", { type: "number", min: 1, max: 100, value: o.ownership, oninput: set("ownership") })),
    h("label", {}, "Passport number", h("input", { value: o.passportNumber, oninput: set("passportNumber"), autocomplete: "off" })),
    h("label", {}, "Passport expiry", h("input", { type: "date", value: o.passportExpiry, oninput: set("passportExpiry") })),
    h(
      "button",
      {
        type: "button",
        class: "btn icon",
        "aria-label": `Remove owner ${i + 1}`,
        disabled: form.owners.length === 1,
        onclick: () => {
          form.owners.splice(i, 1);
          renderForm();
        },
      },
      "Remove",
    ),
  );
}

function renderForm() {
  const el = document.getElementById("intake");
  const set = (k) => (e) => {
    form[k] = e.target.value;
    if (k === "clientType") renderForm();
  };
  el.replaceChildren(
    h(
      "div",
      { class: "grid2" },
      h("label", {}, "Legal name", h("input", { value: form.legalName, oninput: set("legalName") })),
      h(
        "label",
        {},
        "Client type",
        h("select", { onchange: set("clientType") }, h("option", { value: "company", selected: form.clientType === "company" }, "Company"), h("option", { value: "individual", selected: form.clientType === "individual" }, "Individual")),
      ),
      h("label", {}, form.clientType === "company" ? "Country of incorporation" : "Country of residence", h("select", { onchange: set("country") }, countryOptions(form.country))),
      h("label", {}, "Contact email", h("input", { type: "email", value: form.email, oninput: set("email") })),
    ),
    h(
      "fieldset",
      {},
      h("legend", {}, form.clientType === "company" ? "Beneficial owners" : "Identity"),
      form.owners.map(ownerRow),
      form.clientType === "company" &&
        h(
          "div",
          {},
          h(
            "button",
            {
              type: "button",
              class: "btn quiet",
              onclick: () => {
                form.owners.push(blankOwner());
                renderForm();
              },
            },
            "Add owner",
          ),
        ),
    ),
    h(
      "div",
      { class: "actions" },
      h("button", { type: "button", class: "btn", onclick: () => renderResult(reviewIntake(form, today())) }, "Check"),
      h("button", { type: "button", class: "btn quiet", onclick: addToQueue }, "Add to queue"),
    ),
  );
}

function statusPill(status) {
  return h("span", { class: `pill ${status === "Ready for screening" ? "good" : "bad"}` }, status);
}
function riskPill(risk) {
  return h("span", { class: `pill ${risk === "High" ? "bad" : risk === "Medium" ? "warn" : "good"}` }, `${risk} risk`);
}

function renderResult(r, note) {
  document
    .getElementById("result")
    .replaceChildren(
      h("div", { class: "actions" }, statusPill(r.status), riskPill(r.risk)),
      r.issues.length ? h("ul", { class: "issues" }, r.issues.map((x) => h("li", { class: x.level }, x.message))) : h("p", {}, "No issues found."),
      note ? h("p", { class: "notice muted" }, note) : null,
    );
}

function addToQueue() {
  const r = reviewIntake(form, today());
  if (!form.legalName.trim()) return renderResult(r, "Enter the legal name before adding the client to the queue.");
  const id = `CO-${1001 + queue.length}`;
  queue = [...queue, { ...structuredClone(form), id, submitted: today() }];
  saveQueue(queue);
  renderQueue();
  renderResult(r, `Added ${form.legalName} to the queue as ${id}.`);
  form = { legalName: "", clientType: "company", country: "", email: "", owners: [blankOwner()] };
  renderForm();
}

function renderQueue() {
  const t = today();
  const rows = queue.map((c) => {
    const r = reviewIntake(c, t);
    const first = r.issues.find((x) => x.level === "block") ?? r.issues[0];
    return h(
      "tr",
      {},
      h("td", {}, c.id),
      h("td", {}, c.legalName),
      h("td", {}, c.clientType === "company" ? "Company" : "Individual"),
      h("td", {}, countryName(c.country)),
      h("td", {}, c.submitted),
      h("td", {}, statusPill(r.status)),
      h("td", {}, riskPill(r.risk)),
      h("td", {}, first ? first.message : "None", r.issues.length > 1 ? h("span", { class: "muted" }, ` (+${r.issues.length - 1} more)`) : null),
    );
  });
  document
    .getElementById("queue")
    .replaceChildren(
      h("thead", {}, h("tr", {}, ["Case", "Client", "Type", "Country", "Submitted", "Status", "Risk", "Issues"].map((x) => h("th", { scope: "col" }, x)))),
      h("tbody", {}, rows),
    );
}

async function showVersion() {
  try {
    const v = await (await fetch(`version.json?t=${Date.now()}`, { cache: "no-store" })).json();
    document.getElementById("version").textContent = `Version ${String(v.sha).slice(0, 7)} · ${v.env} · built ${v.builtAt.slice(0, 16).replace("T", " ")} UTC`;
    if (v.env === "staging") {
      const bar = document.getElementById("envbar");
      bar.textContent = "STAGING · test environment, not for real clients";
      bar.hidden = false;
    }
  } catch {
    /* running locally without a build */
  }
}

document.getElementById("reset").addEventListener("click", () => {
  queue = sampleQueue();
  saveQueue(queue);
  renderQueue();
});

renderForm();
renderQueue();
showVersion();
