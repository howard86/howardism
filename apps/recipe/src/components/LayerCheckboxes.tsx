import React, { ChangeEvent, FC, memo, useState } from "react";
import { Checkbox, VStack } from "@chakra-ui/react";

interface LayerCheckboxesProps {
  title: string;
  options: string[];
}

const LayerCheckboxes: FC<LayerCheckboxesProps> = ({ title, options }) => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(Array(options.length).fill(false));

  const isAllChecked = checkedItems.every(Boolean);
  const isIndeterminate = checkedItems.some(Boolean) && !isAllChecked;

  const handleOnParentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckedItems(Array(options.length).fill(e.target.checked));
  };

  return (
    <>
      <Checkbox
        isChecked={isAllChecked}
        isIndeterminate={isIndeterminate}
        onChange={handleOnParentChange}
      >
        {title}
      </Checkbox>
      <VStack pl="6" mt="1" spacing="1" alignItems="start">
        {options.map((option, index) => (
          <Checkbox
            key={option}
            isChecked={checkedItems[index]}
            onChange={(e) => {
              setCheckedItems((items) => {
                const newItems = [...items];
                newItems[index] = e.target.checked;
                return newItems;
              });
            }}
          >
            {option}
          </Checkbox>
        ))}
      </VStack>
    </>
  );
};

const compareProps = (prev: LayerCheckboxesProps, next: LayerCheckboxesProps) =>
  prev.title === next.title && prev.options.length === next.options.length;

export default memo(LayerCheckboxes, compareProps);
