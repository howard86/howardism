import React, { FC, useState } from "react";
import { BoxProps, useBox } from "@react-three/cannon";
import type { ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events";
import create, { State } from "zustand";
import { nanoid } from "nanoid";
import { useTexture } from "@react-three/drei";

interface CubeStore extends State {
  cubes: (Element | JSX.Element)[];
  addCube: (x: number, y: number, z: number) => void;
}

export const useCubeStore = create<CubeStore>((set) => ({
  cubes: [],
  addCube: (x, y, z) =>
    set((state) => ({
      cubes: [...state.cubes, <Cube key={nanoid()} position={[x, y, z]} />],
    })),
}));

const Cube: FC<BoxProps> = (props) => {
  const [hover, setHover] = useState<number | null>(null);
  const addCube = useCubeStore((state) => state.addCube);
  const [ref] = useBox(() => ({
    type: "Static",
    ...props,
  }));

  const texture = useTexture("/texture/dirt.jpg");

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (event.faceIndex) {
      setHover(Math.floor(event.faceIndex / 2));
    }
  };

  const handlePointerOut = () => {
    setHover(null);
  };

  const handleOnClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (!event.faceIndex || !ref.current) {
      return;
    }

    const faceIndex = Math.floor(event.faceIndex / 2);
    const { x, y, z } = ref.current.position;

    switch (faceIndex) {
      case 4:
        addCube(x, y, z + 1);
        return;

      case 2:
        addCube(x, y + 1, z);
        return;

      case 1:
        addCube(x - 1, y, z);
        return;

      case 5:
        addCube(x, y, z - 1);
        return;

      case 3:
        addCube(x, y - 1, z);
        return;

      default:
        addCube(x + 1, y, z);
        return;
    }
  };

  return (
    <mesh
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleOnClick}
      castShadow
    >
      {[...Array(6)].map((_, index) => (
        <meshStandardMaterial
          key={index}
          attachArray="material"
          map={texture}
          color={hover === index ? "gray" : "white"}
        />
      ))}
      <boxBufferGeometry attach="geometry" />
    </mesh>
  );
};

export default Cube;
