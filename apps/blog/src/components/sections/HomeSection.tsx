import { Parallax } from "react-parallax";
import ReactTyped from "react-typed";
import { Box, Button, chakra, Container, Heading, keyframes, Text } from "@chakra-ui/react";

import { SectionId } from "@/constants/nav";

const ANIMATION_TYPE = "fade-up";
const ANIMATION_DURATION = "1200";

const descriptions = ["Web Developer", "Lifelong Learner", "Mathemachicken Lover!"];

const imagePath = "/cover.jpg";

const down = keyframes`
  0% { top: 5px; opacity: 0 }
  30% { top: 15px; opacity: 1 }
  100% { top: 25px; opacity: 0}
`;

export default function HomeSection() {
  return (
    <Box as="section" id={SectionId.Home} pos="relative" w="full" overflow="hidden">
      <Parallax
        bgImage={imagePath}
        strength={500}
        bgImageStyle={{ objectFit: "cover", objectPosition: "top" }}
        blur={{ min: 0, max: 2 }}
      >
        <Box
          position="absolute"
          bottom={30}
          left={0}
          right={0}
          w={35}
          mx="auto"
          textAlign="center"
          zIndex="docked"
        >
          <chakra.a
            href="#portfolio"
            display="inline-block"
            pos="relative"
            w={35}
            h={35}
            rounded="full"
            animation={`${down} 1s linear infinite`}
            bgColor="secondary.500"
          >
            <chakra.span
              pos="absolute"
              borderTop="1px solid white"
              borderRight="1px solid white"
              top="-3px"
              left={0}
              right={0}
              bottom={0}
              m="auto"
              w={2.5}
              h={2.5}
              transform="rotate(135deg)"
            />
          </chakra.a>
        </Box>
        <Container minH="100vh" maxW="container.lg" px={20}>
          <Box
            w="full"
            maxW={800}
            minH="100vh"
            display="flex"
            flexDir="column"
            color="white"
            textShadow="2px 4px 3px rgba(0,0,0,0.3)"
            justifyContent="center"
          >
            <Text
              as="h3"
              fontSize="lg"
              data-aos={ANIMATION_TYPE}
              data-aos-duration={ANIMATION_DURATION}
            >
              Hello I&apos;m
            </Text>
            <Heading
              as="h1"
              fontSize="6xl"
              mt={6}
              mb={3}
              data-aos={ANIMATION_TYPE}
              data-aos-duration={ANIMATION_DURATION}
              data-aos-delay="100"
            >
              Howard Tai
            </Heading>
            <chakra.h2
              fontSize="3xl"
              color="secondary.400"
              mb="5"
              fontWeight="semibold"
              data-aos={ANIMATION_TYPE}
              data-aos-duration={ANIMATION_DURATION}
              data-aos-delay="100"
            >
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
            </chakra.h2>
            <Text
              mb={6}
              data-aos={ANIMATION_TYPE}
              data-aos-duration={ANIMATION_DURATION}
              data-aos-delay="150"
            >
              I specialise in developing data intensive applications with React (SSR) and improve
              web architecture, facing and tackling challenges in fast-paced start-ups since the
              first day of my job!
            </Text>
            <Button as="a" variant="outline" alignSelf="start" href={`#${SectionId.About}`}>
              See Projects
            </Button>
          </Box>
        </Container>
      </Parallax>
    </Box>
  );
}
