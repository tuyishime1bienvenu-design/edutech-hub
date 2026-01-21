import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export const MessagesIndicator = () => {
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .from('contact_messages')
        .select('id', { count: 'exact' })
        .eq('status', 'unread');
      
      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (unreadCount === 0) return null;

  return (
    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
};
