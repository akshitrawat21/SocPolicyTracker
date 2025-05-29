import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MetricCard from "@/components/ui/metric-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Send,
  User,
  Calendar,
  FileText,
  Search,
  ArrowUp,
  X
} from "lucide-react";
import type { AcknowledgementRequestWithDetails, AlertEscalation } from "@shared/schema";

export default function Alerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [alertFilter, setAlertFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: overdueAcknowledgements, isLoading } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests/overdue"],
  });

  const { data: allAcknowledgements } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests"],
  });

  const { data: escalations } = useQuery<AlertEscalation[]>({
    queryKey: ["/api/alert-escalations"],
  });

  const escalateAlertMutation = useMutation({
    mutationFn: async ({ requestId, escalatedTo }: { requestId: number; escalatedTo: string }) => {
      const response = await apiRequest("POST", "/api/alert-escalations", { requestId, escalatedTo });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-escalations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/acknowledgement-requests"] });
      toast({
        title: "Success",
        description: "Alert escalated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to escalate alert",
        variant: "destructive",
      });
    },
  });

  // Filter overdue acknowledgements based on search and filter criteria
  const filteredAlerts = overdueAcknowledgements?.filter(ack => {
    const employeeName = `${ack.employee.firstName} ${ack.employee.lastName}`.toLowerCase();
    const policyTitle = ack.policyVersion.policy.title.toLowerCase();
    
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) ||
                         ack.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policyTitle.includes(searchTerm.toLowerCase());
    
    const daysSinceOverdue = Math.floor((Date.now() - new Date(ack.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    
    const matchesFilter = alertFilter === "all" ||
                         (alertFilter === "critical" && daysSinceOverdue > 14) ||
                         (alertFilter === "moderate" && daysSinceOverdue > 7 && daysSinceOverdue <= 14) ||
                         (alertFilter === "recent" && daysSinceOverdue <= 7);
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Calculate metrics
  const criticalAlerts = overdueAcknowledgements?.filter(ack => {
    const daysSinceOverdue = Math.floor((Date.now() - new Date(ack.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceOverdue > 14;
  }).length || 0;

  const totalEscalations = escalations?.length || 0;
  const overdueCount = overdueAcknowledgements?.length || 0;

  const getAlertSeverity = (dueDate: string) => {
    const daysSinceOverdue = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceOverdue > 14) {
      return { level: "Critical", color: "bg-red-100 text-red-800", days: daysSinceOverdue };
    } else if (daysSinceOverdue > 7) {
      return { level: "High", color: "bg-orange-100 text-orange-800", days: daysSinceOverdue };
    } else {
      return { level: "Medium", color: "bg-yellow-100 text-yellow-800", days: daysSinceOverdue };
    }
  };

  const handleEscalateToRole = (requestId: number, role: string) => {
    escalateAlertMutation.mutate({ requestId, escalatedTo: role });
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
          <h1 className="text-3xl font-bold text-gray-900">Alerts & Escalations</h1>
          <p className="text-gray-600 mt-1">Monitor overdue acknowledgements and manage escalations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            Configure Alerts
          </Button>
          <Button className="bg-red-600 hover:bg-red-700">
            <Send className="w-4 h-4 mr-2" />
            Send Escalation Report
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>
                <strong>{criticalAlerts}</strong> critical alert{criticalAlerts > 1 ? 's' : ''} require immediate attention. 
                Items have been overdue for more than 14 days.
              </span>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                View Critical Items
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Critical Alerts"
          value={criticalAlerts}
          icon={AlertTriangle}
          description="Over 14 days overdue"
          color="red"
        />
        <MetricCard
          title="Total Overdue"
          value={overdueCount}
          icon={Clock}
          description="Require attention"
          color="orange"
        />
        <MetricCard
          title="Escalations Sent"
          value={totalEscalations}
          icon={ArrowUp}
          description="This month"
          color="blue"
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
            <Select value={alertFilter} onValueChange={setAlertFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical (14+ days)</SelectItem>
                <SelectItem value="moderate">High (7-14 days)</SelectItem>
                <SelectItem value="recent">Medium (1-7 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Overdue Acknowledgements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Overdue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlerts.map((ack) => {
                  const severity = getAlertSeverity(ack.dueDate);
                  
                  return (
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
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(ack.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={severity.color}>
                          {severity.level}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-red-400 mr-2" />
                          <span className="text-sm font-medium text-red-600">
                            {severity.days} day{severity.days > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleEscalateToRole(ack.id, "CTO")}
                            disabled={escalateAlertMutation.isPending}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || alertFilter !== "all" ? "No alerts match your filters" : "No overdue acknowledgements"}
              </h3>
              <p className="text-gray-500">
                {searchTerm || alertFilter !== "all" 
                  ? "Try adjusting your search or filter criteria." 
                  : "All acknowledgements are up to date!"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation History */}
      {escalations && escalations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUp className="w-5 h-5 mr-2 text-blue-500" />
              Recent Escalations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {escalations.slice(0, 5).map((escalation) => (
                <div key={escalation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ArrowUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Escalated to {escalation.escalatedTo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(escalation.escalatedAt).toLocaleDateString()} - Request #{escalation.requestId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {escalation.resolvedAt ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
