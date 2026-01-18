import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, BookOpen, Wallet, Award } from 'lucide-react';

interface WelcomeCardProps {
  subtitle?: string;
}

export const WelcomeCard = ({ subtitle }: WelcomeCardProps) => {
  const { profile, roles, primaryRole } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificMessage = () => {
    if (roles.length > 1) {
      return "You have multiple roles. Access all your features from the navigation menu.";
    }
    switch (primaryRole) {
      case 'admin':
        return "Here's your system overview. Monitor all operations and manage users effectively.";
      case 'secretary':
        return 'Manage student registrations, track attendance, and handle administrative tasks.';
      case 'trainer':
        return 'Track your classes, record attendance, and manage learning materials.';
      case 'finance':
        return 'Review payments, manage fees, and analyze financial reports.';
      case 'student':
        return 'Check your schedule, view learning materials, and track your progress.';
      case 'it':
        return 'Manage IT equipment, materials inventory, and network infrastructure.';
      default:
        return 'Welcome to the ITMS dashboard.';
    }
  };

  const getRoleBadgeInfo = () => {
    const roleInfo: Record<string, { label: string; icon: any; bgColor: string }> = {
      admin: { label: 'Administrator', icon: Crown, bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500' },
      secretary: { label: 'Secretary', icon: Shield, bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
      trainer: { label: 'Trainer', icon: BookOpen, bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500' },
      finance: { label: 'Finance Officer', icon: Wallet, bgColor: 'bg-gradient-to-r from-yellow-500 to-orange-500' },
      student: { label: 'Student', icon: Award, bgColor: 'bg-gradient-to-r from-indigo-500 to-blue-500' },
      it: { label: 'IT Manager', icon: Shield, bgColor: 'bg-gradient-to-r from-gray-500 to-slate-500' },
    };
    
    if (roles.length > 1) {
      return { label: 'Multi-Role User', icon: Crown, bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500' };
    }
    
    return roleInfo[primaryRole || 'admin'] || roleInfo.admin;
  };

  const roleBadgeInfo = getRoleBadgeInfo();
  const RoleIcon = roleBadgeInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl p-8 text-white overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Decorative animated elements */}
      <motion.div
        animate={{ x: [0, 10, 0], y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"
      />
      <motion.div
        animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute bottom-0 left-1/4 w-72 h-72 bg-white/5 rounded-full translate-y-1/2"
      />

      <div className="relative z-10">
        {/* Date and Role Badge */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/70 text-sm font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm ${roleBadgeInfo.bgColor} bg-opacity-30 border border-white/20`}
          >
            <RoleIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{roleBadgeInfo.label}</span>
          </motion.div>
        </div>

        {/* Welcome message */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
            {subtitle || getRoleSpecificMessage()}
          </p>
        </motion.div>

        {/* Status indicators */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-white/70">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>System Status: Online</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>All Services Active</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
