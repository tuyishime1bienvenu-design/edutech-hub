import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, Clock, User, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

const activityIcons: Record<string, React.ElementType> = {
  student: User,
  payment: CreditCard,
  attendance: CheckCircle,
  class: FileText,
  user: User,
  default: Activity,
};

const activityColors: Record<string, string> = {
  student: 'bg-primary/10 text-primary',
  payment: 'bg-green-100 text-green-700',
  attendance: 'bg-blue-100 text-blue-700',
  class: 'bg-purple-100 text-purple-700',
  user: 'bg-orange-100 text-orange-700',
  default: 'bg-muted text-muted-foreground',
};

const getActionColor = (action: string) => {
  if (action.includes('create') || action.includes('add')) return 'bg-green-100 text-green-800';
  if (action.includes('update') || action.includes('edit')) return 'bg-blue-100 text-blue-800';
  if (action.includes('delete') || action.includes('remove')) return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

export const RecentActivityCard = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-semibold">Recent Activity</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : activities?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No recent activity</p>
          <p className="text-sm">System activities will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities?.map((activity, index) => {
            const Icon = activityIcons[activity.entity_type] || activityIcons.default;
            const colorClass = activityColors[activity.entity_type] || activityColors.default;
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getActionColor(activity.action)} variant="secondary">
                      {activity.action}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {activity.entity_type}
                    </Badge>
                  </div>
                  {activity.details && typeof activity.details === 'object' && (
                    <p className="text-sm text-muted-foreground truncate">
                      {(activity.details as Record<string, string>).full_name || 
                       (activity.details as Record<string, string>).registration_number || 
                       'Activity recorded'}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
