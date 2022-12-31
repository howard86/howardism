export interface MenuLinkItem {
  url: string
  label: string
}

export const MENU_LINK_ITEMS: MenuLinkItem[] = [
  {
    url: "/",
    label: "Home",
  },
  { url: "/signin", label: "Log in" },
]
