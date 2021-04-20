import React from "react";
import type { NextPage } from "next";
import Intro from "@/components/Intro";
import Landing from "@/components/Landing";

const Home: NextPage = () => (
  <>
    <Landing />
    <Intro />
  </>
);

export default Home;
