export interface Photo {
  aspect: string;
  caption: string;
  id: string;
  label: string;
  meta: string;
  tone: number;
}

export const photoData: Photo[] = [
  {
    id: "p01",
    label: "Tioman, 18m",
    caption: "Shoal of yellowtail snapper",
    aspect: "4/3",
    tone: 0,
    meta: "f/8 · 1/125 · 18m · Tioman",
  },
  {
    id: "p02",
    label: "Apo Reef",
    caption: "Sea fan at the wall",
    aspect: "3/4",
    tone: 1,
    meta: "f/5.6 · 1/60 · 22m · Apo Reef",
  },
  {
    id: "p03",
    label: "Koh Tao",
    caption: "A whale shark, briefly",
    aspect: "1/1",
    tone: 2,
    meta: "f/4 · 1/200 · 8m · Koh Tao",
  },
  {
    id: "p04",
    label: "Gili Air",
    caption: "Green turtle, unbothered",
    aspect: "4/3",
    tone: 3,
    meta: "f/6.3 · 1/100 · 12m · Gili Air",
  },
  {
    id: "p05",
    label: "Anilao",
    caption: "Nudibranch, 3mm of joy",
    aspect: "1/1",
    tone: 4,
    meta: "f/22 · 1/250 · 5m · Anilao",
  },
  {
    id: "p06",
    label: "Tioman, surface",
    caption: "Coral garden at dawn",
    aspect: "3/4",
    tone: 0,
    meta: "f/8 · 1/160 · 3m · Tioman",
  },
  {
    id: "p07",
    label: "Sipadan",
    caption: "Barracuda tornado",
    aspect: "4/3",
    tone: 2,
    meta: "f/7.1 · 1/125 · 15m · Sipadan",
  },
  {
    id: "p08",
    label: "Komodo",
    caption: "Manta at cleaning station",
    aspect: "1/1",
    tone: 1,
    meta: "f/5.6 · 1/80 · 10m · Komodo",
  },
  {
    id: "p09",
    label: "Raja Ampat",
    caption: "Wobbegong on the reef",
    aspect: "4/3",
    tone: 3,
    meta: "f/11 · 1/200 · 7m · Raja Ampat",
  },
  {
    id: "p10",
    label: "Pulau Hantu",
    caption: "Night dive — cuttlefish hunting",
    aspect: "3/4",
    tone: 4,
    meta: "f/9 · 1/100 · 6m · Singapore",
  },
  {
    id: "p11",
    label: "Lembeh Strait",
    caption: "Mimic octopus mid-walk",
    aspect: "1/1",
    tone: 2,
    meta: "f/16 · 1/200 · 8m · Lembeh",
  },
  {
    id: "p12",
    label: "Banda Sea",
    caption: "Schooling hammerheads, distant",
    aspect: "4/3",
    tone: 0,
    meta: "f/6.3 · 1/160 · 20m · Banda Sea",
  },
];
