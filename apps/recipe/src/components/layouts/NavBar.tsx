import { HiSearch } from "react-icons/hi"
import { Box, Flex, IconButton, List, ListItem } from "@chakra-ui/react"
import { useRouter } from "next/router"

import { MENU_LINK_ITEMS } from "@/constants/menu"
import { RouteLink } from "@howardism/components-common"

import HorizontalLogo from "../graphics/HorizontalLogo"

import MobileDrawer from "./MobileDrawer"

export default function NavBar(): JSX.Element {
  const router = useRouter()

  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="modal"
      shadow="md"
      bgColor="secondary.100"
    >
      <Flex
        align="center"
        justify="space-between"
        transition="0.25 ease-in-out"
        py={{ base: 4, lg: 6 }}
        px={[1, 4, 6, 8]}
      >
        <MobileDrawer />
        <RouteLink href="/">
          <HorizontalLogo size={40} isTransparent />
        </RouteLink>
        <Box mr={{ md: 5 }} flexGrow={1} display={{ base: "none", md: "flex" }}>
          <List display="flex" alignItems="center" ml="auto">
            {MENU_LINK_ITEMS.map((item) => {
              const isCurrentPage = item.url === router.pathname
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
              )
            })}
          </List>
        </Box>
        {/* TODO: implement search function */}
        <IconButton
          aria-label="search"
          variant="ghost"
          color="primary.600"
          size="lg"
          fontSize="3xl"
          icon={<HiSearch />}
        />
      </Flex>
    </Box>
  )
}
