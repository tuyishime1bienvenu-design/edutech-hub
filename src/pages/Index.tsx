import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Network,
  Code,
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
  Target,
  Lightbulb,
  Globe,
  Phone,
  Mail,
  MapPin,
  Play,
  Zap,
  BookOpen,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Program = Database["public"]["Tables"]["programs"]["Row"];

const Index = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: programsData } = await supabase
          .from("programs")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);
        setPrograms(programsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { value: "500+", label: "Students Trained", icon: Users },
    { value: "95%", label: "Employment Rate", icon: TrendingUp },
    { value: "15+", label: "Expert Instructors", icon: GraduationCap },
    { value: "6+", label: "ICT Programs", icon: Award },
  ];

  const services = [
    {
      icon: Code,
      title: "Web Development",
      description: "Master modern web technologies including HTML, CSS, JavaScript, React, and backend development.",
    },
    {
      icon: Network,
      title: "Networking & IT",
      description: "Learn network administration, server management, and IT infrastructure essentials.",
    },
    {
      icon: Shield,
      title: "Cybersecurity",
      description: "Protect digital assets with ethical hacking, security analysis, and defense strategies.",
    },
    {
      icon: Smartphone,
      title: "Mobile Development",
      description: "Build Android and iOS apps using modern frameworks and development tools.",
    },
    {
      icon: BarChart3,
      title: "Data Analytics",
      description: "Transform data into insights with analytics, visualization, and business intelligence.",
    },
    {
      icon: Globe,
      title: "Digital Marketing",
      description: "Master SEO, social media, content marketing, and digital advertising strategies.",
    },
  ];

  const benefits = [
    {
      icon: GraduationCap,
      title: "Industry-Certified Training",
      description: "Get recognized certifications that employers value and trust.",
    },
    {
      icon: Lightbulb,
      title: "Hands-On Projects",
      description: "Learn by doing with real-world projects and practical assignments.",
    },
    {
      icon: Users,
      title: "Expert Mentorship",
      description: "Learn from industry professionals with years of experience.",
    },
    {
      icon: Target,
      title: "Career Placement",
      description: "Get connected with top employers and job opportunities.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container-max-width relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-secondary text-white border-none px-4 py-2 text-sm font-medium">
                  🎓 Rwanda's Leading ICT Training Center
                </Badge>
              </motion.div>

              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                  Transform Your Future with{" "}
                  <span className="text-secondary">World-Class</span> ICT Skills
                </h1>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-xl">
                  Join EdTech Solutions and master cutting-edge technologies. We prepare secondary and TVET students for successful careers in the digital economy.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="btn-primary text-base px-8 py-6 rounded-full"
                  onClick={() => navigate("/programs")}
                >
                  Explore Programs
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 text-base px-8 py-6 rounded-full"
                  onClick={() => navigate("/contact")}
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Video
                </Button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/20">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="text-center md:text-left"
                  >
                    <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-white/70 mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Feature Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg-elevated p-8 relative z-10">
                  <img
                    src="/logo.jpg"
                    alt="EdTech Solutions"
                    className="w-full max-w-xs mx-auto mb-6"
                  />
                  <div className="text-center">
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">
                      Innovating ICT Learning
                    </h3>
                    <p className="text-muted-foreground text-sm">For The Future</p>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 z-20"
                >
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Industry Certified</p>
                    <p className="text-xs text-muted-foreground">Recognized Qualifications</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 z-20"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">4.9 Rating</p>
                    <p className="text-xs text-muted-foreground">From 500+ students</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section id="about" className="section-padding bg-muted/30">
        <div className="container-max-width">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <Badge className="bg-secondary/10 text-secondary border-secondary/20">About Us</Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Empowering Rwanda's Next Generation of Tech Leaders
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                EdTech Solutions is Rwanda's premier ICT training center, dedicated to bridging the digital skills gap. We provide world-class training programs designed specifically for secondary and TVET students (Levels 3, 4, and 5).
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to transform young Rwandans into skilled technology professionals ready to thrive in the global digital economy. With expert instructors, modern facilities, and industry-aligned curriculum, we ensure our graduates are job-ready from day one.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4">
                {[
                  { icon: Clock, label: "6+ Years Experience" },
                  { icon: Users, label: "500+ Graduates" },
                  { icon: Award, label: "95% Job Placement" },
                  { icon: BookOpen, label: "6+ Programs" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>

              <Button
                className="btn-secondary mt-6 rounded-full px-8"
                onClick={() => navigate("/contact")}
              >
                Learn More About Us
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            {/* Right - Image/Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="EdTech Solutions Training"
                  className="w-full max-w-sm mx-auto rounded-xl shadow-lg"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-secondary/20 rounded-2xl -z-10" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/10 rounded-2xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= SERVICES/PROGRAMS SECTION ================= */}
      <section className="section-padding bg-white">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Our Programs</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Industry-Aligned ICT Training Programs
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose from our comprehensive range of programs designed to launch your career in technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-secondary/30 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-secondary/10 flex items-center justify-center mb-4 transition-colors duration-300">
                      <service.icon className="w-7 h-7 text-primary group-hover:text-secondary transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              className="btn-primary rounded-full px-8"
              onClick={() => navigate("/programs")}
            >
              View All Programs
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="section-padding gradient-hero text-white">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Sets EdTech Solutions Apart
            </h2>
            <p className="text-white/80 text-lg">
              We don't just teach technology—we prepare you for a successful career.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{benefit.title}</h3>
                <p className="text-white/70">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROGRAMS FROM DB ================= */}
      {programs.length > 0 && (
        <section className="section-padding bg-muted/30">
          <div className="container-max-width">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <Badge className="bg-success/10 text-success border-success/20 mb-4">
                <Zap className="w-4 h-4 mr-1" />
                Open for Enrollment
              </Badge>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Current Training Programs
              </h2>
              <p className="text-muted-foreground text-lg">
                Enroll now in our latest programs and start your journey to success.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.slice(0, 6).map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
                    onClick={() => navigate("/programs")}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20 text-xs">
                          Open
                        </Badge>
                      </div>
                      <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                        {program.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {program.description || "Join this program to gain valuable skills."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Eligible: {program.eligible_levels.join(", ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA SECTION ================= */}
      <section className="section-padding bg-white">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-primary/90 rounded-3xl p-8 md:p-12 lg:p-16 text-center text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6">
                Ready to Start Your Tech Career?
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-8">
                Join hundreds of successful graduates. Enroll in our next cohort and transform your future with world-class ICT training.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-8 py-6 text-base font-semibold"
                  onClick={() => navigate("/programs")}
                >
                  Apply Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-semibold"
                  onClick={() => navigate("/contact")}
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Contact Us
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= CONTACT INFO ================= */}
      <section className="section-padding-sm bg-muted/30">
        <div className="container-max-width">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Phone,
                title: "Call Us",
                info: "+250 789 402 303",
                subtext: "Mon - Fri, 8AM - 6PM",
              },
              {
                icon: Mail,
                title: "Email Us",
                info: "info@edtechsolutions.rw",
                subtext: "We reply within 24 hours",
              },
              {
                icon: MapPin,
                title: "Visit Us",
                info: "Kigali, Rwanda",
                subtext: "Gasabo District",
              },
            ].map((contact, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl p-6 flex items-center gap-4 shadow-sm border border-border/50"
              >
                <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <contact.icon className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{contact.title}</p>
                  <p className="font-semibold text-foreground">{contact.info}</p>
                  <p className="text-xs text-muted-foreground">{contact.subtext}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
