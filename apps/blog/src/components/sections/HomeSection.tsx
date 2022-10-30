import { useRef } from "react";
import { m as motion, useInView, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/future/image";

import coverPhoto from "@/../public/cover.jpg";
import { SectionId } from "@/constants/nav";

import SlideBox from "../animations/SlideBox";
import WavyText from "../animations/WavyText";

const descriptions = ["Web Developer", "Lifelong Learner", "Mathemachicken Lover!"];

const DynamicReactTyped = dynamic(() => import("react-typed"));

export default function HomeSection() {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: false });
  const { scrollYProgress } = useScroll({ offset: ["start", "100vh"] });
  const filter = useTransform(scrollYProgress, (value) =>
    value ? `blur(${4 * value}px) brightness(${100 - 95 * value}%)` : "none"
  );
  const y = useTransform(scrollYProgress, (value) => Math.min(640 * value + 145, 340));

  return (
    <section id={SectionId.Home} className="relative">
      <motion.div
        className="absolute inset-0 mx-auto h-screen w-full max-w-[76rem]"
        style={{ filter }}
      >
        <Image
          alt="lakeside views"
          src={coverPhoto}
          className="object-cover object-[38%_bottom] brightness-75 dark:brightness-50"
          fill
          priority
        />
      </motion.div>
      <motion.div
        className="text-shadow relative z-20 mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 overflow-hidden py-12 px-4 text-white/90"
        style={{ y }}
      >
        <h3 className="text-lg">
          <WavyText text="Hello I'm" />
        </h3>
        <h1 className="text-4xl font-bold leading-5 md:text-5xl">
          <WavyText text="Howard Tai" delay={0.6} />
        </h1>
        <h2 ref={ref} className="text-2xl font-semibold text-teal-500 md:text-3xl">
          <span className="sr-only">{descriptions.join(", ")}</span>
          {inView && (
            <DynamicReactTyped
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
        </h2>
        <SlideBox y={10} delay={1.6}>
          <p className="md:text-lg">
            I specialise in developing data intensive applications with React (SSR) and improve web
            architecture, facing and tackling challenges in fast-paced start-ups since the first day
            of my job!
          </p>
        </SlideBox>
      </motion.div>
    </section>
  );
}
