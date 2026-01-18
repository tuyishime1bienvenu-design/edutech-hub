import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [studentsRes, classesRes, attendanceRes, paymentsRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('attendance')
          .select('is_present')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('payments')
          .select('amount')
          .eq('status', 'paid')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      const totalStudents = studentsRes.count || 0;
      const activeClasses = classesRes.count || 0;
      
      const attendanceData = attendanceRes.data || [];
      const presentCount = attendanceData.filter(a => a.is_present).length;
      const attendanceRate = attendanceData.length > 0 
        ? Math.round((presentCount / attendanceData.length) * 100) 
        : 0;

      const paymentsData = paymentsRes.data || [];
      const totalPayments = paymentsData.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        totalStudents,
        activeClasses,
        attendanceRate,
        totalPayments,
      };
    },
  });
};
