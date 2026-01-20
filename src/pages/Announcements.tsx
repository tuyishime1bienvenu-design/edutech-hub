import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  Filter,
  Calendar,
  User,
  ChevronRight,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: string | null;
  is_holiday: boolean | null;
  holiday_date: string | null;
  is_active: boolean | null;
  created_at: string;
}

const Announcements = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data, error } = await supabase
          .from("notices")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotices(data || []);
      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || notice.notice_type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      announcement: { bg: "bg-blue-100", text: "text-blue-700", icon: "📰" },
      event: { bg: "bg-purple-100", text: "text-purple-700", icon: "📅" },
      holiday: { bg: "bg-green-100", text: "text-green-700", icon: "🎉" },
      update: { bg: "bg-orange-100", text: "text-orange-700", icon: "🔔" },
      policy: { bg: "bg-red-100", text: "text-red-700", icon: "📋" },
    };
    return colors[category || 'announcement'] || colors.announcement;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ================= HERO SECTION ================= */}
      <section className="gradient-primary text-white section-padding">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Latest Updates & News
            </h1>
            <p className="text-xl text-white/90">
              Stay informed about our programs, events, achievements, and important announcements
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= SEARCH & FILTERS ================= */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search announcements, news, and events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input-premium pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Filter className="inline w-4 h-4 mr-2" />
                  Category
                </label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="form-input-premium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="announcement">Announcements</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="holiday">Holidays</SelectItem>
                    <SelectItem value="update">Updates</SelectItem>
                    <SelectItem value="policy">Policies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <p className="text-sm font-medium text-muted-foreground">
                  {filteredNotices.length} Announcement{filteredNotices.length !== 1 ? "s" : ""} Found
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= ANNOUNCEMENTS LIST ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredNotices.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {filteredNotices.map((notice) => {
                const categoryColor = getCategoryColor(notice.notice_type);
                return (
                  <motion.div key={notice.id} variants={itemVariants}>
                    <div className="professional-card h-full flex flex-col hover-lift group cursor-pointer p-6">
                      <div className="mb-4">
                        <Badge className={`${categoryColor.bg} ${categoryColor.text}`}>
                          {notice.notice_type ? notice.notice_type.charAt(0).toUpperCase() + notice.notice_type.slice(1) : 'Announcement'}
                        </Badge>
                        {notice.is_holiday && (
                          <Badge className="ml-2 bg-green-100 text-green-700">Holiday</Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {notice.title}
                      </h3>

                      <p className="text-muted-foreground text-sm mb-4 flex-grow line-clamp-3">
                        {notice.content}
                      </p>

                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(notice.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {notice.holiday_date && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Calendar className="w-4 h-4" />
                            <span>Holiday: {new Date(notice.holiday_date).toLocaleDateString()}</span>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          className="w-full text-primary hover:text-primary/80 justify-start px-0"
                          onClick={() => setSelectedNotice(notice)}
                        >
                          Read More <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="professional-card p-12">
                <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Announcements Found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters. New announcements are posted regularly!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="professional-card p-8 text-center space-y-6"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-foreground">
                Stay Updated
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Visit our website regularly for the latest news, events, and important announcements.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-primary" onClick={() => navigate("/programs")}>
                View Programs <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= DETAIL DIALOG ================= */}
      <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedNotice?.title}</DialogTitle>
          </DialogHeader>
          {selectedNotice && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedNotice.created_at).toLocaleDateString()}
                </div>
                <Badge className={getCategoryColor(selectedNotice.notice_type).bg + ' ' + getCategoryColor(selectedNotice.notice_type).text}>
                  {selectedNotice.notice_type || 'Announcement'}
                </Badge>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{selectedNotice.content}</p>
              </div>
              {selectedNotice.holiday_date && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">
                    🎉 Holiday Date: {new Date(selectedNotice.holiday_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
