import { ChangeEvent, useState } from "react";
import { Box, Checkbox, Text, VStack } from "@chakra-ui/react";

import type { Ingredient } from "@/types/recipe";

interface LayerCheckboxesProps {
  title: string;
  options: Ingredient[];
}

export default function LayerCheckboxes({ title, options }: LayerCheckboxesProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(Array(options.length).fill(false));

  const isAllChecked = checkedItems.every(Boolean);
  const isIndeterminate = checkedItems.some(Boolean) && !isAllChecked;

  const handleOnParentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckedItems(Array(options.length).fill(e.target.checked));
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
      <VStack pl="3" mt="2" spacing="1" alignItems="start">
        {options.map((option, index) => (
          <Checkbox
            key={option.id}
            borderColor="primary.200"
            isChecked={checkedItems[index]}
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
