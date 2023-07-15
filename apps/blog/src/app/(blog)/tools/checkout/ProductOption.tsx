import { memo } from "react"

interface ProductOptionProps {
  min: number
  max: number
}

function ProductOption({ max, min }: ProductOptionProps) {
  return (
    <>
      {new Array(max - min + 1).fill(0).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <option key={index}>{min + index}</option>
      ))}
    </>
  )
}

export default memo(ProductOption)
