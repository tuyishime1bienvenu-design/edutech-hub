import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const LeaveRequestsPage: React.FC = () => {
  const { user, primaryRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [reason, setReason] = useState('');
  const [leaveDate, setLeaveDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().slice(0,10));

  const { data: requests, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const q = supabase.from('leave_requests').select('id, trainer_id, reason, leave_date, return_date, status, reviewed_by, review_comment, created_at').order('created_at', { ascending: false });
      const { data: reqData, error } = await q;
      if (error) throw error;

      const trainerIds = Array.from(new Set((reqData || []).map((r: any) => r.trainer_id).filter(Boolean)));
      let profilesMap: Record<string, string> = {};
      if (trainerIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', trainerIds as any[]);
        if (pErr) throw pErr;
        (profiles || []).forEach((p: any) => {
          const name = p.full_name || p.email || p.user_id;
          profilesMap[p.user_id] = name;
        });
      }

      return (reqData || []).map((r: any) => ({ ...r, trainer_name: profilesMap[r.trainer_id] || r.trainer_id }));
    },
    enabled: true,
  });

  const visibleRequests = useMemo(() => {
    if (!requests) return [];
    if (primaryRole === 'trainer' && user?.id) return requests.filter((r: any) => r.trainer_id === user.id);
    return requests;
  }, [requests, primaryRole, user]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (primaryRole !== 'trainer') throw new Error('Only trainers can request leave');
      if (!reason.trim()) throw new Error('Enter reason');
      const { error } = await supabase.from('leave_requests').insert({
        trainer_id: user?.id,
        reason,
        leave_date: leaveDate,
        return_date: returnDate,
        status: 'pending' as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setReason('');
      setLeaveDate(new Date().toISOString().slice(0,10));
      setReturnDate(new Date().toISOString().slice(0,10));
      toast({ title: 'Leave request submitted' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to submit', variant: 'destructive' });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'pending' | 'rejected' }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('leave_requests').update({ status, reviewed_by: user.id }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast({ title: 'Status updated' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message || 'Failed to update', variant: 'destructive' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">Trainers can request leave; admin/secretary can review and approve.</p>
        </div>
      </div>

      {primaryRole === 'trainer' && (
        <Card>
          <CardHeader><CardTitle>Request Leave</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm">Leave date</label>
                <Input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Return date</label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>{createMutation.isPending ? 'Sending...' : 'Submit Request'}</Button>
              </div>
              <div className="md:col-span-3">
                <label className="text-sm">Reason</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Requests</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-2 py-2">Trainer</th>
                  <th className="px-2 py-2">Leave</th>
                  <th className="px-2 py-2">Return</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-3">{r.trainer_name || r.trainer_id}</td>
                    <td className="px-2 py-3">{new Date(r.leave_date).toLocaleDateString()}</td>
                    <td className="px-2 py-3">{new Date(r.return_date).toLocaleDateString()}</td>
                    <td className="px-2 py-3">{r.reason}</td>
                    <td className="px-2 py-3">
                      <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      {primaryRole !== 'trainer' && r.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => reviewMutation.mutate({ id: r.id, status: 'approved' })}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => reviewMutation.mutate({ id: r.id, status: 'rejected' })}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveRequestsPage;