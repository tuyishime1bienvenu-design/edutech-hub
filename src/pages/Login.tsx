import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GraduationCap, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      // Navigation will be handled by the protected route
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden"
      >
        {/* Decorative gradient blobs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <GraduationCap className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">EdTech Solutions</h1>
                <p className="text-white/80 text-sm">Professional Training Center</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-bold leading-tight">
                Welcome Back
              </h2>
              <p className="text-xl text-white/90 max-w-lg leading-relaxed">
                Access your personalized dashboard and continue your learning journey with world-class ICT training.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 pt-8">
              {[
                { icon: CheckCircle2, title: "Industry-Certified Programs", desc: "Recognized by leading tech companies" },
                { icon: CheckCircle2, title: "Expert Instructors", desc: "15+ years of combined experience" },
                { icon: CheckCircle2, title: "Job Placement Support", desc: "95% of graduates employed" }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <Icon className="w-6 h-6 text-white/80 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-white/70 text-sm">{item.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/20">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-white/70 text-sm">Students Trained</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-white/70 text-sm">Partner Companies</div>
              </div>
              <div>
                <div className="text-3xl font-bold">95%</div>
                <div className="text-white/70 text-sm">Success Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 mb-8 justify-center"
            >
              <div className="p-3 bg-primary rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">EdTech Solutions</h1>
                <p className="text-muted-foreground text-xs">Training Center</p>
              </div>
            </motion.div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">
              Access your account to continue learning
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="professional-card p-8 space-y-6">
            {/* Email Input */}
            <div className="space-y-3">
              <Label htmlFor="email" className="form-label-premium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input-premium pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="form-label-premium">
                  Password
                </Label>
                <a
                  href="#"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input-premium pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="btn-primary w-full h-12 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Support & Register */}
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Don't have an account?{' '}
                <a 
                  href="/register" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Create one now
                </a>
              </p>
            </div>

            <div className="border-t border-border pt-6 text-center">
              <p className="text-muted-foreground text-xs">
                Need help?{' '}
                <a 
                  href="mailto:support@edtech.rw" 
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  support@edtech.rw
                </a>
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              © 2024 EdTech Solutions. All rights reserved.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
