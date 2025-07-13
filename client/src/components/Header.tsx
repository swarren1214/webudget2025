import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { type User } from "@shared/schema";
import { Navbar, DarkThemeToggle, Dropdown } from "flowbite-react";
import { useState } from "react";
import { LoginButton, LogoutButton } from "@/components/ui/AuthButtons";
import ProfileModal from "@/components/modals/ProfileModal";
import { supabase } from "@/lib/supabaseClient";

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  // Fetch user data
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) throw error ?? new Error("User not found");

      return {
        id: data.user.id,
        email: data.user.email ?? "jane@example.com",
        fullName:
          data.user.user_metadata?.fullName ||
          data.user.user_metadata?.name ||
          "Jane Patel",
      };
    },
  });

  const [profileOpen, setProfileOpen] = useState(false);
  const fullName = user?.fullName || '';
  const [firstName = 'Jane', lastName = 'Patel'] = fullName.split(' ');

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">
        Error loading user data.
      </div>
    );
  }

  return (
    <Navbar fluid className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
      <div className="flex items-center justify-between w-full">
        {/* Left: Hamburger for mobile */}
        <div className="flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Right: All header items */}
        <div className="flex items-center gap-4 justify-end flex-1">
          <DarkThemeToggle />

          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">2</span>
              </Button>
            }
          >
            <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Notifications
            </div>
            <div className="px-4 py-2">
              <div className="flex flex-col">
                <span className="font-medium">Low Balance Alert</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Your checking account is below $1,000</span>
              </div>
            </div>
            <div className="px-4 py-2">
              <div className="flex flex-col">
                <span className="font-medium">New Transaction</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">$24.99 charge at Amazon</span>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div className="px-4 py-2">
              <span className="text-sm text-primary-600 dark:text-primary-500">View All</span>
            </div>
          </Dropdown>

          {isLoading ? (
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-2 hidden md:block">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
          ) : (
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <div className="flex items-center cursor-pointer">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="User Avatar"
                    className="h-10 w-10 rounded-full object-cover border-2 border-white shadow"
                  />
                  <div className="ml-2 hidden md:block text-left">
                    <p className="text-sm font-medium">{user?.fullName || 'Jane Patel'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'jane@example.com'}</p>
                  </div>
                </div>
              }
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="block text-sm font-medium">My Account</span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || 'jane@example.com'}</span>
              </div>
              <Dropdown.Item icon={UserIcon} className="flex items-center gap-2" onClick={() => setProfileOpen(true)}>
                Profile
              </Dropdown.Item>
              <Dropdown.Item icon={Settings} className="flex items-center gap-2">
                Settings
              </Dropdown.Item>
              <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
              <div className="px-4 py-2">
                <LoginButton />
                <LogoutButton />
              </div>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Profile Modal only if user is loaded */}
      {user && (
        <ProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={{
            firstName: firstName || 'Jane',
            lastName: lastName || 'Patel',
            email: user.email,
            phone: '',
            photoUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
          }}
          onSave={async () => {}}
          onDelete={async () => {}}
        />
      )}
    </Navbar>
  );
}

export default Header;
