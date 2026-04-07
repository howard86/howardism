import { Image } from "@howardism/components-common";
import type { StaticImageData } from "next/image";

import backgroundImage from "@/../public/assets/background.jpg";

import Triangle from "./Triangle";

interface LandingProps {
  imageUrl: string | StaticImageData;
}

export default function Landing({ imageUrl }: LandingProps) {
  const onClick = () => {
    // TODO: add scrolling effect to next heading
    console.info("clicked!");
  };

  return (
    <div className="relative flex min-h-screen flex-col text-white">
      <Triangle style={{ zIndex: 1 }} />
      <div className="absolute inset-0 overflow-hidden">
        <Image
          alt="Landing page background"
          fill
          objectFit="cover"
          objectPosition="center"
          placeholder="blur"
          priority
          quality={50}
          src={backgroundImage}
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
      <div className="relative z-10 mx-8 my-12 flex flex-col items-center gap-10">
        <div className="my-4 w-[90%] sm:w-80">
          <h1 className="font-bold text-2xl">Check the BEST Recipe</h1>
        </div>
        <div className="my-4 w-[90%] sm:w-80">
          <Image
            alt="demo-recipe"
            className="rounded-lg shadow-lg"
            height={218}
            priority
            src={imageUrl}
            style={{
              borderRadius: "0.5rem",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            }}
            width={320}
          />
        </div>
        <div
          className="my-4 w-[90%] rounded-lg p-4 shadow-lg sm:w-80"
          style={{
            background: "linear-gradient(to right, #a73f3f, #1c0303)",
          }}
        >
          <h2 className="font-bold text-xl">SHARE YOURS, TOO!</h2>
          <p className="mt-4 mb-8">
            This is a recipe collection for home-made goodies
          </p>
          <button
            className="ml-2 rounded-lg bg-[#c8871e] px-4 py-2 font-medium text-white transition-colors hover:bg-[#e1a037]"
            onClick={onClick}
            type="button"
          >
            LEARN MORE
          </button>
        </div>
      </div>
    </div>
  );
}
