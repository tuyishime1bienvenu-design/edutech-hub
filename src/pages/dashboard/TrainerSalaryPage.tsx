import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  DollarSign, 
  Send, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Wallet,
  TrendingUp
} from 'lucide-react';

interface SalaryAdvance {
  id: string;
  employee_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  review_comment: string | null;
  reviewed_by: string | null;
  forwarded_to_admin: boolean;
  forwarded_at: string | null;
  forwarded_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Salary {
  id: string;
  employee_id: string;
  amount: number;
  payment_period: string;
  is_paid: boolean;
  paid_by: string | null;
  payment_date: string | null;
}

const TrainerSalaryPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [newRequest, setNewRequest] = useState({
    amount: '',
    reason: '',
  });

  // Fetch trainer's salary information
  const { data: salary, isLoading: salaryLoading } = useQuery({
    queryKey: ['trainer-salary', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Salary;
    },
    enabled: !!user?.id,
  });

  // Fetch trainer's advance requests
  const { data: advances, isLoading: advancesLoading } = useQuery({
    queryKey: ['trainer-advances', user?.id],
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

  // Calculate approved advances total
  const approvedAdvancesTotal = advances?.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0) || 0;
  const pendingAdvancesTotal = advances?.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0) || 0;
  
  // Calculate remaining salary
  const baseSalary = salary?.amount || 0;
  const remainingSalary = Math.max(0, baseSalary - approvedAdvancesTotal);

  // Submit new advance request
  const submitRequestMutation = useMutation({
    mutationFn: async (requestData: typeof newRequest) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('salary_advances').insert({
        employee_id: user.id,
        amount: parseFloat(requestData.amount),
        reason: requestData.reason,
        status: 'pending',
        forwarded_to_admin: false,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-advances'] });
      setIsRequestDialogOpen(false);
      setNewRequest({ amount: '', reason: '' });
      toast({ title: 'Advance request submitted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error submitting request', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
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
    if (advance.forwarded_to_admin) {
      return <Badge className="bg-blue-500">Pending Admin Approval</Badge>;
    }
    return <Badge variant="secondary">Pending Review</Badge>;
  };

  const handleSubmitRequest = () => {
    if (!newRequest.amount || !newRequest.reason) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const amount = parseFloat(newRequest.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    if (amount > remainingSalary) {
      toast({ 
        title: 'Amount exceeds remaining salary', 
        description: `Maximum available: ${formatCurrency(remainingSalary)}`,
        variant: 'destructive' 
      });
      return;
    }

    submitRequestMutation.mutate(newRequest);
  };

  if (salaryLoading || advancesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Salary & Advances</h1>
          <p className="text-muted-foreground">
            Manage your salary information and advance requests
          </p>
        </div>
        <Button onClick={() => setIsRequestDialogOpen(true)}>
          <Send className="w-4 h-4 mr-2" />
          Request Advance
        </Button>
      </div>

      {/* Salary Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Base Salary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {showSalary ? formatCurrency(baseSalary) : '••••••'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSalary(!showSalary)}
              >
                {showSalary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {salary?.payment_period || 'Current period'}
            </p>
          </CardContent>
        </Card>

        {/* Remaining Salary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Advance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {showSalary ? formatCurrency(remainingSalary) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              After approved advances
            </p>
          </CardContent>
        </Card>

        {/* Approved Advances Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Advances</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {showSalary ? formatCurrency(approvedAdvancesTotal) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              {advances?.filter(a => a.status === 'approved').length || 0} requests
            </p>
          </CardContent>
        </Card>

        {/* Pending Advances Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Advances</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {showSalary ? formatCurrency(pendingAdvancesTotal) : '••••••'}
            </div>
            <p className="text-xs text-muted-foreground">
              {advances?.filter(a => a.status === 'pending').length || 0} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Advance Requests History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Advance Request History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted Date</TableHead>
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
                        {showSalary ? formatCurrency(advance.amount) : '••••••'}
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
        </CardContent>
      </Card>

      {/* Request Advance Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Salary Advance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={newRequest.amount}
                onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
                placeholder="Enter amount"
                min="1"
                max={remainingSalary}
              />
              {showSalary && (
                <p className="text-xs text-muted-foreground">
                  Maximum available: {formatCurrency(remainingSalary)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                placeholder="Explain why you need this advance..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={submitRequestMutation.isPending}
            >
              {submitRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerSalaryPage;
