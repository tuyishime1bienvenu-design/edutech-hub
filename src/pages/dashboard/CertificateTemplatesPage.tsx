import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Award, MoreVertical, Edit, Trash2, Eye, Image, Palette } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import CertificatePreview from '@/components/certificates/CertificatePreview';

interface CertificateTemplate {
  id: string;
  name: string;
  logo_url: string | null;
  message: string;
  background_color: string;
  text_color: string;
  border_style: string;
  font_family: string;
  include_dates: boolean;
  include_registration_number: boolean;
  additional_text: string | null;
  is_active: boolean;
  created_at: string;
}

const CertificateTemplatesPage = () => {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '/logo.jpg', // Default to company logo
    message: 'This is to certify that',
    background_color: '#ffffff',
    text_color: '#1a1a2e',
    border_style: 'classic',
    font_family: 'serif',
    include_dates: true,
    include_registration_number: true,
    additional_text: '',
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CertificateTemplate[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingTemplate) {
        const { error } = await supabase
          .from('certificate_templates')
          .update(data)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('certificate_templates').insert({
          ...data,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: editingTemplate ? 'Template updated' : 'Template created' });
    },
    onError: (error) => {
      toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('certificate_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-templates'] });
      toast({ title: 'Template deleted' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '/logo.jpg', // Default to company logo
      message: 'This is to certify that',
      background_color: '#ffffff',
      text_color: '#1a1a2e',
      border_style: 'classic',
      font_family: 'serif',
      include_dates: true,
      include_registration_number: true,
      additional_text: '',
    });
    setEditingTemplate(null);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      logo_url: template.logo_url || '',
      message: template.message,
      background_color: template.background_color || '#ffffff',
      text_color: template.text_color || '#1a1a2e',
      border_style: template.border_style || 'classic',
      font_family: template.font_family || 'serif',
      include_dates: template.include_dates ?? true,
      include_registration_number: template.include_registration_number ?? true,
      additional_text: template.additional_text || '',
    });
    setIsDialogOpen(true);
  };

  const handlePreview = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Certificate Templates</h1>
          <p className="text-muted-foreground">Design certificates for program completion</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No certificate templates yet. Create your first template.</p>
          </div>
        ) : (
          templates?.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        {template.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {template.message}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreview(template)}>
                          <Eye className="w-4 h-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div
                      className="h-24 rounded-lg border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: template.background_color,
                        borderColor: template.text_color,
                      }}
                    >
                      {template.logo_url ? (
                        <img src={template.logo_url} alt="Logo" className="h-16 object-contain" />
                      ) : (
                        <div className="text-muted-foreground flex items-center gap-2">
                          <Image className="w-5 h-5" /> No logo
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">{template.border_style}</Badge>
                      <Badge variant="outline" className="capitalize">{template.font_family}</Badge>
                      <div
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: template.background_color }}
                        title="Background color"
                      />
                    </div>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Certificate Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Graduation Certificate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Certificate Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="This is to certify that..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bg_color">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bg_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="text_color">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text_color"
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Border Style</Label>
                <Select
                  value={formData.border_style}
                  onValueChange={(value) => setFormData({ ...formData, border_style: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={formData.font_family}
                  onValueChange={(value) => setFormData({ ...formData, font_family: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serif">Serif (Traditional)</SelectItem>
                    <SelectItem value="sans-serif">Sans-serif (Modern)</SelectItem>
                    <SelectItem value="cursive">Cursive (Elegant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional">Additional Text</Label>
              <Textarea
                id="additional"
                value={formData.additional_text}
                onChange={(e) => setFormData({ ...formData, additional_text: e.target.value })}
                placeholder="Any additional text to appear on the certificate..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="include_dates">Include Program Dates</Label>
              <Switch
                id="include_dates"
                checked={formData.include_dates}
                onCheckedChange={(checked) => setFormData({ ...formData, include_dates: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="include_reg">Include Registration Number</Label>
              <Switch
                id="include_reg"
                checked={formData.include_registration_number}
                onCheckedChange={(checked) => setFormData({ ...formData, include_registration_number: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.name || !formData.message || saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <CertificatePreview
              template={selectedTemplate}
              studentName="John Doe"
              programName="Web Development"
              startDate="January 1, 2026"
              endDate="June 30, 2026"
              registrationNumber="REG-2026-001"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificateTemplatesPage;
