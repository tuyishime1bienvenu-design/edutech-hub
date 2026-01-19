import { UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RecordVisitorPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Record Visitor</h1>
          <p className="text-muted-foreground">Register new visitors to the institution</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Visitor registration feature is being developed. This will allow you to record 
            new visitors and their purpose of visit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordVisitorPage;
