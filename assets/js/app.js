/* Both templates ship as AES-GCM ciphertext and open through the vault, so the
   wizard cannot build anything while locked. */
const TEMPLATE_URL  = "assets/docs/form-sg-it-014.enc.json";
const CHECKLIST_URL = "assets/docs/pc-setup-checklist.enc.json";

/* ------------------------------------------------------------------ data */
const EQUIPMENT = [
  { key: "laptop",          label: "Laptop" },
  { key: "monitor",         label: "Monitor" },
  { key: "keyboard_mouse",  label: "Keyboard / Mouse" },
  { key: "headset",         label: "Headset" },
  { key: "docking_station", label: "Docking Station" },
  { key: "mobile_device",   label: "Mobile Device" },
  { key: "other_1",         label: "Other (first spare row)", custom: true },
  { key: "other_2",         label: "Other (second spare row)", custom: true }
];

const ACCESSORIES = [
  { key: "power_adapter",  label: "Power Adapter" },
  { key: "display_cable",  label: "Display Cable" },
  { key: "ethernet_cable", label: "Ethernet Cable" },
  { key: "security_cable", label: "Security Cable / Lock" },
  { key: "usb_hub",        label: "USB Hub" },
  { key: "carrying_case",  label: "Carrying Case" },
  { key: "webcam",         label: "Webcam" },
  { key: "other",          label: "Other", custom: true }
];

const CONDITIONS = [
  { v: "N", label: "N — New" },
  { v: "G", label: "G — Good, no visible defects" },
  { v: "F", label: "F — Fair, cosmetic wear" },
  { v: "R", label: "R — Refurbished" },
  { v: "D", label: "D — Damaged (describe in notes)" }
];

const SECTIONS = ["Employee", "Equipment", "Software", "Accessories", "Signatures", "Notes", "Review"];

const state = {
  v: {},                 // every simple answer, keyed by field id
  equipment: [],         // selected equipment keys
  accessories: [],       // selected accessory keys
  software: [{}]         // rows: { account, license, date, notes }
};

const today = new Date().toISOString().slice(0, 10);
state.v.issue_date = today;

/* ------------------------------------------------------ step definitions */
function buildSteps() {
  const s = [];
  const push = (o) => s.push(o);

  // 1 — employee
  push({ id: "employee_name", sec: 0, q: "Who is this equipment for?", help: "Full name as it should appear on the record.", type: "text", required: true });
  push({ id: "employee_id", sec: 0, q: "Employee ID", type: "text" });
  push({ id: "department", sec: 0, q: "Department", type: "text" });
  push({ id: "job_title", sec: 0, q: "Job title", type: "text" });
  push({ id: "reporting_manager", sec: 0, q: "Reporting manager", type: "text" });
  push({ id: "work_location", sec: 0, q: "Work location or site", type: "text" });
  push({ id: "start_date", sec: 0, q: "Start date", type: "date" });
  push({ id: "issue_date", sec: 0, q: "Issue date", help: "Defaults to today.", type: "date" });
  push({ id: "return_review_date", sec: 0, q: "Scheduled return or review date", type: "date" });

  // 2 — equipment
  push({ id: "__equipment", sec: 1, q: "Which equipment is being issued?", help: "Pick every row you need. Unpicked rows stay blank on the form.", type: "multi", options: EQUIPMENT, bind: "equipment" });

  state.equipment.forEach((key) => {
    const item = EQUIPMENT.find((e) => e.key === key);
    const name = item.custom ? (state.v[`eq_${key}_item`] || "spare row") : item.label;
    if (item.custom) push({ id: `eq_${key}_item`, sec: 1, q: "Name this spare equipment row", help: "For example: Tablet, Plotter, GPS receiver.", type: "text" });
    push({ id: `eq_${key}_make`, sec: 1, q: `${name} — make and model`, type: "text" });
    push({ id: `eq_${key}_serial`, sec: 1, q: `${name} — serial number`, type: "text" });
    push({ id: `eq_${key}_asset`, sec: 1, q: `${name} — asset tag`, type: "text" });
    push({ id: `eq_${key}_condition`, sec: 1, q: `${name} — condition`, type: "select", options: CONDITIONS });
  });

  push({ id: "mac_address", sec: 1, q: "MAC address of the primary machine", help: "Not printed on the form. Used for the asset spreadsheet row and the setup checklist.", type: "text" });

  // 3 — software
  state.software.forEach((row, i) => {
    const prior = i === 0 || (state.software[i - 1] && state.software[i - 1].account);
    if (!prior || i > 4) return;
    push({ id: `sw_${i}_account`, sec: 2, q: i === 0 ? "Software or account provisioned" : `Software or account ${i + 1}`, help: "Leave blank to move on.", type: "sw", row: i, part: "account" });
    if (row.account) {
      push({ id: `sw_${i}_license`, sec: 2, q: `${row.account} — license type`, type: "sw", row: i, part: "license" });
      push({ id: `sw_${i}_date`, sec: 2, q: `${row.account} — provisioned on`, type: "sw", row: i, part: "date", inputType: "date" });
      push({ id: `sw_${i}_notes`, sec: 2, q: `${row.account} — notes`, type: "sw", row: i, part: "notes" });
    }
  });

  // 4 — accessories
  push({ id: "__accessories", sec: 3, q: "Which accessories go with it?", help: "Quantities come next. Anything unpicked is left blank.", type: "multi", options: ACCESSORIES, bind: "accessories" });
  state.accessories.forEach((key) => {
    const item = ACCESSORIES.find((a) => a.key === key);
    if (item.custom) push({ id: "acc_other_item", sec: 3, q: "Name the other accessory", type: "text" });
    const name = item.custom ? (state.v.acc_other_item || "Other accessory") : item.label;
    push({ id: `acc_${key}_qty`, sec: 3, q: `${name} — quantity`, type: "number", default: "1" });
  });

  // 5 — signatures
  push({ id: "sig_employee_print_name", sec: 4, q: "Employee print name", help: "Defaults to the name you entered at the start.", type: "text", default: state.v.employee_name || "" });
  push({ id: "sig_employee_date", sec: 4, q: "Employee date", type: "date", default: state.v.issue_date || today });
  push({ id: "sig_it_rep_print_name", sec: 4, q: "IT representative print name", help: "You.", type: "text" });
  push({ id: "sig_it_rep_date", sec: 4, q: "IT representative date", type: "date", default: state.v.issue_date || today });

  // 6 — notes
  for (let i = 1; i <= 4; i++) {
    if (i === 1 || state.v[`notes_line_${i - 1}`]) {
      push({ id: `notes_line_${i}`, sec: 5, q: i === 1 ? "Notes and exceptions" : `Notes, line ${i}`, help: i === 1 ? "Damage codes, deviations, pending items. Leave blank to skip." : "Leave blank to finish.", type: "text" });
    }
  }

  push({ id: "__review", sec: 6, type: "review" });
  return s;
}

