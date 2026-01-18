import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Bell, Calendar, MoreVertical, Edit, Trash2, Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const NoticesPage = () => {
  const { primaryRole, user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notice_type: 'announcement',
    is_holiday: false,
    holiday_date: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', notice_type: 'announcement', is_holiday: false, holiday_date: '' });
    setEditingNotice(null);
  };

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      notice_type: notice.notice_type || 'announcement',
      is_holiday: notice.is_holiday || false,
      holiday_date: notice.holiday_date || '',
    });
    setIsDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        holiday_date: data.is_holiday ? data.holiday_date : null,
      };
      if (editingNotice) {
        const { error } = await supabase.from('notices').update(payload).eq('id', editingNotice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('notices').insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: editingNotice ? 'Notice updated' : 'Notice posted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error saving notice', description: error.message, variant: 'destructive' });
    },
  });

  const deleteNoticeMutation = useMutation({
    mutationFn: async (noticeId: string) => {
      const { error } = await supabase.from('notices').delete().eq('id', noticeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      toast({ title: 'Notice deleted' });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'holiday': return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'urgent': return <Megaphone className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
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
          <h1 className="text-2xl font-display font-bold">Notices</h1>
          <p className="text-muted-foreground">View and manage announcements</p>
        </div>
        {primaryRole === 'admin' && (
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Post Notice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No notices posted yet.
            </CardContent>
          </Card>
        ) : (
          notices?.map((notice, index) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getTypeIcon(notice.notice_type || 'announcement')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTypeBadge(notice.notice_type || 'announcement')}>
                            {notice.notice_type || 'Announcement'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notice.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {primaryRole === 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(notice)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteNoticeMutation.mutate(notice.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{notice.content}</p>
                  {notice.is_holiday && notice.holiday_date && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                      <Calendar className="w-4 h-4" />
                      Holiday on: {format(new Date(notice.holiday_date), 'MMMM d, yyyy')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNotice ? 'Edit Notice' : 'Post New Notice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notice title"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.notice_type}
                onValueChange={(value) => setFormData({ ...formData, notice_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Notice content..."
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_holiday">Is this a holiday notice?</Label>
              <Switch
                id="is_holiday"
                checked={formData.is_holiday}
                onCheckedChange={(checked) => setFormData({ ...formData, is_holiday: checked })}
              />
            </div>
            {formData.is_holiday && (
              <div className="space-y-2">
                <Label htmlFor="holiday_date">Holiday Date</Label>
                <Input
                  id="holiday_date"
                  type="date"
                  value={formData.holiday_date}
                  onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.title || !formData.content || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : editingNotice ? 'Update' : 'Post Notice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoticesPage;
