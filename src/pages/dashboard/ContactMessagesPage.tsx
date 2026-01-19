import { Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ContactMessagesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Contact Messages</h1>
          <p className="text-muted-foreground">View and manage messages from the contact form</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Contact messages feature is being developed. This will allow you to view 
            and respond to messages submitted through the contact form.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactMessagesPage;
