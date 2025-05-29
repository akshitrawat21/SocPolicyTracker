import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Policy types enum values
export const policyTypeEnum = ["INFORMATION_SECURITY", "ACCEPTABLE_USE", "CRYPTO", "DATA_PROTECTION", "INCIDENT_RESPONSE", "CUSTOM"] as const;

// Policies table
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // One of policyTypeEnum
  isTemplate: boolean("is_template").default(false).notNull(),
  templateSource: text("template_source"), // "SPRINTO" or "CUSTOM"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Policy version status enum
export const versionStatusEnum = ["DRAFT", "PENDING", "APPROVED", "DEPRECATED"] as const;

// Policy versions table
export const policyVersions = pgTable("policy_versions", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => policies.id).notNull(),
  version: text("version").notNull(), // e.g., "v1.0", "v2.1"
  content: text("content").notNull(),
  status: text("status").notNull(), // One of versionStatusEnum
  configData: jsonb("config_data"), // JSON configuration for policy
  approvedBy: integer("approved_by").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  createdBy: integer("created_by").references(() => employees.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Roles table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employee roles junction table
export const employeeRoles = pgTable("employee_roles", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Role policy assignments
export const rolePolicyAssignments = pgTable("role_policy_assignments", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  policyVersionId: integer("policy_version_id").references(() => policyVersions.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Acknowledgement trigger types
export const ackTriggerTypeEnum = ["ONBOARD", "PERIODIC", "MANUAL"] as const;

// Acknowledgement requests
export const acknowledgementRequests = pgTable("acknowledgement_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  policyVersionId: integer("policy_version_id").references(() => policyVersions.id).notNull(),
  triggerType: text("trigger_type").notNull(), // One of ackTriggerTypeEnum
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  escalatedAt: timestamp("escalated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Acknowledgement events (audit trail)
export const acknowledgementEvents = pgTable("acknowledgement_events", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => acknowledgementRequests.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  policyVersionId: integer("policy_version_id").references(() => policyVersions.id).notNull(),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alert escalations
export const alertEscalations = pgTable("alert_escalations", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => acknowledgementRequests.id).notNull(),
  escalatedTo: text("escalated_to").notNull(), // "CTO", "CXO", etc.
  escalatedAt: timestamp("escalated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Template upgrades tracking
export const templateUpgrades = pgTable("template_upgrades", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  policyType: text("policy_type").notNull(),
  currentVersion: text("current_version").notNull(),
  availableVersion: text("available_version").notNull(),
  notifiedAt: timestamp("notified_at").defaultNow().notNull(),
  upgradeCompletedAt: timestamp("upgrade_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  policies: many(policies),
  employees: many(employees),
  roles: many(roles),
  templateUpgrades: many(templateUpgrades),
}));

export const policiesRelations = relations(policies, ({ one, many }) => ({
  company: one(companies, {
    fields: [policies.companyId],
    references: [companies.id],
  }),
  versions: many(policyVersions),
}));

export const policyVersionsRelations = relations(policyVersions, ({ one, many }) => ({
  policy: one(policies, {
    fields: [policyVersions.policyId],
    references: [policies.id],
  }),
  approver: one(employees, {
    fields: [policyVersions.approvedBy],
    references: [employees.id],
  }),
  creator: one(employees, {
    fields: [policyVersions.createdBy],
    references: [employees.id],
  }),
  roleAssignments: many(rolePolicyAssignments),
  acknowledgementRequests: many(acknowledgementRequests),
  acknowledgementEvents: many(acknowledgementEvents),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  company: one(companies, {
    fields: [roles.companyId],
    references: [companies.id],
  }),
  employeeRoles: many(employeeRoles),
  policyAssignments: many(rolePolicyAssignments),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  roles: many(employeeRoles),
  acknowledgementRequests: many(acknowledgementRequests),
  acknowledgementEvents: many(acknowledgementEvents),
  approvedVersions: many(policyVersions, {
    relationName: "approver",
  }),
  createdVersions: many(policyVersions, {
    relationName: "creator",
  }),
}));

export const employeeRolesRelations = relations(employeeRoles, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeRoles.employeeId],
    references: [employees.id],
  }),
  role: one(roles, {
    fields: [employeeRoles.roleId],
    references: [roles.id],
  }),
}));

export const rolePolicyAssignmentsRelations = relations(rolePolicyAssignments, ({ one }) => ({
  role: one(roles, {
    fields: [rolePolicyAssignments.roleId],
    references: [roles.id],
  }),
  policyVersion: one(policyVersions, {
    fields: [rolePolicyAssignments.policyVersionId],
    references: [policyVersions.id],
  }),
}));

export const acknowledgementRequestsRelations = relations(acknowledgementRequests, ({ one, many }) => ({
  employee: one(employees, {
    fields: [acknowledgementRequests.employeeId],
    references: [employees.id],
  }),
  policyVersion: one(policyVersions, {
    fields: [acknowledgementRequests.policyVersionId],
    references: [policyVersions.id],
  }),
  events: many(acknowledgementEvents),
  escalations: many(alertEscalations),
}));

export const acknowledgementEventsRelations = relations(acknowledgementEvents, ({ one }) => ({
  request: one(acknowledgementRequests, {
    fields: [acknowledgementEvents.requestId],
    references: [acknowledgementRequests.id],
  }),
  employee: one(employees, {
    fields: [acknowledgementEvents.employeeId],
    references: [employees.id],
  }),
  policyVersion: one(policyVersions, {
    fields: [acknowledgementEvents.policyVersionId],
    references: [policyVersions.id],
  }),
}));

export const alertEscalationsRelations = relations(alertEscalations, ({ one }) => ({
  request: one(acknowledgementRequests, {
    fields: [alertEscalations.requestId],
    references: [acknowledgementRequests.id],
  }),
}));

export const templateUpgradesRelations = relations(templateUpgrades, ({ one }) => ({
  company: one(companies, {
    fields: [templateUpgrades.companyId],
    references: [companies.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPolicySchema = createInsertSchema(policies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPolicyVersionSchema = createInsertSchema(policyVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeRoleSchema = createInsertSchema(employeeRoles).omit({
  id: true,
  assignedAt: true,
});

export const insertRolePolicyAssignmentSchema = createInsertSchema(rolePolicyAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertAcknowledgementRequestSchema = createInsertSchema(acknowledgementRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  escalatedAt: true,
});

export const insertAcknowledgementEventSchema = createInsertSchema(acknowledgementEvents).omit({
  id: true,
  createdAt: true,
  acknowledgedAt: true,
});

export const insertAlertEscalationSchema = createInsertSchema(alertEscalations).omit({
  id: true,
  createdAt: true,
  escalatedAt: true,
  resolvedAt: true,
});

export const insertTemplateUpgradeSchema = createInsertSchema(templateUpgrades).omit({
  id: true,
  createdAt: true,
  notifiedAt: true,
  upgradeCompletedAt: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;

export type PolicyVersion = typeof policyVersions.$inferSelect;
export type InsertPolicyVersion = z.infer<typeof insertPolicyVersionSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type EmployeeRole = typeof employeeRoles.$inferSelect;
export type InsertEmployeeRole = z.infer<typeof insertEmployeeRoleSchema>;

export type RolePolicyAssignment = typeof rolePolicyAssignments.$inferSelect;
export type InsertRolePolicyAssignment = z.infer<typeof insertRolePolicyAssignmentSchema>;

export type AcknowledgementRequest = typeof acknowledgementRequests.$inferSelect;
export type InsertAcknowledgementRequest = z.infer<typeof insertAcknowledgementRequestSchema>;

export type AcknowledgementEvent = typeof acknowledgementEvents.$inferSelect;
export type InsertAcknowledgementEvent = z.infer<typeof insertAcknowledgementEventSchema>;

export type AlertEscalation = typeof alertEscalations.$inferSelect;
export type InsertAlertEscalation = z.infer<typeof insertAlertEscalationSchema>;

export type TemplateUpgrade = typeof templateUpgrades.$inferSelect;
export type InsertTemplateUpgrade = z.infer<typeof insertTemplateUpgradeSchema>;

// Extended types for API responses
export type PolicyWithVersions = Policy & {
  versions: PolicyVersion[];
  latestVersion?: PolicyVersion;
};

export type EmployeeWithRoles = Employee & {
  roles: (EmployeeRole & { role: Role })[];
};

export type AcknowledgementRequestWithDetails = AcknowledgementRequest & {
  employee: Employee;
  policyVersion: PolicyVersion & { policy: Policy };
};

export type DashboardMetrics = {
  totalPolicies: number;
  pendingApprovals: number;
  complianceRate: number;
  overdueAcknowledgements: number;
  totalEmployees: number;
  acknowledgementsThisMonth: number;
};
