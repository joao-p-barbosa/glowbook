import { permissionsSchema, type Permissions } from "@glowbook/shared";

export function parsePermissions(raw: string | null | undefined): Permissions {
  if (!raw) return { perms: {} };
  try {
    return permissionsSchema.parse(JSON.parse(raw));
  } catch {
    return { perms: {} };
  }
}

export function hasPermission(permissions: Permissions | null | undefined, permission: string) {
  if (!permissions) return false;
  if (permissions.all) return true;
  if (permissions.perms?.[permission]) return true;
  if (permission.endsWith(".view")) {
    const managePermission = permission.replace(/\.view$/, ".manage");
    return Boolean(permissions.perms?.[managePermission]);
  }
  return false;
}

export function isAdminPermissions(raw: string | null | undefined) {
  return parsePermissions(raw).all === true;
}
