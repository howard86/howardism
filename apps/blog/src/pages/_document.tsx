import Document, { Head, Html, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render(): JSX.Element {
    return (
      <Html lang="en">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap"
            rel="stylesheet"
          />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
