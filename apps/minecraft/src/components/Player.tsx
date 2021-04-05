import React, { FC, useEffect, useRef } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useSphere } from "@react-three/cannon";
import usePlayerControls from "@/hooks/usePlayerControls";
import { Vector3 } from "three";

const SPEED = 5;

const Player: FC = (props) => {
  const { camera } = useThree();
  const { moveForward, moveBackward, moveLeft, moveRight, jump } = usePlayerControls();
  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: "Dynamic",
    position: [0, 10, 0],
    ...props,
  }));

  useFrame(() => {
    if (ref.current) {
      camera.position.copy(ref.current.position);
    }
    const direction = new Vector3();

    const frontVector = new Vector3(0, 0, Number(moveBackward) - Number(moveForward));
    const sideVector = new Vector3(Number(moveLeft) - Number(moveRight), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(camera.rotation);

    api.velocity.set(direction.x, velocity.current[1], direction.z);

    if (jump && Math.abs(velocity.current[1]) < 0.05) {
      api.velocity.set(velocity.current[0], 10, velocity.current[2]);
    }
  });

  const velocity = useRef([0, 0, 0]);

  useEffect(() => {
    api.velocity.subscribe((v) => {
      velocity.current = v;
    });
  }, []);

  return (
    <>
      <PointerLockControls />
      <mesh ref={ref} />
    </>
  );
};

export default Player;
