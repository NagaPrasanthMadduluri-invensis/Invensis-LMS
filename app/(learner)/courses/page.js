import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const courses = [
  {
    name: "PMP Certification Prep",
    category: "Project Management",
    hours: "35 hrs",
    modules: "8 modules",
    rating: 4.8,
    stars: 4,
    price: "₹49,999",
    tier: "Gold",
    tierStyle: { background: "linear-gradient(135deg, #EFBD5F, #EC7D50)", color: "#1a0a00" },
    bannerGradient: "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)",
    initial: "P",
  },
  {
    name: "Project Management Fundamentals",
    category: "Project Management",
    hours: "18 hrs",
    modules: "5 modules",
    rating: 4.5,
    stars: 4,
    price: "₹14,999",
    tier: "Bronze",
    tierStyle: { backgroundColor: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" },
    bannerGradient: "linear-gradient(135deg, #1A0830 0%, #2D0F3A 100%)",
    initial: "P",
  },
  {
    name: "Design for Six Sigma",
    category: "Quality Management",
    hours: "26 hrs",
    modules: "6 modules",
    rating: 4.6,
    stars: 4,
    price: "₹32,999",
    tier: "Silver",
    tierStyle: { backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" },
    bannerGradient: "linear-gradient(135deg, #0E1A14 0%, #142A1E 100%)",
    initial: "D",
  },
  {
    name: "Certified ScrumMaster (CSM)",
    category: "Agile Project Management",
    hours: "20 hrs",
    modules: "5 modules",
    rating: 4.7,
    stars: 4,
    price: "₹19,999",
    tier: "Gold",
    tierStyle: { background: "linear-gradient(135deg, #EFBD5F, #EC7D50)", color: "#1a0a00" },
    bannerGradient: "linear-gradient(135deg, #1A0E00 0%, #2D1A00 100%)",
    initial: "C",
  },
  {
    name: "JIRA Certification Training",
    category: "Project Management",
    hours: "14 hrs",
    modules: "4 modules",
    rating: 4.4,
    stars: 4,
    price: "₹9,999",
    tier: "Bronze",
    tierStyle: { backgroundColor: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" },
    bannerGradient: "linear-gradient(135deg, #0D1B2A 0%, #1B3A4B 100%)",
    initial: "J",
  },
  {
    name: "Lean Project Management",
    category: "Project Management",
    hours: "22 hrs",
    modules: "6 modules",
    rating: 4.5,
    stars: 4,
    price: "₹24,999",
    tier: "Silver",
    tierStyle: { backgroundColor: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.3)" },
    bannerGradient: "linear-gradient(178.73deg, #4F2183 -26.7%, #1A0830 126.7%)",
    initial: "L",
  },
];

function StarRating({ filled, total = 5 }) {
  return (
    <Box className="inline-flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < filled ? "fill-amber-400 text-amber-400" : "fill-zinc-400/40 text-zinc-400/40"}`}
        />
      ))}
    </Box>
  );
}

export default function CourseCatalogPage() {
  return (
    <Box className="space-y-5">
      {/* ── Page Header ── */}
      <Box className="flex items-center justify-between flex-wrap gap-3">
        <Box>
          <Text as="h1" className="font-bold tracking-tight" style={{ fontSize: "32px", lineHeight: "1.15", color: "#111111" }}>Course Catalog</Text>
          <Text as="p" className="text-xs mt-1" style={{ color: "#555555" }}>
            Home › <Text as="span" className="font-medium" style={{ color: "#555555" }}>Course Catalog</Text>
          </Text>
        </Box>
        <Box className="px-3 py-1.5 rounded-full" style={{ background: "rgba(239,189,95,0.1)", border: "1px solid rgba(239,189,95,0.25)" }}>
          <Text as="span" className="text-xs font-semibold" style={{ color: "#EFBD5F" }}>{courses.length} Courses</Text>
        </Box>
      </Box>

      {/* ── Filters ── */}
      <Box className="flex items-center gap-3 flex-wrap p-3 rounded-xl" style={{ background: "linear-gradient(135deg, #0E0E10 0%, #131316 55%, #1A1921 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px" }}>
        <Select defaultValue="all">
          <SelectTrigger
            className="w-[180px] h-9 text-xs"
            style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#A3A3A3" }}
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1921] border-[#383838] text-white">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="pm">Project Management</SelectItem>
            <SelectItem value="it">IT Service</SelectItem>
            <SelectItem value="agile">Agile</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger
            className="w-[140px] h-9 text-xs"
            style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#A3A3A3" }}
          >
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1921] border-[#383838] text-white">
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
            <SelectItem value="bronze">Bronze</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="low">
          <SelectTrigger
            className="w-[170px] h-9 text-xs"
            style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "#A3A3A3" }}
          >
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1921] border-[#383838] text-white">
            <SelectItem value="low">Price: Low to High</SelectItem>
            <SelectItem value="high">Price: High to Low</SelectItem>
            <SelectItem value="popular">Popularity</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Search courses..."
          className="w-[200px] h-9 text-xs placeholder:text-[#6B6B6B] text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.05)", color: "white" }}
        />
      </Box>

      {/* ── Course Grid ── */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <PremiumCard
            key={course.name}
            className="p-0 overflow-hidden border hover:scale-[1.02] transition-all duration-200 group cursor-pointer"
          >
            {/* Banner */}
            <Box className="relative h-32 flex flex-col justify-between p-4 overflow-hidden" style={{ background: course.bannerGradient, color: "white" }}>
              <Text as="span" className="absolute -bottom-2 -right-1 text-[6rem] font-black leading-none select-none pointer-events-none" style={{ color: "rgba(255,255,255,0.08)" }}>
                {course.initial}
              </Text>
              <Box className="flex items-center justify-between relative z-10">
                <Badge className="text-[10px] border-0 font-semibold" style={course.tierStyle}>
                  {course.tier}
                </Badge>
              </Box>
              <Box className="relative z-10">
                <Text as="p" className="text-white font-bold text-sm leading-snug line-clamp-2">
                  {course.name}
                </Text>
              </Box>
            </Box>

            {/* Info */}
            <Box className="p-4">
              <Text as="p" className="text-[11px] font-medium mb-1.5" style={{ color: "#555555" }}>{course.category}</Text>
              <Box className="flex items-center gap-1.5">
                <StarRating filled={course.stars} />
                <Text as="span" className="text-[11px] font-semibold" style={{ color: "#EFBD5F" }}>{course.rating}</Text>
                <Text as="span" className="text-[11px]" style={{ color: "rgba(0,0,0,0.25)" }}>·</Text>
                <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>{course.hours}</Text>
                <Text as="span" className="text-[11px]" style={{ color: "rgba(0,0,0,0.25)" }}>·</Text>
                <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>{course.modules}</Text>
              </Box>
            </Box>

            {/* Footer */}
            <Box className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}>
              <Text as="span" className="font-bold text-base" style={{ color: "#111111" }}>
                {course.price}
              </Text>
              <Button size="sm" className="text-xs h-8 px-4 font-semibold border-0 text-[#1a0a00]" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}>
                Enroll Now
              </Button>
            </Box>
          </PremiumCard>
        ))}
      </Box>
    </Box>
  );
}
