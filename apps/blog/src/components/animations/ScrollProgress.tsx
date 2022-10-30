import { HiChevronUp } from "react-icons/hi";
import { motion, useScroll, Variants } from "framer-motion";

const CIRCLE_VARIANTS: Variants = {
  normal: { opacity: 0.3, fill: "none" },
  expand: { opacity: 1, fill: "currentColor" },
  shrink: { opacity: 1, fill: "currentColor", scale: 0.9 },
};

const ARROW_VARIANTS: Variants = {
  normal: { top: 26, left: 28, color: "transparent" },
  expand: {
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
    <button
      type="button"
      className="fixed bottom-5 right-5 z-30"
      aria-label="scroll to top"
      onClick={handleScrollToTop}
    >
      <motion.span initial="normal" animate="normal" whileHover="expand" whileTap="shrink">
        <svg className="text-teal-500" width={70} viewBox="0 0 100 100">
          <motion.circle
            variants={CIRCLE_VARIANTS}
            cx={50}
            cy={50}
            r={30}
            stroke="currentColor"
            strokeWidth="15%"
            strokeDashoffset={0}
            pathLength={1}
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
        </svg>
        <motion.div className="absolute" variants={ARROW_VARIANTS}>
          <HiChevronUp />
        </motion.div>
      </motion.span>
    </button>
  );
}
