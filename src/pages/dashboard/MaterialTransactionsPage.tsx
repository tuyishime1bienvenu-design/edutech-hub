import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  ArrowUpDown, 
  Plus, 
  Package, 
  Users, 
  Calendar,
  TrendingUp,
  History,
  CheckCircle,
  AlertCircle,
  Undo
} from 'lucide-react';

interface MaterialItem {
  id: string;
  name: string;
  unique_code?: string;
  category: string;
  current_quantity: number;
  minimum_quantity: number;
  unit: string;
}

interface MaterialTransaction {
  id: string;
  material_id: string;
  transaction_type: 'issue' | 'return';
  quantity: number;
  recipient_name: string;
  recipient_id: string;
  purpose: string;
  notes: string;
  recorded_by: string;
  transaction_date: string;
  is_returned: boolean;
  return_date: string;
  return_notes: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
}

const MaterialTransactionsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<MaterialTransaction | null>(null);

  const [formData, setFormData] = useState({
    material_id: '',
    transaction_type: 'issue' as 'issue' | 'return',
    quantity: 0,
    recipient_id: '',
    recipient_name: '',
    purpose: '',
    notes: '',
  });

  const [returnData, setReturnData] = useState({
    return_notes: '',
  });

  // Fetch data
  const { data: materials } = useQuery({
    queryKey: ['materials-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials_inventory')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as MaterialItem[];
    },
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['material-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data as MaterialTransaction[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Mutations
  const recordTransactionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('material_transactions').insert({
        ...data,
        recorded_by: user?.id,
        transaction_date: new Date().toISOString(),
      });
      if (error) throw error;

      // Update material quantity
      const material = materials?.find(m => m.id === data.material_id);
      if (material) {
        const newQuantity = data.transaction_type === 'issue' 
          ? material.current_quantity - data.quantity
          : material.current_quantity + data.quantity;
        
        await supabase.from('materials_inventory')
          .update({ current_quantity: newQuantity })
          .eq('id', data.material_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Transaction recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording transaction', description: error.message, variant: 'destructive' });
    },
  });

  const returnItemMutation = useMutation({
    mutationFn: async ({ transactionId, returnNotes }: { transactionId: string; returnNotes: string }) => {
      const transaction = transactions?.find(t => t.id === transactionId);
      if (!transaction) throw new Error('Transaction not found');

      // Update transaction
      const { error } = await supabase
        .from('material_transactions')
        .update({
          is_returned: true,
          return_date: new Date().toISOString(),
          return_notes: returnNotes,
        })
        .eq('id', transactionId);

      if (error) throw error;

      // Update material quantity
      const material = materials?.find(m => m.id === transaction.material_id);
      if (material) {
        const newQuantity = material.current_quantity + transaction.quantity;
        await supabase.from('materials_inventory')
          .update({ current_quantity: newQuantity })
          .eq('id', transaction.material_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      setReturnDialogOpen(false);
      setSelectedTransaction(null);
      setReturnData({ return_notes: '' });
      toast({ title: 'Item returned successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error returning item', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      material_id: '',
      transaction_type: 'issue',
      quantity: 0,
      recipient_id: '',
      recipient_name: '',
      purpose: '',
      notes: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.material_id || !formData.recipient_id || formData.quantity <= 0) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const material = materials?.find(m => m.id === formData.material_id);
    if (material && formData.transaction_type === 'issue' && formData.quantity > material.current_quantity) {
      toast({ 
        title: 'Insufficient quantity', 
        description: `Only ${material.current_quantity} ${material.unit} available`,
        variant: 'destructive' 
      });
      return;
    }

    recordTransactionMutation.mutate(formData);
  };

  const handleReturn = (transaction: MaterialTransaction) => {
    setSelectedTransaction(transaction);
    setReturnDialogOpen(true);
  };

  const confirmReturn = () => {
    if (!selectedTransaction) return;
    returnItemMutation.mutate({
      transactionId: selectedTransaction.id,
      returnNotes: returnData.return_notes,
    });
  };

  // Calculate stats
  const totalTransactions = transactions?.length || 0;
  const issuedItems = transactions?.filter(t => t.transaction_type === 'issue' && !t.is_returned).length || 0;
  const returnedItems = transactions?.filter(t => t.is_returned).length || 0;
  const pendingReturns = transactions?.filter(t => t.transaction_type === 'issue' && !t.is_returned).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <History className="w-8 h-8 text-purple-600" />
            Material Transactions
          </h1>
          <p className="text-muted-foreground">Track material issuance and returns</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Record Transaction
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <ArrowUpDown className="w-8 h-8 text-blue-100" />
            <TrendingUp className="w-6 h-6 text-blue-100" />
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">Total Transactions</h3>
          <p className="text-3xl font-bold">{totalTransactions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-orange-100" />
            <Users className="w-6 h-6 text-orange-100" />
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">Issued Items</h3>
          <p className="text-3xl font-bold">{issuedItems}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-100" />
            <Undo className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Returned Items</h3>
          <p className="text-3xl font-bold">{returnedItems}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-red-100" />
            <Calendar className="w-6 h-6 text-red-100" />
          </div>
          <h3 className="text-red-100 text-sm font-medium mb-1">Pending Returns</h3>
          <p className="text-3xl font-bold">{pendingReturns}</p>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
            Transaction History
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Badge className={
                        transaction.transaction_type === 'issue' 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                      }>
                        {transaction.transaction_type === 'issue' ? 'Issued' : 'Returned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {materials?.find(m => m.id === transaction.material_id)?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {materials?.find(m => m.id === transaction.material_id)?.unique_code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.quantity} {materials?.find(m => m.id === transaction.material_id)?.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.recipient_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {users?.find(u => u.user_id === transaction.recipient_id)?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{transaction.purpose}</TableCell>
                    <TableCell>{format(new Date(transaction.transaction_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={
                        transaction.is_returned 
                          ? 'bg-green-500' 
                          : transaction.transaction_type === 'return'
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                      }>
                        {transaction.is_returned ? 'Returned' : 
                         transaction.transaction_type === 'return' ? 'Completed' : 'Pending Return'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.transaction_type === 'issue' && !transaction.is_returned && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(transaction)}
                        >
                          <Undo className="w-4 h-4 mr-1" />
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Record Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Material Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value: 'issue' | 'return') => setFormData({ ...formData, transaction_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue">Issue Material</SelectItem>
                    <SelectItem value="return">Return Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Material</Label>
                <Select
                  value={formData.material_id}
                  onValueChange={(value) => setFormData({ ...formData, material_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials?.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.current_quantity} {material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-quantity">Quantity</Label>
                <Input
                  id="transaction-quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-recipient">Recipient</Label>
                <Select
                  value={formData.recipient_id}
                  onValueChange={(value) => {
                    const selectedUser = users?.find(u => u.user_id === value);
                    setFormData({ 
                      ...formData, 
                      recipient_id: value,
                      recipient_name: selectedUser?.full_name || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-purpose">Purpose</Label>
              <Input
                id="transaction-purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Purpose of transaction"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-notes">Notes/Comments</Label>
              <Textarea
                id="transaction-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={recordTransactionMutation.isPending}>
              {recordTransactionMutation.isPending ? 'Recording...' : 'Record Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Item Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTransaction && (
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Material:</strong> {materials?.find(m => m.id === selectedTransaction.material_id)?.name}</p>
                <p><strong>Quantity:</strong> {selectedTransaction.quantity}</p>
                <p><strong>Recipient:</strong> {selectedTransaction.recipient_name}</p>
                <p><strong>Issued:</strong> {format(new Date(selectedTransaction.transaction_date), 'MMM d, yyyy')}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="return-notes">Return Notes</Label>
              <Textarea
                id="return-notes"
                value={returnData.return_notes}
                onChange={(e) => setReturnData({ return_notes: e.target.value })}
                placeholder="Notes about the return (condition, etc.)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmReturn} disabled={returnItemMutation.isPending}>
              {returnItemMutation.isPending ? 'Processing...' : 'Confirm Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialTransactionsPage;
