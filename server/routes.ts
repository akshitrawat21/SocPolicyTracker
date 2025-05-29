import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertPolicySchema,
  insertPolicyVersionSchema,
  insertRoleSchema,
  insertEmployeeSchema,
  insertEmployeeRoleSchema,
  insertRolePolicyAssignmentSchema,
  insertAcknowledgementRequestSchema,
  insertCompanySchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize with a default company for demo purposes
  let defaultCompany;
  try {
    defaultCompany = await storage.getCompany(1);
    if (!defaultCompany) {
      defaultCompany = await storage.createCompany({
        name: "Demo Company",
      });
    }
  } catch (error) {
    // Company table might not exist yet, will be created on first migration
    console.log("Company initialization skipped - database not ready");
  }

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const metrics = await storage.getDashboardMetrics(companyId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Companies
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Policies
  app.get("/api/policies", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const policies = await storage.getPolicies(companyId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policies:", error);
      res.status(500).json({ message: "Failed to fetch policies" });
    }
  });

  app.get("/api/policies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const policy = await storage.getPolicy(id);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
      res.status(500).json({ message: "Failed to fetch policy" });
    }
  });

  app.post("/api/policies", async (req, res) => {
    try {
      const validatedData = insertPolicySchema.parse({
        ...req.body,
        companyId: 1, // Default company for demo
      });
      const policy = await storage.createPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating policy:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create policy" });
    }
  });

  app.put("/api/policies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPolicySchema.partial().parse(req.body);
      const policy = await storage.updatePolicy(id, validatedData);
      if (!policy) {
        return res.status(404).json({ message: "Policy not found" });
      }
      res.json(policy);
    } catch (error) {
      console.error("Error updating policy:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update policy" });
    }
  });

  // Policy Versions
  app.get("/api/policies/:id/versions", async (req, res) => {
    try {
      const policyId = parseInt(req.params.id);
      const versions = await storage.getPolicyVersions(policyId);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching policy versions:", error);
      res.status(500).json({ message: "Failed to fetch policy versions" });
    }
  });

  app.post("/api/policies/:id/versions", async (req, res) => {
    try {
      const policyId = parseInt(req.params.id);
      const validatedData = insertPolicyVersionSchema.parse({
        ...req.body,
        policyId,
      });
      const version = await storage.createPolicyVersion(validatedData);
      res.status(201).json(version);
    } catch (error) {
      console.error("Error creating policy version:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create policy version" });
    }
  });

  app.post("/api/versions/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: "approvedBy is required" });
      }

      const version = await storage.approvePolicyVersion(id, approvedBy);
      if (!version) {
        return res.status(404).json({ message: "Policy version not found" });
      }
      res.json(version);
    } catch (error) {
      console.error("Error approving policy version:", error);
      res.status(500).json({ message: "Failed to approve policy version" });
    }
  });

  // Roles
  app.get("/api/roles", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const roles = await storage.getRoles(companyId);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse({
        ...req.body,
        companyId: 1, // Default company for demo
      });
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      console.error("Error creating role:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  app.post("/api/roles/:id/assignments", async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { policyVersionId } = req.body;
      
      if (!policyVersionId) {
        return res.status(400).json({ message: "policyVersionId is required" });
      }

      const assignment = await storage.assignPolicyToRole({
        roleId,
        policyVersionId,
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning policy to role:", error);
      res.status(500).json({ message: "Failed to assign policy to role" });
    }
  });

  app.get("/api/roles/:id/assignments", async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const assignments = await storage.getRolePolicyAssignments(roleId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching role assignments:", error);
      res.status(500).json({ message: "Failed to fetch role assignments" });
    }
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const employees = await storage.getEmployees(companyId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: 1, // Default company for demo
        startDate: new Date(req.body.startDate),
      });
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.post("/api/employees/:id/roles", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { roleId } = req.body;
      
      if (!roleId) {
        return res.status(400).json({ message: "roleId is required" });
      }

      const assignment = await storage.assignRoleToEmployee({
        employeeId,
        roleId,
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning role to employee:", error);
      res.status(500).json({ message: "Failed to assign role to employee" });
    }
  });

  // Acknowledgement Requests
  app.get("/api/acknowledgement-requests", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const requests = await storage.getAcknowledgementRequests(companyId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching acknowledgement requests:", error);
      res.status(500).json({ message: "Failed to fetch acknowledgement requests" });
    }
  });

  app.get("/api/acknowledgement-requests/overdue", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const requests = await storage.getOverdueAcknowledgements(companyId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching overdue acknowledgements:", error);
      res.status(500).json({ message: "Failed to fetch overdue acknowledgements" });
    }
  });

  app.get("/api/employees/:id/acknowledgements", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.id);
      const requests = await storage.getEmployeeAcknowledgements(employeeId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching employee acknowledgements:", error);
      res.status(500).json({ message: "Failed to fetch employee acknowledgements" });
    }
  });

  app.post("/api/acknowledgement-requests", async (req, res) => {
    try {
      const validatedData = insertAcknowledgementRequestSchema.parse({
        ...req.body,
        dueDate: new Date(req.body.dueDate),
      });
      const request = await storage.createAcknowledgementRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating acknowledgement request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create acknowledgement request" });
    }
  });

  app.post("/api/acknowledgement-requests/:id/complete", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { employeeId, ipAddress, userAgent } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required" });
      }

      await storage.completeAcknowledgementRequest(requestId, employeeId, ipAddress, userAgent);
      res.json({ message: "Acknowledgement completed successfully" });
    } catch (error) {
      console.error("Error completing acknowledgement:", error);
      res.status(500).json({ message: "Failed to complete acknowledgement" });
    }
  });

  // Alert Escalations
  app.get("/api/alert-escalations", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const escalations = await storage.getAlertEscalations(companyId);
      res.json(escalations);
    } catch (error) {
      console.error("Error fetching alert escalations:", error);
      res.status(500).json({ message: "Failed to fetch alert escalations" });
    }
  });

  app.post("/api/alert-escalations", async (req, res) => {
    try {
      const { requestId, escalatedTo } = req.body;
      
      if (!requestId || !escalatedTo) {
        return res.status(400).json({ message: "requestId and escalatedTo are required" });
      }

      const escalation = await storage.createAlertEscalation({
        requestId,
        escalatedTo,
      });
      res.status(201).json(escalation);
    } catch (error) {
      console.error("Error creating alert escalation:", error);
      res.status(500).json({ message: "Failed to create alert escalation" });
    }
  });

  // Template Upgrades
  app.get("/api/template-upgrades", async (req, res) => {
    try {
      const companyId = 1; // Default company for demo
      const upgrades = await storage.getTemplateUpgrades(companyId);
      res.json(upgrades);
    } catch (error) {
      console.error("Error fetching template upgrades:", error);
      res.status(500).json({ message: "Failed to fetch template upgrades" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
