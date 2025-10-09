import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (IMPORTANT: Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "finance", "csm", "viewer"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive"]);
export const industryEnum = pgEnum("industry", ["airlines", "travel_agency", "gds", "ota", "aviation_services"]);
export const serviceTypeEnum = pgEnum("service_type", ["implementation", "cr", "subscription", "hosting", "others"]);
export const currencyEnum = pgEnum("currency", ["INR", "USD", "EUR"]);
export const agreementStatusEnum = pgEnum("agreement_status", ["active", "inactive", "expiring_soon", "expired", "renewed"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "paid", "overdue", "cancelled"]);
export const notificationTypeEnum = pgEnum("notification_type", ["payment_reminder", "agreement_renewal", "overdue_payment", "system"]);

// Users table (IMPORTANT: Required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  employeeName: varchar("employee_name", { length: 255 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  gstTaxId: varchar("gst_tax_id", { length: 100 }),
  industry: industryEnum("industry").notNull(),
  region: varchar("region", { length: 100 }),
  status: clientStatusEnum("status").default("active").notNull(),
  assignedCsmId: varchar("assigned_csm_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services/Billing table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("USD").notNull(),
  startDate: timestamp("start_date"),
  goLiveDate: timestamp("go_live_date"),
  billingCycle: varchar("billing_cycle", { length: 50 }),
  isRecurring: boolean("is_recurring").default(false),
  assignedCsmId: varchar("assigned_csm_id").references(() => users.id),
  documentPath: varchar("document_path"),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  invoiceDate: timestamp("invoice_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agreements table
export const agreements = pgTable("agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "set null" }),
  agreementName: varchar("agreement_name", { length: 255 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }),
  currency: currencyEnum("currency").default("USD").notNull(),
  implementFees: decimal("implement_fees", { precision: 12, scale: 2 }),
  monthlySubscriptionFees: decimal("monthly_subscription_fees", { precision: 12, scale: 2 }),
  changeRequestFees: decimal("change_request_fees", { precision: 12, scale: 2 }),
  status: agreementStatusEnum("status").default("active").notNull(),
  documentPath: varchar("document_path"),
  autoRenewal: boolean("auto_renewal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "set null" }),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").default("USD").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: invoiceStatusEnum("status").default("pending").notNull(),
  documentPath: varchar("document_path"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedEntityId: varchar("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// CR Invoices table
export const crInvoiceStatusEnum = pgEnum("cr_invoice_status", ["initiated", "pending", "approved"]);

export const crInvoices = pgTable("cr_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }).notNull(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  crNo: varchar("cr_no", { length: 100 }).notNull().unique(),
  crCurrency: currencyEnum("cr_currency").default("INR").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  documentPath: varchar("document_path"),
  status: crInvoiceStatusEnum("status").default("initiated").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Insights table
export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "cascade" }),
  insightType: varchar("insight_type", { length: 50 }).notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  prediction: text("prediction"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedClients: many(clients),
  notifications: many(notifications),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  assignedCsm: one(users, {
    fields: [clients.assignedCsmId],
    references: [users.id],
  }),
  services: many(services),
  agreements: many(agreements),
  invoices: many(invoices),
  notifications: many(notifications),
  aiInsights: many(aiInsights),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  client: one(clients, {
    fields: [services.clientId],
    references: [clients.id],
  }),
  agreements: many(agreements),
  invoices: many(invoices),
}));

export const agreementsRelations = relations(agreements, ({ one }) => ({
  client: one(clients, {
    fields: [agreements.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [agreements.serviceId],
    references: [services.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [invoices.serviceId],
    references: [services.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [notifications.clientId],
    references: [clients.id],
  }),
}));

export const crInvoicesRelations = relations(crInvoices, ({ one }) => ({
  client: one(clients, {
    fields: [crInvoices.clientId],
    references: [clients.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  client: one(clients, {
    fields: [aiInsights.clientId],
    references: [clients.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgreementSchema = createInsertSchema(agreements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertCrInvoiceSchema = createInsertSchema(crInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({
  id: true,
  generatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertAgreement = z.infer<typeof insertAgreementSchema>;
export type Agreement = typeof agreements.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertCrInvoice = z.infer<typeof insertCrInvoiceSchema>;
export type CrInvoice = typeof crInvoices.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
