import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  ClipboardCheck,
  FileText,
  CreditCard,
  Calendar,
  BookOpen,
  Bell,
  BarChart3,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
}

const actionColors = {
  primary: 'bg-primary/10 text-primary hover:bg-primary/20',
  secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  success: 'bg-success/10 text-success hover:bg-success/20',
  warning: 'bg-warning/10 text-warning hover:bg-warning/20',
  info: 'bg-info/10 text-info hover:bg-info/20',
};

const roleActions: Record<string, QuickAction[]> = {
  admin: [
    { label: 'Add User', href: '/dashboard/users', icon: UserPlus, color: 'primary' },
    { label: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'info' },
    { label: 'Post Notice', href: '/dashboard/notices', icon: Bell, color: 'warning' },
    { label: 'Manage Classes', href: '/dashboard/classes', icon: BookOpen, color: 'success' },
  ],
  secretary: [
    { label: 'Register Student', href: '/dashboard/register-student', icon: UserPlus, color: 'primary' },
    { label: 'Record Visitor', href: '/dashboard/record-visitor', icon: Users, color: 'success' },
    { label: 'Record Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'info' },
    { label: 'View Classes', href: '/dashboard/classes', icon: BookOpen, color: 'warning' },
  ],
  trainer: [
    { label: 'Take Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'primary' },
    { label: 'Submit Report', href: '/dashboard/reports', icon: FileText, color: 'info' },
    { label: 'Upload Material', href: '/dashboard/materials', icon: BookOpen, color: 'success' },
    { label: 'Request Leave', href: '/dashboard/leave', icon: Calendar, color: 'warning' },
  ],
  finance: [
    { label: 'Record Payment', href: '/dashboard/payments', icon: CreditCard, color: 'primary' },
    { label: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'info' },
    { label: 'Manage Salaries', href: '/dashboard/salaries', icon: FileText, color: 'success' },
    { label: 'Advances', href: '/dashboard/advances', icon: FileText, color: 'warning' },
  ],
  student: [
    { label: 'My Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'primary' },
    { label: 'View Schedule', href: '/dashboard/schedule', icon: Calendar, color: 'info' },
    { label: 'Learning Materials', href: '/dashboard/materials', icon: BookOpen, color: 'success' },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, color: 'warning' },
  ],
  it: [
    { label: 'Manage Equipment', href: '/dashboard/equipment', icon: BookOpen, color: 'primary' },
    { label: 'Materials Inventory', href: '/dashboard/materials-inventory', icon: BookOpen, color: 'info' },
    { label: 'WiFi Networks', href: '/dashboard/wifi-networks', icon: Users, color: 'success' },
    { label: 'Material Transactions', href: '/dashboard/material-transactions', icon: FileText, color: 'warning' },
  ],
};

interface QuickActionsProps {
  role?: string;
}

export const QuickActions = ({ role = 'admin' }: QuickActionsProps) => {
  const actions = roleActions[role] || roleActions.admin;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <h3 className="text-lg font-display font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
          >
            <Link
              to={action.href}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl text-center transition-all duration-200',
                actionColors[action.color]
              )}
            >
              <action.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
