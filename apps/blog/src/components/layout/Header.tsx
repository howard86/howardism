import { useEffect, useState } from "react";
import Scrollspy from "react-scrollspy";
import { Box, chakra, ChakraProps, Flex } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import throttle from "lodash.throttle";

import { SECTION_IDS, SECTION_KEYS, SectionId } from "@/constants/nav";

import Logo from "../icons/Logo";

import NavListItem from "./NavListItem";

const COLOR_CHANGED_Y = 80;
const THROTTLE_SEC = 200;
const CURRENT_CLASS_NAME = "current";

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
      zIndex="docked"
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
          <Logo
            color="blackAlpha.800"
            filter="drop-shadow(0.3px 0.3px 0.4px rgb(0 0 0 / 0.4)) drop-shadow(0.6px 0.6px 1px rgb(0 0 0 / 0.2))"
          />
        </RouteLink>
        <ChakraScrollspy items={SECTION_IDS} currentClassName={CURRENT_CLASS_NAME} offset={-88}>
          {SECTION_KEYS.map((key, i) => (
            <NavListItem
              key={key}
              className={i === 0 ? CURRENT_CLASS_NAME : undefined}
              href={`#${SectionId[key]}`}
              name={key}
            />
          ))}
        </ChakraScrollspy>
      </Flex>
    </Box>
  );
}
