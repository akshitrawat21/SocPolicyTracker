import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@shared/schema";

interface EmployeeFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  initialData?: any;
  roles: Role[];
}

export default function EmployeeForm({ onSubmit, isLoading, initialData, roles }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
    isActive: initialData?.isActive ?? true,
    selectedRoles: initialData?.selectedRoles || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      startDate: formData.startDate.toISOString(),
    });
  };

  const handleRoleToggle = (roleId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter((id: number) => id !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  const selectedRoleNames = roles
    .filter(role => formData.selectedRoles.includes(role.id))
    .map(role => role.name);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter first name"
              required
            />
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter last name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Start Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? (
                    format(formData.startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isActive: checked as boolean }))
              }
            />
            <Label htmlFor="isActive" className="text-sm">
              Active Employee
            </Label>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Assign Roles
            </Label>
            <div className="mt-2 space-y-2">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={formData.selectedRoles.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <Label htmlFor={`role-${role.id}`} className="text-sm">
                    {role.name}
                  </Label>
                  {role.description && (
                    <span className="text-xs text-muted-foreground">
                      - {role.description}
                    </span>
                  )}
                </div>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No roles available. Create roles first to assign them to employees.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedRoleNames.length > 0 && (
        <div>
          <Label className="text-sm font-medium">Selected Roles</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedRoleNames.map((roleName) => (
              <Badge key={roleName} variant="secondary" className="text-xs">
                {roleName}
                <button
                  type="button"
                  onClick={() => {
                    const role = roles.find(r => r.name === roleName);
                    if (role) handleRoleToggle(role.id);
                  }}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.firstName || !formData.lastName || !formData.email}
        >
          {isLoading ? "Creating..." : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
