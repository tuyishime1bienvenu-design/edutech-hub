import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  ChevronRight,
  ArrowRight,
  Clock,
  Eye,
  Share2,
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

interface Announcement {
  id: string;
  title: string;
  category: "news" | "event" | "achievement" | "update" | "policy";
  author: string;
  publishedDate: string;
  content: string;
  excerpt: string;
  image?: string;
  views: number;
  tags: string[];
}

const Announcements = () => {
  const navigate = useNavigate();
  const [announcements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Exciting Partnership with Tech Giants Announced",
      category: "news",
      author: "Admin",
      publishedDate: "2026-01-15",
      excerpt:
        "EdTech Solutions has partnered with leading technology companies to provide our students with real-world experience and job opportunities.",
      content:
        "We are thrilled to announce our strategic partnership with leading technology companies in East Africa. This collaboration will enhance our training programs and provide our students with valuable internship and employment opportunities. Our students will have access to mentorship, workshops, and direct job placements in top tech companies. This partnership marks a significant milestone in our journey to create world-class technology professionals.",
      views: 1250,
      tags: ["partnership", "opportunity", "career"],
    },
    {
      id: "2",
      title: "500+ Students Successfully Graduated",
      category: "achievement",
      author: "Training Team",
      publishedDate: "2026-01-12",
      excerpt:
        "We celebrate the achievement of reaching 500+ successfully trained students in ICT programs.",
      content:
        "With immense pride, we announce that EdTech Solutions has successfully trained and graduated over 500 students in various ICT programs. Our comprehensive curriculum, experienced trainers, and hands-on learning approach have consistently delivered excellent results. Our graduates are now working in prestigious companies across East Africa, contributing to the digital transformation. This milestone reflects our commitment to quality education and student success.",
      views: 2890,
      tags: ["achievement", "milestone", "celebration"],
    },
    {
      id: "3",
      title: "New Web Development Bootcamp Starts February 1",
      category: "event",
      author: "Course Coordinator",
      publishedDate: "2026-01-10",
      excerpt:
        "Register now for our intensive 12-week Web Development Bootcamp starting February 1, 2026.",
      content:
        "We're excited to announce the launch of our new intensive Web Development Bootcamp! This comprehensive 12-week program covers modern web technologies including HTML5, CSS3, JavaScript, React, Node.js, and databases. The bootcamp features hands-on projects, real-world case studies, and career preparation modules. Limited seats available - early registration recommended. Contact admissions@edtechsolutions.rw for more details.",
      views: 1875,
      tags: ["bootcamp", "web-development", "enrollment"],
    },
    {
      id: "4",
      title: "Campus Expansion Project Complete",
      category: "update",
      author: "Management",
      publishedDate: "2026-01-08",
      excerpt:
        "We're proud to announce the completion of our campus expansion with new state-of-the-art training facilities.",
      content:
        "Our campus expansion project has been successfully completed! We now have brand-new state-of-the-art training facilities including modern computer labs, collaborative learning spaces, and a professional development center. These improvements will significantly enhance our training delivery and student experience. All facilities are equipped with the latest technology and designed for optimal learning outcomes.",
      views: 945,
      tags: ["infrastructure", "expansion", "facilities"],
    },
    {
      id: "5",
      title: "Data Science Certificate Program Now Available",
      category: "news",
      author: "Curriculum Team",
      publishedDate: "2026-01-05",
      excerpt:
        "Introducing our new Data Science Certificate Program with practical industry training.",
      content:
        "We're delighted to introduce our new Data Science Certificate Program! This comprehensive 8-week program teaches data analysis, Python programming, SQL, data visualization, and machine learning fundamentals. Designed in collaboration with industry experts, the program focuses on practical skills and real-world applications. Perfect for professionals looking to transition into data science or enhance their analytical capabilities.",
      views: 2156,
      tags: ["data-science", "certificate", "training"],
    },
    {
      id: "6",
      title: "Important: New Student Policy Updates",
      category: "policy",
      author: "Administration",
      publishedDate: "2026-01-02",
      excerpt:
        "Review important updates to our attendance and assessment policies for all students.",
      content:
        "Effective January 15, 2026, the following policy updates will be implemented: 1) Minimum 85% attendance requirement for all programs 2) New grading scale for assessments 3) Mandatory participation in final projects 4) Updated leave of absence procedures. All students are required to review and acknowledge these changes. Detailed policy documents are available on our student portal.",
      views: 3421,
      tags: ["policy", "students", "important"],
    },
    {
      id: "7",
      title: "95% Employment Rate Achieved by Our Graduates",
      category: "achievement",
      author: "Career Services",
      publishedDate: "2025-12-28",
      excerpt:
        "EdTech Solutions celebrates 95% employment rate among recent graduates.",
      content:
        "We're proud to announce that 95% of our recent graduates have secured employment within 3 months of completing their programs. This outstanding achievement reflects the quality of our training, industry relevance of our curriculum, and strong employer partnerships. Our graduates work at companies including leading tech firms, startups, and multinational organizations. This success demonstrates our commitment to preparing students for successful careers.",
      views: 4125,
      tags: ["employment", "success", "career"],
    },
    {
      id: "8",
      title: "UI/UX Design Workshop - January 25",
      category: "event",
      author: "Training Team",
      publishedDate: "2025-12-20",
      excerpt:
        "Join our free UI/UX Design workshop featuring industry experts.",
      content:
        "All students and professionals interested in UI/UX design are invited to our free workshop on January 25, 2026. This interactive session will cover design principles, user research, prototyping, and hands-on tools. Led by senior designers from top tech companies, this is an excellent opportunity to learn from industry experts. Registration is free but limited to 50 participants. Sign up at training@edtechsolutions.rw",
      views: 1687,
      tags: ["workshop", "ux-design", "event"],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      filterCategory === "all" || announcement.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailDialog(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      news: { bg: "bg-blue-100", text: "text-blue-700", icon: "📰" },
      event: { bg: "bg-purple-100", text: "text-purple-700", icon: "📅" },
      achievement: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: "🏆",
      },
      update: { bg: "bg-orange-100", text: "text-orange-700", icon: "🔔" },
      policy: { bg: "bg-red-100", text: "text-red-700", icon: "📋" },
    };
    return colors[category] || colors.news;
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
            {/* Search Bar */}
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

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Filter className="inline w-4 h-4 mr-2" />
                  Category
                </label>
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="form-input-premium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="achievement">Achievements</SelectItem>
                    <SelectItem value="update">Updates</SelectItem>
                    <SelectItem value="policy">Policies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {filteredAnnouncements.length} Announcement{filteredAnnouncements.length !== 1 ? "s" : ""} Found
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= ANNOUNCEMENTS LIST ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          {filteredAnnouncements.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {filteredAnnouncements.map((announcement) => {
                const categoryColor = getCategoryColor(announcement.category);
                return (
                  <motion.div key={announcement.id} variants={itemVariants}>
                    <div className="professional-card h-full flex flex-col hover-lift group cursor-pointer">
                      {/* Category Badge */}
                      <div className="mb-4">
                        <Badge className={`${categoryColor.bg} ${categoryColor.text}`}>
                          {announcement.category.charAt(0).toUpperCase() +
                            announcement.category.slice(1)}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-3">
                        {announcement.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-muted-foreground text-sm mb-4 flex-grow line-clamp-3">
                        {announcement.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {announcement.tags.slice(0, 2).map((tag, idx) => (
                          <Badge
                            key={idx}
                            className="text-xs bg-muted text-muted-foreground border-border"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Meta Info */}
                      <div className="border-t border-border pt-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(
                              announcement.publishedDate
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>{announcement.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{announcement.author}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          className="w-full text-primary hover:text-primary/80 justify-start px-0"
                          onClick={() => handleViewDetails(announcement)}
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
                Subscribe to our newsletter to receive the latest news, events, and
                announcements directly to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="form-input-premium flex-1"
              />
              <Button className="btn-primary whitespace-nowrap">
                Subscribe <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= DETAIL DIALOG ================= */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="space-y-4 w-full">
                  <div>
                    <Badge className={`${getCategoryColor(selectedAnnouncement.category).bg} ${getCategoryColor(selectedAnnouncement.category).text}`}>
                      {selectedAnnouncement.category.charAt(0).toUpperCase() +
                        selectedAnnouncement.category.slice(1)}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl">
                    {selectedAnnouncement.title}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-6">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(
                        selectedAnnouncement.publishedDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{selectedAnnouncement.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{selectedAnnouncement.views} views</span>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground leading-relaxed">
                    {selectedAnnouncement.content}
                  </p>
                </div>

                {/* Tags */}
                {selectedAnnouncement.tags.length > 0 && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnnouncement.tags.map((tag, idx) => (
                        <Badge key={idx} className="bg-muted text-muted-foreground border-border">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share & Actions */}
                <div className="flex gap-3 border-t border-border pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}?announcement=${selectedAnnouncement.id}`
                      );
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </Button>
                  <Button className="btn-primary flex-1">
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
