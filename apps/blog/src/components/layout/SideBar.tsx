import { VStack } from "@chakra-ui/react";

import Nav from "./Nav";
import Profile from "./Profile";

export default function SideBar() {
  return (
    <VStack spacing={[2, 4]}>
      <Profile />
      <Nav />
    </VStack>
  );
}
