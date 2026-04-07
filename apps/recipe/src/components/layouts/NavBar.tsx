import { RouteLink } from "@howardism/components-common";
import { Search } from "lucide-react";
import { useRouter } from "next/router";

import { MENU_LINK_ITEMS } from "@/constants/menu";

import HorizontalLogo from "../graphics/HorizontalLogo";
import MobileDrawer from "./MobileDrawer";

export default function NavBar(): JSX.Element {
  const router = useRouter();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-[#f7dfb7] shadow-md">
      <div className="flex items-center justify-between px-2 py-4 transition-all duration-300 ease-in-out sm:px-4 md:px-6 lg:px-8 lg:py-6">
        <MobileDrawer />
        <RouteLink href="/">
          <HorizontalLogo isTransparent size={40} />
        </RouteLink>
        <nav className="mr-5 hidden flex-grow md:flex">
          <ul className="ml-auto flex list-none items-center">
            {MENU_LINK_ITEMS.map((item) => {
              const isCurrentPage = item.url === router.pathname;
              return (
                <li className="mx-2" key={item.label}>
                  <RouteLink
                    className={[
                      "whitespace-nowrap px-2.5 py-1 transition-colors duration-150 ease-in-out",
                      isCurrentPage
                        ? "font-bold text-[#a73f3f]"
                        : "font-medium text-[#c05959] hover:text-[#a73f3f]",
                    ].join(" ")}
                    href={item.url}
                  >
                    {item.label}
                  </RouteLink>
                </li>
              );
            })}
          </ul>
        </nav>
        {/* TODO: implement search function */}
        <button
          aria-label="search"
          className="rounded-lg p-2 text-[#833031] transition-colors hover:bg-black/5"
          type="button"
        >
          <Search className="size-6" />
        </button>
      </div>
    </header>
  );
}
