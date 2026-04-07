import { Image } from "@howardism/components-common";
import type { StaticImageData } from "next/image";
import NextLink from "next/link";

interface RecipeCardProps {
  description: string;
  id: number;
  imageUrl: string | StaticImageData;
  timestamp: string;
  title: string;
}

const getDayDiff = (timestamp: string): number => {
  const diff = Date.now() - new Date(timestamp).getTime();
  return Math.floor(diff / 1000 / 60 / 60 / 24);
};

export default function RecipeCard({
  id,
  title,
  description,
  timestamp,
  imageUrl,
}: RecipeCardProps) {
  const daysPassed = getDayDiff(timestamp);

  return (
    <article className="relative rounded-lg bg-[#f7dfb7] p-4">
      <time
        className="absolute top-2 left-2 z-[2] rounded-md bg-[#a73f3f] px-2 py-0.5 font-semibold text-sm text-white shadow-lg"
        dateTime={timestamp}
      >
        {daysPassed > 0 ? `${daysPassed} days ago` : "New!"}
      </time>
      <Image
        alt={`recipe photo of ${title}`}
        height={300}
        src={imageUrl}
        style={{ objectFit: "cover" }}
        width={400}
      />
      <h3 className="my-2 font-semibold text-[#1c0303] text-lg">
        <NextLink href={`/recipe/${id}`}>{title}</NextLink>
      </h3>
      <p>{description}</p>
    </article>
  );
}
