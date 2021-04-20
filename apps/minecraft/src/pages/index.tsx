import React from "react";
import dynamic from "next/dynamic";
import type { NextPage } from "next";

const DynamicGame = dynamic(() => import("@/components/Game"), { ssr: false });

const Home: NextPage = () => (
  <div style={{ height: "900px" }}>
    <DynamicGame />
  </div>
);

export default Home;
