import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BriefcaseIcon,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Search,
  Filter,
  ChevronRight,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Vacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  salary_min?: number;
  salary_max?: number;
  posted_date: string;
  deadline: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

const Vacancies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vacancies] = useState<Vacancy[]>([
    {
      id: "1",
      title: "Senior ICT Trainer",
      department: "Training",
      location: "Kigali, Rwanda",
      type: "full-time",
      salary_min: 800000,
      salary_max: 1200000,
      posted_date: "2026-01-15",
      deadline: "2026-02-15",
      description:
        "Join our team as a Senior ICT Trainer and lead the development of cutting-edge training programs for our students.",
      responsibilities: [
        "Develop and deliver comprehensive ICT training curriculum",
        "Mentor junior trainers and teaching assistants",
        "Create engaging educational materials and assessments",
        "Manage student progress and provide feedback",
      ],
      requirements: [
        "Bachelor's degree in Computer Science or IT",
        "5+ years of ICT training experience",
        "Strong communication and leadership skills",
        "Experience with modern web technologies",
      ],
      benefits: [
        "Competitive salary and benefits package",
        "Professional development opportunities",
        "Flexible working arrangements",
        "Health insurance coverage",
      ],
    },
    {
      id: "2",
      title: "Web Development Instructor",
      department: "Training",
      location: "Kigali, Rwanda",
      type: "full-time",
      salary_min: 600000,
      salary_max: 900000,
      posted_date: "2026-01-12",
      deadline: "2026-02-10",
      description:
        "Teach web development fundamentals and advanced concepts to our diverse student body.",
      responsibilities: [
        "Teach HTML, CSS, JavaScript, and modern frameworks",
        "Create hands-on projects and real-world case studies",
        "Support students in portfolio development",
        "Stay current with industry trends and technologies",
      ],
      requirements: [
        "3+ years of professional web development experience",
        "Strong knowledge of modern web development stack",
        "Teaching or mentoring experience",
        "Passion for technology education",
      ],
      benefits: [
        "Competitive remuneration",
        "Career advancement opportunities",
        "Collaborative work environment",
        "Equipment and tools provided",
      ],
    },
    {
      id: "3",
      title: "UI/UX Design Specialist",
      department: "Training",
      location: "Kigali, Rwanda",
      type: "full-time",
      salary_min: 650000,
      salary_max: 950000,
      posted_date: "2026-01-10",
      deadline: "2026-02-05",
      description:
        "Create innovative design curriculum and mentor students in user-centered design principles.",
      responsibilities: [
        "Develop UI/UX design curriculum and materials",
        "Teach design principles, tools, and methodologies",
        "Review student projects and provide constructive feedback",
        "Conduct industry insights workshops",
      ],
      requirements: [
        "4+ years of UI/UX design experience",
        "Proficiency in design tools (Figma, Adobe Suite)",
        "Experience teaching or mentoring designers",
        "Strong portfolio demonstrating design excellence",
      ],
      benefits: [
        "Excellent compensation package",
        "Creative and collaborative environment",
        "Continuous learning opportunities",
        "Flexible schedule",
      ],
    },
    {
      id: "4",
      title: "Data Analytics Trainer",
      department: "Training",
      location: "Kigali, Rwanda",
      type: "full-time",
      salary_min: 700000,
      salary_max: 1000000,
      posted_date: "2026-01-08",
      deadline: "2026-02-08",
      description:
        "Lead our data analytics program and train students in data-driven decision making.",
      responsibilities: [
        "Design and deliver data analytics curriculum",
        "Teach SQL, Python, and analytics tools",
        "Facilitate real-world data projects",
        "Build partnerships with data analytics companies",
      ],
      requirements: [
        "5+ years of data analytics experience",
        "Expertise in SQL, Python, and BI tools",
        "Strong analytical and problem-solving skills",
        "Experience with data visualization",
      ],
      benefits: [
        "Competitive salary and performance bonuses",
        "Professional certification support",
        "Flexible working hours",
        "Training and development budget",
      ],
    },
    {
      id: "5",
      title: "Student Support Coordinator",
      department: "Support",
      location: "Kigali, Rwanda",
      type: "full-time",
      salary_min: 400000,
      salary_max: 600000,
      posted_date: "2026-01-05",
      deadline: "2026-02-01",
      description:
        "Provide comprehensive support to students throughout their training journey.",
      responsibilities: [
        "Assist students with program enrollment and onboarding",
        "Provide career guidance and mentorship",
        "Track student progress and outcomes",
        "Coordinate student events and activities",
      ],
      requirements: [
        "Excellent communication and interpersonal skills",
        "Organizational and time management abilities",
        "Experience in student services or customer support",
        "Knowledge of ICT programs beneficial",
      ],
      benefits: [
        "Competitive salary",
        "Supportive team environment",
        "Career development programs",
        "Annual leave and benefits",
      ],
    },
    {
      id: "6",
      title: "IT Infrastructure Intern",
      department: "IT Operations",
      location: "Kigali, Rwanda",
      type: "internship",
      posted_date: "2026-01-12",
      deadline: "2026-02-12",
      description:
        "Gain practical experience in IT infrastructure and systems administration.",
      responsibilities: [
        "Assist with server and network maintenance",
        "Support IT help desk operations",
        "Document system configurations",
        "Participate in IT projects and improvements",
      ],
      requirements: [
        "Currently pursuing or recently completed IT degree",
        "Basic knowledge of networking and systems",
        "Problem-solving mindset",
        "Willingness to learn and grow",
      ],
      benefits: [
        "Hands-on experience in IT operations",
        "Mentorship from experienced IT professionals",
        "Certificate of completion",
        "Potential for full-time conversion",
      ],
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cv: "",
    coverLetter: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);

  const filteredVacancies = vacancies.filter((vacancy) => {
    const matchesSearch =
      vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || vacancy.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleApplyClick = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setShowApplicationDialog(true);
  };

  const handleApplicationChange = (
    field: string,
    value: string
  ) => {
    setApplicationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setApplicationSuccess(true);

    setTimeout(() => {
      setShowApplicationDialog(false);
      setApplicationSuccess(false);
      setApplicationData({
        fullName: "",
        email: "",
        phone: "",
        cv: "",
        coverLetter: "",
      });
      toast({
        title: "Application Submitted",
        description: "Your application has been received. Good luck!",
      });
    }, 2000);
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "full-time": "from-blue-500 to-blue-600",
      "part-time": "from-purple-500 to-purple-600",
      contract: "from-orange-500 to-orange-600",
      internship: "from-green-500 to-green-600",
    };
    return colors[type] || "from-gray-500 to-gray-600";
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
              Join Our Team
            </h1>
            <p className="text-xl text-white/90">
              Explore exciting career opportunities and make a difference in technology education
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
                placeholder="Search by job title, department, or location..."
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
                  Job Type
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="form-input-premium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-Time</SelectItem>
                    <SelectItem value="part-time">Part-Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {filteredVacancies.length} Position{filteredVacancies.length !== 1 ? "s" : ""} Available
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= VACANCIES LIST ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          {filteredVacancies.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-6"
            >
              {filteredVacancies.map((vacancy) => (
                <motion.div key={vacancy.id} variants={itemVariants}>
                  <div className="professional-card p-6 hover-lift cursor-pointer transition-all group">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Job Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-3 bg-gradient-to-br ${getTypeColor(vacancy.type)} rounded-lg text-white`}>
                            <Briefcase className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                              {vacancy.title}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {vacancy.department}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            {vacancy.type}
                          </Badge>
                          <Badge className="bg-primary/5 text-primary border-primary/20">
                            <MapPin className="w-3 h-3 mr-1" />
                            {vacancy.location}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {vacancy.description}
                        </p>
                      </div>

                      {/* Details Grid */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {vacancy.salary_min && vacancy.salary_max && (
                            <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                              <p className="text-xs text-muted-foreground">Salary Range</p>
                              <p className="font-semibold text-foreground">
                                RWF {(vacancy.salary_min / 1000).toFixed(0)}K - {(vacancy.salary_max / 1000).toFixed(0)}K
                              </p>
                            </div>
                          )}
                          <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Posted</p>
                            <p className="font-semibold text-foreground text-sm">
                              {new Date(vacancy.posted_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Application Deadline
                          </p>
                          <p className="font-semibold text-foreground">
                            {new Date(vacancy.deadline).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          className="btn-primary w-full"
                          onClick={() => handleApplyClick(vacancy)}
                        >
                          Apply Now <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="professional-card p-12">
                <BriefcaseIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Vacancies Found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters. New positions are added regularly!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="section-padding gradient-primary text-white">
        <div className="container-max-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Not Finding What You're Looking For?
            </h2>
            <p className="text-xl text-white/90">
              Subscribe to our career updates and be notified of new opportunities
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= APPLICATION DIALOG ================= */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVacancy && `Apply for: ${selectedVacancy.title}`}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application
            </DialogDescription>
          </DialogHeader>

          {applicationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Application Submitted!
                </h3>
                <p className="text-muted-foreground">
                  Thank you for applying. We'll review your application and contact you soon.
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-6 py-4">
              {selectedVacancy && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-semibold text-foreground">{selectedVacancy.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Deadline: {new Date(selectedVacancy.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <Label className="form-label-premium">Full Name *</Label>
                <Input
                  type="text"
                  value={applicationData.fullName}
                  onChange={(e) => handleApplicationChange("fullName", e.target.value)}
                  className="form-input-premium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="form-label-premium">Email *</Label>
                  <Input
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => handleApplicationChange("email", e.target.value)}
                    className="form-input-premium"
                    required
                  />
                </div>
                <div>
                  <Label className="form-label-premium">Phone *</Label>
                  <Input
                    type="tel"
                    value={applicationData.phone}
                    onChange={(e) => handleApplicationChange("phone", e.target.value)}
                    className="form-input-premium"
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="form-label-premium">CV/Resume Link or Description *</Label>
                <Textarea
                  value={applicationData.cv}
                  onChange={(e) => handleApplicationChange("cv", e.target.value)}
                  className="form-input-premium resize-none h-24"
                  placeholder="Paste your CV/resume link or brief summary"
                  required
                />
              </div>

              <div>
                <Label className="form-label-premium">Cover Letter *</Label>
                <Textarea
                  value={applicationData.coverLetter}
                  onChange={(e) => handleApplicationChange("coverLetter", e.target.value)}
                  className="form-input-premium resize-none h-32"
                  placeholder="Tell us why you're interested in this position..."
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApplicationDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vacancies;
