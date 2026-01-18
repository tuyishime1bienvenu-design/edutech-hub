import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/#about" },
    { label: "Programs", href: "/programs" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Vacancies", href: "/vacancies" },
    { label: "News", href: "/announcements" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ================= STICKY NAVIGATION ================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-border/50"
            : "bg-white border-b border-border/30"
        }`}
      >
        <div className="container-max-width">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 flex-shrink-0 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img
                src="/logo.jpg"
                alt="EdTech Solutions"
                className="h-12 md:h-14 w-auto object-contain"
              />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive(link.href)
                      ? "text-secondary bg-secondary/10"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex text-foreground/70 hover:text-foreground font-medium"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                size="sm"
                className="btn-primary rounded-full px-6"
                onClick={() => navigate("/programs")}
              >
                <span className="hidden sm:inline">Apply Now</span>
                <span className="sm:hidden">Apply</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors duration-300"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6 text-foreground" />
                ) : (
                  <Menu className="w-6 h-6 text-foreground" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-border shadow-lg overflow-hidden"
          >
            <div className="container-max-width py-4 space-y-1">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isActive(link.href)
                      ? "text-secondary bg-secondary/10"
                      : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="border-t border-border pt-4 mt-4 space-y-3 px-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  className="btn-primary w-full"
                  onClick={() => {
                    navigate("/programs");
                    setIsMenuOpen(false);
                  }}
                >
                  Apply Now
                </Button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-grow">{children}</main>

      {/* ================= PROFESSIONAL FOOTER ================= */}
      <footer className="bg-primary text-white">
        {/* Main Footer Content */}
        <div className="container-max-width section-padding-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <img
                src="/logo.jpg"
                alt="EdTech Solutions"
                className="h-16 w-auto mb-6 bg-white p-2 rounded-lg"
              />
              <p className="text-white/70 leading-relaxed text-sm mb-6">
                Innovating ICT Learning for the Future. Empowering secondary and TVET students with world-class training and career opportunities in Rwanda.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, href: "#" },
                  { icon: Twitter, href: "#" },
                  { icon: Instagram, href: "#" },
                  { icon: Linkedin, href: "#" },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center transition-all duration-300"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Programs */}
            <div>
              <h4 className="font-display font-bold text-lg mb-6">Programs</h4>
              <ul className="space-y-3">
                {[
                  "Web Development",
                  "Networking & IT",
                  "Cybersecurity",
                  "Mobile App Development",
                  "Data Analytics",
                  "Digital Marketing",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="/programs"
                      className="text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 text-sm"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "/#about" },
                  { label: "Our Services", href: "/services" },
                  { label: "Photo Gallery", href: "/gallery" },
                  { label: "Career Opportunities", href: "/vacancies" },
                  { label: "Latest News", href: "/announcements" },
                  { label: "Contact Us", href: "/contact" },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 text-sm"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-display font-bold text-lg mb-6">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">+250 789 402 303</p>
                    <p className="text-white/50 text-xs">Mon - Fri, 8AM - 6PM</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">info@edtechsolutions.rw</p>
                    <p className="text-white/50 text-xs">We reply within 24 hours</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Kigali, Rwanda</p>
                    <p className="text-white/50 text-xs">Gasabo District</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container-max-width py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-white/60 text-sm text-center md:text-left">
                © {new Date().getFullYear()} EdTech Solutions. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">
                  Terms of Service
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors duration-300">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
