import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Wifi, HardDrive, Package, History, Settings, User, MapPin, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type Equipment = Database['public']['Tables']['equipment']['Row'];
type Material = Database['public']['Tables']['materials_inventory']['Row'];
type WiFiNetwork = Database['public']['Tables']['wifi_networks']['Row'];
type MaterialTransaction = Database['public']['Tables']['material_transactions']['Row'];

const ITPage = () => {
  const [activeTab, setActiveTab] = useState('equipment');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEquipmentDialogOpen, setIsAddEquipmentDialogOpen] = useState(false);
  const [isAddMaterialDialogOpen, setIsAddMaterialDialogOpen] = useState(false);
  const [isAddWiFiDialogOpen, setIsAddWiFiDialogOpen] = useState(false);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false);

  const [newEquipment, setNewEquipment] = useState({
    name: '',
    description: '',
    serial_number: '',
    model: '',
    category: '',
    status: 'active' as const,
    purchase_date: '',
    purchase_cost: '',
    assigned_to: '',
    location: '',
    warranty_expiry: '',
    notes: '',
  });

  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    category: '',
    type: 'consumable' as const,
    unit: 'pieces',
    current_quantity: '',
    minimum_quantity: '',
    unit_cost: '',
    supplier: '',
    location: '',
    barcode: '',
  });

  const [newWiFiNetwork, setNewWiFiNetwork] = useState({
    name: '',
    password: '',
    description: '',
    assigned_roles: [] as string[],
  });

  const [newTransaction, setNewTransaction] = useState({
    material_id: '',
    transaction_type: 'out' as const,
    quantity: '',
    unit_cost: '',
    recipient_id: '',
    recipient_name: '',
    purpose: '',
    notes: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Equipment queries and mutations
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async (equipmentData: typeof newEquipment) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('equipment').insert({
        name: equipmentData.name,
        description: equipmentData.description || null,
        serial_number: equipmentData.serial_number || null,
        model: equipmentData.model || null,
        category: equipmentData.category || null,
        status: equipmentData.status,
        purchase_date: equipmentData.purchase_date || null,
        purchase_cost: equipmentData.purchase_cost ? parseFloat(equipmentData.purchase_cost) : null,
        assigned_to: equipmentData.assigned_to || null,
        location: equipmentData.location || null,
        warranty_expiry: equipmentData.warranty_expiry || null,
        notes: equipmentData.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setIsAddEquipmentDialogOpen(false);
      setNewEquipment({
        name: '',
        description: '',
        serial_number: '',
        model: '',
        category: '',
        status: 'active',
        purchase_date: '',
        purchase_cost: '',
        assigned_to: '',
        location: '',
        warranty_expiry: '',
        notes: '',
      });
      toast({ title: 'Equipment added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding equipment', description: error.message, variant: 'destructive' });
    },
  });

  // Materials queries and mutations
  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials_inventory')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const addMaterialMutation = useMutation({
    mutationFn: async (materialData: typeof newMaterial) => {
      const { error } = await supabase.from('materials_inventory').insert({
        name: materialData.name,
        description: materialData.description || null,
        category: materialData.category || null,
        type: materialData.type,
        unit: materialData.unit,
        current_quantity: parseFloat(materialData.current_quantity) || 0,
        minimum_quantity: parseFloat(materialData.minimum_quantity) || 0,
        unit_cost: materialData.unit_cost ? parseFloat(materialData.unit_cost) : null,
        supplier: materialData.supplier || null,
        location: materialData.location || null,
        barcode: materialData.barcode || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsAddMaterialDialogOpen(false);
      setNewMaterial({
        name: '',
        description: '',
        category: '',
        type: 'consumable',
        unit: 'pieces',
        current_quantity: '',
        minimum_quantity: '',
        unit_cost: '',
        supplier: '',
        location: '',
        barcode: '',
      });
      toast({ title: 'Material added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding material', description: error.message, variant: 'destructive' });
    },
  });

  // WiFi networks queries and mutations
  const { data: wifiNetworks, isLoading: wifiLoading } = useQuery({
    queryKey: ['wifi-networks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wifi_networks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addWiFiMutation = useMutation({
    mutationFn: async (wifiData: typeof newWiFiNetwork) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('wifi_networks').insert({
        name: wifiData.name,
        password: wifiData.password,
        description: wifiData.description || null,
        assigned_roles: wifiData.assigned_roles.length > 0 ? wifiData.assigned_roles : null,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wifi-networks'] });
      setIsAddWiFiDialogOpen(false);
      setNewWiFiNetwork({
        name: '',
        password: '',
        description: '',
        assigned_roles: [],
      });
      toast({ title: 'WiFi network added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding WiFi network', description: error.message, variant: 'destructive' });
    },
  });

  // Material transactions queries and mutations
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['material-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('material_transactions')
        .select(`
          *,
          materials_inventory(name, unit)
        `)
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addTransactionMutation = useMutation({
    mutationFn: async (transactionData: typeof newTransaction) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('material_transactions').insert({
        material_id: transactionData.material_id,
        transaction_type: transactionData.transaction_type,
        quantity: parseFloat(transactionData.quantity),
        unit_cost: transactionData.unit_cost ? parseFloat(transactionData.unit_cost) : null,
        total_cost: transactionData.unit_cost && transactionData.quantity
          ? parseFloat(transactionData.unit_cost) * parseFloat(transactionData.quantity)
          : null,
        recipient_id: transactionData.recipient_id || null,
        recipient_name: transactionData.recipient_name || null,
        purpose: transactionData.purpose || null,
        notes: transactionData.notes || null,
        recorded_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setIsAddTransactionDialogOpen(false);
      setNewTransaction({
        material_id: '',
        transaction_type: 'out',
        quantity: '',
        unit_cost: '',
        recipient_id: '',
        recipient_name: '',
        purpose: '',
        notes: '',
      });
      toast({ title: 'Transaction recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording transaction', description: error.message, variant: 'destructive' });
    },
  });

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'maintenance': return 'secondary';
      case 'repair': return 'destructive';
      case 'retired': return 'outline';
      case 'lost': return 'destructive';
      default: return 'outline';
    }
  };

  const getMaterialTypeColor = (type: string) => {
    switch (type) {
      case 'consumable': return 'default';
      case 'non_consumable': return 'secondary';
      case 'equipment': return 'outline';
      default: return 'outline';
    }
  };

  const filteredEquipment = equipment?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaterials = materials?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions?.filter(item =>
    item.materials_inventory?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">IT Management</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="wifi" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            WiFi Networks
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Equipment Management</h2>
            <Button onClick={() => setIsAddEquipmentDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purchase Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Badge variant={getEquipmentStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.assigned_to || 'Not assigned'}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>${item.purchase_cost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Materials Inventory</h2>
            <Button onClick={() => setIsAddMaterialDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Current Quantity</TableHead>
                  <TableHead>Minimum Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={getMaterialTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.current_quantity} {item.unit}</TableCell>
                    <TableCell>{item.minimum_quantity} {item.unit}</TableCell>
                    <TableCell>${item.unit_cost}</TableCell>
                    <TableCell>{item.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="wifi" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">WiFi Networks</h2>
            <Button onClick={() => setIsAddWiFiDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add WiFi Network
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Assigned Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wifiNetworks?.map((network) => (
                  <TableRow key={network.id}>
                    <TableCell className="font-medium">{network.name}</TableCell>
                    <TableCell>{network.description}</TableCell>
                    <TableCell>
                      {network.assigned_roles?.map(role => (
                        <Badge key={role} variant="outline" className="mr-1">
                          {role}
                        </Badge>
                      )) || 'All roles'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={network.is_active ? 'default' : 'secondary'}>
                        {network.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(network.created_at), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Material Transactions</h2>
            <Button onClick={() => setIsAddTransactionDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Transaction
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.materials_inventory?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.transaction_type === 'in' ? 'default' : 'secondary'}>
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.quantity} {transaction.materials_inventory?.unit}
                    </TableCell>
                    <TableCell>{transaction.recipient_name}</TableCell>
                    <TableCell>{transaction.purpose}</TableCell>
                    <TableCell>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Equipment Dialog */}
      <Dialog open={isAddEquipmentDialogOpen} onOpenChange={setIsAddEquipmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment-name">Name *</Label>
              <Input
                id="equipment-name"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="equipment-category">Category</Label>
              <Input
                id="equipment-category"
                value={newEquipment.category}
                onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="equipment-model">Model</Label>
              <Input
                id="equipment-model"
                value={newEquipment.model}
                onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="equipment-serial">Serial Number</Label>
              <Input
                id="equipment-serial"
                value={newEquipment.serial_number}
                onChange={(e) => setNewEquipment({ ...newEquipment, serial_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="equipment-status">Status</Label>
              <Select
                value={newEquipment.status}
                onValueChange={(value: any) => setNewEquipment({ ...newEquipment, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="equipment-location">Location</Label>
              <Input
                id="equipment-location"
                value={newEquipment.location}
                onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="equipment-purchase-date">Purchase Date</Label>
              <Input
                id="equipment-purchase-date"
                type="date"
                value={newEquipment.purchase_date}
                onChange={(e) => setNewEquipment({ ...newEquipment, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="equipment-purchase-cost">Purchase Cost</Label>
              <Input
                id="equipment-purchase-cost"
                type="number"
                step="0.01"
                value={newEquipment.purchase_cost}
                onChange={(e) => setNewEquipment({ ...newEquipment, purchase_cost: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="equipment-description">Description</Label>
              <Textarea
                id="equipment-description"
                value={newEquipment.description}
                onChange={(e) => setNewEquipment({ ...newEquipment, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEquipmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addEquipmentMutation.mutate(newEquipment)}>
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={isAddMaterialDialogOpen} onOpenChange={setIsAddMaterialDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Material</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material-name">Name *</Label>
              <Input
                id="material-name"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-category">Category</Label>
              <Input
                id="material-category"
                value={newMaterial.category}
                onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-type">Type</Label>
              <Select
                value={newMaterial.type}
                onValueChange={(value: any) => setNewMaterial({ ...newMaterial, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumable">Consumable</SelectItem>
                  <SelectItem value="non_consumable">Non-consumable</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="material-unit">Unit</Label>
              <Input
                id="material-unit"
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-current-quantity">Current Quantity</Label>
              <Input
                id="material-current-quantity"
                type="number"
                step="0.01"
                value={newMaterial.current_quantity}
                onChange={(e) => setNewMaterial({ ...newMaterial, current_quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-minimum-quantity">Minimum Quantity</Label>
              <Input
                id="material-minimum-quantity"
                type="number"
                step="0.01"
                value={newMaterial.minimum_quantity}
                onChange={(e) => setNewMaterial({ ...newMaterial, minimum_quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-unit-cost">Unit Cost</Label>
              <Input
                id="material-unit-cost"
                type="number"
                step="0.01"
                value={newMaterial.unit_cost}
                onChange={(e) => setNewMaterial({ ...newMaterial, unit_cost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-supplier">Supplier</Label>
              <Input
                id="material-supplier"
                value={newMaterial.supplier}
                onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-location">Location</Label>
              <Input
                id="material-location"
                value={newMaterial.location}
                onChange={(e) => setNewMaterial({ ...newMaterial, location: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="material-barcode">Barcode</Label>
              <Input
                id="material-barcode"
                value={newMaterial.barcode}
                onChange={(e) => setNewMaterial({ ...newMaterial, barcode: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="material-description">Description</Label>
              <Textarea
                id="material-description"
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMaterialDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addMaterialMutation.mutate(newMaterial)}>
              Add Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add WiFi Network Dialog */}
      <Dialog open={isAddWiFiDialogOpen} onOpenChange={setIsAddWiFiDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add WiFi Network</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wifi-name">Network Name *</Label>
              <Input
                id="wifi-name"
                value={newWiFiNetwork.name}
                onChange={(e) => setNewWiFiNetwork({ ...newWiFiNetwork, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wifi-password">Password *</Label>
              <Input
                id="wifi-password"
                type="password"
                value={newWiFiNetwork.password}
                onChange={(e) => setNewWiFiNetwork({ ...newWiFiNetwork, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="wifi-description">Description</Label>
              <Textarea
                id="wifi-description"
                value={newWiFiNetwork.description}
                onChange={(e) => setNewWiFiNetwork({ ...newWiFiNetwork, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Assigned Roles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['admin', 'secretary', 'trainer', 'finance', 'student', 'it'].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={newWiFiNetwork.assigned_roles.includes(role)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewWiFiNetwork({
                            ...newWiFiNetwork,
                            assigned_roles: [...newWiFiNetwork.assigned_roles, role]
                          });
                        } else {
                          setNewWiFiNetwork({
                            ...newWiFiNetwork,
                            assigned_roles: newWiFiNetwork.assigned_roles.filter(r => r !== role)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role}`} className="capitalize">{role}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddWiFiDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addWiFiMutation.mutate(newWiFiNetwork)}>
              Add WiFi Network
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionDialogOpen} onOpenChange={setIsAddTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Material Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction-material">Material *</Label>
              <Select
                value={newTransaction.material_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, material_id: value })}
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
            <div>
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select
                value={newTransaction.transaction_type}
                onValueChange={(value: any) => setNewTransaction({ ...newTransaction, transaction_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transaction-quantity">Quantity *</Label>
              <Input
                id="transaction-quantity"
                type="number"
                step="0.01"
                value={newTransaction.quantity}
                onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="transaction-unit-cost">Unit Cost</Label>
              <Input
                id="transaction-unit-cost"
                type="number"
                step="0.01"
                value={newTransaction.unit_cost}
                onChange={(e) => setNewTransaction({ ...newTransaction, unit_cost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="transaction-recipient-name">Recipient Name</Label>
              <Input
                id="transaction-recipient-name"
                value={newTransaction.recipient_name}
                onChange={(e) => setNewTransaction({ ...newTransaction, recipient_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="transaction-purpose">Purpose</Label>
              <Input
                id="transaction-purpose"
                value={newTransaction.purpose}
                onChange={(e) => setNewTransaction({ ...newTransaction, purpose: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="transaction-notes">Notes</Label>
              <Textarea
                id="transaction-notes"
                value={newTransaction.notes}
                onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTransactionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => addTransactionMutation.mutate(newTransaction)}>
              Record Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITPage;