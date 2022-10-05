import { extendTheme, ThemeOverride, withDefaultColorScheme } from "@chakra-ui/react";

import colors from "./colors";
import fonts from "./fonts";
import styles from "./styles";

const overrides: ThemeOverride = {
  styles,
  colors,
  fonts,
};

const theme = extendTheme(overrides, withDefaultColorScheme({ colorScheme: "primary" }));

export default theme;
