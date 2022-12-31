import { Box, BoxProps } from "@chakra-ui/react"

export default function Card(props: BoxProps): JSX.Element {
  return (
    <Box
      bg="white"
      py="8"
      px={{ base: 4, md: 10 }}
      shadow="base"
      rounded={{ sm: "lg" }}
      {...props}
    />
  )
}
