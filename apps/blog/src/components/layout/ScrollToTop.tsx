import { useEffect, useState } from "react";
import { chakra } from "@chakra-ui/react";
import throttle from "lodash.throttle";

const VISIBLE_Y = 500;
const THROTTLE_SEC = 1000;

export default function ScrollToTop() {
  const [isVisible, setVisible] = useState(false);

  const scroll = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const toggleVisibility = throttle(() => setVisible(window.scrollY > VISIBLE_Y), THROTTLE_SEC);

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  if (!isVisible) return null;

  return (
    <chakra.button
      onClick={scroll}
      pos="fixed"
      right={5}
      bottom={5}
      w={45}
      h={45}
      zIndex="sticky"
      data-aos="fade-left"
      data-aos-duration="1200"
    >
      <chakra.span
        display="inline-block"
        pos="relative"
        overflow="hidden"
        bgColor="secondary.500"
        p={22}
        rounded="md"
        _after={{
          w: 0,
          h: 0,
          pos: "absolute",
          content: "''",
          border: "5px solid transparent",
          borderBottomColor: "white",
          top: "14px",
          left: 17,
          zIndex: "docked",
        }}
      />
    </chakra.button>
  );
}
