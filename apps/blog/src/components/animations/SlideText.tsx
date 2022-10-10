import { BoxProps } from "@chakra-ui/react";
import { Variants } from "framer-motion";

import MotionBox from "../common/MotionBox";

interface SlideTextProps extends BoxProps {
  text: string;
  delay?: number;
}

const VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      delay,
    },
  }),
};

export default function SlideText({ delay = 0, text, ...props }: SlideTextProps) {
  return (
    <MotionBox variants={VARIANTS} initial="hidden" whileInView="visible" custom={delay} {...props}>
      {text}
    </MotionBox>
  );
}
