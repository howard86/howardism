import React, { FC } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useSphere } from "@react-three/cannon";

const Player: FC = (props) => {
  const { camera } = useThree();
  const [ref] = useSphere(() => ({
    mass: 1,
    type: "Dynamic",
    position: [0, 10, 0],
    ...props,
  }));

  useFrame(() => {
    if (ref.current) {
      camera.position.copy(ref.current.position);
    }
  });

  return (
    <>
      <PointerLockControls />
      <mesh ref={ref} />
    </>
  );
};

export default Player;
