const PdfPrinter = require("pdfmake");
const theme = require("./theme");

// Standard PDF fonts (no font files needed on Vercel).
// Times stands in for Georgia, Helvetica for Arial.
const FONTS = {
  Times: {
    normal: "Times-Roman",
    bold: "Times-Bold",
    italics: "Times-Italic",
    bolditalics: "Times-BoldItalic"
  },
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique"
  }
};

// Mobile layout: a narrow portrait page (9:16) that a phone scales to fit
// the screen width, with large type, one column and a continuous flow.
const PAGE_W = 360;
const PAGE_H = 640;
const MARGIN_X = 24;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const LINE_H = 1.45;

const c = (hex) => `#${hex}`;
const col = theme.colors;

function eyebrow(text, top = 0) {
  return {
    text: String(text || "").toUpperCase(),
    font: "Helvetica",
    fontSize: 8,
    bold: true,
    characterSpacing: 1.6,
    color: c(col.softGray),
    margin: [0, top, 0, 6]
  };
}

function heading(text, size = 21) {
  return {
    text: text || "",
    font: "Times",
    fontSize: size,
    color: c(col.forest),
    lineHeight: 1.2,
    margin: [0, 0, 0, 10]
  };
}

function paragraph(text) {
  return {
    text: text || "",
    font: "Helvetica",
    fontSize: 12,
    color: c(col.bodyText),
    lineHeight: LINE_H,
    margin: [0, 0, 0, 4]
  };
}

function rule(color = col.hairline, width = 0.75, top = 18, bottom = 0) {
  return {
    canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: width, lineColor: c(color) }],
    margin: [0, top, 0, bottom]
  };
}

function cover(participantName, reportPeriod) {
  return [
    { text: "Supports Summary", font: "Times", fontSize: 30, color: c(col.forest), lineHeight: 1.15, margin: [0, 8, 0, 8] },
    { text: participantName, font: "Helvetica", fontSize: 17, color: c(col.bodyText), margin: [0, 0, 0, 3] },
    reportPeriod
      ? { text: reportPeriod, font: "Helvetica", fontSize: 11, color: c(col.mutedText) }
      : {},
    rule(col.hairline, 0.75, 20, 6)
  ];
}

function overview(text) {
  return [eyebrow("Overview", 14), paragraph(text), rule()];
}

// One card per note: date on top, summary beneath, forest accent bar.
function sessionLog(sessions) {
  const list = sessions || [];
  if (!list.length) return [];
  return [
    eyebrow(`Session Log  (${list.length})`, 14),
    ...list.map((s) => ({
      unbreakable: true,
      margin: [0, 0, 0, 8],
      table: {
        widths: ["*"],
        body: [
          [
            {
              stack: [
                {
                  text: s.date || "",
                  font: "Helvetica",
                  bold: true,
                  fontSize: 11,
                  color: c(col.forest),
                  margin: [0, 0, 0, 3]
                },
                {
                  text: s.summary || "",
                  font: "Helvetica",
                  fontSize: 11.5,
                  color: c(col.bodyText),
                  lineHeight: LINE_H
                }
              ]
            }
          ]
        ]
      },
      layout: {
        fillColor: () => c(col.tableBg),
        hLineWidth: (i, node) => (i === node.table.body.length ? 0.75 : 0),
        vLineWidth: (i) => (i === 0 ? 2.5 : 0),
        hLineColor: () => c(col.hairline),
        vLineColor: () => c(col.forest),
        paddingLeft: () => 12,
        paddingRight: () => 12,
        paddingTop: () => 10,
        paddingBottom: () => 10
      }
    })),
    rule(col.hairline, 0.75, 10, 0)
  ];
}

function summaryOfWork(sections) {
  const list = sections || [];
  if (!list.length) return [];
  return [
    eyebrow("Summary of Work", 14),
    ...list.map((s) => ({
      unbreakable: true,
      stack: [heading(s.heading, 17), paragraph(s.body)],
      margin: [0, 0, 0, 12]
    })),
    rule(col.hairline, 0.75, 0, 0)
  ];
}

function bullets(title, items) {
  const list = items || [];
  if (!list.length) return [];
  return [
    eyebrow(title, 14),
    ...list.map((t) => ({
      unbreakable: true,
      margin: [0, 0, 0, 7],
      columns: [
        {
          width: 14,
          canvas: [{ type: "ellipse", x: 3, y: 9, r1: 2.4, r2: 2.4, color: c(col.forest) }]
        },
        { width: "*", text: t, font: "Helvetica", fontSize: 12, color: c(col.bodyText), lineHeight: LINE_H }
      ]
    }))
  ];
}

async function buildSupportSummaryPdf({ participantName, reportPeriod, content }) {
  const body = [
    ...cover(participantName, reportPeriod),
    ...overview(content.overview),
    ...sessionLog(content.sessions),
    ...summaryOfWork(content.summaryOfWork),
    ...bullets("Key Observations", content.keyObservations),
    ...(content.keyObservations && content.keyObservations.length && content.recommendations && content.recommendations.length
      ? [rule(col.hairline, 0.75, 8, 0)]
      : []),
    ...bullets("Recommendations", content.recommendations)
  ];

  const docDefinition = {
    pageSize: { width: PAGE_W, height: PAGE_H },
    pageMargins: [MARGIN_X, 62, MARGIN_X, 38],
    info: { title: `Supports Summary - ${participantName}`, author: "Knightingale" },
    defaultStyle: { font: "Helvetica" },
    header: () => ({
      margin: [MARGIN_X, 22, MARGIN_X, 0],
      stack: [
        {
          columns: [
            { text: "knightingale", font: "Times", fontSize: 18, color: c(col.forest), width: "*" },
            {
              text: "SUPPORT SUMMARY",
              font: "Helvetica",
              fontSize: 7,
              characterSpacing: 1.4,
              color: c(col.softGray),
              alignment: "right",
              width: "auto",
              margin: [0, 7, 0, 0]
            }
          ]
        },
        {
          canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 1, lineColor: c(col.forest) }],
          margin: [0, 7, 0, 0]
        }
      ]
    }),
    footer: (currentPage, pageCount) => ({
      margin: [MARGIN_X, 14, MARGIN_X, 0],
      text: `${participantName}   ·   ${currentPage} / ${pageCount}`,
      font: "Helvetica",
      fontSize: 8,
      color: c(col.softGray),
      alignment: "center"
    }),
    content: body
  };

  const printer = new PdfPrinter(FONTS);
  const doc = printer.createPdfKitDocument(docDefinition);

  const chunks = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);
    doc.end();
  });
}

module.exports = { buildSupportSummaryPdf };
