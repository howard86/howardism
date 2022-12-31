import { useEffect, useState } from "react"
import throttle from "lodash.throttle"

const useThrottledScroll = (
  callback: (previousScrollTop: number, currentScrollTop: number) => void,
  wait: number
): void => {
  const [, setScrollPosition] = useState(0)
  let previousScrollTop = 0

  const handleDocumentScroll = () => {
    const { scrollTop: currentScrollTop } = document.documentElement || document.body

    setScrollPosition((previousPosition) => {
      previousScrollTop = previousPosition
      return currentScrollTop
    })

    callback(previousScrollTop, currentScrollTop)
  }

  const handleDocumentScrollThrottled = throttle(handleDocumentScroll, wait)

  useEffect(() => {
    window.addEventListener("scroll", handleDocumentScrollThrottled)
    return () => window.removeEventListener("scroll", handleDocumentScrollThrottled)
  }, [handleDocumentScrollThrottled])
}

export default useThrottledScroll
