// src/hooks/useAbility.ts

import { useAuth } from '../auth/useAuth';
import { can, Action } from '../permissions/permissions';

export function useAbility() {
  const { user } = useAuth();
  return {
    /**
     * Determine if the current user can perform `action`,
     * optionally scoped to a specific resource.
     *
     * @param action - one of the defined permission actions
     * @param resource - optional: { ownerType, ownerId }
     */
    can: (action: Action, resource?: { ownerType: 'business' | 'serviceLocation' | 'global'; ownerId?: string }) =>
      can(user, action, resource)
  };
}
