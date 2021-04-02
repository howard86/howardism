import React, { FC } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import { Vector3 } from "three";
import CustomCamera from "./Camera";
import Ground from "./Ground";
import Player from "./Player";

const Game: FC = () => {
  return (
    <Canvas>
      <CustomCamera fov={50} />
      <Sky sunPosition={new Vector3(100, 10, 100)} />
      <ambientLight intensity={0.3} />
      <pointLight intensity={0.8} position={[100, 100, 100]} castShadow />
      <Physics>
        <Ground />
        <Player />
      </Physics>
    </Canvas>
  );
};

export default Game;
