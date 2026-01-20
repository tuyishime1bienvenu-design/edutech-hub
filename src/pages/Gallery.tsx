import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Users,
  GraduationCap,
  Code,
  Network,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string | null;
  tags: string[] | null;
  is_active: boolean | null;
}

const Gallery = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase
          .from("gallery_images")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setImages(data || []);
      } catch (error) {
        console.error("Error fetching gallery images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  const categories = [
    { id: "all", title: "All", icon: Camera },
    { id: "training", title: "Training Sessions", icon: GraduationCap },
    { id: "students", title: "Student Activities", icon: Users },
    { id: "projects", title: "Projects", icon: Code },
    { id: "facilities", title: "Facilities", icon: Network },
    { id: "events", title: "Events", icon: Camera },
  ];

  const filteredImages = selectedCategory === "all" 
    ? images 
    : images.filter(img => img.category === selectedCategory);

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
              Visual Journey Through Our Programs
            </h1>
            <p className="text-xl text-white/90">
              Discover the vibrant learning environment, student achievements, and state-of-the-art facilities at EdTech Solutions
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="section-padding bg-card border-b border-border">
        <div className="container-max-width">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4"
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <motion.div key={cat.id} variants={itemVariants}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    className={`flex items-center gap-2 ${isActive ? 'btn-primary' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.title}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ================= GALLERY GRID ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Featured Photos
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Explore our curated collection of moments from our training programs
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredImages.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredImages.map((image) => (
                <motion.div key={image.id} variants={itemVariants}>
                  <div 
                    className="group cursor-pointer h-64 overflow-hidden rounded-lg shadow-subtle hover:shadow-elevated transition-all duration-300"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={image.image_url}
                        alt={image.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-white font-semibold text-sm mb-1">{image.title}</h3>
                        {image.category && (
                          <Badge className="w-fit bg-white/20 text-white border-white/30 text-xs">
                            {image.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No images available in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="section-padding bg-card border-t border-border">
        <div className="container-max-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Our Impact in Numbers
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { value: "500+", label: "Students Trained", color: "text-blue-600" },
              { value: "95%", label: "Employment Rate", color: "text-green-600" },
              { value: "50+", label: "Partner Companies", color: "text-purple-600" },
              { value: "6", label: "Programs Offered", color: "text-orange-600" },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="text-center">
                <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
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
              Ready to Be Part of Our Story?
            </h2>
            <p className="text-xl text-white/90">
              Join our community of successful ICT professionals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => navigate("/register")}
              >
                Apply Now <ArrowRight className="ml-2 w-5 h-5" />
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

      {/* ================= IMAGE DIALOG ================= */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedImage && (
            <div>
              <img
                src={selectedImage.image_url}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{selectedImage.title}</h3>
                {selectedImage.description && (
                  <p className="text-muted-foreground mb-4">{selectedImage.description}</p>
                )}
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
