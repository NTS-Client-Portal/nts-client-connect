import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/*
          Favicon setup. Modern browsers pick up the SVG (crisp at any
          size); the .ico is a fallback for older browsers that ignore
          type="image/svg+xml".
        */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#1d4ed8" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
