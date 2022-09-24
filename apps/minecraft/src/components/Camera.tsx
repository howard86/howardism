import { useThree } from "@react-three/fiber";
import type { PerspectiveCameraProps } from "@react-three/fiber/dist/declarations/src/three-types";
import { FC, useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";

const CustomCamera: FC<PerspectiveCameraProps> = (props) => {
  const ref = useRef<PerspectiveCamera>(null);
  const set = useThree((state) => state.set);

  useEffect(() => {
    if (ref.current !== null) {
      set({ camera: ref.current });
    }
  }, [set]);

  return <perspectiveCamera ref={ref} {...props} />;
};

export default CustomCamera;
