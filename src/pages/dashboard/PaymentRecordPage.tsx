import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StudentSearchSelect } from '@/components/ui/StudentSearchSelect';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  User, 
  Building,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentFormData {
  student_id: string;
  amount: number;
  payment_type: string;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'online';
  status: 'pending' | 'paid' | 'partial';
  notes?: string;
}

const PaymentRecordPage = () => {
  const { user, primaryRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState<PaymentFormData>({
    student_id: '',
    amount: 0,
    payment_type: 'Tuition Fee',
    payment_method: 'cash',
    status: 'paid',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user can record payments (admin, secretary, finance)
  const canRecordPayments = primaryRole === 'admin' || primaryRole === 'secretary';

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      if (!canRecordPayments) {
        throw new Error('You do not have permission to record payments');
      }

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          amount: parseFloat(paymentData.amount.toString()),
          recorded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Payment recorded successfully' });
      // Reset form
      setFormData({
        student_id: '',
        amount: 0,
        payment_type: 'Tuition Fee',
        payment_method: 'cash',
        status: 'paid',
        notes: '',
      });
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Error recording payment', 
        description: error.message, 
        variant: 'destructive' 
      });
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id) {
      toast({ title: 'Please select a student', variant: 'destructive' });
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    recordPaymentMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!canRecordPayments) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to record payments. Only admins and secretaries can record payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">
            Record student payments and manage financial transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Student Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="student">Student *</Label>
                    <StudentSearchSelect
                      value={formData.student_id}
                      onValueChange={(value) => handleInputChange('student_id', value)}
                      placeholder="Search student by name or registration number..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Type */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_type">Payment Type</Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value: string) => 
                          handleInputChange('payment_type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
                          <SelectItem value="Registration Fee">Registration Fee</SelectItem>
                          <SelectItem value="Material Fee">Material Fee</SelectItem>
                          <SelectItem value="Exam Fee">Exam Fee</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (RWF) *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount || ''}
                        onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">Payment Method</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'online') => 
                          handleInputChange('payment_method', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="online">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'pending' | 'paid' | 'partial') => 
                          handleInputChange('status', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Payment notes or description..."
                      value={formData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.student_id || !formData.amount}
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Record Payment
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Student Search</p>
                    <p className="text-xs text-muted-foreground">
                      Type student name or registration number
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-xs text-muted-foreground">
                      Enter payment amount in RWF
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Payment Date</p>
                    <p className="text-xs text-muted-foreground">
                      When the payment was made
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cash</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bank Transfer</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mobile Money</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Check</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Online</span>
                  <Badge variant="outline">Available</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRecordPage;
