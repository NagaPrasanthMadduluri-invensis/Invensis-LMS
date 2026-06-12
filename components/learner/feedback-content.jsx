"use client";

import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const COURSES = [
  { value: "pmp", label: "PMP Certification Prep" },
  { value: "itil", label: "ITIL 4 Foundation" },
  { value: "csm", label: "Certified ScrumMaster" },
];

const SUBMITTED_FEEDBACKS = [
  {
    id: 1,
    course: "PMP Certification Prep",
    rating: 5,
    comment: "Excellent course material, well structured.",
    date: "15 Mar 2024",
  },
  {
    id: 2,
    course: "ITIL 4 Foundation",
    rating: 4,
    comment: "Great content but pace could be faster.",
    date: "25 Feb 2024",
  },
  {
    id: 3,
    course: "Six Sigma Green Belt",
    rating: 5,
    comment: "Instructor was very knowledgeable.",
    date: "20 Nov 2023",
  },
];

function StarRating({ rating, max = 5, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);

  return (
    <Box className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = interactive ? (hovered || rating) > i : rating > i;
        return (
          <Star
            key={i}
            style={{
              width: "18px",
              height: "18px",
              color: filled ? "#EFBD5F" : "rgba(0,0,0,0.18)",
              fill: filled ? "#EFBD5F" : "transparent",
              cursor: interactive ? "pointer" : "default",
              transition: "color 0.1s, fill 0.1s",
            }}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onRate && onRate(i + 1)}
          />
        );
      })}
    </Box>
  );
}

function GiveFeedbackCard() {
  const [course, setCourse] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!course || !rating || !message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setCourse("");
      setRating(0);
      setMessage("");
    }, 2500);
  }

  return (
    <PremiumCard className="overflow-hidden">
      <CardHeader className="py-4 px-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Box className="flex items-center gap-2.5">
          <Box
            className="w-1 h-4 rounded-full"
            style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
          />
          <CardTitle className="text-sm font-semibold">Give Feedback</CardTitle>
        </Box>
      </CardHeader>
      <CardContent className="p-5">
        <Box as="form" className="space-y-4" onSubmit={handleSubmit}>
          {/* Course select */}
          <Box className="space-y-1.5">
            <Text as="label" className="text-xs font-semibold" style={{ color: "#444444" }}>
              Select Course
            </Text>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none"
              style={{
                border: "1px solid rgba(0,0,0,0.15)",
                backgroundColor: "rgba(0,0,0,0.03)",
                color: course ? "#111111" : "#888888",
              }}
              required
            >
              <option value="" disabled>
                Choose a course...
              </option>
              {COURSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Box>

          {/* Star rating */}
          <Box className="space-y-1.5">
            <Text as="label" className="text-xs font-semibold" style={{ color: "#444444" }}>
              Rating
            </Text>
            <Box className="flex items-center gap-3">
              <StarRating
                rating={rating}
                interactive
                onRate={setRating}
              />
              {rating > 0 && (
                <Text as="span" className="text-xs font-medium" style={{ color: "#EFBD5F" }}>
                  {rating === 5 ? "Excellent" : rating === 4 ? "Very Good" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                </Text>
              )}
            </Box>
          </Box>

          {/* Message */}
          <Box className="space-y-1.5">
            <Text as="label" className="text-xs font-semibold" style={{ color: "#444444" }}>
              Your Feedback
            </Text>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your experience with this course..."
              rows={4}
              className="resize-none text-sm"
              style={{
                border: "1px solid rgba(0,0,0,0.15)",
                backgroundColor: "rgba(0,0,0,0.03)",
              }}
              required
            />
          </Box>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full font-semibold border-0 text-[#1a0a00] h-9"
            style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
            disabled={submitted}
          >
            {submitted ? "Feedback Submitted!" : "Submit Feedback"}
          </Button>
        </Box>
      </CardContent>
    </PremiumCard>
  );
}

function MyFeedbackCard() {
  return (
    <PremiumCard className="overflow-hidden">
      <CardHeader className="py-4 px-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Box className="flex items-center gap-2.5">
          <Box
            className="w-1 h-4 rounded-full"
            style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
          />
          <CardTitle className="text-sm font-semibold">My Feedback</CardTitle>
        </Box>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {SUBMITTED_FEEDBACKS.map((fb) => (
          <Box
            key={fb.id}
            className="rounded-xl px-4 py-3 space-y-1.5 transition-colors"
            style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
            onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")}
            onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
          >
            <Box className="flex items-start justify-between gap-2 flex-wrap">
              <Text as="p" className="text-sm font-semibold" style={{ color: "#111111" }}>
                {fb.course}
              </Text>
              <Text as="span" className="text-[10px]" style={{ color: "#777777" }}>
                {fb.date}
              </Text>
            </Box>
            <StarRating rating={fb.rating} />
            <Text as="p" className="text-xs leading-relaxed" style={{ color: "#444444" }}>
              {fb.comment}
            </Text>
          </Box>
        ))}
      </CardContent>
    </PremiumCard>
  );
}

export function FeedbackContent() {
  return (
    <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <GiveFeedbackCard />
      <MyFeedbackCard />
    </Box>
  );
}
