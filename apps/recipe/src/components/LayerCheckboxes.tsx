import { Box, Checkbox, Text, VStack } from "@chakra-ui/react";
import { type ChangeEvent, useState } from "react";

import type { Ingredient } from "@/types/recipe";

interface LayerCheckboxesProps {
  options: Ingredient[];
  title: string;
}

export default function LayerCheckboxes({
  title,
  options,
}: LayerCheckboxesProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(options.length).fill(false)
  );

  const isAllChecked = checkedItems.every(Boolean);
  const isIndeterminate = checkedItems.some(Boolean) && !isAllChecked;

  const handleOnParentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckedItems(new Array(options.length).fill(e.target.checked));
  };

  return (
    <Box p="4">
      <Checkbox
        borderColor="primary.200"
        isChecked={isAllChecked}
        isIndeterminate={isIndeterminate}
        onChange={handleOnParentChange}
      >
        <Text fontSize={["lg", "xl"]} fontWeight="medium">
          {title}
        </Text>
      </Checkbox>
      <VStack alignItems="start" mt="2" pl="3" spacing="1">
        {options.map((option, index) => (
          <Checkbox
            borderColor="primary.200"
            isChecked={checkedItems[index]}
            key={option.id}
            onChange={(e) => {
              setCheckedItems((items) => {
                const newItems = [...items];
                newItems[index] = e.target.checked;
                return newItems;
              });
            }}
          >
            {option.amount > 0
              ? `${option.name} ${option.amount} ${option.unit}`
              : `${option.name} ${option.unit}`}
          </Checkbox>
        ))}
      </VStack>
    </Box>
  );
}
