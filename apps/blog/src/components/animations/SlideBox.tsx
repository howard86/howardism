import { HTMLMotionProps, motion, Variants } from "framer-motion";

interface SlideBoxProps extends HTMLMotionProps<"div"> {
  x?: number;
  y?: number;
  delay?: number;
  duration?: number;
}

export default function SlideBox({
  delay = 0,
  x = 0,
  y = 0,
  duration = 0.8,
  ...props
}: SlideBoxProps) {
  const VARIANTS: Variants = {
    hidden: {
      opacity: 0,
      x,
      y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        delay,
        duration,
      },
    },
  };

  return <motion.div variants={VARIANTS} initial="hidden" whileInView="visible" {...props} />;
}
