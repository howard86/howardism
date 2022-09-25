import { Image } from "@howardism/components-common";

import LOGO from "@/../public/favicon/logo.png";
import LOGO_TRANSPARENT from "@/../public/favicon/logo_transparent.png";

interface LogoProps {
  size?: number;
  isTransparent?: boolean;
}

export default function Logo({ size = 100, isTransparent = false }: LogoProps): JSX.Element {
  return (
    <Image
      src={isTransparent ? LOGO_TRANSPARENT : LOGO}
      placeholder="blur"
      alt="logo"
      height={size}
      width={size}
    />
  );
}
