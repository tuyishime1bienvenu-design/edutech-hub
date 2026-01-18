import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Network,
  Cpu,
  Shield,
  Smartphone,
  BarChart3,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
  TrendingUp,
  Calendar,
  Info,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Program = Database["public"]["Tables"]["programs"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const Index = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("*")
          .order("created_at", { ascending: false });

        if (programsError) throw programsError;
        setPrograms(programsData || []);

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (profilesError) throw profilesError;
        setTeamMembers(profilesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isProgramOpen = (program: Program) => {
    const now = new Date();
    const startDate = new Date(program.start_date);
    const endDate = new Date(program.end_date);
    return program.is_active && now >= startDate && now <= endDate;
  };

  const openPrograms = programs.filter(isProgramOpen).slice(0, 3);
  const closedPrograms = programs.filter(program => !isProgramOpen(program)).slice(0, 3);
  const featuredPrograms = programs.slice(0, 6);

  const handleProgramClick = (program: Program) => {
    navigate("/programs", { state: { selectedProgram: program } });
  };

  const stats = [
    { value: "500+", label: "Students Trained", icon: Users },
    { value: "95%", label: "Employment Rate", icon: TrendingUp },
    { value: "15+", label: "Expert Instructors", icon: GraduationCap },
    { value: "6", label: "ICT Programs", icon: Award },
  ];

  const services = [
    {
      icon: GraduationCap,
      title: "Launch Your Tech Career",
      description: "Master industry-aligned ICT skills with expert-designed curriculum that guarantees employability",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Users,
      title: "Real-World Experience",
      description: "Gain hands-on internships at top tech companies and build your professional network",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Shield,
      title: "Cybersecurity Mastery",
      description: "Become a digital guardian with advanced security skills that protect our digital future",
      color: "from-red-500 to-red-600",
    },
    {
      icon: Smartphone,
      title: "Mobile Innovation",
      description: "Create the next big app and lead mobile technology revolution in Rwanda",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Network,
      title: "Network Infrastructure",
      description: "Build and manage the digital backbone that connects our nation",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: BarChart3,
      title: "Data-Driven Insights",
      description: "Transform data into decisions that drive business success and innovation",
      color: "from-pink-500 to-pink-600",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <div className="min-h-screen">
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-screen flex items-center gradient-hero overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="container-max-width relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8 text-white"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex"
            >
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                ✨ Rwanda's #1 ICT Training Excellence
              </Badge>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight">
                Transform Your Future with <span className="text-cyan-300">World-Class ICT Skills</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-xl">
                Join Rwanda's leading ICT training center. Master cutting-edge technologies, gain real-world experience, and launch your dream career in tech. Your journey to becoming a digital innovator starts here.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button
                size="lg"
                className="btn-primary text-base"
                onClick={() => navigate("/programs")}
              >
                Start Your Tech Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 text-base"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/20">
              {stats.slice(0, 2).map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="space-y-1"
                >
                  <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Logo display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-3xl blur-2xl" />
              <div className="relative bg-card rounded-3xl shadow-lg-elevated p-12 border border-border/50 max-w-sm flex items-center justify-center min-h-96">
                <img
                  src="/logo.svg"
                  alt="EdTech Solutions Logo"
                  className="w-full h-auto"
                />
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-lg-elevated p-6 max-w-xs border border-border/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <h4 className="font-semibold text-foreground">Industry Certified</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Innovating ICT Learning for the Future
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">About EdTech Solutions</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-12">
              We're not just teaching technology—we're igniting dreams and creating opportunities. At EdTech Solutions, we believe every young Rwandan deserves the chance to shape their future through digital innovation. Our mission is to bridge the digital divide and empower the next generation of tech leaders.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Training</h3>
                <p className="text-gray-600">Industry-certified instructors with real-world experience</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Practical Learning</h3>
                <p className="text-gray-600">Hands-on projects and real-world problem solving</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Career Success</h3>
                <p className="text-gray-600">95% employment rate for our graduates</p>
              </motion.div>
            </div>
        </motion.div>
        </div>
      </section>

      {/* ================= PROGRAMS ================= */}
      <section
        id="programs"
        className="container mx-auto px-4 py-16 bg-white rounded-t-3xl"
      >
        <h3 className="text-3xl font-bold text-center mb-12">
          Our Training Programs
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading programs...</p>
          </div>
        ) : (
          <>
            {/* Open Programs */}
            {openPrograms.length > 0 && (
              <div className="mb-12">
                <h4 className="text-2xl font-semibold mb-6 text-green-700 flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Currently Open Programs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {openPrograms.map((program, index) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      viewport={{ once: true }}
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-green-200 hover:border-green-300" onClick={() => handleProgramClick(program)}>
                        <CardHeader>
                          <CardTitle className="text-green-700">{program.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-600">
                          <p className="mb-4">{program.description}</p>
                          <div className="text-sm text-green-600 font-medium">
                            Registration Open
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Eligible: {program.eligible_levels.join(", ")}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Closed Programs */}
            {closedPrograms.length > 0 && (
              <div>
                <h4 className="text-2xl font-semibold mb-8 text-gray-700 flex items-center gap-2">
                  <Info className="h-6 w-6" />
                  Available Programs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {closedPrograms.map((program, index) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      viewport={{ once: true }}
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                          <CardTitle>{program.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-gray-600">
                          <p className="mb-4">{program.description}</p>
                          <div className="text-sm text-gray-500">
                            {program.is_active ? "Coming Soon" : "Currently Closed"}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Eligible: {program.eligible_levels.join(", ")}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {programs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No programs available at the moment.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ================= GALLERY ================= */}
      <section
        id="gallery"
        className="container mx-auto px-4 py-16 text-center"
      >
        <h3 className="text-3xl font-bold mb-8">Training Gallery</h3>
        <p className="text-gray-600 mb-6">
          A glimpse into our practical training environment and student
          activities.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="h-40 bg-blue-100 rounded-xl"
            />
          ))}
        </div>
      </section>

      {/* ================= CONTACT ================= */}
      <section id="contact" className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-8">Contact Us</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3">
              <Phone />
              <p>0789 402 303</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Mail />
              <p>info@edtechsolutions.rw</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <MapPin />
              <p>Kigali, Rwanda</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="/logo.svg"
                  alt="EdTech Solutions"
                  className="h-8 w-auto brightness-0 invert"
                />
                <div>
                  <h3 className="text-lg font-bold">EdTech Solutions</h3>
                  <p className="text-sm text-gray-400">Training & Internship Center</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Rwanda's premier ICT training center, empowering the next generation of digital professionals.
              </p>
              <div className="flex gap-4">
                <a href="tel:+250789402303" className="text-gray-400 hover:text-white transition-colors">
                  <Phone className="h-5 w-5" />
                </a>
                <a href="mailto:info@edtechsolutions.rw" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
                <a href="https://maps.app.goo.gl/pcNRttP8VqWxWUKq6" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  <MapPin className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/programs" className="hover:text-white transition-colors">Web Development</a></li>
                <li><a href="/programs" className="hover:text-white transition-colors">Networking</a></li>
                <li><a href="/programs" className="hover:text-white transition-colors">Cybersecurity</a></li>
                <li><a href="/programs" className="hover:text-white transition-colors">Mobile Development</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/gallery" className="hover:text-white transition-colors">Gallery</a></li>
                <li><a href="/register" className="hover:text-white transition-colors">Register</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>Â© {new Date().getFullYear()} EdTech Solutions Training Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;