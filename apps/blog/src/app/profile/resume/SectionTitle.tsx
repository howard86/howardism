import { Merriweather_Sans } from "@next/font/google"

export const titleFont = Merriweather_Sans({
  weight: ["700"],
  style: "normal",
})

export interface SectionTitleProps {
  text: string
}

export function SectionTitle({ text }: SectionTitleProps) {
  return (
    <h2 className={`text-md font-bold uppercase text-zinc-800 ${titleFont.className}`}>{text}</h2>
  )
}
