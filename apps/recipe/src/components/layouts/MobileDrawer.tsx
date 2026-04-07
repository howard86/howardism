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
} from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import { useRouter } from "next/router";
import { useRef } from "react";
import { HiMenuAlt2 } from "react-icons/hi";

import { MENU_LINK_ITEMS } from "@/constants/menu";

import HorizontalLogo from "../graphics/HorizontalLogo";

export default function MobileDrawer(): JSX.Element {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <Box display={{ md: "none" }}>
      <IconButton
        aria-label="open-drawer"
        color="primary.600"
        fontSize="4xl"
        icon={<HiMenuAlt2 />}
        onClick={onOpen}
        ref={btnRef}
        variant="ghost"
      >
        Open
      </IconButton>
      <Drawer
        finalFocusRef={btnRef}
        isOpen={isOpen}
        onClose={onClose}
        placement="left"
        size="xs"
      >
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
                const isCurrentPage = router.pathname === item.url;
                return (
                  <ListItem key={item.url}>
                    <RouteLink
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
                      _hover={{
                        color: "secondary.500",
                      }}
                      color={isCurrentPage ? "secondary.500" : "secondary.400"}
                      fontSize="xl"
                      fontWeight={isCurrentPage ? "bold" : "medium"}
                      href={item.url}
                      onClick={onClose}
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
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
