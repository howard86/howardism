"use client";

import { useTweaks } from "@/components/tweaks/tweaks-provider";

import type { ArticleEntity, Normalise } from "./articles/service";
import { HeroClassic } from "./hero-classic";
import { HeroDisc } from "./hero-disc";
import { HeroIndex } from "./hero-index";
import { HeroStatement } from "./hero-statement";

interface HeroProps {
  articles: Normalise<ArticleEntity>;
}

export function Hero({ articles }: HeroProps) {
  const { state } = useTweaks();

  switch (state.homeLayout) {
    case "classic":
      return <HeroClassic />;
    case "statement":
      return <HeroStatement />;
    case "index":
      return <HeroIndex articles={articles} />;
    default:
      return <HeroDisc />;
  }
}
