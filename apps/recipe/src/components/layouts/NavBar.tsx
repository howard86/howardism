import { Box, Flex, IconButton, List, ListItem } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";
import { HiSearch } from "react-icons/hi";

import { MENU_LINK_ITEMS } from "../../constants/menu";
import HorizontalLogo from "../graphics/HorizontalLogo";
import RouteLink from "../RouteLink";
import MobileDrawer from "./MobileDrawer";

const NavBar = (): JSX.Element => {
  const router = useRouter();
  return (
    <Box as="header" position="relative" transition="0.25 ease-in-out" zIndex="banner">
      <Flex
        align="center"
        justify="space-between"
        borderBottomWidth="thin"
        borderBottomStyle="solid"
        borderBottomColor="gray"
        transition="0.25 ease-in-out"
        py={[4, 6, 11, 18]}
        px={[1, 4, 6, 8]}
      >
        <MobileDrawer />
        <RouteLink href="/">
          <HorizontalLogo size={40} isTransparent />
        </RouteLink>
        <Flex flexGrow={1} display={{ base: "none", md: "flex" }}>
          <List display="flex" alignItems="center" ml="auto">
            {MENU_LINK_ITEMS.map((item) => {
              const isCurrentPage = item.url === router.pathname;
              return (
                <ListItem mx="2" key={item.label}>
                  <RouteLink
                    py="1"
                    px="2.5"
                    color={isCurrentPage ? "primary.500" : "primary.400"}
                    fontWeight={isCurrentPage ? "bold" : "medium"}
                    whiteSpace="nowrap"
                    transition="0.15s ease-in-out"
                    href={item.url}
                    _hover={{ color: "primary.500" }}
                  >
                    {item.label}
                  </RouteLink>
                </ListItem>
              );
            })}
          </List>
        </Flex>
        {/* TODO: implement search function */}
        <IconButton
          aria-label="search"
          variant="ghost"
          size="lg"
          fontSize="3xl"
          icon={<HiSearch />}
        />
      </Flex>
    </Box>
  );
};

export default NavBar;
