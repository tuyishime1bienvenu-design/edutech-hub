import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Star,
  CheckCircle2,
  Award,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Zap,
  Target,
  Code,
  Network,
  Shield,
  Smartphone,
  BarChart3,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  features: string[] | null;
  price: string | null;
  color: string | null;
  is_active: boolean | null;
}

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Code,
  Network,
  Shield,
  Smartphone,
  BarChart3,
  Globe,
  Star,
  Target,
  Zap,
};

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const specialOffers = [
    {
      title: "School Partnership",
      description: "Special rates for educational institutions and student groups.",
      discount: "Up to 40% off",
      icon: Target,
    },
    {
      title: "Early Bird",
      description: "Register 30 days in advance and receive priority benefits.",
      discount: "20% off",
      icon: Zap,
    },
    {
      title: "Group Discount",
      description: "Bring 5+ students and enjoy significant savings together.",
      discount: "30% off",
      icon: Users,
    },
  ];

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

  const getIcon = (iconName: string | null) => {
    if (!iconName) return BookOpen;
    return iconMap[iconName] || BookOpen;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ================= HERO ================= */}
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
              Comprehensive ICT Services
            </h1>
            <p className="text-xl text-white/90">
              Training programs, internships, corporate solutions, and expert consultation
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => navigate("/contact")}
            >
              Get in Touch <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ================= SERVICES GRID ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Our Core Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored solutions designed to meet your specific training and professional development needs
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : services.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {services.map((service) => {
                const Icon = getIcon(service.icon);
                const colorClass = service.color || "from-blue-500 to-blue-600";
                return (
                  <motion.div key={service.id} variants={itemVariants}>
                    <div className="professional-card h-full overflow-hidden group hover-lift">
                      <div className={`h-1 bg-gradient-to-r ${colorClass}`} />
                      <div className="p-8 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-7 h-7" />
                          </div>
                          {service.price && (
                            <Badge className="bg-muted text-foreground border-border">
                              {service.price}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold text-foreground mb-3">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground text-base mb-6">
                            {service.description}
                          </p>
                        </div>
                        {service.features && service.features.length > 0 && (
                          <ul className="space-y-3 border-t border-border pt-6">
                            {service.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-3 text-sm font-medium text-foreground">
                                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No services available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= SPECIAL OFFERS ================= */}
      <section className="section-padding bg-card border-y border-border">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Star className="w-8 h-8 text-warning fill-warning" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Special Offers
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take advantage of our exclusive promotions and partnership programs
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {specialOffers.map((offer, idx) => {
              const Icon = offer.icon;
              return (
                <motion.div key={idx} variants={itemVariants}>
                  <div className="professional-card p-8 border-l-4 border-warning space-y-4 hover-lift group">
                    <div className="flex items-center justify-between">
                      <Icon className="w-8 h-8 text-warning" />
                      <Badge className="bg-warning/20 text-warning border-warning/30 font-bold">
                        {offer.discount}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {offer.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {offer.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full group-hover:border-primary group-hover:text-primary mt-4"
                      onClick={() => navigate("/contact")}
                    >
                      Claim Offer <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Proven excellence in ICT education and professional development
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Expert Faculty",
                description: "Learn from industry professionals with 10+ years of real-world experience",
                icon: BookOpen,
              },
              {
                title: "Recognized Programs",
                description: "Our certifications are valued by leading tech companies worldwide",
                icon: Award,
              },
              {
                title: "Proven Success",
                description: "95% employment rate for graduates within 6 months",
                icon: TrendingUp,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} variants={itemVariants} className="professional-card p-8">
                  <div className="inline-flex p-3 bg-primary/10 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="section-padding gradient-primary text-white">
        <div className="container-max-width text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 max-w-2xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90">
              Contact us today to learn more about our services and find the perfect solution for your needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => navigate("/contact")}
              >
                Contact Us <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => navigate("/programs")}
              >
                View Programs
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;
