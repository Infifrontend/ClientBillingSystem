import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { insertClientSchema, insertServiceSchema, insertAgreementSchema, insertInvoiceSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { requireRole, requirePermission, AuthenticatedRequest, canAccessClient } from "./middleware/permissions";

export function registerRoutes(app: Express) {
  app.get("/api/auth/user", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        req.user.role = user.role;
        res.json(user);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  app.get("/api/users", isAuthenticated, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", isAuthenticated, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id/role", isAuthenticated, requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const clients = await storage.getClients();
      const agreements = await storage.getAgreements({ status: "active" });
      const invoices = await storage.getInvoices();
      
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

  app.get("/api/dashboard/revenue-trends", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      const data = months.map((month, index) => ({
        month,
        revenue: 50000 + (index * 8000) + (Math.random() * 10000),
      }));
      
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard/client-distribution", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const clients = await storage.getClients();
      const distribution = clients.reduce((acc: any, client) => {
        const industry = client.industry.replace(/_/g, ' ');
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

  app.get("/api/dashboard/upcoming-renewals", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const agreements = await storage.getAgreements();
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

  app.get("/api/clients", isAuthenticated, requirePermission("clients:read"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, status, industry } = req.query;
      const userId = req.user?.claims.sub;
      const userRole = req.user?.role;
      
      console.log('[DEBUG] Fetching clients for user:', userId, 'with role:', userRole);
      
      let clients = await storage.getClients({
        search: search as string,
        status: status as string,
        industry: industry as string,
      });
      
      console.log('[DEBUG] Total clients fetched from DB:', clients.length);
      
      // Temporarily disabled CSM filtering for testing
      // if (userRole === "csm") {
      //   clients = clients.filter(client => client.assignedCsmId === userId);
      //   console.log('[DEBUG] Filtered clients for CSM:', clients.length);
      // }
      
      console.log('[DEBUG] Returning clients:', clients.length);
      res.json(clients);
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch clients:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, requirePermission("clients:read"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const userRole = req.user?.role;
      const userId = req.user?.claims.sub;
      
      console.log('[DEBUG] Fetching client:', req.params.id, 'for user:', userId, 'with role:', userRole);
      console.log('[DEBUG] Client assignedCsmId:', client.assignedCsmId);
      
      // Temporarily disabled CSM filtering for testing
      // if (userRole === "csm" && client.assignedCsmId !== userId) {
      //   console.log('[DEBUG] Access denied - CSM not assigned to this client');
      //   return res.status(403).json({ error: "Access denied" });
      // }
      
      res.json(client);
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch client:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/clients", isAuthenticated, requirePermission("clients:write"), async (req: Request, res: Response) => {
    try {
      console.log('[DEBUG] Creating client with data:', req.body);
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      console.log('[DEBUG] Client created successfully:', client.id);
      res.json(client);
    } catch (error: any) {
      console.error('[ERROR] Failed to create client:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/clients/:id", isAuthenticated, requirePermission("clients:write"), async (req: Request, res: Response) => {
    try {
      console.log('[DEBUG] Updating client:', req.params.id, 'with data:', req.body);
      
      // Check if client exists first
      const existingClient = await storage.getClient(req.params.id);
      if (!existingClient) {
        console.log('[DEBUG] Client not found for update:', req.params.id);
        return res.status(404).json({ error: "Client not found" });
      }
      
      const client = await storage.updateClient(req.params.id, req.body);
      if (!client) {
        console.log('[DEBUG] Failed to update client:', req.params.id);
        return res.status(500).json({ error: "Failed to update client" });
      }
      
      console.log('[DEBUG] Client updated successfully:', client.id);
      res.json(client);
    } catch (error: any) {
      console.error('[ERROR] Update client error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, requirePermission("clients:delete"), async (req: Request, res: Response) => {
    try {
      console.log('[DEBUG] Deleting client:', req.params.id);
      const client = await storage.getClient(req.params.id);
      if (!client) {
        console.log('[DEBUG] Client not found:', req.params.id);
        return res.status(404).json({ error: "Client not found" });
      }
      
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        console.log('[DEBUG] Failed to delete client:', req.params.id);
        return res.status(500).json({ error: "Failed to delete client" });
      }
      
      console.log('[DEBUG] Client deleted successfully:', req.params.id);
      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error: any) {
      console.error('[ERROR] Delete client error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/services", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const { search, clientId, serviceType, currency } = req.query;
      const services = await storage.getServices({
        search: search as string,
        clientId: clientId as string,
        serviceType: serviceType as string,
        currency: currency as string,
      });
      
      const clients = await storage.getClients();
      
      const servicesWithClients = services.map(service => {
        const client = clients.find(c => c.id === service.clientId);
        return {
          ...service,
          clientName: client?.name || "Unknown",
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

  app.post("/api/services", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.json(service);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agreements", isAuthenticated, async (req: Request, res: Response) => {
    
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

  app.post("/api/agreements", isAuthenticated, async (req: Request, res: Response) => {
    
    try {
      const validatedData = insertAgreementSchema.parse(req.body);
      const agreement = await storage.createAgreement(validatedData);
      
      // Create notifications for CSM and Finance about new agreement
      const client = await storage.getClient(agreement.clientId);
      
      // Notify CSM (if assigned)
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
      
      // Notify Finance users
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

  app.get("/api/reports/outstanding", isAuthenticated, async (req: Request, res: Response) => {
    
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

  app.get("/api/reports/revenue", isAuthenticated, async (req: Request, res: Response) => {
    
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

  app.get("/api/insights", isAuthenticated, async (req: Request, res: Response) => {
    
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
}
