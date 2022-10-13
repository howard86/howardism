import { ThemeOverride } from "@chakra-ui/react";

const styles: ThemeOverride["styles"] = {
  global: {
    "body, #__next": {
      width: "full",
      height: "full",
    },
    html: {
      scrollBehavior: "smooth",
      cursor: "none",
    },
  },
};

export default styles;
