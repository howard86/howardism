import { Box, Flex, IconButton, List, ListItem } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import { useRouter } from "next/router";
import { HiSearch } from "react-icons/hi";

import { MENU_LINK_ITEMS } from "@/constants/menu";

import HorizontalLogo from "../graphics/HorizontalLogo";
import MobileDrawer from "./MobileDrawer";

export default function NavBar(): JSX.Element {
  const router = useRouter();

  return (
    <Box
      as="header"
      bgColor="secondary.100"
      left="0"
      position="fixed"
      right="0"
      shadow="md"
      top="0"
      zIndex="modal"
    >
      <Flex
        align="center"
        justify="space-between"
        px={[1, 4, 6, 8]}
        py={{ base: 4, lg: 6 }}
        transition="0.25 ease-in-out"
      >
        <MobileDrawer />
        <RouteLink href="/">
          <HorizontalLogo isTransparent size={40} />
        </RouteLink>
        <Box display={{ base: "none", md: "flex" }} flexGrow={1} mr={{ md: 5 }}>
          <List alignItems="center" display="flex" ml="auto">
            {MENU_LINK_ITEMS.map((item) => {
              const isCurrentPage = item.url === router.pathname;
              return (
                <ListItem key={item.label} mx="2">
                  <RouteLink
                    _hover={{ color: "primary.500" }}
                    color={isCurrentPage ? "primary.500" : "primary.400"}
                    fontWeight={isCurrentPage ? "bold" : "medium"}
                    href={item.url}
                    px="2.5"
                    py="1"
                    transition="0.15s ease-in-out"
                    whiteSpace="nowrap"
                  >
                    {item.label}
                  </RouteLink>
                </ListItem>
              );
            })}
          </List>
        </Box>
        {/* TODO: implement search function */}
        <IconButton
          aria-label="search"
          color="primary.600"
          fontSize="3xl"
          icon={<HiSearch />}
          size="lg"
          variant="ghost"
        />
      </Flex>
    </Box>
  );
}
