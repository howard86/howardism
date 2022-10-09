import { chakra, ChakraProps } from "@chakra-ui/react";

interface NavListItemProps {
  isCurrentPage: boolean;
  href: string;
  name: string;
}

const activeState: ChakraProps["sx"] = {
  color: "secondary.500",
  span: {
    _first: {
      transform: "translateY(-150%)",
    },
    _notFirst: {
      top: "50%",
      transform: "translateY(-50%)",
    },
  },
};

const StyledList = chakra("li", {
  baseStyle: {
    listStyleType: "none",
    _activeLink: {
      a: activeState,
    },
    a: {
      _hover: activeState,
    },
  },
});

export default function NavListItem({ href, name, isCurrentPage }: NavListItemProps) {
  return (
    <StyledList aria-current={isCurrentPage ? "page" : undefined}>
      <chakra.a
        href={href}
        display="block"
        pos="relative"
        overflow="hidden"
        color="primary.800"
        fontWeight="medium"
      >
        <chakra.span display="block" pos="relative" transition="all 0.3s ease">
          {name}
        </chakra.span>
        <chakra.span position="absolute" top="100%" transition="all 0.3s ease">
          {name}
        </chakra.span>
      </chakra.a>
    </StyledList>
  );
}
