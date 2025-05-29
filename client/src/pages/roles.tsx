import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Search, 
  Users, 
  Shield,
  Edit,
  CheckCircle
} from "lucide-react";
import type { Role, PolicyWithVersions, RolePolicyAssignment } from "@shared/schema";

export default function Roles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
  });

  const { data: policies } = useQuery<PolicyWithVersions[]>({
    queryKey: ["/api/policies"],
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/roles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Role created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const assignPolicyMutation = useMutation({
    mutationFn: async ({ roleId, policyVersionId }: { roleId: number; policyVersionId: number }) => {
      const response = await apiRequest("POST", `/api/roles/${roleId}/assignments`, { policyVersionId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles"] });
      setIsAssignDialogOpen(false);
      setSelectedRole(null);
      toast({
        title: "Success",
        description: "Policy assigned to role successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign policy",
        variant: "destructive",
      });
    },
  });

  const filteredRoles = roles?.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const approvedPolicies = policies?.filter(p => p.latestVersion?.status === "APPROVED") || [];

  const handleCreateRole = (data: { name: string; description: string }) => {
    createRoleMutation.mutate(data);
  };

  const handleAssignPolicy = (policyVersionId: number) => {
    if (selectedRole) {
      assignPolicyMutation.mutate({ roleId: selectedRole.id, policyVersionId });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">Define roles and assign policies to control access</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateRole({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <Input name="name" required placeholder="e.g., Engineering, Sales, HR" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input name="description" placeholder="Brief description of the role" />
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoleMutation.isPending}>
                  {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-3xl font-bold text-gray-900">{roles?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Assigned Policies</p>
                <p className="text-3xl font-bold text-gray-900">{approvedPolicies.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">--</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <p className="text-sm text-gray-500">Created {new Date(role.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {role.description || "No description provided"}
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Assigned Policies</span>
                  <Badge variant="outline">0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Active Employees</span>
                  <Badge variant="outline">0</Badge>
                </div>
              </div>

              <div className="flex space-x-2">
                <Dialog open={isAssignDialogOpen && selectedRole?.id === role.id} 
                        onOpenChange={(open) => {
                          setIsAssignDialogOpen(open);
                          if (!open) setSelectedRole(null);
                        }}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedRole(role)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Assign Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Policy to {role.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Select approved policies to assign to this role:
                      </p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {approvedPolicies.map((policy) => (
                          <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{policy.title}</p>
                              <p className="text-sm text-gray-500">
                                Version {policy.latestVersion?.version}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => policy.latestVersion && handleAssignPolicy(policy.latestVersion.id)}
                              disabled={assignPolicyMutation.isPending}
                            >
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                      {approvedPolicies.length === 0 && (
                        <p className="text-center text-gray-500 py-4">
                          No approved policies available to assign
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No roles match your search" : "No roles found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? "Try adjusting your search criteria." 
                : "Get started by creating your first role."
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
