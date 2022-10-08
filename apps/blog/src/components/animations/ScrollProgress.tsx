import { HiChevronUp } from "react-icons/hi";
import { chakra, Icon } from "@chakra-ui/react";
import { motion, useScroll, Variants } from "framer-motion";

const CIRCLE_VARIANTS: Variants = {
  normal: { fill: "none" },
  expand: { opacity: 1, fill: "currentColor" },
  shrink: { opacity: 1, fill: "currentColor", scale: 0.9 },
};

const ARROW_VARIANTS: Variants = {
  normal: { position: "absolute", top: 26, left: 28, color: "transparent" },
  expand: {
    position: "absolute",
    top: 3,
    left: 11,
    fontSize: "50px",
    color: "white",
    transition: {
      type: "spring",
      stiffness: 300,
    },
  },
};

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  const handleScrollToTop = () => window.scroll({ top: 0 });

  return (
    <chakra.button
      pos="fixed"
      right="5"
      bottom="5"
      zIndex="docked"
      aria-label="scroll to top"
      onClick={handleScrollToTop}
    >
      <motion.span initial="normal" animate="normal" whileHover="expand" whileTap="shrink">
        <chakra.svg width={70} viewBox="0 0 100 100" color="secondary.500">
          <motion.circle
            variants={CIRCLE_VARIANTS}
            cx={50}
            cy={50}
            r={30}
            stroke="currentColor"
            strokeWidth="15%"
            strokeDashoffset={0}
            pathLength={1}
            opacity={0.3}
          />
          <motion.circle
            variants={CIRCLE_VARIANTS}
            cx={50}
            cy={50}
            r={30}
            stroke="currentColor"
            strokeWidth="12%"
            strokeDashoffset={0}
            pathLength={1}
            style={{ pathLength: scrollYProgress }}
          />
        </chakra.svg>
        <motion.div variants={ARROW_VARIANTS}>
          <Icon as={HiChevronUp} />
        </motion.div>
      </motion.span>
    </chakra.button>
  );
}
