import { getSlicedArticles } from "./articles/service";
import CoverCarousel from "./cover-carousel";
import { Elsewhere } from "./elsewhere";
import { FeaturedArticles } from "./featured-articles";
import { HeroDisc } from "./hero-disc";
import Resume from "./resume";

export default async function Home() {
  const articles = await getSlicedArticles(4);

  return (
    <>
      <HeroDisc />
      <CoverCarousel />
      <div className="mx-auto grid max-w-[720px] grid-cols-1 gap-12 px-4 pt-12 pb-20">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,1fr)_280px]">
          <FeaturedArticles articles={articles} />
          <div className="flex flex-col gap-5">
            <Resume />
            <Elsewhere />
          </div>
        </div>
      </div>
    </>
  );
}
