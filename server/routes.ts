
import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertClientSchema, insertServiceSchema, insertAgreementSchema, insertInvoiceSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { requireRole, requirePermission, AuthenticatedRequest, canAccessClient } from "./middleware/permissions";
import { log } from "./vite";

// Simple mock user for development - replace with your own auth logic
const mockUser = {
  id: "45703559",
  email: "admin@example.com",
  firstName: "Admin",
  lastName: "User",
  role: "admin" as const,
};

export function registerRoutes(app: Express) {
  app.get("/api/auth/user", async (req: any, res: Response) => {
    try {
      res.json(mockUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users", requireRole("admin"), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", requireRole("admin"), async (req: Request, res: Response) => {
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

  app.patch("/api/users/:id/role", requireRole("admin"), async (req: Request, res: Response) => {
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

  app.post("/api/clients", requirePermission("clients:write"), async (req: Request, res: Response) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/clients/:id", requirePermission("clients:write"), async (req: Request, res: Response) => {
    try {
      const existingClient = await storage.getClient(req.params.id);
      if (!existingClient) {
        return res.status(404).json({ error: "Client not found" });
      }

      const client = await storage.updateClient(req.params.id, req.body);
      if (!client) {
        return res.status(500).json({ error: "Failed to update client" });
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

      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(500).json({ error: "Failed to delete client" });
      }

      res.json({ success: true, message: "Client deleted successfully" });
    } catch (error: any) {
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
}
