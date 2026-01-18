import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, Download, Eye, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import CertificateDisplay from '@/components/certificates/CertificateDisplay';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

interface StudentWithPayment {
  id: string;
  registration_number: string;
  user_id: string;
  level: string;
  profile: {
    full_name: string;
    email: string;
  } | null;
  classes: {
    name: string;
    programs?: {
      name: string;
      start_date: string;
      end_date: string;
    } | null;
  } | null;
  total_fees: number;
  total_paid: number;
  is_fully_paid: boolean;
  has_certificate: boolean;
}

const CertificatesPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPayment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get active certificate template
  const { data: activeTemplate } = useQuery({
    queryKey: ['active-certificate-template'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Get students with payment status
  const { data: students, isLoading } = useQuery({
    queryKey: ['students-for-certificates', levelFilter],
    queryFn: async () => {
      // Get all students
      let query = supabase
        .from('students')
        .select(`
          id,
          registration_number,
          user_id,
          level,
          classes (
            name,
            programs (
              name,
              start_date,
              end_date
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }

      const { data: studentsData, error: studentsError } = await query;
      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        return [];
      }

      // Get profiles
      const userIds = studentsData.map(s => s.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Get fee structures for each student
      const studentIds = studentsData.map(s => s.id);
      const { data: feeStructures } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('is_active', true);

      // Get payments for each student
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, amount, payment_type, status')
        .in('student_id', studentIds)
        .eq('status', 'paid');

      // Get issued certificates
      const { data: issuedCertificates } = await supabase
        .from('issued_certificates')
        .select('student_id')
        .in('student_id', studentIds);

      const certificateStudentIds = new Set(issuedCertificates?.map(c => c.student_id) || []);

      // Calculate payment status for each student
      return studentsData.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id) || null;
        const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
        
        // Calculate total fees based on student's level and program
        let totalFees = 0;
        const program = student.classes?.programs;
        if (program && feeStructures) {
          const relevantFee = feeStructures.find(
            f => (f.program_id === null || f.program_id === program.id) &&
                 (f.level === null || f.level === student.level)
          );
          if (relevantFee) {
            totalFees = Number(relevantFee.registration_fee) + Number(relevantFee.internship_fee);
          }
        } else if (feeStructures) {
          // Fallback to level-based fee
          const levelFee = feeStructures.find(f => f.level === student.level && f.program_id === null);
          if (levelFee) {
            totalFees = Number(levelFee.registration_fee) + Number(levelFee.internship_fee);
          }
        }

        const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const isFullyPaid = totalPaid >= totalFees && totalFees > 0;
        const hasCertificate = certificateStudentIds.has(student.id);

        return {
          ...student,
          profile,
          total_fees: totalFees,
          total_paid: totalPaid,
          is_fully_paid: isFullyPaid,
          has_certificate: hasCertificate,
        };
      });
    },
  });

  const generateCertificateMutation = useMutation({
    mutationFn: async (student: StudentWithPayment) => {
      if (!activeTemplate) {
        throw new Error('No active certificate template found');
      }

      // Check if certificate already exists
      const { data: existing } = await supabase
        .from('issued_certificates')
        .select('id')
        .eq('student_id', student.id)
        .single();

      if (existing) {
        throw new Error('Certificate already issued for this student');
      }

      // Generate certificate number
      const year = new Date().getFullYear();
      const random = Math.floor(10000 + Math.random() * 90000);
      const certificateNumber = `CERT-${year}-${random}`;

      // Create certificate record
      const { error } = await supabase
        .from('issued_certificates')
        .insert({
          student_id: student.id,
          certificate_template_id: activeTemplate.id,
          certificate_number: certificateNumber,
          issued_date: new Date().toISOString().split('T')[0],
          issued_by: user?.id,
        });

      if (error) throw error;
      return certificateNumber;
    },
    onSuccess: (certificateNumber) => {
      queryClient.invalidateQueries({ queryKey: ['students-for-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['issued-certificates'] });
      toast({
        title: 'Certificate generated successfully',
        description: `Certificate number: ${certificateNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error generating certificate',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredStudents = students?.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.profile?.full_name?.toLowerCase().includes(searchLower) ||
      student.registration_number?.toLowerCase().includes(searchLower)
    );
  });

  const eligibleStudents = filteredStudents?.filter(s => s.is_fully_paid && !s.has_certificate);

  const { paginatedData, currentPage, totalPages, goToPage, nextPage, previousPage, hasNextPage, hasPreviousPage, totalItems } = usePagination({
    data: filteredStudents || [],
    itemsPerPage: 10,
  });

  const handlePreview = (student: StudentWithPayment) => {
    setSelectedStudent(student);
    setIsPreviewOpen(true);
  };

  const handleGenerate = (student: StudentWithPayment) => {
    if (!student.is_fully_paid) {
      toast({
        title: 'Cannot generate certificate',
        description: 'Student has not fully paid all fees',
        variant: 'destructive',
      });
      return;
    }
    generateCertificateMutation.mutate(student);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Certificates</h1>
          <p className="text-muted-foreground">Generate certificates for students who have fully paid</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="L3">L3</SelectItem>
            <SelectItem value="L4">L4</SelectItem>
            <SelectItem value="L5">L5</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Eligible for Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{eligibleStudents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {filteredStudents?.filter(s => s.has_certificate).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Registration Number</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Certificate Status</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{student.profile?.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.registration_number}</TableCell>
                  <TableCell>
                    <Badge>{student.level}</Badge>
                  </TableCell>
                  <TableCell>
                    {student.is_fully_paid ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Fully Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="w-3 h-3 mr-1" />
                        {student.total_paid > 0 ? 'Partial' : 'Not Paid'}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {student.total_paid.toLocaleString()} / {student.total_fees.toLocaleString()} RWF
                    </p>
                  </TableCell>
                  <TableCell>
                    {student.has_certificate ? (
                      <Badge className="bg-blue-100 text-blue-800">Issued</Badge>
                    ) : (
                      <Badge variant="secondary">Not Issued</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {student.is_fully_paid && !student.has_certificate && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(student)}
                          disabled={generateCertificateMutation.isPending}
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                      )}
                      {student.has_certificate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(student)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNext={nextPage}
          onPrevious={previousPage}
          hasNext={hasNextPage}
          hasPrevious={hasPreviousPage}
          totalItems={totalItems}
          itemsPerPage={10}
        />
      </motion.div>

      {/* Certificate Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          {selectedStudent && activeTemplate && (
            <CertificateDisplay
              student={selectedStudent}
              template={activeTemplate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificatesPage;
