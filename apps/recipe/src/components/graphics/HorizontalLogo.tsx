import { Image } from "@howardism/components-common";

import LOGO_HORIZONTAL from "@/../public/favicon/logo_horizontal.png";
import LOGO_HORIZONTAL_TRANSPARENT from "@/../public/favicon/logo_horizontal_transparent.png";

interface HorizontalLogoProps {
  isTransparent?: boolean;
  size?: number;
}

export default function HorizontalLogo({
  size = 60,
  isTransparent = false,
}: HorizontalLogoProps): JSX.Element {
  return (
    <Image
      alt="logo"
      height={size}
      placeholder="blur"
      src={isTransparent ? LOGO_HORIZONTAL_TRANSPARENT : LOGO_HORIZONTAL}
      width={3 * size}
    />
  );
}
