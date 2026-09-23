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

async function getRecentProgressNotes(participantId, monthsBack = 1) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);
  const cutoffMs = cutoff.getTime();

  const constraints = [
    {
      key: FIELDS.noteParticipantField,
      constraint_type: "equals",
      value: participantId
    },
    {
      key: FIELDS.noteDateField,
      constraint_type: "greater than",
      value: cutoffMs
    }
  ];

  const url =
    `${process.env.BUBBLE_APP_URL}/api/1.1/obj/${encodeURIComponent(FIELDS.noteType)}` +
    `?constraints=${encodeURIComponent(JSON.stringify(constraints))}` +
    `&sort_field=${encodeURIComponent(FIELDS.noteDateField)}&descending=false&limit=200`;

  const res = await fetch(url, { headers: bubbleHeaders() });
  if (!res.ok) {
    throw new Error(`Bubble progress notes fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();

  return (data.response.results || []).map((n) => ({
    date: n[FIELDS.noteDateField],
    summary: n[FIELDS.noteTextField]
  }));
}

module.exports = {
  getParticipant,
  getParticipantName,
  getParticipantSetting,
  getSupportType,
  getRecentProgressNotes,
  FIELDS
};
