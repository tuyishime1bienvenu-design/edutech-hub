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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Wifi, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Router,
  Shield,
  Users,
  Power,
  Settings
} from 'lucide-react';

interface WiFiNetwork {
  id: string;
  name: string;
  password: string;
  assigned_roles: string[];
  created_at: string;
  created_by: string;
  is_active: boolean;
}

const WiFiNetworksPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<WiFiNetwork | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    assigned_roles: [] as string[],
    is_active: true,
  });

  const { data: networks, isLoading } = useQuery({
    queryKey: ['wifi-networks'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('wifi_networks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WiFiNetwork[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any).from('wifi_networks').insert({
        name: data.name,
        password: data.password,
        assigned_roles: data.assigned_roles,
        is_active: data.is_active,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-networks'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'WiFi network created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating network', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await (supabase as any)
        .from('wifi_networks')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-networks'] });
      setDialogOpen(false);
      setEditingNetwork(null);
      resetForm();
      toast({ title: 'WiFi network updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating network', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('wifi_networks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-networks'] });
      toast({ title: 'WiFi network deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting network', description: error.message, variant: 'destructive' });
    },
  });

  const togglePasswordVisibility = (networkId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [networkId]: !prev[networkId]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      password: '',
      assigned_roles: [],
      is_active: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.password || formData.assigned_roles.length === 0) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (editingNetwork) {
      updateMutation.mutate({ id: editingNetwork.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (network: WiFiNetwork) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name,
      password: network.password,
      assigned_roles: network.assigned_roles,
      is_active: network.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this WiFi network?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleNetworkStatus = (network: WiFiNetwork) => {
    updateMutation.mutate({
      id: network.id,
      data: { ...network, is_active: !network.is_active }
    });
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-600" />
            WiFi Networks Management
          </h1>
          <p className="text-muted-foreground">Manage WiFi networks and role assignments</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingNetwork(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Network
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Wifi className="w-8 h-8 text-blue-100" />
            <Router className="w-6 h-6 text-blue-100" />
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">Total Networks</h3>
          <p className="text-3xl font-bold">{networks?.length || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Power className="w-8 h-8 text-green-100" />
            <Shield className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Active Networks</h3>
          <p className="text-3xl font-bold">{networks?.filter(n => n.is_active).length || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-100" />
            <Settings className="w-6 h-6 text-purple-100" />
          </div>
          <h3 className="text-purple-100 text-sm font-medium mb-1">Role Assignments</h3>
          <p className="text-3xl font-bold">{networks?.reduce((sum, n) => sum + n.assigned_roles.length, 0) || 0}</p>
        </motion.div>
      </div>

      {/* Networks Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
            Network List
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network Name</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks?.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">{network.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showPasswords[network.id] ? network.password : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(network.id)}
                        >
                          {showPasswords[network.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {network.assigned_roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={network.is_active ? 'bg-green-500' : 'bg-red-500'}>
                        {network.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(network.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleNetworkStatus(network)}
                        >
                          {network.is_active ? <Power className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(network)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(network.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNetwork ? 'Edit WiFi Network' : 'Create WiFi Network'}
            </DialogTitle>
            <DialogDescription>
              {editingNetwork ? 'Edit the WiFi network details below.' : 'Create a new WiFi network by filling in the details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="network-name">Network Name</Label>
              <Input
                id="network-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter network name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="network-password">Password</Label>
              <Input
                id="network-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label>Assign to Roles</Label>
              <Select
                value={formData.assigned_roles[0] || ''}
                onValueChange={(value) => setFormData({ ...formData, assigned_roles: [value] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="network-active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="network-active">Network Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
               editingNetwork ? 'Update Network' : 'Create Network'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WiFiNetworksPage;
