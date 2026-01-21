import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  BarChart3,
  PieChart,
  Users,
  GraduationCap,
  DollarSign,
  CreditCard,
  Download,
  Filter,
  CheckCircle,
  Building,
  MessageSquare,
  UserPlus
} from 'lucide-react';

interface SystemStats {
  totalStudents: number;
  totalClasses: number;
  totalPrograms: number;
  totalPayments: number;
  totalRevenue: number;
  attendanceRate: number;
  activeUsers: number;
  totalMessages: number;
  totalVisitors: number;
  totalEquipment: number;
  totalMaterials: number;
}

const ReportsPage = () => {
  const { user, primaryRole } = useAuth();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState('overview');

  // Check if user can view reports (admin)
  const canViewReports = primaryRole === 'admin';

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          start: format(now, 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'week':
        return {
          start: format(subDays(now, 7), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd')
        };
      case 'month':
        return {
          start: format(startOfMonth(now), 'yyyy-MM-dd'),
          end: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return {
          start: format(quarterStart, 'yyyy-MM-dd'),
          end: format(quarterEnd, 'yyyy-MM-dd')
        };
      case 'year':
        return {
          start: format(startOfYear(now), 'yyyy-MM-dd'),
          end: format(endOfYear(now), 'yyyy-MM-dd')
        };
      default:
        return { start: startDate, end: endDate };
    }
  };

  const dateRangeValues = getDateRange();

  // Fetch system statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['system-stats', dateRangeValues.start, dateRangeValues.end],
    queryFn: async () => {
      if (!canViewReports) return null;

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('id, is_active, level')
        .eq('is_active', true);

      // Fetch classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, is_active')
        .eq('is_active', true);

      // Fetch programs
      const { data: programs } = await supabase
        .from('programs')
        .select('id, is_active');

      // Fetch payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .gte('created_at', dateRangeValues.start)
        .lte('created_at', dateRangeValues.end + ' 23:59:59');

      // Fetch attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('is_present')
        .gte('date', dateRangeValues.start)
        .lte('date', dateRangeValues.end);

      // Fetch users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');

      // Fetch messages
      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id')
        .gte('created_at', dateRangeValues.start)
        .lte('created_at', dateRangeValues.end + ' 23:59:59');

      // Calculate statistics
      const totalStudents = students?.length || 0;
      const totalClasses = classes?.length || 0;
      const totalPrograms = programs?.length || 0;
      const totalPayments = payments?.length || 0;
      const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;
      const attendanceRecords = attendance?.length || 0;
      const presentAttendance = attendance?.filter(a => a.is_present).length || 0;
      const attendanceRate = attendanceRecords > 0 ? Math.round((presentAttendance / attendanceRecords) * 100) : 0;
      const activeUsers = profiles?.length || 0;
      const totalMessages = messages?.length || 0;
      const totalVisitors = 0; // Simplified for now
      const totalEquipment = 0; // Simplified for now
      const totalMaterials = 0; // Simplified for now

      return {
        totalStudents,
        totalClasses,
        totalPrograms,
        totalPayments,
        totalRevenue,
        attendanceRate,
        activeUsers,
        totalMessages,
        totalVisitors,
        totalEquipment,
        totalMaterials
      } as SystemStats;
    },
    enabled: canViewReports,
  });

  // Fetch student distribution by level
  const { data: studentLevelData } = useQuery({
    queryKey: ['student-level-distribution'],
    queryFn: async () => {
      if (!canViewReports) return [];

      const { data: students } = await supabase
        .from('students')
        .select('level')
        .eq('is_active', true);

      const levelCounts = students?.reduce((acc, student) => {
        acc[student.level] = (acc[student.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(levelCounts).map(([level, count]) => ({
        name: level,
        value: count,
        color: level === 'L3' ? '#3b82f6' : level === 'L4' ? '#10b981' : '#8b5cf6'
      }));
    },
    enabled: canViewReports,
  });

  // Fetch payment status distribution
  const { data: paymentStatusData } = useQuery({
    queryKey: ['payment-status-distribution', dateRangeValues.start, dateRangeValues.end],
    queryFn: async () => {
      if (!canViewReports) return [];

      const { data: payments } = await supabase
        .from('payments')
        .select('status')
        .gte('created_at', dateRangeValues.start)
        .lte('created_at', dateRangeValues.end + ' 23:59:59');

      const statusCounts = payments?.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: status === 'paid' ? '#10b981' : status === 'pending' ? '#f59e0b' : '#8b5cf6'
      }));
    },
    enabled: canViewReports,
  });

  // Export reports
  const exportReports = () => {
    if (!stats) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    const csvContent = [
      'Report Type,Total Value,Period',
      `Students,${stats.totalStudents},${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Classes,${stats.totalClasses},${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Programs,${stats.totalPrograms},${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Payments,${stats.totalPayments},${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Revenue,RWF ${stats.totalRevenue.toLocaleString()},${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Attendance Rate,${stats.attendanceRate}%,${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Active Users,${stats.activeUsers},${dateRangeValues.start} to ${dateRangeValues.end}`,
      `Messages,${stats.totalMessages},${dateRangeValues.start} to ${dateRangeValues.end}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'System reports exported successfully' });
  };

  if (!canViewReports) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view system reports. Only admins can access reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">System Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights across all system areas
            </p>
          </div>
        </div>
        <Button onClick={exportReports} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Reports
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Custom Range</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="academics">Academics</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {statsLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalClasses}</p>
                    <p className="text-sm text-muted-foreground">Active Classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">RWF {stats.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Student Distribution by Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentLevelData?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              backgroundColor: item.color,
                              width: `${stats.totalStudents > 0 ? (item.value / stats.totalStudents) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentStatusData?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              backgroundColor: item.color,
                              width: `${stats.totalPayments > 0 ? (item.value / stats.totalPayments) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Building className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeUsers}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalMessages}</p>
                    <p className="text-sm text-muted-foreground">Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <UserPlus className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPrograms}</p>
                    <p className="text-sm text-muted-foreground">Programs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalPayments}</p>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;