import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, UserPlus, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

const StudentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: students, isLoading, error: studentsError } = useQuery({
    queryKey: ['students', levelFilter],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          classes (name)
        `)
        .order('created_at', { ascending: false });
      
      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter as 'L3' | 'L4' | 'L5');
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Fetch profiles separately
      const userIds = data.map(s => s.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        return data.map(s => ({
          ...s,
          profile: null
        }));
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone')
        .in('user_id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Don't throw, just return students without profiles
      }
      
      return data.map(s => ({
        ...s,
        profile: profiles?.find(p => p.user_id === s.user_id) || null
      }));
    },
  });

  const filteredStudents = students?.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.profile?.full_name?.toLowerCase().includes(searchLower) ||
      student.registration_number?.toLowerCase().includes(searchLower) ||
      student.school_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const { paginatedData, currentPage, totalPages, goToPage, nextPage, previousPage, hasNextPage, hasPreviousPage, totalItems } = usePagination({
    data: filteredStudents,
    itemsPerPage: 10,
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'L3': return 'bg-blue-100 text-blue-800';
      case 'L4': return 'bg-purple-100 text-purple-800';
      case 'L5': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (studentsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading students</p>
          <p className="text-sm text-muted-foreground">
            {studentsError instanceof Error ? studentsError.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student records and enrollments</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="L3">L3</SelectItem>
            <SelectItem value="L4">L4</SelectItem>
            <SelectItem value="L5">L5</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Reg. Number</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {students && students.length === 0 
                    ? 'No students registered yet. Use "Register Student" to add students.'
                    : searchTerm || levelFilter !== 'all'
                    ? 'No students match your search criteria'
                    : 'No students found'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{student.profile?.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{student.registration_number}</TableCell>
                  <TableCell>{student.school_name}</TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(student.level)}>{student.level}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{student.preferred_shift}</TableCell>
                  <TableCell>{student.classes?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? 'default' : 'secondary'}>
                      {student.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Use the "Register Student" page to add new students with full details.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
