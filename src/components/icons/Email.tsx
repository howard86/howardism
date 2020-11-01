import React, { FC, memo } from "react";
import { BoxProps, Link } from "rebass/styled-components";
import { EMAIL_URL } from "@/constants/link";
import Svg from "./Svg";

const Email: FC<BoxProps> = (props) => (
  <Link href={EMAIL_URL} target="_blank">
    <Svg {...props}>
      <path
        fill="currentColor"
        d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"
      />
    </Svg>
  </Link>
);

export default memo(Email);
