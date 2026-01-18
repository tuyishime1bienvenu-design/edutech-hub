import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
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

const AttendancePage = () => {
  const { primaryRole } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, level, shift')
        .eq('is_active', true);
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
    enabled: !!selectedClass && !!selectedDate,
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendanceData).map(([studentId, isPresent]) => ({
        class_id: selectedClass,
        student_id: studentId,
        date: selectedDate,
        is_present: isPresent,
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
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, boolean> = {};
    students?.forEach(s => {
      allPresent[s.id] = true;
    });
    setAttendanceData(allPresent);
  };

  const presentCount = Object.values(attendanceData).filter(Boolean).length;
  const absentCount = (students?.length || 0) - presentCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track and manage student attendance</p>
        </div>
      </div>

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
            Record Attendance
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
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={markAllPresent} disabled={!selectedClass}>
                Mark All Present
              </Button>
            </div>
          </div>

          {selectedClass && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {studentsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : students?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No students in this class
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {students?.map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          attendanceData[student.id]
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                        onClick={() => toggleAttendance(student.id)}
                      >
                        <div>
                          <p className="font-medium">{student.profile?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.registration_number}</p>
                        </div>
                        <Checkbox
                          checked={attendanceData[student.id] || false}
                          onCheckedChange={() => toggleAttendance(student.id)}
                        />
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => saveAttendanceMutation.mutate()}
                    disabled={saveAttendanceMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendancePage;
