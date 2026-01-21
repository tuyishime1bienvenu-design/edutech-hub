import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSalary } from '@/hooks/useSalary';
import { RequestAdvanceModal } from '@/components/dashboard/RequestAdvanceModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  TrendingUp,
  Wallet,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

interface SalaryAdvance {
  id: string;
  employee_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

const RequestAdvancePage = () => {
  const { user } = useAuth();
  const { data: salary, isLoading } = useSalary();
  const [modalOpen, setModalOpen] = useState(false);
  const [showFinancialInfo, setShowFinancialInfo] = useState(false);

  // Fetch user's salary advances
  const { data: advances, isLoading: advancesLoading } = useQuery({
    queryKey: ['user-salary-advances', user?.id],
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (advance: SalaryAdvance) => {
    if (advance.status === 'approved') {
      return <Badge className="bg-green-500">Approved</Badge>;
    }
    if (advance.status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  // Calculate stats
  const approvedAdvances = advances?.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0) || 0;
  const pendingAdvances = advances?.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0) || 0;
  const totalAdvances = advances?.length || 0;

  if (isLoading || advancesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No salary information found. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            Salary Advances
          </h1>
          <p className="text-muted-foreground">Request and track your salary advances</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Wallet className="w-8 h-8 text-blue-100" />
            <TrendingUp className="w-6 h-6 text-blue-100" />
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">Base Salary</h3>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold">
              {showFinancialInfo ? formatCurrency(salary.amount) : '•••••••'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFinancialInfo(!showFinancialInfo)}
              className="text-blue-100 hover:text-white p-0 h-auto"
            >
              {showFinancialInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-100" />
            <Calendar className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Approved Advances</h3>
          <p className="text-3xl font-bold">
            {showFinancialInfo ? formatCurrency(approvedAdvances) : '•••••••'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-100" />
            <AlertCircle className="w-6 h-6 text-orange-100" />
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">Pending Advances</h3>
          <p className="text-3xl font-bold">
            {showFinancialInfo ? formatCurrency(pendingAdvances) : '•••••••'}
          </p>
        </motion.div>
      </div>

      {/* Recent Advances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
            Recent Advances
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Review Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No advance requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  advances.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {showFinancialInfo ? formatCurrency(advance.amount) : '•••••••'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{advance.reason}</TableCell>
                      <TableCell>{getStatusBadge(advance)}</TableCell>
                      <TableCell>{format(new Date(advance.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="max-w-xs">
                        {advance.review_comment || (
                          <span className="text-muted-foreground">No comment</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Request Modal */}
      <RequestAdvanceModal salary={salary} open={modalOpen} onOpenChange={setModalOpen} showTrigger={false} />
    </div>
  );
};

export default RequestAdvancePage;