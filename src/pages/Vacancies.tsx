import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Upload,
  FileText,
  X,
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Vacancy {
  id: string;
  title: string;
  department: string;
  location: string | null;
  type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  deadline: string | null;
  description: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  is_active: boolean | null;
  created_at: string;
}

const Vacancies = () => {
  const navigate = useNavigate();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const { data, error } = await supabase
          .from("vacancies")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setVacancies(data || []);
      } catch (error) {
        console.error("Error fetching vacancies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  const filteredVacancies = vacancies.filter((vacancy) => {
    const matchesSearch =
      vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vacancy.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vacancy.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = filterType === "all" || vacancy.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleApplyClick = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setShowApplicationDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancy) return;

    setIsSubmitting(true);

    try {
      // Upload files to storage
      const documentUrls: string[] = [];
      for (const file of uploadedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('job-documents')
          .getPublicUrl(fileName);
        
        documentUrls.push(urlData.publicUrl);
      }

      // Save application to database
      const { error } = await supabase
        .from('job_applications')
        .insert({
          vacancy_id: selectedVacancy.id,
          full_name: applicationData.fullName,
          email: applicationData.email,
          phone: applicationData.phone,
          cover_letter: applicationData.coverLetter,
          documents: documentUrls,
        });

      if (error) throw error;

      toast.success("Application submitted successfully! We will contact you soon.");
      setShowApplicationDialog(false);
      setApplicationData({ fullName: "", email: "", phone: "", coverLetter: "" });
      setUploadedFiles([]);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("Failed to submit application: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      "full-time": "from-blue-500 to-blue-600",
      "part-time": "from-purple-500 to-purple-600",
      contract: "from-orange-500 to-orange-600",
      internship: "from-green-500 to-green-600",
    };
    return colors[type || "full-time"] || "from-gray-500 to-gray-600";
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `RWF ${(min / 1000).toFixed(0)}K - ${(max / 1000).toFixed(0)}K`;
    if (min) return `From RWF ${(min / 1000).toFixed(0)}K`;
    if (max) return `Up to RWF ${(max / 1000).toFixed(0)}K`;
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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
              <div className="flex items-end">
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
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredVacancies.length > 0 ? (
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
                            {vacancy.type || "Full-time"}
                          </Badge>
                          {vacancy.location && (
                            <Badge className="bg-primary/5 text-primary border-primary/20">
                              <MapPin className="w-3 h-3 mr-1" />
                              {vacancy.location}
                            </Badge>
                          )}
                        </div>

                        {vacancy.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {vacancy.description}
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {formatSalary(vacancy.salary_min, vacancy.salary_max) && (
                            <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                              <p className="text-xs text-muted-foreground">Salary Range</p>
                              <p className="font-semibold text-foreground text-sm">
                                {formatSalary(vacancy.salary_min, vacancy.salary_max)}
                              </p>
                            </div>
                          )}
                          <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
                            <p className="text-xs text-muted-foreground">Posted</p>
                            <p className="font-semibold text-foreground text-sm">
                              {new Date(vacancy.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {vacancy.deadline && (
                          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              Application Deadline
                            </p>
                            <p className="font-semibold text-foreground">
                              {new Date(vacancy.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        )}

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
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Vacancies Found
                </h3>
                <p className="text-muted-foreground">
                  Check back later for new opportunities!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ================= APPLICATION DIALOG ================= */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedVacancy?.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitApplication} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={applicationData.fullName}
                  onChange={(e) => setApplicationData({ ...applicationData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={applicationData.phone}
                onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                value={applicationData.coverLetter}
                onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                rows={4}
                placeholder="Tell us why you're interested in this position..."
              />
            </div>

            <div className="space-y-4">
              <Label>Upload Documents (CV, Certificates, etc.)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select Files
                  </label>
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowApplicationDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !applicationData.fullName || !applicationData.email}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vacancies;
