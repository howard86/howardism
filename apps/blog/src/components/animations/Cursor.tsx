import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import throttle from "lodash.throttle";

import MotionBox from "../common/MotionBox";

const DEFAULT_POSITION = -100;
const CURSOR_SIZE = 32;
const CURSOR_POSITION = CURSOR_SIZE / 2;
const SPRING_OPTIONS: Parameters<typeof useSpring>[1] = {
  mass: 3,
  damping: 27,
  stiffness: 100,
};

export default function Cursor() {
  const cursorX = useMotionValue(DEFAULT_POSITION);
  const cursorY = useMotionValue(DEFAULT_POSITION);

  useEffect(() => {
    const moveCursor = throttle((e: MouseEvent) => {
      cursorX.set(e.clientX - CURSOR_POSITION);
      cursorY.set(e.clientY - CURSOR_POSITION);
    }, 10);

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
    };
  });

  return (
    <>
      <MotionBox
        position="fixed"
        mixBlendMode="difference"
        left="0"
        top="0"
        w={`${CURSOR_SIZE}px`}
        h={`${CURSOR_SIZE}px`}
        rounded="full"
        bgColor="primary.800"
        zIndex="toast"
        pointerEvents="none"
        style={{
          translateX: useSpring(cursorX, SPRING_OPTIONS),
          translateY: useSpring(cursorY, SPRING_OPTIONS),
        }}
      />
      <MotionBox
        pos="fixed"
        mixBlendMode="luminosity"
        left="3"
        top="3"
        h="2"
        w="2"
        rounded="full"
        bgColor="blackAlpha.600"
        pointerEvents="none"
        zIndex="toast"
        style={{
          translateX: cursorX,
          translateY: cursorY,
        }}
      />
    </>
  );
}
