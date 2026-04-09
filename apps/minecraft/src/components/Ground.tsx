/* eslint-disable react/no-unknown-property */
import { type PlaneProps, usePlane } from "@react-three/cannon";
import { useTexture } from "@react-three/drei";
import { type BufferGeometry, type Mesh, RepeatWrapping } from "three";

export default function Ground() {
  const [ref] = usePlane<Mesh<BufferGeometry>>(
    (): PlaneProps => ({
      rotation: [-Math.PI / 2, 0, 0],
    })
  );
  const texture = useTexture("/texture/grass.jpg");
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(240, 240);

  return (
    <mesh receiveShadow ref={ref}>
      <planeGeometry args={[1009, 1000]} attach="geometry" />
      <meshStandardMaterial attach="material" map={texture} />
    </mesh>
  );
}
