import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Vacancy = Database["public"]["Tables"]["vacancies"]["Row"];

const VacanciesPage = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "Kigali, Rwanda",
    employment_type: "full-time",
    experience_level: "entry-level",
    salary_range: "",
    description: "",
    requirements: [] as string[],
    responsibilities: [] as string[],
    required_documents: [] as string[],
    application_deadline: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const { data, error } = await supabase
        .from("vacancies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVacancies(data || []);
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      toast({
        title: "Error",
        description: "Failed to load vacancies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const vacancyData = {
        ...formData,
        application_deadline: formData.application_deadline || null,
        requirements: formData.requirements.filter(r => r.trim() !== ""),
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ""),
        required_documents: formData.required_documents.filter(d => d.trim() !== ""),
      };

      if (editingVacancy) {
        const { error } = await supabase
          .from("vacancies")
          .update(vacancyData)
          .eq("id", editingVacancy.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Vacancy updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("vacancies")
          .insert([vacancyData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Vacancy created successfully",
        });
      }

      setDialogOpen(false);
      setEditingVacancy(null);
      resetForm();
      fetchVacancies();
    } catch (error) {
      console.error("Error saving vacancy:", error);
      toast({
        title: "Error",
        description: "Failed to save vacancy",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title,
      department: vacancy.department,
      location: vacancy.location,
      employment_type: vacancy.employment_type,
      experience_level: vacancy.experience_level,
      salary_range: vacancy.salary_range || "",
      description: vacancy.description,
      requirements: Array.isArray(vacancy.requirements) ? vacancy.requirements : [],
      responsibilities: Array.isArray(vacancy.responsibilities) ? vacancy.responsibilities : [],
      required_documents: Array.isArray(vacancy.required_documents) ? vacancy.required_documents : [],
      application_deadline: vacancy.application_deadline || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (vacancy: Vacancy) => {
    if (!confirm("Are you sure you want to delete this vacancy?")) return;

    try {
      const { error } = await supabase
        .from("vacancies")
        .delete()
        .eq("id", vacancy.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Vacancy deleted successfully",
      });
      fetchVacancies();
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      toast({
        title: "Error",
        description: "Failed to delete vacancy",
        variant: "destructive",
      });
    }
  };

  const toggleVacancyStatus = async (vacancy: Vacancy) => {
    try {
      const { error } = await supabase
        .from("vacancies")
        .update({ is_active: !vacancy.is_active })
        .eq("id", vacancy.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: `Vacancy ${!vacancy.is_active ? 'activated' : 'deactivated'} successfully`,
      });
      fetchVacancies();
    } catch (error) {
      console.error("Error toggling vacancy status:", error);
      toast({
        title: "Error",
        description: "Failed to update vacancy status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "Kigali, Rwanda",
      employment_type: "full-time",
      experience_level: "entry-level",
      salary_range: "",
      description: "",
      requirements: [],
      responsibilities: [],
      required_documents: [],
      application_deadline: "",
    });
  };

  const addItem = (field: 'requirements' | 'responsibilities' | 'required_documents') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const updateItem = (field: 'requirements' | 'responsibilities' | 'required_documents', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const removeItem = (field: 'requirements' | 'responsibilities' | 'required_documents', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vacancies Management</h1>
          <p className="text-gray-600">Create and manage job openings and career opportunities</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingVacancy(null);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vacancy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVacancy ? "Edit Vacancy" : "Add New Vacancy"}
              </DialogTitle>
              <DialogDescription>
                {editingVacancy ? "Update the vacancy details below." : "Fill in the details to create a new job opening."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select
                    value={formData.experience_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry-level">Entry Level</SelectItem>
                      <SelectItem value="mid-level">Mid Level</SelectItem>
                      <SelectItem value="senior-level">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    value={formData.salary_range}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                    placeholder="e.g., RWF 300,000 - 500,000"
                  />
                </div>
                <div>
                  <Label htmlFor="application_deadline">Application Deadline</Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Requirements</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem('requirements')}>
                    Add Requirement
                  </Button>
                </div>
                {formData.requirements.map((req, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={req}
                      onChange={(e) => updateItem('requirements', index, e.target.value)}
                      placeholder="Enter requirement"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem('requirements', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Responsibilities</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem('responsibilities')}>
                    Add Responsibility
                  </Button>
                </div>
                {formData.responsibilities.map((resp, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={resp}
                      onChange={(e) => updateItem('responsibilities', index, e.target.value)}
                      placeholder="Enter responsibility"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem('responsibilities', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Required Documents</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => addItem('required_documents')}>
                    Add Document
                  </Button>
                </div>
                {formData.required_documents.map((doc, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={doc}
                      onChange={(e) => updateItem('required_documents', index, e.target.value)}
                      placeholder="Enter required document"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem('required_documents', index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="submit">
                  {editingVacancy ? "Update Vacancy" : "Create Vacancy"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vacancies.map((vacancy) => (
          <motion.div
            key={vacancy.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{vacancy.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{vacancy.department}</Badge>
                      <Badge variant="outline">{vacancy.employment_type}</Badge>
                      {!vacancy.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVacancyStatus(vacancy)}
                    >
                      {vacancy.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(vacancy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vacancy)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">{vacancy.description}</p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{vacancy.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{vacancy.experience_level}</span>
                  </div>
                  {vacancy.salary_range && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{vacancy.salary_range}</span>
                    </div>
                  )}
                  {vacancy.application_deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Deadline: {new Date(vacancy.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {Array.isArray(vacancy.requirements) && vacancy.requirements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Key Requirements:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {vacancy.requirements.slice(0, 3).map((req, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          {req}
                        </li>
                      ))}
                      {vacancy.requirements.length > 3 && (
                        <li className="text-gray-500">+{vacancy.requirements.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                )}

                {Array.isArray(vacancy.required_documents) && vacancy.required_documents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
                    <div className="flex flex-wrap gap-1">
                      {vacancy.required_documents.slice(0, 3).map((doc, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc}
                        </Badge>
                      ))}
                      {vacancy.required_documents.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{vacancy.required_documents.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {vacancies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No vacancies found. Create your first job opening to get started.</p>
        </div>
      )}
    </div>
  );
};

export default VacanciesPage;