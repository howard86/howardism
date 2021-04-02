import React, { FC } from "react";
import dynamic from "next/dynamic";

const DynamicGame = dynamic(() => import("@/components/Game"), { ssr: false });

const Home: FC = () => <DynamicGame />;

export default Home;
