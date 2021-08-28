import {
  Button,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import { useMemo } from "react";

import sudoku from "@/assets/john-morgan-sudoku.jpg";
import { SUDOKU_DIFFICULTIES } from "@/constants/sudoku";
import useSudoku from "@/hooks/useSudoku";

const LIGHT_COLOR = "blackAlpha.100";
const DARK_COLOR = "blackAlpha.700";

const SudokuPage = (): JSX.Element => {
  const { loading, selected, onStart, answer, game, message, onSelect, onUpdate } = useSudoku();
  const numberArray = useMemo(() => new Array(9).fill(0).map((_, index) => index + 1), []);

  return (
    <Container minH="full" centerContent p="4">
      <Image src={sudoku} alt="sudoku" width={200} height={300} placeholder="blur" />
      <Menu>
        <MenuButton as={Button} isLoading={loading} my="4">
          Start new game
        </MenuButton>
        <MenuList>
          {SUDOKU_DIFFICULTIES.map((key) => (
            <MenuItem key={key} onClick={() => onStart(key)} textTransform="capitalize">
              {key}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      {loading ? (
        <CircularProgress size="200px" thickness="4px" isIndeterminate color="green.400">
          <CircularProgressLabel fontSize="md">Loading</CircularProgressLabel>
        </CircularProgress>
      ) : (
        <>
          <SimpleGrid columns={9}>
            {answer.map((cell, index) => (
              <Button
                key={`${cell}-${index}`}
                variant="outline"
                boxSize="12"
                fontSize="2xl"
                fontFamily="mono"
                borderTopLeftRadius={index === 0 ? "md" : "none"}
                borderTopRightRadius={index === 8 ? "md" : "none"}
                borderBottomLeftRadius={index === 72 ? "md" : "none"}
                borderBottomRightRadius={index === 80 ? "md" : "none"}
                borderTopWidth={index < 9 ? "thin" : "0"}
                borderLeftWidth={index % 9 === 0 ? "thin" : "0"}
                borderBottomWidth="thin"
                borderRightWidth="thin"
                borderTopColor={index % 27 < 9 ? DARK_COLOR : LIGHT_COLOR}
                borderBottomColor={index % 27 > 17 ? DARK_COLOR : LIGHT_COLOR}
                borderLeftColor={index % 3 === 0 ? DARK_COLOR : LIGHT_COLOR}
                borderRightColor={index % 3 === 2 ? DARK_COLOR : LIGHT_COLOR}
                bg={selected === index ? "blue.100" : game[index] > 0 ? LIGHT_COLOR : "white"}
                onClick={() => onSelect(index)}
              >
                {cell > 0 ? cell : ""}
              </Button>
            ))}
          </SimpleGrid>
          <SimpleGrid mt="4" columns={9} spacing={2}>
            {answer.length > 0 &&
              numberArray.map((number) => (
                <Button
                  key={`input-${number}`}
                  boxSize="10"
                  fontFamily="mono"
                  onClick={() => onUpdate(number)}
                >
                  {number}
                </Button>
              ))}
          </SimpleGrid>
        </>
      )}
      {message && <Text>Ooops, encounter an error {message}</Text>}
    </Container>
  );
};

export default SudokuPage;
