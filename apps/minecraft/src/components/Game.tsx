/* eslint-disable react/no-unknown-property */
import { Physics } from "@react-three/cannon";
import { Sky } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";

import CustomCamera from "./Camera";
import Cube, { useCubeStore } from "./Cube";
import Ground from "./Ground";
import Player from "./Player";

export default function Game() {
  const cubes = useCubeStore((state) => state.cubes);

  return (
    <Canvas gl={{ alpha: false }} shadows>
      <CustomCamera fov={50} />
      <Sky sunPosition={new Vector3(100, 10, 100)} />
      <ambientLight intensity={0.3} />
      <pointLight castShadow intensity={0.8} position={[100, 100, 100]} />
      <Physics gravity={[0, -30, 0]}>
        <>
          <Ground />
          <Player />
          <Cube position={[0, 0.5, -10]} />
          {cubes.map((cube) => cube)}
        </>
      </Physics>
    </Canvas>
  );
}
