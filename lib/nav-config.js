import {
  LayoutDashboard,
  BookOpen,
  Play,
  BarChart3,
  PenTool,
  Award,
  CreditCard,
  Receipt,
  Bookmark,
  MessageCircle,
  Package,
  HeadphonesIcon,
  User,
  LogOut,
  Users,
  Settings,
  ShieldCheck,
  Building2,
  CalendarDays,
  Star,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";

/* ── Learner Navigation ── */

export const learnerNav = {
  main: [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "My Courses", icon: BookOpen, href: "/my-courses" },
  ],
  learning: [
    { title: "Content & Lessons", icon: Play, href: "/content" },
    { title: "My Progress", icon: BarChart3, href: "/progress" },
    { title: "Quizzes & Mock Tests", icon: PenTool, href: "/quizzes" },
    { title: "Certificates", icon: Award, href: "/certificates" },
  ],
  payments: [
    { title: "My Enrollments", icon: CreditCard, href: "/enrollments" },
    { title: "Invoices & Receipts", icon: Receipt, href: "/invoices" },
  ],
  engage: [
    { title: "Bookmarks", icon: Bookmark, href: "/bookmarks" },
    { title: "Feedback", icon: MessageCircle, href: "/feedback" },
  ],
  footer: [
    { title: "Profile & Settings", icon: User, href: "/profile" },
    { title: "Logout", icon: LogOut, href: "/logout" },
  ],
};

/* ── Trainer Navigation ── */

export const trainerNav = {
  main: [
    { title: "Dashboard", icon: LayoutDashboard, href: "/trainer/dashboard" },
  ],
  work: [
    { title: "Sessions",    icon: CalendarDays,   href: "/trainer/sessions" },
    { title: "Attendance",  icon: ClipboardCheck, href: "/trainer/attendance" },
    { title: "Feedback",    icon: Star,           href: "/trainer/feedback" },
  ],
  footer: [
    { title: "Profile & Settings", icon: User,   href: "/trainer/profile" },
    { title: "Logout",             icon: LogOut, href: "/logout" },
  ],
};

/* ── Sponsor Navigation ── */
// A sponsor pays for learners. They get the dashboard shell (like a learner) but
// NO learning content — only their sponsored learners + invoices/receipts.

export const sponsorNav = {
  main: [
    { title: "Dashboard", icon: LayoutDashboard, href: "/sponsor/dashboard" },
  ],
  people: [
    { title: "My Learners", icon: Users, href: "/sponsor/learners" },
  ],
  payments: [
    { title: "Invoices & Receipts", icon: Receipt, href: "/sponsor/invoices" },
  ],
  footer: [
    { title: "Profile & Settings", icon: User, href: "/sponsor/profile" },
    { title: "Logout", icon: LogOut, href: "/logout" },
  ],
};

/* ── Admin Navigation ── */

export const adminNav = {
  main: [
    { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
  ],
  users: [
    { title: "User Management", icon: Users, href: "/admin/users" },
    { title: "Trainers", icon: GraduationCap, href: "/admin/trainers" },
    { title: "Corporate Accounts", icon: Building2, href: "/admin/corporate" },
  ],
  content: [
    { title: "Courses", icon: BookOpen, href: "/admin/courses" },
    { title: "Assessments", icon: PenTool, href: "/admin/assessments" },
    { title: "Certificates", icon: Award, href: "/admin/certificates" },
    { title: "Add-ons", icon: Package, href: "/admin/addons" },
  ],
  operations: [
    { title: "Orders & Payments", icon: CreditCard, href: "/admin/orders" },
    { title: "Access Control", icon: ShieldCheck, href: "/admin/access-control" },
  ],
  communication: [
    { title: "Tickets", icon: HeadphonesIcon, href: "/admin/tickets" },
  ],
  footer: [
    { title: "Settings", icon: Settings, href: "/admin/settings" },
    { title: "Logout", icon: LogOut, href: "/logout" },
  ],
};
