import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  FileText,
  Shield,
  Laptop,
  Key,
  Database,
  AlertCircle,
  Search
} from "lucide-react";
import type { PolicyWithVersions } from "@shared/schema";

interface PolicyTableProps {
  policies: PolicyWithVersions[];
  onViewPolicy?: (policy: PolicyWithVersions) => void;
  onEditPolicy?: (policy: PolicyWithVersions) => void;
  onApprovePolicy?: (versionId: number) => void;
  isLoading?: boolean;
}

export default function PolicyTable({ 
  policies, 
  onViewPolicy, 
  onEditPolicy, 
  onApprovePolicy,
  isLoading 
}: PolicyTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         policy.latestVersion?.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case "INFORMATION_SECURITY":
        return <Shield className="w-5 h-5 text-blue-600" />;
      case "ACCEPTABLE_USE":
        return <Laptop className="w-5 h-5 text-green-600" />;
      case "CRYPTO":
        return <Key className="w-5 h-5 text-purple-600" />;
      case "DATA_PROTECTION":
        return <Database className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <Edit className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case "DEPRECATED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Deprecated
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
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
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Policy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {filteredPolicies.map((policy) => {
                // Mock compliance data for demonstration
                const compliance = Math.floor(Math.random() * 20) + 80;
                const total = Math.floor(Math.random() * 20) + 80;
                const completed = Math.floor((compliance / 100) * total);
                
                return (
                  <tr key={policy.id} className="table-row-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          {getPolicyIcon(policy.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">{policy.title}</div>
                          <div className="text-sm text-muted-foreground">{policy.description || "No description"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {policy.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {policy.latestVersion?.version || "No version"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(policy.latestVersion?.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16">
                          <Progress value={compliance} className="h-2" />
                        </div>
                        <span className="text-sm text-muted-foreground min-w-0">
                          {completed}/{total}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => onViewPolicy?.(policy)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => onEditPolicy?.(policy)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {policy.latestVersion?.status === "PENDING" && onApprovePolicy && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-900"
                            onClick={() => onApprovePolicy(policy.latestVersion!.id)}
                            disabled={isLoading}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredPolicies.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || statusFilter !== "all" ? "No policies match your filters" : "No policies found"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria." 
                : "Get started by creating your first policy."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
