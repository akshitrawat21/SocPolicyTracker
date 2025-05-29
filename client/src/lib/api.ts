import { apiRequest } from "./queryClient";
import type { 
  PolicyWithVersions, 
  InsertPolicy, 
  InsertPolicyVersion,
  Employee,
  InsertEmployee,
  Role,
  InsertRole,
  AcknowledgementRequestWithDetails,
  InsertAcknowledgementRequest,
  DashboardMetrics
} from "@shared/schema";

// Dashboard API
export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await apiRequest("GET", "/api/dashboard/metrics");
    return response.json();
  },
};

// Policy API
export const policyApi = {
  getAll: async (): Promise<PolicyWithVersions[]> => {
    const response = await apiRequest("GET", "/api/policies");
    return response.json();
  },

  getById: async (id: number): Promise<PolicyWithVersions> => {
    const response = await apiRequest("GET", `/api/policies/${id}`);
    return response.json();
  },

  create: async (data: InsertPolicy): Promise<PolicyWithVersions> => {
    const response = await apiRequest("POST", "/api/policies", data);
    return response.json();
  },

  update: async (id: number, data: Partial<InsertPolicy>): Promise<PolicyWithVersions> => {
    const response = await apiRequest("PUT", `/api/policies/${id}`, data);
    return response.json();
  },

  createVersion: async (policyId: number, data: InsertPolicyVersion) => {
    const response = await apiRequest("POST", `/api/policies/${policyId}/versions`, data);
    return response.json();
  },

  approveVersion: async (versionId: number, approvedBy: number) => {
    const response = await apiRequest("POST", `/api/versions/${versionId}/approve`, { approvedBy });
    return response.json();
  },
};

// Employee API
export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await apiRequest("GET", "/api/employees");
    return response.json();
  },

  getById: async (id: number): Promise<Employee> => {
    const response = await apiRequest("GET", `/api/employees/${id}`);
    return response.json();
  },

  create: async (data: InsertEmployee): Promise<Employee> => {
    const response = await apiRequest("POST", "/api/employees", data);
    return response.json();
  },

  assignRole: async (employeeId: number, roleId: number) => {
    const response = await apiRequest("POST", `/api/employees/${employeeId}/roles`, { roleId });
    return response.json();
  },

  getAcknowledgements: async (employeeId: number): Promise<AcknowledgementRequestWithDetails[]> => {
    const response = await apiRequest("GET", `/api/employees/${employeeId}/acknowledgements`);
    return response.json();
  },
};

// Role API
export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await apiRequest("GET", "/api/roles");
    return response.json();
  },

  create: async (data: InsertRole): Promise<Role> => {
    const response = await apiRequest("POST", "/api/roles", data);
    return response.json();
  },

  assignPolicy: async (roleId: number, policyVersionId: number) => {
    const response = await apiRequest("POST", `/api/roles/${roleId}/assignments`, { policyVersionId });
    return response.json();
  },

  getAssignments: async (roleId: number) => {
    const response = await apiRequest("GET", `/api/roles/${roleId}/assignments`);
    return response.json();
  },
};

// Acknowledgement API
export const acknowledgementApi = {
  getAll: async (): Promise<AcknowledgementRequestWithDetails[]> => {
    const response = await apiRequest("GET", "/api/acknowledgement-requests");
    return response.json();
  },

  getOverdue: async (): Promise<AcknowledgementRequestWithDetails[]> => {
    const response = await apiRequest("GET", "/api/acknowledgement-requests/overdue");
    return response.json();
  },

  create: async (data: InsertAcknowledgementRequest) => {
    const response = await apiRequest("POST", "/api/acknowledgement-requests", data);
    return response.json();
  },

  complete: async (requestId: number, employeeId: number, ipAddress?: string, userAgent?: string) => {
    const response = await apiRequest("POST", `/api/acknowledgement-requests/${requestId}/complete`, {
      employeeId,
      ipAddress,
      userAgent,
    });
    return response.json();
  },
};

// Alert API
export const alertApi = {
  getEscalations: async () => {
    const response = await apiRequest("GET", "/api/alert-escalations");
    return response.json();
  },

  createEscalation: async (requestId: number, escalatedTo: string) => {
    const response = await apiRequest("POST", "/api/alert-escalations", { requestId, escalatedTo });
    return response.json();
  },
};

// Template Upgrade API
export const templateApi = {
  getUpgrades: async () => {
    const response = await apiRequest("GET", "/api/template-upgrades");
    return response.json();
  },
};
