import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  CheckCircle, XCircle, Send, Clock, AlertCircle, DollarSign, Users,
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
  employee_name?: string;
  employee_email?: string;
}

const SalaryAdvancesPage = () => {
  const { roles } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<SalaryAdvance | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'forward' | 'approve' | 'reject' | null>(null);

  const isAdmin = roles.includes('admin');
  const isFinance = roles.includes('finance');

  // Fetch salary advance requests with employee details
  const { data: advances, isLoading } = useQuery({
    queryKey: ['salary-advances-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_advances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch employee profiles
      const employeeIds = [...new Set(data?.map(a => a.employee_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', employeeIds);

      return data?.map(advance => {
        const profile = profiles?.find(p => p.user_id === advance.employee_id);
        return {
          ...advance,
          employee_name: profile?.full_name || 'Unknown',
          employee_email: profile?.email || '',
        };
      }) as SalaryAdvance[];
    },
  });

  // Forward to admin mutation (for finance)
  const forwardMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('salary_advances')
        .update({
          forwarded_to_admin: true,
          forwarded_at: new Date().toISOString(),
          forwarded_by: user.user.id,
          review_comment: comment || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request forwarded to admin for approval');
      queryClient.invalidateQueries({ queryKey: ['salary-advances-management'] });
      closeDialog();
    },
    onError: (error) => {
      toast.error('Failed to forward request: ' + error.message);
    },
  });

  // Approve/Reject mutation (for admin)
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: 'approved' | 'rejected'; comment: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('salary_advances')
        .update({
          status,
          review_comment: comment || null,
          reviewed_by: user.user.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.status === 'approved' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['salary-advances-management'] });
      closeDialog();
    },
    onError: (error) => {
      toast.error('Failed to update request: ' + error.message);
    },
  });

  const openActionDialog = (request: SalaryAdvance, action: 'forward' | 'approve' | 'reject') => {
    setSelectedRequest(request);
    setCurrentAction(action);
    setReviewComment('');
    setActionDialogOpen(true);
  };

  const closeDialog = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setCurrentAction(null);
    setReviewComment('');
  };

  const handleAction = () => {
    if (!selectedRequest || !currentAction) return;

    if (currentAction === 'forward') {
      forwardMutation.mutate({ id: selectedRequest.id, comment: reviewComment });
    } else {
      reviewMutation.mutate({
        id: selectedRequest.id,
        status: currentAction === 'approve' ? 'approved' : 'rejected',
        comment: reviewComment,
      });
    }
  };

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

  // Filter advances based on role and tab
  const pendingForFinance = advances?.filter(a => a.status === 'pending' && !a.forwarded_to_admin) || [];
  const forwardedToAdmin = advances?.filter(a => a.status === 'pending' && a.forwarded_to_admin) || [];
  const processed = advances?.filter(a => a.status !== 'pending') || [];

  // Stats
  const stats = {
    total: advances?.length || 0,
    pendingReview: pendingForFinance.length,
    pendingApproval: forwardedToAdmin.length,
    approved: advances?.filter(a => a.status === 'approved').length || 0,
    rejected: advances?.filter(a => a.status === 'rejected').length || 0,
    totalAmount: advances?.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderRequestsTable = (requests: SalaryAdvance[], showActions: boolean, actionType: 'finance' | 'admin') => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.employee_name}</p>
                    <p className="text-sm text-muted-foreground">{request.employee_email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(request.amount)}</TableCell>
                <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                <TableCell>{getStatusBadge(request)}</TableCell>
                <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {actionType === 'finance' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openActionDialog(request, 'forward')}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Forward to Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(request, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {actionType === 'admin' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openActionDialog(request, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(request, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Salary Advance Requests</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Review and approve salary advance requests' : 'Review requests and forward to admin for approval'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting finance review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Forwarded to admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different request states */}
      <Tabs defaultValue={isAdmin ? "pending-approval" : "pending-review"}>
        <TabsList>
          {isFinance && (
            <TabsTrigger value="pending-review" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Review ({pendingForFinance.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="pending-approval" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Pending Admin Approval ({forwardedToAdmin.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Processed ({processed.length})
          </TabsTrigger>
        </TabsList>

        {isFinance && (
          <TabsContent value="pending-review" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Requests Awaiting Finance Review</CardTitle>
                <CardDescription>
                  Review these requests and forward eligible ones to admin for final approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderRequestsTable(pendingForFinance, true, 'finance')}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="pending-approval" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Requests Pending Admin Approval</CardTitle>
              <CardDescription>
                {isAdmin 
                  ? 'These requests have been reviewed by finance and await your approval'
                  : 'These requests have been forwarded and are awaiting admin decision'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(forwardedToAdmin, isAdmin, 'admin')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Processed Requests</CardTitle>
              <CardDescription>History of approved and rejected requests</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(processed, false, 'admin')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'forward' && 'Forward Request to Admin'}
              {currentAction === 'approve' && 'Approve Request'}
              {currentAction === 'reject' && 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="mt-2 space-y-1 text-foreground">
                  <p><strong>Employee:</strong> {selectedRequest.employee_name}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedRequest.amount)}</p>
                  <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {currentAction === 'forward' ? 'Notes for Admin (optional)' : 'Review Comment (optional)'}
              </Label>
              <Textarea
                id="comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  currentAction === 'forward'
                    ? 'Add any notes for the admin...'
                    : 'Add a comment about your decision...'
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={forwardMutation.isPending || reviewMutation.isPending}
              className={
                currentAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                currentAction === 'reject' ? 'bg-destructive hover:bg-destructive/90' :
                ''
              }
            >
              {(forwardMutation.isPending || reviewMutation.isPending) ? 'Processing...' : 
                currentAction === 'forward' ? 'Forward to Admin' :
                currentAction === 'approve' ? 'Approve Request' :
                'Reject Request'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryAdvancesPage;