let steps = buildSteps();
let idx = 0;

/* ----------------------------------------------------------- value access */
function getVal(step) {
  if (step.type === "sw") return state.software[step.row]?.[step.part] || "";
  return state.v[step.id] ?? step.default ?? "";
}

function setVal(step, val) {
  if (step.type === "sw") {
    state.software[step.row] = state.software[step.row] || {};
    state.software[step.row][step.part] = val;
    if (step.part === "account" && val && !state.software[step.row + 1]) state.software.push({});
  } else {
    state.v[step.id] = val;
  }
}

/* ------------------------------------------------------------- rendering */
const card = document.getElementById("card");
const rail = document.getElementById("rail");
const bar = document.getElementById("bar");
// toast() comes from vault.js, shared across the site

function renderRail(sec) {
  rail.innerHTML = SECTIONS.map((name, i) =>
    `<li class="${i === sec ? "active" : i < sec ? "done" : ""}">
       <span class="n">${String(i).padStart(2, "0")}</span><span>${name}</span>
     </li>`
  ).join("");
}

function render() {
  steps = buildSteps();
  if (idx >= steps.length) idx = steps.length - 1;
  const step = steps[idx];
  renderRail(step.sec);
  bar.style.width = ((idx / (steps.length - 1)) * 100).toFixed(1) + "%";

  if (step.type === "review") return renderReview();

  const total = steps.length - 1;
  let control = "";

  if (step.type === "multi") {
    const chosen = state[step.bind];
    control = `<div class="choices">` + step.options.map((o) => `
      <label class="choice ${chosen.includes(o.key) ? "on" : ""}">
        <input type="checkbox" value="${o.key}" ${chosen.includes(o.key) ? "checked" : ""}>
        <span>${o.label}</span>
      </label>`).join("") + `</div>`;
  } else if (step.type === "select") {
    control = `<select id="input"><option value="">Not recorded</option>` +
      step.options.map((o) => `<option value="${o.v}" ${getVal(step) === o.v ? "selected" : ""}>${o.label}</option>`).join("") +
      `</select>`;
  } else {
    const t = step.inputType || (step.type === "date" ? "date" : step.type === "number" ? "number" : "text");
    control = `<input id="input" type="${t}" value="${String(getVal(step)).replace(/"/g, "&quot;")}" ${step.type === "number" ? 'min="0" step="1"' : ""} autocomplete="off">`;
  }

  card.innerHTML = `
    <p class="eyebrow"><span>${String(step.sec).padStart(2, "0")} &mdash; ${SECTIONS[step.sec]}</span><span>${String(idx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></p>
    <h2>${step.q}</h2>
    <div class="rule"></div>
    ${step.help ? `<p class="help">${step.help}</p>` : ""}
    ${control}
    <div class="actions">
      <button class="ghost" id="back" ${idx === 0 ? "disabled" : ""}>Back</button>
      <button class="primary" id="next">Continue</button>
      <span class="spacer"></span>
      <span class="hint">Press Enter to continue</span>
    </div>`;

  const input = document.getElementById("input");
  if (input) {
    input.focus();
    const untouched = step.type === "sw"
      ? !(state.software[step.row] && step.part in state.software[step.row])
      : !(step.id in state.v);
    if (untouched && input.value) {
      input.select();
    } else if (input.type === "text") {
      input.setSelectionRange(input.value.length, input.value.length);
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); next(); } });
  }

  card.querySelectorAll('.choice input').forEach((box) => {
    box.addEventListener("change", () => {
      const list = state[step.bind];
      const order = step.options.map((o) => o.key);
      const set = new Set(list);
      box.checked ? set.add(box.value) : set.delete(box.value);
      state[step.bind] = order.filter((k) => set.has(k));
      box.closest(".choice").classList.toggle("on", box.checked);
    });
  });

  card.classList.remove("in"); void card.offsetWidth; card.classList.add("in");

  document.getElementById("next").onclick = next;
  document.getElementById("back").onclick = back;
}

