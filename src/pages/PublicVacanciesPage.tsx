import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Share2, 
  CheckCircle, 
  AlertCircle,
  Send,
  Upload
} from 'lucide-react';

interface Vacancy {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  department: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_min: number;
  salary_max: number;
  location: string;
  deadline: string;
  benefits: string[];
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface JobApplication {
  vacancy_id: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  cover_letter?: string;
  documents?: string[];
  status?: string;
  review_notes?: string;
  reviewed_by?: string;
}

const PublicVacanciesPage = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [applicationLink, setApplicationLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [applicationForm, setApplicationForm] = useState<JobApplication>({
    vacancy_id: '',
    full_name: '',
    email: '',
    phone: '',
    resume_url: '',
    cover_letter: '',
  });

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const { data, error } = await supabase
        .from('vacancies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVacancies(data || []);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vacancies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setApplicationForm({
      ...applicationForm,
      vacancy_id: vacancy.id,
    });
    setApplicationDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedVacancy) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .insert([{
          ...applicationForm,
          vacancy_id: selectedVacancy.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Application Submitted!',
        description: 'Your application has been submitted successfully.',
      });

      setApplicationDialogOpen(false);
      setApplicationForm({
        vacancy_id: '',
        full_name: '',
        email: '',
        phone: '',
        resume_url: '',
        cover_letter: '',
      });
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

  const handleShare = (vacancy: Vacancy) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/apply/${vacancy.id}`;
    setApplicationLink(link);
    setShareDialogOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(applicationLink);
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
          <p className="text-gray-600">Loading vacancies...</p>
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
            <Button asChild variant="outline">
              <a href="/login">
                <Users className="w-4 h-4 mr-2" />
                Staff Login
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {vacancies.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Open Positions</h2>
            <p className="text-gray-600">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.map((vacancy, index) => (
              <motion.div
                key={vacancy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {vacancy.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
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
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 line-clamp-3">{vacancy.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      {vacancy.salary_range && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {vacancy.salary_range}
                        </div>
                      )}
                      {vacancy.location && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {vacancy.location}
                        </div>
                      )}
                      {vacancy.application_deadline && (
                        <div className={`flex items-center ${
                          isDeadlineNear(vacancy.application_deadline) ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Deadline: {format(new Date(vacancy.application_deadline), 'MMM d, yyyy')}
                          {isDeadlineNear(vacancy.application_deadline) && (
                            <AlertCircle className="w-4 h-4 ml-2" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={() => handleApply(vacancy)}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Apply Now
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShare(vacancy)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Application Dialog */}
      <Dialog open={applicationDialogOpen} onOpenChange={setApplicationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Apply for {selectedVacancy?.title}
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

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Application Link</Label>
              <div className="flex gap-2">
                <Input
                  value={applicationLink}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyToClipboard} variant="outline">
                  <FileText className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Share this link with someone who might be interested in this position.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicVacanciesPage;
