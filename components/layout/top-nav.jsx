"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";

export function TopNav({ portalLabel = "Invensis LMS" }) {
  const { user, logout } = useAuth();

  return (
    <Box
      as="header"
      className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between px-4"
      style={{ backgroundColor: "#111111", borderBottom: "1px solid #2A2A2A" }}
    >
      <Box className="flex items-center gap-3">
        <SidebarTrigger className="text-white/60 hover:text-white hover:bg-white/10" />
        <Separator orientation="vertical" className="h-5" style={{ backgroundColor: "#2A2A2A" }} />
        <Text
          as="h2"
          className="text-sm font-semibold tracking-tight select-none text-white/80"
        >
          {portalLabel}
        </Text>
      </Box>

      <Box className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <Text
            as="span"
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
          >
            3
          </Text>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-white/10 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary text-white text-xs font-bold">
                  {user?.initials || "U"}
                </AvatarFallback>
              </Avatar>
              <Text as="span" className="hidden text-sm font-medium sm:inline-block text-white/80">
                {user?.name || "User"}
              </Text>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Box>
    </Box>
  );
}
