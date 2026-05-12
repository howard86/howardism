import { DiscPageHeader } from "@/components/howardism/DiscPageHeader";
import { photoData } from "@/components/howardism/photoData";

import { PhotoGrid } from "./PhotoGrid";

export const metadata = {
  title: "Photos · Howardism",
  description: "Field notes, mostly blurry.",
};

export default function PhotosPage() {
  return (
    <div>
      <DiscPageHeader
        data={[
          ["Medium", "Underwater"],
          ["Camera", "Olympus TG-6"],
          ["Dives", String(photoData.length)],
          ["Status", "Ongoing"],
        ]}
        number="03"
        plate="Plate III"
        title="Field notes,"
        titleAccent="mostly blurry."
        volume="Photography · Ocean work"
      />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 32px" }}>
        <PhotoGrid photos={photoData} />
      </div>
    </div>
  );
}
