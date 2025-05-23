// src/permissions/permissions.ts

import { AuthUser } from '../auth/useAuth';

export type Role =
  | 'superAdmin'
  | 'business'
  | 'serviceLocationAdmin'
  | 'serviceProvider'
  | 'client';

export type Action =
  // global
  | 'viewHome'

  // super-admin
  | 'manageBusinesses'
  | 'viewBusinesses'
  | 'manageServiceLocations'
  | 'viewServiceLocations'
  | 'manageFormTemplates'
  | 'viewFormTemplates'

  // business-owner
  | 'manageMyLocations'
  | 'viewMyLocations'
  | 'manageBusinessTemplates'
  | 'viewBusinessTemplates'

  // service-location-admin
  | 'manageLocationTemplates'
  | 'viewLocationTemplates'

  // provider/client
  | 'viewOwnTemplates'
  ;

export const permissionMap: Record<Action, Role[]> = {
  viewHome:                ['superAdmin','business','serviceLocationAdmin','serviceProvider','client'],

  // super-admin
  manageBusinesses:        ['superAdmin'],
  viewBusinesses:          ['superAdmin','business'],
  manageServiceLocations:  ['superAdmin'],
  viewServiceLocations:    ['superAdmin','business'],
  manageFormTemplates:     ['superAdmin'],
  viewFormTemplates:       ['superAdmin','business','serviceLocationAdmin','serviceProvider','client'],

  // business-owner
  manageMyLocations:       ['business'],
  viewMyLocations:         ['business'],
  manageBusinessTemplates: ['business'],
  viewBusinessTemplates:   ['business'],

  // service-location-admin
  manageLocationTemplates: ['serviceLocationAdmin'],
  viewLocationTemplates:   ['serviceLocationAdmin','serviceProvider','client'],

  // provider/client
  viewOwnTemplates:        ['serviceProvider','client']
};

/**
 * can()
 *   Determines if a given user may perform an action, optionally
 *   scoped to a resource owner (business or serviceLocation).
 */
export function can(
  user: AuthUser | null,
  action: Action,
  resource?: { ownerType: 'business' | 'serviceLocation' | 'global'; ownerId?: string }
): boolean {
  if (!user) return false;

  // 1) Role-Based Access Control (RBAC)
  const allowedRoles = permissionMap[action] || [];
  if (user.roles.some(r => allowedRoles.includes(r as Role))) {
    return true;
  }

  // 2) ABAC for business-scoped resources
  if (resource?.ownerType === 'business' && resource.ownerId) {
    if (
      user.ownedBusinessIds.includes(resource.ownerId) ||
      user.memberBusinessIds.includes(resource.ownerId)
    ) {
      return true;
    }
  }

  // 3) ABAC for service-location-scoped resources
  if (resource?.ownerType === 'serviceLocation' && resource.ownerId) {
    if (
      user.ownedLocationIds.includes(resource.ownerId) ||
      user.adminLocationIds.includes(resource.ownerId) ||
      user.providerLocationIds.includes(resource.ownerId) ||
      user.clientLocationIds.includes(resource.ownerId)
    ) {
      return true;
    }
  }

  // 4) Global resources (no ownerType) rely solely on RBAC
  return false;
}
