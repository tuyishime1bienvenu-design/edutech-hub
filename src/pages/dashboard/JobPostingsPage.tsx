import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Plus, Edit, Trash2, Users, Calendar, DollarSign, MapPin, FileText, X, Save, Upload } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  responsibilities: string;
  location: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_range: string | null;
  department: string;
  posted_by: string;
  is_active: boolean;
  application_deadline: string | null;
  created_at: string;
  updated_at: string;
}

interface JobDocument {
  id: string;
  job_id: string;
  document_type: 'cv' | 'cover_letter' | 'motivation_letter' | 'certificates';
  is_required: boolean;
  description: string;
  file_size_limit: number;
  allowed_extensions: string[];
}

const JobPostingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [jobDocuments, setJobDocuments] = useState<JobDocument[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    skills: [] as string[],
    responsibilities: '',
    location: '',
    employment_type: 'full-time' as const,
    salary_range: '',
    department: '',
    application_deadline: '',
  });

  // Fetch job postings
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JobPosting[];
    },
  });

  // Fetch job documents
  const { data: documents = [] } = useQuery({
    queryKey: ['job-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_documents')
        .select('*');
      
      if (error) throw error;
      return data as JobDocument[];
    },
  });

  // Create job posting mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('job_postings')
        .insert({
          ...data,
          skills: data.skills.filter(s => s.trim()),
          posted_by: user?.id,
          is_active: true,
          application_deadline: data.application_deadline || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        requirements: '',
        skills: [],
        responsibilities: '',
        location: '',
        employment_type: 'full-time',
        salary_range: '',
        department: '',
        application_deadline: '',
      });
      toast({
        title: "Job posted successfully",
        description: "The job posting has been created.",
      });
    },
  });

  // Update job posting mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('job_postings')
        .update({
          ...data,
          skills: data.skills.filter(s => s.trim()),
          application_deadline: data.application_deadline || null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      setIsCreateDialogOpen(false);
      setEditingJob(null);
      setFormData({
        title: '',
        description: '',
        requirements: '',
        skills: [],
        responsibilities: '',
        location: '',
        employment_type: 'full-time',
        salary_range: '',
        department: '',
        application_deadline: '',
      });
      toast({
        title: "Job updated successfully",
        description: "The job posting has been updated.",
      });
    },
  });

  // Delete job posting mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      toast({
        title: "Job deleted",
        description: "The job posting has been deleted.",
      });
    },
  });

  useEffect(() => {
    if (documents.length > 0) {
      setJobDocuments(documents);
    }
  }, [documents]);

  const handleEdit = (job: JobPosting) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements.join(', '),
      skills: job.skills,
      responsibilities: job.responsibilities,
      location: job.location,
      employment_type: job.employment_type,
      salary_range: job.salary_range || '',
      department: job.department,
      application_deadline: job.application_deadline ? format(new Date(job.application_deadline), 'yyyy-MM-dd') : '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.requirements || !formData.responsibilities) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (editingJob) {
      updateJobMutation.mutate({ id: editingJob.id, data: formData });
    } else {
      createJobMutation.mutate(formData);
    }
  };

  const handleDelete = (jobId: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
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

  const getRequiredDocuments = () => {
    return jobDocuments.filter(doc => doc.is_required);
  };

  const getApplicationStats = () => {
    return {
      total: jobs.length,
      active: jobs.filter(job => job.is_active && (!job.application_deadline || new Date(job.application_deadline) > new Date())).length,
      expired: jobs.filter(job => job.application_deadline && new Date(job.application_deadline) <= new Date()).length,
    };
  };

  const stats = getApplicationStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Job Postings
          </h1>
          <p className="text-muted-foreground">Create and manage job postings</p>
        </div>
        
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Job Posting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Postings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Postings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired Postings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
            <p className="text-muted-foreground text-center">
              Create your first job posting to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                      <span className="mx-2">•</span>
                      {getEmploymentTypeBadge(job.employment_type)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.is_active && (!job.application_deadline || new Date(job.application_deadline) > new Date()) && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                    {job.application_deadline && new Date(job.application_deadline) <= new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(job)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Department</h4>
                    <p className="text-sm">{job.department}</p>
                  </div>

                  {job.salary_range && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Salary Range</h4>
                      <p className="text-sm">{job.salary_range}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Requirements</h4>
                    <p className="text-sm leading-relaxed">{job.requirements}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Skills Needed</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Responsibilities</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
                  </div>

                  {job.application_deadline && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Application Deadline</h4>
                      <p className="text-sm">{format(new Date(job.application_deadline), 'PPP p')}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Posted {format(new Date(job.created_at), 'PPP p')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Job Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Create Job Posting'}</DialogTitle>
            <DialogDescription>
              {editingJob ? 'Edit the job posting details' : 'Create a new job posting with all requirements and details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter job title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., ICT, Management, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Kigali, Rwanda"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type *</Label>
                <Select value={formData.employment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  value={formData.salary_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                  placeholder="e.g., $500-800/month"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_deadline">Application Deadline</Label>
              <Input
                id="application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements *</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="List the educational qualifications, experience, and skills required..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities *</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                placeholder="List the key responsibilities and duties..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Skills Required</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill and press Enter"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="default" className="cursor-pointer" onClick={() => removeSkill(index)}>
                      {skill}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Required Documents for Applicants</h4>
              <div className="space-y-2">
                {getRequiredDocuments().map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">{doc.document_type.replace('_', ' ').toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">({doc.description})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createJobMutation.isPending || updateJobMutation.isPending}
              >
                {createJobMutation.isPending || updateJobMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {editingJob ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobPostingsPage;
