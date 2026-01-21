import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Phone, 
  Mail, 
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  role: string;
}

const ProfileView: React.FC = () => {
  const { roles } = useAuth();
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [userRoles, setUserRoles] = useState<{ [key: string]: UserRole[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (roles.includes('admin') || roles.includes('finance') || roles.includes('secretary')) {
      fetchProfiles();
    }
  }, [roles]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, user_id');

      if (rolesError) throw rolesError;

      // Group roles by user_id
      const rolesByUser: { [key: string]: UserRole[] } = {};
      rolesData?.forEach(item => {
        if (!rolesByUser[item.user_id]) {
          rolesByUser[item.user_id] = [];
        }
        rolesByUser[item.user_id].push({ role: item.role });
      });

      setProfiles(profilesData || []);
      setUserRoles(rolesByUser);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const profileRoles = userRoles[profile.user_id]?.map(r => r.role) || [];
    const matchesRole = roleFilter === 'all' || profileRoles.includes(roleFilter);
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadges = (userId: string) => {
    const userRoleList = userRoles[userId]?.map(r => r.role) || [];
    return userRoleList.map(role => (
      <Badge key={role} variant={role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">
        {role}
      </Badge>
    ));
  };

  if (!roles.includes('admin') && !roles.includes('finance') && !roles.includes('secretary')) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">You don't have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Profiles</h1>
        <p className="text-muted-foreground">View and manage user profile information</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="trainer">Trainer</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                  <CardDescription>{profile.email}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {getRoleBadges(profile.user_id)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Joined: {formatDate(profile.created_at)}
                </p>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  For detailed profile information, users can edit their profiles in Settings.
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No profiles found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileView;
