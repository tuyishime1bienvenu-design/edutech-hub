import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Calendar, BookOpen, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const ProgramsPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProgram, setNewProgram] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    eligible_levels: [] as string[],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addProgramMutation = useMutation({
    mutationFn: async (programData: typeof newProgram) => {
      const { error } = await supabase.from('programs').insert({
        ...programData,
        eligible_levels: programData.eligible_levels as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setIsAddDialogOpen(false);
      setNewProgram({ name: '', description: '', start_date: '', end_date: '', eligible_levels: [] });
      toast({ title: 'Program created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error creating program', description: error.message, variant: 'destructive' });
    },
  });

  const toggleLevel = (level: string) => {
    setNewProgram(prev => ({
      ...prev,
      eligible_levels: prev.eligible_levels.includes(level)
        ? prev.eligible_levels.filter(l => l !== level)
        : [...prev.eligible_levels, level],
    }));
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
          <h1 className="text-2xl font-display font-bold">Programs</h1>
          <p className="text-muted-foreground">Manage training programs and cohorts</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No programs found. Create your first program.
          </div>
        ) : (
          programs?.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {program.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {program.description || 'No description'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(program.start_date), 'MMM d, yyyy')} - {format(new Date(program.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {program.eligible_levels?.map((level: string) => (
                        <Badge key={level} variant="secondary">{level}</Badge>
                      ))}
                    </div>
                    <Badge variant={program.is_active ? 'default' : 'secondary'}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Name</Label>
              <Input
                id="name"
                value={newProgram.name}
                onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })}
                placeholder="e.g., Web Development Cohort 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                placeholder="Brief description of the program..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newProgram.start_date}
                  onChange={(e) => setNewProgram({ ...newProgram, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newProgram.end_date}
                  onChange={(e) => setNewProgram({ ...newProgram, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Eligible Levels</Label>
              <div className="flex gap-4">
                {['L3', 'L4', 'L5'].map(level => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={newProgram.eligible_levels.includes(level)}
                      onCheckedChange={() => toggleLevel(level)}
                    />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => addProgramMutation.mutate(newProgram)}
              disabled={!newProgram.name || !newProgram.start_date || !newProgram.end_date || newProgram.eligible_levels.length === 0 || addProgramMutation.isPending}
            >
              {addProgramMutation.isPending ? 'Creating...' : 'Create Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramsPage;
