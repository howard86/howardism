import React, { FC, memo } from "react";
import { Box, Flex } from "rebass/styled-components";
import styled from "styled-components";

import Nav from "./Nav";
import Profile from "./Profile";

const StyledFlex = styled(Flex)`
  flex-direction: column;
  border-right-width: 1px;
  border-right-style: solid;
  border-right-color: lightgray;
  min-height: 80vh;
`;

const SideBar: FC = () => (
  <StyledFlex py={[3, 4]} width={1 / 3}>
    <Box alignSelf="flex-end" mx={[3, 4]}>
      <Profile />
      <Nav />
    </Box>
  </StyledFlex>
);

export default memo(SideBar);
