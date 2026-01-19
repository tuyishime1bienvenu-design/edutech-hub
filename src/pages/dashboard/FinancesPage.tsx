import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

const FinancesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student_id: '',
    amount: '',
    payment_type: 'registration',
    payment_method: 'cash',
    notes: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Payments queries
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const studentIds = [...new Set(data?.map(p => p.student_id) || [])];
      const { data: students } = await supabase
        .from('students')
        .select('id, registration_number, user_id')
        .in('id', studentIds);

      const userIds = students?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      return data?.map(p => {
        const student = students?.find(s => s.id === p.student_id);
        const profile = profiles?.find(pr => pr.user_id === student?.user_id);
        return { ...p, student_name: profile?.full_name, registration_number: student?.registration_number };
      });
    },
  });

  const { data: studentsList } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, registration_number, user_id')
        .eq('is_active', true);
      if (error) throw error;

      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      return data?.map(s => ({
        ...s,
        full_name: profiles?.find(p => p.user_id === s.user_id)?.full_name
      }));
    },
  });

  // Stats queries
  const { data: financeStats } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: async () => {
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', thisMonth);

      const totalRevenue = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        totalRevenue,
        totalExpenses: 0,
        netIncome: totalRevenue,
      };
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (paymentData: typeof newPayment) => {
      const { error } = await supabase.from('payments').insert({
        ...paymentData,
        amount: parseFloat(paymentData.amount),
        recorded_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      setIsAddPaymentDialogOpen(false);
      setNewPayment({ student_id: '', amount: '', payment_type: 'registration', payment_method: 'cash', notes: '' });
      toast({ title: 'Payment recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording payment', description: error.message, variant: 'destructive' });
    },
  });

  const filteredPayments = payments?.filter(p =>
    p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { paginatedData, currentPage, totalPages, goToPage, nextPage, previousPage, hasNextPage, hasPreviousPage, totalItems } = usePagination({
    data: filteredPayments || [],
    itemsPerPage: 10,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (paymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Manage payments and finances</p>
        </div>
        <Button onClick={() => setIsAddPaymentDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financeStats?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(financeStats?.netIncome || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search payments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Registration #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.student_name || 'Unknown'}</TableCell>
                  <TableCell className="font-mono text-sm">{payment.registration_number}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="capitalize">{payment.payment_type}</TableCell>
                  <TableCell className="capitalize">{payment.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(payment.created_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNext={nextPage}
          onPrevious={previousPage}
          hasNext={hasNextPage}
          hasPrevious={hasPreviousPage}
          totalItems={totalItems}
          itemsPerPage={10}
        />
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={newPayment.student_id}
                onValueChange={(value) => setNewPayment({ ...newPayment, student_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsList?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name} ({s.registration_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (RWF)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={newPayment.payment_type}
                  onValueChange={(value) => setNewPayment({ ...newPayment, payment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={newPayment.payment_method}
                onValueChange={(value) => setNewPayment({ ...newPayment, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addPaymentMutation.mutate(newPayment)}
              disabled={!newPayment.student_id || !newPayment.amount || addPaymentMutation.isPending}
            >
              {addPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancesPage;
