import { useState } from "react"
import { IoMdMenu } from "react-icons/io"
import { Flex, IconButton } from "@chakra-ui/react"

import useThrottledScroll from "@/hooks/useThrottledScroll"
import { RouteLink } from "@howardism/components-common"

export const NAV_BAR_HEIGHT = 20
const TIMEOUT_DELAY = 1000

export default function NavBar() {
  const [shouldHideHeader, setShouldHideHeader] = useState(true)

  useThrottledScroll((previousScrollTop, currentScrollTop) => {
    const isScrolledDown = previousScrollTop < currentScrollTop
    const isMinimumScrolled = currentScrollTop > NAV_BAR_HEIGHT

    setTimeout(() => {
      setShouldHideHeader(window.pageYOffset === 0 || (isScrolledDown && isMinimumScrolled))
    }, TIMEOUT_DELAY)
  }, TIMEOUT_DELAY * 2)

  const onOpen = () => {
    // TODO: add Drawer here
    alert("clicked")
  }

  return (
    <Flex
      as="nav"
      position="fixed"
      w="full"
      h={NAV_BAR_HEIGHT}
      color="white"
      bgGradient="linear(to-b, primary.900, primary.800, primary.800,  primary.800, primary.800, primary.800, primary.700, primary.600)"
      top={shouldHideHeader ? 4 - NAV_BAR_HEIGHT : 0}
      opacity="0.9"
      transition="0.3s ease-out"
      justifyContent="space-between"
      alignItems="center"
      zIndex="docked"
      _hover={{ top: 0 }}
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
  )
}
