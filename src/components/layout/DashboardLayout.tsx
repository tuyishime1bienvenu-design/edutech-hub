import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  ClipboardList,
  BarChart3,
  UserCog,
  Wallet,
  Clock,
  Award,
  DollarSign,
  Briefcase,
  Image,
  MessageSquare,
  Wrench,
  UserPlus,
  Wifi,
  Package,
  History,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const roleNavItems: Record<string, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Users', href: '/dashboard/users', icon: Users },
    { label: 'Programs', href: '/dashboard/programs', icon: BookOpen },
    { label: 'Classes', href: '/dashboard/classes', icon: GraduationCap },
    { label: 'Students', href: '/dashboard/students', icon: UserCog },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Fee Structures', href: '/dashboard/fee-structures', icon: DollarSign },
    { label: 'Finances', href: '/dashboard/finances', icon: CreditCard },
    { label: 'Salary Advances', href: '/dashboard/salary-advances', icon: Wallet },
    { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
    { label: 'Certificate Templates', href: '/dashboard/certificate-templates', icon: Award },
    { label: 'Services', href: '/dashboard/services', icon: Wrench },
    { label: 'Vacancies', href: '/dashboard/vacancies', icon: Briefcase },
    { label: 'Gallery', href: '/dashboard/gallery', icon: Image },
    { label: 'Contact Messages', href: '/dashboard/contact-messages', icon: MessageSquare },
    { label: 'Notices', href: '/dashboard/notices', icon: Bell },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: FileText },
  ],
  secretary: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Register Student', href: '/dashboard/register-student', icon: UserCog },
    { label: 'Students', href: '/dashboard/students', icon: Users },
    { label: 'Classes', href: '/dashboard/classes', icon: GraduationCap },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Record Visitor', href: '/dashboard/record-visitor', icon: UserPlus },
    { label: 'Visitors', href: '/dashboard/visitors', icon: Users },
    { label: 'Contact Messages', href: '/dashboard/contact-messages', icon: MessageSquare },
    { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  ],
  trainer: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Class Reports', href: '/dashboard/reports', icon: FileText },
    { label: 'Materials', href: '/dashboard/materials', icon: BookOpen },
    { label: 'Request Advance', href: '/dashboard/request-advance', icon: Wallet },
    { label: 'Leave Requests', href: '/dashboard/leave-requests', icon: Calendar },
  ],
  finance: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Finances', href: '/dashboard/finances', icon: CreditCard },
    { label: 'Students', href: '/dashboard/students', icon: Users },
    { label: 'Salary Advances', href: '/dashboard/salary-advances', icon: Wallet },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ],
  student: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { label: 'Materials', href: '/dashboard/materials', icon: BookOpen },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  ],
  it: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'IT Management', href: '/dashboard/it', icon: Wrench },
    { label: 'Equipment', href: '/dashboard/equipment', icon: Settings },
    { label: 'Materials Inventory', href: '/dashboard/materials-inventory', icon: Package },
    { label: 'WiFi Networks', href: '/dashboard/wifi-networks', icon: Wifi },
    { label: 'Material Transactions', href: '/dashboard/material-transactions', icon: History },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, roles, primaryRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Combine nav items from all user roles, removing duplicates
  const navItems = roles.length > 0 
    ? Array.from(
        new Map(
          roles.flatMap(role => roleNavItems[role] || [])
            .map(item => [item.href, item])
        ).values()
      )
    : [];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (roles: string[]) => {
    const labels: Record<string, string> = {
      admin: 'Administrator',
      secretary: 'Secretary',
      trainer: 'Trainer',
      finance: 'Chief of Finance',
      student: 'Student',
      it: 'IT Manager',
    };
    if (roles.length === 1) {
      return labels[roles[0]] || roles[0];
    }
    return roles.map(role => labels[role] || role).join(', ');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <img src="/logo.svg" alt="EdTech Solutions" className="h-12 w-auto" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {roles.length > 0 ? getRoleLabel(roles) : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden md:block">
                <h1 className="text-xl font-display font-semibold">
                  {navItems.find((item) => item.href === location.pathname)?.label || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">
                      {profile?.full_name?.split(' ')[0] || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{profile?.full_name || 'User'}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {profile?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
