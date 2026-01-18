import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, MoreVertical, UserPlus, Edit, Trash2, Shield, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    roles: [] as ('admin' | 'secretary' | 'trainer' | 'finance' | 'student' | 'it')[],
  });
  const [editUser, setEditUser] = useState({
    id: '',
    email: '',
    fullName: '',
    roles: [] as ('admin' | 'secretary' | 'trainer' | 'finance' | 'student' | 'it')[],
  });
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [salaryData, setSalaryData] = useState({
    amount: '',
    period: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'custom',
    custom_days: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const { data: salaries } = await supabase
        .from('salaries')
        .select('user_id, amount, period, custom_days');

      // Group roles by user_id
      const rolesByUser = roles?.reduce((acc, role) => {
        if (!acc[role.user_id]) {
          acc[role.user_id] = [];
        }
        acc[role.user_id].push(role.role);
        return acc;
      }, {} as Record<string, string[]>);

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: rolesByUser?.[profile.user_id] || [],
        primaryRole: rolesByUser?.[profile.user_id]?.[0] || null,
        salary: salaries?.find(s => s.user_id === profile.user_id) || null,
      }));

      return usersWithRoles;
    },
  });

  const filteredUsers = users?.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'secretary': return 'bg-blue-100 text-blue-800';
      case 'trainer': return 'bg-green-100 text-green-800';
      case 'finance': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-yellow-100 text-yellow-800';
      case 'it': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const addUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data: response, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName,
          roles: userData.roles,
        },
      });
      if (error) throw error;
      if (!response.success) throw new Error(response.message || 'Failed to create user');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddDialogOpen(false);
      setNewUser({ email: '', password: '', fullName: '', roles: [] });
      toast({ title: 'User created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (userData: typeof editUser) => {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          email: userData.email,
        })
        .eq('id', userData.id);

      if (profileError) throw profileError;

      // Update user roles
      const { error: deleteRolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userData.id);

      if (deleteRolesError) throw deleteRolesError;

      if (userData.roles.length > 0) {
        const { error: insertRolesError } = await supabase
          .from('user_roles')
          .insert(
            userData.roles.map(role => ({
              user_id: userData.id,
              role: role,
            }))
          );

        if (insertRolesError) throw insertRolesError;
      }

      return userData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setEditUser({ id: '', email: '', fullName: '', roles: [] });
      toast({ title: 'User updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
    },
  });

  const setSalaryMutation = useMutation({
    mutationFn: async ({ userId, amount, period, customDays }: { userId: string; amount: number; period: string; customDays?: number }) => {
      const { error } = await supabase
        .from('salaries')
        .upsert({
          user_id: userId,
          amount,
          period,
          custom_days: period === 'custom' ? customDays : null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsSalaryDialogOpen(false);
      setSelectedUser(null);
      setSalaryData({ amount: '', period: 'monthly', custom_days: '' });
      toast({ title: 'Salary updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating salary', description: error.message, variant: 'destructive' });
    },
  });

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
          <h1 className="text-2xl font-display font-bold">Users</h1>
          <p className="text-muted-foreground">Manage system users and their roles</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} className={getRoleColor(role)}>
                            <Shield className="w-3 h-3 mr-1" />
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          No Roles
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.salary ? (
                      <div className="text-sm">
                        <div>RWF {user.salary.amount.toLocaleString()}</div>
                        <div className="text-muted-foreground capitalize">
                          {user.salary.period}{user.salary.period === 'custom' ? ` (${user.salary.custom_days}d)` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setSalaryData({
                            amount: user.salary?.amount?.toString() || '',
                            period: user.salary?.period || 'monthly',
                            custom_days: user.salary?.custom_days?.toString() || '',
                          });
                          setIsSalaryDialogOpen(true);
                        }}>
                          <CreditCard className="w-4 h-4 mr-2" /> Manage Salary
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditUser({
                            id: user.id,
                            email: user.email,
                            fullName: user.full_name,
                            roles: user.roles || [],
                          });
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {[
                  { value: 'admin', label: 'Admin' },
                  { value: 'secretary', label: 'Secretary' },
                  { value: 'trainer', label: 'Trainer' },
                  { value: 'finance', label: 'Finance' },
                  { value: 'it', label: 'IT' },
                  { value: 'student', label: 'Student' },
                ].map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.value}
                      checked={newUser.roles.includes(role.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewUser({ ...newUser, roles: [...newUser.roles, role.value as any] });
                        } else {
                          setNewUser({ ...newUser, roles: newUser.roles.filter(r => r !== role.value) });
                        }
                      }}
                    />
                    <Label htmlFor={role.value} className="text-sm font-normal">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addUserMutation.mutate(newUser)}
              disabled={!newUser.email || !newUser.password || !newUser.fullName || newUser.roles.length === 0 || addUserMutation.isPending}
            >
              {addUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                value={editUser.fullName}
                onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2">
                {[
                  { value: 'admin', label: 'Admin' },
                  { value: 'secretary', label: 'Secretary' },
                  { value: 'trainer', label: 'Trainer' },
                  { value: 'finance', label: 'Finance' },
                  { value: 'it', label: 'IT' },
                  { value: 'student', label: 'Student' },
                ].map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${role.value}`}
                      checked={editUser.roles.includes(role.value as any)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditUser({ ...editUser, roles: [...editUser.roles, role.value as any] });
                        } else {
                          setEditUser({ ...editUser, roles: editUser.roles.filter(r => r !== role.value) });
                        }
                      }}
                    />
                    <Label htmlFor={`edit-${role.value}`} className="text-sm font-normal">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => editUserMutation.mutate(editUser)}
              disabled={!editUser.email || !editUser.fullName || editUser.roles.length === 0 || editUserMutation.isPending}
            >
              {editUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Salary for {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Salary Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={salaryData.amount}
                onChange={(e) => setSalaryData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter salary amount"
              />
            </div>
            <div>
              <Label htmlFor="period">Payment Period</Label>
              <Select value={salaryData.period} onValueChange={(value: any) => setSalaryData(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {salaryData.period === 'custom' && (
              <div>
                <Label htmlFor="custom_days">Custom Days</Label>
                <Input
                  id="custom_days"
                  type="number"
                  value={salaryData.custom_days}
                  onChange={(e) => setSalaryData(prev => ({ ...prev, custom_days: e.target.value }))}
                  placeholder="Enter number of days"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSalaryDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const amount = parseFloat(salaryData.amount);
                const customDays = salaryData.period === 'custom' ? parseInt(salaryData.custom_days) : undefined;
                if (isNaN(amount) || amount <= 0) {
                  toast({ title: 'Invalid amount', variant: 'destructive' });
                  return;
                }
                if (salaryData.period === 'custom' && (!customDays || customDays <= 0)) {
                  toast({ title: 'Invalid custom days', variant: 'destructive' });
                  return;
                }
                setSalaryMutation.mutate({
                  userId: selectedUser.user_id,
                  amount,
                  period: salaryData.period,
                  customDays,
                });
              }}
              disabled={setSalaryMutation.isPending}
            >
              {setSalaryMutation.isPending ? 'Saving...' : 'Save Salary'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
