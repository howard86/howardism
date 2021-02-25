import { createGlobalStyle, css } from "styled-components";
import normalizedStyle from "./normalized";
import theme from "./theme";

const globalStyle = css`
  ${normalizedStyle}

  html,
  body {
    padding: 0;
    margin: 0;
    background-color: ${theme.colors.eggshell[0]};
    color: ${theme.colors.independence};
  }

  p {
    word-wrap: normal;
    font-family: ${theme.fonts.body};
    font-weight: ${theme.fontWeights.body};
    line-height: ${theme.lineHeights.body};
  }

  a,
  a:visited,
  a:hover,
  a:active {
    color: ${theme.colors.terraCotta[1]};
    text-decoration-line: none;
  }

  a:hover {
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.terraCotta[0]};
  }

  li {
    list-style: none;
  }

  ul {
    padding-inline-start: 0;
  }
`;

const GlobalStyle = createGlobalStyle`
  ${globalStyle}
`;

export default GlobalStyle;
