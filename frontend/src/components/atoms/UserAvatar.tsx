import type { UserResponse } from "@/types/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  user: Pick<UserResponse, "firstName" | "lastName" | "avatarUrl">;
  className?: string;
};

function UserAvatar({ user, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarImage src={user.avatarUrl} alt={user.firstName} />
      <AvatarFallback>
        {user.firstName.charAt(0)}
        {user.lastName?.charAt(0) || ""}
      </AvatarFallback>
    </Avatar>
  );
}

export default UserAvatar;
