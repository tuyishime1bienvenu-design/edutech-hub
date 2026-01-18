import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, DollarSign, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface FeeStructure {
  id: string;
  name: string;
  program_id: string | null;
  level: string | null;
  registration_fee: number;
  internship_fee: number;
  is_active: boolean;
  created_at: string;
  programs?: { name: string } | null;
}

const FeeStructuresPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    program_id: string;
    level: 'L3' | 'L4' | 'L5' | '';
    registration_fee: number;
    internship_fee: number;
    is_active: boolean;
  }>({
    name: '',
    program_id: '',
    level: '',
    registration_fee: 0,
    internship_fee: 0,
    is_active: true,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: feeStructures, isLoading } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*, programs (name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FeeStructure[];
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['programs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name.trim(),
        program_id: data.program_id && data.program_id !== '' && data.program_id !== 'none' ? data.program_id : null,
        level: data.level && data.level !== '' && data.level !== 'none' ? data.level : null,
        registration_fee: Number(data.registration_fee) || 0,
        internship_fee: Number(data.internship_fee) || 0,
        is_active: data.is_active,
      };
      
      if (editingFee) {
        const { error } = await supabase
          .from('fee_structures')
          .update(payload)
          .eq('id', editingFee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fee_structures').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: editingFee ? 'Fee structure updated' : 'Fee structure created' });
    },
    onError: (error: any) => {
      console.error('Fee structure error:', error);
      toast({ 
        title: 'Error saving fee structure', 
        description: error?.message || 'An unexpected error occurred', 
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fee_structures').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      toast({ title: 'Fee structure deleted' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      program_id: '',
      level: '',
      registration_fee: 0,
      internship_fee: 0,
      is_active: true,
    });
    setEditingFee(null);
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      program_id: fee.program_id || '',
      level: (fee.level as 'L3' | 'L4' | 'L5') || '',
      registration_fee: fee.registration_fee,
      internship_fee: fee.internship_fee,
      is_active: fee.is_active,
    });
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-display font-bold">Fee Structures</h1>
          <p className="text-muted-foreground">Manage program fees and pricing</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Fee Structure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeStructures?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No fee structures defined yet.</p>
          </div>
        ) : (
          feeStructures?.map((fee, index) => (
            <motion.div
              key={fee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        {fee.name}
                      </CardTitle>
                      <CardDescription>
                        {fee.programs?.name || 'All Programs'}
                        {fee.level && ` • ${fee.level}`}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(fee)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(fee.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Registration Fee</span>
                      <span className="font-semibold">{formatCurrency(fee.registration_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Internship Fee</span>
                      <span className="font-semibold">{formatCurrency(fee.internship_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(fee.registration_fee + fee.internship_fee)}
                      </span>
                    </div>
                    <Badge variant={fee.is_active ? 'default' : 'secondary'}>
                      {fee.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., L3 Web Development Fee"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program (Optional)</Label>
                <Select
                  value={formData.program_id || 'none'}
                  onValueChange={(value) => {
                    setFormData({ ...formData, program_id: value === 'none' ? '' : value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Programs</SelectItem>
                    {programs?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level (Optional)</Label>
                <Select
                  value={formData.level || 'none'}
                  onValueChange={(value) => {
                    setFormData({ ...formData, level: (value === 'none' ? '' : value) as 'L3' | 'L4' | 'L5' | '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Levels</SelectItem>
                    <SelectItem value="L3">L3</SelectItem>
                    <SelectItem value="L4">L4</SelectItem>
                    <SelectItem value="L5">L5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg_fee">Registration Fee (RWF)</Label>
                <Input
                  id="reg_fee"
                  type="number"
                  value={formData.registration_fee}
                  onChange={(e) => setFormData({ ...formData, registration_fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="int_fee">Internship Fee (RWF)</Label>
                <Input
                  id="int_fee"
                  type="number"
                  value={formData.internship_fee}
                  onChange={(e) => setFormData({ ...formData, internship_fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!formData.name.trim()) {
                  toast({ 
                    title: 'Validation Error', 
                    description: 'Please enter a name for the fee structure', 
                    variant: 'destructive' 
                  });
                  return;
                }
                saveMutation.mutate(formData);
              }}
              disabled={!formData.name.trim() || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : editingFee ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeeStructuresPage;
