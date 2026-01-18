import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, DollarSign, TrendingUp, CreditCard, Download, Calculator, Receipt, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

const FinancesPage = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [selectedPayrollPeriod, setSelectedPayrollPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [newPayment, setNewPayment] = useState({
    student_id: '',
    amount: '',
    payment_type: 'registration',
    payment_method: 'cash',
    notes: '',
  });

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'office_supplies',
    payment_method: 'cash',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Payments queries and mutations
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

  // Expenses queries and mutations
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Payroll queries and mutations
  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const employeeIds = [...new Set(data?.map(p => p.employee_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', employeeIds);

      return data?.map(p => {
        const profile = profiles?.find(pr => pr.user_id === p.employee_id);
        return { ...p, employee_name: profile?.full_name };
      });
    },
  });

  // Get employees with salaries for payroll generation
  const { data: employeesWithSalaries } = useQuery({
    queryKey: ['employees-with-salaries'],
    queryFn: async () => {
      const { data: salaries, error: salariesError } = await supabase
        .from('salaries')
        .select('*');
      if (salariesError) throw salariesError;

      const employeeIds = salaries?.map(s => s.employee_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', employeeIds);

      return salaries?.map(salary => {
        const profile = profiles?.find(p => p.user_id === salary.employee_id);
        return {
          ...salary,
          employee_name: profile?.full_name || 'Unknown',
        };
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

      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', thisMonth);

      const totalRevenue = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const totalExpenses = monthlyExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

      return {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
      };
    },
  });

  // Mutations
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

  const addExpenseMutation = useMutation({
    mutationFn: async (expenseData: typeof newExpense) => {
      const { error } = await supabase.from('expenses').insert({
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category as Database['public']['Enums']['expense_category'],
        payment_method: expenseData.payment_method as Database['public']['Enums']['payment_method'],
        expense_date: expenseData.expense_date,
        notes: expenseData.notes,
        recorded_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      setIsAddExpenseDialogOpen(false);
      setNewExpense({
        description: '',
        amount: '',
        category: 'office_supplies',
        payment_method: 'cash',
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
      toast({ title: 'Expense recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording expense', description: error.message, variant: 'destructive' });
    },
  });

  const generatePayrollMutation = useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const periodStart = startOfMonth(new Date(year, month - 1));
      const periodEnd = endOfMonth(new Date(year, month - 1));

      // Check if payroll already exists for this period
      const { data: existingPayroll } = await supabase
        .from('payroll')
        .select('employee_id')
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0]);

      const existingEmployeeIds = existingPayroll?.map(p => p.employee_id) || [];

      // Get all employees with salaries
      const employeesToProcess = employeesWithSalaries?.filter(
        emp => !existingEmployeeIds.includes(emp.employee_id)
      ) || [];

      const payrollRecords = [];

      for (const employee of employeesToProcess) {
        // Calculate base salary for the period
        let baseSalary = employee.amount;
        if (employee.payment_period === 'daily') {
          baseSalary = employee.amount * 30; // Approximate monthly
        } else if (employee.payment_period === 'weekly') {
          baseSalary = employee.amount * 4; // Approximate monthly
        }

        // Get approved advances for this period
        const { data: advances } = await supabase
          .from('salary_advances')
          .select('amount')
          .eq('employee_id', employee.employee_id)
          .eq('status', 'approved')
          .gte('created_at', periodStart.toISOString())
          .lte('created_at', periodEnd.toISOString());

        const advancesDeducted = advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;
        const totalPayable = baseSalary - advancesDeducted;

        payrollRecords.push({
          employee_id: employee.employee_id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          base_salary: baseSalary,
          advances_deducted: advancesDeducted,
          total_payable: Math.max(0, totalPayable), // Ensure non-negative
          status: 'pending',
          processed_by: (await supabase.auth.getUser()).data.user?.id,
        });
      }

      if (payrollRecords.length > 0) {
        const { error } = await supabase.from('payroll').insert(payrollRecords);
        if (error) throw error;
      }

      return payrollRecords.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setIsPayrollDialogOpen(false);
      toast({ title: `Payroll generated for ${count} employees` });
    },
    onError: (error) => {
      toast({ title: 'Error generating payroll', description: error.message, variant: 'destructive' });
    },
  });

  const exportPayrollMutation = useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const periodStart = startOfMonth(new Date(year, month - 1)).toISOString().split('T')[0];
      const periodEnd = endOfMonth(new Date(year, month - 1)).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd);

      if (error) throw error;

      const employeeIds = data?.map(p => p.employee_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', employeeIds);

      const exportData = data?.map(payroll => {
        const profile = profiles?.find(p => p.user_id === payroll.employee_id);
        return {
          'Employee Name': profile?.full_name || 'Unknown',
          'Period Start': payroll.period_start,
          'Period End': payroll.period_end,
          'Base Salary': payroll.base_salary,
          'Advances Deducted': payroll.advances_deducted,
          'Total Payable': payroll.total_payable,
          'Status': payroll.status,
        };
      }) || [];

      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll-${year}-${month.toString().padStart(2, '0')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({ title: 'Payroll exported successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error exporting payroll', description: error.message, variant: 'destructive' });
    },
  });

  const filteredPayments = payments?.filter(p =>
    p.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpenses = expenses?.filter(e =>
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayroll = payroll?.filter(p =>
    p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { paginatedData: paginatedPayments, currentPage: paymentsPage, totalPages: paymentsTotalPages, goToPage: goToPaymentsPage, nextPage: nextPaymentsPage, previousPage: prevPaymentsPage, hasNextPage: hasNextPaymentsPage, hasPreviousPage: hasPrevPaymentsPage, totalItems: totalPayments } = usePagination({
    data: filteredPayments || [],
    itemsPerPage: 10,
  });

  const { paginatedData: paginatedExpenses, currentPage: expensesPage, totalPages: expensesTotalPages, goToPage: goToExpensesPage, nextPage: nextExpensesPage, previousPage: prevExpensesPage, hasNextPage: hasNextExpensesPage, hasPreviousPage: hasPrevExpensesPage, totalItems: totalExpenses } = usePagination({
    data: filteredExpenses || [],
    itemsPerPage: 10,
  });

  const { paginatedData: paginatedPayroll, currentPage: payrollPage, totalPages: payrollTotalPages, goToPage: goToPayrollPage, nextPage: nextPayrollPage, previousPage: prevPayrollPage, hasNextPage: hasNextPayrollPage, hasPreviousPage: hasPrevPayrollPage, totalItems: totalPayroll } = usePagination({
    data: filteredPayroll || [],
    itemsPerPage: 10,
  });

  const getExpenseCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      office_supplies: 'Office Supplies',
      utilities: 'Utilities',
      rent: 'Rent',
      equipment: 'Equipment',
      software: 'Software',
      training: 'Training',
      marketing: 'Marketing',
      maintenance: 'Maintenance',
      travel: 'Travel',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      check: 'Check',
      credit_card: 'Credit Card',
      other: 'Other',
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Manage payments, expenses, and payroll</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financeStats?.totalRevenue?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financeStats?.totalExpenses?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financeStats?.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${financeStats?.netIncome?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <Button onClick={() => setIsAddPaymentDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No payments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.student_name}</TableCell>
                          <TableCell className="font-mono">{payment.registration_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_type}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">${payment.amount}</TableCell>
                          <TableCell>{getPaymentMethodLabel(payment.payment_method || '')}</TableCell>
                          <TableCell>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <DataTablePagination
            currentPage={paymentsPage}
            totalPages={paymentsTotalPages}
            onPageChange={goToPaymentsPage}
            onNext={nextPaymentsPage}
            onPrevious={prevPaymentsPage}
            hasNext={hasNextPaymentsPage}
            hasPrevious={hasPrevPaymentsPage}
            totalItems={totalPayments}
            itemsPerPage={10}
          />
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <Button onClick={() => setIsAddExpenseDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Record Expense
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {expensesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No expenses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getExpenseCategoryLabel(expense.category)}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">${expense.amount}</TableCell>
                          <TableCell>{getPaymentMethodLabel(expense.payment_method)}</TableCell>
                          <TableCell>{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <DataTablePagination
            currentPage={expensesPage}
            totalPages={expensesTotalPages}
            onPageChange={goToExpensesPage}
            onNext={nextExpensesPage}
            onPrevious={prevExpensesPage}
            hasNext={hasNextExpensesPage}
            hasPrevious={hasPrevExpensesPage}
            totalItems={totalExpenses}
            itemsPerPage={10}
          />
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search payroll..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPayrollDialogOpen(true)}>
                <Calculator className="w-4 h-4 mr-2" />
                Generate Payroll
              </Button>
              <Button
                variant="outline"
                onClick={() => exportPayrollMutation.mutate(selectedPayrollPeriod)}
                disabled={exportPayrollMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Payroll
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {payrollLoading ? (
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Advances Deducted</TableHead>
                      <TableHead>Total Payable</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayroll.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No payroll records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPayroll.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.employee_name}</TableCell>
                          <TableCell>
                            {format(new Date(record.period_start), 'MMM dd')} - {format(new Date(record.period_end), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-medium">${record.base_salary}</TableCell>
                          <TableCell className="font-medium">${record.advances_deducted}</TableCell>
                          <TableCell className="font-medium font-bold">${record.total_payable}</TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'paid' ? 'default' :
                              record.status === 'processed' ? 'secondary' :
                              'outline'
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <DataTablePagination
            currentPage={payrollPage}
            totalPages={payrollTotalPages}
            onPageChange={goToPayrollPage}
            onNext={nextPayrollPage}
            onPrevious={prevPayrollPage}
            hasNext={hasNextPayrollPage}
            hasPrevious={hasPrevPayrollPage}
            totalItems={totalPayroll}
            itemsPerPage={10}
          />
        </TabsContent>
      </Tabs>

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
                  {studentsList?.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} ({student.registration_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="registration">Registration Fee</SelectItem>
                    <SelectItem value="tuition">Tuition Fee</SelectItem>
                    <SelectItem value="materials">Materials</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
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

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Expense description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office_supplies">Office Supplies</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={newExpense.payment_method}
                  onValueChange={(value) => setNewExpense({ ...newExpense, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense_date">Expense Date</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={newExpense.expense_date}
                  onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addExpenseMutation.mutate(newExpense)}
              disabled={!newExpense.description || !newExpense.amount || addExpenseMutation.isPending}
            >
              {addExpenseMutation.isPending ? 'Recording...' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Payroll Dialog */}
      <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate payroll for all employees with salaries. This will calculate base salary and deduct approved advances for the selected period.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={selectedPayrollPeriod.month.toString()}
                  onValueChange={(value) => setSelectedPayrollPeriod({ ...selectedPayrollPeriod, month: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={selectedPayrollPeriod.year.toString()}
                  onValueChange={(value) => setSelectedPayrollPeriod({ ...selectedPayrollPeriod, year: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Payroll Calculation:</h4>
              <ul className="text-sm space-y-1">
                <li>• Base salary based on employee salary records</li>
                <li>• Automatic deduction of approved advances</li>
                <li>• Only generates for employees without existing payroll for the period</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => generatePayrollMutation.mutate(selectedPayrollPeriod)}
              disabled={generatePayrollMutation.isPending}
            >
              {generatePayrollMutation.isPending ? 'Generating...' : 'Generate Payroll'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancesPage;
