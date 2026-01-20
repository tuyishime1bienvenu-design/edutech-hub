import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  X,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";

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
    type: "full-time",
    salary_min: "",
    salary_max: "",
    description: "",
    requirements: [] as string[],
    responsibilities: [] as string[],
    benefits: [] as string[],
    deadline: "",
  });

  const [newRequirement, setNewRequirement] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

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
      toast.error("Failed to load vacancies");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const vacancyData = {
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        description: formData.description,
        requirements: formData.requirements.filter(r => r.trim() !== ""),
        responsibilities: formData.responsibilities.filter(r => r.trim() !== ""),
        benefits: formData.benefits.filter(b => b.trim() !== ""),
        deadline: formData.deadline || null,
      };

      if (editingVacancy) {
        const { error } = await supabase
          .from("vacancies")
          .update(vacancyData)
          .eq("id", editingVacancy.id);

        if (error) throw error;
        toast.success("Vacancy updated successfully");
      } else {
        const { error } = await supabase
          .from("vacancies")
          .insert([vacancyData]);

        if (error) throw error;
        toast.success("Vacancy created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchVacancies();
    } catch (error) {
      console.error("Error saving vacancy:", error);
      toast.error("Failed to save vacancy");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "Kigali, Rwanda",
      type: "full-time",
      salary_min: "",
      salary_max: "",
      description: "",
      requirements: [],
      responsibilities: [],
      benefits: [],
      deadline: "",
    });
    setEditingVacancy(null);
  };

  const handleEdit = (vacancy: Vacancy) => {
    setFormData({
      title: vacancy.title,
      department: vacancy.department,
      location: vacancy.location || "Kigali, Rwanda",
      type: vacancy.type || "full-time",
      salary_min: vacancy.salary_min?.toString() || "",
      salary_max: vacancy.salary_max?.toString() || "",
      description: vacancy.description || "",
      requirements: Array.isArray(vacancy.requirements) ? vacancy.requirements : [],
      responsibilities: Array.isArray(vacancy.responsibilities) ? vacancy.responsibilities : [],
      benefits: Array.isArray(vacancy.benefits) ? vacancy.benefits : [],
      deadline: vacancy.deadline || "",
    });
    setEditingVacancy(vacancy);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vacancy?")) return;

    try {
      const { error } = await supabase
        .from("vacancies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Vacancy deleted successfully");
      fetchVacancies();
    } catch (error) {
      console.error("Error deleting vacancy:", error);
      toast.error("Failed to delete vacancy");
    }
  };

  const toggleActive = async (vacancy: Vacancy) => {
    try {
      const { error } = await supabase
        .from("vacancies")
        .update({ is_active: !vacancy.is_active })
        .eq("id", vacancy.id);

      if (error) throw error;
      toast.success(`Vacancy ${vacancy.is_active ? "deactivated" : "activated"}`);
      fetchVacancies();
    } catch (error) {
      console.error("Error toggling vacancy status:", error);
      toast.error("Failed to update vacancy status");
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      });
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...formData.responsibilities, newResponsibility.trim()],
      });
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities.filter((_, i) => i !== index),
    });
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()],
      });
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const formatSalaryRange = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} RWF`;
    if (min) return `From ${min.toLocaleString()} RWF`;
    if (max) return `Up to ${max.toLocaleString()} RWF`;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Vacancies</h1>
          <p className="text-muted-foreground">Manage job openings and positions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vacancy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVacancy ? "Edit Vacancy" : "Create New Vacancy"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Employment Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">Minimum Salary (RWF)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) =>
                      setFormData({ ...formData, salary_min: e.target.value })
                    }
                    placeholder="e.g., 500000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_max">Maximum Salary (RWF)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) =>
                      setFormData({ ...formData, salary_max: e.target.value })
                    }
                    placeholder="e.g., 800000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label>Requirements</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add a requirement"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                  />
                  <Button type="button" onClick={addRequirement} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.requirements.map((req, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {req}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeRequirement(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <Label>Responsibilities</Label>
                <div className="flex gap-2">
                  <Input
                    value={newResponsibility}
                    onChange={(e) => setNewResponsibility(e.target.value)}
                    placeholder="Add a responsibility"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addResponsibility())}
                  />
                  <Button type="button" onClick={addResponsibility} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.responsibilities.map((resp, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {resp}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeResponsibility(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <Label>Benefits</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                  />
                  <Button type="button" onClick={addBenefit} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {benefit}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeBenefit(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingVacancy ? "Update" : "Create"} Vacancy
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {vacancies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No vacancies yet</h3>
            <p className="text-muted-foreground">Create your first job opening</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((vacancy) => (
            <Card key={vacancy.id} className={!vacancy.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{vacancy.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{vacancy.department}</Badge>
                      <Badge variant="outline">{vacancy.type}</Badge>
                      {!vacancy.is_active && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={vacancy.is_active ?? true}
                      onCheckedChange={() => toggleActive(vacancy)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vacancy.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {vacancy.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{vacancy.location}</span>
                  </div>
                  {formatSalaryRange(vacancy.salary_min, vacancy.salary_max) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatSalaryRange(vacancy.salary_min, vacancy.salary_max)}</span>
                    </div>
                  )}
                  {vacancy.deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Deadline: {new Date(vacancy.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {Array.isArray(vacancy.requirements) && vacancy.requirements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {vacancy.requirements.slice(0, 3).map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                      {vacancy.requirements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{vacancy.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(vacancy)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(vacancy.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VacanciesPage;
