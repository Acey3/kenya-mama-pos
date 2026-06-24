import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";

export function Layout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { businessName } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: t('common.dashboard'), href: "/dashboard", icon: Home },
    { name: t('common.sales'), href: "/dashboard/sales", icon: ShoppingCart },
    { name: t('common.stock'), href: "/dashboard/stock", icon: Package },
    { name: t('common.reports'), href: "/dashboard/reports", icon: BarChart3 },
    { name: t('common.settings'), href: "/dashboard/settings", icon: Settings },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex transition-all duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] bg-card border-r transition-all duration-300 lg:relative lg:translate-x-0 lg:flex lg:flex-col shadow-2xl shadow-black/40",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0",
        !sidebarOpen && "lg:w-64",
        isCollapsed && "lg:w-20"
      )}>
        {/* Toggle Button - Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full items-center justify-center text-primary-foreground border-2 border-background z-[60] shadow-lg hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn(
          "flex items-center gap-3 h-16 px-4 border-b transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-start"
        )}>
          <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
            <ShieldCheck size={24} />
          </div>
          {!isCollapsed && <h1 className="text-lg font-bold text-foreground truncate">{businessName}</h1>}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-3 space-y-2 flex-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              title={isCollapsed ? item.name : ""}
              className={cn(
                "flex items-center rounded-xl transition-all duration-200 group relative",
                isCollapsed ? "p-3 justify-center" : "px-4 py-3",
                location.pathname === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                !isCollapsed && "mr-3",
                location.pathname === item.href ? "text-primary" : "text-muted-foreground"
              )} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
              {location.pathname === item.href && !isCollapsed && (
                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              isCollapsed ? "p-3 justify-center" : "justify-start px-4"
            )}
            onClick={handleSignOut}
            title={isCollapsed ? t('common.logout') : ""}
          >
            <LogOut className={cn("h-5 w-5 shrink-0", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="font-medium">{t('common.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        {/* Top bar */}
        <header className="flex items-center h-16 px-4 bg-card/80 backdrop-blur-md border-b lg:px-6 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <div className="hidden md:flex items-center px-3 py-1 bg-secondary rounded-full border border-border">
                <OnlineStatusIndicator />
            </div>
            <LanguageSwitcher />
            <div className="h-8 w-[1px] bg-border mx-1" />
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <Outlet />
            </div>
        </main>
      </div>
    </div>
  );
}
