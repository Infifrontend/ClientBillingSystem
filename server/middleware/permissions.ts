
import { Request, Response, NextFunction } from "express";

export type UserRole = "admin" | "csm" | "finance" | "viewer";

export interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
    role?: UserRole;
  };
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.user.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: "You don't have permission to access this resource"
      });
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.user.role;
    const permissions = getRolePermissions(userRole);

    if (!permissions.includes(permission)) {
      return res.status(403).json({ 
        error: "Forbidden",
        message: `Permission '${permission}' required`
      });
    }

    next();
  };
}

function getRolePermissions(role?: UserRole): string[] {
  switch (role) {
    case "admin":
      return [
        "users:read",
        "users:write",
        "users:delete",
        "clients:read",
        "clients:write",
        "clients:delete",
        "services:read",
        "services:write",
        "services:delete",
        "agreements:read",
        "agreements:write",
        "agreements:delete",
        "invoices:read",
        "invoices:write",
        "invoices:delete",
        "reports:read",
        "insights:read",
        "settings:read",
        "settings:write",
      ];
    case "csm":
      return [
        "clients:read",
        "clients:write",
        "clients:delete",
        "services:read",
        "services:write",
        "agreements:read",
        "agreements:write",
      ];
    case "finance":
      return [
        "clients:read",
        "services:read",
        "invoices:read",
        "invoices:write",
        "reports:read",
      ];
    case "viewer":
      return [
        "clients:read",
        "services:read",
        "agreements:read",
        "invoices:read",
        "reports:read",
      ];
    default:
      return [];
  }
}

export function canAccessClient(userRole: UserRole, clientId: string, assignedCsmId?: string, userId?: string): boolean {
  if (userRole === "admin" || userRole === "finance" || userRole === "viewer") {
    return true;
  }
  
  if (userRole === "csm") {
    return assignedCsmId === userId;
  }
  
  return false;
}
