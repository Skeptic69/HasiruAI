
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Pencil, 
  Calendar, 
  BookmarkCheck, 
  Settings, 
  Menu, 
  X,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type Tab = "create" | "schedule" | "saved" | "settings";

interface NavigationProps {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}

export function Navigation({ activeTab, onChange }: NavigationProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "create" as Tab, label: "Create Post", icon: Pencil },
    { id: "schedule" as Tab, label: "Schedule", icon: Calendar },
    { id: "saved" as Tab, label: "Saved Posts", icon: BookmarkCheck },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const renderNav = () => {
    return (
      <nav className={cn(
        "flex flex-col gap-2 transition-all",
        isMobile && !mobileMenuOpen ? "hidden" : "flex",
        isMobile ? "py-6 px-4 absolute top-16 left-0 right-0 bg-background shadow-lg z-50 border-b border-border" : "py-0"
      )}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className={cn(
              "justify-start gap-2",
              isMobile ? "w-full" : "w-full",
              activeTab === tab.id ? "bg-primary/20 text-primary" : "hover:bg-secondary/50"
            )}
            onClick={() => {
              onChange(tab.id);
              if (isMobile) setMobileMenuOpen(false);
            }}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "")} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <ChevronRight className="ml-auto h-4 w-4 text-primary" />
            )}
          </Button>
        ))}
      </nav>
    );
  };

  return (
    <div className="w-full md:w-64 md:border-r border-border/40 bg-sidebar md:min-h-screen flex-shrink-0">
      <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start p-4 md:p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          LinkElevate
        </h2>
        
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        )}
        
        <div className="hidden md:block h-0.5 w-full bg-border/40 my-6"></div>
        
        {renderNav()}
      </div>
    </div>
  );
}
