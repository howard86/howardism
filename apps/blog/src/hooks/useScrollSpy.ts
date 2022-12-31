import { useEffect, useState } from "react"
import throttle from "lodash.throttle"

export interface UseScrollSpyParams {
  defaultSectionId?: string
  sectionIds: string[]
  offsetPx?: number
  throttleMs?: number
}

// Inspired by https://github.com/Purii/react-use-scrollspy
export default function useScrollSpy({
  sectionIds,
  defaultSectionId = sectionIds[0],
  offsetPx = 0,
  throttleMs = 100,
}: UseScrollSpyParams) {
  const [activeSectionId, setActiveSectionId] = useState(defaultSectionId)

  useEffect(() => {
    const handle = throttle(() => {
      for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId)

        const boundary = section?.getBoundingClientRect()

        if (boundary && boundary.top + boundary.height > offsetPx) {
          setActiveSectionId(sectionId)
          break
        }
      }
    }, throttleMs)

    window.addEventListener("scroll", handle)

    return () => {
      window.removeEventListener("scroll", handle)
    }
  }, [offsetPx, sectionIds, throttleMs])

  return activeSectionId
}
