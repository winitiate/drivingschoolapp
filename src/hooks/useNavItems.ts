import { useAuth } from "../auth/useAuth";
import { useDashboardLinks } from "../hooks/navigation/useDashboardLinks";
import { publicNav, NavItem } from "../config/nav";

/**
 * Returns the correct side‐nav items based on authentication state.
 * - If logged in: returns whatever useDashboardLinks() provides.
 * - If not: returns the publicNav array.
 */
export function useNavItems(): NavItem[] {
  const { user } = useAuth();
  const dashboardItems = useDashboardLinks();
  return user ? dashboardItems : publicNav;
}