function commit() {
  const step = steps[idx];
  if (step.type === "multi" || step.type === "review") return true;
  const input = document.getElementById("input");
  const val = input ? input.value.trim() : "";
  if (step.required && !val) { toast("This one is required."); input.focus(); return false; }
  setVal(step, val);
  return true;
}

function next() { if (commit() && idx < steps.length - 1) { idx++; render(); } }
function back() { if (idx > 0) { commit(); idx--; render(); } }

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "BUTTON") next();
  if (e.altKey && e.key === "ArrowLeft") back();
});

/* ---------------------------------------------------------------- review */
function label(id) {
  const found = buildSteps().find((s) => s.id === id);
  return found ? found.q : id;
}

function renderReview() {
  const rows = (title, entries) => `
    <div class="group">
      <h3>${title}</h3>
      <div class="kv">
        ${entries.map(([k, v, jump]) => `
          <div class="k">${k}</div>
          <div class="v ${v ? "" : "empty"}">${v || "not recorded"}</div>
          <button class="edit" data-jump="${jump}">Edit</button>`).join("")}
      </div>
    </div>`;

  const emp = [
    ["Employee name", state.v.employee_name, "employee_name"],
    ["Employee ID", state.v.employee_id, "employee_id"],
    ["Department", state.v.department, "department"],
    ["Job title", state.v.job_title, "job_title"],
    ["Reporting manager", state.v.reporting_manager, "reporting_manager"],
    ["Work location", state.v.work_location, "work_location"],
    ["Start date", state.v.start_date, "start_date"],
    ["Issue date", state.v.issue_date, "issue_date"],
    ["Return / review date", state.v.return_review_date, "return_review_date"]
  ];

  const eq = state.equipment.map((key) => {
    const item = EQUIPMENT.find((e) => e.key === key);
    const name = item.custom ? (state.v[`eq_${key}_item`] || item.label) : item.label;
    const bits = [state.v[`eq_${key}_make`], state.v[`eq_${key}_serial`], state.v[`eq_${key}_asset`], state.v[`eq_${key}_condition`]].filter(Boolean);
    return [name, bits.join(" · "), `eq_${key}_make`];
  });
  eq.push(["MAC address", state.v.mac_address, "mac_address"]);

  const sw = state.software.filter((r) => r.account).map((r, i) =>
    [r.account, [r.license, r.date, r.notes].filter(Boolean).join(" · "), `sw_${i}_account`]);

  const acc = state.accessories.map((key) => {
    const item = ACCESSORIES.find((a) => a.key === key);
    const name = item.custom ? (state.v.acc_other_item || item.label) : item.label;
    return [name, state.v[`acc_${key}_qty`] || "1", `acc_${key}_qty`];
  });

  const sig = [
    ["Employee print name", state.v.sig_employee_print_name || state.v.employee_name, "sig_employee_print_name"],
    ["Employee date", state.v.sig_employee_date, "sig_employee_date"],
    ["IT representative", state.v.sig_it_rep_print_name, "sig_it_rep_print_name"],
    ["IT rep date", state.v.sig_it_rep_date, "sig_it_rep_date"]
  ];

  const notes = [1, 2, 3, 4].map((i) => [`Line ${i}`, state.v[`notes_line_${i}`], `notes_line_${i}`])
    .filter(([, v], i) => v || i === 0);

  card.className = "card review";
  card.innerHTML = `
    <p class="eyebrow"><span>06 &mdash; Review</span><span>Final</span></p>
    <h2>Check the record, then build the documents</h2>
    <div class="rule"></div>
    ${rows("Employee", emp)}
    ${eq.length ? rows("Equipment", eq) : ""}
    ${sw.length ? rows("Software and accounts", sw) : ""}
    ${acc.length ? rows("Accessories", acc) : ""}
    ${rows("Signatures", sig)}
    ${rows("Notes", notes)}
    <div class="group">
      <h3>Build</h3>
      <div class="outputs">
        <div class="out">
          <div><strong>IT Asset Acknowledgement</strong><span>Form SG-IT-014, filled and still editable. Print and sign.</span></div>
          <button class="primary" id="mkpdf">Download PDF</button>
        </div>
        <div class="out">
          <div><strong>Asset spreadsheet row</strong><span>Asset tag, serial, MAC, user, model, issue date — tab separated, pastes straight in.</span></div>
          <button class="ghost" id="mkrow">Copy row</button>
        </div>
        <div class="out">
          <div><strong>Setup checklist</strong><span>The 20-step build sheet with this machine's details already at the top.</span></div>
          <button class="ghost" id="mkcheck">Download</button>
        </div>
        <div class="out">
          <div><strong>Saved record</strong><span>A .json you can reload here later to reprint or amend.</span></div>
          <button class="ghost" id="mkjson">Save</button>
          <button class="ghost" id="ldjson">Load</button>
        </div>
      </div>
    </div>
    <div class="actions">
      <button class="ghost" id="back">Back</button>
      <span class="spacer"></span>
      <button class="ghost" id="restart">Start another machine</button>
    </div>`;

  card.querySelectorAll("[data-jump]").forEach((b) => {
    b.onclick = () => {
      const target = steps.findIndex((s) => s.id === b.dataset.jump);
      if (target > -1) { idx = target; card.className = "card"; render(); }
    };
  });

  document.getElementById("back").onclick = () => { idx--; card.className = "card"; render(); };
  document.getElementById("mkpdf").onclick = buildPdf;
  document.getElementById("mkrow").onclick = copyRow;
  document.getElementById("mkcheck").onclick = buildChecklist;
  document.getElementById("mkjson").onclick = saveJson;
  document.getElementById("ldjson").onclick = loadJson;
  document.getElementById("restart").onclick = () => {
    if (!confirm("Clear this record and start a new machine?")) return;
    state.v = { issue_date: today }; state.equipment = []; state.accessories = []; state.software = [{}];
    idx = 0; card.className = "card"; render();
  };
}

