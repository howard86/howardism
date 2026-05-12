import { getSlicedArticles } from "./articles/service";
import { Elsewhere } from "./elsewhere";
import { FeaturedArticles } from "./featured-articles";
import { Hero } from "./hero";
import Newsletter from "./news-letter";
import Photos from "./photos";
import Resume from "./resume";

export default async function Home() {
  const articles = await getSlicedArticles(4);

  return (
    <>
      <Hero articles={articles} />
      <Photos />
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 16px 80px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 48,
        }}
      >
        <div
          className="home-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 280px",
            gap: 40,
            alignItems: "start",
          }}
        >
          <FeaturedArticles articles={articles} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Newsletter />
            <Resume />
            <Elsewhere />
          </div>
        </div>
      </div>
    </>
  );
}
