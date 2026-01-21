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
import { ProfilePictureService } from '@/services/ProfilePictureService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Settings, 
  User, 
  Shield, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe,
  Lock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Upload,
  Camera,
  Bell,
  MessageSquare,
  CreditCard,
  Users,
  Sidebar,
  Menu,
  ShieldCheck,
  Key,
  LogOut,
  Smartphone,
  Monitor,
  Edit,
  Clock
} from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar_url?: string;
  id_number?: string;
  payment_channel?: string;
  communication_channel?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  target_roles: ("admin" | "secretary" | "trainer" | "finance" | "student")[];
  created_at: string;
  holiday_date?: string;
  is_active: boolean;
  is_holiday: boolean;
  notice_type: string;
  read_at?: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address: string;
  created_at: string;
}

interface ActiveSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string;
  ip_address: string;
  location?: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

const SettingsPage = () => {
  const { user, signOut, profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: '',
    bio: '',
    id_number: '',
    payment_channel: 'bank',
    communication_channel: 'email',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    target_roles: [] as ("admin" | "secretary" | "trainer" | "finance" | "student")[],
    expires_at: '',
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

  // Fetch activity logs
  const { data: activityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['user-activity-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user?.id,
  });

  // Fetch active sessions (mock data for now)
  const { data: activeSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['active-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Mock data - in real implementation, this would come from a sessions table
      return [
        {
          id: 'current',
          user_id: user.id,
          session_token: 'current',
          device_info: navigator.userAgent,
          ip_address: '192.168.1.100',
          location: 'Kigali, Rwanda',
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_current: true,
        },
        {
          id: 'other1',
          user_id: user.id,
          session_token: 'other1',
          device_info: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
          ip_address: '192.168.1.101',
          location: 'Kigali, Rwanda',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_activity: new Date(Date.now() - 3600000).toISOString(),
          is_current: false,
        },
      ] as ActiveSession[];
    },
    enabled: !!user?.id,
  });

  // Fetch notices created by user
  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['user-notices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as Notice[];
    },
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setEditDialogOpen(false);
      toast({ title: 'Profile updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast({ title: 'Password changed successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error changing password', description: error.message, variant: 'destructive' });
    },
  });

  // Sign out session mutation
  const signOutSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      // Mock implementation - in real app, this would revoke the session token
      console.log('Signing out session:', sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      toast({ title: 'Session signed out successfully' });
    },
  });

  const handleUpdateProfile = () => {
    if (!editForm.full_name) {
      toast({ title: 'Full name is required', variant: 'destructive' });
      return;
    }
    if (editForm.id_number && !validateIdNumber(editForm.id_number)) {
      toast({ title: 'Invalid ID number format', variant: 'destructive' });
      return;
    }
    updateProfileMutation.mutate(editForm);
  };

  const validateIdNumber = (idNumber: string) => {
    // Remove any non-digit characters
    const cleanId = idNumber.replace(/\D/g, '');
    return cleanId.length >= 16; // Rwanda ID numbers are 16 digits
  };

  const handleChangePassword = () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignOutSession = (sessionId: string) => {
    if (sessionId === 'current') {
      handleSignOut();
    } else {
      signOutSessionMutation.mutate(sessionId);
    }
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('iPhone') || userAgent.includes('Android')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (profileLoading || logsLoading || sessionsLoading) {
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
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your profile and account settings</p>
        </div>
        <Button variant="destructive" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
              Profile Information
            </h2>
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 relative">
              <AvatarImage src={userProfile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl bg-blue-500 text-white">
                {getInitials(userProfile?.full_name || 'User')}
              </AvatarFallback>
              <Button
                variant="outline"
                size="sm"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className="w-4 h-4" />
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Create live preview immediately
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const previewUrl = e.target?.result as string;
                      setAvatarPreview(previewUrl);
                    };
                    reader.readAsDataURL(file);

                    // Upload to Supabase storage
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

                      const { data, error } = await supabase.storage
                        .from('profile-pictures')
                        .upload(fileName, file, {
                          cacheControl: '3600',
                          upsert: true
                        });

                      if (error) {
                        toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
                        return;
                      }

                      // Get public URL
                      const { data: { publicUrl } } = await supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(fileName);

                      // Update user profile with new avatar URL
                      const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('user_id', user?.id);

                      if (updateError) {
                        toast({ title: 'Profile Update Error', description: updateError.message, variant: 'destructive' });
                        return;
                      }

                      toast({ title: 'Profile picture uploaded successfully!' });
                      setAvatarPreview(publicUrl);
                    } catch (error) {
                      toast({ title: 'Upload Error', description: (error as Error).message, variant: 'destructive' });
                    }
                  }
                }}
              />
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold">{userProfile?.full_name || 'User'}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              {userProfile?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Phone className="w-4 h-4" />
                  <span>{userProfile.phone}</span>
                </div>
              )}
              {userProfile?.address && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{userProfile.address}</span>
                </div>
              )}
              {userProfile?.id_number && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Shield className="w-4 h-4" />
                  <span>ID: {userProfile.id_number}</span>
                </div>
              )}
              {userProfile?.payment_channel && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment: {userProfile.payment_channel}</span>
                </div>
              )}
              {userProfile?.communication_channel && (
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Communication: {userProfile.communication_channel}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(userProfile?.created_at || ''), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
          {editForm.bio && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{editForm.bio}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
            Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">Last changed recently</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                Change Password
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Not enabled</p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Enable 2FA
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
            Active Sessions
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.device_info)}
                        <div>
                          <div className="font-medium">
                            {session.device_info.includes('iPhone') ? 'iPhone' : 
                             session.device_info.includes('Android') ? 'Android' : 'Desktop'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.ip_address}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {session.location || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {format(new Date(session.last_activity), 'MMM d, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.is_current ? (
                        <Badge className="bg-green-500">Current</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSignOutSession(session.id)}
                        className={session.is_current ? 'text-red-600 hover:text-red-700' : ''}
                      >
                        {session.is_current ? (
                          <>
                            <LogOut className="w-4 h-4 mr-1" />
                            Sign Out
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Revoke
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Activity Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg border border-gray-100"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-1 h-6 bg-orange-500 rounded-full mr-3"></div>
            Recent Activity
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </TableCell>
                    <TableCell>{log.ip_address}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userProfile?.avatar_url || ''} />
                  <AvatarFallback className="text-3xl bg-blue-500 text-white">
                    {getInitials(userProfile?.full_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">Upload a professional photo</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name *</Label>
                  <Input
                    id="full-name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Enter your address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id-number">ID Number</Label>
                  <Input
                    id="id-number"
                    value={editForm.id_number}
                    onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                    placeholder="Enter your ID number"
                    maxLength={16}
                  />
                  {editForm.id_number && (
                    <p className="text-xs text-muted-foreground">
                      {validateIdNumber(editForm.id_number) ? (
                        <span className="text-green-600">✓ Valid ID format</span>
                      ) : (
                        <span className="text-red-600">⚠ Invalid ID format (16 digits required)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Channel</Label>
                  <Select
                    value={editForm.payment_channel}
                    onValueChange={(value) => setEditForm({ ...editForm, payment_channel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="mobile">Mobile Money</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Communication Channel</Label>
                  <Select
                    value={editForm.communication_channel}
                    onValueChange={(value) => setEditForm({ ...editForm, communication_channel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select communication channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Account Details for Payment */}
              {editForm.payment_channel === 'bank' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700">Bank Account Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Bank Name</Label>
                      <Input
                        id="bank-name"
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-number">Account Number</Label>
                      <Input
                        id="account-number"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-name">Account Name</Label>
                      <Input
                        id="account-name"
                        placeholder="Enter account holder name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-code">Branch Code</Label>
                      <Input
                        id="branch-code"
                        placeholder="Enter branch code"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {editForm.payment_channel === 'mobile' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700">Mobile Money Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile-provider">Mobile Provider</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                          <SelectItem value="airtel">Airtel Money</SelectItem>
                          <SelectItem value="tigocash">Tigo Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-number">Mobile Number</Label>
                      <Input
                        id="mobile-number"
                        placeholder="Enter mobile money number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile-name">Account Name</Label>
                      <Input
                        id="mobile-name"
                        placeholder="Enter account name"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 bg-white border-t">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
