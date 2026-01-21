import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Users,
  GraduationCap,
  Code,
  Network,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  type: string;
  event_name: string | null;
  tags: string[] | null;
  is_public: boolean;
  created_at: string;
}

const Gallery = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "slideshow">("grid");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
    : images.filter(img => img.event_name?.toLowerCase().includes(selectedCategory) || img.tags?.some(tag => tag.toLowerCase().includes(selectedCategory)));

  // Slideshow auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && viewMode === "slideshow" && filteredImages.length > 0) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % filteredImages.length);
      }, 3000); // Change slide every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying, viewMode, filteredImages.length]);

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        console.log('Fetching public gallery images...');
        const { data, error } = await supabase
          .from("gallery_items")
          .select("*")
          .eq("is_public", true)
          .eq("type", "image")
          .order("created_at", { ascending: false });

        if (error) {
          console.error('Error fetching gallery images:', error);
          throw error;
        }
        
        console.log('Public gallery images fetched:', data);
        setImages(data || []);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                  Featured Photos
                </h2>
                <p className="text-lg text-muted-foreground mt-4">
                  Explore our curated collection of moments from our training programs
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  onClick={() => setViewMode("grid")}
                  className="flex items-center gap-2"
                >
                  <Grid3x3 className="w-4 h-4" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === "slideshow" ? "default" : "outline"}
                  onClick={() => setViewMode("slideshow")}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Slideshow
                </Button>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredImages.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredImages.map((image, index) => (
                    <motion.div key={`${image.id}-${index}`} variants={itemVariants}>
                      <div 
                        className="group cursor-pointer h-64 overflow-hidden rounded-lg shadow-subtle hover:shadow-elevated transition-all duration-300"
                        onClick={() => setSelectedImage(image)}
                      >
                        <div className="relative w-full h-full">
                          <img
                            src={image.file_url}
                            alt={image.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <h3 className="text-white font-semibold text-sm mb-1">{image.title}</h3>
                            {image.event_name && (
                              <Badge className="w-fit bg-white/20 text-white border-white/30 text-xs">
                                {image.event_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="relative">
                  {/* Slideshow View */}
                  <div className="relative h-[70vh] bg-black rounded-lg overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentSlideIndex}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full"
                      >
                        <img
                          src={filteredImages[currentSlideIndex]?.file_url}
                          alt={filteredImages[currentSlideIndex]?.title}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                          <h3 className="text-white text-2xl font-bold mb-2">
                            {filteredImages[currentSlideIndex]?.title}
                          </h3>
                          {filteredImages[currentSlideIndex]?.description && (
                            <p className="text-white/80 text-sm">
                              {filteredImages[currentSlideIndex]?.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Slideshow Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Slide Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {filteredImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToSlide(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentSlideIndex
                              ? "bg-white"
                              : "bg-white/50 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
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
            <>
              <DialogTitle className="sr-only">
                {selectedImage.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Full size view of {selectedImage.title}
              </DialogDescription>
              <div>
                <img
                  src={selectedImage.file_url}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
