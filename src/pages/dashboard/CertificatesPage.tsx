import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CertificatesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Certificates</h1>
          <p className="text-muted-foreground">Generate certificates for students who have fully paid</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Certificate generation feature is being developed. This will allow you to issue 
            certificates to students who have completed their programs and paid all fees.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificatesPage;
