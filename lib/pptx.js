const PptxGenJS = require("pptxgenjs");
const theme = require("./theme");

const SESSIONS_PER_SLIDE = 8;
const SLIDE_H = 5.63;

// All writing uses 1.5x line spacing.
const LS = { lineSpacingMultiple: 1.5 };

// px -> inches (96px per inch)
const px = (n) => n / 96;

const HEADER_ROW_H = px(20);
const BODY_ROW_H = px(40);

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function border(pt) {
  return pt === 0 ? { type: "none" } : { type: "solid", color: theme.colors.hairline, pt };
}

// Masthead used at the top of every slide: wordmark, small-caps eyebrow
// label, thin rule line beneath.
function addMasthead(slide, eyebrow) {
  slide.background = { color: theme.colors.white };

  slide.addText("knightingale", {
    x: 0.4,
    y: 0.3,
    w: 5,
    fontFace: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.forest,
    ...LS
  });

  slide.addText((eyebrow || "").toUpperCase(), {
    x: 5.5,
    y: 0.38,
    w: 4.1,
    align: "right",
    fontFace: theme.fonts.ui,
    fontSize: 9,
    charSpacing: 2,
    color: theme.colors.softGray,
    ...LS
  });

  slide.addShape("line", {
    x: 0.4,
    y: 0.85,
    w: 9.2,
    h: 0,
    line: { color: theme.colors.forest, width: 1 }
  });
}

function addTitleSlide(pres, { participantName, reportPeriod }) {
  const slide = pres.addSlide();
  addMasthead(slide, "Support Summary");

  slide.addText("Supports Summary", {
    x: 0.4,
    y: 1.6,
    w: 9.2,
    fontFace: theme.fonts.display,
    fontSize: 36,
    color: theme.colors.forest,
    ...LS
  });
  slide.addText(participantName, {
    x: 0.4,
    y: 2.5,
    w: 9.2,
    fontFace: theme.fonts.ui,
    fontSize: 20,
    color: theme.colors.bodyText,
    ...LS
  });
  if (reportPeriod) {
    slide.addText(reportPeriod, {
      x: 0.4,
      y: 3.05,
      w: 9.2,
      fontFace: theme.fonts.ui,
      fontSize: 12,
      color: theme.colors.mutedText,
      ...LS
    });
  }
}

function addOverviewSlide(pres, overview) {
  const slide = pres.addSlide();
  addMasthead(slide, "Overview");

  slide.addText("Overview", {
    x: 0.4,
    y: 1.1,
    fontFace: theme.fonts.display,
    fontSize: 24,
    color: theme.colors.forest,
    ...LS
  });
  slide.addText(overview || "", {
    x: 0.4,
    y: 1.8,
    w: 9.2,
    h: 3.3,
    fontFace: theme.fonts.ui,
    fontSize: 14,
    color: theme.colors.bodyText,
    valign: "top",
    ...LS
  });
}

function addSessionSlides(pres, sessions) {
  const groups = chunk(sessions, SESSIONS_PER_SLIDE);
  groups.forEach((group, idx) => {
    const slide = pres.addSlide();
    addMasthead(slide, groups.length > 1 ? `Session Log ${idx + 1}/${groups.length}` : "Session Log");

    const totalRows = 1 + group.length;
    const rowH = [HEADER_ROW_H, ...group.map(() => BODY_ROW_H)];

    const cellOpts = (rowIdx, colIdx) => ({
      fontFace: theme.fonts.ui,
      fontSize: rowIdx === 0 ? 11 : 10,
      bold: rowIdx === 0,
      color: rowIdx === 0 ? theme.colors.forest : theme.colors.bodyText,
      fill: { color: theme.colors.tableBg },
      valign: "middle",
      ...LS,
      border: [
        border(rowIdx === 0 ? 0.5 : 0), // top
        border(colIdx === 0 ? 1 : 0.5), // right
        border(rowIdx === 0 ? 1 : 0.5), // bottom
        border(colIdx === 0 ? 0.5 : 0) // left
      ]
    });

    const rows = [
      [
        { text: "Date", options: cellOpts(0, 0) },
        { text: "Summary", options: cellOpts(0, 1) }
      ]
    ];
    group.forEach((s, i) => {
      rows.push([
        { text: s.date || "", options: cellOpts(i + 1, 0) },
        { text: s.summary || "", options: cellOpts(i + 1, 1) }
      ]);
    });

    slide.addTable(rows, {
      x: 0.4,
      y: 1.1,
      w: 9.2,
      colW: [1.3, 7.9],
      rowH,
      autoPage: false
    });
  });
}

