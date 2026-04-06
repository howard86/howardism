import { Merriweather_Sans } from "next/font/google";

export const titleFont = Merriweather_Sans({
  weight: ["700"],
  style: "normal",
  subsets: ["latin"],
});

export interface SectionTitleProps {
  text: string;
}

export function SectionTitle({ text }: SectionTitleProps) {
  return (
    <h2
      className={`font-bold text-md text-zinc-800 uppercase ${titleFont.className}`}
    >
      {text}
    </h2>
  );
}
