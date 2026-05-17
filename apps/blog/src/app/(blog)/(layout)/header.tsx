"use client";

import { Badge } from "@howardism/ui/components/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/app/(common)/container";

import { Avatar } from "./avatar";
import { NAV_SECTION_KEYS, NavSection } from "./constants";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive =
    pathname !== null &&
    (pathname === href || (href !== "/" && pathname.startsWith(href)));

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className="rounded-full px-4 py-2 font-body font-medium text-[0.9rem] text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"
      href={href}
    >
      {label}
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav
      aria-label="Primary"
      className="hidden gap-0.5 rounded-full border border-border bg-card/85 p-1.5 shadow-paper backdrop-blur-md md:flex"
    >
      {NAV_SECTION_KEYS.map((key) => (
        <NavLink href={NavSection[key]} key={key} label={key} />
      ))}
    </nav>
  );
}

function MobileNav() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button type="button">
            <Badge variant="chip">Menu</Badge>
          </button>
        </SheetTrigger>
        <SheetContent
          className="mx-4 mt-4 rounded-3xl p-8"
          showCloseButton={false}
          side="top"
        >
          <SheetHeader className="p-0">
            <SheetTitle className="font-medium font-mono text-[0.6875rem] text-foreground-subtle uppercase tracking-[0.16em]">
              Navigation
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Mobile primary" className="mt-6">
            <ul className="m-0 flex list-none flex-col gap-0 border-border border-t p-0">
              {NAV_SECTION_KEYS.map((key) => (
                <li className="border-border border-b" key={key}>
                  <Link
                    className="block py-3 font-body text-[15px] text-foreground"
                    href={NavSection[key]}
                  >
                    {key}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function Header() {
  return (
    <header className="pointer-events-none relative z-50 flex flex-none flex-col">
      <div className="relative top-0 z-10 py-4">
        <Container className="relative w-full">
          <div className="pointer-events-auto relative flex items-center gap-4">
            {/* Wordmark + avatar pill */}
            <div className="flex flex-1 items-center gap-3">
              <Avatar size={36} />
              <div className="flex flex-col gap-px">
                <span className="font-display font-medium text-[15px] text-foreground leading-none tracking-[-0.015em]">
                  Howardism
                </span>
                <span className="font-mono text-[10px] text-foreground-subtle uppercase leading-none tracking-[0.14em]">
                  vol. 03 · quiet corner of the web
                </span>
              </div>
            </div>

            {/* Nav */}
            <DesktopNav />
            <MobileNav />
          </div>
        </Container>
      </div>
    </header>
  );
}
