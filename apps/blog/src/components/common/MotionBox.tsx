import { chakra } from "@chakra-ui/react";
import { isValidMotionProp, motion } from "framer-motion";

const MotionBox = chakra(motion.div, { shouldForwardProp: isValidMotionProp });

export default MotionBox;
