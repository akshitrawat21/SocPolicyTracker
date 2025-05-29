import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MetricCard from "@/components/ui/metric-card";
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  TrendingUp,
  Shield,
  Laptop,
  Key,
  Database,
  Eye,
  Edit,
  Bell
} from "lucide-react";
import type { DashboardMetrics, PolicyWithVersions, AcknowledgementRequestWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: policies, isLoading: policiesLoading } = useQuery<PolicyWithVersions[]>({
    queryKey: ["/api/policies"],
  });

  const { data: acknowledgements } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests"],
  });

  const { data: overdueAcknowledgements } = useQuery<AcknowledgementRequestWithDetails[]>({
    queryKey: ["/api/acknowledgement-requests/overdue"],
  });

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentPolicies = policies?.slice(0, 3) || [];
  const pendingPolicies = policies?.filter(p => p.latestVersion?.status === "PENDING") || [];
  const approvedPolicies = policies?.filter(p => p.latestVersion?.status === "APPROVED") || [];
  const draftPolicies = policies?.filter(p => p.latestVersion?.status === "DRAFT") || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SOC 2 Compliance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor policy compliance and acknowledgement status across your organization</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Alert Banner */}
      {overdueAcknowledgements && overdueAcknowledgements.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                {overdueAcknowledgements.length} acknowledgement{overdueAcknowledgements.length > 1 ? 's are' : ' is'} overdue and require attention.
              </span>
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                View Overdue Items
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Policies"
          value={metrics?.totalPolicies || 0}
          icon={FileText}
          trend="+3 from last month"
          trendUp={true}
          color="blue"
        />
        <MetricCard
          title="Pending Approvals"
          value={metrics?.pendingApprovals || 0}
          icon={Clock}
          description="Require attention"
          color="orange"
        />
        <MetricCard
          title="Compliance Rate"
          value={`${metrics?.complianceRate || 0}%`}
          icon={CheckCircle}
          trend="+5% from last quarter"
          trendUp={true}
          color="green"
        />
        <MetricCard
          title="Overdue Acknowledgements"
          value={metrics?.overdueAcknowledgements || 0}
          icon={AlertTriangle}
          description="Need escalation"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Policy Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Policy Activity</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentPolicies.map((policy) => (
                <div key={policy.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {policy.type === "INFORMATION_SECURITY" && <Shield className="w-5 h-5 text-blue-600" />}
                    {policy.type === "ACCEPTABLE_USE" && <Laptop className="w-5 h-5 text-green-600" />}
                    {policy.type === "CRYPTO" && <Key className="w-5 h-5 text-purple-600" />}
                    {policy.type === "DATA_PROTECTION" && <Database className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{policy.title}</p>
                    <p className="text-sm text-gray-600">
                      {policy.latestVersion ? `Version ${policy.latestVersion.version}` : "No version"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : "Unknown date"}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      policy.latestVersion?.status === "APPROVED" ? "default" :
                      policy.latestVersion?.status === "PENDING" ? "secondary" :
                      "outline"
                    }
                    className={
                      policy.latestVersion?.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      policy.latestVersion?.status === "PENDING" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {policy.latestVersion?.status || "DRAFT"}
                  </Badge>
                </div>
              ))}
              
              {recentPolicies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No policies created yet</p>
                  <Button className="mt-4" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Policy
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acknowledgement Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Acknowledgement Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvedPolicies.map((policy) => {
                // Calculate mock compliance for approved policies
                const compliance = Math.floor(Math.random() * 20) + 80; // 80-100%
                
                return (
                  <div key={policy.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{policy.title}</span>
                      <span className="text-sm text-gray-600">{compliance}%</span>
                    </div>
                    <Progress value={compliance} className="h-2" />
                  </div>
                );
              })}
              
              {approvedPolicies.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No approved policies yet</p>
                </div>
              )}
              
              <Button className="w-full mt-4">
                Manage Acknowledgements
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Policy Management Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Policies</CardTitle>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search policies..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Status</option>
              <option>Approved</option>
              <option>Pending</option>
              <option>Draft</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acknowledgements</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies?.slice(0, 5).map((policy) => {
                  const compliance = Math.floor(Math.random() * 20) + 80;
                  const total = Math.floor(Math.random() * 20) + 80;
                  const completed = Math.floor((compliance / 100) * total);
                  
                  return (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {policy.type === "INFORMATION_SECURITY" && <Shield className="w-5 h-5 text-blue-600" />}
                            {policy.type === "ACCEPTABLE_USE" && <Laptop className="w-5 h-5 text-green-600" />}
                            {policy.type === "CRYPTO" && <Key className="w-5 h-5 text-purple-600" />}
                            {policy.type === "DATA_PROTECTION" && <Database className="w-5 h-5 text-red-600" />}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{policy.title}</div>
                            <div className="text-sm text-gray-500">{policy.type.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {policy.latestVersion?.version || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            policy.latestVersion?.status === "APPROVED" ? "default" :
                            policy.latestVersion?.status === "PENDING" ? "secondary" :
                            "outline"
                          }
                          className={
                            policy.latestVersion?.status === "APPROVED" ? "bg-green-100 text-green-800" :
                            policy.latestVersion?.status === "PENDING" ? "bg-orange-100 text-orange-800" :
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {policy.latestVersion?.status || "DRAFT"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {policy.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${compliance}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{completed}/{total}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {(!policies || policies.length === 0) && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first policy.</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Policy
              </Button>
            </div>
          )}
          
          {policies && policies.length > 5 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing 1 to 5 of {policies.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" className="bg-blue-500 text-white">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
