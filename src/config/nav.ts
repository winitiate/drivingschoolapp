// Defines the shape of a navigation item and lists out all public links in one place.

export interface NavItem {
  label: string;
  to: string;
}

export const publicNav: NavItem[] = [
  { label: "About",   to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Pricing", to: "/pricing" },
  { label: "Sign In", to: "/sign-in" },
  { label: "Sign Up", to: "/business/sign-up" }
];
