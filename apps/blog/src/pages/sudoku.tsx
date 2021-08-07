import {
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Container,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import { useState } from "react";

import sudoku from "@/assets/john-morgan-sudoku.jpg";

import type { SudokuApiResponse } from "./api/sudoku";

const SudokuPage = (): JSX.Element => {
  const [game, setGame] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleOnStart = async () => {
    setLoading(true);
    const result = await fetch("/api/sudoku");
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
        <SimpleGrid columns={9} w="full">
          {game.map((cell, index) => (
            <Box
              border="1px"
              borderColor="blackAlpha.300"
              textAlign="center"
              fontSize="2xl"
              fontFamily="mono"
              color={cell > 0 ? "black" : "white"}
              p="4"
              key={`${cell}-${index}`}
            >
              {cell}
            </Box>
          ))}
        </SimpleGrid>
      )}
      {!loading && error !== "" && <Text>Ooops, encounter an error {error}</Text>}
    </Container>
  );
};

export default SudokuPage;
