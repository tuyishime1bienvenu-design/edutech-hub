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
  Calendar, 
  MapPin, 
  Book, 
  Briefcase, 
  Award,
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
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
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

  if (selectedProfile) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedProfile(null)}
            className="mb-4"
          >
            ← Back to Profiles
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedProfile.full_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Mail className="h-4 w-4" />
                    {selectedProfile.email}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {getRoleBadges(selectedProfile.user_id)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {selectedProfile.phone || 'Not specified'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                  <p className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedProfile.date_of_birth)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <p className="mt-1 capitalize">{selectedProfile.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">National ID</label>
                  <p className="mt-1">{selectedProfile.national_id || 'Not specified'}</p>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {selectedProfile.address || 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                  <p className="mt-1">{selectedProfile.emergency_contact_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                  <p className="mt-1">{selectedProfile.emergency_contact_phone || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education & Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Education & Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Education Level</label>
                  <p className="mt-1 capitalize">{selectedProfile.education_level || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Previous School</label>
                  <p className="mt-1">{selectedProfile.previous_school || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Work Experience</label>
                <p className="mt-1 whitespace-pre-wrap">{selectedProfile.work_experience || 'Not specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                  selectedProfile.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">{skill}</Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No skills specified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedProfile.linkedin_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">LinkedIn</label>
                    <p className="mt-1">
                      <a href={selectedProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedProfile.linkedin_url}
                      </a>
                    </p>
                  </div>
                )}
                {selectedProfile.portfolio_url && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Portfolio</label>
                    <p className="mt-1">
                      <a href={selectedProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedProfile.portfolio_url}
                      </a>
                    </p>
                  </div>
                )}
                {!selectedProfile.linkedin_url && !selectedProfile.portfolio_url && (
                  <p className="text-muted-foreground">No professional links specified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {selectedProfile.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{selectedProfile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Profile Created</label>
                  <p className="mt-1">{formatDate(selectedProfile.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="mt-1">{formatDate(selectedProfile.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
                {profile.education_level && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Book className="h-3 w-3" />
                    {profile.education_level}
                  </p>
                )}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => setSelectedProfile(profile)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </Button>
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
