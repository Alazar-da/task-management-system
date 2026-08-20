// components/projects/ProjectMembers.tsx
"use client";

import { useState } from "react";
import { useProject } from "@/services/projectService";
import { useUsers } from "@/hooks/use-users";
import { useAddProjectMember, useRemoveProjectMember } from "@/services/projectService";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Plus, UserMinus, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import {User} from "@/types/user";


interface ProjectMembersProps {
  projectId: string;
}

export function ProjectMembers({ projectId }: ProjectMembersProps) {
  const { data: project, refetch } = useProject(projectId);
  const { data: users } = useUsers();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    
    await addMember.mutateAsync({
      projectId,
      userId: selectedUser.id,
      role: 'member',
    });
    
    setSelectedUser(undefined);
    setIsDialogOpen(false);
    refetch();
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm('Remove this member from the project?')) {
      await removeMember.mutateAsync({
        projectId,
        userId,
      });
      refetch();
    }
  };

  const existingMemberIds = project?.members?.map(m => m.user_id) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Members</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member to Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedUser?.username} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem 
                      key={user.id} 
                      value={user}

                      disabled={existingMemberIds.includes(user.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        {user.username}
                        {existingMemberIds.includes(user.id) && (
                          <Badge variant="outline" className="ml-auto">Already Added</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {project?.members?.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.user?.avatar_url || undefined} />
                <AvatarFallback>{getInitials(member.user?.username)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.user?.username}</p>
                <p className="text-xs text-gray-500">{member.user?.email}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {member.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={member.role === 'admin'}
              onClick={() => handleRemoveMember(member.user_id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}