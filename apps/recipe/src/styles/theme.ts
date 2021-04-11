import { extendTheme, ThemeOverride } from "@chakra-ui/react";
import colors from "./colors";

const overrides: ThemeOverride = {
  colors,
};

export default extendTheme(overrides);
