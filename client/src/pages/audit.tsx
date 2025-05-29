import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  History, 
  Download, 
  Filter,
  CalendarIcon,
  User,
  FileText,
  CheckCircle,
  Edit,
  Shield,
  Clock,
  Search,
  Eye
} from "lucide-react";
import type { AcknowledgementRequestWithDetails, PolicyWithVersions } from "@shared/schema";

interface AuditEvent {
  id: number;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: number;
  entityName: string;
  userId: number;
  userName: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function Audit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // For demo purposes, we'll create mock audit events from the acknowledgement data
  const { data: acknowledgements } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests"],
  });

  const { data: policies } = useQuery<PolicyWithVersions[]>({
    queryKey: ["/api/policies"],
  });

  // Generate mock audit events
  const generateAuditEvents = (): AuditEvent[] => {
    const events: AuditEvent[] = [];
    
    // Add policy-related events
    policies?.forEach((policy, index) => {
      events.push({
        id: events.length + 1,
        timestamp: policy.createdAt,
        action: "POLICY_CREATED",
        entityType: "Policy",
        entityId: policy.id,
        entityName: policy.title,
        userId: 1,
        userName: "System Admin",
        details: `Created new policy: ${policy.title}`,
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });

      if (policy.latestVersion?.status === "APPROVED") {
        events.push({
          id: events.length + 1,
          timestamp: policy.latestVersion.approvedAt || policy.updatedAt,
          action: "POLICY_APPROVED",
          entityType: "Policy",
          entityId: policy.id,
          entityName: policy.title,
          userId: policy.latestVersion.approvedBy || 1,
          userName: "CTO",
          details: `Approved policy version ${policy.latestVersion.version}`,
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        });
      }
    });

    // Add acknowledgement events
    acknowledgements?.forEach((ack) => {
      events.push({
        id: events.length + 1,
        timestamp: ack.createdAt,
        action: "ACK_REQUEST_CREATED",
        entityType: "Acknowledgement",
        entityId: ack.id,
        entityName: `${ack.employee.firstName} ${ack.employee.lastName} - ${ack.policyVersion.policy.title}`,
        userId: 1,
        userName: "System",
        details: `Created acknowledgement request for ${ack.employee.firstName} ${ack.employee.lastName}`,
        ipAddress: "192.168.1.102",
        userAgent: "System/Automated",
      });

      if (ack.completedAt) {
        events.push({
          id: events.length + 1,
          timestamp: ack.completedAt,
          action: "ACK_COMPLETED",
          entityType: "Acknowledgement",
          entityId: ack.id,
          entityName: `${ack.employee.firstName} ${ack.employee.lastName} - ${ack.policyVersion.policy.title}`,
          userId: ack.employeeId,
          userName: `${ack.employee.firstName} ${ack.employee.lastName}`,
          details: `Completed policy acknowledgement`,
          ipAddress: "192.168.1.150",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
        });
      }
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const auditEvents = generateAuditEvents();

  // Filter events
  const filteredEvents = auditEvents.filter(event => {
    const matchesSearch = event.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || event.action === actionFilter;
    const matchesEntity = entityFilter === "all" || event.entityType === entityFilter;
    
    // Date range filter
    const eventDate = new Date(event.timestamp);
    const matchesDateRange = (!dateRange.from || eventDate >= dateRange.from) &&
                            (!dateRange.to || eventDate <= dateRange.to);
    
    return matchesSearch && matchesAction && matchesEntity && matchesDateRange;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "POLICY_CREATED":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "POLICY_APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "POLICY_UPDATED":
        return <Edit className="w-4 h-4 text-orange-600" />;
      case "ACK_REQUEST_CREATED":
        return <Clock className="w-4 h-4 text-purple-600" />;
      case "ACK_COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "USER_LOGIN":
        return <User className="w-4 h-4 text-blue-600" />;
      case "ROLE_ASSIGNED":
        return <Shield className="w-4 h-4 text-indigo-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "POLICY_CREATED":
        return <Badge className="bg-blue-100 text-blue-800">Created</Badge>;
      case "POLICY_APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "POLICY_UPDATED":
        return <Badge className="bg-orange-100 text-orange-800">Updated</Badge>;
      case "ACK_REQUEST_CREATED":
        return <Badge className="bg-purple-100 text-purple-800">Request Created</Badge>;
      case "ACK_COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "USER_LOGIN":
        return <Badge className="bg-blue-100 text-blue-800">Login</Badge>;
      case "ROLE_ASSIGNED":
        return <Badge className="bg-indigo-100 text-indigo-800">Role Assigned</Badge>;
      default:
        return <Badge variant="outline">{action.replace('_', ' ')}</Badge>;
    }
  };

  const exportAuditLog = () => {
    const csvContent = [
      ["Timestamp", "Action", "Entity Type", "Entity Name", "User", "IP Address", "Details"].join(","),
      ...filteredEvents.map(event => [
        new Date(event.timestamp).toISOString(),
        event.action,
        event.entityType,
        `"${event.entityName}"`,
        event.userName,
        event.ipAddress || "",
        `"${event.details}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600 mt-1">Complete history of all system activities and changes</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={exportAuditLog}>
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{auditEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <History className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Policy Actions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {auditEvents.filter(e => e.action.startsWith("POLICY_")).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Acknowledgements</p>
                <p className="text-3xl font-bold text-gray-900">
                  {auditEvents.filter(e => e.action.startsWith("ACK_")).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Today's Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {auditEvents.filter(e => {
                    const eventDate = new Date(e.timestamp);
                    const today = new Date();
                    return eventDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search audit events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="POLICY_CREATED">Policy Created</SelectItem>
                <SelectItem value="POLICY_APPROVED">Policy Approved</SelectItem>
                <SelectItem value="POLICY_UPDATED">Policy Updated</SelectItem>
                <SelectItem value="ACK_REQUEST_CREATED">Ack Request Created</SelectItem>
                <SelectItem value="ACK_COMPLETED">Ack Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="Policy">Policies</SelectItem>
                <SelectItem value="Acknowledgement">Acknowledgements</SelectItem>
                <SelectItem value="User">Users</SelectItem>
                <SelectItem value="Role">Roles</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Audit Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {getActionIcon(event.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getActionBadge(event.action)}
                      <Badge variant="outline" className="text-xs">
                        {event.entityType}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(event.timestamp), "MMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {event.details}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{event.userName}</span>
                    </div>
                    {event.ipAddress && (
                      <div className="flex items-center space-x-1">
                        <span>IP:</span>
                        <span className="font-mono">{event.ipAddress}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <span>Entity:</span>
                      <span>{event.entityName}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || actionFilter !== "all" || entityFilter !== "all" || dateRange.from 
                  ? "No events match your filters" 
                  : "No audit events found"
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm || actionFilter !== "all" || entityFilter !== "all" || dateRange.from
                  ? "Try adjusting your search or filter criteria."
                  : "System activities will appear here as they occur."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
