import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Users } from "lucide-react";
import { UsersTable } from "@/components/admin/users-table";

export default function AdminUsersPage() {
  return (
    <Box className="space-y-6">
      <Box className="flex items-center gap-3 bg-indigo-50 rounded-xl px-5 py-4">
        <Box className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-indigo-500" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">
            User Management
          </Text>
          <Text as="p" className="text-slate-400 text-xs mt-0.5">
            Admin &rsaquo; <Text as="span" className="text-slate-500 font-medium">Users</Text>
          </Text>
        </Box>
      </Box>
      <UsersTable />
    </Box>
  );
}
