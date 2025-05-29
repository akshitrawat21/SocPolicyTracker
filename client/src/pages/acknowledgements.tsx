import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import MetricCard from "@/components/ui/metric-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  Plus,
  User,
  Mail,
  Calendar,
  FileText,
  Search,
  Eye
} from "lucide-react";
import type { AcknowledgementRequestWithDetails, Employee, PolicyWithVersions } from "@shared/schema";

export default function Acknowledgements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: acknowledgements, isLoading } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests"],
  });

  const { data: overdueAcknowledgements } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests/overdue"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: policies } = useQuery<PolicyWithVersions[]>({
    queryKey: ["/api/policies"],
  });

  const createAckRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/acknowledgement-requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acknowledgement-requests"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Acknowledgement request created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create acknowledgement request",
        variant: "destructive",
      });
    },
  });

  const completeAckMutation = useMutation({
    mutationFn: async ({ requestId, employeeId }: { requestId: number; employeeId: number }) => {
      const response = await apiRequest("POST", `/api/acknowledgement-requests/${requestId}/complete`, {
        employeeId,
        ipAddress: "127.0.0.1", // Mock IP
        userAgent: navigator.userAgent,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acknowledgement-requests"] });
      toast({
        title: "Success",
        description: "Acknowledgement completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete acknowledgement",
        variant: "destructive",
      });
    },
  });

  const filteredAcknowledgements = acknowledgements?.filter(ack => {
    const employeeName = `${ack.employee.firstName} ${ack.employee.lastName}`.toLowerCase();
    const policyTitle = ack.policyVersion.policy.title.toLowerCase();
    
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) ||
                         ack.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policyTitle.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "completed" && ack.completedAt) ||
                         (statusFilter === "pending" && !ack.completedAt && !ack.escalatedAt) ||
                         (statusFilter === "overdue" && !ack.completedAt && new Date(ack.dueDate) < new Date()) ||
                         (statusFilter === "escalated" && ack.escalatedAt);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const completedThisMonth = acknowledgements?.filter(ack => 
    ack.completedAt && new Date(ack.completedAt).getMonth() === new Date().getMonth()
  ).length || 0;

  const pendingCount = acknowledgements?.filter(ack => !ack.completedAt && !ack.escalatedAt).length || 0;
  const overdueCount = overdueAcknowledgements?.length || 0;

  const getStatusBadge = (ack: AcknowledgementRequestWithDetails) => {
    if (ack.completedAt) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    
    if (ack.escalatedAt) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Escalated
        </Badge>
      );
    }
    
    if (new Date(ack.dueDate) < new Date()) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-orange-100 text-orange-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const getTriggerTypeBadge = (triggerType: string) => {
    switch (triggerType) {
      case "ONBOARD":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Onboarding</Badge>;
      case "PERIODIC":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Periodic</Badge>;
      case "MANUAL":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Manual</Badge>;
      default:
        return <Badge variant="outline">{triggerType}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Acknowledgement Management</h1>
          <p className="text-gray-600 mt-1">Track employee policy acknowledgements and compliance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send Reminders
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Acknowledgement Request</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const dueDate = new Date();
                  dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
                  
                  createAckRequestMutation.mutate({
                    employeeId: parseInt(formData.get('employeeId') as string),
                    policyVersionId: parseInt(formData.get('policyVersionId') as string),
                    triggerType: formData.get('triggerType') as string,
                    dueDate: dueDate.toISOString(),
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                  <select name="employeeId" required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Select employee</option>
                    {employees?.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Policy</label>
                  <select name="policyVersionId" required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">Select policy</option>
                    {policies?.filter(p => p.latestVersion?.status === "APPROVED").map(policy => (
                      <option key={policy.latestVersion?.id} value={policy.latestVersion?.id}>
                        {policy.title} (v{policy.latestVersion?.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                  <select name="triggerType" required className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="MANUAL">Manual</option>
                    <option value="ONBOARD">Onboarding</option>
                    <option value="PERIODIC">Periodic</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAckRequestMutation.isPending}>
                    {createAckRequestMutation.isPending ? "Creating..." : "Create Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Completed This Month"
          value={completedThisMonth}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Pending Acknowledgements"
          value={pendingCount}
          icon={Clock}
          color="orange"
        />
        <MetricCard
          title="Overdue Items"
          value={overdueCount}
          icon={AlertTriangle}
          description="Need escalation"
          color="red"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search by employee name, email, or policy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgement Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trigger Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAcknowledgements.map((ack) => (
                  <tr key={ack.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-gray-700">
                            {ack.employee.firstName.charAt(0)}{ack.employee.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ack.employee.firstName} {ack.employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{ack.employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ack.policyVersion.policy.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Version {ack.policyVersion.version}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTriggerTypeBadge(ack.triggerType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(ack.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ack)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!ack.completedAt && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-900"
                            onClick={() => completeAckMutation.mutate({
                              requestId: ack.id,
                              employeeId: ack.employeeId
                            })}
                            disabled={completeAckMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAcknowledgements.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all" ? "No acknowledgements match your filters" : "No acknowledgement requests found"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "Create acknowledgement requests to track policy compliance."
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
