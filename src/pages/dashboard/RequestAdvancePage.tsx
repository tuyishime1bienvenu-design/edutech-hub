import { useState } from 'react';
import { useSalary } from '@/hooks/useSalary';
import { RequestAdvanceModal } from '@/components/dashboard/RequestAdvanceModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const RequestAdvancePage = () => {
  const { data: salary, isLoading } = useSalary();
  const [modalOpen, setModalOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No salary information found. Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Request Salary Advance</h1>
        <p className="text-muted-foreground">Submit a request for salary advance</p>
      </div>

      <div className="max-w-md">
        <RequestAdvanceModal salary={salary} open={modalOpen} onOpenChange={setModalOpen} showTrigger={false} />
      </div>
    </div>
  );
};

export default RequestAdvancePage;