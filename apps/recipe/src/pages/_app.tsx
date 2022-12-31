import type { AppProps } from "next/app"
import Head from "next/head"

import GlobalWrapper from "@/components/GlobalWrapper"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Next.js Template</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <GlobalWrapper>
        <Component {...pageProps} />
      </GlobalWrapper>
    </>
  )
}
