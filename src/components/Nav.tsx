import React, { FC, memo, useCallback } from "react";
import styled from "styled-components";
import { useRouter } from "next/router";
import { Box } from "rebass/styled-components";

import { NAV_OPTIONS } from "@/constants/nav";
import RouteLink from "./common/RouteLink";

const StyledLink = styled(RouteLink)`
  text-decoration-line: none;
  font-weight: ${(props) => (props.selected ? "bold" : "inherit")};
  color: ${(props) => props.theme.colors.terraCottaDark};

  &:hover {
    color: ${(props) => props.theme.colors.terraCotta};
  }
`;

const Nav: FC = () => {
  const route = useRouter();
  const isSelected = useCallback((href: string) => route.pathname === href, [route.pathname]);

  return (
    <Box as="nav" sx={{ textAlign: "center" }}>
      <Box as="ul" p={1}>
        {NAV_OPTIONS.map(({ title, href }) => (
          <Box as="li" key={title} my={1}>
            <StyledLink href={href} selected={isSelected(href)}>
              {title}
            </StyledLink>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default memo(Nav);
