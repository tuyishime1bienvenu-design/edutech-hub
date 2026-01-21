import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Clock, Users, Download, Filter, Search } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const AttendancePage = () => {
  const { user, primaryRole } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'mark' | 'report'>('mark');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Determine if user can mark attendance (trainers) or only view (admins)
  const canMarkAttendance = primaryRole === 'trainer';
  const canViewReports = primaryRole === 'admin' || primaryRole === 'secretary';

  const { data: classes } = useQuery({
    queryKey: ['classes', primaryRole, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select('id, name, level, shift, trainer_id')
        .eq('is_active', true);
      
      // If trainer, only show classes assigned to them
      if (primaryRole === 'trainer' && user?.id) {
        query = query.eq('trainer_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from('students')
        .select('id, registration_number, user_id')
        .eq('class_id', selectedClass)
        .eq('is_active', true);
      if (error) throw error;
      
      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      return data?.map(s => ({
        ...s,
        profile: profiles?.find(p => p.user_id === s.user_id)
      }));
    },
    enabled: !!selectedClass,
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, is_present')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);
      if (error) throw error;
      
      const attendanceMap: Record<string, boolean> = {};
      data?.forEach(a => {
        attendanceMap[a.student_id] = a.is_present ?? false;
      });
      setAttendanceData(attendanceMap);
      return data;
    },
    enabled: !!selectedClass && !!selectedDate && viewMode === 'mark',
  });

  // Admin attendance report with date range filtering
  const { data: attendanceReport, isLoading: reportLoading } = useQuery({
    queryKey: ['attendance-report', selectedClass, startDate, endDate, searchTerm],
    queryFn: async () => {
      if (!canViewReports) return [];
      
      let query = supabase
        .from('attendance')
        .select(`
          id,
          date,
          is_present,
          student_id,
          class_id,
          recorded_by,
          students!inner(
            registration_number,
            user_id,
            is_active
          ),
          classes!inner(
            name,
            level,
            shift,
            programs!inner(
              name
            )
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedClass) {
        query = query.eq('class_id', selectedClass);
      }

      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data?.map(a => a.students?.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Combine data
      return data?.map(record => ({
        ...record,
        students: {
          ...record.students,
          profiles: profiles?.find(p => p.user_id === record.students?.user_id)
        }
      }));
    },
    enabled: canViewReports && viewMode === 'report',
  });

  // Attendance statistics for admin
  const { data: attendanceStats } = useQuery({
    queryKey: ['attendance-stats', selectedClass, startDate, endDate],
    queryFn: async () => {
      if (!canViewReports) return null;
      
      let query = supabase
        .from('attendance')
        .select('is_present')
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedClass) {
        query = query.eq('class_id', selectedClass);
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const present = data?.filter(a => a.is_present).length || 0;
      const absent = total - present;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      return { total, present, absent, rate };
    },
    enabled: canViewReports && viewMode === 'report',
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      // Only trainers can mark attendance
      if (!canMarkAttendance) {
        throw new Error('Only trainers can mark attendance');
      }
      
      const records = Object.entries(attendanceData).map(([studentId, isPresent]) => ({
        class_id: selectedClass,
        student_id: studentId,
        date: selectedDate,
        is_present: isPresent,
        recorded_by: user?.id,
      }));

      // First, delete existing records for this class and date
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      // Then insert new records
      const { error } = await supabase.from('attendance').insert(records);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Attendance saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving attendance', description: error.message, variant: 'destructive' });
    },
  });

  const toggleAttendance = (studentId: string) => {
    // Only trainers can toggle attendance
    if (!canMarkAttendance) return;
    
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAllPresent = () => {
    // Only trainers can mark attendance
    if (!canMarkAttendance) return;
    
    const allPresent: Record<string, boolean> = {};
    students?.forEach(s => {
      allPresent[s.id] = true;
    });
    setAttendanceData(allPresent);
  };

  const markAllAbsent = () => {
    // Only trainers can mark attendance
    if (!canMarkAttendance) return;
    
    const allAbsent: Record<string, boolean> = {};
    students?.forEach(s => {
      allAbsent[s.id] = false;
    });
    setAttendanceData(allAbsent);
  };

  const exportAttendanceReport = () => {
    if (!attendanceReport || attendanceReport.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Student Name', 'Registration Number', 'Class', 'Program', 'Level', 'Status'];
    const csvContent = [
      headers.join(','),
      ...attendanceReport.map(record => [
        format(new Date(record.date), 'yyyy-MM-dd'),
        record.students?.profiles?.full_name || 'N/A',
        record.students?.registration_number || 'N/A',
        record.classes?.name || 'N/A',
        record.classes?.programs?.name || 'N/A',
        record.classes?.level || 'N/A',
        record.is_present ? 'Present' : 'Absent'
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Attendance report exported successfully' });
  };

  const presentCount = Object.values(attendanceData).filter(Boolean).length;
  const absentCount = (students?.length || 0) - presentCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-muted-foreground">
            {primaryRole === 'trainer' 
              ? 'Mark and manage attendance for your classes' 
              : 'View attendance reports across classes'}
          </p>
        </div>
        
        {/* View Mode Toggle for Admins */}
        {canViewReports && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'mark' ? 'default' : 'outline'}
              onClick={() => setViewMode('mark')}
              disabled={!canMarkAttendance}
            >
              Mark Attendance
            </Button>
            <Button
              variant={viewMode === 'report' ? 'default' : 'outline'}
              onClick={() => setViewMode('report')}
            >
              View Reports
            </Button>
          </div>
        )}
      </div>

      {/* Admin Report Filters */}
      {canViewReports && viewMode === 'report' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Student name or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={exportAttendanceReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Statistics */}
      {canViewReports && viewMode === 'report' && attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceStats.present}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceStats.absent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceStats.rate}%</p>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'mark' && (
        <>
          {/* Trainer Attendance Marking UI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{students?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{presentCount}</p>
                    <p className="text-sm text-muted-foreground">Present</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{absentCount}</p>
                    <p className="text-sm text-muted-foreground">Absent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Mark Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Select Class</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.level} - {c.shift})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                {canMarkAttendance && (
                  <div className="flex items-end gap-2">
                    <Button variant="outline" onClick={markAllPresent} disabled={!selectedClass}>
                      Mark All Present
                    </Button>
                    <Button variant="outline" onClick={markAllAbsent} disabled={!selectedClass}>
                      Mark All Absent
                    </Button>
                  </div>
                )}
              </div>

              {selectedClass && (
                <div className="space-y-4">
                  {studentsLoading ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : students && students.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students.map((student) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{student.profile?.full_name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{student.registration_number}</p>
                            </div>
                            <Checkbox
                              checked={attendanceData[student.id] || false}
                              onCheckedChange={() => toggleAttendance(student.id)}
                              disabled={!canMarkAttendance}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No students found in this class</p>
                  )}

                  {canMarkAttendance && (
                    <div className="flex justify-end">
                      <Button onClick={() => saveAttendanceMutation.mutate()} disabled={saveAttendanceMutation.isPending}>
                        {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {viewMode === 'report' && canViewReports && (
        <>
          {/* Admin Report Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Attendance Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : attendanceReport && attendanceReport.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceReport.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{record.students?.profiles?.full_name || 'N/A'}</TableCell>
                          <TableCell>{record.students?.registration_number || 'N/A'}</TableCell>
                          <TableCell>{record.classes?.name || 'N/A'}</TableCell>
                          <TableCell>{record.classes?.programs?.name || 'N/A'}</TableCell>
                          <TableCell>{record.classes?.level || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={record.is_present ? 'default' : 'secondary'}>
                              {record.is_present ? 'Present' : 'Absent'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No attendance records found for the selected criteria</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendancePage;