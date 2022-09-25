import { extendTheme, ThemeOverride } from "@chakra-ui/react";

import colors from "./colors";
import components from "./components";

const overrides: ThemeOverride = {
  colors,
  components,
  styles: {
    global: {
      body: {
        bg: "secondary.50",
        color: "primary.800",
      },
    },
  },
};

const theme = extendTheme(overrides);

export default theme;
