import { createGlobalStyle, css } from "styled-components";
import normalizedStyle from "./normalized";
import theme from "./theme";

const globalStyle = css`
  ${normalizedStyle}

  html,
  body {
    padding: 0;
    margin: 0;
    background-color: ${theme.colors.eggshellLight};
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
    color: inherit;
    text-decoration-line: none;
  }

  h1,
  h2,
  h3,
  h4,
  h5 {
    font-family: ${theme.fonts.heading};
    font-weight: ${theme.fontWeights.heading};
    line-height: ${theme.lineHeights.heading};
  }

  * {
    box-sizing: border-box;
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
