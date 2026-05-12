import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mail,
  ClipboardList,
  CalendarCheck,
  Bot,
  History,
  Sparkles,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ResponsibleAIDialog } from "./ResponsibleAI";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Email Generator", url: "/email", icon: Mail },
  { title: "Meeting Summarizer", url: "/meetings", icon: CalendarCheck },
  { title: "Task Planner", url: "/tasks", icon: ClipboardList },
  { title: "AI Assistant", url: "/chat", icon: Bot },
  { title: "Session History", url: "/history", icon: History },
  { title: "Prompt Library", url: "/prompts", icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) =>
    url === "/" ? path === "/" : path === url || path.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          to="/"
          className="flex items-center gap-2 px-2 py-2 text-sidebar-foreground"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-brand text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">ProdAI</div>
              <div className="text-[10px] text-muted-foreground">
                Your AI Workplace Assistant
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ResponsibleAIDialog
              trigger={
                <SidebarMenuButton className="text-muted-foreground hover:text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  {!collapsed && <span>Responsible AI</span>}
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <p className="px-2 pb-2 pt-1 text-[10px] text-muted-foreground">
            AI outputs may be inaccurate — please review.
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
