import type React from "react";
import type { ReactNode } from "react";

import Footer from "./Footer";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <>
      <NavBar />
      <main className="mx-auto mt-20 min-h-[calc(100vh-80px)] w-full max-w-5xl px-4">
        {children}
      </main>
      <Footer />
    </>
  );
}
