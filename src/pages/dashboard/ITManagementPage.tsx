import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Settings, 
  Wifi, 
  Package, 
  History, 
  DollarSign, 
  Users, 
  Monitor, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Activity, 
  Database, 
  Lock, 
  Globe, 
  Server, 
  Smartphone, 
  Laptop, 
  Router, 
  HardDrive, 
  Cpu, 
  Zap, 
  Wrench, 
  RefreshCw, 
  Download, 
  Upload, 
  FileText, 
  BarChart3, 
  Clock, 
  Calendar, 
  MapPin
} from 'lucide-react';

interface SystemStats {
  totalUsers: number;
  activeEquipment: number;
  totalMaterials: number;
  pendingRequests: number;
  brokenEquipment: number;
  lowStockItems: number;
  todayTransactions: number;
  systemHealth: 'good' | 'warning' | 'critical';
}

const ITManagementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['it-management-stats'],
    queryFn: async () => {
      // Get users count
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('is_active', true);
      if (usersError) throw usersError;

      // Get equipment stats
      const { data: equipment, error: equipmentError } = await (supabase as any)
        .from('equipment')
        .select('status');
      if (equipmentError) throw equipmentError;

      // Get materials stats
      const { data: materials, error: materialsError } = await supabase
        .from('materials_inventory')
        .select('current_quantity, minimum_quantity');
      if (materialsError) throw materialsError;

      // Get today's transactions
      const today = new Date().toISOString().split('T')[0];
      const { data: transactions, error: transactionsError } = await supabase
        .from('material_transactions')
        .select('id')
        .gte('transaction_date', today);
      if (transactionsError) throw transactionsError;

      const totalUsers = users?.length || 0;
      const activeEquipment = equipment?.filter(e => e.status === 'available').length || 0;
      const brokenEquipment = equipment?.filter(e => e.status === 'broken' || e.status === 'lost').length || 0;
      const totalMaterials = materials?.length || 0;
      const lowStockItems = materials?.filter(m => m.current_quantity <= m.minimum_quantity).length || 0;
      const pendingRequests = 0; // No equipment requests table available
      const todayTransactions = transactions?.length || 0;

      // Determine system health
      let systemHealth: 'good' | 'warning' | 'critical' = 'good';
      if (brokenEquipment > 5 || lowStockItems > 10) {
        systemHealth = 'critical';
      } else if (brokenEquipment > 2 || lowStockItems > 5) {
        systemHealth = 'warning';
      }

      return {
        totalUsers,
        activeEquipment,
        totalMaterials,
        pendingRequests,
        brokenEquipment,
        lowStockItems,
        todayTransactions,
        systemHealth,
      } as SystemStats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getSystemHealthBadge = () => {
    switch (stats?.systemHealth) {
      case 'good':
        return <Badge className="bg-green-500">System Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-orange-500">Needs Attention</Badge>;
      case 'critical':
        return <Badge className="bg-red-500">Critical Issues</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const quickActions = [
    {
      title: 'WiFi Management',
      description: 'Manage network segments and access',
      icon: Wifi,
      href: '/dashboard/wifi-networks',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Material Transactions',
      description: 'Track material issuance and returns',
      icon: History,
      href: '/dashboard/material-transactions',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Equipment Status',
      description: 'Monitor equipment health and status',
      icon: Monitor,
      href: '/dashboard/equipment',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Inventory Management',
      description: 'Manage materials and supplies',
      icon: Package,
      href: '/dashboard/materials-inventory',
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Salary Advances',
      description: 'Request and track salary advances',
      icon: DollarSign,
      href: '/dashboard/request-advance',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'User Management',
      description: 'View and manage system users',
      icon: Users,
      href: '/dashboard/users',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const systemTools = [
    {
      title: 'System Backup',
      description: 'Create system backups',
      icon: Database,
      action: 'backup',
    },
    {
      title: 'Security Scan',
      description: 'Run security diagnostics',
      icon: Shield,
      action: 'security',
    },
    {
      title: 'Performance Monitor',
      description: 'Check system performance',
      icon: Activity,
      action: 'performance',
    },
    {
      title: 'Network Diagnostics',
      description: 'Test network connectivity',
      icon: Globe,
      action: 'network',
    },
  ];

  const handleToolAction = (action: string) => {
    toast({ 
      title: 'Tool Coming Soon', 
      description: `${action} functionality will be available in the next update.`, 
      variant: 'default' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            IT Management Center
          </h1>
          <p className="text-muted-foreground">Central hub for IT operations and system management</p>
        </div>
        <div className="flex items-center gap-3">
          {getSystemHealthBadge()}
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* System Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-100" />
            <Activity className="w-6 h-6 text-blue-100" />
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">Active Users</h3>
          <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Monitor className="w-8 h-8 text-green-100" />
            <CheckCircle className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Active Equipment</h3>
          <p className="text-3xl font-bold">{stats?.activeEquipment || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-purple-100" />
            <BarChart3 className="w-6 h-6 text-purple-100" />
          </div>
          <h3 className="text-purple-100 text-sm font-medium mb-1">Total Materials</h3>
          <p className="text-3xl font-bold">{stats?.totalMaterials || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-100" />
            <Calendar className="w-6 h-6 text-orange-100" />
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">Today's Activity</h3>
          <p className="text-3xl font-bold">{stats?.todayTransactions || 0}</p>
        </motion.div>
      </motion.div>

      {/* Alerts Section */}
      {(stats?.brokenEquipment > 0 || stats?.lowStockItems > 0 || stats?.pendingRequests > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          {stats?.brokenEquipment > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800">Equipment Issues</h3>
                    <p className="text-sm text-red-600">
                      {stats.brokenEquipment} equipment items need attention (broken/lost)
                    </p>
                  </div>
                  <Link to="/dashboard/equipment">
                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.lowStockItems > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Low Stock Alert</h3>
                    <p className="text-sm text-orange-600">
                      {stats.lowStockItems} materials are below minimum quantity
                    </p>
                  </div>
                  <Link to="/dashboard/materials-inventory">
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.pendingRequests > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-800">Pending Returns</h3>
                    <p className="text-sm text-blue-600">
                      {stats.pendingRequests} equipment items awaiting return
                    </p>
                  </div>
                  <Link to="/dashboard/equipment">
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link to={action.href}>
                <Card className={`h-full cursor-pointer transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br ${action.color} text-white`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <action.icon className="w-10 h-10 text-white/80" />
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-white/80">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* System Tools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
          System Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemTools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Card className="h-full cursor-pointer transition-all duration-300 hover:shadow-lg border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                      <tool.icon className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToolAction(tool.action)}
                      className="w-full"
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Launch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Infrastructure</h3>
            <p className="text-sm text-gray-600">Network and systems operational</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Security</h3>
            <p className="text-sm text-gray-600">All security measures active</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-1">Data Management</h3>
            <p className="text-sm text-gray-600">Backups and recovery ready</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ITManagementPage;
