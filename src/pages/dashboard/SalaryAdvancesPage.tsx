import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Users,
  FileText,
  Eye,
  Edit,
  Download,
  Wallet,
  Building,
  Mail,
  Phone,
  User
} from 'lucide-react';

interface SalaryAdvance {
  id: string;
  employee_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comment: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string;
  employee_email?: string;
}

interface Trainer {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  monthly_salary?: number;
  classes?: Array<{
    name: string;
    level: string;
  }>;
}

interface PayrollItem {
  trainer_id: string;
  trainer_name: string;
  base_salary: number;
  approved_advances: number;
  net_salary: number;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'processed';
}

const SalaryAdvancesPage = () => {
  const { user, primaryRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedRequest, setSelectedRequest] = useState<SalaryAdvance | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approved' | 'rejected' | null>(null);
  const [activeTab, setActiveTab] = useState('advances');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [adjustedAmount, setAdjustedAmount] = useState('');

  // Check if user can manage salary (admin)
  const canManageSalary = primaryRole === 'admin';

  // Fetch salary advance requests
  const { data: advances, isLoading: advancesLoading } = useQuery({
    queryKey: ['salary-advances'],
    queryFn: async () => {
      if (!canManageSalary) return [];

      const { data, error } = await supabase
        .from('salary_advances')
        .select(`
          id,
          employee_id,
          amount,
          reason,
          status,
          review_comment,
          reviewed_by,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch employee details
      const employeeIds = data?.map(a => a.employee_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', employeeIds);

      return data?.map(advance => ({
        ...advance,
        employee_name: profiles?.find(p => p.user_id === advance.employee_id)?.full_name || 'Unknown',
        employee_email: profiles?.find(p => p.user_id === advance.employee_id)?.email || 'Unknown'
      })) || [];
    },
    enabled: canManageSalary,
  });

  // Fetch trainers with basic details
  const { data: trainers, isLoading: trainersLoading } = useQuery({
    queryKey: ['trainers-details'],
    queryFn: async () => {
      if (!canManageSalary) return [];

      const { data: trainerData, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email,
          phone
        `)
        .eq('role', 'trainer');

      if (error) throw error;

      // Fetch classes for each trainer
      const trainersWithClasses = await Promise.all(
        trainerData?.map(async (trainer) => {
          const { data: classes } = await supabase
            .from('classes')
            .select('name, level')
            .eq('trainer_id', trainer.user_id)
            .eq('is_active', true);

          return {
            ...trainer,
            classes: classes || [],
            monthly_salary: 500000, // Default salary for demo
            role: 'trainer' // Add role property
          };
        }) || []
      );

      return trainersWithClasses;
    },
    enabled: canManageSalary,
  });

  // Generate payroll data
  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll-data', selectedMonth],
    queryFn: async () => {
      if (!canManageSalary) return [];

      const monthStart = startOfMonth(new Date(selectedMonth));
      const monthEnd = endOfMonth(new Date(selectedMonth));

      // Get approved advances for the month
      const { data: approvedAdvances } = await supabase
        .from('salary_advances')
        .select('employee_id, amount')
        .eq('status', 'approved')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // Combine data for each trainer
      const payrollItems: PayrollItem[] = trainers?.map(trainer => {
        const advances = approvedAdvances?.filter(a => a.employee_id === trainer.user_id) || [];
        const totalAdvances = advances.reduce((sum, a) => sum + parseFloat(a.amount.toString()), 0);
        const baseSalary = trainer.monthly_salary || 500000;
        const netSalary = baseSalary - totalAdvances;

        return {
          trainer_id: trainer.user_id,
          trainer_name: trainer.full_name,
          base_salary: baseSalary,
          approved_advances: totalAdvances,
          net_salary: netSalary,
          email: trainer.email || '',
          phone: trainer.phone || '',
          status: 'pending'
        };
      }) || [];

      return payrollItems;
    },
    enabled: canManageSalary && !!trainers,
  });

  // Approve/Reject advance request
  const reviewAdvanceMutation = useMutation({
    mutationFn: async ({ id, status, comment, amount }: { id: string; status: 'approved' | 'rejected'; comment: string; amount?: number }) => {
      if (!canManageSalary) throw new Error('Permission denied');

      const updateData: any = {
        status,
        review_comment: comment,
        reviewed_by: user?.id,
        updated_at: new Date().toISOString()
      };

      // If approved with adjusted amount, update the amount
      if (status === 'approved' && amount) {
        updateData.amount = amount;
      }

      const { error } = await supabase
        .from('salary_advances')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-data'] });
      toast({ title: `Request ${currentAction}d successfully` });
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setReviewComment('');
      setAdjustedAmount('');
    },
    onError: (error) => {
      toast({ title: 'Error processing request', description: error.message, variant: 'destructive' });
    },
  });

  const handleReview = (request: SalaryAdvance, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setCurrentAction(action);
    setActionDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedRequest) return;

    const amount = currentAction === 'approved' && adjustedAmount ? parseFloat(adjustedAmount) : undefined;
    reviewAdvanceMutation.mutate({
      id: selectedRequest.id,
      status: currentAction!,
      comment: reviewComment,
      amount
    });
  };

  const exportPayroll = () => {
    if (!payrollData || payrollData.length === 0) {
      toast({ title: 'No payroll data to export', variant: 'destructive' });
      return;
    }

    const csvContent = [
      'Trainer Name,Email,Phone,Base Salary,Approved Advances,Net Salary,Status',
      ...payrollData.map(item => [
        item.trainer_name,
        item.email,
        item.phone,
        item.base_salary,
        item.approved_advances,
        item.net_salary,
        item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Payroll exported successfully' });
  };

  if (!canManageSalary) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to manage salary and payroll. Only admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">Salary & Payroll Management</h1>
            <p className="text-muted-foreground">
              Manage salary advances, approve requests, and process payroll
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'payroll' && (
            <Button onClick={exportPayroll} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Payroll
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="advances">Salary Advances</TabsTrigger>
          <TabsTrigger value="trainers">Trainer Details</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Salary Advances Tab */}
        <TabsContent value="advances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Salary Advance Requests
              </CardTitle>
              <CardDescription>
                Review and manage salary advance requests from employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {advancesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : advances && advances.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {advances.map((advance) => (
                        <TableRow key={advance.id}>
                          <TableCell className="font-medium">{advance.employee_name}</TableCell>
                          <TableCell>{advance.employee_email}</TableCell>
                          <TableCell>RWF {parseFloat(advance.amount.toString()).toLocaleString()}</TableCell>
                          <TableCell className="max-w-xs truncate">{advance.reason}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={advance.status === 'approved' ? 'default' : 
                                      advance.status === 'rejected' ? 'destructive' : 'secondary'}
                            >
                              {advance.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(advance.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {advance.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(advance, 'approved')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReview(advance, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No salary advance requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trainer Details Tab */}
        <TabsContent value="trainers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Trainer Payment Information
              </CardTitle>
              <CardDescription>
                View trainer payment channels and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainersLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : trainers && trainers.length > 0 ? (
                <div className="space-y-4">
                  {trainers.map((trainer) => (
                    <Card key={trainer.user_id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{trainer.full_name}</h3>
                            <Badge variant="outline">{trainer.role}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p><span className="font-medium">Email:</span> {trainer.email}</p>
                              <p><span className="font-medium">Phone:</span> {trainer.phone}</p>
                              <p><span className="font-medium">Monthly Salary:</span> RWF {trainer.monthly_salary?.toLocaleString() || 0}</p>
                            </div>
                            <div className="space-y-1">
                              <p><span className="font-medium">Payment Channel:</span> Bank Transfer</p>
                              <p><span className="font-medium">Bank:</span> Bank of Kigali</p>
                              <p><span className="font-medium">Account:</span> To be provided</p>
                            </div>
                          </div>
                          {trainer.classes && trainer.classes.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-1">Classes:</p>
                              <div className="flex flex-wrap gap-1">
                                {trainer.classes.map((cls, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {cls.name} ({cls.level})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No trainers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Monthly Payroll
              </CardTitle>
              <CardDescription>
                Process and manage monthly payroll with advances and deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <Label>Select Month</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-fit"
                />
              </div>

              {payrollLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : payrollData && payrollData.length > 0 ? (
                <div className="space-y-4">
                  {/* Payroll Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{payrollData.length}</div>
                        <p className="text-sm text-muted-foreground">Trainers</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          RWF {payrollData.reduce((sum, item) => sum + item.base_salary, 0).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Base Salary</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-red-600">
                          RWF {payrollData.reduce((sum, item) => sum + item.approved_advances, 0).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Advances</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-green-600">
                          RWF {payrollData.reduce((sum, item) => sum + item.net_salary, 0).toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">Net Payroll</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Payroll Details Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Trainer</TableHead>
                          <TableHead>Base Salary</TableHead>
                          <TableHead>Advances</TableHead>
                          <TableHead>Net Salary</TableHead>
                          <TableHead>Payment Channel</TableHead>
                          <TableHead>Bank Account</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.map((item) => (
                          <TableRow key={item.trainer_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.trainer_name}</p>
                                <p className="text-sm text-muted-foreground">{item.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>RWF {item.base_salary.toLocaleString()}</TableCell>
                            <TableCell className="text-red-600">
                              RWF {item.approved_advances.toLocaleString()}
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              RWF {item.net_salary.toLocaleString()}
                            </TableCell>
                            <TableCell>Bank Transfer</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>Bank of Kigali</p>
                                <p className="font-mono">Pending</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'processed' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No payroll data found for selected month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'approved' ? 'Approve Salary Advance' : 'Reject Salary Advance'}
            </DialogTitle>
            <DialogDescription>
              {currentAction === 'approved' && 'Approve this salary advance request. You can adjust the amount if needed.'}
              {currentAction === 'rejected' && 'Reject this salary advance request with a reason.'}
            </DialogDescription>
          </DialogHeader>
          
          {currentAction === 'approved' && selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Original Amount</Label>
                <p className="text-lg font-semibold">RWF {parseFloat(selectedRequest.amount.toString()).toLocaleString()}</p>
              </div>
              <div>
                <Label>Adjusted Amount (Optional)</Label>
                <Input
                  type="number"
                  placeholder="Leave empty to use original amount"
                  value={adjustedAmount}
                  onChange={(e) => setAdjustedAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Review Comment</Label>
                <Textarea
                  placeholder="Add any comments about this approval..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>
          )}

          {currentAction === 'rejected' && (
            <div className="space-y-4">
              <div>
                <Label>Rejection Reason</Label>
                <Textarea
                  placeholder="Please provide a reason for rejecting this request..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              {currentAction === 'approved' && 'Approve'}
              {currentAction === 'rejected' && 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryAdvancesPage;
