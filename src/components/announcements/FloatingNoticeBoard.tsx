import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, ExternalLink, Calendar, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: string | null;
  created_at: string;
  is_holiday: boolean | null;
  holiday_date: string | null;
}

export function FloatingNoticeBoard() {
  const [isOpen, setIsOpen] = useState(true); // Open by default or closed? "must see it" implies visible.
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicNotices = async () => {
      try {
        const { data, error } = await supabase
          .from("notices")
          .select("*")
          .eq("is_active", true)
          .eq("is_public", true) // Assuming the column exists now
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          // Fallback if column doesn't exist yet (for safety in dev)
          console.warn("Error fetching public notices, trying fallback", error);
          // If is_public fails, maybe just fetch general ones? 
          // No, better to fail gracefully or just show empty.
        } else {
          setNotices(data || []);
        }
      } catch (err) {
        console.error("Error fetching notices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicNotices();
  }, []);

  if (loading || notices.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="w-80 md:w-96"
          >
            <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-primary/5">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-bold text-primary">Notice Board</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px] p-4">
                  <div className="space-y-4">
                    {notices.map((notice) => (
                      <div key={notice.id} className="group border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between mb-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-primary/30 text-primary bg-primary/5">
                            {notice.notice_type || 'Notice'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(notice.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                          {notice.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {notice.content}
                        </p>
                        {notice.holiday_date && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 p-1.5 rounded">
                            <Calendar className="w-3 h-3" />
                            <span>Holiday: {new Date(notice.holiday_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center relative hover:bg-primary/90 transition-colors"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {notices.length}
          </span>
        </motion.button>
      )}
    </div>
  );
}
