import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  CreditCard,
  FileText,
  Download,
  Filter,
  Search,
  PieChart,
  BarChart3,
  Activity,
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const FinanceDashboardPage = () => {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Check if user can view finance reports (admin)
  const canViewFinance = primaryRole === 'admin';

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'week':
        return {
          start: format(subDays(now, 7), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          start: format(quarterStart, 'yyyy-MM-dd'),
          end: format(quarterEnd, 'yyyy-MM-dd')
        };
      case 'year':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd')
        };
      default:
        return { start: startDate, end: endDate };
    }
  };

  const dateRangeValues = getDateRange();

  // Fetch payments with filters
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', dateRangeValues.start, dateRangeValues.end, statusFilter, methodFilter, searchTerm],
    queryFn: async () => {
      if (!canViewFinance) return [];

      let query = supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_type,
          payment_method,
          status,
          notes,
          created_at,
          student_id,
          recorded_by,
          students!inner(
            registration_number,
            user_id,
            school_name,
            level
          )
        `)
        .gte('created_at', dateRangeValues.start)
        .lte('created_at', dateRangeValues.end + ' 23:59:59')
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'paid' | 'partial');
      }
      if (methodFilter !== 'all') {
        query = query.eq('payment_method', methodFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles for recorded_by
      const recordedByIds = data?.map(p => p.recorded_by).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', recordedByIds);

      // Fetch user profiles for students
      const studentUserIds = data?.map(p => p.students?.user_id).filter(Boolean) || [];
      const { data: studentProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentUserIds);

      // Combine data
      return data?.map(payment => ({
        ...payment,
        recorded_by_profile: profiles?.find(p => p.user_id === payment.recorded_by),
        student_profile: studentProfiles?.find(p => p.user_id === payment.students?.user_id)
      }));
    },
    enabled: canViewFinance,
  });

  // Calculate financial statistics
  const { data: stats } = useQuery({
    queryKey: ['finance-stats', dateRangeValues.start, dateRangeValues.end],
    queryFn: async () => {
      if (!canViewFinance) return null;

      const { data, error } = await supabase
        .from('payments')
        .select('amount, status, payment_method, payment_type')
        .gte('created_at', dateRangeValues.start)
        .lte('created_at', dateRangeValues.end + ' 23:59:59');

      if (error) throw error;

      const totalRevenue = data?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      const paidAmount = data?.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      const pendingAmount = data?.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      const partialAmount = data?.filter(p => p.status === 'partial').reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

      // Payment method breakdown
      const methodBreakdown = data?.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + parseFloat(p.amount.toString());
        return acc;
      }, {} as Record<string, number>) || {};

      // Payment type breakdown
      const typeBreakdown = data?.reduce((acc, p) => {
        acc[p.payment_type] = (acc[p.payment_type] || 0) + parseFloat(p.amount.toString());
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalRevenue,
        paidAmount,
        pendingAmount,
        partialAmount,
        totalTransactions: data?.length || 0,
        paidTransactions: data?.filter(p => p.status === 'paid').length || 0,
        pendingTransactions: data?.filter(p => p.status === 'pending').length || 0,
        partialTransactions: data?.filter(p => p.status === 'partial').length || 0,
        methodBreakdown,
        typeBreakdown,
        collectionRate: totalRevenue > 0 ? Math.round((paidAmount / totalRevenue) * 100) : 0
      };
    },
    enabled: canViewFinance,
  });

  // Export finance report
  const exportFinanceReport = () => {
    if (!payments || payments.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const headers = [
      'Date', 'Student Name', 'Registration', 'School', 'Level', 
      'Payment Type', 'Amount', 'Method', 'Status', 'Notes', 'Recorded By'
    ];
    
    const csvContent = [
      headers.join(','),
      ...payments.map(payment => [
        format(new Date(payment.created_at), 'yyyy-MM-dd'),
        payment.student_profile?.full_name || 'N/A',
        payment.students?.registration_number || 'N/A',
        payment.students?.school_name || 'N/A',
        payment.students?.level || 'N/A',
        payment.payment_type || 'N/A',
        payment.amount,
        payment.payment_method || 'N/A',
        payment.status || 'N/A',
        `"${payment.notes || ''}"`,
        payment.recorded_by_profile?.full_name || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Finance report exported successfully' });
  };

  if (!canViewFinance) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view finance reports. Only admins can access finance data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Finance Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive financial reports and analytics
            </p>
          </div>
        </div>
        <Button onClick={exportFinanceReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Range and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Student name or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RWF {stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RWF {stats.paidAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">RWF {stats.pendingAmount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.collectionRate}%</p>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Breakdown Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Revenue by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.methodBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{method}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(amount / stats.totalRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">RWF {amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Revenue by Payment Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.typeBreakdown).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(amount / stats.totalRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">RWF {amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.student_profile?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{payment.students?.school_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{payment.students?.registration_number || 'N/A'}</TableCell>
                      <TableCell>{payment.payment_type}</TableCell>
                      <TableCell className="font-medium">RWF {parseFloat(payment.amount.toString()).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.payment_method?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === 'paid' ? 'default' : 
                                  payment.status === 'pending' ? 'secondary' : 'outline'}
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.recorded_by_profile?.full_name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transactions found for the selected criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceDashboardPage;
