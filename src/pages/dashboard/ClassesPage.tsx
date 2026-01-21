import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Clock, BookOpen, Eye, Edit, Trash2, X, UserPlus, Book } from 'lucide-react';
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
  trainer_id: string | null;
  trainer_name?: string | null;
}

const ClassesPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [newClass, setNewClass] = useState({
    name: '',
    level: 'L3' as 'L3' | 'L4' | 'L5',
    shift: 'morning' as 'morning' | 'afternoon',
    max_capacity: 30,
    program_id: '',
  });
  const [newCurriculum, setNewCurriculum] = useState({
    topic: '',
    description: '',
    order_index: 0,
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
      
      // Get trainer information
      const trainerIds = Array.from(new Set((data || []).map((c: any) => c.trainer_id).filter(Boolean)));
      let profilesMap: Record<string, string> = {};
      if (trainerIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', trainerIds as any[]);
        if (!pErr && profiles) {
          profiles.forEach((p: any) => {
            const name = p.full_name || p.email || p.user_id;
            profilesMap[p.user_id] = name;
          });
        }
      }
      
      return (data || []).map((c: any) => ({ 
        ...c, 
        trainer_name: c.trainer_id ? (profilesMap[c.trainer_id] || c.trainer_id) : null 
      })) as ClassItem[];
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

  const { data: trainers } = useQuery({
    queryKey: ['trainers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'trainer');
      if (error) throw error;
      
      const trainerIds = (data || []).map((ur: any) => ur.user_id);
      if (trainerIds.length === 0) return [];
      
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', trainerIds)
        .eq('is_active', true);
      if (pErr) throw pErr;
      
      return (profiles || []).map((p: any) => ({
        id: p.user_id,
        name: p.full_name || p.email || p.user_id
      }));
    },
  });

  const { data: curriculumItems = [], isLoading: curriculumLoading } = useQuery({
    queryKey: ['class-curriculum', selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass?.id) return [];
      const { data, error } = await (supabase as any)
        .from('class_curriculum')
        .select('*')
        .eq('class_id', selectedClass.id)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass?.id,
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

  const assignTrainerMutation = useMutation({
    mutationFn: async ({ classId, trainerId }: { classId: string; trainerId: string | null }) => {
      const { error } = await supabase
        .from('classes')
        .update({ trainer_id: trainerId })
        .eq('id', classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsTrainerDialogOpen(false);
      toast({ title: 'Trainer assigned successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error assigning trainer', description: error.message, variant: 'destructive' });
    },
  });

  const addCurriculumMutation = useMutation({
    mutationFn: async (curriculumData: typeof newCurriculum) => {
      if (!selectedClass?.id) throw new Error('No class selected');
      const { error } = await (supabase as any).from('class_curriculum').insert({
        class_id: selectedClass.id,
        topic: curriculumData.topic,
        description: curriculumData.description || null,
        order_index: curriculumData.order_index,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-curriculum'] });
      setNewCurriculum({ topic: '', description: '', order_index: 0 });
      toast({ title: 'Curriculum item added successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error adding curriculum', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCurriculumMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('class_curriculum').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-curriculum'] });
      toast({ title: 'Curriculum item deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting curriculum', description: error.message, variant: 'destructive' });
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

  const handleAssignTrainer = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setIsTrainerDialogOpen(true);
  };

  const handleManageCurriculum = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setIsCurriculumDialogOpen(true);
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
              <TableHead>Trainer</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    <span className="text-sm">
                      {classItem.trainer_name || 'No Trainer'}
                    </span>
                  </TableCell>
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
                <div>
                  <Label className="text-muted-foreground">Trainer</Label>
                  <p className="font-medium">{selectedClass.trainer_name || 'No Trainer Assigned'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedClass.is_active ? 'default' : 'secondary'}>
                    {selectedClass.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleEdit(selectedClass)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Class
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleAssignTrainer(selectedClass)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Trainer
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleManageCurriculum(selectedClass)}
                >
                  <Book className="w-4 h-4 mr-2" />
                  Manage Curriculum
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

      {/* Assign Trainer Dialog */}
      <Dialog open={isTrainerDialogOpen} onOpenChange={setIsTrainerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainer - {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Trainer</Label>
              <Select
                value={selectedClass?.trainer_id || 'none'}
                onValueChange={(value) => {
                  if (selectedClass) {
                    setSelectedClass({ ...selectedClass, trainer_id: value === 'none' ? null : value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Trainer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Trainer</SelectItem>
                  {trainers?.map(trainer => (
                    <SelectItem key={trainer.id} value={trainer.id}>{trainer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClass?.trainer_id && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current trainer: <span className="font-medium">{selectedClass.trainer_name || 'Unknown'}</span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrainerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedClass && assignTrainerMutation.mutate({ 
                classId: selectedClass.id, 
                trainerId: selectedClass.trainer_id 
              })}
              disabled={assignTrainerMutation.isPending}
            >
              {assignTrainerMutation.isPending ? 'Assigning...' : 'Assign Trainer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Curriculum Management Dialog */}
      <Dialog open={isCurriculumDialogOpen} onOpenChange={setIsCurriculumDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Curriculum - {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Add New Curriculum Item */}
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h3 className="font-medium">Add New Curriculum Item</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="curriculum-topic">Topic</Label>
                  <Input
                    id="curriculum-topic"
                    value={newCurriculum.topic}
                    onChange={(e) => setNewCurriculum({ ...newCurriculum, topic: e.target.value })}
                    placeholder="e.g., Introduction to React"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curriculum-description">Description</Label>
                  <Input
                    id="curriculum-description"
                    value={newCurriculum.description}
                    onChange={(e) => setNewCurriculum({ ...newCurriculum, description: e.target.value })}
                    placeholder="Brief description of the topic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="curriculum-order">Order</Label>
                  <Input
                    id="curriculum-order"
                    type="number"
                    value={newCurriculum.order_index}
                    onChange={(e) => setNewCurriculum({ ...newCurriculum, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="Order in curriculum"
                  />
                </div>
              </div>
              <Button
                onClick={() => addCurriculumMutation.mutate(newCurriculum)}
                disabled={!newCurriculum.topic || addCurriculumMutation.isPending}
              >
                {addCurriculumMutation.isPending ? 'Adding...' : 'Add Curriculum Item'}
              </Button>
            </div>

            {/* Existing Curriculum Items */}
            <div className="space-y-4">
              <h3 className="font-medium">Current Curriculum</h3>
              {curriculumLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : curriculumItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Book className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No curriculum items added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {curriculumItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-card border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">#{item.order_index + 1}</span>
                          <h4 className="font-medium">{item.topic}</h4>
                          {item.is_completed && (
                            <Badge variant="default" className="text-xs">Completed</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        {item.completed_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed: {new Date(item.completed_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCurriculumMutation.mutate(item.id)}
                        disabled={deleteCurriculumMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCurriculumDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesPage;
