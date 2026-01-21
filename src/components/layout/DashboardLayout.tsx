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
  Plus,
  Eye,
  AlertCircle,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Upload,
  Filter,
  Grid3x3,
  List,
  Monitor,
  Shield,
  Database,
  Globe,
  Smartphone,
  Lock,
  Key
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessagesIndicator } from '@/components/ui/MessagesIndicator';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import logo from '/logo.jpg';

interface Notice {
  id: string;
  title: string;
  content: string;
  target_roles: ("admin" | "secretary" | "trainer" | "finance" | "student")[];
  created_at: string;
  holiday_date?: string;
  is_active: boolean;
  is_holiday: boolean;
  notice_type: string;
  read_at?: string;
}

const NotificationDropdown = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    target_roles: [] as ("admin" | "secretary" | "trainer" | "finance" | "student")[],
    notice_type: 'general',
  });

  // Fetch notices for the user
  const { data: notices, isLoading } = useQuery({
    queryKey: ['user-notices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Notice[];
    },
    enabled: !!user?.id,
  });

  // Create notice mutation
  const createNoticeMutation = useMutation({
    mutationFn: async (data: typeof noticeForm) => {
      const { error } = await supabase
        .from('notices')
        .insert({
          ...data,
          is_active: true,
          is_holiday: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notices'] });
      setNoticeDialogOpen(false);
      setNoticeForm({ title: '', content: '', target_roles: [], notice_type: 'general' });
      toast({ title: 'Notice created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating notice', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateNotice = () => {
    if (!noticeForm.title || !noticeForm.content) {
      toast({ title: 'Title and content are required', variant: 'destructive' });
      return;
    }
    createNoticeMutation.mutate(noticeForm);
  };

  const unreadCount = notices?.filter(n => !n.read_at).length || 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNoticeDialogOpen(true)}
              className="h-auto p-1"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notices?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notices.map((notice) => (
                <DropdownMenuItem key={notice.id} className="p-4 cursor-pointer">
                  <div className="w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notice.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notice.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notice.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Notice Dialog */}
      <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notice-title">Title</Label>
              <Input
                id="notice-title"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Enter notice title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-content">Content</Label>
              <Textarea
                id="notice-content"
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Enter notice content"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Roles</Label>
              <Select
                value={noticeForm.target_roles[0] || ''}
                onValueChange={(value) => setNoticeForm({ ...noticeForm, target_roles: [value as "admin" | "secretary" | "trainer" | "finance" | "student"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="secretary">Secretaries</SelectItem>
                  <SelectItem value="trainer">Trainers</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="it">IT Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notice Type</Label>
              <Select
                value={noticeForm.notice_type}
                onValueChange={(value) => setNoticeForm({ ...noticeForm, notice_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select notice type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateNotice} disabled={createNoticeMutation.isPending}>
              {createNoticeMutation.isPending ? 'Creating...' : 'Create Notice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

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
    { label: 'Finance', href: '/dashboard/finance', icon: CreditCard },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Salary', href: '/dashboard/salary-advances', icon: Wallet },
    { label: 'Certificates', href: '/dashboard/certificates', icon: Award },
    { label: 'Gallery', href: '/dashboard/gallery', icon: Image },
    { label: 'Job Postings', href: '/dashboard/job-postings', icon: Briefcase },
    { label: 'Job Applications', href: '/dashboard/job-applications', icon: Users },
    { label: 'Messages', href: '/dashboard/contact-messages', icon: MessageSquare },
    { label: 'Careers', href: '/dashboard/careers', icon: Briefcase },
    { label: 'Documents', href: '/dashboard/documents', icon: FileText },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  secretary: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Register', href: '/dashboard/register-student', icon: UserPlus },
    { label: 'Students', href: '/dashboard/students', icon: Users },
    { label: 'Classes', href: '/dashboard/classes', icon: GraduationCap },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Visitors', href: '/dashboard/visitors', icon: Users },
    { label: 'Messages', href: '/dashboard/contact-messages', icon: MessageSquare },
    { label: 'Notices', href: '/dashboard/notices', icon: Bell },
    { label: 'Careers', href: '/dashboard/careers', icon: Briefcase },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  trainer: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Classes', href: '/dashboard/classes', icon: GraduationCap },
    { label: 'Materials', href: '/dashboard/materials', icon: BookOpen },
    { label: 'Salary', href: '/dashboard/trainer-salary', icon: Wallet },
    { label: 'Advances', href: '/dashboard/request-advance', icon: DollarSign },
    { label: 'Reports', href: '/dashboard/reports', icon: FileText },
    { label: 'Careers', href: '/dashboard/careers', icon: Briefcase },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  finance: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Finance', href: '/dashboard/finances', icon: CreditCard },
    { label: 'Students', href: '/dashboard/students', icon: Users },
    { label: 'Salary', href: '/dashboard/salary-advances', icon: Wallet },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Careers', href: '/dashboard/careers', icon: Briefcase },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  student: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Classes', href: '/dashboard/classes', icon: GraduationCap },
    { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
    { label: 'Schedule', href: '/dashboard/schedule', icon: Calendar },
    { label: 'Materials', href: '/dashboard/materials', icon: BookOpen },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { label: 'Notices', href: '/dashboard/notices', icon: Bell },
    { label: 'Careers', href: '/dashboard/careers', icon: Briefcase },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  it: [
    { label: 'IT Dashboard', href: '/dashboard/it-dashboard', icon: Monitor },
    { label: 'WiFi Networks', href: '/dashboard/wifi-networks', icon: Wifi },
    { label: 'Materials', href: '/dashboard/material-transactions', icon: Package },
    { label: 'Inventory', href: '/dashboard/materials-inventory', icon: Database },
    { label: 'Equipment', href: '/dashboard/equipment', icon: Smartphone },
    { label: 'Security', href: '/dashboard/it', icon: Shield },
    { label: 'Salary', href: '/dashboard/request-advance', icon: DollarSign },
    { label: 'Careers', href: '/dashboard/careers', icon: Briefcase },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile, roles, primaryRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
          'fixed lg:static inset-y-0 left-0 z-50 bg-sidebar transition-all duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-16' : 'w-72'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <img src={logo} alt="EdTech Solutions" className="h-8 w-auto" />
              {!sidebarCollapsed && (
                <span className="text-lg font-semibold text-sidebar-foreground">EdTech Solutions</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex text-sidebar-foreground hover:text-sidebar-primary p-1"
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const isMessages = item.label === 'Messages';
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      <div className="relative">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {isMessages && <MessagesIndicator />}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          {!sidebarCollapsed && (
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
          )}
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
              <div className="flex items-center gap-3">
                <img src={logo} alt="EdTech Solutions" className="h-8 w-auto" />
                <div className="hidden md:block">
                  <h1 className="text-xl font-display font-semibold">
                    {navItems.find((item) => item.href === location.pathname)?.label || 'Dashboard'}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <NotificationDropdown />

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
