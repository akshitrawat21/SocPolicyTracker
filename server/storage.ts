import { 
  companies, 
  policies, 
  policyVersions, 
  roles, 
  employees, 
  employeeRoles,
  rolePolicyAssignments,
  acknowledgementRequests,
  acknowledgementEvents,
  alertEscalations,
  templateUpgrades,
  type Company,
  type InsertCompany,
  type Policy,
  type InsertPolicy,
  type PolicyVersion,
  type InsertPolicyVersion,
  type Role,
  type InsertRole,
  type Employee,
  type InsertEmployee,
  type EmployeeRole,
  type InsertEmployeeRole,
  type RolePolicyAssignment,
  type InsertRolePolicyAssignment,
  type AcknowledgementRequest,
  type InsertAcknowledgementRequest,
  type AcknowledgementEvent,
  type InsertAcknowledgementEvent,
  type AlertEscalation,
  type InsertAlertEscalation,
  type TemplateUpgrade,
  type InsertTemplateUpgrade,
  type PolicyWithVersions,
  type EmployeeWithRoles,
  type AcknowledgementRequestWithDetails,
  type DashboardMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, lt, sql } from "drizzle-orm";

export interface IStorage {
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;

  // Dashboard
  getDashboardMetrics(companyId: number): Promise<DashboardMetrics>;

  // Policies
  getPolicies(companyId: number): Promise<PolicyWithVersions[]>;
  getPolicy(id: number): Promise<PolicyWithVersions | undefined>;
  createPolicy(data: InsertPolicy): Promise<PolicyWithVersions>;
  updatePolicy(id: number, data: Partial<InsertPolicy>): Promise<PolicyWithVersions | undefined>;

  // Policy Versions
  getPolicyVersions(policyId: number): Promise<PolicyVersion[]>;
  createPolicyVersion(data: InsertPolicyVersion): Promise<PolicyVersion>;
  approvePolicyVersion(id: number, approvedBy: number): Promise<PolicyVersion | undefined>;

  // Roles
  getRoles(companyId: number): Promise<Role[]>;
  createRole(data: InsertRole): Promise<Role>;
  assignPolicyToRole(data: InsertRolePolicyAssignment): Promise<RolePolicyAssignment>;
  getRolePolicyAssignments(roleId: number): Promise<RolePolicyAssignment[]>;

  // Employees
  getEmployees(companyId: number): Promise<EmployeeWithRoles[]>;
  getEmployee(id: number): Promise<EmployeeWithRoles | undefined>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  assignRoleToEmployee(data: InsertEmployeeRole): Promise<EmployeeRole>;

  // Acknowledgements
  getAcknowledgementRequests(companyId: number): Promise<AcknowledgementRequestWithDetails[]>;
  getEmployeeAcknowledgements(employeeId: number): Promise<AcknowledgementRequestWithDetails[]>;
  getOverdueAcknowledgements(companyId: number): Promise<AcknowledgementRequestWithDetails[]>;
  createAcknowledgementRequest(data: InsertAcknowledgementRequest): Promise<AcknowledgementRequest>;
  completeAcknowledgementRequest(requestId: number, employeeId: number, ipAddress?: string, userAgent?: string): Promise<void>;

  // Alert Escalations
  getAlertEscalations(companyId: number): Promise<AlertEscalation[]>;
  createAlertEscalation(data: InsertAlertEscalation): Promise<AlertEscalation>;

  // Template Upgrades
  getTemplateUpgrades(companyId: number): Promise<TemplateUpgrade[]>;
}

