import { Camera, useThree } from "@react-three/fiber";
import type { PerspectiveCameraProps } from "@react-three/fiber/dist/declarations/src/three-types";
import React, { FC, useEffect, useRef } from "react";

const CustomCamera: FC<PerspectiveCameraProps> = (props) => {
  const ref = useRef<Camera>();
  const set = useThree((state) => state.set);

  useEffect(() => {
    if (typeof ref.current !== "undefined") {
      set({ camera: ref.current });
    }
  }, [set]);

  return <perspectiveCamera ref={ref} {...props} />;
};

export default CustomCamera;
