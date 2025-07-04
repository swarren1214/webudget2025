import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar, DarkThemeToggle, Dropdown } from "flowbite-react";
import { useQuery } from "@tanstack/react-query";
import { Menu, Bell, LogOut, Settings, User as UserIcon } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import ProfileModal from "@/components/modals/ProfileModal";

interface HeaderProps {
  onMenuClick: () => void;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

function Header({ onMenuClick }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw error || new Error("User not found");

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <Navbar
      fluid
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4"
    >
      <div className="flex items-center justify-between w-full">
        {/* Mobile Menu Button */}
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

        {/* Right Section */}
        <div className="flex items-center gap-4 justify-end flex-1">
          <DarkThemeToggle />

          {/* Notification Icon */}
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  2
                </span>
              </Button>
            }
          >
            <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Notifications
            </div>
            <div className="px-4 py-2">
              <div className="flex flex-col">
                <span className="font-medium">Low Balance Alert</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Your checking account is below $1,000
                </span>
              </div>
            </div>
            <div className="px-4 py-2">
              <div className="flex flex-col">
                <span className="font-medium">New Transaction</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  $24.99 charge at Amazon
                </span>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700"></div>
            <div className="px-4 py-2">
              <span className="text-sm text-primary-600 dark:text-primary-500">
                View All
              </span>
            </div>
          </Dropdown>

          {/* User Profile Dropdown */}
          {isLoading ? (
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-2 hidden md:block">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm">Error loading user</div>
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
                    <p className="text-sm font-medium">
                      {user?.fullName || "Jane Patel"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || "jane@example.com"}
                    </p>
                  </div>
                </div>
              }
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="block text-sm font-medium">My Account</span>
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </span>
              </div>
              <Dropdown.Item icon={UserIcon} onClick={() => setProfileOpen(true)}>
                Profile
              </Dropdown.Item>
              <Dropdown.Item icon={Settings}>Settings</Dropdown.Item>
              <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
              <Dropdown.Item icon={LogOut} onClick={handleSignOut}>
                Sign Out
              </Dropdown.Item>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={{
          firstName: user?.fullName?.split(" ")[0] || "Jane",
          lastName: user?.fullName?.split(" ")[1] || "Patel",
          email: user?.email || "jane@example.com",
          phone: "",
          photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        }}
        onSave={async () => {}}
        onDelete={async () => {}}
      />
    </Navbar>
  );
}

export default Header;
