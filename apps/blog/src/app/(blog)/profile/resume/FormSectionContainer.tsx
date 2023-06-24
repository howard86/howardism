import type { ReactNode } from "react"

export interface FormSectionContainerProps {
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
    <div className="space-y-6 bg-base-100 px-4 py-6 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium leading-6 text-base-content">{heading}</h2>
          <p className="mt-1 text-sm text-base-content/60">{subheading}</p>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-6">{children}</div>
    </div>
  )
}
