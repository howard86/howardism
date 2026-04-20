/* eslint-disable react/no-unknown-property */
import { type Triplet, useBox } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber/dist/declarations/src/core/events";
import { nanoid } from "nanoid";
import { type ReactNode, useState } from "react";
import type { BufferGeometry, Mesh } from "three";
import { create } from "zustand";

import { resolveAdjacentCell, resolveHoverSlot } from "./faceAdjacency";

interface CubeStore {
  addCube: (x: number, y: number, z: number) => void;
  cubes: ReactNode[];
}

export const useCubeStore = create<CubeStore>((set) => ({
  cubes: [],
  addCube: (x, y, z) =>
    set((state) => ({
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      cubes: [...state.cubes, <Cube key={nanoid()} position={[x, y, z]} />],
    })),
}));

interface CubeProps {
  position: Triplet;
}

export default function Cube({ position }: CubeProps) {
  const [hover, setHover] = useState<number | null>(null);
  const addCube = useCubeStore((state) => state.addCube);
  const [ref] = useBox<Mesh<BufferGeometry>>(() => ({
    type: "Static",
    position,
  }));

  const texture = useTexture("/texture/dirt.jpg");

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const slot = resolveHoverSlot(event.faceIndex);
    if (slot !== null) {
      setHover(slot);
    }
  };

  const handlePointerOut = () => {
    setHover(null);
  };

  const handleOnClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (!ref.current) {
      return;
    }

    const { x, y, z } = ref.current.position;
    const cell = resolveAdjacentCell(event.faceIndex, [x, y, z]);
    if (cell === null) {
      return;
    }

    const [nx, ny, nz] = cell;
    addCube(nx, ny, nz);
  };

  return (
    <mesh
      castShadow
      onClick={handleOnClick}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      ref={ref}
    >
      {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
      {[...new Array(6)].map((_, index) => (
        <meshStandardMaterial
          attach={`material-${index}`}
          color={hover === index ? "gray" : "white"}
          key={nanoid()}
          map={texture}
        />
      ))}
      <boxGeometry attach="geometry" />
    </mesh>
  );
}
