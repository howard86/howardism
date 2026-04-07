import { memo } from "react";

interface ProductOptionProps {
  max: number;
  min: number;
}

function ProductOption({ max, min }: ProductOptionProps) {
  return (
    <>
      {new Array(max - min + 1).fill(0).map((_, index) => {
        const value = min + index;
        return <option key={`qty-${value}`}>{value}</option>;
      })}
    </>
  );
}

export default memo(ProductOption);
