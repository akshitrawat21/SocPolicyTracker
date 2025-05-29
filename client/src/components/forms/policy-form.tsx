import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PolicyFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  initialData?: any;
}

const policyTypes = [
  { value: "INFORMATION_SECURITY", label: "Information Security Policy" },
  { value: "ACCEPTABLE_USE", label: "Acceptable Use Policy" },
  { value: "CRYPTO", label: "Cryptographic Standards" },
  { value: "DATA_PROTECTION", label: "Data Protection Policy" },
  { value: "INCIDENT_RESPONSE", label: "Incident Response Policy" },
  { value: "CUSTOM", label: "Custom Policy" },
];

const complianceFrameworks = [
  { value: "soc2", label: "SOC 2" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "gdpr", label: "GDPR" },
  { value: "hipaa", label: "HIPAA" },
  { value: "pci", label: "PCI DSS" },
];

export default function PolicyForm({ onSubmit, isLoading, initialData }: PolicyFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: initialData?.type || "",
    templateSource: initialData?.templateSource || "CUSTOM",
    isTemplate: initialData?.isTemplate || false,
    frameworks: initialData?.frameworks || [],
    version: "1.0",
    content: initialData?.content || "",
    status: "DRAFT",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFrameworkChange = (framework: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      frameworks: checked 
        ? [...prev.frameworks, framework]
        : prev.frameworks.filter((f: string) => f !== framework)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="type" className="text-sm font-medium">
              Policy Type
            </Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a policy type" />
              </SelectTrigger>
              <SelectContent>
                {policyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Policy Name
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter policy name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the policy"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Template Source</Label>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="sprinto"
                  name="templateSource"
                  value="SPRINTO"
                  checked={formData.templateSource === "SPRINTO"}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateSource: e.target.value }))}
                  className="text-primary focus:ring-primary"
                />
                <Label htmlFor="sprinto" className="text-sm">Use Sprinto template</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom"
                  name="templateSource"
                  value="CUSTOM"
                  checked={formData.templateSource === "CUSTOM"}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateSource: e.target.value }))}
                  className="text-primary focus:ring-primary"
                />
                <Label htmlFor="custom" className="text-sm">Create custom policy</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Compliance Frameworks</Label>
            <div className="space-y-2 mt-2">
              {complianceFrameworks.map((framework) => (
                <div key={framework.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={framework.value}
                    checked={formData.frameworks.includes(framework.value)}
                    onCheckedChange={(checked) => 
                      handleFrameworkChange(framework.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={framework.value} className="text-sm">
                    {framework.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTemplate"
              checked={formData.isTemplate}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, isTemplate: checked as boolean }))
              }
            />
            <Label htmlFor="isTemplate" className="text-sm">
              Save as template for future use
            </Label>
          </div>
        </div>
      </div>

      {formData.templateSource === "CUSTOM" && (
        <div>
          <Label htmlFor="content" className="text-sm font-medium">
            Policy Content
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter the policy content here..."
            rows={8}
            className="mt-1"
          />
        </div>
      )}

      {formData.templateSource === "SPRINTO" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sprinto Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Template Type:</span>
                <Badge variant="outline">{formData.type.replace('_', ' ')}</Badge>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  This will use the latest Sprinto-approved template for {formData.type.replace('_', ' ').toLowerCase()}. 
                  The template includes industry best practices and SOC 2 compliance requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.title || !formData.type}>
          {isLoading ? "Creating..." : "Create Policy"}
        </Button>
      </div>
    </form>
  );
}
