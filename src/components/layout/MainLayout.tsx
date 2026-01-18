import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Menu, X } from "lucide-react";
import { useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "About", href: "/#about" },
    { label: "Programs", href: "/programs" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Vacancies", href: "/vacancies" },
    { label: "News", href: "/announcements" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ================= STICKY HEADER ================= */}
      <header className="sticky top-0 z-50 bg-card border-b border-border/50 shadow-subtle backdrop-blur-sm">
        <div className="container-max-width">
          <div className="flex items-center justify-between py-4 md:py-5">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/")}>
              <img src="/logo.svg" alt="EdTech Solutions" className="h-14 w-auto" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive(link.href)
                      ? "text-primary bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
              <Button
                size="sm"
                className="btn-primary text-sm md:text-base px-4 md:px-6"
                onClick={() => navigate("/programs")}
              >
                Apply Now
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
      {isMenuOpen && (
        <nav className="lg:hidden bg-card border-b border-border/50 shadow-md animate-in slide-in-from-top-2 duration-300">
          <div className="container-max-width py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isActive(link.href)
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-border/50 pt-4 mt-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
              >
                Login
              </Button>
              <Button
                size="sm"
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
        </nav>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-grow">
        {children}
      </main>

      {/* ================= PROFESSIONAL FOOTER ================= */}
      <footer className="bg-gradient-to-r from-foreground/95 to-foreground text-white mt-20">
        <div className="container-max-width section-padding">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <img src="/logo.svg" alt="EdTech Solutions" className="h-20 w-auto" />
              <p className="text-white/70 leading-relaxed text-sm">
                Empowering secondary and TVET students with world-class ICT training and professional development opportunities.
              </p>
              <div className="flex gap-3 pt-4">
                <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-300">
                  <Facebook className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Programs</h4>
              <ul className="space-y-3">
                {["Web Development", "Networking", "Cybersecurity", "Mobile App Dev", "Data Analytics"].map((item) => (
                  <li key={item}>
                    <a href="/programs" className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: "About Us", href: "/" },
                  { label: "Services", href: "/services" },
                  { label: "Gallery", href: "/gallery" },
                  { label: "Vacancies", href: "/vacancies" },
                  { label: "News", href: "/announcements" },
                  { label: "Contact", href: "/contact" },
                  { label: "Login", href: "/login" }
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-bold text-lg mb-6 text-white">Contact</h4>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <Phone className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-sm font-medium">+250 789 402 303</p>
                    <p className="text-white/50 text-xs">Available 8 AM - 6 PM</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Mail className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-sm font-medium">info@edtechsolutions.rw</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <MapPin className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/70 text-sm font-medium">Kigali, Rwanda</p>
                    <p className="text-white/50 text-xs">Gasabo District</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-8"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © 2026 EdTech Solutions. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
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
      </footer>
    </div>
  );
};

export default MainLayout;