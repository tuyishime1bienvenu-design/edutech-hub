import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Award,
  Palette,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Download,
  Users,
  DollarSign,
  Bell,
  MessageSquare,
  FileText,
  Settings,
  Plus,
  Trash2,
  Copy,
  Save,
  Upload,
  Image as ImageIcon,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';

interface CertificateTemplate {
  id: string;
  name: string;
  type: 'student' | 'employment';
  design_data: any;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  level: string;
  status: string;
  total_fees: number;
  paid_amount: number;
  balance: number;
  certificate_generated: boolean;
  certificate_generated_at?: string;
}

interface NotificationRecord {
  id: string;
  student_id: string;
  type: 'email' | 'whatsapp';
  message: string;
  amount_due: number;
  payment_code: string;
  sent_at: string;
  sent_by: string;
  status: 'sent' | 'failed';
}

const CertificatesPage = () => {
  const { user, primaryRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [designDialogOpen, setDesignDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  
  // Certificate design state
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'student' | 'employment'>('student');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#000000');
  const [titleText, setTitleText] = useState('Certificate of Completion');
  const [subtitleText, setSubtitleText] = useState('This is to certify that');
  const [studentNameText, setStudentNameText] = useState('[Student Name]');
  const [courseText, setCourseText] = useState('has successfully completed');
  const [dateText, setDateText] = useState('[Date]');
  const [signatureText, setSignatureText] = useState('Director Signature');
  const [fontSize, setFontSize] = useState(16);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  const canManageCertificates = ['admin', 'secretary', 'finance'].includes(primaryRole || '');

  // Fetch certificate templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      if (!canManageCertificates) return [];

      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: canManageCertificates,
  });

  // Fetch students with payment status
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-payment-status'],
    queryFn: async () => {
      if (!canManageCertificates) return [];

      const { data: studentData, error } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          level,
          status,
          certificate_generated,
          certificate_generated_at
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Get payment information for each student
      const studentsWithPayments = await Promise.all(
        studentData?.map(async (student) => {
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('student_id', student.id)
            .eq('status', 'paid');

          const totalPaid = payments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()),0) || 0;
          const totalFees = 500000; // Default fee for demo
          const balance = totalFees - totalPaid;

          return {
            ...student,
            total_fees: totalFees,
            paid_amount: totalPaid,
            balance: balance,
            certificate_generated: student.certificate_generated || false
          };
        }) || []
      );

      return studentsWithPayments;
    },
    enabled: canManageCertificates,
  });

  // Fetch notification records
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['payment-notifications'],
    queryFn: async () => {
      if (!canManageCertificates) return [];

      const { data, error } = await supabase
        .from('payment_notifications')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: canManageCertificates,
  });

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      if (!canManageCertificates) throw new Error('Permission denied');

      const designData = {
        backgroundColor,
        textColor,
        titleText,
        subtitleText,
        studentNameText,
        courseText,
        dateText,
        signatureText,
        fontSize,
        textAlign
      };

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('certificate_templates')
          .update({
            name: templateName,
            type: templateType,
            design_data: designData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('certificate_templates')
          .insert({
            name: templateName,
            type: templateType,
            design_data: designData
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast({ title: 'Template saved successfully' });
      setDesignDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error) => {
      toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    },
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async (studentId: string) => {
      if (!canManageCertificates) throw new Error('Permission denied');

      const { error } = await supabase
        .from('students')
        .update({
          certificate_generated: true,
          certificate_generated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-payment-status'] });
      toast({ title: 'Certificate generated successfully' });
      setGenerateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: 'Error generating certificate', description: error.message, variant: 'destructive' });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async ({ studentId, message, paymentCode }: { studentId: string; message: string; paymentCode: string }) => {
      if (!canManageCertificates) throw new Error('Permission denied');

      const student = students?.find(s => s.id === studentId);
      if (!student) throw new Error('Student not found');

      // Save notification record
      const { error: dbError } = await supabase
        .from('payment_notifications')
        .insert({
          student_id: studentId,
          type: 'whatsapp',
          message,
          amount_due: student.balance,
          payment_code: paymentCode,
          sent_by: user?.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      // Here you would integrate with WhatsApp API
      // For now, just simulate the API call
      console.log('Sending WhatsApp to:', student.phone, 'Message:', message);
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-notifications'] });
      toast({ title: 'Notification sent successfully' });
      setNotificationDialogOpen(false);
      setSelectedStudent(null);
      setMessage('');
      setPaymentCode('');
    },
    onError: (error) => {
      toast({ title: 'Error sending notification', description: error.message, variant: 'destructive' });
    },
  });

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateType('student');
    setBackgroundColor('#ffffff');
    setTextColor('#000000');
    setTitleText('Certificate of Completion');
    setSubtitleText('This is to certify that');
    setStudentNameText('[Student Name]');
    setCourseText('has successfully completed');
    setDateText('[Date]');
    setSignatureText('Director Signature');
    setFontSize(16);
    setTextAlign('center');
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({ title: 'Template name is required', variant: 'destructive' });
      return;
    }

    saveTemplateMutation.mutate({
      name: templateName,
      type: templateType,
      design_data: {
        backgroundColor,
        textColor,
        titleText,
        subtitleText,
        studentNameText,
        courseText,
        dateText,
        signatureText,
        fontSize,
        textAlign
      }
    });
  };

  const handleGenerateCertificate = (student: Student) => {
    if (student.balance > 0) {
      toast({ 
        title: 'Payment required', 
        description: 'Student has outstanding balance. Certificate cannot be generated.', 
        variant: 'destructive' 
      });
      return;
    }

    setSelectedStudent(student);
    setGenerateDialogOpen(true);
  };

  const handleSendNotification = (student: Student) => {
    setSelectedStudent(student);
    setPaymentCode(`PAY${Date.now()}`); // Generate unique payment code
    setNotificationDialogOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!selectedStudent || !message.trim()) {
      toast({ title: 'Message is required', variant: 'destructive' });
      return;
    }

    sendNotificationMutation.mutate({
      studentId: selectedStudent.id,
      message,
      paymentCode
    });
  };

  if (!canManageCertificates) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to manage certificates. Only admins, secretaries, and finance staff can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold">Certificate Management</h1>
            <p className="text-muted-foreground">
              Design certificates and manage student certificate generation
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Certificate Templates
                </div>
                <Button onClick={() => setDesignDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </CardTitle>
              <CardDescription>
                Manage certificate templates for students and employment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant={template.type === 'student' ? 'default' : 'secondary'}>
                            {template.type}
                          </Badge>
                        </div>
                        <div 
                          className="h-32 rounded border-2 border-dashed border-gray-300 flex items-center justify-center"
                          style={{ backgroundColor: template.design_data?.backgroundColor || '#ffffff' }}
                        >
                          <p style={{ color: template.design_data?.textColor || '#000000' }}>
                            {template.design_data?.titleText || 'Certificate'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedTemplate(template)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedTemplate(template);
                            setTemplateName(template.name);
                            setTemplateType(template.type);
                            if (template.design_data) {
                              setBackgroundColor(template.design_data.backgroundColor || '#ffffff');
                              setTextColor(template.design_data.textColor || '#000000');
                              setTitleText(template.design_data.titleText || '');
                              setSubtitleText(template.design_data.subtitleText || '');
                              setStudentNameText(template.design_data.studentNameText || '');
                              setCourseText(template.design_data.courseText || '');
                              setDateText(template.design_data.dateText || '');
                              setSignatureText(template.design_data.signatureText || '');
                              setFontSize(template.design_data.fontSize || 16);
                              setTextAlign(template.design_data.textAlign || 'center');
                            }
                            setDesignDialogOpen(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No certificate templates found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Student Certificate Status
              </CardTitle>
              <CardDescription>
                View students and generate certificates based on payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : students && students.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Total Fees</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Certificate Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>{student.level}</TableCell>
                          <TableCell>RWF {student.total_fees.toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">RWF {student.paid_amount.toLocaleString()}</TableCell>
                          <TableCell className={student.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                            RWF {student.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={student.certificate_generated ? 'default' : 'destructive'}
                            >
                              {student.certificate_generated ? 'Generated' : 'Not Generated'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {student.balance > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendNotification(student)}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                disabled={student.balance > 0}
                                onClick={() => handleGenerateCertificate(student)}
                              >
                                <Award className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No students found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Certificate Designer
              </CardTitle>
              <CardDescription>
                Design professional certificates from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Design Controls */}
                <div className="space-y-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div>
                    <Label>Template Type</Label>
                    <Select value={templateType} onValueChange={(value: 'student' | 'employment') => setTemplateType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student Certificate</SelectItem>
                        <SelectItem value="employment">Employment Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Text Color</Label>
                      <Input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Title Text</Label>
                    <Input
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      placeholder="Certificate title"
                    />
                  </div>

                  <div>
                    <Label>Subtitle Text</Label>
                    <Input
                      value={subtitleText}
                      onChange={(e) => setSubtitleText(e.target.value)}
                      placeholder="Certificate subtitle"
                    />
                  </div>

                  <div>
                    <Label>Student Name Placeholder</Label>
                    <Input
                      value={studentNameText}
                      onChange={(e) => setStudentNameText(e.target.value)}
                      placeholder="[Student Name]"
                    />
                  </div>

                  <div>
                    <Label>Course Text</Label>
                    <Input
                      value={courseText}
                      onChange={(e) => setCourseText(e.target.value)}
                      placeholder="Course completion text"
                    />
                  </div>

                  <div>
                    <Label>Date Text</Label>
                    <Input
                      value={dateText}
                      onChange={(e) => setDateText(e.target.value)}
                      placeholder="[Date]"
                    />
                  </div>

                  <div>
                    <Label>Signature Text</Label>
                    <Input
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="Signature text"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        min="12"
                        max="24"
                      />
                    </div>
                    <div>
                      <Label>Text Align</Label>
                      <Select value={textAlign} onValueChange={(value: 'left' | 'center' | 'right') => setTextAlign(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveTemplate} disabled={saveTemplateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                    </Button>
                    <Button variant="outline" onClick={resetTemplateForm}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <Label>Preview</Label>
                  <div 
                    className="w-full h-96 rounded-lg border-2 border-gray-300 p-8 flex flex-col justify-center items-center"
                    style={{ 
                      backgroundColor,
                      color: textColor,
                      fontSize: `${fontSize}px`,
                      textAlign
                    }}
                  >
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl font-bold">{titleText}</h2>
                      <p className="text-lg">{subtitleText}</p>
                      <p className="text-xl font-semibold">{studentNameText}</p>
                      <p className="text-lg">{courseText}</p>
                      <p className="text-lg">{dateText}</p>
                      <div className="mt-8">
                        <p className="text-sm">{signatureText}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Payment Notifications
              </CardTitle>
              <CardDescription>
                View notification history sent to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Payment Code</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium">{notification.student_id}</TableCell>
                          <TableCell>
                            <Badge variant={notification.type === 'whatsapp' ? 'default' : 'secondary'}>
                              {notification.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-red-600">RWF {notification.amount_due.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-sm">{notification.payment_code}</TableCell>
                          <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                          <TableCell>
                            <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'}>
                              {notification.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(notification.sent_at), 'MMM d, yyyy HH:mm')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notification records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Design Dialog */}
      <Dialog open={designDialogOpen} onOpenChange={setDesignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Design your certificate template with professional styling options
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Design Controls */}
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label>Template Type</Label>
                <Select value={templateType} onValueChange={(value: 'student' | 'employment') => setTemplateType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student Certificate</SelectItem>
                    <SelectItem value="employment">Employment Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Title Text</Label>
                <Input
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  placeholder="Certificate title"
                />
              </div>

              <div>
                <Label>Subtitle Text</Label>
                <Input
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  placeholder="Certificate subtitle"
                />
              </div>

              <div>
                <Label>Student Name Placeholder</Label>
                <Input
                  value={studentNameText}
                  onChange={(e) => setStudentNameText(e.target.value)}
                  placeholder="[Student Name]"
                />
              </div>

              <div>
                <Label>Course Text</Label>
                <Input
                  value={courseText}
                  onChange={(e) => setCourseText(e.target.value)}
                  placeholder="Course completion text"
                />
              </div>

              <div>
                <Label>Date Text</Label>
                <Input
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="[Date]"
                />
              </div>

              <div>
                <Label>Signature Text</Label>
                <Input
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Signature text"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Size</Label>
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    min="12"
                    max="24"
                  />
                </div>
                <div>
                  <Label>Text Align</Label>
                  <Select value={textAlign} onValueChange={(value: 'left' | 'center' | 'right') => setTextAlign(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview</Label>
              <div 
                className="w-full h-96 rounded-lg border-2 border-gray-300 p-8 flex flex-col justify-center items-center"
                style={{ 
                  backgroundColor,
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  textAlign
                }}
              >
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold">{titleText}</h2>
                  <p className="text-lg">{subtitleText}</p>
                  <p className="text-xl font-semibold">{studentNameText}</p>
                  <p className="text-lg">{courseText}</p>
                  <p className="text-lg">{dateText}</p>
                  <div className="mt-8">
                    <p className="text-sm">{signatureText}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDesignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={saveTemplateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Certificate Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Certificate</DialogTitle>
            <DialogDescription>
              Confirm certificate generation for this student
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <p className="font-semibold">{selectedStudent.full_name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p>{selectedStudent.email}</p>
              </div>
              <div>
                <Label>Level</Label>
                <p>{selectedStudent.level}</p>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Badge variant="default">Fully Paid</Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedStudent) {
                generateCertificateMutation.mutate(selectedStudent.id);
              }
            }} disabled={generateCertificateMutation.isPending}>
              <Award className="w-4 h-4 mr-2" />
              {generateCertificateMutation.isPending ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send WhatsApp notification to student with payment details
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <p className="font-semibold">{selectedStudent.full_name}</p>
              </div>
              <div>
                <Label>Phone</Label>
                <p>{selectedStudent.phone}</p>
              </div>
              <div>
                <Label>Amount Due</Label>
                <p className="text-red-600 font-semibold">RWF {selectedStudent.balance.toLocaleString()}</p>
              </div>
              <div>
                <Label>Payment Code</Label>
                <Input
                  value={paymentCode}
                  onChange={(e) => setPaymentCode(e.target.value)}
                  placeholder="Generate payment code"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message to send via WhatsApp"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendWhatsApp} disabled={sendNotificationMutation.isPending}>
              <Send className="w-4 h-4 mr-2" />
              {sendNotificationMutation.isPending ? 'Sending...' : 'Send WhatsApp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificatesPage;
