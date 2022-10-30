import { ChildrenProps } from "react";

import Footer from "./Footer";
import Header from "./Header";

export default function Layout({ children }: ChildrenProps) {
  return (
    <div>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </div>
  );
}
