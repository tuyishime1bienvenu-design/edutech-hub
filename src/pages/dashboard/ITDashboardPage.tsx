import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ResponsiveTable } from '@/components/ui/ResponsiveTable';
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
  MapPin,
  Eye,
  EyeOff,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';

interface WiFiNetwork {
  id: string;
  name: string;
  password: string;
  assigned_roles: string[];
  created_at: string;
  created_by: string;
  is_active: boolean;
}

interface MaterialItem {
  id: string;
  name: string;
  unique_code?: string;
  category: string;
  current_quantity: number;
  minimum_quantity: number;
  location: string;
  supplier: string;
  unit_cost: number;
  unit: string;
  type?: string;
  barcode?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface MaterialTransaction {
  id: string;
  material_id: string;
  transaction_type: 'issue' | 'return';
  quantity: number;
  recipient_name: string;
  recipient_id: string;
  purpose: string;
  notes: string;
  recorded_by: string;
  transaction_date: string;
  is_returned: boolean;
  return_date: string;
  return_notes: string;
}

interface SalaryAdvance {
  id: string;
  employee_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comment: string | null;
  created_at: string;
  updated_at: string;
  forwarded_to_admin?: boolean;
  forwarded_at?: string;
  forwarded_by?: string;
}

const ITDashboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Dialog states
  const [wifiDialogOpen, setWifiDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showSalary, setShowSalary] = useState(false);

  // Form states
  const [wifiForm, setWifiForm] = useState({
    name: '',
    password: '',
    assigned_roles: [] as string[],
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    category: '',
    current_quantity: 0,
    minimum_quantity: 0,
    location: '',
    supplier: '',
    unit_cost: 0,
    unit: 'pieces',
  });

  const [transactionForm, setTransactionForm] = useState({
    material_id: '',
    transaction_type: 'issue' as 'issue' | 'return',
    quantity: 0,
    recipient_name: '',
    recipient_id: '',
    purpose: '',
    notes: '',
  });

