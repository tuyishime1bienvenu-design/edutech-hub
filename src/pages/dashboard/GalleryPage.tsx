import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Plus,
  Trash2,
  Eye,
  Edit,
  Calendar,
  FileText,
  Grid,
  List,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Play,
  Download,
  Share2,
  Camera,
  Film,
  Clock,
  Tag
} from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video';
  file_url: string;
  thumbnail_url?: string;
  file_size: number;
  event_date: string;
  event_name: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

const GalleryPage = () => {
  const { user, primaryRole } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'event_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Upload form state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadEventName, setUploadEventName] = useState('');
  const [uploadEventDate, setUploadEventDate] = useState('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventName, setEditEventName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIsPublic, setEditIsPublic] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageGallery = primaryRole === 'admin';

  // Fetch gallery items
  const { data: galleryItems, isLoading: galleryLoading } = useQuery({
    queryKey: ['gallery-items', filterType, sortBy, sortOrder, searchTerm],
    queryFn: async () => {
      if (!canManageGallery) return [];

      console.log('Fetching gallery items...');
      
      let query = supabase
        .from('gallery_items')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply type filter
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,event_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Gallery fetch error:', error);
        throw error;
      }
      
      console.log('Gallery items fetched:', data);
      return data || [];
    },
    enabled: canManageGallery,
  });

  // Upload files mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!canManageGallery) throw new Error('Permission denied');

      console.log('Starting upload for', files.length, 'files');

      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${index}.${fileExt}`;
        const filePath = `gallery/${fileName}`;

        console.log('Uploading file:', file.name, 'to path:', filePath);

        // Set upload progress
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

        // Upload file to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error for', file.name, ':', uploadError);
          throw uploadError;
        }

        console.log('Upload successful for', file.name, ':', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        console.log('Public URL for', file.name, ':', urlData.publicUrl);

        // Update progress
        setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));

        // Save to database
        const { error: dbError } = await supabase
          .from('gallery_items')
          .insert({
            title: uploadTitle || file.name.split('.')[0],
            description: uploadDescription,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            file_url: urlData.publicUrl,
            file_size: file.size,
            event_date: uploadEventDate,
            event_name: uploadEventName,
            tags: uploadTags,
            is_public: isPublic
          });

        if (dbError) {
          console.error('Database error for', file.name, ':', dbError);
          throw dbError;
        }

        console.log('Database entry created for', file.name);
        return { success: true, fileName };
      });

      const results = await Promise.all(uploadPromises);
      console.log('All uploads completed:', results);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      toast({ title: 'Files uploaded successfully' });
      setUploadDialogOpen(false);
      resetUploadForm();
      setUploadProgress({});
    },
    onError: (error) => {
      toast({ title: 'Error uploading files', description: error.message, variant: 'destructive' });
      setUploadProgress({});
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (item: Partial<GalleryItem> & { id: string }) => {
      if (!canManageGallery) throw new Error('Permission denied');

      const { error } = await supabase
        .from('gallery_items')
        .update({
          title: item.title,
          description: item.description,
          event_name: item.event_name,
          event_date: item.event_date,
          tags: item.tags,
          is_public: item.is_public,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      toast({ title: 'Item updated successfully' });
      setEditDialogOpen(false);
      setSelectedItem(null);
    },
    onError: (error) => {
      toast({ title: 'Error updating item', description: error.message, variant: 'destructive' });
    },
  });

  // Delete items mutation
  const deleteItemsMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      if (!canManageGallery) throw new Error('Permission denied');

      // Get items to delete
      const { data: itemsToDelete } = await supabase
        .from('gallery_items')
        .select('file_url')
        .in('id', itemIds);

      if (itemsToDelete) {
        // Delete files from storage
        for (const item of itemsToDelete) {
          // Extract file path from URL
          const urlParts = item.file_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage
              .from('gallery')
              .remove([`gallery/${fileName}`]);
          }
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('gallery_items')
        .delete()
        .in('id', itemIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      toast({ title: 'Items deleted successfully' });
      setSelectedItems([]);
    },
    onError: (error) => {
      toast({ title: 'Error deleting items', description: error.message, variant: 'destructive' });
    },
  });

  const resetUploadForm = () => {
    setUploadFiles([]);
    setUploadTitle('');
    setUploadDescription('');
    setUploadEventName('');
    setUploadEventDate('');
    setUploadTags([]);
    setTagInput('');
    setIsPublic(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({ 
        title: 'Some files were skipped', 
        description: 'Only images and videos up to 100MB are allowed', 
        variant: 'destructive' 
      });
    }

    setUploadFiles(prev => [...prev.slice(0, 20 - prev.length), ...validFiles].slice(0, 20));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !uploadTags.includes(tagInput.trim())) {
      setUploadTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUploadTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = () => {
    if (uploadFiles.length === 0) {
      toast({ title: 'Please select files to upload', variant: 'destructive' });
      return;
    }

    if (!uploadTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    uploadFilesMutation.mutate(uploadFiles);
  };

  const handleEdit = (item: GalleryItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditEventName(item.event_name || '');
    setEditEventDate(item.event_date || '');
    setEditTags(item.tags || []);
    setEditIsPublic(item.is_public);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedItem) return;

    if (!editTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }

    updateItemMutation.mutate({
      id: selectedItem.id,
      title: editTitle,
      description: editDescription,
      event_name: editEventName,
      event_date: editEventDate,
      tags: editTags,
      is_public: editIsPublic
    });
  };

  const handleDelete = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Please select items to delete', variant: 'destructive' });
      return;
    }

    deleteItemsMutation.mutate(selectedItems);
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const filteredItems = galleryItems?.filter(item => {
      const matchesSearch = !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    }) || [];

    setSelectedItems(
      selectedItems.length === filteredItems.length 
        ? [] 
        : filteredItems.map(item => item.id)
    );
  };

  const filteredItems = galleryItems?.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!canManageGallery) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to manage gallery. Only admins can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Gallery Management</h1>
            <p className="text-muted-foreground">
              Upload and manage media for the public website gallery
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
          {selectedItems.length > 0 && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedItems.length})
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Gallery Files
              </CardTitle>
              <CardDescription>
                Upload up to 20 images and videos at once for the public gallery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* File Upload Area */}
                <div>
                  <Label>Select Files (Max 20)</Label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Images (JPG, PNG, GIF) and Videos (MP4, WebM) up to 100MB each
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Selected Files */}
                {uploadFiles.length > 0 && (
                  <div>
                    <Label>Selected Files ({uploadFiles.length}/20)</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Video className="w-5 h-5 text-purple-500" />
                            )}
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    </div>
                  )}

                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div>
                    <Label>Upload Progress</Label>
                    <div className="space-y-2">
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{fileName}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter title for these files"
                    />
                  </div>
                  <div>
                    <Label>Event Name</Label>
                    <Input
                      value={uploadEventName}
                      onChange={(e) => setUploadEventName(e.target.value)}
                      placeholder="e.g., Graduation Ceremony 2024"
                    />
                  </div>
                  <div>
                    <Label>Event Date</Label>
                    <Input
                      type="date"
                      value={uploadEventDate}
                      onChange={(e) => setUploadEventDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Visibility</Label>
                    <Select value={isPublic.toString()} onValueChange={(value) => setIsPublic(value === 'true')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Public (Visible on website)</SelectItem>
                        <SelectItem value="false">Private (Admin only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Describe these files..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {uploadTags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {tag}
                        <X 
                          className="w-3 h-3 ml-1" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploadFiles.length === 0 || uploadFilesMutation.isPending}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadFilesMutation.isPending ? 'Uploading...' : 'Upload Files'}
                  </Button>
                  <Button variant="outline" onClick={resetUploadForm}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search gallery..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={filterType} onValueChange={(value: 'all' | 'image' | 'video') => setFilterType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="image">Images Only</SelectItem>
                      <SelectItem value="video">Videos Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: 'created_at' | 'title' | 'event_date') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Date Added</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="event_date">Event Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Order</Label>
                  <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5" />
                  Gallery Items ({filteredItems.length})
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    <Check className="w-4 h-4 mr-2" />
                    {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Debug Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Debug Info:</h4>
                <p>Gallery Items Count: {galleryItems?.length || 0}</p>
                <p>Filtered Items Count: {filteredItems.length}</p>
                <p>Loading: {galleryLoading ? 'Yes' : 'No'}</p>
                <p>Can Manage Gallery: {canManageGallery ? 'Yes' : 'No'}</p>
                {galleryItems && galleryItems.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">First Item:</p>
                    <pre className="text-xs bg-white p-2 rounded border max-h-40 overflow-auto">
                      {JSON.stringify(galleryItems[0], null, 2)}
                    </pre>
                    <div className="mt-2">
                      <p className="font-medium mb-1">Test Image URL:</p>
                      <a 
                        href={galleryItems[0].file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {galleryItems[0].file_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {galleryLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredItems.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                            selectedItems.includes(item.id) ? 'border-blue-500' : 'border-gray-200'
                          } hover:border-blue-400 transition-colors`}
                          onClick={() => handleSelectItem(item.id)}
                        >
                          {/* Selection Checkbox */}
                          <div className="absolute top-2 left-2 z-10">
                            <div className={`w-5 h-5 rounded border-2 ${
                              selectedItems.includes(item.id) 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'bg-white border-gray-300'
                            }`}>
                              {selectedItems.includes(item.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>

                          {/* Media Preview */}
                          <div className="aspect-square bg-gray-100 relative">
                            {item.type === 'image' ? (
                              <>
                                <img
                                  src={item.file_url}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                  onLoad={() => console.log('Image loaded successfully:', item.title)}
                                  onError={(e) => {
                                    console.error('Image failed to load:', item.title, item.file_url);
                                    // Hide broken image and show fallback
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div 
                                  className="absolute inset-0 flex items-center justify-center bg-gray-200"
                                  style={{ display: 'none' }}
                                >
                                  <div className="text-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Image failed to load</p>
                                    <p className="text-xs text-gray-400 truncate max-w-[100px]">{item.title}</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <Play className="w-12 h-12 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Type Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge 
                              variant={item.type === 'image' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {item.type === 'image' ? (
                                <><ImageIcon className="w-3 h-3" /></>
                              ) : (
                                <><Video className="w-3 h-3" /></>
                              )}
                            </Badge>
                          </div>

                          {/* Public Badge */}
                          {item.is_public && (
                            <div className="absolute bottom-2 right-2">
                              <Badge variant="outline" className="text-xs">
                                Public
                              </Badge>
                            </div>
                          )}

                          {/* Overlay Info */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all p-3 flex flex-col justify-end">
                            <div className="text-white">
                              <p className="font-semibold truncate">{item.title}</p>
                              <p className="text-sm opacity-90">
                                {formatFileSize(item.file_size)}
                              </p>
                              {item.event_name && (
                                <p className="text-xs opacity-80">{item.event_name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <input
                                type="checkbox"
                                checked={selectedItems.length === filteredItems.length}
                                onChange={handleSelectAll}
                                className="rounded"
                              />
                            </TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  className="rounded"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                <Badge variant={item.type === 'image' ? 'default' : 'secondary'}>
                                  {item.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.event_name || '-'}</TableCell>
                              <TableCell>{item.event_date ? format(new Date(item.event_date), 'MMM d, yyyy') : '-'}</TableCell>
                              <TableCell>{formatFileSize(item.file_size)}</TableCell>
                              <TableCell>
                                <Badge variant={item.is_public ? 'default' : 'secondary'}>
                                  {item.is_public ? 'Public' : 'Private'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setPreviewDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(item)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No gallery items found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Gallery Item</DialogTitle>
            <DialogDescription>
              Update the details of this gallery item
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={editEventName}
                    onChange={(e) => setEditEventName(e.target.value)}
                    placeholder="Event name"
                  />
                </div>
                <div>
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Visibility</Label>
                  <Select value={editIsPublic.toString()} onValueChange={(value) => setEditIsPublic(value === 'true')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Public (Visible on website)</SelectItem>
                      <SelectItem value="false">Private (Admin only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe this item..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X 
                        className="w-3 h-3 ml-1" 
                        onClick={() => setEditTags(prev => prev.filter(t => t !== tag))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateItemMutation.isPending}>
              <Edit className="w-4 h-4 mr-2" />
              {updateItemMutation.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              Preview of the gallery item
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.file_url}
                  alt={selectedItem.title}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              ) : (
                <video
                  src={selectedItem.file_url}
                  controls
                  className="w-full max-h-96 rounded-lg"
                />
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Type:</p>
                  <p>{selectedItem.type}</p>
                </div>
                <div>
                  <p className="font-medium">Size:</p>
                  <p>{formatFileSize(selectedItem.file_size)}</p>
                </div>
                <div>
                  <p className="font-medium">Event:</p>
                  <p>{selectedItem.event_name || '-'}</p>
                </div>
                <div>
                  <p className="font-medium">Date:</p>
                  <p>{selectedItem.event_date ? format(new Date(selectedItem.event_date), 'MMM d, yyyy') : '-'}</p>
                </div>
                <div>
                  <p className="font-medium">Visibility:</p>
                  <p>{selectedItem.is_public ? 'Public' : 'Private'}</p>
                </div>
                <div>
                  <p className="font-medium">Added:</p>
                  <p>{format(new Date(selectedItem.created_at), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              {selectedItem.description && (
                <div>
                  <p className="font-medium">Description:</p>
                  <p>{selectedItem.description}</p>
                </div>
              )}
              
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div>
                  <p className="font-medium">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
