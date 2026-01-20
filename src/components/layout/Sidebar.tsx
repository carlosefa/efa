import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Swords,
  Medal,
  User,
  Gamepad2,
  MessageCircle,
  Wallet,
  Shield,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import efaLogo from "@/assets/efa-esports-logo.png";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onMobileClose: () => void;
}

const navItems = [
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Matches", href: "/matches", icon: Swords },
  { label: "Friendlies", href: "/friendlies", icon: Gamepad2 },
  { label: "Rankings", href: "/rankings", icon: Medal },
  { label: "Achievements", href: "/achievements", icon: Award },
   { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Dashboard", href: "/dashboard", icon: Home },
];

const adminItems = [
  { label: "Panel", href: "/admin/country", icon: Shield },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  onCollapsedChange,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={efaLogo}
            alt="EFA Esports"
            className={collapsed ? "h-8 w-auto object-contain" : "h-10 w-auto object-contain max-w-[140px]"}
          />
        </Link>

        {/* Mobile close */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-sidebar-foreground"
          onClick={onMobileClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Collapse toggle (desktop) */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={onMobileClose}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <div className="mt-6 px-2">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            )}
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={onMobileClose}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 EFA Esports
          </p>
        </div>
      )}
    </aside>
  );
}
