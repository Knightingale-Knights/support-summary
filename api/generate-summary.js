const {
  getParticipant,
  getParticipantName,
  getParticipantSetting,
  getSupportType,
  getRecentProgressNotes,
  getProgressNotes,
  getPreviousMonthRange
} = require("../lib/bubble");
const { draftSummaryContent } = require("../lib/claude");
const { buildSupportSummaryPptx } = require("../lib/pptx");
const { buildSupportSummaryPdf } = require("../lib/pdf");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { participant_id, months_back, period, format } = req.body || {};
  const asPdf = String(format || "").toLowerCase() === "pdf";
  if (!participant_id) {
    res.status(400).json({ error: "participant_id is required" });
    return;
  }

  try {
    const participant = await getParticipant(participant_id);
    const notes =
      period === "previous_month"
        ? await getProgressNotes(participant_id, getPreviousMonthRange())
        : await getRecentProgressNotes(participant_id, months_back || 1);

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

    const build = asPdf ? buildSupportSummaryPdf : buildSupportSummaryPptx;
    const base64 = await build({
      participantName,
      reportPeriod,
      content
    });

    res.status(200).json({
      participant_id,
      participant_name: participantName,
      report_period: reportPeriod,
      session_count: notes.length,
      format: asPdf ? "pdf" : "pptx",
      mime_type: asPdf
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      filename: `${participantName.replace(/\s+/g, "_")}_Supports_Summary.${asPdf ? "pdf" : "pptx"}`,
      file_base64: base64
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
