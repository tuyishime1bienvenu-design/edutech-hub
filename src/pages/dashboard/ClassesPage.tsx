import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Clock, BookOpen, Eye, Edit, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/DataTablePagination';

interface ClassItem {
  id: string;
  name: string;
  level: 'L3' | 'L4' | 'L5';
  shift: 'morning' | 'afternoon';
  max_capacity: number;
  current_enrollment: number;
  is_active: boolean;
  program_id: string | null;
  programs?: { name: string } | null;
}

const ClassesPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    level: 'L3' as 'L3' | 'L4' | 'L5',
    shift: 'morning' as 'morning' | 'afternoon',
    max_capacity: 30,
    program_id: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`*, programs (name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ClassItem[];
    },
  });

  const { paginatedData, currentPage, totalPages, goToPage, nextPage, previousPage, hasNextPage, hasPreviousPage, totalItems } = usePagination({
    data: classes,
    itemsPerPage: 10,
  });

  const { data: programs } = useQuery({
    queryKey: ['programs-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const addClassMutation = useMutation({
    mutationFn: async (classData: typeof newClass) => {
      const { error } = await supabase.from('classes').insert({
        name: classData.name,
        level: classData.level,
        shift: classData.shift,
        max_capacity: classData.max_capacity,
        program_id: classData.program_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddDialogOpen(false);
      setNewClass({ name: '', level: 'L3', shift: 'morning', max_capacity: 30, program_id: '' });
      toast({ title: 'Class created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating class', description: error.message, variant: 'destructive' });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async (classData: typeof newClass & { id: string }) => {
      const { error } = await supabase.from('classes').update({
        name: classData.name,
        level: classData.level,
        shift: classData.shift,
        max_capacity: classData.max_capacity,
        program_id: classData.program_id || null,
      }).eq('id', classData.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsEditDialogOpen(false);
      setIsDetailsDialogOpen(false);
      setSelectedClass(null);
      toast({ title: 'Class updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error updating class', description: error.message, variant: 'destructive' });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDetailsDialogOpen(false);
      setSelectedClass(null);
      toast({ title: 'Class deleted' });
    },
  });

  const handleSeeDetails = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setIsDetailsDialogOpen(true);
  };

  const handleEdit = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setNewClass({
      name: classItem.name,
      level: classItem.level,
      shift: classItem.shift,
      max_capacity: classItem.max_capacity,
      program_id: classItem.program_id || '',
    });
    setIsEditDialogOpen(true);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Classes</h1>
          <p className="text-muted-foreground">Manage training classes and enrollments</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No classes found. Create your first class.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{classItem.name}</TableCell>
                  <TableCell>{classItem.programs?.name || 'No Program'}</TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(classItem.level)}>{classItem.level}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">{classItem.shift}</TableCell>
                  <TableCell>
                    {classItem.current_enrollment || 0} / {classItem.max_capacity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                      {classItem.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSeeDetails(classItem)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
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
      </div>

      {/* Class Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Class Details - {selectedClass?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Program</Label>
                  <p className="font-medium">{selectedClass.programs?.name || 'No Program'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Level</Label>
                  <Badge className={getLevelColor(selectedClass.level)}>{selectedClass.level}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Shift</Label>
                  <p className="font-medium capitalize">{selectedClass.shift}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Capacity</Label>
                  <p className="font-medium">{selectedClass.current_enrollment || 0} / {selectedClass.max_capacity}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleEdit(selectedClass)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Class
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteClassMutation.mutate(selectedClass.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Class
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="e.g., Web Development L3 Morning"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={newClass.level}
                  onValueChange={(value: 'L3' | 'L4' | 'L5') => setNewClass({ ...newClass, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L3">L3</SelectItem>
                    <SelectItem value="L4">L4</SelectItem>
                    <SelectItem value="L5">L5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select
                  value={newClass.shift}
                  onValueChange={(value: 'morning' | 'afternoon') => setNewClass({ ...newClass, shift: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newClass.max_capacity}
                  onChange={(e) => setNewClass({ ...newClass, max_capacity: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Program (Optional)</Label>
                <Select
                  value={newClass.program_id || 'none'}
                  onValueChange={(value) => setNewClass({ ...newClass, program_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Program</SelectItem>
                    {programs?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addClassMutation.mutate(newClass)}
              disabled={!newClass.name || addClassMutation.isPending}
            >
              {addClassMutation.isPending ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Class Name</Label>
              <Input
                id="edit-name"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Level</Label>
                <Select
                  value={newClass.level}
                  onValueChange={(value: 'L3' | 'L4' | 'L5') => setNewClass({ ...newClass, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L3">L3</SelectItem>
                    <SelectItem value="L4">L4</SelectItem>
                    <SelectItem value="L5">L5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shift</Label>
                <Select
                  value={newClass.shift}
                  onValueChange={(value: 'morning' | 'afternoon') => setNewClass({ ...newClass, shift: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Max Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={newClass.max_capacity}
                  onChange={(e) => setNewClass({ ...newClass, max_capacity: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Program (Optional)</Label>
                <Select
                  value={newClass.program_id || 'none'}
                  onValueChange={(value) => setNewClass({ ...newClass, program_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Program</SelectItem>
                    {programs?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedClass && updateClassMutation.mutate({ ...newClass, id: selectedClass.id })}
              disabled={!newClass.name || updateClassMutation.isPending}
            >
              {updateClassMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesPage;
