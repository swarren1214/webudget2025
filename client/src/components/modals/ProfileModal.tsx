import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photoUrl?: string;
  };
  onSave: (data: { firstName: string; lastName: string; email: string; phone?: string; photoFile?: File | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export default function ProfileModal({ isOpen, onClose, user, onSave, onDelete }: ProfileModalProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ firstName, lastName, email, phone, photoFile });
      toast({ title: "Profile updated" });
      onClose();
    } catch (err) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await onDelete();
      toast({ title: "Account deleted" });
      onClose();
    } catch (err) {
      toast({ title: "Failed to delete account", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your personal information and profile photo.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <label className="cursor-pointer">
            <Avatar>
              {photoFile ? (
                <img src={URL.createObjectURL(photoFile)} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
              ) : user.photoUrl ? (
                <img src={user.photoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <Skeleton className="h-16 w-16 rounded-full" />
              )}
            </Avatar>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <div className="text-xs text-center text-primary mt-1">Upload/Edit Photo</div>
          </label>
          <div className="w-full flex gap-2">
            <Input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            <Input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full" />
          <Input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full" />
        </div>
        <DialogFooter className="flex flex-col gap-2 items-stretch">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving} disabled={isSaving || isDeleting}>Save Changes</Button>
          </div>
          <Button variant="destructive" onClick={handleDelete} loading={isDeleting} disabled={isSaving || isDeleting} className="mt-2 flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 