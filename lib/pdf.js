const PdfPrinter = require("pdfmake");
const PDFDocument = require("@foliojs-fork/pdfkit");
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

// Same 16:9 slide proportions as the PowerPoint (10in x 5.63in) in points.
const PAGE_W = 720;
const PAGE_H = 405;
const MARGIN_X = 29; // 0.4in
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const SESSIONS_PER_PAGE = 8;
const LINE_H = 1.5;
const HEADER_ROW_H = 15; // 20px
const BODY_ROW_H = 30; // 40px
const DATE_COL_W = 94; // 1.3in

const c = (hex) => `#${hex}`;
const measureDoc = new PDFDocument();

function textWidth(text, size, bold) {
  measureDoc.font(bold ? "Helvetica-Bold" : "Helvetica");
  return measureDoc.fontSize(size).widthOfString(text);
}

// Greedy word-wrap line count at a given font size and width.
function countLines(text, size, width, bold) {
  const paragraphs = String(text || "").split(/\n/);
  let lines = 0;
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines += 1;
      continue;
    }
    let line = "";
    let n = 1;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (textWidth(test, size, bold) > width && line) {
        n += 1;
        line = w;
      } else {
        line = test;
      }
    }
    lines += n;
  }
  return lines;
}

// Largest font size (max down to min) at which the texts fit in maxH.
function fitFontSize(texts, width, maxH, max, min, gap = 0) {
  for (let size = max; size >= min; size -= 0.5) {
    const h = texts.reduce((sum, t) => sum + countLines(t, size, width) * size * LINE_H + gap, 0);
    if (h <= maxH) return size;
  }
  return min;
}

let pageCount = 0;
function masthead(eyebrow) {
  const first = pageCount === 0;
  pageCount += 1;
  return [
    {
      columns: [
        { text: "knightingale", font: "Times", fontSize: 18, color: c(theme.colors.forest), width: "*" },
        {
          text: (eyebrow || "").toUpperCase(),
          font: "Helvetica",
          fontSize: 9,
          characterSpacing: 2,
          color: c(theme.colors.softGray),
          alignment: "right",
          width: "auto",
          margin: [0, 5, 0, 0]
        }
      ],
      ...(first ? {} : { pageBreak: "before" })
    },
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 1, lineColor: c(theme.colors.forest) }
      ],
      margin: [0, 8, 0, 0]
    }
  ];
}

function heading(text, size, top) {
  return {
    text: text || "",
    font: "Times",
    fontSize: size,
    color: c(theme.colors.forest),
    lineHeight: LINE_H,
    margin: [0, top, 0, 8]
  };
}

function titlePage(participantName, reportPeriod) {
  return [
    ...masthead("Support Summary"),
    { text: "Supports Summary", font: "Times", fontSize: 36, color: c(theme.colors.forest), lineHeight: LINE_H, margin: [0, 70, 0, 6] },
    { text: participantName, font: "Helvetica", fontSize: 20, color: c(theme.colors.bodyText), lineHeight: LINE_H },
    reportPeriod
      ? { text: reportPeriod, font: "Helvetica", fontSize: 12, color: c(theme.colors.mutedText), lineHeight: LINE_H, margin: [0, 4, 0, 0] }
      : {}
  ];
}

function bodyPage(eyebrow, title, titleSize, body) {
  const size = fitFontSize([body || ""], CONTENT_W, 215, 14, 9);
  return [
    ...masthead(eyebrow),
    heading(title, titleSize, 22),
    { text: body || "", font: "Helvetica", fontSize: size, color: c(theme.colors.bodyText), lineHeight: LINE_H }
  ];
}

function bulletPage(title, items) {
  const list = items || [];
  const size = fitFontSize(list, CONTENT_W - 14, 215, 13, 8, 4);
  return [
    ...masthead("Observations & Recommendations"),
    heading(title, 22, 22),
    {
      ul: list.map((t) => ({ text: t, margin: [0, 0, 0, 4] })),
      font: "Helvetica",
      fontSize: size,
      color: c(theme.colors.bodyText),
      lineHeight: LINE_H
    }
  ];
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sessionPages(sessions) {
  const groups = chunk(sessions, SESSIONS_PER_PAGE);
  const pages = [];
  const summaryW = CONTENT_W - DATE_COL_W - 16; // minus cell padding

  groups.forEach((group, idx) => {
    const eyebrow = groups.length > 1 ? `Session Log ${idx + 1}/${groups.length}` : "Session Log";

    // Vertically centre each cell by padding to the row height.
    const rowPad = (text, size, width, rowH) => {
      const h = countLines(text, size, width) * size * LINE_H;
      return Math.max(3, (rowH - h) / 2);
    };

    const cell = (text, opts) => ({
      text: text || "",
      font: "Helvetica",
      lineHeight: LINE_H,
      ...opts
    });

    const body = [
      [
        cell("Date", { bold: true, fontSize: 11, color: c(theme.colors.forest), margin: [4, rowPad("Date", 11, DATE_COL_W - 8, HEADER_ROW_H), 4, 0] }),
        cell("Summary", { bold: true, fontSize: 11, color: c(theme.colors.forest), margin: [4, rowPad("Summary", 11, summaryW, HEADER_ROW_H), 4, 0] })
      ],
      ...group.map((s) => {
        const pad = Math.max(
          rowPad(s.date, 10, DATE_COL_W - 8, BODY_ROW_H),
          0
        );
        const padS = rowPad(s.summary, 10, summaryW, BODY_ROW_H);
        return [
          cell(s.date, { fontSize: 10, color: c(theme.colors.bodyText), margin: [4, pad, 4, 0] }),
          cell(s.summary, { fontSize: 10, color: c(theme.colors.bodyText), margin: [4, padS, 4, 0] })
        ];
      })
    ];

    pages.push([
      ...masthead(eyebrow),
      {
        margin: [0, 22, 0, 0],
        table: {
          widths: [DATE_COL_W, "*"],
          headerRows: 1,
          heights: (row) => (row === 0 ? HEADER_ROW_H : BODY_ROW_H),
          body
        },
        layout: {
          fillColor: () => c(theme.colors.tableBg),
          // Lines: 1pt under the header and under every row, 1pt between
          // the date and summary columns, 0.5pt on the outer edges.
          hLineWidth: () => 1,
          vLineWidth: (i, node) => (i === 1 ? 1 : 0.5),
          hLineColor: () => c(theme.colors.hairline),
          vLineColor: () => c(theme.colors.hairline),
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0
        }
      }
    ]);
  });
  return pages;
}

async function buildSupportSummaryPdf({ participantName, reportPeriod, content }) {
  pageCount = 0;

  const pages = [
    titlePage(participantName, reportPeriod),
    bodyPage("Overview", "Overview", 24, content.overview),
    ...sessionPages(content.sessions || []),
    ...(content.summaryOfWork || []).map((s) => bodyPage("Summary of Work", s.heading, 22, s.body)),
    bulletPage("Key Observations", content.keyObservations),
    bulletPage("Recommendations", content.recommendations)
  ];

  const docDefinition = {
    pageSize: { width: PAGE_W, height: PAGE_H },
    pageMargins: [MARGIN_X, 22, MARGIN_X, 14],
    info: { title: `Supports Summary - ${participantName}`, author: "Knightingale" },
    defaultStyle: { font: "Helvetica" },
    content: pages.flat()
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
