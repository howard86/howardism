import { chakra } from "@chakra-ui/react";

interface NavListItemProps {
  className?: string;
  href: string;
  name: string;
}

export default function NavListItem({ href, name, className }: NavListItemProps) {
  return (
    <chakra.li className={className} mr={30}>
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
    </chakra.li>
  );
}
