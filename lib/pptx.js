const PptxGenJS = require("pptxgenjs");
const theme = require("./theme");

const SESSIONS_PER_SLIDE = 8;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Masthead used at the top of every slide: wordmark, small-caps eyebrow
// label, thin rule line beneath — mirrors the invoice email header.
function addMasthead(slide, eyebrow) {
  slide.background = { color: theme.colors.white };

  slide.addText("knightingale", {
    x: 0.4,
    y: 0.3,
    w: 5,
    fontFace: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.navy
  });

  slide.addText((eyebrow || "").toUpperCase(), {
    x: 5.5,
    y: 0.38,
    w: 4.1,
    align: "right",
    fontFace: theme.fonts.ui,
    fontSize: 9,
    charSpacing: 2,
    color: theme.colors.softGray
  });

  slide.addShape("line", {
    x: 0.4,
    y: 0.85,
    w: 9.2,
    h: 0,
    line: { color: theme.colors.navy, width: 1 }
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
    color: theme.colors.navy
  });
  slide.addText(participantName, {
    x: 0.4,
    y: 2.5,
    w: 9.2,
    fontFace: theme.fonts.ui,
    fontSize: 20,
    color: theme.colors.bodyText
  });
  if (reportPeriod) {
    slide.addText(reportPeriod, {
      x: 0.4,
      y: 3.05,
      w: 9.2,
      fontFace: theme.fonts.ui,
      fontSize: 12,
      color: theme.colors.mutedText
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
    color: theme.colors.navy
  });
  slide.addText(overview || "", {
    x: 0.4,
    y: 1.8,
    w: 9.2,
    h: 3.5,
    fontFace: theme.fonts.ui,
    fontSize: 14,
    color: theme.colors.bodyText,
    valign: "top"
  });
}

function addSessionSlides(pres, sessions) {
  const groups = chunk(sessions, SESSIONS_PER_SLIDE);
  groups.forEach((group, idx) => {
    const slide = pres.addSlide();
    addMasthead(slide, groups.length > 1 ? `Session Log ${idx + 1}/${groups.length}` : "Session Log");

    slide.addText("Session Log", {
      x: 0.4,
      y: 1.1,
      fontFace: theme.fonts.display,
      fontSize: 22,
      color: theme.colors.navy
    });

    const rows = [
      [
        { text: "Date", options: { bold: true, color: theme.colors.navy, fill: { color: theme.colors.cream } } },
        { text: "Summary", options: { bold: true, color: theme.colors.navy, fill: { color: theme.colors.cream } } }
      ]
    ];
    group.forEach((s) => {
      rows.push([s.date || "", s.summary || ""]);
    });

    slide.addTable(rows, {
      x: 0.4,
      y: 1.7,
      w: 9.2,
      fontFace: theme.fonts.ui,
      fontSize: 10,
      color: theme.colors.bodyText,
      colW: [1.3, 7.9],
      border: { type: "solid", color: theme.colors.hairline, pt: 0.5 },
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
      color: theme.colors.navy
    });
    slide.addText(section.body || "", {
      x: 0.4,
      y: 1.9,
      w: 9.2,
      h: 3.4,
      fontFace: theme.fonts.ui,
      fontSize: 14,
      color: theme.colors.bodyText,
      valign: "top"
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
    h: 2.6,
    fontFace: theme.fonts.display,
    fontSize: 20,
    italic: true,
    color: theme.colors.navy,
    valign: "middle"
  });
  if (workerReflection.author) {
    slide.addText(`— ${workerReflection.author}, Knightingale`, {
      x: 0.6,
      y: 4.2,
      w: 8.8,
      fontFace: theme.fonts.ui,
      fontSize: 12,
      color: theme.colors.mutedText
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
    color: theme.colors.navy
  });

  slide.addText("Key Observations", {
    x: 0.4,
    y: 1.85,
    w: 4.2,
    fontFace: theme.fonts.ui,
    fontSize: 13,
    bold: true,
    color: theme.colors.navy
  });
  slide.addText((keyObservations || []).map((t) => ({ text: t, options: { bullet: true } })), {
    x: 0.4,
    y: 2.3,
    w: 4.2,
    h: 3.2,
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
    color: theme.colors.navy
  });
  slide.addText((recommendations || []).map((t) => ({ text: t, options: { bullet: true } })), {
    x: 5.1,
    y: 2.3,
    w: 4.2,
    h: 3.2,
    fontFace: theme.fonts.ui,
    fontSize: 11,
    color: theme.colors.bodyText,
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
