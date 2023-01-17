import type { ReactNode } from "react"
import type { DivProps } from "react-html-props"

interface FormSectionContainerProps extends DivProps {
  heading: string
  subheading: string
  children: ReactNode
}

export default function FormSectionContainer({
  heading,
  subheading,
  children,
}: FormSectionContainerProps) {
  return (
    <div className="space-y-6 bg-white py-6 px-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium leading-6 text-zinc-900">{heading}</h2>
          <p className="mt-1 text-sm text-zinc-500">{subheading}</p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-6">{children}</div>
    </div>
  )
}
