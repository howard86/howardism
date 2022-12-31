import { ReactNode } from "react"

type HeadMockProps = { children: ReactNode }

export default function HeadMock({ children }: HeadMockProps) {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>
}
