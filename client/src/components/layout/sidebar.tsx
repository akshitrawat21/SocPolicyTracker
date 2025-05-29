import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  ChartPie, 
  FileText, 
  Users, 
  UserCheck, 
  CheckCircle, 
  AlertTriangle, 
  History,
  Settings,
  User
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: ChartPie,
  },
  {
    title: "Policy Management",
    href: "/policies",
    icon: FileText,
  },
  {
    title: "Employee Management",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Role Assignment",
    href: "/roles",
    icon: UserCheck,
  },
  {
    title: "Acknowledgements",
    href: "/acknowledgements",
    icon: CheckCircle,
  },
  {
    title: "Alerts & Escalations",
    href: "/alerts",
    icon: AlertTriangle,
    badge: 3,
  },
  {
    title: "Audit Trail",
    href: "/audit",
    icon: History,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">PolicyHub</h1>
            <p className="text-xs text-muted-foreground">SOC 2 Compliance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className={cn(
              "sidebar-link",
              isActive && "active"
            )}>
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto bg-red-500 text-white text-xs px-2 py-1"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">John Smith</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
          <Button variant="ghost" size="sm" className="p-1">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