function addSummaryOfWorkSlides(pres, summaryOfWork) {
  (summaryOfWork || []).forEach((section) => {
    const slide = pres.addSlide();
    addMasthead(slide, "Summary of Work");

    slide.addText(section.heading || "", {
      x: 0.4,
      y: 1.1,
      w: 9.2,
      fontFace: theme.fonts.display,
      fontSize: 22,
      color: theme.colors.forest,
      ...LS
    });
    slide.addText(section.body || "", {
      x: 0.4,
      y: 1.9,
      w: 9.2,
      h: 3.2,
      fontFace: theme.fonts.ui,
      fontSize: 14,
      color: theme.colors.bodyText,
      valign: "top",
      ...LS
    });
  });
}

function addReflectionSlide(pres, workerReflection) {
  if (!workerReflection || !workerReflection.quote) return;
  const slide = pres.addSlide();
  addMasthead(slide, "Worker Reflection");

  slide.addText(`"${workerReflection.quote}"`, {
    x: 0.6,
    y: 1.7,
    w: 8.8,
    h: 2.4,
    fontFace: theme.fonts.display,
    fontSize: 20,
    italic: true,
    color: theme.colors.forest,
    valign: "middle",
    ...LS
  });
  if (workerReflection.author) {
    slide.addText(`— ${workerReflection.author}, Knightingale`, {
      x: 0.6,
      y: 4.1,
      w: 8.8,
      fontFace: theme.fonts.ui,
      fontSize: 12,
      color: theme.colors.mutedText,
      ...LS
    });
  }
}

function addObservationsSlide(pres, keyObservations, recommendations) {
  const slide = pres.addSlide();
  addMasthead(slide, "Observations & Recommendations");

  slide.addText("Observations & Recommendations", {
    x: 0.4,
    y: 1.1,
    w: 9.2,
    fontFace: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.forest,
    ...LS
  });

  slide.addText("Key Observations", {
    x: 0.4,
    y: 1.85,
    w: 4.2,
    fontFace: theme.fonts.ui,
    fontSize: 13,
    bold: true,
    color: theme.colors.forest,
    ...LS
  });
  slide.addText((keyObservations || []).map((t) => ({ text: t, options: { bullet: true, ...LS } })), {
    x: 0.4,
    y: 2.3,
    w: 4.2,
    h: 2.9,
    fontFace: theme.fonts.ui,
    fontSize: 11,
    color: theme.colors.bodyText,
    valign: "top"
  });

  slide.addText("Recommendations", {
    x: 5.1,
    y: 1.85,
    w: 4.2,
    fontFace: theme.fonts.ui,
    fontSize: 13,
    bold: true,
    color: theme.colors.forest,
    ...LS
  });
  slide.addText((recommendations || []).map((t) => ({ text: t, options: { bullet: true, ...LS } })), {
    x: 5.1,
    y: 2.3,
    w: 4.2,
    h: 2.9,
    fontFace: theme.fonts.ui,
    fontSize: 11,
    color: theme.colors.bodyText,
    valign: "top"
  });
}

async function buildSupportSummaryPptx({ participantName, reportPeriod, content }) {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: "WIDE", width: 10, height: SLIDE_H });
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
