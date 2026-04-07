import { RouteLink } from "@howardism/components-common";
import { Menu } from "lucide-react";
import { useState } from "react";

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
    <nav
      className="fixed z-40 flex w-full items-center justify-between text-white opacity-90 transition-all duration-300 ease-out"
      style={{
        height: NAV_BAR_HEIGHT,
        top: shouldHideHeader ? 4 - NAV_BAR_HEIGHT : 0,
        background:
          "linear-gradient(to bottom, #1c0303, #3a1313, #3a1313, #3a1313, #3a1313, #3a1313, #5f2222, #833031)",
      }}
    >
      {/* TODO: add logo with fonts */}
      <RouteLink className="ml-8" href="/">
        Recipe
      </RouteLink>
      {/* TODO: update onHover & onFocus */}
      <button
        aria-label="open navigation"
        className="mr-8 rounded p-2 transition-colors hover:bg-white/10"
        onClick={onOpen}
        type="button"
      >
        <Menu className="size-9" />
      </button>
    </nav>
  );
}
