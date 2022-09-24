import type { NextPage } from "next";
import dynamic from "next/dynamic";
const DynamicGame = dynamic(() => import("@/components/Game"), { ssr: false });

const Home: NextPage = () => (
  <div style={{ height: "900px" }}>
    <DynamicGame />
  </div>
);

export default Home;
