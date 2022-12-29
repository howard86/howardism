import { ChildrenProps } from "react"

import Footer from "./Footer"
import Header from "./Header"

export default function Layout({ children }: ChildrenProps) {
  return (
    <div className="relative">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
