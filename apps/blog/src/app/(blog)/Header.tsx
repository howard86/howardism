"use client"

import { Popover, Transition } from "@headlessui/react"
import clsx from "clsx"
import Image from "next/image"
import Link, { LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import {
  ChangeEvent,
  ChildrenProps,
  ComponentType,
  CSSProperties,
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react"
import { DivProps } from "react-html-props"

import { Container } from "@/components/template/Container"
import { NAV_SECTION_KEYS, NavSection } from "@/constants/nav"
import profile from "@/profile.jpeg"

import { ChevronDownIcon } from "./ChevronDownIcon"
import { CloseIcon } from "./CloseIcon"
import { MoonIcon } from "./MoonIcon"
import { SunIcon } from "./SunIcon"

type ExtractProps<T> = T extends ComponentType<infer P> ? P : T

function MobileNavigation(props: ExtractProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <Popover.Button className="btn-brand btn-sm btn rounded-full">
        Menu
        <ChevronDownIcon className="w-2 stroke-current transition-colors" />
      </Popover.Button>
      <Transition.Root>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Popover.Overlay className="fixed inset-0 z-50 bg-base-200/40 backdrop-blur-sm" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-150 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-150 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Popover.Panel
            focus
            className="fixed inset-x-4 top-8 z-50 origin-top rounded-3xl bg-base-100 p-8 ring-1 ring-base-200"
          >
            <div className="flex flex-row-reverse items-center justify-between">
              <Popover.Button aria-label="Close menu" className="btn-brand btn-sm btn-circle btn">
                <CloseIcon />
              </Popover.Button>
              <h2 className="text-sm font-medium text-base-content">Navigation</h2>
            </div>
            <nav className="mt-6">
              <ul className="-my-2 divide-y divide-base-300 text-base text-base-content">
                {NAV_SECTION_KEYS.map((key) => (
                  <li key={key}>
                    <Popover.Button
                      as={Link}
                      href={NavSection[key]}
                      className="link-hover link block py-2"
                    >
                      {key}
                    </Popover.Button>
                  </li>
                ))}
              </ul>
            </nav>
          </Popover.Panel>
        </Transition.Child>
      </Transition.Root>
    </Popover>
  )
}

function NavItem({ href, children }: LinkProps & ChildrenProps) {
  const isActive = usePathname() === href

  return (
    <li>
      <Link
        href={href}
        className={clsx("tab transition-all", isActive && "tab-active text-primary")}
      >
        {children}
        {isActive && (
          <span className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0" />
        )}
      </Link>
    </li>
  )
}

function DesktopNavigation(props: DivProps) {
  return (
    <nav {...props}>
      <ul className="tab-md flex items-center rounded-full bg-base-100/80 text-sm font-medium shadow-md shadow-base-200 ring-1 ring-base-200/40 backdrop:blur">
        {NAV_SECTION_KEYS.map((key) => (
          <NavItem key={key} href={NavSection[key]}>
            {key}
          </NavItem>
        ))}
      </ul>
    </nav>
  )
}

function ModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsDarkMode(!event.target.checked)
    document.documentElement.setAttribute("data-theme", event.target.checked ? "jp" : "dark")
  }

  return (
    <label className="btn-brand group swap swap-rotate btn-sm btn-circle btn shadow-sm">
      <input checked={!isDarkMode} onChange={handleChange} type="checkbox" />
      <SunIcon className="swap-on w-5 fill-transparent stroke-primary group-hover:stroke-primary-focus" />
      <MoonIcon className="swap-off w-5 fill-transparent stroke-base-content " />
    </label>
  )
}

function clamp(number: number, a: number, b: number) {
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return Math.min(Math.max(number, min), max)
}

function AvatarContainer({ className, ...props }: DivProps) {
  return (
    <div
      className={clsx(
        className,
        "rounded-full bg-base-100 p-0.5 shadow-sm shadow-base-200 ring-1 ring-base-300 backdrop-blur"
      )}
      {...props}
    />
  )
}

interface AvatarProps extends Partial<LinkProps> {
  large?: boolean
  className?: string
  style?: Partial<CSSProperties>
}

