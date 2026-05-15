import { getSlicedArticles } from "./articles/service";
import CoverCarousel from "./cover-carousel";
import { FeaturedArticles } from "./featured-articles";
import { HeroDisc } from "./hero-disc";
import Resume from "./resume";

// Decorative cover thumbnails ride the top of "Plate I · Surface".
const COVER_THUMB_COUNT = 5;
// Reading cards under the band. ~12 covers the most recent publish batch
// or two so the cadence is honest, not just the latest five.
const RECENT_CARDS_COUNT = 12;

export default async function Home() {
  const recent = await getSlicedArticles(RECENT_CARDS_COUNT);

  return (
    <>
      <HeroDisc />
      <CoverCarousel articleCount={COVER_THUMB_COUNT} />
      <div className="mx-auto grid max-w-[720px] grid-cols-1 gap-12 px-4 pt-12 pb-20">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[minmax(0,1fr)_280px]">
          <FeaturedArticles articles={recent} />
          <div className="md:sticky md:top-8">
            <Resume />
          </div>
        </div>
      </div>
    </>
  );
}
