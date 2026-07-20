"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
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
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";

export function TopNav({ portalLabel = "Invensis Learning" }) {
  const { user, logout } = useAuth();

  return (
    <Box
      as="header"
      className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between bg-sidebar px-4 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]"
    >
      <Box  className="flex items-center gap-3">
      <Box className="flex justify-start w-[227px]">
      
        <Image
          src="/logo-white.svg"
          alt={portalLabel}
          width={155}
          height={45}
          priority
          unoptimized
          className="select-none drop-shadow-sm"
        />
       
      </Box>
        <SidebarTrigger className="bg-transparent hover:bg-transparent" />
       
</Box>
      <Box className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-white" />
          <Text
            as="span"
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground"
          >
            3
          </Text>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-3 bg-background hover:bg-muted transition-colors cursor-pointer border-0 outline-none">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
              <AvatarFallback className="bg-violet-500 text-white text-xs">
                {user?.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <Text as="span" className="hidden text-sm font-medium sm:inline-block">
              {user?.name || "User"}
            </Text>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
