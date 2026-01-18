import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Users, Building, User, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type VisitorType = 'school' | 'company' | 'individual';
type VisitPurpose = 'visit_children' | 'visit_company';

interface VisitorFormData {
  visitor_name: string;
  visitor_type: VisitorType;
  visit_purpose: VisitPurpose | '';
  school_name: string;
  company_name: string;
  student_id: string;
  reason: string;
}

const RecordVisitorPage = () => {
  const [formData, setFormData] = useState<VisitorFormData>({
    visitor_name: '',
    visitor_type: 'individual',
    visit_purpose: '',
    school_name: '',
    company_name: '',
    student_id: '',
    reason: '',
  });
  const [studentSearch, setStudentSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch students for individual visitor selection
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-visitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, registration_number, user_id')
        .eq('is_active', true)
        .order('registration_number');
      if (error) throw error;

      const userIds = data?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      return data?.map(student => ({
        ...student,
        full_name: profiles?.find(p => p.user_id === student.user_id)?.full_name || 'Unknown',
      }));
    },
  });

  // Fetch schools for school visitor selection
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools-for-visitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('school_name')
        .not('school_name', 'is', null)
        .not('school_name', 'eq', '');
      if (error) throw error;

      // Get unique school names
      const uniqueSchools = [...new Set(data?.map(s => s.school_name))].filter(Boolean);
      return uniqueSchools.sort();
    },
  });

  const filteredStudents = students?.filter(student =>
    student.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.registration_number?.toLowerCase().includes(studentSearch.toLowerCase())
  ) || [];

  const recordVisitorMutation = useMutation({
    mutationFn: async (data: VisitorFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const visitorData = {
        visitor_name: data.visitor_name,
        visitor_type: data.visitor_type,
        visit_purpose: data.visit_purpose || null,
        school_name: data.visitor_type === 'school' ? data.school_name : null,
        company_name: data.visitor_type === 'company' ? data.company_name : null,
        student_id: data.visitor_type === 'individual' && data.visit_purpose === 'visit_children' ? data.student_id : null,
        reason: data.reason,
        recorded_by: user.user.id,
      };

      const { error } = await supabase
        .from('visitors')
        .insert(visitorData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      setFormData({
        visitor_name: '',
        visitor_type: 'individual',
        visit_purpose: '',
        school_name: '',
        company_name: '',
        student_id: '',
        reason: '',
      });
      setStudentSearch('');
      toast({ title: 'Visitor recorded successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error recording visitor', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.visitor_name.trim()) {
      toast({ title: 'Please enter visitor name', variant: 'destructive' });
      return;
    }

    if (formData.visitor_type === 'school' && !formData.school_name.trim()) {
      toast({ title: 'Please select a school', variant: 'destructive' });
      return;
    }

    if (formData.visitor_type === 'company' && !formData.company_name.trim()) {
      toast({ title: 'Please enter company name', variant: 'destructive' });
      return;
    }

    if (formData.visitor_type === 'individual') {
      if (!formData.visit_purpose) {
        toast({ title: 'Please select visit purpose', variant: 'destructive' });
        return;
      }
      if (formData.visit_purpose === 'visit_children' && !formData.student_id) {
        toast({ title: 'Please select a student', variant: 'destructive' });
        return;
      }
    }

    recordVisitorMutation.mutate(formData);
  };

  const getVisitorTypeIcon = (type: VisitorType) => {
    switch (type) {
      case 'school': return <Users className="w-5 h-5" />;
      case 'company': return <Building className="w-5 h-5" />;
      case 'individual': return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Record Visitor</h1>
        <p className="text-muted-foreground">Record visitor information and purpose of visit</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Visitor Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Visitor Name */}
              <div>
                <Label htmlFor="visitor_name">Visitor Name *</Label>
                <Input
                  id="visitor_name"
                  value={formData.visitor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, visitor_name: e.target.value }))}
                  placeholder="Enter visitor's full name"
                  required
                />
              </div>

              {/* Visitor Type */}
              <div>
                <Label htmlFor="visitor_type">Visitor Type *</Label>
                <Select
                  value={formData.visitor_type}
                  onValueChange={(value: VisitorType) => setFormData(prev => ({
                    ...prev,
                    visitor_type: value,
                    visit_purpose: '',
                    school_name: '',
                    company_name: '',
                    student_id: '',
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        School Visitor
                      </div>
                    </SelectItem>
                    <SelectItem value="company">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Company Visitor
                      </div>
                    </SelectItem>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Individual Visitor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Fields Based on Visitor Type */}
              {formData.visitor_type === 'school' && (
                <div>
                  <Label htmlFor="school_name">School Name *</Label>
                  <Select
                    value={formData.school_name}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, school_name: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : (
                        schools?.map((school) => (
                          <SelectItem key={school} value={school}>
                            {school}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    All students from this school will be marked as visited
                  </p>
                </div>
              )}

              {formData.visitor_type === 'company' && (
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Enter company name"
                    required
                  />
                </div>
              )}

              {formData.visitor_type === 'individual' && (
                <>
                  <div>
                    <Label htmlFor="visit_purpose">Visit Purpose *</Label>
                    <Select
                      value={formData.visit_purpose}
                      onValueChange={(value: VisitPurpose) => setFormData(prev => ({
                        ...prev,
                        visit_purpose: value,
                        student_id: '',
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visit_children">Visiting Children</SelectItem>
                        <SelectItem value="visit_company">Visiting Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.visit_purpose === 'visit_children' && (
                    <div>
                      <Label htmlFor="student_search">Select Student *</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="student_search"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          placeholder="Search students by name or registration number"
                          className="pl-9"
                        />
                      </div>
                      <Select
                        value={formData.student_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentsLoading ? (
                            <div className="flex items-center justify-center p-4">
                              <LoadingSpinner size="sm" />
                            </div>
                          ) : (
                            filteredStudents.map((student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.full_name} ({student.registration_number})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Visit Reason</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter the reason for the visit"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={recordVisitorMutation.isPending}
                  className="min-w-[120px]"
                >
                  {recordVisitorMutation.isPending ? 'Recording...' : 'Record Visitor'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RecordVisitorPage;