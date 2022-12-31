import { useEffect, useState } from "react"
import throttle from "lodash.throttle"

export default function useHasScrolled({
  offsetPx = 0,
  throttleMs = 100,
  defaultScrolled = false,
}) {
  const [isScrolled, setScrolled] = useState(defaultScrolled)

  useEffect(() => {
    const changeBackground = throttle(() => setScrolled(window.scrollY > offsetPx), throttleMs)

    window.addEventListener("scroll", changeBackground)

    return () => window.removeEventListener("scroll", changeBackground)
  }, [offsetPx, throttleMs])

  return isScrolled
}
