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

  * {
    box-sizing: border-box;
  }

  li {
    list-style: none;
  }
`;

const GlobalStyle = createGlobalStyle`${globalStyle}`;

export default GlobalStyle;
