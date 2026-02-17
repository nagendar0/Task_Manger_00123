import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function UserMenu() {
  const { user, signOut, loading } = useAuthStore();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{user.email}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        disabled={loading}
        className="gap-2 border-[#ff5b41]/40 text-[#ff5b41] transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-to-r hover:from-[#ff5b41] hover:to-[#ff7a4e] hover:text-white hover:shadow-[0_10px_26px_rgba(255,91,65,0.35)]"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
}
