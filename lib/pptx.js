const PptxGenJS = require("pptxgenjs");
const theme = require("./theme");

const SESSIONS_PER_SLIDE = 8;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function addTitleSlide(pres, { participantName, reportPeriod }) {
  const slide = pres.addSlide();
  slide.background = { color: theme.colors.darkEucalypt };
  slide.addText("Knightingale", {
    x: 0.5,
    y: 0.4,
    fontFace: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.sand
  });
  slide.addText("Supports Summary", {
    x: 0.5,
    y: 2.2,
    w: 9,
    fontFace: theme.fonts.display,
    fontSize: 40,
    color: theme.colors.white
  });
  slide.addText(participantName, {
    x: 0.5,
    y: 3.1,
    w: 9,
    fontFace: theme.fonts.ui,
    fontSize: 24,
    color: theme.colors.gumleaf
  });
  if (reportPeriod) {
    slide.addText(reportPeriod, {
      x: 0.5,
      y: 3.7,
      w: 9,
      fontFace: theme.fonts.ui,
      fontSize: 14,
      color: theme.colors.sand
    });
  }
}

function addOverviewSlide(pres, overview) {
  const slide = pres.addSlide();
  slide.background = { color: theme.colors.sand };
  slide.addText("Overview", {
    x: 0.5,
    y: 0.4,
    fontFace: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.cherry
  });
  slide.addText(overview || "", {
    x: 0.5,
    y: 1.3,
    w: 9,
    h: 4,
    fontFace: theme.fonts.ui,
    fontSize: 16,
    color: theme.colors.charcoal,
    valign: "top"
  });
}

function addSessionSlides(pres, sessions) {
  const groups = chunk(sessions, SESSIONS_PER_SLIDE);
  groups.forEach((group, idx) => {
    const slide = pres.addSlide();
    slide.background = { color: theme.colors.white };
    slide.addText(
      groups.length > 1 ? `Session Log (${idx + 1}/${groups.length})` : "Session Log",
      {
        x: 0.5,
        y: 0.4,
        fontFace: theme.fonts.display,
        fontSize: 24,
        color: theme.colors.cherry
      }
    );

    const rows = [
      [
        { text: "Date", options: { bold: true, fill: { color: theme.colors.gumleaf } } },
        { text: "Summary", options: { bold: true, fill: { color: theme.colors.gumleaf } } }
      ]
    ];
    group.forEach((s) => {
      rows.push([s.date || "", s.summary || ""]);
    });

    slide.addTable(rows, {
      x: 0.5,
      y: 1.2,
      w: 9,
      fontFace: theme.fonts.ui,
      fontSize: 11,
      color: theme.colors.charcoal,
      colW: [1.3, 7.7],
      autoPage: false
    });
  });
}

function addSummaryOfWorkSlides(pres, summaryOfWork) {
  (summaryOfWork || []).forEach((section) => {
    const slide = pres.addSlide();
    slide.background = { color: theme.colors.sand };
    slide.addText(section.heading || "", {
      x: 0.5,
      y: 0.5,
      w: 9,
      fontFace: theme.fonts.display,
      fontSize: 24,
      color: theme.colors.cherry
    });
    slide.addText(section.body || "", {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 3.8,
      fontFace: theme.fonts.ui,
      fontSize: 16,
      color: theme.colors.charcoal,
      valign: "top"
    });
  });
}

function addReflectionSlide(pres, workerReflection) {
  if (!workerReflection || !workerReflection.quote) return;
  const slide = pres.addSlide();
  slide.background = { color: theme.colors.pinkSalt };
  slide.addText(`"${workerReflection.quote}"`, {
    x: 0.7,
    y: 1.3,
    w: 8.6,
    h: 3,
    fontFace: theme.fonts.display,
    fontSize: 22,
    italic: true,
    color: theme.colors.darkEucalypt,
    valign: "middle"
  });
  if (workerReflection.author) {
    slide.addText(`— ${workerReflection.author}, Knightingale`, {
      x: 0.7,
      y: 4.3,
      w: 8.6,
      fontFace: theme.fonts.ui,
      fontSize: 14,
      color: theme.colors.charcoal
    });
  }
}

function addObservationsSlide(pres, keyObservations, recommendations) {
  const slide = pres.addSlide();
  slide.background = { color: theme.colors.white };
  slide.addText("Observations & Recommendations", {
    x: 0.5,
    y: 0.4,
    w: 9,
    fontFace: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.cherry
  });

  slide.addText("Key Observations", {
    x: 0.5,
    y: 1.2,
    w: 4.2,
    fontFace: theme.fonts.ui,
    fontSize: 16,
    bold: true,
    color: theme.colors.darkEucalypt
  });
  slide.addText((keyObservations || []).map((t) => ({ text: t, options: { bullet: true } })), {
    x: 0.5,
    y: 1.7,
    w: 4.2,
    h: 3.5,
    fontFace: theme.fonts.ui,
    fontSize: 12,
    color: theme.colors.charcoal,
    valign: "top"
  });

  slide.addText("Recommendations", {
    x: 5.1,
    y: 1.2,
    w: 4.2,
    fontFace: theme.fonts.ui,
    fontSize: 16,
    bold: true,
    color: theme.colors.darkEucalypt
  });
  slide.addText((recommendations || []).map((t) => ({ text: t, options: { bullet: true } })), {
    x: 5.1,
    y: 1.7,
    w: 4.2,
    h: 3.5,
    fontFace: theme.fonts.ui,
    fontSize: 12,
    color: theme.colors.charcoal,
    valign: "top"
  });
}

async function buildSupportSummaryPptx({ participantName, reportPeriod, content }) {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: "WIDE", width: 10, height: 5.63 });
  pres.layout = "WIDE";

  addTitleSlide(pres, { participantName, reportPeriod });
  addOverviewSlide(pres, content.overview);
  addSessionSlides(pres, content.sessions || []);
  addSummaryOfWorkSlides(pres, content.summaryOfWork || []);
  addReflectionSlide(pres, content.workerReflection);
  addObservationsSlide(pres, content.keyObservations, content.recommendations);

  return pres.write({ outputType: "base64" });
}

module.exports = { buildSupportSummaryPptx };
