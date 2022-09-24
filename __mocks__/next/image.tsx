import { ImageProps } from "next/image";

// eslint-disable-next-line @next/next/no-img-element
const ImageMock = (props: ImageProps) => <img alt={props.alt} />;

export default ImageMock;
