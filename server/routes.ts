import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertClientSchema, insertServiceSchema, insertAgreementSchema, insertInvoiceSchema, insertUserSchema, clients } from "@shared/schema";
import { z } from "zod";
import { requireRole, requirePermission, AuthenticatedRequest, canAccessClient } from "./middleware/permissions";
import { log } from "./vite";
import { db } from "./db";
import { sql, eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { sendEmail } from "./email";

// Mock isAuthenticated middleware for demonstration purposes
// In a real application, you would verify the user's session or token here
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  // For this example, we'll use a simple mock user
  // In production, verify session/token and fetch actual user
  const mockUser = {
    id: "45703559",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "admin" as const,
  };
  (req as AuthenticatedRequest).user = mockUser;
  next();
};


export function registerRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Find user by username
      const users = await db.select().from(schema.users)
        .where(eq(schema.users.username, username));
      
      if (users.length === 0) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const user = users[0];

      // Check if user is active
      if (user.status !== "active") {
        return res.status(401).json({ error: "Account is not active" });
      }

      // Verify password (plain text comparison for now)
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Update last login
      await db.update(schema.users)
        .set({ lastLogin: new Date() })
        .where(eq(schema.users.id, user.id));

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/user", async (req: any, res: Response) => {
    try {
      // In a real application, you would get the user ID from the session/token
      // For now, we'll return null to indicate no authenticated user
      // The frontend will handle authentication state via sessionStorage
      res.status(401).json({ error: "Not authenticated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get employees for autocomplete
  app.get("/api/employees", async (req, res) => {
    try {
      const search = req.query.search as string;

      // Get unique employee names from clients table
      let query = db
        .select({ employeeName: clients.employeeName })
        .from(clients)
        .where(sql`${clients.employeeName} IS NOT NULL AND ${clients.employeeName} != ''`);

      if (search && search.length >= 3) {
        query = query.where(sql`LOWER(${clients.employeeName}) LIKE LOWER(${`%${search}%`})`);
      }

      const employees = await query
        .groupBy(clients.employeeName)
        .limit(10);

      res.json(employees.map(e => e.employeeName));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.query;

      const clients = clientId && clientId !== "all"
        ? [await storage.getClient(clientId as string)].filter(Boolean)
        : await storage.getClients();

      const agreements = await storage.getAgreements({
        status: "active",
        ...(clientId && clientId !== "all" ? { clientId: clientId as string } : {})
      });

      const invoices = await storage.getInvoices(
        clientId && clientId !== "all" ? { clientId: clientId as string } : {}
      );

      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyInvoices = invoices.filter(inv => new Date(inv.issueDate) >= currentMonth);

      const monthlyRevenue = monthlyInvoices
        .filter(inv => inv.status === "paid")
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      const outstanding = invoices
        .filter(inv => inv.status === "pending" || inv.status === "overdue")
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      const forecastedRevenue = monthlyRevenue * 1.15;
      const atRiskClients = Math.floor(clients.length * 0.08);

      res.json({
        totalClients: clients.length,
        activeAgreements: agreements.length,
        monthlyRevenue: Math.round(monthlyRevenue),
        outstanding: Math.round(outstanding),
        forecastedRevenue: Math.round(forecastedRevenue),
        atRiskClients,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/revenue-trends", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.query;

      const invoices = await storage.getInvoices(
        clientId && clientId !== "all" ? { clientId: clientId as string } : {}
      );

      // Get last 6 months
      const now = new Date();
      const monthsData: { [key: string]: number } = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize last 6 months with zero revenue
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthNames[date.getMonth()]}`;
        monthsData[monthKey] = 0;
      }

      // Aggregate revenue by month from paid invoices
      invoices
        .filter(inv => inv.status === "paid" && inv.paidDate)
        .forEach(inv => {
          const paidDate = new Date(inv.paidDate!);
          const monthKey = `${monthNames[paidDate.getMonth()]}`;

          // Only include if within last 6 months
          const monthsDiff = (now.getFullYear() - paidDate.getFullYear()) * 12 + (now.getMonth() - paidDate.getMonth());
          if (monthsDiff >= 0 && monthsDiff < 6 && monthsData.hasOwnProperty(monthKey)) {
            monthsData[monthKey] += Number(inv.amount);
          }
        });

      const data = Object.entries(monthsData).map(([month, revenue]) => ({
        month,
        revenue: Math.round(revenue),
      }));

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/client-distribution", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.query;

      const clients = clientId && clientId !== "all"
        ? [await storage.getClient(clientId as string)].filter(Boolean)
        : await storage.getClients();

      const distribution = clients.reduce((acc: any, client) => {
        const industry = client.industry.replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});

      const data = Object.entries(distribution).map(([name, value]) => ({
        name,
        value,
      }));

      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/upcoming-renewals", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.query;

      const agreements = await storage.getAgreements(
        clientId && clientId !== "all" ? { clientId: clientId as string } : {}
      );
      const clients = await storage.getClients();

      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const upcomingRenewals = agreements
        .filter(agreement => {
          const endDate = new Date(agreement.endDate);
          return endDate > now && endDate <= ninetyDaysFromNow;
        })
        .map(agreement => {
          const client = clients.find(c => c.id === agreement.clientId);
          const daysLeft = Math.floor(
            (new Date(agreement.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            id: agreement.id,
            clientName: client?.name || "Unknown",
            agreementName: agreement.agreementName,
            daysLeft,
            value: agreement.value ? `${agreement.currency} ${agreement.value}` : "N/A",
          };
        })
        .sort((a, b) => a.daysLeft - b.daysLeft);

      res.json(upcomingRenewals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clients", requirePermission("clients:read"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, status, industry } = req.query;

      let clients = await storage.getClients({
        search: search as string,
        status: status as string,
        industry: industry as string,
      });

      res.json(clients);
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch clients:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clients/:id", requirePermission("clients:read"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json(client);
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch client:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/clients - Create a new client
  app.post("/api/clients", requirePermission("clients:write"), async (req: Request, res: Response) => {
    try {
      const clientData = insertClientSchema.parse(req.body);

      // Check for duplicate client name
      const existingByName = await storage.getClientByName(clientData.name);
      if (existingByName) {
        return res.status(400).json({ error: "A client with this name already exists" });
      }

      // Check for duplicate email if provided
      if (clientData.email) {
        const existingByEmail = await storage.getClientByEmail(clientData.email);
        if (existingByEmail) {
          return res.status(400).json({ error: "A client with this email already exists" });
        }
      }

      // Check for duplicate GST/Tax ID if provided
      if (clientData.gstTaxId) {
        const existingByGstTaxId = await storage.getClientByGstTaxId(clientData.gstTaxId);
        if (existingByGstTaxId) {
          return res.status(400).json({ error: "A client with this GST/Tax ID already exists" });
        }
      }

      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /api/clients/:id - Update a client
  app.patch("/api/clients/:id", requirePermission("clients:write"), async (req: Request, res: Response) => {
    try {
      const updateData = insertClientSchema.partial().parse(req.body);

      // Check for duplicate client name (excluding current client)
      if (updateData.name) {
        const existingByName = await storage.getClientByName(updateData.name);
        if (existingByName && existingByName.id !== req.params.id) {
          return res.status(400).json({ error: "A client with this name already exists" });
        }
      }

      // Check for duplicate email if provided (excluding current client)
      if (updateData.email) {
        const existingByEmail = await storage.getClientByEmail(updateData.email);
        if (existingByEmail && existingByEmail.id !== req.params.id) {
          return res.status(400).json({ error: "A client with this email already exists" });
        }
      }

      // Check for duplicate GST/Tax ID if provided (excluding current client)
      if (updateData.gstTaxId) {
        const existingByGstTaxId = await storage.getClientByGstTaxId(updateData.gstTaxId);
        if (existingByGstTaxId && existingByGstTaxId.id !== req.params.id) {
          return res.status(400).json({ error: "A client with this GST/Tax ID already exists" });
        }
      }

      const client = await storage.updateClient(req.params.id, updateData);

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json(client);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", requirePermission("clients:delete"), async (req: Request, res: Response) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Delete related records first - wrap in try-catch for each type
      try {
        // Delete CR invoices (if any)
        try {
          const crInvoices = await storage.getCrInvoices({ clientId: req.params.id });
          for (const invoice of crInvoices) {
            await storage.deleteCrInvoice(invoice.id);
          }
        } catch (err) {
          console.error('[WARN] Error deleting CR invoices:', err);
        }

        // Delete notifications (if any)
        try {
          await db.delete(schema.notifications).where(eq(schema.notifications.clientId, req.params.id));
        } catch (err) {
          console.error('[WARN] Error deleting notifications:', err);
        }

        // Delete AI insights (if any)
        try {
          await db.delete(schema.aiInsights).where(eq(schema.aiInsights.clientId, req.params.id));
        } catch (err) {
          console.error('[WARN] Error deleting AI insights:', err);
        }

        // Delete invoices (if any)
        try {
          const invoices = await storage.getInvoices({ clientId: req.params.id });
          for (const invoice of invoices) {
            await storage.deleteInvoice(invoice.id);
          }
        } catch (err) {
          console.error('[WARN] Error deleting invoices:', err);
        }

        // Delete agreements (if any)
        try {
          const agreements = await storage.getAgreements({ clientId: req.params.id });
          for (const agreement of agreements) {
            await storage.deleteAgreement(agreement.id);
          }
        } catch (err) {
          console.error('[WARN] Error deleting agreements:', err);
        }

        // Delete services (if any)
        try {
          const services = await storage.getServices({ clientId: req.params.id });
          for (const service of services) {
            await storage.deleteService(service.id);
          }
        } catch (err) {
          console.error('[WARN] Error deleting services:', err);
        }

        // Finally delete the client
        try {
          const success = await storage.deleteClient(req.params.id);
          if (!success) {
            throw new Error("Client not found or already deleted");
          }
          console.log('[INFO] Client deleted successfully:', req.params.id);
          res.json({ success: true, message: "Client deleted successfully" });
        } catch (clientDeleteError: any) {
          console.error('[ERROR] Client deletion failed:', clientDeleteError);
          throw new Error(`Database deletion failed: ${clientDeleteError.message}`);
        }
      } catch (deleteError: any) {
        console.error('[ERROR] Failed to delete client:', deleteError);
        return res.status(500).json({ error: deleteError.message || "Failed to delete client" });
      }
    } catch (error: any) {
      console.error('[ERROR] Delete client error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const { search, clientId, serviceType, currency } = req.query;
      const services = await storage.getServices({
        search: search as string,
        clientId: clientId as string,
        serviceType: serviceType as string,
        currency: currency as string,
      });

      const clients = await storage.getClients();
      const users = await storage.getUsers();
      const servicesWithClients = services.map(service => {
        const client = clients.find(c => c.id === service.clientId);
        const csm = service.assignedCsmId ? users.find(u => u.id === service.assignedCsmId) : null;
        return {
          ...service,
          clientName: client?.name || "Unknown",
          csmName: csm ? `${csm.firstName} ${csm.lastName}` : null,
        };
      });

      const stats = {
        total: services.length,
        recurring: services.filter(s => s.isRecurring).length,
        monthlyRevenue: services
          .filter(s => s.isRecurring && s.billingCycle?.includes("monthly"))
          .reduce((sum, s) => sum + Number(s.amount), 0),
        annualRevenue: services.reduce((sum, s) => sum + Number(s.amount), 0),
      };

      res.json({ data: servicesWithClients, stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/services", async (req: Request, res: Response) => {
    try {
      const serviceData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        goLiveDate: req.body.goLiveDate ? new Date(req.body.goLiveDate) : undefined,
        invoiceDate: req.body.invoiceDate ? new Date(req.body.invoiceDate) : undefined,
      };

      const validatedData = insertServiceSchema.parse(serviceData);
      const service = await storage.createService(validatedData);
      res.json(service);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const serviceData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        goLiveDate: req.body.goLiveDate ? new Date(req.body.goLiveDate) : undefined,
        invoiceDate: req.body.invoiceDate ? new Date(req.body.invoiceDate) : undefined,
      };

      const service = await storage.updateService(req.params.id, serviceData);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error: any) {
      log(`Error updating service: ${error.message}`);
      res.status(400).json({
        error: error.errors?.[0]?.message || error.message || "Invalid service data"
      });
    }
  });

  app.delete("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteService(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ message: "Service deleted successfully" });
    } catch (error: any) {
      log(`Error deleting service: ${error.message}`);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  app.get("/api/agreements", async (req: Request, res: Response) => {
    try {
      const { search, clientId, status } = req.query;
      const agreements = await storage.getAgreements({
        search: search as string,
        clientId: clientId as string,
        status: status as string,
      });

      const clients = await storage.getClients();
      const agreementsWithClients = agreements.map(agreement => {
        const client = clients.find(c => c.id === agreement.clientId);
        return {
          ...agreement,
          clientName: client?.name || "Unknown",
        };
      });

      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const stats = {
        total: agreements.length,
        expiringSoon: agreements.filter(a => {
          const endDate = new Date(a.endDate);
          return endDate > now && endDate <= ninetyDaysFromNow;
        }).length,
        totalValue: agreements.reduce((sum, a) => sum + Number(a.value || 0), 0),
      };

      res.json({ data: agreementsWithClients, stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agreements", async (req: Request, res: Response) => {
    try {
      const agreementData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        implementFees: req.body.implementFees || null,
        monthlySubscriptionFees: req.body.monthlySubscriptionFees || null,
        changeRequestFees: req.body.changeRequestFees || null,
      };

      const validatedData = insertAgreementSchema.parse(agreementData);
      const agreement = await storage.createAgreement(validatedData);

      const client = await storage.getClient(agreement.clientId);

      if (client?.assignedCsmId) {
        await storage.createNotification({
          userId: client.assignedCsmId,
          clientId: agreement.clientId,
          type: "agreement_renewal",
          title: "New Agreement Created",
          message: `New agreement "${agreement.agreementName}" has been created for ${client.name}. Contract expires on ${new Date(agreement.endDate).toLocaleDateString()}.`,
          relatedEntityId: agreement.id,
        });
      }

      const users = await storage.getUsers();
      const financeUsers = users.filter(u => u.role === "finance" || u.role === "admin");

      for (const financeUser of financeUsers) {
        await storage.createNotification({
          userId: financeUser.id,
          clientId: agreement.clientId,
          type: "agreement_renewal",
          title: "New Agreement Created",
          message: `New agreement "${agreement.agreementName}" created for ${client?.name}. Total value: ${agreement.currency} ${agreement.value}. Payment terms: ${req.body.paymentTerms || "N/A"}.`,
          relatedEntityId: agreement.id,
        });
      }

      res.json(agreement);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/agreements/:id", async (req: Request, res: Response) => {
    try {
      const agreement = await storage.getAgreement(req.params.id);
      if (!agreement) {
        return res.status(404).json({ error: "Agreement not found" });
      }

      const agreementData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        implementFees: req.body.implementFees || null,
        monthlySubscriptionFees: req.body.monthlySubscriptionFees || null,
        changeRequestFees: req.body.changeRequestFees || null,
      };

      const validatedData = insertAgreementSchema.parse(agreementData);
      const updatedAgreement = await storage.updateAgreement(req.params.id, validatedData);

      res.json(updatedAgreement);
    } catch (error: any) {
      console.error('[ERROR] Update agreement error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/agreements/:id", async (req: Request, res: Response) => {
    try {
      const agreement = await storage.getAgreement(req.params.id);
      if (!agreement) {
        return res.status(404).json({ error: "Agreement not found" });
      }

      const success = await storage.deleteAgreement(req.params.id);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete agreement" });
      }

      res.json({ success: true, message: "Agreement deleted successfully" });
    } catch (error: any) {
      console.error('[ERROR] Delete agreement error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/outstanding", async (req: Request, res: Response) => {
    try {
      const { currency, period } = req.query;
      const invoices = await storage.getInvoices({
        status: "pending",
        currency: currency as string,
        period: period as string,
      });

      const overdueInvoices = await storage.getInvoices({ status: "overdue" });
      const clients = await storage.getClients();

      const now = new Date();
      const invoicesWithDetails = [...invoices, ...overdueInvoices].map(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        const agingDays = Math.floor(
          (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...invoice,
          clientName: client?.name || "Unknown",
          agingDays,
        };
      });

      const stats = {
        total: invoicesWithDetails.reduce((sum, inv) => sum + Number(inv.amount), 0),
        overdue: overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
        overdueCount: overdueInvoices.length,
        avgAgingDays: Math.round(
          invoicesWithDetails.reduce((sum, inv) => sum + inv.agingDays, 0) / invoicesWithDetails.length || 0
        ),
      };

      res.json({ invoices: invoicesWithDetails, ...stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/revenue", async (req: Request, res: Response) => {
    try {
      const { currency, period } = req.query;
      const invoices = await storage.getInvoices({
        status: "paid",
        currency: currency as string,
        period: period as string,
      });

      const services = await storage.getServices();
      const clients = await storage.getClients();

      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

      const byServiceType = services.reduce((acc: any, service) => {
        const type = service.serviceType;
        if (!acc[type]) {
          acc[type] = { type, revenue: 0, count: 0 };
        }
        acc[type].revenue += Number(service.amount);
        acc[type].count += 1;
        return acc;
      }, {});

      const byServiceTypeArray = Object.values(byServiceType).map((item: any) => ({
        ...item,
        percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
      }));

      const clientRevenue = clients.map(client => {
        const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
        const revenue = clientInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        return {
          id: client.id,
          name: client.name,
          industry: client.industry,
          revenue,
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      res.json({
        total: Math.round(totalRevenue),
        growthRate: 12,
        avgDealSize: Math.round(totalRevenue / clients.length || 0),
        byServiceType: byServiceTypeArray,
        topClients: clientRevenue,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/insights", async (req: Request, res: Response) => {
    try {
      const clients = await storage.getClients();
      const services = await storage.getServices();
      const invoices = await storage.getInvoices();

      const paidInvoices = invoices.filter(inv => inv.status === "paid");
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const avgRevenue = totalRevenue / Math.max(paidInvoices.length, 1);

      const clientHealthScores = clients.slice(0, 5).map((client, index) => {
        const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
        const overdueCount = clientInvoices.filter(inv => inv.status === "overdue").length;
        const score = Math.max(50, Math.min(100, 90 - (overdueCount * 10) - (index * 2)));

        return {
          id: client.id,
          name: client.name,
          industry: client.industry,
          score,
          reason: score >= 80
            ? "Excellent payment history and engagement"
            : score >= 50
            ? "Good overall performance with minor concerns"
            : "Requires immediate attention",
        };
      });

      const profitabilityAnalysis = clients.slice(0, 5).map((client, index) => {
        const clientServices = services.filter(s => s.clientId === client.id);
        const revenue = clientServices.reduce((sum, s) => sum + Number(s.amount), 0);

        return {
          id: client.id,
          name: client.name,
          revenue: Math.round(revenue),
          marginPercent: 25 + (index * 3),
        };
      }).sort((a, b) => b.marginPercent - a.marginPercent);

      const recommendations = [
        {
          priority: "high",
          title: "Review Outstanding Invoices",
          description: "3 clients have invoices overdue by more than 30 days. Immediate follow-up recommended.",
          potentialImpact: 45000,
        },
        {
          priority: "medium",
          title: "Renewal Opportunities",
          description: "5 high-value agreements expiring in the next 60 days. Start renewal discussions now.",
          potentialImpact: 120000,
        },
        {
          priority: "medium",
          title: "Upsell Potential",
          description: "8 clients with single services could benefit from additional offerings.",
          potentialImpact: 85000,
        },
      ];

      res.json({
        revenueForecast: {
          amount: Math.round(avgRevenue * 1.15),
          confidence: 85,
        },
        atRiskClients: {
          count: Math.floor(clients.length * 0.08),
          totalValue: Math.round(totalRevenue * 0.12),
        },
        churnProbability: 12,
        clientHealthScores,
        profitabilityAnalysis,
        recommendations,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notifications", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { unreadOnly } = req.query;
      const notifications = await storage.getNotifications(mockUser.id, unreadOnly === "true");
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(mockUser.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CR Invoices routes
  app.get("/api/cr-invoices", async (req: Request, res: Response) => {
    try {
      const { search, clientId, status } = req.query;
      const invoices = await storage.getCrInvoices({
        search: search as string,
        clientId: clientId as string,
        status: status as string,
      });

      const clients = await storage.getClients();
      const invoicesWithClients = invoices.map(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        return {
          ...invoice,
          clientName: client?.name || "Unknown",
        };
      });

      res.json(invoicesWithClients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/cr-invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getCrInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "CR Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cr-invoices", async (req: Request, res: Response) => {
    try {
      const invoiceData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const invoice = await storage.createCrInvoice(invoiceData);
      
      // Send email to all admin users if status is approved
      if (invoice.status === "approved") {
        const users = await storage.getUsers();
        const adminUsers = users.filter(u => u.role === "admin");
        const client = await storage.getClient(invoice.clientId);
        
        for (const admin of adminUsers) {
          try {
            const emailData = {
              to: admin.email,
              subject: "CR-Invoice Approved - Action Required",
              message: `Hello ${admin.firstName} ${admin.lastName},

A new CR-Invoice has been created and approved in the system.

CR-Invoice Details:
- CR No: ${invoice.crNo}
- Client: ${client?.name || "Unknown"}
- Employee: ${invoice.employeeName}
- Amount: ${invoice.crCurrency} ${Number(invoice.amount).toLocaleString()}
- Period: ${new Date(invoice.startDate).toLocaleDateString()} to ${new Date(invoice.endDate).toLocaleDateString()}
- Status: Approved

Please review and take necessary action.

Best regards,
Infiniti CMS Team`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">CR-Invoice Approved</h2>
                    <p style="color: #555; line-height: 1.6;">Hello <strong>${admin.firstName} ${admin.lastName}</strong>,</p>
                    <p style="color: #555; line-height: 1.6;">A new CR-Invoice has been created and approved in the system.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">CR-Invoice Details</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">CR No:</td>
                          <td style="padding: 8px 0; color: #333;">${invoice.crNo}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Client:</td>
                          <td style="padding: 8px 0; color: #333;">${client?.name || "Unknown"}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Employee:</td>
                          <td style="padding: 8px 0; color: #333;">${invoice.employeeName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Amount:</td>
                          <td style="padding: 8px 0; color: #333; font-weight: 600;">${invoice.crCurrency} ${Number(invoice.amount).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Period:</td>
                          <td style="padding: 8px 0; color: #333;">${new Date(invoice.startDate).toLocaleDateString()} to ${new Date(invoice.endDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Status:</td>
                          <td style="padding: 8px 0;">
                            <span style="background-color: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">Approved</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6;">Please review and take necessary action.</p>
                    <p style="color: #555; margin-top: 30px;">Best regards,<br><strong>Infiniti CMS Team</strong></p>
                  </div>
                </div>
              `,
            };

            await fetch("http://localhost:5000/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emailData),
            });
          } catch (emailError: any) {
            console.error(`[WARN] Failed to send email to admin ${admin.email}:`, emailError.message);
          }
        }
      }
      
      res.json(invoice);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/cr-invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoiceData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };

      const oldInvoice = await storage.getCrInvoice(req.params.id);
      const invoice = await storage.updateCrInvoice(req.params.id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ error: "CR Invoice not found" });
      }
      
      // Send email to all admin users if status changed to approved
      if (invoice.status === "approved" && oldInvoice?.status !== "approved") {
        const users = await storage.getUsers();
        const adminUsers = users.filter(u => u.role === "admin");
        const client = await storage.getClient(invoice.clientId);
        
        for (const admin of adminUsers) {
          try {
            const emailData = {
              to: admin.email,
              subject: "CR-Invoice Approved - Action Required",
              message: `Hello ${admin.firstName} ${admin.lastName},

A CR-Invoice has been approved in the system.

CR-Invoice Details:
- CR No: ${invoice.crNo}
- Client: ${client?.name || "Unknown"}
- Employee: ${invoice.employeeName}
- Amount: ${invoice.crCurrency} ${Number(invoice.amount).toLocaleString()}
- Period: ${new Date(invoice.startDate).toLocaleDateString()} to ${new Date(invoice.endDate).toLocaleDateString()}
- Status: Approved

Please review and take necessary action.

Best regards,
Infiniti CMS Team`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">CR-Invoice Approved</h2>
                    <p style="color: #555; line-height: 1.6;">Hello <strong>${admin.firstName} ${admin.lastName}</strong>,</p>
                    <p style="color: #555; line-height: 1.6;">A CR-Invoice has been approved in the system.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
                      <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">CR-Invoice Details</h3>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">CR No:</td>
                          <td style="padding: 8px 0; color: #333;">${invoice.crNo}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Client:</td>
                          <td style="padding: 8px 0; color: #333;">${client?.name || "Unknown"}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Employee:</td>
                          <td style="padding: 8px 0; color: #333;">${invoice.employeeName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Amount:</td>
                          <td style="padding: 8px 0; color: #333; font-weight: 600;">${invoice.crCurrency} ${Number(invoice.amount).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Period:</td>
                          <td style="padding: 8px 0; color: #333;">${new Date(invoice.startDate).toLocaleDateString()} to ${new Date(invoice.endDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #666; font-weight: 600;">Status:</td>
                          <td style="padding: 8px 0;">
                            <span style="background-color: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">Approved</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6;">Please review and take necessary action.</p>
                    <p style="color: #555; margin-top: 30px;">Best regards,<br><strong>Infiniti CMS Team</strong></p>
                  </div>
                </div>
              `,
            };

            await fetch("http://localhost:5000/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(emailData),
            });
          } catch (emailError: any) {
            console.error(`[WARN] Failed to send email to admin ${admin.email}:`, emailError.message);
          }
        }
      }
      
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/cr-invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getCrInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "CR Invoice not found" });
      }

      const success = await storage.deleteCrInvoice(req.params.id);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete CR Invoice" });
      }

      res.json({ success: true, message: "CR Invoice deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/notifications/urgent", async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const invoices = await storage.getInvoices({ status: "overdue" });
      const agreements = await storage.getAgreements();
      const clients = await storage.getClients();

      const urgentCases = [];

      for (const invoice of invoices) {
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOverdue >= 15) {
          const client = clients.find(c => c.id === invoice.clientId);
          let severity = "medium";
          if (daysOverdue >= 45) severity = "critical";
          else if (daysOverdue >= 30) severity = "high";

          urgentCases.push({
            id: `invoice-${invoice.id}`,
            type: "overdue_payment",
            severity,
            title: `Invoice ${invoice.invoiceNumber} Overdue`,
            message: `${client?.name || "Unknown Client"} - ${daysOverdue} days overdue - ${invoice.currency} ${invoice.amount}`,
            clientId: invoice.clientId,
            clientName: client?.name || "Unknown",
            relatedEntityId: invoice.id,
            daysOverdue,
            amount: invoice.amount,
            currency: invoice.currency,
          });
        }
      }

      for (const agreement of agreements) {
        const daysUntilExpiry = Math.floor(
          (new Date(agreement.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
          const client = clients.find(c => c.id === agreement.clientId);
          let severity = "low";
          if (daysUntilExpiry <= 14) severity = "high";
          else if (daysUntilExpiry <= 30) severity = "medium";

          urgentCases.push({
            id: `agreement-${agreement.id}`,
            type: "agreement_renewal",
            severity,
            title: `Agreement Renewal Due Soon`,
            message: `${client?.name || "Unknown Client"} - ${agreement.agreementName} expires in ${daysUntilExpiry} days`,
            clientId: agreement.clientId,
            clientName: client?.name || "Unknown",
            relatedEntityId: agreement.id,
            daysUntilExpiry,
            agreementName: agreement.agreementName,
          });
        }
      }

      urgentCases.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      res.json(urgentCases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Management Routes
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check for duplicate email
      const existingEmail = await db.select().from(schema.users).where(eq(schema.users.email, userData.email));
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
      
      // Check for duplicate username if provided
      if (userData.username) {
        const existingUsername = await db.select().from(schema.users).where(eq(schema.users.username, userData.username));
        if (existingUsername.length > 0) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      
      // Check for duplicate email if email is being updated
      if (updates.email) {
        const existingEmail = await db.select().from(schema.users)
          .where(sql`${schema.users.email} = ${updates.email} AND ${schema.users.id} != ${req.params.id}`);
        if (existingEmail.length > 0) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }
      
      // Check for duplicate username if username is being updated
      if (updates.username) {
        const existingUsername = await db.select().from(schema.users)
          .where(sql`${schema.users.username} = ${updates.username} AND ${schema.users.id} != ${req.params.id}`);
        if (existingUsername.length > 0) {
          return res.status(400).json({ error: "Username already exists" });
        }
      }
      
      // If password is empty string during update, remove it from updates
      if (updates.password === "") {
        delete updates.password;
      }
      
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      // Prevent deleting the last admin
      const users = await storage.getUsers();
      const admins = users.filter(u => u.role === "admin");
      const userToDelete = users.find(u => u.id === req.params.id);
      
      if (userToDelete?.role === "admin" && admins.length === 1) {
        return res.status(400).json({ error: "Cannot delete the last admin user" });
      }
      
      await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users/:id/reset-password", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Generate a password reset token (in production, this should be stored in DB with expiry)
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetLink = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
      
      // Send password reset email with HTML formatting
      const emailData = {
        to: user.email,
        subject: "Password Reset Request - Infiniti CMS",
        message: `Hello ${user.firstName} ${user.lastName},

We received a request to reset your password for your Infiniti CMS account.

To reset your password, please click the link below:
${resetLink}

This link will expire in 24 hours for security reasons.

If you did not request a password reset, please ignore this email or contact your system administrator.

Best regards,
Infiniti CMS Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
              <p style="color: #555; line-height: 1.6;">Hello <strong>${user.firstName} ${user.lastName}</strong>,</p>
              <p style="color: #555; line-height: 1.6;">We received a request to reset your password for your Infiniti CMS account.</p>
              <p style="color: #555; line-height: 1.6;">To reset your password, please click the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
              </div>
              <p style="color: #555; line-height: 1.6; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #4F46E5; word-break: break-all; font-size: 14px;"><a href="${resetLink}" style="color: #4F46E5;">${resetLink}</a></p>
              <p style="color: #777; line-height: 1.6; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">This link will expire in 24 hours for security reasons.</p>
              <p style="color: #777; line-height: 1.6; font-size: 13px;">If you did not request a password reset, please ignore this email or contact your system administrator.</p>
              <p style="color: #555; margin-top: 30px;">Best regards,<br><strong>Infiniti CMS Team</strong></p>
            </div>
          </div>
        `,
      };

      // Use the email service
      const emailResponse = await fetch("http://localhost:5000/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (!emailResponse.ok) {
        const error = await emailResponse.json();
        throw new Error(error.error || "Failed to send password reset email");
      }
      
      res.json({ success: true, message: "Password reset email sent successfully" });
    } catch (error: any) {
      console.error('[ERROR] Failed to send password reset email:', error);
      res.status(500).json({ error: error.message || "Failed to send password reset email" });
    }
  });

  // Email sending endpoint
  app.post("/api/email/send", sendEmail);
}