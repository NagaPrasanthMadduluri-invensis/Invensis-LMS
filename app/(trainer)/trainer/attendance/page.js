import { redirect } from "next/navigation";

// Attendance is now managed inside each training's page (/trainer/sessions/[id]),
// so the standalone Attendance tab is gone. Keep this route as a redirect so any
// old links/bookmarks still land somewhere useful.
export default function TrainerAttendanceRedirect() {
  redirect("/trainer/sessions");
}
