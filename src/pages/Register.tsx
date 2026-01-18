import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Program = Database["public"]["Tables"]["programs"]["Row"];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",

    // Academic Information
    educationLevel: "",
    institution: "",
    graduationYear: "",
    gpa: "",

    // Program Selection
    programId: "",
    studentLevel: "",

    // Additional Information
    motivation: "",
    experience: "",
    specialNeeds: "",
    paymentMethod: "cash",
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    }
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setFormData(prev => ({ ...prev, programId: program.id }));
    setCurrentStep(2);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const required = ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'address'];
    return required.every(field => formData[field as keyof typeof formData].trim() !== "");
  };

  const validateStep2 = () => {
    const required = ['educationLevel', 'institution', 'graduationYear', 'studentLevel'];
    return required.every(field => formData[field as keyof typeof formData].trim() !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create student application record
      const applicationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone,
        education_level: formData.educationLevel,
        institution: formData.institution,
        graduation_year: parseInt(formData.graduationYear),
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        program_id: formData.programId,
        student_level: formData.studentLevel as Database["public"]["Enums"]["student_level"],
        motivation: formData.motivation,
        experience: formData.experience,
        special_needs: formData.specialNeeds,
        payment_method: formData.paymentMethod,
        status: "pending",
        registration_date: new Date().toISOString(),
      };

      // TODO: Update this to use the correct table name once the schema is updated
      // const { data, error } = await supabase
      //   .from("student_applications")
      //   .insert([applicationData])
      //   .select()
      //   .single();

      // if (error) throw error;

      setCurrentStep(4);

      setTimeout(() => {
        navigate("/");
      }, 3000);

    } catch (error) {
      console.error("Error submitting registration:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availablePrograms = programs.filter(program => {
    // For now, show all active programs regardless of dates
    // TODO: Implement proper date-based filtering for upcoming/current programs
    return program.is_active;
  });

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
              Join Our Community
            </h1>
            <p className="text-xl text-white/90">
              Start your professional journey with world-class ICT training
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================= REGISTRATION FORM ================= */}
      <section className="section-padding bg-background">
        <div className="container-max-width max-w-4xl">
          {/* Progress Bar */}
          {currentStep < 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                        currentStep >= step
                          ? "bg-primary text-white"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {step}
                    </motion.div>
                    {step < 3 && (
                      <div className={`flex-1 h-1 mx-2 transition-colors ${
                        currentStep > step ? "bg-primary" : "bg-border"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {currentStep === 1 && "Select Your Program"}
                    {currentStep === 2 && "Personal Information"}
                    {currentStep === 3 && "Academic & Payment Details"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep} of 3
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 1: PROGRAM SELECTION ================= */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    Choose Your Program
                  </h2>
                  <p className="text-muted-foreground">
                    Select from our professional ICT training programs
                  </p>
                </div>

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {availablePrograms.map((program) => (
                    <motion.div key={program.id} variants={itemVariants}>
                      <button
                        onClick={() => handleProgramSelect(program)}
                        className="professional-card p-6 h-full hover-lift w-full text-left group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <GraduationCap className="w-6 h-6 text-primary" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {program.name}
                        </h3>
                        {program.description && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                            {program.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {program.start_date && new Date(program.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 2: PERSONAL INFORMATION ================= */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="professional-card p-8"
            >
              <form onSubmit={e => { e.preventDefault(); setCurrentStep(3); }} className="space-y-6">
                {/* Program Badge */}
                {selectedProgram && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Selected Program</p>
                    <p className="text-lg font-semibold text-foreground">{selectedProgram.name}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-foreground mb-6">
                    Personal Information
                  </h3>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="form-label-premium">First Name *</Label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                  <div>
                    <Label className="form-label-premium">Last Name *</Label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="form-label-premium">Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                  <div>
                    <Label className="form-label-premium">Phone *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth & Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="form-label-premium">Date of Birth *</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                  <div>
                    <Label className="form-label-premium">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className="form-input-premium">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label className="form-label-premium">Address *</Label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="form-input-premium"
                    required
                  />
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="form-label-premium">Emergency Contact Name</Label>
                    <Input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      className="form-input-premium"
                    />
                  </div>
                  <div>
                    <Label className="form-label-premium">Emergency Phone</Label>
                    <Input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      className="form-input-premium"
                    />
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={!validateStep1()}
                  >
                    Continue <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ================= STEP 3: ACADEMIC & PAYMENT ================= */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="professional-card p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-6">
                    Academic & Payment Information
                  </h3>
                </div>

                {/* Education Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="form-label-premium">Education Level *</Label>
                    <Select value={formData.educationLevel} onValueChange={(value) => handleInputChange('educationLevel', value)}>
                      <SelectTrigger className="form-input-premium">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="secondary">Secondary School</SelectItem>
                        <SelectItem value="tvet">TVET</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="form-label-premium">Institution *</Label>
                    <Input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleInputChange('institution', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                </div>

                {/* Graduation Year & GPA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="form-label-premium">Graduation Year *</Label>
                    <Input
                      type="number"
                      value={formData.graduationYear}
                      onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                      className="form-input-premium"
                      required
                    />
                  </div>
                  <div>
                    <Label className="form-label-premium">GPA (Optional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.gpa}
                      onChange={(e) => handleInputChange('gpa', e.target.value)}
                      className="form-input-premium"
                    />
                  </div>
                </div>

                {/* Student Level */}
                <div>
                  <Label className="form-label-premium">Student Level *</Label>
                  <Select value={formData.studentLevel} onValueChange={(value) => handleInputChange('studentLevel', value)}>
                    <SelectTrigger className="form-input-premium">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Motivation & Experience */}
                <div>
                  <Label className="form-label-premium">Why Do You Want to Join? *</Label>
                  <Textarea
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    className="form-input-premium resize-none h-24"
                    required
                  />
                </div>

                <div>
                  <Label className="form-label-premium">Relevant Experience (Optional)</Label>
                  <Textarea
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="form-input-premium resize-none h-20"
                  />
                </div>

                {/* Special Needs */}
                <div>
                  <Label className="form-label-premium">Special Needs (Optional)</Label>
                  <Textarea
                    value={formData.specialNeeds}
                    onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                    className="form-input-premium resize-none h-20"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="form-label-premium mb-4">Preferred Payment Method *</Label>
                  <RadioGroup value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: "cash", label: "Cash", icon: "ðŸ’µ" },
                        { value: "bank_transfer", label: "Bank Transfer", icon: "ðŸ¦" },
                        { value: "mobile_money", label: "Mobile Money", icon: "ðŸ“±" }
                      ].map((method) => (
                        <div key={method.value} className="relative">
                          <input
                            type="radio"
                            id={method.value}
                            value={method.value}
                            checked={formData.paymentMethod === method.value}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="hidden"
                          />
                          <label
                            htmlFor={method.value}
                            className="professional-card p-4 cursor-pointer border-2 transition-all hover:border-primary"
                            style={{
                              borderColor: formData.paymentMethod === method.value ? "rgb(57, 89, 217)" : undefined
                            }}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">{method.icon}</div>
                              <div className="font-semibold text-foreground text-sm">{method.label}</div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1"
                  >
                    <ArrowLeft className="mr-2 w-5 h-5" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={loading || !validateStep2()}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ================= STEP 4: SUCCESS ================= */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="professional-card p-12 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </motion.div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-foreground">
                    Registration Successful!
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Your application has been submitted successfully
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Confirmation email has been sent to <span className="font-semibold text-foreground">{formData.email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our team will review your application and contact you within 2-3 business days.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Redirecting to home page...
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Register;