import { Flex, IconButton } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import { useState } from "react";
import { IoMdMenu } from "react-icons/io";

import useThrottledScroll from "@/hooks/useThrottledScroll";

export const NAV_BAR_HEIGHT = 20;
const TIMEOUT_DELAY = 1000;

export default function NavBar() {
  const [shouldHideHeader, setShouldHideHeader] = useState(true);

  useThrottledScroll((previousScrollTop, currentScrollTop) => {
    const isScrolledDown = previousScrollTop < currentScrollTop;
    const isMinimumScrolled = currentScrollTop > NAV_BAR_HEIGHT;

    setTimeout(() => {
      setShouldHideHeader(
        window.pageYOffset === 0 || (isScrolledDown && isMinimumScrolled)
      );
    }, TIMEOUT_DELAY);
  }, TIMEOUT_DELAY * 2);

  const onOpen = () => {
    // TODO: add Drawer here
    console.info("clicked");
  };

  return (
    <Flex
      _hover={{ top: 0 }}
      alignItems="center"
      as="nav"
      bgGradient="linear(to-b, primary.900, primary.800, primary.800,  primary.800, primary.800, primary.800, primary.700, primary.600)"
      color="white"
      h={NAV_BAR_HEIGHT}
      justifyContent="space-between"
      opacity="0.9"
      position="fixed"
      top={shouldHideHeader ? 4 - NAV_BAR_HEIGHT : 0}
      transition="0.3s ease-out"
      w="full"
      zIndex="docked"
    >
      {/* TODO: add logo with fonts */}
      <RouteLink href="/" ml="8">
        Recipe
      </RouteLink>
      {/* TODO: update onHover & on onFocus */}
      <IconButton
        aria-label="open navigation"
        colorScheme="white"
        fontSize="35px"
        icon={<IoMdMenu />}
        mr="8"
        onClick={onOpen}
        variant="ghost"
      >
        Show Menu
      </IconButton>
    </Flex>
  );
}