/* --------------------------------------------------------------- outputs */
async function templateBytes() {
  if (!Vault.isOpen()) {
    Vault.openModal();
    throw new Error("the vault is locked — unlock it and try again");
  }
  return (await Vault.decryptAsset(TEMPLATE_URL)).bytes;
}

function download(bytes, filename, mime) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function primaryAsset() {
  for (const key of state.equipment) {
    const tag = state.v[`eq_${key}_asset`];
    if (tag) return { tag, serial: state.v[`eq_${key}_serial`] || "", model: state.v[`eq_${key}_make`] || "" };
  }
  return { tag: "", serial: "", model: "" };
}

function safeName() {
  const a = primaryAsset().tag || state.v.employee_name || "record";
  return String(a).replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-|-$/g, "");
}

async function buildPdf() {
  try {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(await templateBytes());
    const form = doc.getForm();

    const put = (name, val) => {
      if (!val) return;
      try { form.getTextField(name).setText(String(val)); } catch (e) { console.warn("no field", name); }
    };
    const pick = (name, val) => {
      if (!val) return;
      try { form.getDropdown(name).select(String(val)); } catch (e) { console.warn("no dropdown", name); }
    };

    ["employee_name", "employee_id", "department", "job_title", "reporting_manager",
     "work_location", "start_date", "issue_date", "return_review_date"].forEach((k) => put(k, state.v[k]));

    state.equipment.forEach((key) => {
      put(`eq_${key}_item`, state.v[`eq_${key}_item`]);
      put(`eq_${key}_make`, state.v[`eq_${key}_make`]);
      put(`eq_${key}_serial`, state.v[`eq_${key}_serial`]);
      put(`eq_${key}_asset`, state.v[`eq_${key}_asset`]);
      pick(`eq_${key}_condition`, state.v[`eq_${key}_condition`]);
    });

    state.software.filter((r) => r.account).slice(0, 5).forEach((r, i) => {
      put(`sw_${i + 1}_account`, r.account);
      put(`sw_${i + 1}_license`, r.license);
      put(`sw_${i + 1}_date`, r.date);
      put(`sw_${i + 1}_notes`, r.notes);
    });

    state.accessories.forEach((key) => {
      put(`acc_${key}_qty`, state.v[`acc_${key}_qty`] || "1");
    });
    put("acc_other_item", state.v.acc_other_item);

    put("sig_employee_print_name", state.v.sig_employee_print_name || state.v.employee_name);
    put("sig_employee_date", state.v.sig_employee_date);
    put("sig_it_rep_print_name", state.v.sig_it_rep_print_name);
    put("sig_it_rep_date", state.v.sig_it_rep_date);

    [1, 2, 3, 4].forEach((i) => put(`notes_line_${i}`, state.v[`notes_line_${i}`]));

    form.updateFieldAppearances();
    const bytes = await doc.save();
    download(bytes, `SG-IT-014_${safeName()}_${state.v.issue_date || today}.pdf`, "application/pdf");
    toast("Acknowledgement built.");
  } catch (err) {
    console.error(err);
    alert("Could not build the PDF: " + err.message);
  }
}

