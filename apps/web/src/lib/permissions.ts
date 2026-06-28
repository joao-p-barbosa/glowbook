import type { PermissionKey } from "@glowbook/shared";
import type { AuthUser } from "../store/auth";

export function hasPermission(user: AuthUser | null | undefined, permission: PermissionKey) {
  const permissions = user?.permissions;
  if (!permissions) return false;
  if (permissions.all) return true;
  if (permissions.perms?.[permission]) return true;
  if (permission.endsWith(".view")) {
    const managePermission = permission.replace(/\.view$/, ".manage");
    return Boolean(permissions.perms?.[managePermission]);
  }
  return false;
}
