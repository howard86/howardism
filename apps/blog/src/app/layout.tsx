import type { ChildrenProps } from "react"
import Script from "next/script"

import "focus-visible"

import { Footer } from "./Footer"
import { Header } from "./Header"

import "../styles/globals.css"

export default function RootLayout({ children }: ChildrenProps) {
  return (
    <html lang="zh-Hant-TW" className="h-full scroll-smooth antialiased">
      <body className="flex h-full flex-col bg-zinc-50 dark:bg-black">
        <div className="fixed inset-0 flex justify-center sm:px-8">
          <div className="flex w-full max-w-7xl lg:px-8">
            <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
          </div>
        </div>
        <div className="relative flex flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </div>
        <Script id="dark-mode-script" strategy="beforeInteractive">
          {`
            let darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

            updateMode()
            darkModeMediaQuery.addEventListener('change', updateModeWithoutTransitions)
            window.addEventListener('storage', updateModeWithoutTransitions)

            function updateMode() {
                let isSystemDarkMode = darkModeMediaQuery.matches
                let isDarkMode = window.localStorage.isDarkMode === 'true' || (!('isDarkMode' in window.localStorage) && isSystemDarkMode)

                if (isDarkMode) {
                document.documentElement.classList.add('dark')
                } else {
                document.documentElement.classList.remove('dark')
                }

                if (isDarkMode === isSystemDarkMode) {
                delete window.localStorage.isDarkMode
                }
            }

            function disableTransitionsTemporarily() {
                document.documentElement.classList.add('[&_*]:!transition-none')
                window.setTimeout(() => {
                document.documentElement.classList.remove('[&_*]:!transition-none')
                }, 0)
            }

            function updateModeWithoutTransitions() {
                disableTransitionsTemporarily()
                updateMode()
            }
            `}
        </Script>
      </body>
    </html>
  )
}
