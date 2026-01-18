import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Clock, BookOpen, Eye, Edit, Trash2, UserPlus, ListChecks, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Trainer {
  user_id: string;
  full_name: string;
  email: string;
}

interface CurriculumItem {
  id: string;
  topic: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
}

const ClassesPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState({ topic: '', description: '' });
  const [newClass, setNewClass] = useState({
    name: '',
    level: 'L3' as 'L3' | 'L4' | 'L5',
    shift: 'morning' as 'morning' | 'afternoon',
    max_capacity: 30,
    program_id: '',
    // Internship-specific fields
    requires_computer: false,
    computer_requirement_notes: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const location = useLocation();
  const { primaryRole, user } = useAuth();
  const showOnlyAssigned = primaryRole === 'trainer' && location.pathname.includes('/my-classes');

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['classes', showOnlyAssigned, user?.id],
    queryFn: async () => {
      if (showOnlyAssigned) {
        if (!user?.id) return [];
        // get class ids assigned to this trainer
        const { data: ctData, error: ctError } = await supabase
          .from('class_trainers')
          .select('class_id')
          .eq('trainer_id', user.id);
        if (ctError) throw ctError;
        const classIds = ctData?.map((c: any) => c.class_id) || [];
        if (classIds.length === 0) return [];
        const { data, error } = await supabase
          .from('classes')
          .select(`*, programs (name)`)
          .in('id', classIds)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as ClassItem[];
      }

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

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const { data: trainerRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'trainer');
      if (rolesError) throw rolesError;
      
      const userIds = trainerRoles?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;
      
      return profiles as Trainer[];
    },
  });

  // Get assigned trainers for selected class
  const { data: classTrainers, refetch: refetchClassTrainers } = useQuery({
    queryKey: ['class-trainers', selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from('class_trainers')
        .select('trainer_id, profiles (user_id, full_name, email)')
        .eq('class_id', selectedClass.id);
      if (error) throw error;
      return data.map((ct: any) => ({
        user_id: ct.trainer_id,
        full_name: ct.profiles?.full_name || 'Unknown',
        email: ct.profiles?.email || '',
      }));
    },
    enabled: !!selectedClass,
  });

  // Get curriculum for selected class
  const { data: classCurriculum, refetch: refetchCurriculum } = useQuery({
    queryKey: ['class-curriculum', selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from('class_curriculum')
        .select('*')
        .eq('class_id', selectedClass.id)
        .order('order_index');
      if (error) throw error;
      return data as CurriculumItem[];
    },
    enabled: !!selectedClass,
  });

  // Get student count for selected class
  const { data: studentCount } = useQuery({
    queryKey: ['class-students-count', selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass) return 0;
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', selectedClass.id)
        .eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!selectedClass,
  });

  const addClassMutation = useMutation({
    mutationFn: async (classData: typeof newClass) => {
      const { error } = await supabase.from('classes').insert({
        ...classData,
        program_id: classData.program_id || null,
        requires_computer: classData.requires_computer,
        computer_requirement_notes: classData.computer_requirement_notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddDialogOpen(false);
      setNewClass({ 
        name: '', 
        level: 'L3', 
        shift: 'morning', 
        max_capacity: 30, 
        program_id: '',
        requires_computer: false,
        computer_requirement_notes: '',
      });
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
        requires_computer: classData.requires_computer,
        computer_requirement_notes: classData.computer_requirement_notes || null,
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

  const assignTrainersMutation = useMutation({
    mutationFn: async ({ classId, trainerIds }: { classId: string; trainerIds: string[] }) => {
      await supabase.from('class_trainers').delete().eq('class_id', classId);
      
      if (trainerIds.length > 0) {
        const { error } = await supabase.from('class_trainers').insert(
          trainerIds.map((trainerId, index) => ({
            class_id: classId,
            trainer_id: trainerId,
            is_primary: index === 0,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchClassTrainers();
      setIsTrainerDialogOpen(false);
      toast({ title: 'Trainers assigned successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error assigning trainers', description: error.message, variant: 'destructive' });
    },
  });

  const addCurriculumMutation = useMutation({
    mutationFn: async ({ classId, topic, description }: { classId: string; topic: string; description: string }) => {
      if (primaryRole === 'trainer') throw new Error('Not authorized');
      const { error } = await supabase.from('class_curriculum').insert({
        class_id: classId,
        topic,
        description: description || null,
        order_index: (classCurriculum?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchCurriculum();
      setNewTopic({ topic: '', description: '' });
      toast({ title: 'Topic added' });
    },
    onError: (error) => {
      toast({ title: 'Error adding topic', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCurriculumMutation = useMutation({
    mutationFn: async (id: string) => {
      if (primaryRole === 'trainer') throw new Error('Not authorized');
      const { error } = await supabase.from('class_curriculum').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchCurriculum();
      toast({ title: 'Topic removed' });
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

  const handleAssignTrainers = () => {
    if (selectedClass) {
      setIsTrainerDialogOpen(true);
      if (classTrainers) {
        setSelectedTrainers(classTrainers.map(t => t.user_id));
      }
    }
  };

  const handleCreateCurriculum = () => {
    if (selectedClass) {
      setIsCurriculumDialogOpen(true);
    }
  };

  const toggleTrainer = (trainerId: string) => {
    setSelectedTrainers(prev =>
      prev.includes(trainerId)
        ? prev.filter(id => id !== trainerId)
        : [...prev, trainerId]
    );
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
        {!showOnlyAssigned && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        )}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClass(classItem);
                        setIsCurriculumDialogOpen(true);
                      }}
                    >
                      <ListChecks className="w-4 h-4 mr-1" />
                      Curriculum
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Class Details - {selectedClass?.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailsDialogOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedClass && (
            <div className="space-y-6">
              {/* Class Info */}
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
                  <p className="font-medium">
                    {selectedClass.current_enrollment || 0} / {selectedClass.max_capacity}
                  </p>
                </div>
              </div>

              {/* Total Students */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-semibold">Total Students</Label>
                  </div>
                  <p className="text-2xl font-bold">{studentCount || 0}</p>
                </div>
              </div>

              {/* Assigned Trainers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-semibold">Assigned Trainers</Label>
                  </div>
                  {primaryRole !== 'trainer' && (
                    <Button size="sm" onClick={handleAssignTrainers}>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Assign Trainer
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  {classTrainers && classTrainers.length > 0 ? (
                    <div className="space-y-2">
                      {classTrainers.map((trainer) => (
                        <div key={trainer.user_id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium">{trainer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{trainer.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No trainers assigned</p>
                  )}
                </div>
              </div>

              {/* Curriculum */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-semibold">Curriculum</Label>
                  </div>
                  {primaryRole !== 'trainer' && (
                    <Button size="sm" onClick={handleCreateCurriculum}>
                      <Plus className="w-4 h-4 mr-1" />
                      Create Curriculum
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  {classCurriculum && classCurriculum.length > 0 ? (
                    <div className="space-y-2">
                      {classCurriculum.map((item, index) => (
                        <div key={item.id} className="flex items-start justify-between p-3 bg-muted rounded">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-muted-foreground font-medium">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="font-medium">{item.topic}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              )}
                            </div>
                          </div>
                          {primaryRole !== 'trainer' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCurriculumMutation.mutate(item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No curriculum topics yet</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {primaryRole !== 'trainer' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => handleEdit(selectedClass)} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Class
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this class?')) {
                        deleteClassMutation.mutate(selectedClass.id);
                      }
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Class
                  </Button>
                </div>
              )}
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
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={newClass.program_id}
                onValueChange={(value) => setNewClass({ ...newClass, program_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={newClass.max_capacity}
                onChange={(e) => setNewClass({ ...newClass, max_capacity: parseInt(e.target.value) })}
              />
            </div>

            {/* Computer Requirements */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm">Computer Requirements</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_computer"
                  checked={newClass.requires_computer}
                  onCheckedChange={(checked) =>
                    setNewClass({ ...newClass, requires_computer: checked as boolean })
                  }
                />
                <Label htmlFor="requires_computer" className="cursor-pointer">
                  This class requires students to have computers
                </Label>
              </div>

              {newClass.requires_computer && (
                <div className="space-y-2">
                  <Label htmlFor="computer_notes">Computer Requirement Notes</Label>
                  <Textarea
                    id="computer_notes"
                    value={newClass.computer_requirement_notes}
                    onChange={(e) => setNewClass({ ...newClass, computer_requirement_notes: e.target.value })}
                    placeholder="Specify computer requirements (e.g., minimum specs, software needed, etc.)"
                    rows={3}
                  />
                </div>
              )}
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
            <div className="space-y-2">
              <Label>Program</Label>
              <Select
                value={newClass.program_id}
                onValueChange={(value) => setNewClass({ ...newClass, program_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Max Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                value={newClass.max_capacity}
                onChange={(e) => setNewClass({ ...newClass, max_capacity: parseInt(e.target.value) })}
              />
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
              {updateClassMutation.isPending ? 'Updating...' : 'Update Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Trainers Dialog */}
      <Dialog open={isTrainerDialogOpen} onOpenChange={(open) => {
        setIsTrainerDialogOpen(open);
        if (open && classTrainers) {
          setSelectedTrainers(classTrainers.map(t => t.user_id));
        } else if (!open) {
          setSelectedTrainers([]);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainers to {selectedClass?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select trainers to assign to this class.
            </p>
            {trainers?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No trainers available. Create trainer accounts first.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {trainers?.map(trainer => (
                  <label
                    key={trainer.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${primaryRole === 'trainer' ? '' : 'hover:bg-muted cursor-pointer'}`}
                  >
                    {primaryRole !== 'trainer' && (
                      <Checkbox
                        checked={selectedTrainers.includes(trainer.user_id)}
                        onCheckedChange={() => toggleTrainer(trainer.user_id)}
                      />
                    )}
                    <div>
                      <p className="font-medium">{trainer.full_name}</p>
                      <p className="text-sm text-muted-foreground">{trainer.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrainerDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedClass && assignTrainersMutation.mutate({
                classId: selectedClass.id,
                trainerIds: selectedTrainers,
              })}
              disabled={assignTrainersMutation.isPending}
            >
              {assignTrainersMutation.isPending ? 'Saving...' : 'Save Assignments'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Curriculum Dialog */}
      <Dialog open={isCurriculumDialogOpen} onOpenChange={setIsCurriculumDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Curriculum - {selectedClass?.name} {selectedClass ? `\u2014 ${studentCount || 0} students` : ''}
            </DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define topics that trainers should cover in this class.
            </p>
            {primaryRole !== 'trainer' ? (
              <>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Topic title"
                      value={newTopic.topic}
                      onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={newTopic.description}
                      onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={() => selectedClass && addCurriculumMutation.mutate({
                      classId: selectedClass.id,
                      topic: newTopic.topic,
                      description: newTopic.description,
                    })}
                    disabled={!newTopic.topic || addCurriculumMutation.isPending}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-4 rounded border bg-muted">
                <p className="text-sm text-muted-foreground">You have read-only access to the curriculum for this class.</p>
              </div>
            )}
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {classCurriculum && classCurriculum.length > 0 ? (
                classCurriculum.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm">{index + 1}.</span>
                      <div>
                        <p className="font-medium">{item.topic}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteCurriculumMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No curriculum topics yet.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCurriculumDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassesPage;