function Avatar({ large = false, className, href = "/", ...props }: AvatarProps) {
  return (
    <Link
      href={href}
      aria-label="Home"
      className={clsx(className, "pointer-events-auto")}
      {...props}
    >
      <Image
        src={profile}
        alt=""
        className={clsx("h-auto rounded-full bg-base-200 object-cover", large ? "w-16" : "w-9")}
        priority
        sizes={large ? "4rem" : "2.25rem"}
      />
    </Link>
  )
}

export function Header() {
  const isHomePage = usePathname() === "/"

  const headerRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const isInitial = useRef(true)

  useEffect(() => {
    const downDelay = avatarRef.current?.offsetTop ?? 0
    const upDelay = 64

    function setProperty(property: string, value: string) {
      document.documentElement.style.setProperty(property, value)
    }

    function removeProperty(property: string) {
      document.documentElement.style.removeProperty(property)
    }

    function updateHeaderStyles() {
      if (!headerRef.current) return

      const { top, height } = headerRef.current.getBoundingClientRect()
      const scrollY = clamp(window.scrollY, 0, document.body.scrollHeight - window.innerHeight)

      if (isInitial.current) {
        setProperty("--header-position", "sticky")
      }

      setProperty("--content-offset", `${downDelay}px`)

      if (isInitial.current || scrollY < downDelay) {
        setProperty("--header-height", `${downDelay + height}px`)
        setProperty("--header-mb", `${-downDelay}px`)
      } else if (top + height < -upDelay) {
        const offset = Math.max(height, scrollY - upDelay)
        setProperty("--header-height", `${offset}px`)
        setProperty("--header-mb", `${height - offset}px`)
      } else if (top === 0) {
        setProperty("--header-height", `${scrollY + height}px`)
        setProperty("--header-mb", `${-scrollY}px`)
      }

      if (top === 0 && scrollY > 0 && scrollY >= downDelay) {
        setProperty("--header-inner-position", "fixed")
        removeProperty("--header-top")
        removeProperty("--avatar-top")
      } else {
        removeProperty("--header-inner-position")
        setProperty("--header-top", "0px")
        setProperty("--avatar-top", "0px")
      }
    }

    function updateAvatarStyles() {
      if (!isHomePage) return

      const fromScale = 1
      const toScale = 36 / 64
      const fromX = 0
      const toX = 2 / 16

      const scrollY = downDelay - window.scrollY

      let scale = (scrollY * (fromScale - toScale)) / downDelay + toScale
      scale = clamp(scale, fromScale, toScale)

      let x = (scrollY * (fromX - toX)) / downDelay + toX
      x = clamp(x, fromX, toX)

      setProperty("--avatar-image-transform", `translate3d(${x}rem, 0, 0) scale(${scale})`)

      const borderScale = 1 / (toScale / scale)
      const borderX = (-toX + x) * borderScale
      const borderTransform = `translate3d(${borderX}rem, 0, 0) scale(${borderScale})`

      setProperty("--avatar-border-transform", borderTransform)
      setProperty("--avatar-border-opacity", scale === toScale ? "1" : "0")
    }

    function updateStyles() {
      updateHeaderStyles()
      updateAvatarStyles()
      isInitial.current = false
    }

    updateStyles()
    window.addEventListener("scroll", updateStyles, { passive: true })
    window.addEventListener("resize", updateStyles)

    return () => {
      window.removeEventListener("scroll", updateStyles)
      window.removeEventListener("resize", updateStyles)
    }
  }, [isHomePage])

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
              ref={avatarRef}
              className="order-last mt-[calc(theme(spacing.16)-theme(spacing.3))]"
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
                  position: "var(--header-inner-position)" as CSSProperties["position"],
                }}
              >
                <div className="relative">
                  <AvatarContainer
                    className="absolute left-0 top-3 origin-left transition-opacity"
                    style={{
                      opacity: "var(--avatar-border-opacity, 0)",
                      transform: "var(--avatar-border-transform)",
                    }}
                  />
                  <Avatar
                    large
                    className="block origin-left"
                    style={{
                      transform: "var(--avatar-image-transform)" as CSSProperties["transform"],
                    }}
                  />
                </div>
              </div>
            </Container>
          </>
        )}
        <div
          ref={headerRef}
          className="top-0 z-10 h-16 pt-6"
          style={{
            position: "var(--header-position)" as CSSProperties["position"],
          }}
        >
          <Container
            className="top-[var(--header-top,theme(spacing.6))] w-full"
            style={{
              position: "var(--header-inner-position)" as CSSProperties["position"],
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
  )
}
