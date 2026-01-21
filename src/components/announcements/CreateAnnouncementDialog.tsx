import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ClassOption {
  id: string;
  name: string;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const { user, profile, roles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noticeType, setNoticeType] = useState("announcement");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const isTrainer = roles.includes("trainer");
  const isAdminOrStaff = roles.some((r) =>
    ["admin", "secretary", "finance", "it"].includes(r)
  );

  useEffect(() => {
    if (open && isTrainer && profile) {
      fetchTrainerClasses();
    }
  }, [open, isTrainer, profile]);

  const fetchTrainerClasses = async () => {
    try {
      // Assuming trainer_id in classes table matches profile.id
      // We might need to check if it matches user.id if profile.id doesn't work
      // But based on schema, usually it's one of them. Let's try profile.id first.
      
      const { data, error } = await supabase
        .from("classes")
        .select("id, name")
        .eq("trainer_id", profile?.id || "");

      if (error) throw error;
      setClasses(data || []);
      
      // Auto-select if only one class
      if (data && data.length === 1) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load your classes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const noticeData: any = {
        title,
        content,
        notice_type: noticeType,
        is_active: true,
        created_by: user?.id,
      };

      // Handle Permissions Logic
      if (isAdminOrStaff) {
        if (isPublic) {
          noticeData.is_public = true;
          noticeData.target_roles = null; // Public for everyone
        } else {
          noticeData.is_public = false;
          // If "all" is selected (implied if not public), we might set target_roles to null or all roles
          // For now, let's assume NULL target_roles means "All Logged In Users" if is_public is false
          // Or we can specify roles.
          noticeData.target_roles = ["student", "trainer", "admin", "secretary", "finance"];
        }
      } else if (isTrainer) {
        // Trainer can only post to their class
        if (selectedClassId === "all" || !selectedClassId) {
            // Trainers shouldn't be able to select "all" effectively unless they have no classes?
            // But requirement says "only the trainer is able to create annoucement to the class he is in only"
            if (classes.length > 0 && selectedClassId === "all") {
                 toast.error("Please select a specific class");
                 setLoading(false);
                 return;
            }
        }
        noticeData.class_id = selectedClassId;
        noticeData.is_public = false;
        noticeData.target_roles = ["student"]; // Targeted at students in that class
      }

      const { error } = await supabase.from("notices").insert([noticeData]);

      if (error) throw error;

      toast.success("Announcement created successfully");
      onOpenChange(false);
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setNoticeType("announcement");
    setIsPublic(false);
    setSelectedClassId("all");
  };

  if (!isAdminOrStaff && !isTrainer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement Title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={noticeType} onValueChange={setNoticeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement here..."
              className="min-h-[100px]"
              required
            />
          </div>

          {isAdminOrStaff && (
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Make Public (Visible on Home Page)</Label>
            </div>
          )}

          {isTrainer && (
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
