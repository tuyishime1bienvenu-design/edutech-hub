import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CertificateTemplatesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Certificate Templates</h1>
          <p className="text-muted-foreground">Design certificates for program completion</p>
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
            Certificate templates feature is being developed. This will allow you to create and manage 
            custom certificate designs for student graduation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateTemplatesPage;
