import { BoxProps, VisuallyHidden } from "@chakra-ui/react";
import { motion, Transition, Variants } from "framer-motion";

import MotionBox from "../common/MotionBox";

interface WavyTextProps extends BoxProps {
  text: string;
  delay?: number;
}

const CONTAINER_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.05, delay },
  }),
};

export const LETTER_TRANSITION: Transition = {
  type: "spring",
  damping: 12,
  stiffness: 200,
};

const LETTER_VARIANTS: Variants = {
  visible: {
    opacity: 1,
    y: 0,
    transition: LETTER_TRANSITION,
  },
  hidden: {
    opacity: 0,
    y: 12,
    transition: LETTER_TRANSITION,
  },
};

const NO_BREAK_SPACE = "\u00A0";

export default function WavyText({ text, delay = 0, ...props }: WavyTextProps) {
  return (
    <MotionBox
      display="flex"
      flexWrap="wrap"
      variants={CONTAINER_VARIANTS}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      {...props}
    >
      <VisuallyHidden>{text}</VisuallyHidden>
      {text.split("").map((char, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <motion.span variants={LETTER_VARIANTS} key={char + i}>
          {char === " " ? NO_BREAK_SPACE : char}
        </motion.span>
      ))}
    </MotionBox>
  );
}
