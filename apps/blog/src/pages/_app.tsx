import { LazyMotion } from "framer-motion";
import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import Cursor from "@/components/animations/Cursor";
import Layout from "@/components/layout/Layout";
import DEFAULT_SEO from "@/constants/seo";

import "@/styles/globals.css";

const loadFeatures = () => import("@/utils/motion-features").then((res) => res.default);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo {...DEFAULT_SEO} />
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <LazyMotion features={loadFeatures} strict>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Cursor />
      </LazyMotion>
    </>
  );
}
