import { ChildrenProps } from "react"

import { Container } from "./Container"

interface SimpleLayoutProps extends Partial<ChildrenProps> {
  title: string
  intro: string
}

export function SimpleLayout({ title, intro, children }: SimpleLayoutProps) {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-base-content sm:text-5xl">{title}</h1>
        <p className="mt-6 text-base text-neutral-content">{intro}</p>
      </header>
      {children && <div className="mt-16 sm:mt-20">{children}</div>}
    </Container>
  )
}
