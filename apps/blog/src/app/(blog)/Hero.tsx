"use client";

import { useTweaks } from "@/components/tweaks/TweaksProvider";

import type { ArticleEntity, Normalise } from "./articles/service";
import { HeroClassic } from "./HeroClassic";
import { HeroDisc } from "./HeroDisc";
import { HeroIndex } from "./HeroIndex";
import { HeroStatement } from "./HeroStatement";

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
