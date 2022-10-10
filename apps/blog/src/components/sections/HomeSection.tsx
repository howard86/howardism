import { useRef } from "react";
import { HiArrowNarrowDown } from "react-icons/hi";
import ReactTyped from "react-typed";
import { Box, Button, chakra, Icon, IconButton, VisuallyHidden } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import { useInView, useScroll, useTransform, Variants } from "framer-motion";

import coverPhoto from "@/../public/cover.jpg";
import { SectionId } from "@/constants/nav";

import SlideText from "../animations/SlideText";
import WavyText from "../animations/WavyText";
import MotionBox from "../common/MotionBox";

const descriptions = ["Web Developer", "Lifelong Learner", "Mathemachicken Lover!"];

const VARIANTS: Variants = {
  hover: {
    y: -25,
    scale: 1.1,
    opacity: 1,
  },
  bounce: {
    opacity: 0.6,
    y: [-20, -35, -20],
    transition: {
      bounce: 1,
      repeat: Infinity,
      repeatDelay: 0.5,
      type: "spring",
    },
  },
};

export default function HomeSection() {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: false });
  const { scrollYProgress } = useScroll({ offset: ["start", "100vh"] });
  const filter = useTransform(scrollYProgress, (value) =>
    value ? `blur(${4 * value}px) brightness(${100 - 80 * value}%)` : "none"
  );
  const y = useTransform(scrollYProgress, (value) => Math.min(640 * value + 105, 340));

  return (
    <Box as="section" id={SectionId.Home} pos="relative">
      <MotionBox
        pos="fixed"
        w="full"
        h="100vh"
        overflow="hidden"
        zIndex={-1}
        style={{
          filter,
        }}
      >
        <Image
          alt="lakeside views"
          src={coverPhoto}
          layout="fill"
          placeholder="blur"
          objectFit="cover"
          objectPosition="38% bottom"
          quality={100}
          priority
        />
      </MotionBox>
      <MotionBox
        variants={VARIANTS}
        whileInView="bounce"
        whileHover="hover"
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        w={12}
        mx="auto"
        textAlign="center"
        zIndex="docked"
      >
        <IconButton
          as="a"
          href={`#${SectionId.About}`}
          size="sm"
          aria-label="scroll down"
          colorScheme="secondary"
          rounded="full"
          icon={<Icon fontSize="md" as={HiArrowNarrowDown} />}
        />
      </MotionBox>
      <MotionBox
        paddingInline={4}
        w="full"
        minH="100vh"
        py="12"
        mx="auto"
        maxW="container.md"
        display="flex"
        flexDir="column"
        color="white"
        textShadow="2px 4px 3px rgba(0,0,0,0.3)"
        gap={6}
        style={{ y }}
        overflow="hidden"
      >
        <WavyText as="h3" fontSize="lg" text="Hello I'm" />
        <WavyText
          as="h1"
          mt={-6}
          fontSize="6xl"
          fontWeight="bold"
          lineHeight={1.33}
          text="Howard Tai"
          delay={0.6}
        />
        <chakra.h2 ref={ref} fontSize="3xl" color="secondary.400" fontWeight="semibold">
          <VisuallyHidden>{descriptions.join(", ")}</VisuallyHidden>
          {inView && (
            <ReactTyped
              typeSpeed={100}
              backSpeed={60}
              strings={descriptions}
              loop
              smartBackspace
              shuffle={false}
              backDelay={1}
              fadeOut={false}
              fadeOutDelay={1000}
              showCursor
              cursorChar="|"
            />
          )}
        </chakra.h2>
        <SlideText
          as="p"
          text="I specialise in developing data intensive applications with React (SSR) and improve web architecture, facing and tackling challenges in fast-paced start-ups since the first day of my job!"
          delay={1.6}
        />
        <Button
          as="a"
          colorScheme="secondary"
          variant="outline"
          bgColor="whiteAlpha.400"
          alignSelf="end"
          href={`#${SectionId.About}`}
          mr="20"
        >
          See Projects
        </Button>
      </MotionBox>
    </Box>
  );
}
