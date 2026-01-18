import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, Search, Eye, Building, User, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

const VisitorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  const { data: visitors, isLoading } = useQuery({
    queryKey: ['visitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('visited_at', { ascending: false });
      if (error) throw error;

      // Get student names for individual visitors
      const studentIds = data?.filter(v => v.student_id).map(v => v.student_id) || [];
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id')
        .in('id', studentIds);

      const userIds = students?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      return data?.map(visitor => ({
        ...visitor,
        student_name: visitor.student_id ?
          profiles?.find(p => p.user_id === students?.find(s => s.id === visitor.student_id)?.user_id)?.full_name
          : null,
      }));
    },
  });

  const filteredVisitors = visitors?.filter(visitor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      visitor.visitor_name?.toLowerCase().includes(searchLower) ||
      visitor.school_name?.toLowerCase().includes(searchLower) ||
      visitor.company_name?.toLowerCase().includes(searchLower) ||
      visitor.student_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const { paginatedData, currentPage, totalPages, goToPage, nextPage, previousPage, hasNextPage, hasPreviousPage, totalItems } = usePagination({
    data: filteredVisitors,
    itemsPerPage: 10,
  });

  const getVisitorTypeIcon = (type: string) => {
    switch (type) {
      case 'school': return <GraduationCap className="w-4 h-4" />;
      case 'company': return <Building className="w-4 h-4" />;
      case 'individual': return <User className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getVisitorTypeColor = (type: string) => {
    switch (type) {
      case 'school': return 'bg-blue-100 text-blue-800';
      case 'company': return 'bg-purple-100 text-purple-800';
      case 'individual': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPurposeText = (visitor: any) => {
    if (visitor.visitor_type === 'school') {
      return `School: ${visitor.school_name}`;
    }
    if (visitor.visitor_type === 'company') {
      return `Company: ${visitor.company_name}`;
    }
    if (visitor.visitor_type === 'individual') {
      if (visitor.visit_purpose === 'visit_children') {
        return `Visiting: ${visitor.student_name || 'Student'}`;
      }
      return 'Visiting Company';
    }
    return 'Unknown';
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
          <h1 className="text-2xl font-display font-bold">Visitors</h1>
          <p className="text-muted-foreground">View and manage visitor records</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search visitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Visited At</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No visitors found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>
                    <div className="font-medium">{visitor.visitor_name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getVisitorTypeColor(visitor.visitor_type)}>
                      <div className="flex items-center gap-1">
                        {getVisitorTypeIcon(visitor.visitor_type)}
                        {visitor.visitor_type}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getPurposeText(visitor)}</span>
                  </TableCell>
                  <TableCell>{format(new Date(visitor.visited_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedVisitor(visitor)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNext={nextPage}
          onPrevious={previousPage}
          hasNext={hasNextPage}
          hasPrevious={hasPreviousPage}
          totalItems={totalItems}
          itemsPerPage={10}
        />
      </motion.div>

      {/* Visitor Details Dialog */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visitor Details</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Visitor Name</label>
                <p className="text-lg font-semibold">{selectedVisitor.visitor_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Visitor Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {getVisitorTypeIcon(selectedVisitor.visitor_type)}
                  <Badge className={getVisitorTypeColor(selectedVisitor.visitor_type)}>
                    {selectedVisitor.visitor_type}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                <p className="mt-1">{getPurposeText(selectedVisitor)}</p>
              </div>

              {selectedVisitor.reason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <p className="mt-1">{selectedVisitor.reason}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Visited At</label>
                <p className="mt-1">{format(new Date(selectedVisitor.visited_at), 'PPP p')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitorsPage;