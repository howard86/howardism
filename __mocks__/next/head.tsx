import { ReactNode } from "react";

type HeadMockProps = { children: ReactNode };

const HeadMock = ({ children }: HeadMockProps) => <>{children}</>;

export default HeadMock;
