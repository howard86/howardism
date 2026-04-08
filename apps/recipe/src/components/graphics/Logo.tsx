import { Image } from "@howardism/components-common";
import type React from "react";

import LOGO from "@/../public/favicon/logo.png";
import LOGO_TRANSPARENT from "@/../public/favicon/logo_transparent.png";

interface LogoProps {
  isTransparent?: boolean;
  size?: number;
}

export default function Logo({
  size = 100,
  isTransparent = false,
}: LogoProps): React.JSX.Element {
  return (
    <Image
      alt="logo"
      height={size}
      placeholder="blur"
      src={isTransparent ? LOGO_TRANSPARENT : LOGO}
      width={size}
    />
  );
}
