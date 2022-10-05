declare module "react-animated-cursor" {
  type AnimatedCursorProps = {
    innerSize: number;
    outerSize: number;
    color: string;
    outerAlpha: number;
    innerScale: number;
    outerScale: number;
  };

  function AnimatedCursor(props: AnimatedCursorProps): JSX.Element;

  export default AnimatedCursor;
}
