"use client";

import { RouteLink } from "@howardism/components-common";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import { Menu } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

import { MENU_LINK_ITEMS } from "@/constants/menu";

import HorizontalLogo from "../graphics/HorizontalLogo";

export default function MobileDrawer(): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger asChild>
          <button
            aria-label="open-drawer"
            className="rounded-lg p-2 text-[#833031] transition-colors hover:bg-black/5"
            type="button"
          >
            <Menu className="size-8" />
          </button>
        </SheetTrigger>
        <SheetContent className="w-xs bg-[#fff3de]" side="left">
          <SheetHeader className="bg-[#f7dfb7] shadow-sm">
            <RouteLink href="/" onClick={() => setOpen(false)}>
              <HorizontalLogo isTransparent />
            </RouteLink>
          </SheetHeader>
          <nav className="my-8 px-4">
            <ul className="list-none space-y-8">
              {MENU_LINK_ITEMS.map((item) => {
                const isCurrentPage = router.pathname === item.url;
                return (
                  <li className="relative" key={item.url}>
                    {isCurrentPage && (
                      <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r bg-[#f7dfb7]" />
                    )}
                    <RouteLink
                      className={[
                        "block whitespace-nowrap px-2.5 py-1 text-xl transition-colors duration-150 ease-in-out",
                        isCurrentPage
                          ? "font-bold text-[#c8871e]"
                          : "font-medium text-[#e1a037] hover:text-[#c8871e]",
                      ].join(" ")}
                      href={item.url}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </RouteLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
