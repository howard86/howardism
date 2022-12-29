import { useRef } from "react"
import { HiMenuAlt2 } from "react-icons/hi"
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  List,
  ListItem,
  useDisclosure,
} from "@chakra-ui/react"
import { useRouter } from "next/router"

import { MENU_LINK_ITEMS } from "@/constants/menu"
import { RouteLink } from "@howardism/components-common"

import HorizontalLogo from "../graphics/HorizontalLogo"

export default function MobileDrawer(): JSX.Element {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const btnRef = useRef<HTMLButtonElement>(null)

  return (
    <Box display={{ md: "none" }}>
      <IconButton
        aria-label="open-drawer"
        ref={btnRef}
        color="primary.600"
        variant="ghost"
        onClick={onOpen}
        fontSize="4xl"
        icon={<HiMenuAlt2 />}
      >
        Open
      </IconButton>
      <Drawer size="xs" placement="left" isOpen={isOpen} onClose={onClose} finalFocusRef={btnRef}>
        <DrawerOverlay />
        <DrawerContent bg="secondary.50">
          <DrawerCloseButton />
          <DrawerHeader bg="secondary.100" shadow="sm">
            <RouteLink href="/">
              <HorizontalLogo isTransparent />
            </RouteLink>
          </DrawerHeader>
          <DrawerBody my="8">
            <List spacing="8">
              {MENU_LINK_ITEMS.map((item) => {
                // TODO: implement active-link
                const isCurrentPage = router.pathname === item.url
                return (
                  <ListItem key={item.url}>
                    <RouteLink
                      py="1"
                      px="2.5"
                      color={isCurrentPage ? "secondary.500" : "secondary.400"}
                      fontSize="xl"
                      whiteSpace="nowrap"
                      fontWeight={isCurrentPage ? "bold" : "medium"}
                      transition="0.15s ease-in-out"
                      _hover={{
                        color: "secondary.500",
                      }}
                      _before={{
                        mt: 4,
                        display: "inline-block",
                        content: '""',
                        position: "absolute",
                        width: 3,
                        height: 8,
                        left: 0,
                        opacity: isCurrentPage ? 1 : 0,
                        background: "secondary.100",
                        transform: "translateY(-50%)",
                      }}
                      href={item.url}
                      onClick={onClose}
                    >
                      {item.label}
                    </RouteLink>
                  </ListItem>
                )
              })}
            </List>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}
