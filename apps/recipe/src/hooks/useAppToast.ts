import { UseToastOptions, useToast } from "@chakra-ui/react";

const useAppToast = (options?: UseToastOptions) =>
  useToast({ duration: 5000, isClosable: true, position: "bottom", ...options });

export default useAppToast;
