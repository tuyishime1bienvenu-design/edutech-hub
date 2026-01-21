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
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Wrench,
  Monitor,
  Laptop,
  Wifi,
  Printer,
  Camera,
  Phone,
  Search,
  Filter,
  Clock,
  User,
  MapPin,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  unique_code: string;
  category: string;
  status: 'available' | 'in_use' | 'broken' | 'lost' | 'maintenance';
  assigned_to?: string;
  assigned_to_name?: string;
  location: string;
  purchase_date: string;
  warranty_expiry?: string;
  last_maintenance?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface EquipmentRequest {
  id: string;
  equipment_id: string;
  equipment_name: string;
  requested_by: string;
  requested_by_name: string;
  request_date: string;
  purpose: string;
  expected_return_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  approved_by?: string;
  approved_date?: string;
  actual_return_date?: string;
  notes?: string;
}

const EquipmentPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'equipment' | 'requests'>('equipment');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    purchase_date: '',
    warranty_expiry: '',
    notes: '',
  });

  const [statusData, setStatusData] = useState({
    status: 'available' as 'available' | 'in_use' | 'broken' | 'lost' | 'maintenance',
    notes: '',
  });

  // Generate unique code
  const generateUniqueCode = () => {
    const prefix = 'EQP';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Equipment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await (supabase as any).from('equipment').insert({
        ...data,
        unique_code: generateUniqueCode(),
        status: 'available',
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Equipment added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding equipment', description: error.message, variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await (supabase as any)
        .from('equipment')
        .update({ 
          status, 
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setStatusDialogOpen(false);
      setSelectedEquipment(null);
      setStatusData({ status: 'available', notes: '' });
      toast({ title: 'Equipment status updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      toast({ title: 'Equipment deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting equipment', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      location: '',
      purchase_date: '',
      warranty_expiry: '',
      notes: '',
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleStatusUpdate = () => {
    if (!selectedEquipment) return;
    updateStatusMutation.mutate({
      id: selectedEquipment.id,
      status: statusData.status,
      notes: statusData.notes,
    });
  };

  const handleStatusChange = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setStatusData({
      status: equipment.status,
      notes: equipment.notes || '',
    });
    setStatusDialogOpen(true);
  };

  // Filter equipment
  const filteredEquipment = equipment?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.unique_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate stats
  const totalEquipment = equipment?.length || 0;
  const availableEquipment = equipment?.filter(e => e.status === 'available').length || 0;
  const brokenEquipment = equipment?.filter(e => e.status === 'broken').length || 0;
  const lostEquipment = equipment?.filter(e => e.status === 'lost').length || 0;
  const pendingReturns = []; // No equipment requests table available

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'in_use':
        return <Badge className="bg-blue-500">In Use</Badge>;
      case 'broken':
        return <Badge className="bg-red-500">Broken</Badge>;
      case 'lost':
        return <Badge className="bg-red-600">Lost</Badge>;
      case 'maintenance':
        return <Badge className="bg-orange-500">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'computer':
      case 'laptop':
        return <Laptop className="w-5 h-5" />;
      case 'monitor':
        return <Monitor className="w-5 h-5" />;
      case 'printer':
        return <Printer className="w-5 h-5" />;
      case 'camera':
        return <Camera className="w-5 h-5" />;
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'network':
      case 'router':
        return <Wifi className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  if (equipmentLoading) {
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
            <Settings className="w-8 h-8 text-blue-600" />
            Equipment Management
          </h1>
          <p className="text-muted-foreground">Track and manage all equipment and devices</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingEquipment(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment
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
            <Settings className="w-8 h-8 text-blue-100" />
            <Wrench className="w-6 h-6 text-blue-100" />
          </div>
          <h3 className="text-blue-100 text-sm font-medium mb-1">Total Equipment</h3>
          <p className="text-3xl font-bold">{totalEquipment}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-100" />
            <Wifi className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Available</h3>
          <p className="text-3xl font-bold">{availableEquipment}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-100" />
            <Wrench className="w-6 h-6 text-red-100" />
          </div>
          <h3 className="text-red-100 text-sm font-medium mb-1">Broken</h3>
          <p className="text-3xl font-bold">{brokenEquipment}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-orange-100" />
            <Clock className="w-6 h-6 text-orange-100" />
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">Lost</h3>
          <p className="text-3xl font-bold">{lostEquipment}</p>
        </motion.div>
      </div>

      {/* Pending Returns Alert */}
      {pendingReturns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800">Pending Returns</h3>
              <p className="text-sm text-orange-600">
                {pendingReturns.length} equipment item(s) have been requested but not yet returned
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 p-6">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`pb-2 border-b-2 font-medium text-sm ${
                activeTab === 'equipment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Equipment Inventory
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-2 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Returns ({pendingReturns.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'equipment' ? (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search equipment..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="broken">Broken</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Equipment Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.unique_code}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            <span>{item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {item.assigned_to_name || 'Unassigned'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(item)}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
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
            </>
          ) : (
            /* Pending Returns Table */
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReturns.map((request) => {
                    const daysOverdue = Math.floor((Date.now() - new Date(request.expected_return_date || '').getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.equipment_name}</TableCell>
                        <TableCell>{request.requested_by_name}</TableCell>
                        <TableCell>{format(new Date(request.request_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {request.expected_return_date 
                            ? format(new Date(request.expected_return_date), 'MMM d, yyyy')
                            : 'Not set'
                          }
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.purpose}</TableCell>
                        <TableCell>
                          {daysOverdue > 0 && (
                            <Badge className="bg-red-500">
                              {daysOverdue} days overdue
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add Equipment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-name">Equipment Name</Label>
                <Input
                  id="equipment-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter equipment name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer">Computer</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="monitor">Monitor</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="network">Network Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-location">Location</Label>
                <Input
                  id="equipment-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Equipment location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-purchase">Purchase Date</Label>
                <Input
                  id="equipment-purchase"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-warranty">Warranty Expiry</Label>
                <Input
                  id="equipment-warranty"
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-notes">Notes</Label>
                <Input
                  id="equipment-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Equipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Equipment Status</DialogTitle>
          </DialogHeader>
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Equipment:</strong> {selectedEquipment.name}</p>
                <p><strong>Code:</strong> {selectedEquipment.unique_code}</p>
                <p><strong>Current Status:</strong> {getStatusBadge(selectedEquipment.status)}</p>
              </div>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={statusData.status}
                  onValueChange={(value: any) => setStatusData({ ...statusData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="broken">Broken</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-notes">Notes</Label>
                <Textarea
                  id="status-notes"
                  value={statusData.notes}
                  onChange={(e) => setStatusData({ ...statusData, notes: e.target.value })}
                  placeholder="Add notes about the status change..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentPage;
