import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Award,
  BookOpen,
  TrendingUp,
  Star,
  Filter,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/integrations/supabase/service-client";
import type { Database } from "@/integrations/supabase/types";

type Program = Database["public"]["Tables"]["programs"]["Row"];

const Programs = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data: programsData, error } = await supabaseService
          .from("programs")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log("Fetched programs:", programsData);
        setPrograms(programsData || []);
      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const isProgramOpen = (program: Program) => {
    // For now, show all active programs regardless of dates (same as Register.tsx)
    // TODO: Implement proper date-based filtering for upcoming/current programs
    return program.is_active;
  };

  const openPrograms = programs.filter(isProgramOpen);
  const closedPrograms = programs.filter(program => !isProgramOpen(program));

  const filteredPrograms = [...openPrograms, ...closedPrograms].filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === "all" || (selectedLevel as any) && program.eligible_levels.includes(selectedLevel as any);
    
    // Debug logging
    console.log('Filtering program:', program.name);
    console.log('- eligible_levels:', program.eligible_levels);
    console.log('- selectedLevel:', selectedLevel);
    console.log('- matchesSearch:', matchesSearch);
    console.log('- matchesLevel:', matchesLevel);
    console.log('- final result:', matchesSearch && matchesLevel);
    
    return matchesSearch && matchesLevel;
  });

  const filteredOpenPrograms = filteredPrograms.filter(isProgramOpen);
  const filteredClosedPrograms = filteredPrograms.filter(program => !isProgramOpen(program));

  const getProgramStatus = (program: Program) => {
    if (!program.is_active) return { status: 'Closed', color: 'gray', reason: 'Program inactive' };
    
    // For now, show all active programs as 'Open' (same as Register.tsx logic)
    return { status: 'Open', color: 'green', reason: 'Available for registration' };
  };

  const getProgramImage = (programName: string) => {
    const name = programName.toLowerCase();
    if (name.includes('web')) return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    if (name.includes('network')) return "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    if (name.includes('cyber')) return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    if (name.includes('mobile')) return "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    if (name.includes('data')) return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    if (name.includes('react')) return "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    return "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
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
            <img src="/logo.svg" alt="EdTech Solutions" className="h-24 w-auto mx-auto" />
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Professional ICT Training Programs
            </h1>
            <p className="text-xl text-white/90">
              Choose from industry-aligned courses designed to equip you with in-demand skills
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => navigate("/register")}
              >
                Apply Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-max-width">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: programs.length.toString(), label: "Training Programs", icon: BookOpen },
              { value: openPrograms.length.toString(), label: "Open Programs", icon: CheckCircle2 },
              { value: "500+", label: "Students Trained", icon: Users },
              { value: "95%", label: "Success Rate", icon: TrendingUp },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} variants={itemVariants} className="text-center">
                  <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= SEARCH & FILTER ================= */}
      <section className="section-padding-sm bg-background">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="professional-card p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search programs by name or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base form-input-premium"
                />
              </div>
              <div className="flex items-center gap-2 min-w-fit">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring/30 focus:outline-none bg-card text-foreground"
                >
                  <option value="all">All Levels</option>
                  <option value="L3">Level 3</option>
                  <option value="L4">Level 4</option>
                  <option value="L5">Level 5</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= PROGRAMS GRID ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading programs...</p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Open Programs */}
              {filteredOpenPrograms.length > 0 && (
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 mb-10"
                  >
                    <CheckCircle2 className="h-8 w-8 text-success" />
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                      Open for Registration
                    </h2>
                    <Badge className="ml-auto bg-success/20 text-success border-success/30">
                      {filteredOpenPrograms.length} Program{filteredOpenPrograms.length !== 1 ? 's' : ''}
                    </Badge>
                  </motion.div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredOpenPrograms.map((program) => (
                      <motion.div key={program.id} variants={itemVariants}>
                        <div className="professional-card overflow-hidden group h-full hover-lift border-success/50">
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                            <img
                              src={getProgramImage(program.name)}
                              alt={program.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            <Badge className="absolute top-4 right-4 bg-success text-white border-success/30">
                              Open
                            </Badge>
                          </div>
                          <div className="p-6 space-y-4">
                            <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                              {program.name}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {program.description}
                            </p>
                            <div className="space-y-2 pt-4 border-t border-border">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4 text-primary" />
                                <span>Eligible: {program.eligible_levels.join(", ")}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>
                                  {Math.ceil((new Date(program.end_date).getTime() - new Date(program.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                              </div>
                            </div>
                            <Button
                              className="w-full btn-primary mt-4"
                              onClick={() => navigate("/register")}
                            >
                              Apply Now <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Closed Programs */}
              {filteredClosedPrograms.length > 0 && (
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 mb-10"
                  >
                    <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                      Available Programs
                    </h2>
                    <Badge className="ml-auto bg-muted text-muted-foreground border-border">
                      {filteredClosedPrograms.length} Program{filteredClosedPrograms.length !== 1 ? 's' : ''}
                    </Badge>
                  </motion.div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filteredClosedPrograms.map((program) => (
                      <motion.div key={program.id} variants={itemVariants}>
                        <div className="professional-card overflow-hidden group h-full hover-lift opacity-75">
                          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted/20 to-muted/10">
                            <img
                              src={getProgramImage(program.name)}
                              alt={program.name}
                              className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white">
                                <Calendar className="h-8 w-8 mx-auto mb-2" />
                                <div className="text-sm font-medium">
                                  {getProgramStatus(program).status}
                                </div>
                                <div className="text-xs opacity-75 mt-1">
                                  {getProgramStatus(program).reason}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            <h3 className="text-xl font-semibold text-foreground line-clamp-2">
                              {program.name}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {program.description}
                            </p>
                            <div className="space-y-2 pt-4 border-t border-border">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>Eligible: {program.eligible_levels.join(", ")}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {Math.ceil((new Date(program.end_date).getTime() - new Date(program.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" className="w-full mt-4" disabled>
                              {getProgramStatus(program).status === 'Expired' ? 'Program Ended' : 
                               getProgramStatus(program).status === 'Coming Soon' ? 'Not Yet Available' : 
                               'Registration Closed'}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {filteredPrograms.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No programs found matching your search criteria.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Programs;