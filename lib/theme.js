// Matches the "knightingale" invoice email design: navy on cream, thin
// rule lines, Didot-style serif headings (falls back to Georgia in
// PowerPoint, since Didot isn't a cross-platform font).
module.exports = {
  colors: {
    navy: "0F1B3D",
    cream: "F2F1ED",
    white: "FFFFFF",
    charcoal: "1C1C1C",
    bodyText: "4A4A45",
    mutedText: "6B6B64",
    softGray: "8A8778",
    hairline: "E3E1DB"
  },
  fonts: {
    display: "Georgia", // stands in for Didot / Hoefler Text
    ui: "Arial"
  }
};
