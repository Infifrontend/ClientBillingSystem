import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, or, like, desc, asc, sql, gt, lt, gte, lte, inArray } from "drizzle-orm";
import ws from "ws";
import * as schema from "@shared/schema";
import type {
  User,
  Client,
  InsertClient,
  Service,
  InsertService,
  Agreement,
  InsertAgreement,
  Invoice,
  InsertInvoice,
  Notification,
  InsertNotification,
  AiInsight,
  InsertAiInsight,
  CrInvoice,
  InsertCrInvoice,
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const db = drizzle({
  connection: process.env.DATABASE_URL,
  ws: ws,
  schema,
});

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  upsertUser(user: any): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // New user management methods
  getUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;


  getClients(filters?: { search?: string; status?: string; industry?: string; assignedCsmId?: string }): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  getServices(filters?: { search?: string; clientId?: string; serviceType?: string; currency?: string }): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

  getAgreements(filters?: { search?: string; clientId?: string; status?: string }): Promise<Agreement[]>;
  getAgreement(id: string): Promise<Agreement | undefined>;
  createAgreement(agreement: InsertAgreement): Promise<Agreement>;
  updateAgreement(id: string, updates: Partial<InsertAgreement>): Promise<Agreement | undefined>;
  deleteAgreement(id: string): Promise<boolean>;

  getInvoices(filters?: { clientId?: string; status?: string; currency?: string; period?: string }): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;

  getNotifications(userId?: string, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification | null>;
  markAllNotificationsAsRead(userId: string): Promise<boolean>;


  getAiInsights(filters?: { clientId?: string; insightType?: string }): Promise<AiInsight[]>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;

  getCrInvoices(filters?: { search?: string; clientId?: string; status?: string }): Promise<CrInvoice[]>;
  getCrInvoice(id: string): Promise<CrInvoice | undefined>;
  createCrInvoice(invoice: InsertCrInvoice): Promise<CrInvoice>;
  updateCrInvoice(id: string, updates: Partial<InsertCrInvoice>): Promise<CrInvoice | undefined>;
  deleteCrInvoice(id: string): Promise<boolean>;
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async createUser(user: User): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async upsertUser(userData: any): Promise<User> {
    const result = await db
      .insert(schema.users)
      .values(userData)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(schema.users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  // New user management methods implementation
  async getUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const result = await db
      .update(schema.users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();
    return result[0];
  }


  async getClients(filters?: { search?: string; status?: string; industry?: string; assignedCsmId?: string }): Promise<Client[]> {
    let query = db.select().from(schema.clients);

    const conditions = [];
    if (filters?.search) {
      conditions.push(
        or(
          like(schema.clients.name, `%${filters.search}%`),
          like(schema.clients.email, `%${filters.search}%`),
          like(schema.clients.contactPerson, `%${filters.search}%`)
        )
      );
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(schema.clients.status, filters.status as any));
    }
    if (filters?.industry && filters.industry !== "all") {
      conditions.push(eq(schema.clients.industry, filters.industry as any));
    }
    if (filters?.assignedCsmId) {
      conditions.push(eq(schema.clients.assignedCsmId, filters.assignedCsmId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(schema.clients.createdAt));
    console.log('[STORAGE] getClients query returned:', results.length, 'clients');
    return results;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(schema.clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(schema.clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      const result = await db.delete(schema.clients).where(eq(schema.clients.id, id)).returning();
      console.log('[STORAGE] deleteClient result:', result);
      return result.length > 0;
    } catch (error) {
      console.error('[STORAGE] Error deleting client:', error);
      throw error; // Throw the error instead of returning false
    }
  }

  async getServices(filters?: { search?: string; clientId?: string; serviceType?: string; currency?: string }): Promise<Service[]> {
    let query = db.select().from(schema.services);

    const conditions = [];
    if (filters?.search) {
      conditions.push(like(schema.services.description, `%${filters.search}%`));
    }
    if (filters?.clientId) {
      conditions.push(eq(schema.services.clientId, filters.clientId));
    }
    if (filters?.serviceType && filters.serviceType !== "all") {
      conditions.push(eq(schema.services.serviceType, filters.serviceType as any));
    }
    if (filters?.currency && filters.currency !== "all") {
      conditions.push(eq(schema.services.currency, filters.currency as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(schema.services.createdAt));
  }

  async getService(id: string): Promise<Service | undefined> {
    const result = await db.select().from(schema.services).where(eq(schema.services.id, id)).limit(1);
    return result[0];
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await db.insert(schema.services).values(service).returning();
    return result[0];
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db.update(schema.services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.services.id, id))
      .returning();
    return result[0];
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await db.delete(schema.services).where(eq(schema.services.id, id)).returning();
    return result.length > 0;
  }

  async getAgreements(filters?: { search?: string; clientId?: string; status?: string }): Promise<Agreement[]> {
    let query = db.select().from(schema.agreements);

    const conditions = [];
    if (filters?.search) {
      conditions.push(like(schema.agreements.agreementName, `%${filters.search}%`));
    }
    if (filters?.clientId) {
      conditions.push(eq(schema.agreements.clientId, filters.clientId));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(schema.agreements.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(schema.agreements.createdAt));
  }

  async getAgreement(id: string): Promise<Agreement | undefined> {
    const result = await db.select().from(schema.agreements).where(eq(schema.agreements.id, id)).limit(1);
    return result[0];
  }

  async createAgreement(agreement: InsertAgreement): Promise<Agreement> {
    const result = await db.insert(schema.agreements).values(agreement).returning();
    return result[0];
  }

  async updateAgreement(id: string, updates: Partial<InsertAgreement>): Promise<Agreement | undefined> {
    const result = await db.update(schema.agreements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.agreements.id, id))
      .returning();
    return result[0];
  }

  async deleteAgreement(id: string): Promise<boolean> {
    const result = await db.delete(schema.agreements).where(eq(schema.agreements.id, id)).returning();
    return result.length > 0;
  }

  async getInvoices(filters?: { clientId?: string; status?: string; currency?: string; period?: string }): Promise<Invoice[]> {
    let query = db.select().from(schema.invoices);

    const conditions = [];
    if (filters?.clientId) {
      conditions.push(eq(schema.invoices.clientId, filters.clientId));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(schema.invoices.status, filters.status as any));
    }
    if (filters?.currency && filters.currency !== "all") {
      conditions.push(eq(schema.invoices.currency, filters.currency as any));
    }

    if (filters?.period && filters.period !== "all") {
      const now = new Date();
      const periodConditions = this.getPeriodConditions(filters.period, now);
      if (periodConditions) conditions.push(periodConditions);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(schema.invoices.issueDate));
  }

  private getPeriodConditions(period: string, now: Date) {
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastQuarter = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const ytd = new Date(now.getFullYear(), 0, 1);

    switch (period) {
      case "current_month":
        return gte(schema.invoices.issueDate, currentMonth);
      case "last_month":
        return and(
          gte(schema.invoices.issueDate, lastMonth),
          lt(schema.invoices.issueDate, currentMonth)
        );
      case "last_quarter":
        return gte(schema.invoices.issueDate, lastQuarter);
      case "last_year":
        return gte(schema.invoices.issueDate, lastYear);
      case "ytd":
        return gte(schema.invoices.issueDate, ytd);
      default:
        return undefined;
    }
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1);
    return result[0];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(schema.invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(schema.invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.invoices.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(schema.invoices).where(eq(schema.invoices.id, id)).returning();
    return result.length > 0;
  }

  async getNotifications(userId?: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let query = db.select().from(schema.notifications);

      const conditions = [];
      if (userId) {
        conditions.push(eq(schema.notifications.userId, userId));
      }
      if (unreadOnly) {
        conditions.push(eq(schema.notifications.isRead, false));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const result = await query.orderBy(desc(schema.notifications.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(schema.notifications).values(data).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    try {
      const [notification] = await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.id, id))
        .returning();
      return notification || null;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
      await db
        .update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.userId, userId));
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async getAiInsights(filters?: { clientId?: string; insightType?: string }): Promise<AiInsight[]> {
    let query = db.select().from(schema.aiInsights);

    const conditions = [];
    if (filters?.clientId) {
      conditions.push(eq(schema.aiInsights.clientId, filters.clientId));
    }
    if (filters?.insightType) {
      conditions.push(eq(schema.aiInsights.insightType, filters.insightType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(schema.aiInsights.generatedAt));
  }

  async createAiInsight(insight: InsertAiInsight): Promise<AiInsight> {
    const result = await db.insert(schema.aiInsights).values(insight).returning();
    return result[0];
  }

  async getCrInvoices(filters?: { search?: string; clientId?: string; status?: string }): Promise<CrInvoice[]> {
    let query = db.select().from(schema.crInvoices);

    const conditions = [];
    if (filters?.search) {
      conditions.push(
        or(
          like(schema.crInvoices.crNo, `%${filters.search}%`),
          like(schema.crInvoices.employeeName, `%${filters.search}%`)
        )
      );
    }
    if (filters?.clientId) {
      conditions.push(eq(schema.crInvoices.clientId, filters.clientId));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(schema.crInvoices.status, filters.status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(schema.crInvoices.createdAt));
  }

  async getCrInvoice(id: string): Promise<CrInvoice | undefined> {
    const result = await db.select().from(schema.crInvoices).where(eq(schema.crInvoices.id, id)).limit(1);
    return result[0];
  }

  async createCrInvoice(invoice: InsertCrInvoice): Promise<CrInvoice> {
    const result = await db.insert(schema.crInvoices).values(invoice).returning();
    return result[0];
  }

  async updateCrInvoice(id: string, updates: Partial<InsertCrInvoice>): Promise<CrInvoice | undefined> {
    const result = await db.update(schema.crInvoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.crInvoices.id, id))
      .returning();
    return result[0];
  }

  async deleteCrInvoice(id: string): Promise<boolean> {
    const result = await db.delete(schema.crInvoices).where(eq(schema.crInvoices.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DrizzleStorage();