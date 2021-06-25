import React from "react";

import { LOGO, LOGO_TRANSPARENT } from "@/constants/image";

import Image from "../Image";

interface LogoProps {
  size?: number;
  isTransparent?: boolean;
}

const Logo = ({ size = 100, isTransparent = false }: LogoProps): JSX.Element => (
  <Image
    src={isTransparent ? LOGO_TRANSPARENT : LOGO}
    layout="fixed"
    alt="logo"
    height={size}
    width={size}
  />
);

export default Logo;
