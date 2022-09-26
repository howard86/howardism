import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import Scrollspy from "react-scrollspy";
import { Box, chakra, ChakraProps, Flex, Icon } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import throttle from "lodash.throttle";

import NavListItem from "./NavListItem";

const COLOR_CHANGED_Y = 80;
const THROTTLE_SEC = 200;

export const SCROLL_SPY_ITEMS = ["home", "portfolio", "contact"];

const activeState: ChakraProps["sx"] = {
  color: "secondary.500",
  span: {
    _first: {
      transform: "translateY(-150%)",
    },
    _notFirst: {
      top: "50%",
      transform: "translateY(-50%)",
    },
  },
};

const ChakraScrollspy = chakra(Scrollspy, {
  baseStyle: {
    display: "flex",
    alignItems: "center",
    m: 0,
    listStyleType: "none",
    "li.current a": activeState,
    "li a": {
      _hover: activeState,
    },
  },
});

export default function Header() {
  const [isScrolled, setScrolled] = useState(false);

  useEffect(() => {
    const changeBackground = throttle(
      () => setScrolled(window.scrollY >= COLOR_CHANGED_Y),
      THROTTLE_SEC
    );

    window.addEventListener("scroll", changeBackground);

    return () => window.removeEventListener("scroll", changeBackground);
  }, []);

  return (
    <Box
      as="header"
      pos="fixed"
      top={0}
      left={0}
      right={0}
      zIndex="banner"
      transition="all 0.8s ease"
    >
      <Flex
        transition="all 0.3s ease"
        justify="space-between"
        align="center"
        bgColor={isScrolled ? "white" : "transparent"}
        shadow={isScrolled ? "md" : undefined}
        py={isScrolled ? 5 : 30}
        px={{ base: 4, md: "60px" }}
      >
        <RouteLink href="/">
          <Icon as={FaGithub} fontSize="2xl" />
        </RouteLink>
        <ChakraScrollspy items={SCROLL_SPY_ITEMS} currentClassName="current" offset={-88}>
          <NavListItem className="current" href="#home" name="Home" />
          <NavListItem href="#portfolio" name="Portfolio" />
          <NavListItem href="#contact" name="Contact" />
        </ChakraScrollspy>
      </Flex>
    </Box>
  );
}
