// Adjust these to match your actual Bubble field names if they differ.
const FIELDS = {
  noteType: "Progress Note",
  noteParticipantField: "participant",
  noteTextField: "summary",
  noteDateField: "date",

  userType: "user",
  firstNameField: "first name",
  currentLocationField: "current location",

  ndisField: "ndis",
  ndisType: "Ndis",
  // ADJUST: confirm the actual field name on the Ndis type that holds
  // the support category / type text.
  ndisSupportTypeField: "support type"
};

function bubbleHeaders() {
  return {
    Authorization: `Bearer ${process.env.BUBBLE_API_TOKEN}`,
    "Content-Type": "application/json"
  };
}

async function getParticipant(participantId) {
  const url = `${process.env.BUBBLE_APP_URL}/api/1.1/obj/${FIELDS.userType}/${participantId}`;
  const res = await fetch(url, { headers: bubbleHeaders() });
  if (!res.ok) {
    throw new Error(`Bubble participant fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.response;
}

function getParticipantName(participant) {
  return participant[FIELDS.firstNameField] || "Participant";
}

function getParticipantSetting(participant) {
  const location = participant[FIELDS.currentLocationField];
  if (!location) return "";
  if (typeof location === "string") return location;
  return location.address || "";
}

async function getSupportType(participant) {
  const ndisId = participant[FIELDS.ndisField];
  if (!ndisId) return "";
  const url = `${process.env.BUBBLE_APP_URL}/api/1.1/obj/${encodeURIComponent(FIELDS.ndisType)}/${ndisId}`;
  const res = await fetch(url, { headers: bubbleHeaders() });
  if (!res.ok) return "";
  const data = await res.json();
  return data.response[FIELDS.ndisSupportTypeField] || "";
}

// ---- Time zone helpers (Australia/Melbourne) ----
const TZ = "Australia/Melbourne";

// Offset (ms) of Melbourne vs UTC at a given instant (handles daylight saving).
function tzOffsetMs(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// UTC instant of midnight on the 1st of (year, monthIndex) in Melbourne.
function melbourneMonthStart(year, monthIndex) {
  const guess = Date.UTC(year, monthIndex, 1, 0, 0, 0);
  let t = guess - tzOffsetMs(new Date(guess));
  t = guess - tzOffsetMs(new Date(t)); // re-check across a DST boundary
  return new Date(t);
}

// Previous full calendar month in Melbourne. start inclusive, end exclusive.
function getPreviousMonthRange(now = new Date()) {
  const m = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric" })
    .formatToParts(now);
  const year = +m.find((x) => x.type === "year").value;
  const month = +m.find((x) => x.type === "month").value - 1; // 0-11
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  return {
    start: melbourneMonthStart(prevYear, prevMonth),
    end: melbourneMonthStart(year, month)
  };
}

// Fetches ALL notes in the range (paginated), oldest first.
// range = { start: Date, end?: Date }  (start inclusive, end exclusive)
async function getProgressNotes(participantId, range) {
  const constraints = [
    { key: FIELDS.noteParticipantField, constraint_type: "equals", value: participantId },
    { key: FIELDS.noteDateField, constraint_type: "greater than", value: range.start.getTime() - 1 }
  ];
  if (range.end) {
    constraints.push({ key: FIELDS.noteDateField, constraint_type: "less than", value: range.end.getTime() });
  }

  const base =
    `${process.env.BUBBLE_APP_URL}/api/1.1/obj/${encodeURIComponent(FIELDS.noteType)}` +
    `?constraints=${encodeURIComponent(JSON.stringify(constraints))}` +
    `&sort_field=${encodeURIComponent(FIELDS.noteDateField)}&descending=false&limit=100`;

  const out = [];
  let cursor = 0;
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${base}&cursor=${cursor}`, { headers: bubbleHeaders() });
    if (!res.ok) {
      throw new Error(`Bubble progress notes fetch failed: ${res.status} ${await res.text()}`);
    }
    const { response } = await res.json();
    for (const n of response.results || []) {
      out.push({ date: n[FIELDS.noteDateField], summary: n[FIELDS.noteTextField] });
    }
    if (!response.remaining) break;
    cursor += (response.results || []).length;
  }
  return out;
}

// Rolling window (kept for the button): last N months up to now.
async function getRecentProgressNotes(participantId, monthsBack = 1) {
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  return getProgressNotes(participantId, { start });
}

module.exports = {
  getParticipant,
  getParticipantName,
  getParticipantSetting,
  getSupportType,
  getRecentProgressNotes,
  getProgressNotes,
  getPreviousMonthRange,
  FIELDS
};
