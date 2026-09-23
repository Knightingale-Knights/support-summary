const {
  getParticipant,
  getParticipantName,
  getParticipantSetting,
  getSupportType,
  getRecentProgressNotes
} = require("../lib/bubble");
const { draftSummaryContent } = require("../lib/claude");
const { buildSupportSummaryPptx } = require("../lib/pptx");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { participant_id, months_back } = req.body || {};
  if (!participant_id) {
    res.status(400).json({ error: "participant_id is required" });
    return;
  }

  try {
    const participant = await getParticipant(participant_id);
    const notes = await getRecentProgressNotes(participant_id, months_back || 1);

    if (notes.length === 0) {
      res.status(422).json({ error: "No progress notes found in that period" });
      return;
    }

    const participantName = getParticipantName(participant);
    const setting = getParticipantSetting(participant);
    const supportType = await getSupportType(participant);

    const content = await draftSummaryContent({
      participantName,
      supportType,
      setting,
      notes
    });

    const firstDate = new Date(notes[0].date).toLocaleDateString("en-AU");
    const lastDate = new Date(notes[notes.length - 1].date).toLocaleDateString("en-AU");
    const reportPeriod = `${firstDate} - ${lastDate}`;

    const base64 = await buildSupportSummaryPptx({
      participantName,
      reportPeriod,
      content
    });

    res.status(200).json({
      participant_id,
      participant_name: participantName,
      report_period: reportPeriod,
      session_count: notes.length,
      filename: `${participantName.replace(/\s+/g, "_")}_Supports_Summary.pptx`,
      file_base64: base64
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
