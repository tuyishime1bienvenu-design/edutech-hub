import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, GraduationCap } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Student {
  id: string;
  registration_number: string;
  user_id: string;
  school_name: string;
  level: string;
  is_active: boolean;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface StudentSearchSelectProps {
  value?: string;
  onValueChange: (studentId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const StudentSearchSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Search student by name or registration...", 
  disabled = false,
  className = ""
}: StudentSearchSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch students with search functionality
  const { data: students, isLoading } = useQuery({
    queryKey: ['students-search', searchTerm],
    queryFn: async () => {
      // First fetch students
      let query = supabase
        .from('students')
        .select(`
          id,
          registration_number,
          user_id,
          school_name,
          level,
          is_active
        `)
        .eq('is_active', true)
        .order('registration_number', { ascending: true })
        .limit(50);

      const { data: studentsData, error: studentsError } = await query;
      if (studentsError) throw studentsError;

      // Fetch user profiles separately
      const userIds = studentsData?.map(s => s.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      // Combine data
      const combinedData = studentsData?.map(student => ({
        ...student,
        profile: profiles?.find(p => p.user_id === student.user_id)
      }));

      // Filter by search term if it exists
      if (searchTerm && searchTerm.length >= 2) {
        return combinedData?.filter(student => 
          student.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return combinedData;
    },
    enabled: isOpen || searchTerm.length >= 2,
  });

  // Get selected student details
  const selectedStudent = students?.find(s => s.id === value);

  // Handle search input change
  const handleSearchChange = (searchValue: string) => {
    setSearchTerm(searchValue);
  };

  // Handle student selection
  const handleStudentSelect = (studentId: string) => {
    onValueChange(studentId);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Clear selection
  const handleClear = () => {
    onValueChange('');
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <Select
        value={value}
        onValueChange={handleStudentSelect}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedStudent ? (
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {selectedStudent.profile?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedStudent.registration_number} • {selectedStudent.level}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="w-4 h-4" />
                  <span className="truncate">{placeholder}</span>
                </div>
              )}
            </div>
            {selectedStudent && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClear();
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-sm hover:bg-muted"
              >
                ×
              </button>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <div className="p-2 sticky top-0 bg-background border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : students && students.length > 0 ? (
              <div className="p-1">
                {students.map((student) => (
                  <SelectItem
                    key={student.id}
                    value={student.id}
                    className="p-3 cursor-pointer hover:bg-muted"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <p className="font-medium truncate">
                            {student.profile?.full_name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Badge variant="outline" className="text-xs">
                            {student.registration_number}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {student.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <GraduationCap className="w-3 h-3" />
                          <span className="truncate">{student.school_name}</span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No students found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Type at least 2 characters to search</p>
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};
