import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSalary = () => {
  return useQuery({
    queryKey: ['salary'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('employee_id', user.user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });
};