function copyRow() {
  const a = primaryAsset();
  const row = [a.tag, a.serial, state.v.mac_address || "", state.v.employee_name || "",
               a.model, state.v.issue_date || today].join("\t");
  navigator.clipboard.writeText(row)
    .then(() => toast("Row copied. Paste into the asset sheet."))
    .catch(() => { prompt("Copy this row:", row); });
}

async function buildChecklist() {
  const a = primaryAsset();
  if (!Vault.isOpen()) { Vault.openModal(); return; }
  let source;
  try {
    source = new TextDecoder().decode((await Vault.decryptAsset(CHECKLIST_URL)).bytes);
  } catch (err) {
    alert("Checklist template could not be loaded: " + err.message);
    return;
  }
  let html = source
    .replace('id="f_asset" type="text" class="fill"', `id="f_asset" type="text" class="fill" value="${a.tag}"`)
    .replace('id="f_user" type="text" class="fill"', `id="f_user" type="text" class="fill" value="${state.v.employee_name || ""}"`)
    .replace('id="f_serial" type="text" class="fill"', `id="f_serial" type="text" class="fill" value="${a.serial}"`)
    .replace('id="f_mac" type="text" class="fill"', `id="f_mac" type="text" class="fill" value="${state.v.mac_address || ""}"`)
    .replace('id="f_tech" type="text" class="fill"', `id="f_tech" type="text" class="fill" value="${state.v.sig_it_rep_print_name || ""}"`)
    .replace('id="f_date" type="text" class="fill"', `id="f_date" type="text" class="fill" value="${state.v.issue_date || today}"`);
  const open = typeof Vault !== "undefined" && Vault.isOpen();
  html = html
    .replace(/\{\{BUILD_PASSWORD\}\}/g,  open ? Vault.get("build_password")  : "(ask IT)")
    .replace(/\{\{SECURITY_ANSWER\}\}/g, open ? Vault.get("security_answer") : "(ask IT)")
    .replace(/\{\{ADMIN_ACCOUNT\}\}/g,   open ? Vault.get("admin_account")   : "(ask IT)");

  download(new Blob([html], { type: "text/html" }), `setup-checklist_${safeName()}.html`);
  toast(open ? "Checklist built with build secrets." : "Checklist built — secrets left blank.");
}

function saveJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  download(blob, `SG-IT-014_${safeName()}.json`);
  toast("Record saved.");
}

function loadJson() {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "application/json,.json";
  picker.onchange = () => {
    const file = picker.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const loaded = JSON.parse(reader.result);
        state.v = loaded.v || {};
        state.equipment = loaded.equipment || [];
        state.accessories = loaded.accessories || [];
        state.software = loaded.software && loaded.software.length ? loaded.software : [{}];
        idx = 0; card.className = "card"; render();
        toast("Record loaded.");
      } catch (e) { alert("That file could not be read as a saved record."); }
    };
    reader.readAsText(file);
  };
  picker.click();
}

document.addEventListener("DOMContentLoaded", render);
