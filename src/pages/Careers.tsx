import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, MapPin, Calendar, DollarSign, Users, Clock, Upload, FileText, X, CheckCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  location: string | null;
  type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  department: string;
  is_active: boolean | null;
  deadline: string | null;
  benefits: string[] | null;
  created_at: string;
  created_by: string | null;
}

interface JobApplication {
  id: string;
  vacancy_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  documents: string[] | null;
  status: string | null;
  review_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

const Careers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [applicationKey, setApplicationKey] = useState('');
  const [statusCheckKey, setStatusCheckKey] = useState('');

  const [applicationData, setApplicationData] = useState({
    first_name: user?.user_metadata?.full_name || '',
    last_name: user?.user_metadata?.last_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || '',
    cover_letter: '',
    highest_degree: '',
    experience_years: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterEmploymentType, setFilterEmploymentType] = useState('all');

  // Fetch job postings
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['vacancies-public', searchTerm, filterDepartment, filterEmploymentType],
    queryFn: async () => {
      let query = supabase
        .from('vacancies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,requirements.ilike.%${searchTerm}%`);
      }

      // Apply department filter
      if (filterDepartment !== 'all') {
        query = query.eq('department', filterDepartment);
      }

      // Apply employment type filter
      if (filterEmploymentType !== 'all') {
        query = query.eq('type', filterEmploymentType);
      }

      // Filter out expired jobs
      query = query.or(`deadline.is.null,deadline.gt.${new Date().toISOString()}`);

      const { data, error } = await query;
      if (error) throw error;
      return data as JobPosting[];
    },
  });

  // Check if user has already applied
  const { data: userApplications = [] } = useQuery({
    queryKey: ['user-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('job_applications')
        .select('vacancy_id, status, applied_at')
        .eq('full_name', user.user_metadata?.full_name || `${user.email?.split('@')[0]}`);
      
      if (error) throw error;
      return data as unknown as JobApplication[];
    },
    enabled: !!user?.id,
  });

  // Apply for job mutation
  const applyMutation = useMutation({
    mutationFn: async (data: any) => {
      const applicationKey = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from('job_applications')
        .insert({
          ...data,
          application_key: applicationKey,
          full_name: user?.user_metadata?.full_name || `${user.email?.split('@')[0]}`,
          email: user?.email,
        });
      
      if (error) throw error;
      return applicationKey;
    },
    onSuccess: (applicationKey) => {
      queryClient.invalidateQueries({ queryKey: ['user-applications'] });
      setApplicationKey(applicationKey);
      setIsApplicationDialogOpen(false);
      toast({
        title: "Application submitted successfully!",
        description: `Your application key is: ${applicationKey}. Save this key to check your application status.`,
      });
    },
  });

  const handleApply = (job: JobPosting) => {
    setSelectedJob(job);
    setIsApplicationDialogOpen(true);
  };

  const handleSubmitApplication = () => {
    if (!selectedJob) return;

    if (!applicationData.first_name || !applicationData.last_name || !applicationData.email || !applicationData.highest_degree || !applicationData.experience_years) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const applicationSubmissionData = {
      ...applicationData,
      vacancy_id: selectedJob.id,
      resume_url: null,
      cover_letter: applicationData.cover_letter,
    };

    applyMutation.mutate(applicationSubmissionData);
  };

  const checkApplicationStatus = () => {
    if (!statusCheckKey.trim()) {
      toast({
        title: "Please enter your application key",
        description: "You need your application key to check status",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, you would query the database with the key
    toast({
      title: "Status check",
      description: "Application status check functionality would be implemented here",
    });
  };

  const getEmploymentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-purple-100 text-purple-800',
      'internship': 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const hasUserApplied = (jobId: string) => {
    return userApplications.some(app => app.vacancy_id === jobId);
  };

  const departments = [...new Set(jobs.map(job => job.department))];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-primary text-white section-padding">
        <div className="container-max-width">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Career Opportunities
            </h1>
            <p className="text-xl text-white/90">
              Join our team and build your career with EdTech Solutions
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-max-width">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, description, or requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterEmploymentType} onValueChange={setFilterEmploymentType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No job openings available</h3>
              <p className="text-muted-foreground">
                Check back later for new opportunities.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                          <span className="mx-2">•</span>
                          {getEmploymentTypeBadge(job.type || 'Not specified')}
                        </div>
                      </div>
                      {hasUserApplied(job.id) && (
                        <Badge className="bg-blue-100 text-blue-800">Applied</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {job.salary_min !== null && job.salary_max !== null && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">
                          {job.salary_min && job.salary_max
                            ? `RWF ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                            : job.salary_min
                            ? `RWF ${job.salary_min.toLocaleString()}+`
                            : 'Salary not specified'
                          }
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Department</h4>
                      <p className="text-sm">{job.department}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Requirements</h4>
                      <p className="text-sm leading-relaxed line-clamp-3">
                        {job.requirements && job.requirements.length > 0 ? job.requirements.join(', ') : 'No specific requirements'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Skills Needed</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.requirements && job.requirements.length > 0 ? job.requirements.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        )) : 'No specific requirements'}
                      </div>
                    </div>

                    {job.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <span>Deadline: {format(new Date(job.deadline), 'PPP p')}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button
                        className="w-full"
                        onClick={() => handleApply(job)}
                        disabled={hasUserApplied(job.id)}
                      >
                        {hasUserApplied(job.id) ? 'Already Applied' : 'Apply Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Application Status Check */}
      <section className="section-padding bg-muted/50">
        <div className="container-max-width">
          <Card>
            <CardHeader>
              <CardTitle>Check Your Application Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status-key">Application Key</Label>
                <Input
                  id="status-key"
                  placeholder="Enter your application key to check status"
                  value={statusCheckKey}
                  onChange={(e) => setStatusCheckKey(e.target.value)}
                />
              </div>
              <Button onClick={checkApplicationStatus} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Check Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Application Dialog */}
      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for: {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Fill in your details to apply for this position.
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              {/* Job Details */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Position Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Location:</strong> {selectedJob.location}</div>
                  <div><strong>Department:</strong> {selectedJob.department}</div>
                  <div><strong>Type:</strong> {getEmploymentTypeBadge(selectedJob.type || 'Not specified')}</div>
                  {selectedJob.salary_min !== null && selectedJob.salary_max !== null && (
                    <div><strong>Salary:</strong> {selectedJob.salary_min && selectedJob.salary_max ? `RWF ${selectedJob.salary_min.toLocaleString()} - ${selectedJob.salary_max.toLocaleString()}` : selectedJob.salary_min ? `RWF ${selectedJob.salary_min.toLocaleString()}+` : 'Salary not specified'}</div>
                  )}
                  {selectedJob.deadline && (
                    <div><strong>Deadline:</strong> {format(new Date(selectedJob.deadline), 'PPP p')}</div>
                  )}
                </div>
              </div>

              {/* Application Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={applicationData.first_name}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={applicationData.last_name}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="highest-degree">Highest Degree *</Label>
                  <Select value={applicationData.highest_degree} onValueChange={(value) => setApplicationData(prev => ({ ...prev, highest_degree: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your highest degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High School">High School</SelectItem>
                      <SelectItem value="Bachelor's">Bachelor's Degree</SelectItem>
                      <SelectItem value="Master's">Master's Degree</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience-years">Experience (Years) *</Label>
                  <Input
                    id="experience-years"
                    type="number"
                    min="0"
                    value={applicationData.experience_years.toString()}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                    placeholder="Years of experience"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cover-letter">Cover Letter</Label>
                  <Textarea
                    id="cover-letter"
                    value={applicationData.cover_letter}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, cover_letter: e.target.value }))}
                    placeholder="Tell us why you're interested in this position..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsApplicationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Application Key Display */}
      {applicationKey && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Application Submitted!</h4>
            <button onClick={() => setApplicationKey('')} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm mb-2">Save this application key to check your status later:</p>
          <div className="bg-black/20 p-2 rounded font-mono text-sm">
            {applicationKey}
          </div>
          <p className="text-xs mt-2">You can check your application status using the key above on this page.</p>
        </div>
      )}
    </div>
  );
};

export default Careers;
