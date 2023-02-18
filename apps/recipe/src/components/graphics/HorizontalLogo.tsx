import { Image } from "@howardism/components-common"

import LOGO_HORIZONTAL from "@/../public/favicon/logo_horizontal.png"
import LOGO_HORIZONTAL_TRANSPARENT from "@/../public/favicon/logo_horizontal_transparent.png"

interface HorizontalLogoProps {
  size?: number
  isTransparent?: boolean
}

export default function HorizontalLogo({
  size = 60,
  isTransparent = false,
}: HorizontalLogoProps): JSX.Element {
  return (
    <Image
      src={isTransparent ? LOGO_HORIZONTAL_TRANSPARENT : LOGO_HORIZONTAL}
      placeholder="blur"
      alt="logo"
      height={size}
      width={3 * size}
    />
  )
}
