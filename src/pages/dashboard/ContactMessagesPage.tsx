import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, MessageSquare, User, Clock, CheckCircle, Reply, Eye, EyeOff, Trash2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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

interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  inquiry_type: string;
  status: 'unread' | 'read' | 'replied';
  reply: string | null;
  replied_by: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

const ContactMessagesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read' | 'replied'>('all');

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['contact-messages', filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({
        title: "Message marked as read",
        description: "The message has been marked as read.",
      });
    },
  });

  // Reply to message mutation
  const replyMutation = useMutation({
    mutationFn: async ({ messageId, reply }: { messageId: string; reply: string }) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({
          reply,
          status: 'replied',
          replied_by: user?.id,
          replied_at: new Date().toISOString(),
        })
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      setIsReplyDialogOpen(false);
      setReplyText('');
      setSelectedMessage(null);
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      });
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      toast({
        title: "Message deleted",
        description: "The message has been deleted.",
      });
    },
  });

  const handleReply = (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyText(message.reply || '');
    setIsReplyDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    replyMutation.mutate({
      messageId: selectedMessage.id,
      reply: replyText.trim(),
    });
  };

  const handleMarkAsRead = (messageId: string) => {
    if (messages.find(m => m.id === messageId)?.status !== 'read') {
      markAsReadMutation.mutate(messageId);
    }
  };

  const handleDelete = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMutation.mutate(messageId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge variant="default">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInquiryTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-100 text-blue-800',
      admission: 'bg-green-100 text-green-800',
      partnership: 'bg-purple-100 text-purple-800',
      support: 'bg-orange-100 text-orange-800',
      training: 'bg-indigo-100 text-indigo-800',
    };
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Contact Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">View and manage messages from the contact form</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({messages.length})
          </Button>
          <Button
            variant={filterStatus === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('unread')}
          >
            Unread ({messages.filter(m => m.status === 'unread').length})
          </Button>
          <Button
            variant={filterStatus === 'read' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('read')}
          >
            Read ({messages.filter(m => m.status === 'read').length})
          </Button>
          <Button
            variant={filterStatus === 'replied' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('replied')}
          >
            Replied ({messages.filter(m => m.status === 'replied').length})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground text-center">
              Messages from the contact form will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {message.first_name} {message.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{message.email}</p>
                      {message.phone && (
                        <p className="text-sm text-muted-foreground">{message.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(message.status)}
                    {getInquiryTypeBadge(message.inquiry_type)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Subject</h4>
                    <p className="font-semibold">{message.subject}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Message</h4>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>

                  {message.reply && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        <Reply className="w-4 h-4" />
                        Your Reply
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.reply}
                      </p>
                      {message.replied_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Replied on {format(new Date(message.replied_at), 'PPP p')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(message.created_at), 'PPP p')}
                    </div>

                    <div className="flex items-center gap-2">
                      {message.status === 'unread' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsRead(message.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReply(message)}
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(message.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>
              Send a reply to {selectedMessage?.first_name} {selectedMessage?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Original Message:</p>
                <p className="text-sm text-muted-foreground">
                  "{selectedMessage.message.substring(0, 200)}
                  {selectedMessage.message.length > 200 ? '...' : ''}"
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="reply" className="text-sm font-medium">
                  Your Reply
                </label>
                <Textarea
                  id="reply"
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReplyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
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

export default ContactMessagesPage;
