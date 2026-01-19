import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RequestAdvanceModalProps {
  salary: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export const RequestAdvanceModal = ({ salary, open, onOpenChange, showTrigger = true }: RequestAdvanceModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const modalOpen = isControlled ? open : internalOpen;
  const setModalOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const requestAdvanceMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Use salary_advances table which exists in the schema
      const { error } = await supabase
        .from('salary_advances')
        .insert({
          employee_id: user.user.id,
          amount: amount,
          reason,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Advance request submitted successfully');
      setModalOpen(false);
      setAmount('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['salary-advances'] });
    },
    onError: (error) => {
      toast.error('Failed to submit advance request: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (salary && numAmount > salary.amount) {
      toast.error('Requested amount cannot exceed your salary');
      return;
    }
    requestAdvanceMutation.mutate({ amount: numAmount, reason });
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button>Request Advance</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Salary Advance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (RWF)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={salary?.amount}
              required
            />
            {salary && (
              <p className="text-sm text-gray-600 mt-1">
                Maximum: RWF {salary.amount?.toLocaleString() || 0}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for the advance request"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={requestAdvanceMutation.isPending}>
              {requestAdvanceMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
