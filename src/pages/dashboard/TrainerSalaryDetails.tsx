import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Banknote,
  Building,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface TrainerSalaryInfo {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  payment_channel?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  branch_code?: string | null;
  mobile_provider?: string | null;
  mobile_money_number?: string | null;
  created_at: string;
}

interface UserRole {
  role: string;
}

const TrainerSalaryDetails: React.FC = () => {
  const [trainers, setTrainers] = useState<TrainerSalaryInfo[]>([]);
  const [userRoles, setUserRoles] = useState<{ [key: string]: UserRole[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchTrainerSalaryInfo();
  }, []);

  const fetchTrainerSalaryInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles with trainer role
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, user_id')
        .eq('role', 'trainer');

      if (rolesError) throw rolesError;

      // Get trainer user IDs
      const trainerUserIds = rolesData?.map(r => r.user_id) || [];

      // Filter profiles for trainers only
      const trainerProfiles = profilesData?.filter(profile => 
        trainerUserIds.includes(profile.user_id)
      ) || [];

      // Debug logging
      console.log('All profiles:', profilesData?.length);
      console.log('Trainer roles:', rolesData?.length);
      console.log('Trainer user IDs:', trainerUserIds);
      console.log('Filtered trainer profiles:', trainerProfiles?.length);

      // Group roles by user_id
      const rolesByUser: { [key: string]: UserRole[] } = {};
      rolesData?.forEach(item => {
        if (!rolesByUser[item.user_id]) {
          rolesByUser[item.user_id] = [];
        }
        rolesByUser[item.user_id].push({ role: item.role });
      });

      setTrainers(trainerProfiles || []);
      setUserRoles(rolesByUser);
    } catch (error) {
      console.error('Error fetching trainer salary info:', error);
      toast.error('Failed to load trainer information');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPayment = paymentFilter === 'all' || 
                           (paymentFilter === 'bank' && trainer.payment_channel === 'bank') ||
                           (paymentFilter === 'mobile' && trainer.payment_channel === 'mobile');
    
    return matchesSearch && matchesPayment;
  });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Payment Channel', 'Bank Details', 'Mobile Money Details'];
    const csvContent = [
      headers.join(','),
      ...filteredTrainers.map(trainer => [
        trainer.full_name,
        trainer.email,
        trainer.phone || '',
        trainer.payment_channel || '',
        trainer.bank_name && trainer.account_name ? `${trainer.bank_name} - ${trainer.account_name} (${trainer.account_number})` : '',
        trainer.mobile_provider && trainer.mobile_money_number ? `${trainer.mobile_provider} - ${trainer.mobile_money_number}` : ''
      ].map(field => `"${field || ''}"`))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trainer_salary_details.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Trainer salary details exported successfully');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentChannelBadge = (channel: string | null) => {
    if (!channel) return <Badge variant="secondary">Not Set</Badge>;
    
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' } = {
      bank: 'default',
      mobile: 'secondary',
      cash: 'destructive'
    };
    
    return (
      <Badge variant={variants[channel] || 'secondary'} className="capitalize">
        {channel}
      </Badge>
    );
  };

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
        <h1 className="text-3xl font-bold mb-2">Trainer Salary Details</h1>
        <p className="text-muted-foreground">View trainer payment information and salary details</p>
      </div>

      {/* Filters and Export */}
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
            <div className="flex gap-2">
              <div className="w-full md:w-48">
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Types</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer) => (
          <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {trainer.avatar_url ? (
                      <img 
                        src={trainer.avatar_url} 
                        alt={trainer.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{trainer.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{trainer.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="capitalize">Trainer</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Information</h4>
                  <div className="space-y-1">
                    {trainer.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Phone:</span> {trainer.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Payment Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Payment Channel:</span>
                      {getPaymentChannelBadge(trainer.payment_channel)}
                    </div>
                    
                    {trainer.payment_channel === 'bank' && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Bank:</span> {trainer.bank_name || 'Not specified'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Account Name:</span> {trainer.account_name || 'Not specified'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Account Number:</span> {trainer.account_number || 'Not specified'}
                        </p>
                        {trainer.branch_code && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Branch Code:</span> {trainer.branch_code}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {trainer.payment_channel === 'mobile' && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Mobile Provider:</span> {trainer.mobile_provider || 'Not specified'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Mobile Number:</span> {trainer.mobile_money_number || 'Not specified'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Information */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">System Information</h4>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Joined:</span> {formatDate(trainer.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTrainers.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No trainers found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrainerSalaryDetails;
