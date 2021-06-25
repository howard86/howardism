import React from "react";

import { LOGO_HORIZONTAL, LOGO_HORIZONTAL_TRANSPARENT } from "@/constants/image";

import Image from "../Image";

interface HorizontalLogoProps {
  size?: number;
  isTransparent?: boolean;
}

const HorizontalLogo = ({ size = 60, isTransparent = false }: HorizontalLogoProps): JSX.Element => (
  <Image
    src={isTransparent ? LOGO_HORIZONTAL_TRANSPARENT : LOGO_HORIZONTAL}
    layout="fixed"
    alt="logo"
    height={size}
    width={3 * size}
  />
);

export default HorizontalLogo;
