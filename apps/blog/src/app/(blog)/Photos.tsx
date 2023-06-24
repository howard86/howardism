import clsx from "clsx"
import Image from "next/image"

import image1 from "@/assets/alexandre-debieve-chip.jpg"
import image2 from "@/assets/carl-heyerdahl-desk.jpg"
import image3 from "@/assets/john-morgan-sudoku.jpg"
import image4 from "@/assets/thisisengineering-raeng-desk.jpg"

const PHOTOS = [image1, image2, image3, image4]

export default function Photos() {
  const rotations = ["rotate-2", "-rotate-2", "rotate-2", "rotate-2", "-rotate-2"]

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {PHOTOS.map((image, imageIndex) => (
          <div
            key={image.src}
            className={clsx(
              "relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-base-100 sm:w-72 sm:rounded-2xl",
              rotations[imageIndex % rotations.length]
            )}
          >
            <Image
              src={image}
              alt={image.src}
              className="absolute inset-0 h-full w-full object-cover"
              sizes="(min-width: 640px) 18rem, 11rem"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
