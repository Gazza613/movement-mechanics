/* ==========================================================================
   MOVEMENT MECHANICS - Careers / job board
   ==========================================================================
   HOW TO POST OR REMOVE A JOB YOURSELF (no coding required):

   1. Make a copy of this Google Sheet template (or any sheet with these
      exact column headers in row 1): Title | Type | Location | Blurb | Active
        e.g. Title: "Sports Science Intern"
             Type: "Internship · 6 months"
             Location: "Cape Town - Newlands base + mobile unit travel"
             Blurb: "Support testing days, data capture and reporting."
             Active: "yes"   (set to "no" to hide a role without deleting it)

   2. In Google Sheets: File > Share > Publish to web > choose the sheet >
      format "Comma-separated values (.csv)" > Publish > copy the link.

   3. Paste that link as MM_CAREERS_SHEET_CSV_URL below, between the quotes.

   That's it - every time you edit the sheet and it re-publishes (Google does
   this automatically every few minutes), the careers page updates itself.
   No need to touch this file again after the first setup.

   If you'd rather not use Google Sheets, just edit the MM_JOBS_FALLBACK
   array below directly instead, following the same format.
   ========================================================================== */

window.MM_CAREERS_SHEET_CSV_URL = ""; // <-- paste your published Google Sheet CSV link here

window.MM_JOBS_FALLBACK = [
  // Uncomment and edit to add a role manually (remove the leading "// " from each line):
  // {
  //   title: "Sports Science Intern",
  //   type: "Internship",
  //   location: "Cape Town - Newlands base + mobile unit travel",
  //   blurb: "Support testing days, data capture and reporting across schools and clubs.",
  //   active: "yes"
  // }
];

function mmSplitCSVLine(line) {
  var out = [], cur = "", inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === "," && !inQuotes) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

function mmParseCSV(text) {
  var lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  var headers = mmSplitCSVLine(lines[0]).map(function (h) { return h.trim().toLowerCase(); });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    var cells = mmSplitCSVLine(lines[i]);
    var row = {};
    headers.forEach(function (h, idx) { row[h] = (cells[idx] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function mmEscapeHTML(str) {
  return String(str || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function mmRenderJobs(jobs) {
  var wrap = document.getElementById("jobsList");
  var emptyState = document.getElementById("jobsEmpty");
  var loading = document.getElementById("jobsLoading");
  if (loading) loading.style.display = "none";
  if (!wrap) return;

  var active = (jobs || []).filter(function (j) {
    return !j.active || String(j.active).toLowerCase() !== "no";
  }).filter(function (j) { return j.title; });

  if (!active.length) {
    if (emptyState) emptyState.style.display = "block";
    wrap.innerHTML = "";
    return;
  }
  if (emptyState) emptyState.style.display = "none";

  wrap.innerHTML = active.map(function (j) {
    var title = mmEscapeHTML(j.title);
    var type = mmEscapeHTML(j.type || "Opportunity");
    var location = mmEscapeHTML(j.location || "Cape Town");
    var blurb = mmEscapeHTML(j.blurb || "");
    var applyHref = "careers.html?role=" + encodeURIComponent(j.title) + "#apply";
    return (
      '<div class="card job-card" data-tilt data-reveal>' +
        '<div class="job-card-top"><h3>' + title + '</h3><span class="pill">' + type + '</span></div>' +
        '<p style="font-size:0.85rem; color:var(--grey-dim); margin:10px 0 14px;">' + location + '</p>' +
        '<p style="font-size:0.92rem;">' + blurb + '</p>' +
        '<a href="' + applyHref + '" class="btn btn-outline btn-sm" style="margin-top:22px;">Apply For This Role</a>' +
      '</div>'
    );
  }).join("");

  if (window.initReveal) window.initReveal();
}

async function mmInitJobs() {
  var wrap = document.getElementById("jobsList");
  if (!wrap) return;
  var url = window.MM_CAREERS_SHEET_CSV_URL;
  if (url) {
    try {
      var res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        var text = await res.text();
        mmRenderJobs(mmParseCSV(text));
        return;
      }
    } catch (e) {
      console.warn("Movement Mechanics: could not load the careers sheet, showing fallback list.", e);
    }
  }
  mmRenderJobs(window.MM_JOBS_FALLBACK || []);
}

document.addEventListener("DOMContentLoaded", mmInitJobs);

/* ---- Pre-fill the "role" field from ?role= in the URL (from an Apply button) ---- */
document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("careersForm");
  if (!form) return;
  var params = new URLSearchParams(window.location.search);
  var role = params.get("role");
  var roleField = document.getElementById("roleInterest");
  if (role && roleField) roleField.value = role;

  var success = document.getElementById("careersSuccess");
  if (params.get("sent") === "1" && success) {
    success.classList.add("show");
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

/* ---- CV upload: show the chosen filename + basic client-side checks (server still validates) ---- */
document.addEventListener("DOMContentLoaded", function () {
  var cvInput = document.getElementById("cv");
  var cvName = document.querySelector("[data-file-name]");
  if (!cvInput || !cvName) return;

  var MAX_BYTES = 4 * 1024 * 1024; // 4MB (matches the /api/careers.js server-side cap)
  var ALLOWED_EXT = ["pdf", "doc", "docx"];

  cvInput.addEventListener("change", function () {
    var file = cvInput.files && cvInput.files[0];
    if (!file) {
      cvName.textContent = "No file chosen";
      return;
    }
    var ext = file.name.split(".").pop().toLowerCase();
    if (ALLOWED_EXT.indexOf(ext) === -1) {
      alert("Please attach a PDF or Word document (.pdf, .doc, .docx).");
      cvInput.value = "";
      cvName.textContent = "No file chosen";
      return;
    }
    if (file.size > MAX_BYTES) {
      alert("That file is over 4MB - please attach a smaller file.");
      cvInput.value = "";
      cvName.textContent = "No file chosen";
      return;
    }
    cvName.textContent = file.name;
  });
});
