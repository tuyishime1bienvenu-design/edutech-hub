import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AttendanceChart = () => {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['attendance-chart'],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6);
      
      const { data, error } = await supabase
        .from('attendance')
        .select('date, is_present')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));
      
      if (error) throw error;

      // Create a map of all days in range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const byDate: Record<string, { present: number; total: number }> = {};
      
      days.forEach(day => {
        byDate[format(day, 'yyyy-MM-dd')] = { present: 0, total: 0 };
      });

      // Populate with actual data
      data?.forEach(record => {
        if (byDate[record.date]) {
          byDate[record.date].total++;
          if (record.is_present) {
            byDate[record.date].present++;
          }
        }
      });

      return Object.entries(byDate).map(([date, stats]) => ({
        day: format(new Date(date), 'EEE'),
        present: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
        absent: stats.total > 0 ? Math.round(((stats.total - stats.present) / stats.total) * 100) : 0,
      }));
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold">Weekly Attendance Trend</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Absent</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#presentGradient)"
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                fill="url(#absentGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};
