import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, School, Phone, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseService } from '@/integrations/supabase/service-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const RegisterStudentPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    schoolName: '',
    level: 'L3' as 'L3' | 'L4' | 'L5',
    preferredShift: 'morning' as 'morning' | 'afternoon',
    hasWhatsapp: false,
    alternativeWhatsapp: '',
    classId: 'unassigned' as string,
  });

  const [registrationComplete, setRegistrationComplete] = useState<{
    regNumber: string;
    password: string;
    email: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: classes = [] } = useQuery({
    queryKey: ['available-classes', formData.level, formData.preferredShift],
    queryFn: async () => {
      const { data, error } = await supabaseService
        .from('classes')
        .select('id, name, level, shift, current_enrollment, max_capacity')
        .eq('is_active', true)
        .eq('level', formData.level)
        .eq('shift', formData.preferredShift);

      if (error) throw error;

      return (data ?? []).filter(
        c => (c.current_enrollment || 0) < c.max_capacity
      );
    },
    enabled: !!formData.level && !!formData.preferredShift,
  });

  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EDT${year}${random}`;
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  };

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const regNumber = generateRegistrationNumber();
      const password = generatePassword();

      // Step 1: Create auth user using the Edge Function
      const { data: authResult, error: authError } = await supabase.functions.invoke(
        'create-admin-user',
        {
          body: {
            email: data.email,
            password,
            fullName: data.fullName,
            phone: data.phone,
            role: 'student',
          },
        }
      );

      if (authError) throw authError;
      if (!authResult?.success) {
        throw new Error(authResult?.message || 'Failed to create user account');
      }

      const userId = authResult.userId;

      // Step 2: Insert student record in students table
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          registration_number: regNumber,
          school_name: data.schoolName,
          level: data.level,
          preferred_shift: data.preferredShift,
          has_whatsapp: data.hasWhatsapp,
          alternative_whatsapp: data.alternativeWhatsapp || null,
          class_id: data.classId === 'unassigned' ? null : data.classId,
          generated_password: password,
          is_active: true,
        });

      if (studentError) {
        throw new Error(`Failed to create student record: ${studentError.message}`);
      }

      // Step 3: Update class enrollment if assigned
      if (data.classId !== 'unassigned') {
        // Manually increment enrollment
        const { data: classData } = await supabase
          .from('classes')
          .select('current_enrollment')
          .eq('id', data.classId)
          .single();
        
        if (classData) {
          await supabase
            .from('classes')
            .update({ current_enrollment: (classData.current_enrollment || 0) + 1 })
            .eq('id', data.classId);
        }
      }

      return { regNumber, password, email: data.email };
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRegistrationComplete(result);
      toast({ title: 'Student registered successfully!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      schoolName: '',
      level: 'L3',
      preferredShift: 'morning',
      hasWhatsapp: false,
      alternativeWhatsapp: '',
      classId: 'unassigned',
    });
    setRegistrationComplete(null);
  };

  if (registrationComplete) {
    return (
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Registration Complete!</CardTitle>
              <CardDescription className="text-base">
                Please save these credentials and share them with the student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Registration Number</Label>
                  <p className="font-mono font-bold text-lg">{registrationComplete.regNumber}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{registrationComplete.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                  <p className="font-mono font-bold text-lg bg-yellow-50 px-3 py-2 rounded border border-yellow-200">
                    {registrationComplete.password}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ The student should change this password after first login
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={resetForm}>
                Register Another Student
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <UserPlus className="w-6 h-6" />
              Register New Student
            </CardTitle>
            <CardDescription>
              Fill in the student's information to create their account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="078XXXXXXX"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName" className="flex items-center gap-2">
                      <School className="w-4 h-4" />
                      School Name *
                    </Label>
                    <Input
                      id="schoolName"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="Name of school"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="hasWhatsapp"
                    checked={formData.hasWhatsapp}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasWhatsapp: checked as boolean })
                    }
                  />
                  <Label htmlFor="hasWhatsapp" className="cursor-pointer">
                    This phone number has WhatsApp
                  </Label>
                </div>

                {!formData.hasWhatsapp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="alternativeWhatsapp">Alternative WhatsApp Number</Label>
                    <Input
                      id="alternativeWhatsapp"
                      type="tel"
                      value={formData.alternativeWhatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, alternativeWhatsapp: e.target.value })
                      }
                      placeholder="078XXXXXXX"
                    />
                  </motion.div>
                )}
              </div>

              {/* Academic Information */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <School className="w-5 h-5 text-primary" />
                  Academic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Education Level *</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) =>
                        setFormData({ ...formData, level: value as 'L3' | 'L4' | 'L5', classId: 'unassigned' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L3">L3 - Secondary Education</SelectItem>
                        <SelectItem value="L4">L4 - Advanced Secondary</SelectItem>
                        <SelectItem value="L5">L5 - TVET/Higher Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Shift *</Label>
                    <Select
                      value={formData.preferredShift}
                      onValueChange={(value) =>
                        setFormData({ ...formData, preferredShift: value as 'morning' | 'afternoon', classId: 'unassigned' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning Shift</SelectItem>
                        <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Class Assignment */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Class Assignment
                  </h3>

                  <div className="space-y-2">
                    <Label>Assign to Class (Optional)</Label>
                    <Select
                      value={formData.classId}
                      onValueChange={(value) => setFormData({ ...formData, classId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">No class (assign later)</SelectItem>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.current_enrollment || 0}/{c.max_capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {classes.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No available classes for selected level and shift
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Registering...' : 'Register Student'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterStudentPage;