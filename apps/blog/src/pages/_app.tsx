import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { DefaultSeo } from "next-seo";

import { Footer } from "@/components/template/Footer";
import { Header } from "@/components/template/Header";
import DEFAULT_SEO from "@/constants/seo";
import usePrevious from "@/hooks/usePrevious";

import "focus-visible";

import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const previousPathname = usePrevious(router.pathname);

  return (
    <>
      <DefaultSeo {...DEFAULT_SEO} />
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <div className="relative">
        <Header />
        <main>
          <Component previousPathname={previousPathname} {...pageProps} />
        </main>
        <Footer />
      </div>
    </>
  );
}
