import type { TeamMember } from '../types.ts';

/**
 * Checks if a team member has a specific permission.
 * @param member The team member to check.
 * @param permission The permission string to look for (e.g., 'scheduler', 'admin').
 * @returns True if the member has the permission, false otherwise.
 */
export const hasPermission = (member: TeamMember, permission: 'admin' | 'scheduler'): boolean => {
  // Admins have all permissions.
  if (member.permissions.includes('admin')) {
    return true;
  }
  return member.permissions.includes(permission);
};