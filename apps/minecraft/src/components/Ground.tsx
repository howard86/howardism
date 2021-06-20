import { PlaneProps, usePlane } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import React, { FC } from "react";
import { RepeatWrapping } from "three";

const Ground: FC<PlaneProps> = (props) => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    ...props,
  }));
  const texture = useTexture("/texture/grass.jpg");
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(240, 240);

  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry attach="geometry" args={[1009, 1000]} />
      <meshStandardMaterial map={texture} attach="material" />
    </mesh>
  );
};

export default Ground;
