import { LinkProps } from "react-html-props";
import clsx from "clsx";
import { motion } from "framer-motion";

interface NavItemProps extends LinkProps {
  isActive: boolean;
}

export default function NavItem({ isActive, href, children }: NavItemProps) {
  return (
    <li>
      <a
        href={href}
        className={clsx(
          "relative block px-3 py-2 transition",
          isActive
            ? "text-teal-500 dark:text-teal-400"
            : "hover:text-teal-500 dark:hover:text-teal-400"
        )}
      >
        {children}
        {isActive && (
          <motion.span
            layoutId="active-span"
            className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0"
          />
        )}
      </a>
    </li>
  );
}
