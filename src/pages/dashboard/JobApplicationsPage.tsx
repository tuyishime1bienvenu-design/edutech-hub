import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Users, FileText, Download, Eye, MessageSquare, CheckCircle, X, Clock, AlertCircle, Filter, Search } from 'lucide-react';
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

interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cover_letter: string;
  cv_url: string;
  cover_letter_url: string;
  motivation_letter_url: string;
  highest_degree: string;
  experience_years: number;
  application_key: string;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
}

const JobApplicationsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_review' | 'accepted' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'under_review' | 'accepted' | 'rejected'>('under_review');

  // Fetch job applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['job-applications', filterStatus, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job_postings!inner(
            title,
            department,
            location,
            employment_type
          )
        `)
        .order('applied_at', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`
          first_name.ilike.%${searchTerm}%, 
          last_name.ilike.%${searchTerm}%, 
          email.ilike.%${searchTerm}%, 
          job_postings!inner(title.ilike.%${searchTerm}%)
        `);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JobApplication[];
    },
  });

  // Update application status mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      setIsReviewDialogOpen(false);
      setReviewNotes('');
      setReviewStatus('under_review');
      setSelectedApplication(null);
      toast({
        title: "Application updated",
        description: "The application status has been updated.",
      });
    },
  });

  const handleReview = (application: JobApplication) => {
    setSelectedApplication(application);
    setReviewNotes(application.admin_notes || '');
    setReviewStatus(application.status as 'under_review' | 'accepted' | 'rejected');
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedApplication) return;

    updateApplicationMutation.mutate({
      id: selectedApplication.id,
      status: reviewStatus,
      notes: reviewNotes,
    });
  };

  const handleDownloadDocument = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getApplicationStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
  };

  const stats = getApplicationStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6" />
            Job Applications
          </h1>
          <p className="text-muted-foreground">Review and manage job applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.under_review}</p>
                <p className="text-sm text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search applications by name, email, or job title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({applications.length})
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pending ({stats.pending})
          </Button>
          <Button
            variant={filterStatus === 'under_review' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('under_review')}
          >
            Under Review ({stats.under_review})
          </Button>
          <Button
            variant={filterStatus === 'accepted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('accepted')}
          >
            Accepted ({stats.accepted})
          </Button>
          <Button
            variant={filterStatus === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('rejected')}
          >
            Rejected ({stats.rejected})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center">
              Job applications will appear here once candidates start applying.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {application.first_name} {application.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{application.email}</p>
                    {application.phone && (
                      <p className="text-sm text-muted-foreground">{application.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(application.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReview(application)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Applied Position</h4>
                      <p className="font-semibold">{application.job_postings?.title}</p>
                      <p className="text-sm text-muted-foreground">{application.job_postings?.department}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Location</h4>
                      <p className="text-sm">{application.job_postings?.location}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Highest Degree</h4>
                      <p className="text-sm">{application.highest_degree}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Experience</h4>
                      <p className="text-sm">{application.experience_years} years</p>
                    </div>
                  </div>
                </div>

                {application.cover_letter && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Cover Letter</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded">
                      {application.cover_letter}
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {application.cv_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(application.cv_url, 'CV')}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        CV
                      </Button>
                    )}
                    {application.cover_letter_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(application.cover_letter_url, 'Cover Letter')}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Cover Letter
                      </Button>
                    )}
                    {application.motivation_letter_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(application.motivation_letter_url, 'Motivation Letter')}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Motivation Letter
                      </Button>
                    )}
                  </div>
                </div>

                {application.admin_notes && (
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Admin Notes</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-blue-50 p-3 rounded">
                      {application.admin_notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Applied {format(new Date(application.applied_at), 'PPP p')}
                  </div>
                  {application.reviewed_at && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Reviewed {format(new Date(application.reviewed_at), 'PPP p')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review the application from {selectedApplication?.first_name} {selectedApplication?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Application Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {selectedApplication.first_name} {selectedApplication.last_name}</div>
                  <div><strong>Email:</strong> {selectedApplication.email}</div>
                  <div><strong>Phone:</strong> {selectedApplication.phone || 'Not provided'}</div>
                  <div><strong>Applied:</strong> {format(new Date(selectedApplication.applied_at), 'PPP p')}</div>
                  <div><strong>Position:</strong> {selectedApplication.job_postings?.title}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-status">Update Status *</Label>
                <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-notes">Admin Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReviewDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={updateApplicationMutation.isPending}
                >
                  {updateApplicationMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobApplicationsPage;
