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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  Box,
  DollarSign,
  MapPin,
  User,
  Search,
  Filter
} from 'lucide-react';

interface MaterialItem {
  id: string;
  name: string;
  unique_code?: string;
  category: string;
  current_quantity: number;
  minimum_quantity: number;
  location: string;
  supplier: string;
  unit_cost: number;
  unit: string;
  type?: string;
  barcode?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const MaterialsInventoryPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    current_quantity: 0,
    minimum_quantity: 0,
    location: '',
    supplier: '',
    unit_cost: 0,
    unit: 'pieces',
    description: '',
  });

  // Generate unique code
  const generateUniqueCode = () => {
    const prefix = 'ITM';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const { data: materials, isLoading } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const uniqueCode = generateUniqueCode();
      const { error } = await supabase.from('materials_inventory').insert({
        ...data,
        unique_code: uniqueCode,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Material added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding material', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('materials_inventory')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      setDialogOpen(false);
      setEditingMaterial(null);
      resetForm();
      toast({ title: 'Material updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating material', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('materials_inventory').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials-inventory'] });
      toast({ title: 'Material deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting material', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      current_quantity: 0,
      minimum_quantity: 0,
      location: '',
      supplier: '',
      unit_cost: 0,
      unit: 'pieces',
      description: '',
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.category) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (material: MaterialItem) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      category: material.category,
      current_quantity: material.current_quantity,
      minimum_quantity: material.minimum_quantity,
      location: material.location,
      supplier: material.supplier,
      unit_cost: material.unit_cost,
      unit: material.unit,
      description: material.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter materials
  const filteredMaterials = materials?.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.unique_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = [...new Set(materials?.map(m => m.category) || [])];

  // Calculate stats
  const totalItems = materials?.length || 0;
  const lowStockItems = materials?.filter(m => m.current_quantity <= m.minimum_quantity).length || 0;
  const totalValue = materials?.reduce((sum, m) => sum + (m.current_quantity * (m.unit_cost || 0)), 0) || 0;
  const outOfStockItems = materials?.filter(m => m.current_quantity === 0).length || 0;

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
            <Package className="w-8 h-8 text-purple-600" />
            Materials Inventory
          </h1>
          <p className="text-muted-foreground">Manage and track all materials and supplies</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingMaterial(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-purple-100" />
            <Box className="w-6 h-6 text-purple-100" />
          </div>
          <h3 className="text-purple-100 text-sm font-medium mb-1">Total Items</h3>
          <p className="text-3xl font-bold">{totalItems}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-100" />
            <TrendingUp className="w-6 h-6 text-orange-100" />
          </div>
          <h3 className="text-orange-100 text-sm font-medium mb-1">Low Stock</h3>
          <p className="text-3xl font-bold">{lowStockItems}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-100" />
            <TrendingUp className="w-6 h-6 text-green-100" />
          </div>
          <h3 className="text-green-100 text-sm font-medium mb-1">Total Value</h3>
          <p className="text-3xl font-bold">RWF {(totalValue || 0).toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05, y: -5 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 text-red-100" />
            <Box className="w-6 h-6 text-red-100" />
          </div>
          <h3 className="text-red-100 text-sm font-medium mb-1">Out of Stock</h3>
          <p className="text-3xl font-bold">{outOfStockItems}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Materials Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
            Materials List
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unique Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-mono text-xs">{material.unique_code || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{material.current_quantity} {material.unit}</span>
                        {material.current_quantity <= material.minimum_quantity && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {material.location}
                      </div>
                    </TableCell>
                    <TableCell>RWF {(material.unit_cost || 0).toLocaleString()}</TableCell>
                    <TableCell>RWF {((material.current_quantity || 0) * (material.unit_cost || 0)).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={
                        material.current_quantity === 0
                          ? 'bg-red-500'
                          : material.current_quantity <= material.minimum_quantity
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }>
                        {material.current_quantity === 0
                          ? 'Out of Stock'
                          : material.current_quantity <= material.minimum_quantity
                          ? 'Low Stock'
                          : 'In Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(material.id)}
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

      {/* Add/Edit Material Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-name">Material Name</Label>
                <Input
                  id="material-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter material name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-category">Category</Label>
                <Input
                  id="material-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-quantity">Current Quantity</Label>
                <Input
                  id="material-quantity"
                  type="number"
                  value={formData.current_quantity}
                  onChange={(e) => setFormData({ ...formData, current_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-minimum">Minimum Quantity</Label>
                <Input
                  id="material-minimum"
                  type="number"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({ ...formData, minimum_quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">KG</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-location">Location</Label>
                <Input
                  id="material-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Storage location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-supplier">Supplier</Label>
                <Input
                  id="material-supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-cost">Unit Cost (RWF)</Label>
                <Input
                  id="material-cost"
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-description">Description</Label>
                <Input
                  id="material-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 
               editingMaterial ? 'Update Material' : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialsInventoryPage;
