import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, TrendingUp, Clock, Users, DollarSign, CheckCircle2, BarChart3, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const RoleInsights = () => {
  const { roles, primaryRole } = useAuth();

  // Multi-role insights
  if (roles.length > 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Multi-Role Access</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{roles.length}</p>
              <p className="text-xs text-purple-600 mt-1">Roles assigned</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">System Overview</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">All</p>
              <p className="text-xs text-blue-600 mt-1">Features accessible</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Quick Actions</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{roles.length * 4}</p>
              <p className="text-xs text-green-600 mt-1">Available actions</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </motion.div>
    );
  }

  // Single role insights
  if (primaryRole === 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">System Health</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">98%</p>
              <p className="text-xs text-blue-600 mt-1">All systems operational</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Active Users</p>
              <p className="text-2xl font-bold text-green-900 mt-2">127</p>
              <p className="text-xs text-green-600 mt-1">Logged in today</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">8</p>
              <p className="text-xs text-purple-600 mt-1">Require attention</p>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </motion.div>
    );
  }

  // Secretary insights
  if (primaryRole === 'secretary') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Pending Registrations</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">12</p>
              <p className="text-xs text-blue-600 mt-1">Awaiting approval</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Today's Absences</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">5</p>
              <p className="text-xs text-orange-600 mt-1">Need follow-up</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-green-900 mt-2">24</p>
              <p className="text-xs text-green-600 mt-1">This week</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </motion.div>
    );
  }

  // Trainer insights
  if (primaryRole === 'trainer') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Classes This Week</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">12</p>
              <p className="text-xs text-purple-600 mt-1">Sessions scheduled</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">92%</p>
              <p className="text-xs text-blue-600 mt-1">Current week</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Materials Uploaded</p>
              <p className="text-2xl font-bold text-green-900 mt-2">8</p>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </Card>
      </motion.div>
    );
  }

  // Finance insights
  if (primaryRole === 'finance') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">This Month Revenue</p>
              <p className="text-2xl font-bold text-green-900 mt-2">RWF 12.5M</p>
              <p className="text-xs text-green-600 mt-1">+15% vs last month</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Outstanding Fees</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">RWF 2.3M</p>
              <p className="text-xs text-orange-600 mt-1">35 students</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Payment Success Rate</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">94%</p>
              <p className="text-xs text-blue-600 mt-1">Past 30 days</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </motion.div>
    );
  }

  // Student insights
  if (primaryRole === 'student') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Your Attendance</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">96%</p>
              <p className="text-xs text-blue-600 mt-1">Excellent standing</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Fee Status</p>
              <p className="text-2xl font-bold text-green-900 mt-2">Paid</p>
              <p className="text-xs text-green-600 mt-1">Current & updated</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Next Class</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">Today 2:00 PM</p>
              <p className="text-xs text-purple-600 mt-1">Web Development</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
};
