import LOGO from "@/../public/favicon/logo.png";
import LOGO_TRANSPARENT from "@/../public/favicon/logo_transparent.png";

import Image from "../Image";

interface LogoProps {
  size?: number;
  isTransparent?: boolean;
}

const Logo = ({ size = 100, isTransparent = false }: LogoProps): JSX.Element => (
  <Image
    src={isTransparent ? LOGO_TRANSPARENT : LOGO}
    placeholder="blur"
    alt="logo"
    height={size}
    width={size}
  />
);

export default Logo;
