"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

import { Container } from "@/app/(common)/Container";

import { Avatar } from "./Avatar";
import { NAV_SECTION_KEYS, NavSection } from "./constants";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive =
    pathname !== null &&
    (pathname === href || (href !== "/" && pathname.startsWith(href)));

  return (
    <Link aria-current={isActive ? "page" : undefined} href={href}>
      {label}
    </Link>
  );
}

function DesktopNav() {
  return (
    <nav aria-label="Primary" className="hw-nav-pill hidden md:flex">
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
          <button className="hw-chip" type="button">
            Menu
          </button>
        </SheetTrigger>
        <SheetContent
          className="mx-4 mt-4 rounded-3xl p-8"
          showCloseButton={false}
          side="top"
        >
          <SheetHeader className="p-0">
            <SheetTitle className="hw-eyebrow">Navigation</SheetTitle>
          </SheetHeader>
          <nav aria-label="Mobile primary" className="mt-6">
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderTop: "1px solid var(--hw-rule)",
              }}
            >
              {NAV_SECTION_KEYS.map((key) => (
                <li
                  key={key}
                  style={{ borderBottom: "1px solid var(--hw-rule)" }}
                >
                  <Link
                    className="hw-body"
                    href={NavSection[key]}
                    style={{
                      display: "block",
                      padding: "12px 0",
                      color: "var(--hw-ink)",
                      textDecoration: "none",
                      fontSize: 15,
                    }}
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
    <>
      <a
        className="hw-skip-link"
        href="#main-content"
        onBlur={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.top = "-999px";
        }}
        onFocus={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.top = "8px";
        }}
        style={{
          position: "absolute",
          top: -999,
          left: 8,
          zIndex: 9999,
          padding: "8px 16px",
          background: "var(--hw-paper)",
          color: "var(--hw-accent)",
          fontFamily: "var(--hw-font-mono)",
          fontSize: 13,
          border: "1px solid var(--hw-accent)",
          borderRadius: 4,
          textDecoration: "none",
          transition: "top 0.1s",
        }}
      >
        Skip to content
      </a>

      <header
        className="pointer-events-none relative z-50 flex flex-none flex-col"
        style={{
          height: "var(--header-height, 4rem)",
          marginBottom: "var(--header-mb, 0)",
        }}
      >
        <div
          className="top-0 z-10 h-16 pt-4"
          style={{
            position:
              "var(--header-position, relative)" as CSSProperties["position"],
          }}
        >
          <Container
            className="w-full"
            style={{
              position:
                "var(--header-inner-position, relative)" as CSSProperties["position"],
              top: "var(--header-top, 0px)" as CSSProperties["top"],
            }}
          >
            <div className="pointer-events-auto relative flex items-center gap-4">
              {/* Wordmark + avatar pill */}
              <div className="flex flex-1 items-center gap-3">
                <Avatar size={36} />
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 1 }}
                >
                  <span
                    className="hw-display"
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: "var(--hw-ink)",
                      lineHeight: 1,
                    }}
                  >
                    Howardism
                  </span>
                  <span
                    className="hw-mono"
                    style={{
                      fontSize: 10,
                      color: "var(--hw-ink-3)",
                      lineHeight: 1,
                    }}
                  >
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
    </>
  );
}
