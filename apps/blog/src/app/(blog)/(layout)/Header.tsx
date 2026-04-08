"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@howardism/ui/components/sheet";
import { cn } from "@howardism/ui/lib/utils";
import Image from "next/image";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import {
  type ChildrenProps,
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import type { DivProps } from "react-html-props";

import { Container } from "@/app/(common)/Container";
import { ChevronDownIcon, MoonIcon, SunIcon } from "@/app/(common)/icons";
import profile from "@/profile.jpeg";

import { NAV_SECTION_KEYS, NavSection } from "./constants";

function MobileNavigation({ className, ...props }: DivProps) {
  return (
    <div className={className} {...props}>
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 font-medium text-sm shadow-sm transition-colors hover:bg-muted"
            type="button"
          >
            Menu
            <ChevronDownIcon className="w-2 stroke-current transition-colors" />
          </button>
        </SheetTrigger>
        <SheetContent
          className="mx-4 mt-4 rounded-3xl p-8"
          showCloseButton={false}
          side="top"
        >
          <SheetHeader className="p-0">
            <SheetTitle className="font-medium text-foreground text-sm">
              Navigation
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-6">
            <ul className="-my-2 divide-y divide-border text-base text-foreground">
              {NAV_SECTION_KEYS.map((key) => (
                <li key={key}>
                  <Link
                    className="block py-2 transition-colors hover:text-primary"
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

function NavItem({ href, children }: LinkProps & ChildrenProps) {
  const isActive = usePathname() === href;

  return (
    <li>
      <Link
        className={cn(
          "relative block px-3 py-2 font-medium text-sm transition-colors",
          isActive ? "text-primary" : "text-foreground/70 hover:text-foreground"
        )}
        href={href}
      >
        {children}
        {isActive && (
          <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />
        )}
      </Link>
    </li>
  );
}

function DesktopNavigation(props: DivProps) {
  return (
    <nav {...props}>
      <ul className="flex items-center rounded-full bg-background/80 px-1 font-medium text-sm shadow-sm ring-1 ring-border/40 backdrop-blur">
        {NAV_SECTION_KEYS.map((key) => (
          <NavItem href={NavSection[key]} key={key}>
            {key}
          </NavItem>
        ))}
      </ul>
    </nav>
  );
}

function ModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      aria-label="Toggle dark mode"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted"
      onClick={toggle}
      type="button"
    >
      {isDark ? (
        <SunIcon className="w-5 fill-transparent stroke-primary" />
      ) : (
        <MoonIcon className="w-5 fill-transparent stroke-foreground" />
      )}
    </button>
  );
}

function clamp(number: number, a: number, b: number) {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return Math.min(Math.max(number, min), max);
}

function AvatarContainer({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-background p-0.5 shadow-sm ring-1 ring-border backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

interface AvatarProps extends Partial<LinkProps> {
  className?: string;
  large?: boolean;
  style?: Partial<CSSProperties>;
}

function Avatar({
  large = false,
  className,
  href = "/",
  ...props
}: AvatarProps) {
  return (
    <Link
      aria-label="Home"
      className={cn("pointer-events-auto", className)}
      href={href}
      {...props}
    >
      <Image
        alt=""
        className={cn(
          "h-auto rounded-full bg-muted object-cover",
          large ? "w-16" : "w-9"
        )}
        priority
        sizes={large ? "4rem" : "2.25rem"}
        src={profile}
      />
    </Link>
  );
}

export function Header() {
  const isHomePage = usePathname() === "/";

  const headerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const isInitial = useRef(true);

  useEffect(() => {
    const downDelay = avatarRef.current?.offsetTop ?? 0;
    const upDelay = 64;

    function setProperty(property: string, value: string) {
      document.documentElement.style.setProperty(property, value);
    }

    function removeProperty(property: string) {
      document.documentElement.style.removeProperty(property);
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: header scroll logic is inherently complex
    function updateHeaderStyles() {
      if (!headerRef.current) {
        return;
      }

      const { top, height } = headerRef.current.getBoundingClientRect();
      const scrollY = clamp(
        window.scrollY,
        0,
        document.body.scrollHeight - window.innerHeight
      );

      if (isInitial.current) {
        setProperty("--header-position", "sticky");
      }

      setProperty("--content-offset", `${downDelay}px`);

      if (isInitial.current || scrollY < downDelay) {
        setProperty("--header-height", `${downDelay + height}px`);
        setProperty("--header-mb", `${-downDelay}px`);
      } else if (top + height < -upDelay) {
        const offset = Math.max(height, scrollY - upDelay);
        setProperty("--header-height", `${offset}px`);
        setProperty("--header-mb", `${height - offset}px`);
      } else if (top === 0) {
        setProperty("--header-height", `${scrollY + height}px`);
        setProperty("--header-mb", `${-scrollY}px`);
      }

      if (top === 0 && scrollY > 0 && scrollY >= downDelay) {
        setProperty("--header-inner-position", "fixed");
        removeProperty("--header-top");
        removeProperty("--avatar-top");
      } else {
        removeProperty("--header-inner-position");
        setProperty("--header-top", "0px");
        setProperty("--avatar-top", "0px");
      }
    }

    function updateAvatarStyles() {
      if (!isHomePage) {
        return;
      }

      const fromScale = 1;
      const toScale = 36 / 64;
      const fromX = 0;
      const toX = 2 / 16;

      const scrollY = downDelay - window.scrollY;

      let scale = (scrollY * (fromScale - toScale)) / downDelay + toScale;
      scale = clamp(scale, fromScale, toScale);

      let x = (scrollY * (fromX - toX)) / downDelay + toX;
      x = clamp(x, fromX, toX);

      setProperty(
        "--avatar-image-transform",
        `translate3d(${x}rem, 0, 0) scale(${scale})`
      );

      const borderScale = 1 / (toScale / scale);
      const borderX = (-toX + x) * borderScale;
      const borderTransform = `translate3d(${borderX}rem, 0, 0) scale(${borderScale})`;

      setProperty("--avatar-border-transform", borderTransform);
      setProperty("--avatar-border-opacity", scale === toScale ? "1" : "0");
    }

    function updateStyles() {
      updateHeaderStyles();
      updateAvatarStyles();
      isInitial.current = false;
    }

    updateStyles();
    window.addEventListener("scroll", updateStyles, { passive: true });
    window.addEventListener("resize", updateStyles);

    return () => {
      window.removeEventListener("scroll", updateStyles);
      window.removeEventListener("resize", updateStyles);
    };
  }, [isHomePage]);

  return (
    <>
      <header
        className="pointer-events-none relative z-50 flex flex-col"
        style={{
          height: "var(--header-height)",
          marginBottom: "var(--header-mb)",
        }}
      >
        {isHomePage && (
          <>
            <div
              className="order-last mt-[calc(theme(spacing.16)-theme(spacing.3))]"
              ref={avatarRef}
            />
            <Container
              className="top-0 order-last -mb-3 pt-3"
              style={{
                position: "var(--header-position)" as CSSProperties["position"],
              }}
            >
              <div
                className="top-[var(--avatar-top,theme(spacing.3))] w-full"
                style={{
                  position:
                    "var(--header-inner-position)" as CSSProperties["position"],
                }}
              >
                <div className="relative">
                  <AvatarContainer
                    className="absolute top-3 left-0 origin-left transition-opacity"
                    style={{
                      opacity: "var(--avatar-border-opacity, 0)",
                      transform: "var(--avatar-border-transform)",
                    }}
                  />
                  <Avatar
                    className="block origin-left"
                    large
                    style={{
                      transform:
                        "var(--avatar-image-transform)" as CSSProperties["transform"],
                    }}
                  />
                </div>
              </div>
            </Container>
          </>
        )}
        <div
          className="top-0 z-10 h-16 pt-6"
          ref={headerRef}
          style={{
            position: "var(--header-position)" as CSSProperties["position"],
          }}
        >
          <Container
            className="top-[var(--header-top,theme(spacing.6))] w-full"
            style={{
              position:
                "var(--header-inner-position)" as CSSProperties["position"],
            }}
          >
            <div className="relative flex gap-4">
              <div className="flex flex-1">
                {!isHomePage && (
                  <AvatarContainer>
                    <Avatar />
                  </AvatarContainer>
                )}
              </div>
              <div className="flex flex-1 justify-end md:justify-center">
                <MobileNavigation className="pointer-events-auto md:hidden" />
                <DesktopNavigation className="pointer-events-auto hidden md:block" />
              </div>
              <div className="flex justify-end md:flex-1">
                <div className="pointer-events-auto">
                  <ModeToggle />
                </div>
              </div>
            </div>
          </Container>
        </div>
      </header>
      {isHomePage && <div style={{ height: "var(--content-offset)" }} />}
    </>
  );
}