export class DatabaseStorage implements IStorage {
  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(data).returning();
    return company;
  }

  // Dashboard
  async getDashboardMetrics(companyId: number): Promise<DashboardMetrics> {
    const totalPoliciesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(policies)
      .where(eq(policies.companyId, companyId));

    const pendingApprovalsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(policyVersions)
      .innerJoin(policies, eq(policyVersions.policyId, policies.id))
      .where(and(
        eq(policies.companyId, companyId),
        eq(policyVersions.status, "PENDING")
      ));

    const totalEmployeesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.companyId, companyId));

    const overdueAcksResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(acknowledgementRequests)
      .innerJoin(employees, eq(acknowledgementRequests.employeeId, employees.id))
      .where(and(
        eq(employees.companyId, companyId),
        lt(acknowledgementRequests.dueDate, new Date()),
        sql`${acknowledgementRequests.completedAt} IS NULL`
      ));

    const completedThisMonthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(acknowledgementRequests)
      .innerJoin(employees, eq(acknowledgementRequests.employeeId, employees.id))
      .where(and(
        eq(employees.companyId, companyId),
        sql`${acknowledgementRequests.completedAt} IS NOT NULL`,
        sql`EXTRACT(month FROM ${acknowledgementRequests.completedAt}) = EXTRACT(month FROM CURRENT_DATE)`,
        sql`EXTRACT(year FROM ${acknowledgementRequests.completedAt}) = EXTRACT(year FROM CURRENT_DATE)`
      ));

    return {
      totalPolicies: totalPoliciesResult[0]?.count || 0,
      pendingApprovals: pendingApprovalsResult[0]?.count || 0,
      complianceRate: 85, // Mock calculation
      overdueAcknowledgements: overdueAcksResult[0]?.count || 0,
      totalEmployees: totalEmployeesResult[0]?.count || 0,
      acknowledgementsThisMonth: completedThisMonthResult[0]?.count || 0,
    };
  }

  // Policies
  async getPolicies(companyId: number): Promise<PolicyWithVersions[]> {
    const policiesWithVersions = await db
      .select()
      .from(policies)
      .leftJoin(policyVersions, eq(policies.id, policyVersions.policyId))
      .where(eq(policies.companyId, companyId))
      .orderBy(desc(policies.createdAt));

    const groupedPolicies = new Map<number, PolicyWithVersions>();

    for (const row of policiesWithVersions) {
      const policy = row.policies;
      const version = row.policy_versions;

      if (!groupedPolicies.has(policy.id)) {
        groupedPolicies.set(policy.id, {
          ...policy,
          versions: [],
          latestVersion: undefined,
        });
      }

      const policyData = groupedPolicies.get(policy.id)!;
      
      if (version) {
        policyData.versions.push(version);
        
        // Set latest version (most recent)
        if (!policyData.latestVersion || 
            new Date(version.createdAt) > new Date(policyData.latestVersion.createdAt)) {
          policyData.latestVersion = version;
        }
      }
    }

    return Array.from(groupedPolicies.values());
  }

  async getPolicy(id: number): Promise<PolicyWithVersions | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.id, id));
    if (!policy) return undefined;

    const versions = await db
      .select()
      .from(policyVersions)
      .where(eq(policyVersions.policyId, id))
      .orderBy(desc(policyVersions.createdAt));

    return {
      ...policy,
      versions,
      latestVersion: versions[0] || undefined,
    };
  }

  async createPolicy(data: InsertPolicy): Promise<PolicyWithVersions> {
    const [policy] = await db.insert(policies).values(data).returning();
    return {
      ...policy,
      versions: [],
      latestVersion: undefined,
    };
  }

  async updatePolicy(id: number, data: Partial<InsertPolicy>): Promise<PolicyWithVersions | undefined> {
    const [policy] = await db
      .update(policies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(policies.id, id))
      .returning();

    if (!policy) return undefined;

    const versions = await db
      .select()
      .from(policyVersions)
      .where(eq(policyVersions.policyId, id))
      .orderBy(desc(policyVersions.createdAt));

    return {
      ...policy,
      versions,
      latestVersion: versions[0] || undefined,
    };
  }

  // Policy Versions
  async getPolicyVersions(policyId: number): Promise<PolicyVersion[]> {
    return db
      .select()
      .from(policyVersions)
      .where(eq(policyVersions.policyId, policyId))
      .orderBy(desc(policyVersions.createdAt));
  }

  async createPolicyVersion(data: InsertPolicyVersion): Promise<PolicyVersion> {
    const [version] = await db.insert(policyVersions).values(data).returning();
    return version;
  }

  async approvePolicyVersion(id: number, approvedBy: number): Promise<PolicyVersion | undefined> {
    const [version] = await db
      .update(policyVersions)
      .set({
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(policyVersions.id, id))
      .returning();

    return version || undefined;
  }

  // Roles
  async getRoles(companyId: number): Promise<Role[]> {
    return db
      .select()
      .from(roles)
      .where(eq(roles.companyId, companyId))
      .orderBy(desc(roles.createdAt));
  }

  async createRole(data: InsertRole): Promise<Role> {
    const [role] = await db.insert(roles).values(data).returning();
    return role;
  }

  async assignPolicyToRole(data: InsertRolePolicyAssignment): Promise<RolePolicyAssignment> {
    const [assignment] = await db.insert(rolePolicyAssignments).values(data).returning();
    return assignment;
  }

  async getRolePolicyAssignments(roleId: number): Promise<RolePolicyAssignment[]> {
    return db
      .select()
      .from(rolePolicyAssignments)
      .where(eq(rolePolicyAssignments.roleId, roleId));
  }

  // Employees
  async getEmployees(companyId: number): Promise<EmployeeWithRoles[]> {
    const employeesWithRoles = await db
      .select()
      .from(employees)
      .leftJoin(employeeRoles, eq(employees.id, employeeRoles.employeeId))
      .leftJoin(roles, eq(employeeRoles.roleId, roles.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(employees.createdAt));

    const groupedEmployees = new Map<number, EmployeeWithRoles>();

    for (const row of employeesWithRoles) {
      const employee = row.employees;
      const employeeRole = row.employee_roles;
      const role = row.roles;

      if (!groupedEmployees.has(employee.id)) {
        groupedEmployees.set(employee.id, {
          ...employee,
          roles: [],
        });
      }

      const employeeData = groupedEmployees.get(employee.id)!;
      
      if (employeeRole && role) {
        employeeData.roles.push({
          ...employeeRole,
          role,
        });
      }
    }

    return Array.from(groupedEmployees.values());
  }

  async getEmployee(id: number): Promise<EmployeeWithRoles | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    if (!employee) return undefined;

    const employeeRolesData = await db
      .select()
      .from(employeeRoles)
      .innerJoin(roles, eq(employeeRoles.roleId, roles.id))
      .where(eq(employeeRoles.employeeId, id));

    return {
      ...employee,
      roles: employeeRolesData.map(row => ({
        ...row.employee_roles,
        role: row.roles,
      })),
    };
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(data).returning();
    return employee;
  }

  async assignRoleToEmployee(data: InsertEmployeeRole): Promise<EmployeeRole> {
    const [assignment] = await db.insert(employeeRoles).values(data).returning();
    return assignment;
  }

  // Acknowledgements
  async getAcknowledgementRequests(companyId: number): Promise<AcknowledgementRequestWithDetails[]> {
    const requests = await db
      .select()
      .from(acknowledgementRequests)
      .innerJoin(employees, eq(acknowledgementRequests.employeeId, employees.id))
      .innerJoin(policyVersions, eq(acknowledgementRequests.policyVersionId, policyVersions.id))
      .innerJoin(policies, eq(policyVersions.policyId, policies.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(acknowledgementRequests.createdAt));

    return requests.map(row => ({
      ...row.acknowledgement_requests,
      employee: row.employees,
      policyVersion: {
        ...row.policy_versions,
        policy: row.policies,
      },
    }));
  }

  async getEmployeeAcknowledgements(employeeId: number): Promise<AcknowledgementRequestWithDetails[]> {
    const requests = await db
      .select()
      .from(acknowledgementRequests)
      .innerJoin(employees, eq(acknowledgementRequests.employeeId, employees.id))
      .innerJoin(policyVersions, eq(acknowledgementRequests.policyVersionId, policyVersions.id))
      .innerJoin(policies, eq(policyVersions.policyId, policies.id))
      .where(eq(acknowledgementRequests.employeeId, employeeId))
      .orderBy(desc(acknowledgementRequests.createdAt));

    return requests.map(row => ({
      ...row.acknowledgement_requests,
      employee: row.employees,
      policyVersion: {
        ...row.policy_versions,
        policy: row.policies,
      },
    }));
  }

  async getOverdueAcknowledgements(companyId: number): Promise<AcknowledgementRequestWithDetails[]> {
    const requests = await db
      .select()
      .from(acknowledgementRequests)
      .innerJoin(employees, eq(acknowledgementRequests.employeeId, employees.id))
      .innerJoin(policyVersions, eq(acknowledgementRequests.policyVersionId, policyVersions.id))
      .innerJoin(policies, eq(policyVersions.policyId, policies.id))
      .where(and(
        eq(employees.companyId, companyId),
        lt(acknowledgementRequests.dueDate, new Date()),
        sql`${acknowledgementRequests.completedAt} IS NULL`
      ))
      .orderBy(desc(acknowledgementRequests.dueDate));

    return requests.map(row => ({
      ...row.acknowledgement_requests,
      employee: row.employees,
      policyVersion: {
        ...row.policy_versions,
        policy: row.policies,
      },
    }));
  }

  async createAcknowledgementRequest(data: InsertAcknowledgementRequest): Promise<AcknowledgementRequest> {
    const [request] = await db.insert(acknowledgementRequests).values(data).returning();
    return request;
  }

  async completeAcknowledgementRequest(requestId: number, employeeId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    const now = new Date();
    
    // Update the acknowledgement request
    await db
      .update(acknowledgementRequests)
      .set({
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(acknowledgementRequests.id, requestId));

    // Create an acknowledgement event
    const [request] = await db
      .select()
      .from(acknowledgementRequests)
      .where(eq(acknowledgementRequests.id, requestId));

    if (request) {
      await db.insert(acknowledgementEvents).values({
        requestId,
        employeeId,
        policyVersionId: request.policyVersionId,
        ipAddress,
        userAgent,
      });
    }
  }

  // Alert Escalations
  async getAlertEscalations(companyId: number): Promise<AlertEscalation[]> {
    const escalations = await db
      .select()
      .from(alertEscalations)
      .innerJoin(acknowledgementRequests, eq(alertEscalations.requestId, acknowledgementRequests.id))
      .innerJoin(employees, eq(acknowledgementRequests.employeeId, employees.id))
      .where(eq(employees.companyId, companyId))
      .orderBy(desc(alertEscalations.escalatedAt));

    return escalations.map(row => row.alert_escalations);
  }

  async createAlertEscalation(data: InsertAlertEscalation): Promise<AlertEscalation> {
    const [escalation] = await db.insert(alertEscalations).values(data).returning();
    
    // Also update the acknowledgement request to mark it as escalated
    await db
      .update(acknowledgementRequests)
      .set({
        escalatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(acknowledgementRequests.id, data.requestId));

    return escalation;
  }

  // Template Upgrades
  async getTemplateUpgrades(companyId: number): Promise<TemplateUpgrade[]> {
    return db
      .select()
      .from(templateUpgrades)
      .where(eq(templateUpgrades.companyId, companyId))
      .orderBy(desc(templateUpgrades.createdAt));
  }
}

export const storage = new DatabaseStorage();