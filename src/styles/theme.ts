const theme = {
  breakpoints: ["40em", "52em", "64em"],
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 64],
  colors: {
    primary: "",
    secondary: "",
    eggshell: ["#FEFDFB", "#F4F1DE"],
    terraCotta: ["#E07A5F", "#43190D"],
    independence: "#3D405B",
    greenSheen: "#81B29A",
    deepChampagne: "#F2CC8F",
  },
  space: [0, 4, 8, 16, 32, 64, 128, 256],
  fonts: {
    body: "Merriweather, serif",
    heading: "Roboto",
    monospace: "Menlo, monospace",
  },
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.25,
  },
  shadows: {
    small: "0 0 4px rgba(0, 0, 0, .125)",
    large: "0 0 24px rgba(0, 0, 0, .125)",
  },
  variants: {},
  text: {},
  buttons: {
    primary: {
      color: "secondary",
      bg: "primary",
    },
  },
};

theme.colors.primary = theme.colors.terraCotta[0];
theme.colors.secondary = theme.colors.eggshell[1];

export type Theme = typeof theme;

export default theme;
