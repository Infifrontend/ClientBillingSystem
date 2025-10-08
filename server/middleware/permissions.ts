import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "admin" | "finance" | "csm" | "viewer";
  };
}

// Mock user for development
const mockUser = {
  id: "45703559",
  email: "admin@example.com",
  role: "admin" as const,
};

// Role hierarchy
const roleHierarchy = {
  admin: 3,
  finance: 2,
  csm: 1,
  viewer: 0,
};

// Permissions map
const permissions = {
  "clients:read": ["admin", "finance", "csm", "viewer"],
  "clients:write": ["admin", "finance", "csm"],
  "clients:delete": ["admin"],
  "services:read": ["admin", "finance", "csm", "viewer"],
  "services:write": ["admin", "finance", "csm"],
  "services:delete": ["admin"],
  "agreements:read": ["admin", "finance", "csm", "viewer"],
  "agreements:write": ["admin", "finance"],
  "agreements:delete": ["admin"],
  "invoices:read": ["admin", "finance", "viewer"],
  "invoices:write": ["admin", "finance"],
  "invoices:delete": ["admin"],
};

export function requireRole(requiredRole: "admin" | "finance" | "csm" | "viewer") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Set mock user
    req.user = mockUser;

    const userRole = req.user.role;

    if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
      return next();
    }

    return res.status(403).json({ error: "Insufficient permissions" });
  };
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Set mock user
    req.user = mockUser;

    const userRole = req.user.role;
    const allowedRoles = permissions[permission] || [];

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ error: "Insufficient permissions" });
  };
}

export async function canAccessClient(userId: string, clientId: string): Promise<boolean> {
  // For now, always return true since we're using a mock user
  return true;
}