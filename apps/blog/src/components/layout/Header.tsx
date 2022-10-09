import { Box, Container, Flex } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";

import { SECTION_IDS, SECTION_KEYS, SectionId } from "@/constants/nav";
import useHasScrolled from "@/hooks/useHasScrolled";
import useScrollSpy from "@/hooks/useScrollSpy";

import Logo from "../icons/Logo";

import NavListItem from "./NavListItem";

export const HEADER_OFFSET = 88;

export default function Header() {
  const isScrolled = useHasScrolled({ offsetPx: HEADER_OFFSET, throttleMs: 300 });
  const activeSectionId = useScrollSpy({ sectionIds: SECTION_IDS, offsetPx: HEADER_OFFSET });

  return (
    <Box
      as="header"
      pos="fixed"
      top={0}
      left={0}
      right={0}
      zIndex="banner"
      transition="all 0.8s ease"
      bgColor={isScrolled ? "white" : "transparent"}
      shadow={isScrolled ? "md" : undefined}
      py={isScrolled ? 5 : 7}
    >
      <Container
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        maxW="container.xl"
      >
        <RouteLink href="/">
          <Logo
            color="blackAlpha.800"
            filter="drop-shadow(0.3px 0.3px 0.4px rgb(0 0 0 / 0.4)) drop-shadow(0.6px 0.6px 1px rgb(0 0 0 / 0.2))"
          />
        </RouteLink>
        <Flex gap={[2, 4, 7]}>
          {SECTION_KEYS.map((key) => (
            <NavListItem
              key={key}
              href={`#${SectionId[key]}`}
              name={key}
              isCurrentPage={activeSectionId === SectionId[key]}
            />
          ))}
        </Flex>
      </Container>
    </Box>
  );
}
