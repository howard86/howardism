import {
  Button,
  CircularProgress,
  CircularProgressLabel,
  Container,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import React, { useMemo, useState } from "react";

import sudoku from "@/assets/john-morgan-sudoku.jpg";

import type { SudokuApiResponse } from "./api/sudoku";

const LIGHT_COLOR = "blackAlpha.100";
const DARK_COLOR = "blackAlpha.700";

const SudokuPage = (): JSX.Element => {
  const [game, setGame] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const numberArray = useMemo(() => new Array(9).fill(0).map((_, index) => index + 1), []);

  const handleOnStart = async () => {
    setLoading(true);
    const result = await fetch("/api/sudoku?difficulty=expert");
    const response = (await result.json()) as SudokuApiResponse;

    if (!response.success) {
      setError(response.message);
    } else {
      setGame(response.sudoku);
    }

    setLoading(false);
  };

  return (
    <Container minH="full" centerContent p="4">
      <Image src={sudoku} alt="sudoku" width={200} height={300} placeholder="blur" />
      <Button onClick={handleOnStart} isLoading={loading} my="8">
        Start new game
      </Button>
      {loading ? (
        <CircularProgress size="200px" thickness="4px" isIndeterminate color="green.400">
          <CircularProgressLabel fontSize="md">Loading</CircularProgressLabel>
        </CircularProgress>
      ) : (
        <>
          <SimpleGrid columns={9}>
            {game.map((cell, index) => (
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
                bg={cell > 0 ? LIGHT_COLOR : "white"}
              >
                {cell > 0 ? cell : ""}
              </Button>
            ))}
          </SimpleGrid>
          <SimpleGrid mt="4" columns={9} spacing={2}>
            {game.length > 0 &&
              numberArray.map((number) => (
                <Button key={`input-${number}`} boxSize="10" fontFamily="mono">
                  {number}
                </Button>
              ))}
          </SimpleGrid>
        </>
      )}
      {error !== "" && <Text>Ooops, encounter an error {error}</Text>}
    </Container>
  );
};

export default SudokuPage;
