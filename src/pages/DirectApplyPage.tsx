import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Clock, 
  Users, 
  Building, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Send,
  Upload,
  ArrowLeft,
  Share2
} from 'lucide-react';

interface Vacancy {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  department?: string;
  position_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_range?: string;
  location?: string;
  application_deadline?: string;
  is_active: boolean;
  created_at: string;
}

interface JobApplication {
  vacancy_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  applicant_address?: string;
  resume_url?: string;
  cover_letter?: string;
}

const DirectApplyPage = () => {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const { toast } = useToast();

  const [applicationForm, setApplicationForm] = useState<JobApplication>({
    vacancy_id: vacancyId || '',
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    applicant_address: '',
    resume_url: '',
    cover_letter: '',
  });

  useEffect(() => {
    if (vacancyId) {
      fetchVacancy();
    }
  }, [vacancyId]);

  const fetchVacancy = async () => {
    try {
      const { data, error } = await supabase
        .from('vacancies')
        .select('*')
        .eq('id', vacancyId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        } else {
          throw error;
        }
        return;
      }

      setVacancy(data);
      setApplicationForm({ ...applicationForm, vacancy_id: data.id });
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!vacancy) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          ...applicationForm,
          vacancy_id: vacancy.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Application Submitted Successfully!',
        description: 'Your application has been received. We will contact you soon.',
      });

      // Reset form
      setApplicationForm({
        vacancy_id: vacancy.id,
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        applicant_address: '',
        resume_url: '',
        cover_letter: '',
      });

      setApplicationDialogOpen(false);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied!',
      description: 'Application link copied to clipboard.',
    });
  };

  const getPositionTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-500';
      case 'part-time': return 'bg-blue-500';
      case 'contract': return 'bg-orange-500';
      case 'internship': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const isDeadlineNear = (deadline?: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading position details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !vacancy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Position Not Found</h2>
          <p className="text-gray-600 mb-6">This position may no longer be available.</p>
          <Button onClick={() => navigate('/careers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            View All Positions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.jpg" alt="EdTech Solutions" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Career Opportunities</h1>
                <p className="text-gray-600">Join our team and make a difference</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button asChild variant="outline">
                <a href="/careers">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  All Positions
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                    {vacancy.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={getPositionTypeColor(vacancy.position_type)}>
                      {vacancy.position_type.replace('-', ' ')}
                    </Badge>
                    {vacancy.department && (
                      <Badge variant="outline">{vacancy.department}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Position</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{vacancy.description}</p>
              </div>

              {vacancy.responsibilities && (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{vacancy.responsibilities}</p>
                </div>
              )}

              {vacancy.requirements && (
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{vacancy.requirements}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t">
                {vacancy.salary_range && (
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-5 h-5 mr-2" />
                    <span className="font-medium">Salary:</span>
                    <span className="ml-2">{vacancy.salary_range}</span>
                  </div>
                )}
                {vacancy.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span className="font-medium">Location:</span>
                    <span className="ml-2">{vacancy.location}</span>
                  </div>
                )}
                {vacancy.application_deadline && (
                  <div className={`flex items-center ${
                    isDeadlineNear(vacancy.application_deadline) ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="font-medium">Deadline:</span>
                    <span className="ml-2">
                      {format(new Date(vacancy.application_deadline), 'MMM d, yyyy')}
                    </span>
                    {isDeadlineNear(vacancy.application_deadline) && (
                      <AlertCircle className="w-5 h-5 ml-2" />
                    )}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Building className="w-5 h-5 mr-2" />
                  <span className="font-medium">Department:</span>
                  <span className="ml-2">{vacancy.department || 'General'}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button 
                  onClick={() => setApplicationDialogOpen(true)}
                  size="lg"
                  className="flex-1"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Position
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Application Dialog */}
      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Apply for {vacancy.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applicant-name">Full Name *</Label>
                <Input
                  id="applicant-name"
                  value={applicationForm.applicant_name}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicant-email">Email Address *</Label>
                <Input
                  id="applicant-email"
                  type="email"
                  value={applicationForm.applicant_email}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicant-phone">Phone Number</Label>
                <Input
                  id="applicant-phone"
                  value={applicationForm.applicant_phone}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicant-address">Address</Label>
                <Input
                  id="applicant-address"
                  value={applicationForm.applicant_address}
                  onChange={(e) => setApplicationForm({ ...applicationForm, applicant_address: e.target.value })}
                  placeholder="Enter your address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume-url">Resume/CV URL</Label>
              <Input
                id="resume-url"
                value={applicationForm.resume_url}
                onChange={(e) => setApplicationForm({ ...applicationForm, resume_url: e.target.value })}
                placeholder="Link to your resume/CV"
              />
              <p className="text-sm text-gray-500">
                Upload your resume to Google Drive, Dropbox, or similar service and share the link
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-letter">Cover Letter</Label>
              <Textarea
                id="cover-letter"
                value={applicationForm.cover_letter}
                onChange={(e) => setApplicationForm({ ...applicationForm, cover_letter: e.target.value })}
                placeholder="Tell us why you're interested in this position..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplicationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApplication} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DirectApplyPage;
