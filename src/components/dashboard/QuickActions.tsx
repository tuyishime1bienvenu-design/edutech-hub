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
  Wallet,
  DollarSign,
  User,
  Eye,
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
    { label: 'View Profiles', href: '/dashboard/profiles', icon: Eye, color: 'info' },
    { label: 'Trainer Salaries', href: '/dashboard/trainer-salary-details', icon: DollarSign, color: 'success' },
    { label: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'info' },
    { label: 'Post Notice', href: '/dashboard/notices', icon: Bell, color: 'warning' },
    { label: 'Manage Classes', href: '/dashboard/classes', icon: BookOpen, color: 'success' },
  ],
  secretary: [
    { label: 'Register Student', href: '/dashboard/register-student', icon: UserPlus, color: 'primary' },
    { label: 'View Profiles', href: '/dashboard/profiles', icon: Eye, color: 'info' },
    { label: 'Trainer Salaries', href: '/dashboard/trainer-salary-details', icon: DollarSign, color: 'success' },
    { label: 'Record Visitor', href: '/dashboard/record-visitor', icon: Users, color: 'success' },
    { label: 'Record Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'info' },
    { label: 'View Classes', href: '/dashboard/classes', icon: BookOpen, color: 'warning' },
  ],
  trainer: [
    { label: 'Edit Profile', href: '/dashboard/settings', icon: User, color: 'primary' },
    { label: 'Take Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'primary' },
    { label: 'Salary & Advances', href: '/dashboard/trainer-salary', icon: Wallet, color: 'success' },
    { label: 'Submit Report', href: '/dashboard/reports', icon: FileText, color: 'info' },
    { label: 'Upload Material', href: '/dashboard/materials', icon: BookOpen, color: 'warning' },
    { label: 'Request Advance', href: '/dashboard/request-advance', icon: DollarSign, color: 'secondary' },
    { label: 'Request Leave', href: '/dashboard/leave-requests', icon: Calendar, color: 'primary' },
  ],
  finance: [
    { label: 'View Profiles', href: '/dashboard/profiles', icon: Eye, color: 'info' },
    { label: 'Trainer Salaries', href: '/dashboard/trainer-salary-details', icon: DollarSign, color: 'success' },
    { label: 'Record Payment', href: '/dashboard/payments', icon: CreditCard, color: 'primary' },
    { label: 'View Reports', href: '/dashboard/reports', icon: BarChart3, color: 'info' },
    { label: 'Manage Salaries', href: '/dashboard/salaries', icon: FileText, color: 'success' },
    { label: 'Advances', href: '/dashboard/advances', icon: FileText, color: 'warning' },
  ],
  student: [
    { label: 'Edit Profile', href: '/dashboard/settings', icon: User, color: 'primary' },
    { label: 'My Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, color: 'primary' },
    { label: 'View Schedule', href: '/dashboard/schedule', icon: Calendar, color: 'info' },
    { label: 'Learning Materials', href: '/dashboard/materials', icon: BookOpen, color: 'success' },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, color: 'warning' },
  ],
  it: [
    { label: 'View Profiles', href: '/dashboard/profiles', icon: Eye, color: 'info' },
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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to={action.href}
            className="group flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl text-center transition-all duration-300 hover:shadow-lg hover:border-gray-300"
          >
            <div className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110',
              action.color === 'primary' && 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
              action.color === 'secondary' && 'bg-gray-100 text-gray-600 group-hover:bg-gray-200',
              action.color === 'success' && 'bg-green-100 text-green-600 group-hover:bg-green-200',
              action.color === 'warning' && 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
              action.color === 'info' && 'bg-purple-100 text-purple-600 group-hover:bg-purple-200'
            )}>
              <action.icon className="w-7 h-7" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {action.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
