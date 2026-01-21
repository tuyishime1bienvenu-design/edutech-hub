import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  BookOpen,
  Users,
  Edit,
  ArrowLeft,
  ArrowLeftRight,
  UserPlus,
  Building,
  FileText,
  DollarSign,
  GraduationCap,
  Clock
} from 'lucide-react';

interface Student {
  id: string;
  user_id: string;
  registration_number: string;
  school_name: string;
  level: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    full_name: string;
    phone: string;
  };
}

interface Class {
  id: string;
  name: string;
  program_id: string;
  level: string;
  shift: string;
  max_capacity: number;
  current_enrollment: number;
  trainer_id: string;
  is_active: boolean;
  program?: {
    name: string;
  };
  trainer?: {
    full_name: string;
  };
}

interface Payment {
  id: string;
  student_id: string;
  amount: number;
  status: string;
  payment_date: string;
  due_date: string;
  payment_method: string;
  created_at: string;
}

interface StudentClass {
  id: string;
  student_id: string;
  class_id: string;
  enrollment_date: string;
  status: string;
  class?: Class;
}

const StudentDetailsPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    school_name: '',
    level: '',
  });

  // Get user role for permissions
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      return data?.role || null;
    },
  });

  // Fetch student details
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          user:auth.users(
            email,
            raw_user_meta_data->full_name,
            raw_user_meta_data->phone
          )
        `)
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      return data as Student;
    },
  });

  // Fetch student classes
  const { data: studentClasses } = useQuery({
    queryKey: ['student-classes', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_classes')
        .select(`
          *,
          class:classes(
            *,
            program:programs(name),
            trainer:profiles(full_name)
          )
        `)
        .eq('student_id', studentId);
      
      if (error) throw error;
      return data as StudentClass[];
    },
  });

  // Fetch all available classes
  const { data: allClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          program:programs(name),
          trainer:profiles(full_name)
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Class[];
    },
  });

  // Fetch student payments
  const { data: payments } = useQuery({
    queryKey: ['student-payments', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Payment[];
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (formData: typeof editFormData) => {
      if (!studentId) throw new Error('Student ID required');
      
      // Update student profile
      const { error: studentError } = await supabase
        .from('students')
        .update({
          school_name: formData.school_name,
          level: formData.level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentId);

      if (studentError) throw studentError;

      // Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        }
      });

      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      setEditDialogOpen(false);
      toast({ title: 'Student updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating student', description: error.message, variant: 'destructive' });
    },
  });

  // Transfer student mutation
  const transferStudentMutation = useMutation({
    mutationFn: async (newClassId: string) => {
      if (!studentId) throw new Error('Student ID required');
      
      // Get current enrollment
      const { data: currentEnrollment } = await supabase
        .from('student_classes')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .single();

      if (currentEnrollment) {
        // Update existing enrollment
        const { error } = await supabase
          .from('student_classes')
          .update({
            class_id: newClassId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentEnrollment.id);

        if (error) throw error;
      } else {
        // Create new enrollment
        const { error } = await supabase
          .from('student_classes')
          .insert({
            student_id: studentId,
            class_id: newClassId,
            enrollment_date: new Date().toISOString().split('T')[0],
            status: 'active',
          });

        if (error) throw error;
      }

      // Update class enrollment counts
      await supabase.rpc('update_class_enrollment', { class_id: newClassId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-classes', studentId] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setTransferDialogOpen(false);
      setSelectedClass('');
      toast({ title: 'Student transferred successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error transferring student', description: error.message, variant: 'destructive' });
    },
  });

  // Check permissions
  const canEditStudent = userRole === 'admin' || userRole === 'secretary';
  const canTransferStudent = userRole === 'admin' || userRole === 'secretary' || userRole === 'trainer';
  const canAssignStudent = userRole === 'admin' || userRole === 'secretary';

  // Initialize edit form
  useEffect(() => {
    if (student) {
      setEditFormData({
        full_name: student.user?.raw_user_meta_data?.full_name || '',
        phone: student.user?.raw_user_meta_data?.phone || '',
        school_name: student.school_name,
        level: student.level,
      });
    }
  }, [student]);

  const handleEditStudent = () => {
    if (!editFormData.full_name || !editFormData.school_name || !editFormData.level) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    updateStudentMutation.mutate(editFormData);
  };

  const handleTransferStudent = () => {
    if (!selectedClass) {
      toast({ title: 'Please select a class', variant: 'destructive' });
      return;
    }
    transferStudentMutation.mutate(selectedClass);
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => navigate('/dashboard/students')} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold text-gray-900">EdTech Solutions</h1>
            <p className="text-gray-600">Professional ICT Training Center</p>
            <p className="text-sm text-gray-500">Kigali, Rwanda | info@edtech.rw | +250 788 123 456</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Student Report</p>
            <p className="text-sm text-gray-500">{format(new Date(), 'PPP')}</p>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/dashboard/students')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Students
      </Button>

      {/* Student Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            {student.user?.raw_user_meta_data?.full_name || 'N/A'}
          </h1>
          <p className="text-muted-foreground">
            Registration: {student.registration_number}
          </p>
        </div>
        <div className="flex gap-2">
          {canEditStudent && (
            <Button onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Student
            </Button>
          )}
          {canTransferStudent && (
            <Button onClick={() => setTransferDialogOpen(true)} variant="outline">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Transfer Class
            </Button>
          )}
          {canAssignStudent && (
            <Button onClick={() => setAssignDialogOpen(true)} variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Assign to Class
            </Button>
          )}
        </div>
      </motion.div>

      {/* Student Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Full Name</Label>
              <p className="font-medium">{student.user?.raw_user_meta_data?.full_name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {student.user?.email || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Phone</Label>
              <p className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {student.user?.raw_user_meta_data?.phone || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">School</Label>
              <p className="font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                {student.school_name}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Level</Label>
              <Badge variant="secondary">{student.level}</Badge>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Status</Label>
              <Badge variant={student.is_active ? 'default' : 'secondary'}>
                {student.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Current Classes</Label>
              {studentClasses && studentClasses.length > 0 ? (
                <div className="space-y-2">
                  {studentClasses.map((sc) => (
                    <div key={sc.id} className="p-3 border rounded-lg">
                      <p className="font-medium">{sc.class?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sc.class?.program?.name} - {sc.class?.level}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Trainer: {sc.class?.trainer?.full_name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Shift: {sc.class?.shift}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {sc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No classes assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          RWF {payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), 'PPP')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Method: {payment.payment_method}
                        </p>
                      </div>
                      <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No payment records</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input
                id="school_name"
                value={editFormData.school_name}
                onChange={(e) => setEditFormData({ ...editFormData, school_name: e.target.value })}
                placeholder="Enter school name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={editFormData.level}
                onValueChange={(value) => setEditFormData({ ...editFormData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L3">Level 3</SelectItem>
                  <SelectItem value="L4">Level 4</SelectItem>
                  <SelectItem value="L5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditStudent} disabled={updateStudentMutation.isPending}>
              {updateStudentMutation.isPending ? 'Updating...' : 'Update Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Class Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Student to New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select New Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {allClasses?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.program?.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransferStudent} disabled={transferStudentMutation.isPending}>
              {transferStudentMutation.isPending ? 'Transferring...' : 'Transfer Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to Class Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Student to Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {allClasses?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.program?.name} ({cls.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleTransferStudent} disabled={transferStudentMutation.isPending}>
              {transferStudentMutation.isPending ? 'Assigning...' : 'Assign to Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDetailsPage;
