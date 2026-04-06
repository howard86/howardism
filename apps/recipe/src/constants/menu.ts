export interface MenuLinkItem {
  label: string;
  url: string;
}

export const MENU_LINK_ITEMS: MenuLinkItem[] = [
  {
    url: "/",
    label: "Home",
  },
  { url: "/signin", label: "Log in" },
];