  // Fetch users for recipient selection
  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });
  const generateUniqueCode = () => {
    const prefix = 'ITM';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  // Fetch data
  const { data: wifiNetworks } = useQuery({
    queryKey: ['wifi-networks'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('wifi_networks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WiFiNetwork[];
    },
  });

  const { data: materials } = useQuery({
    queryKey: ['materials-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MaterialItem[];
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['material-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as MaterialTransaction[];
    },
  });

  // Fetch IT user's salary advances
  const { data: salaryAdvances } = useQuery({
    queryKey: ['it-salary-advances', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('salary_advances')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SalaryAdvance[];
    },
    enabled: !!user?.id,
  });

  const { data: userSalary } = useQuery({
    queryKey: ['it-salary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('employee_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Mutations
  const createWifiMutation = useMutation({
    mutationFn: async (wifiData: typeof wifiForm) => {
      const { error } = await (supabase as any).from('wifi_networks').insert({
        name: wifiData.name,
        password: wifiData.password,
        assigned_roles: wifiData.assigned_roles,
        created_by: user?.id,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-networks'] });
      setWifiDialogOpen(false);
      setWifiForm({ name: '', password: '', assigned_roles: [] });
      toast({ title: 'WiFi network created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating WiFi network', description: error.message, variant: 'destructive' });
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: async (materialData: typeof materialForm) => {
      const uniqueCode = generateUniqueCode();
      const { error } = await supabase.from('materials_inventory').insert({
        ...materialData,
        unique_code: uniqueCode,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      setMaterialDialogOpen(false);
      setMaterialForm({
        name: '',
        category: '',
        current_quantity: 0,
        minimum_quantity: 0,
        location: '',
        supplier: '',
        unit_cost: 0,
        unit: 'pieces',
      });
      toast({ title: 'Material added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding material', description: error.message, variant: 'destructive' });
    },
  });

  const recordTransactionMutation = useMutation({
    mutationFn: async (transactionData: typeof transactionForm) => {
      const { error } = await supabase.from('material_transactions').insert({
        ...transactionData,
        recorded_by: user?.id,
        transaction_date: new Date().toISOString(),
      });
      if (error) throw error;

      // Update material quantity
      const material = materials?.find(m => m.id === transactionData.material_id);
      if (material) {
        const newQuantity = transactionData.transaction_type === 'issue' 
          ? material.current_quantity - transactionData.quantity
          : material.current_quantity + transactionData.quantity;
        
        await supabase.from('materials_inventory')
          .update({ current_quantity: newQuantity })
          .eq('id', transactionData.material_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      setTransactionDialogOpen(false);
      setTransactionForm({
        material_id: '',
        transaction_type: 'issue',
        quantity: 0,
        recipient_name: '',
        recipient_id: '',
        purpose: '',
        notes: '',
      });
      toast({ title: 'Transaction recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording transaction', description: error.message, variant: 'destructive' });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const togglePasswordVisibility = (wifiId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [wifiId]: !prev[wifiId]
    }));
  };

  const handleCreateWifi = () => {
    if (!wifiForm.name || !wifiForm.password || wifiForm.assigned_roles.length === 0) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    createWifiMutation.mutate(wifiForm);
  };

  const handleCreateMaterial = () => {
    if (!materialForm.name || !materialForm.category) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    createMaterialMutation.mutate(materialForm);
  };

  const handleRecordTransaction = () => {
    if (!transactionForm.material_id || !transactionForm.recipient_id || transactionForm.quantity <= 0) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    recordTransactionMutation.mutate(transactionForm);
  };

  // Calculate salary info
  const approvedAdvances = salaryAdvances?.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0) || 0;
  const baseSalary = userSalary?.amount || 0;
  const remainingSalary = Math.max(0, baseSalary - approvedAdvances);

  if (!wifiNetworks || !materials || !transactions) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Settings className="w-8 h-8" />
              IT Management Dashboard
            </h1>
            <p className="text-green-100 text-lg">Manage IT infrastructure, inventory, and resources</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center"
          >
            <p className="text-sm text-green-100 mb-1">System Status</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Operational
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Wifi className="w-8 h-8 text-blue-100" />
            <Router className="w-6 h-6 text-blue-100" />
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">WiFi Networks</h3>
          <p className="text-3xl font-bold">{wifiNetworks.length}</p>
          <div className="mt-4 pt-4 border-t border-blue-400/30">
            <div className="flex items-center text-blue-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Active networks
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-purple-100" />
            <Shield className="w-6 h-6 text-purple-100" />
          </div>
          <h3 className="text-purple-100 text-sm font-medium mb-1">Total Materials</h3>
          <p className="text-3xl font-bold">{materials.length}</p>
          <div className="mt-4 pt-4 border-t border-purple-400/30">
            <div className="flex items-center text-purple-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Tracked items
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <ArrowUpDown className="w-8 h-8 text-green-100" />
            <Calendar className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Transactions</h3>
          <p className="text-3xl font-bold">{transactions.length}</p>
          <div className="mt-4 pt-4 border-t border-green-400/30">
            <div className="flex items-center text-green-100 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              This month
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-orange-100" />
            <TrendingUp className="w-6 h-6 text-orange-100" />
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">My Salary</h3>
          <p className="text-3xl font-bold">
            {showSalary ? formatCurrency(remainingSalary) : '••••••'}
          </p>
          <div className="mt-4 pt-4 border-t border-orange-400/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSalary(!showSalary)}
              className="text-orange-100 hover:text-white p-0 h-auto"
            >
              {showSalary ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button onClick={() => setWifiDialogOpen(true)} className="h-20 flex-col gap-2">
            <Wifi className="w-6 h-6" />
            Create WiFi
          </Button>
          <Button onClick={() => setMaterialDialogOpen(true)} variant="outline" className="h-20 flex-col gap-2">
            <Package className="w-6 h-6" />
            Add Material
          </Button>
          <Button onClick={() => setTransactionDialogOpen(true)} variant="outline" className="h-20 flex-col gap-2">
            <ArrowUpDown className="w-6 h-6" />
            Record Transaction
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <DollarSign className="w-6 h-6" />
            Request Advance
          </Button>
        </div>
      </motion.div>

      {/* WiFi Networks */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
          WiFi Networks Management
        </h2>
        <ResponsiveTable
          data={wifiNetworks || []}
          title="WiFi Networks Management"
          searchable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          columns={[
            {
              key: 'name',
              title: 'Network Name',
              sortable: true,
              render: (value: string) => <span className="font-medium">{value}</span>
            },
            {
              key: 'password',
              title: 'Password',
              render: (value: string, wifi: any) => (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {showPasswords[wifi.id] ? value : '••••••••'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePasswordVisibility(wifi.id)}
                  >
                    {showPasswords[wifi.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              ),
            },
            {
              key: 'assigned_roles',
              title: 'Assigned Roles',
              render: (value: string[]) => (
                <div className="flex flex-wrap gap-1">
                  {value.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: 'is_active',
              title: 'Status',
              render: (value: boolean) => (
                <Badge className={value ? 'bg-green-500' : 'bg-red-500'}>
                  {value ? 'Active' : 'Inactive'}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              title: 'Created',
              sortable: true,
              render: (value: string) => format(new Date(value), 'MMM d, yyyy'),
            },
          ]}
        />
      </motion.div>

      {/* Materials Inventory */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
          Materials Inventory
        </h2>
        <ResponsiveTable
          data={materials || []}
          title="Materials Inventory"
          searchable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          columns={[
            {
              key: 'unique_code',
              title: 'Unique Code',
              sortable: true,
              render: (value: string) => <span className="font-mono text-xs">{value || 'N/A'}</span>,
            },
            {
              key: 'name',
              title: 'Name',
              sortable: true,
              render: (value: string) => <span className="font-medium">{value}</span>,
            },
            {
              key: 'category',
              title: 'Category',
              sortable: true,
            },
            {
              key: 'current_quantity',
              title: 'Quantity',
              render: (value: number, material: any) => (
                <div className="flex items-center gap-2">
                  <span>{value} {material.unit}</span>
                  {value <= material.minimum_quantity && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              ),
            },
            {
              key: 'location',
              title: 'Location',
              sortable: true,
            },
            {
              key: 'status',
              title: 'Status',
              render: (value: string, material: any) => (
                <Badge className={
                  material.current_quantity <= material.minimum_quantity 
                    ? 'bg-red-500' 
                    : 'bg-green-500'
                }>
                  {material.current_quantity <= material.minimum_quantity ? 'Low Stock' : 'In Stock'}
                </Badge>
              ),
            },
          ]}
        />
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
          Recent Transactions
        </h2>
        <ResponsiveTable
          data={transactions.slice(0, 10) || []}
          title="Recent Transactions"
          searchable={true}
          exportable={true}
          pagination={false}
          columns={[
            {
              key: 'transaction_type',
              title: 'Type',
              render: (value: string) => (
                <Badge className={
                  value === 'issue' 
                    ? 'bg-blue-500' 
                    : 'bg-green-500'
                }>
                  {value === 'issue' ? 'Issued' : 'Returned'}
                </Badge>
              ),
            },
            {
              key: 'material_id',
              title: 'Material',
              sortable: true,
            },
            {
              key: 'recipient_name',
              title: 'Recipient',
              sortable: true,
            },
            {
              key: 'quantity',
              title: 'Quantity',
              sortable: true,
            },
            {
              key: 'purpose',
              title: 'Purpose',
              render: (value: string) => (
                <span className="max-w-xs truncate block">{value}</span>
              ),
            },
            {
              key: 'transaction_date',
              title: 'Date',
              sortable: true,
              render: (value: string) => format(new Date(value), 'MMM d, yyyy'),
            },
          ]}
        />
      </motion.div>

      {/* Salary Advances Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <div className="w-1 h-6 bg-orange-500 rounded-full mr-3"></div>
          My Salary Advances
        </h2>
        <ResponsiveTable
          data={salaryAdvances || []}
          title="My Salary Advances"
          searchable={true}
          exportable={true}
          pagination={true}
          pageSize={10}
          emptyMessage="No salary advance requests found"
          columns={[
            {
              key: 'amount',
              title: 'Amount',
              sortable: true,
              render: (value: number) => (
                <span className="font-medium">{formatCurrency(value)}</span>
              ),
            },
            {
              key: 'reason',
              title: 'Reason',
              render: (value: string) => (
                <span className="max-w-xs truncate block">{value}</span>
              ),
            },
            {
              key: 'status',
              title: 'Status',
              render: (value: string, advance: any) => (
                <Badge className={
                  value === 'approved' 
                    ? 'bg-green-500' 
                    : value === 'rejected'
                    ? 'bg-red-500'
                    : advance.forwarded_to_admin
                    ? 'bg-blue-500'
                    : 'bg-gray-500'
                }>
                  {value === 'approved' ? 'Approved' : 
                   value === 'rejected' ? 'Rejected' : 
                   advance.forwarded_to_admin ? 'Pending Admin' : 'Pending'}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              title: 'Requested Date',
              sortable: true,
              render: (value: string) => format(new Date(value), 'MMM d, yyyy'),
            },
            {
              key: 'review_comment',
              title: 'Review Comment',
              render: (value: string) => (
                <span className="max-w-xs">
                  {value || <span className="text-muted-foreground">No comment</span>}
                </span>
              ),
            },
          ]}
        />
      </motion.div>

      {/* WiFi Dialog */}
      <Dialog open={wifiDialogOpen} onOpenChange={setWifiDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create WiFi Network</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wifi-name">Network Name</Label>
              <Input
                id="wifi-name"
                value={wifiForm.name}
                onChange={(e) => setWifiForm({ ...wifiForm, name: e.target.value })}
                placeholder="Enter network name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-password">Password</Label>
              <Input
                id="wifi-password"
                type="password"
                value={wifiForm.password}
                onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to Roles</Label>
              <Select
                value={wifiForm.assigned_roles[0] || ''}
                onValueChange={(value) => setWifiForm({ ...wifiForm, assigned_roles: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWifiDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWifi} disabled={createWifiMutation.isPending}>
              {createWifiMutation.isPending ? 'Creating...' : 'Create Network'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Material to Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-name">Material Name</Label>
                <Input
                  id="material-name"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="Enter material name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-category">Category</Label>
                <Input
                  id="material-category"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })}
                  placeholder="Enter category"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-quantity">Current Quantity</Label>
                <Input
                  id="material-quantity"
                  type="number"
                  value={materialForm.current_quantity}
                  onChange={(e) => setMaterialForm({ ...materialForm, current_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-minimum">Minimum Quantity</Label>
                <Input
                  id="material-minimum"
                  type="number"
                  value={materialForm.minimum_quantity}
                  onChange={(e) => setMaterialForm({ ...materialForm, minimum_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-unit">Unit</Label>
                <Select
                  value={materialForm.unit}
                  onValueChange={(value) => setMaterialForm({ ...materialForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">KG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-location">Location</Label>
                <Input
                  id="material-location"
                  value={materialForm.location}
                  onChange={(e) => setMaterialForm({ ...materialForm, location: e.target.value })}
                  placeholder="Storage location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-supplier">Supplier</Label>
                <Input
                  id="material-supplier"
                  value={materialForm.supplier}
                  onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="material-cost">Unit Cost (RWF)</Label>
              <Input
                id="material-cost"
                type="number"
                value={materialForm.unit_cost}
                onChange={(e) => setMaterialForm({ ...materialForm, unit_cost: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMaterial} disabled={createMaterialMutation.isPending}>
              {createMaterialMutation.isPending ? 'Adding...' : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Material Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={transactionForm.transaction_type}
                  onValueChange={(value: 'issue' | 'return') => setTransactionForm({ ...transactionForm, transaction_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue">Issue Material</SelectItem>
                    <SelectItem value="return">Return Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Material</Label>
                <Select
                  value={transactionForm.material_id}
                  onValueChange={(value) => setTransactionForm({ ...transactionForm, material_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.current_quantity} {material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-quantity">Quantity</Label>
                <Input
                  id="transaction-quantity"
                  type="number"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm({ ...transactionForm, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-recipient">Recipient</Label>
                <Select
                  value={transactionForm.recipient_id}
                  onValueChange={(value) => {
                    const selectedUser = users?.find(u => u.user_id === value);
                    setTransactionForm({ 
                      ...transactionForm, 
                      recipient_id: value,
                      recipient_name: selectedUser?.full_name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-purpose">Purpose</Label>
              <Input
                id="transaction-purpose"
                value={transactionForm.purpose}
                onChange={(e) => setTransactionForm({ ...transactionForm, purpose: e.target.value })}
                placeholder="Purpose of transaction"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-notes">Notes/Comments</Label>
              <Textarea
                id="transaction-notes"
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordTransaction} disabled={recordTransactionMutation.isPending}>
              {recordTransactionMutation.isPending ? 'Recording...' : 'Record Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITDashboardPage;
