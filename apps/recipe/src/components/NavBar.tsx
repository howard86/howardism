import React, { FC } from "react";
import { Flex, IconButton } from "@chakra-ui/react";
import { IoMdMenu } from "react-icons/io";

import RouteLink from "./RouteLink";

export const NAV_BAR_HEIGHT = 20;

const NavBar: FC = () => {
  const onOpen = () => {
    // TODO: add Drawer here
    alert("clicked");
  };

  // TODO: change bg when scrolling
  return (
    <Flex
      as="nav"
      position="fixed"
      top="0"
      w="full"
      h={NAV_BAR_HEIGHT}
      color="white"
      justifyContent="space-between"
      alignItems="center"
      zIndex="docked"
    >
      {/* TODO: add logo with fonts */}
      <RouteLink href="/" ml="8">
        Recipe
      </RouteLink>
      {/* TODO: update onHover & on onFocus */}
      <IconButton
        variant="ghost"
        colorScheme="white"
        aria-label="open navigation"
        mr="8"
        fontSize="35px"
        icon={<IoMdMenu />}
        onClick={onOpen}
      >
        Show Menu
      </IconButton>
    </Flex>
  );
};

export default NavBar;
