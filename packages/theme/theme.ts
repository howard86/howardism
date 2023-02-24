import { extendTheme, type ThemeOverride } from "@chakra-ui/react"

const overrides: ThemeOverride = {
  colors: {
    primary: {
      50: "#faf5eb",
      100: "#eee0c7",
      200: "#e3cca1",
      300: "#d8b87a",
      400: "#cea453",
      500: "#b58b3b",
      600: "#8d6c2e",
      700: "#644d21",
      800: "#3c2e14",
      900: "#140f05",
    },
    secondary: {
      50: "#ffeae4",
      100: "#f7c9bc",
      200: "#eba693",
      300: "#e28369",
      400: "#d96040",
      500: "#bf4726",
      600: "#96361d",
      700: "#6c2614",
      800: "#421509",
      900: "#1c0500",
    },
  },
  fonts: {
    body: "Merriweather, serif",
    heading: "Roboto",
    monospace: "Menlo, monospace",
  },
}

const theme = extendTheme(overrides)

export default theme
