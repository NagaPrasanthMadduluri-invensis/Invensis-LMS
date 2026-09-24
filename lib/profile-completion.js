/*
 * Which profile fields are still missing, per role.
 *
 * Pure data logic, kept out of the provider so it can be reasoned about and
 * tested without React. The provider owns fetching and re-checking; this owns
 * the rule.
 */

/** Fields that must be filled for a profile to count as complete.
 *  Trainer: everything except `rate` (admin-only anyway).
 *  Learner: every field on the Personal and Professional tabs except the photo.
 *
 *  `employedOnly` fields are dropped for a learner who has said they are not
 *  employed — they have no employer, sector, title or department to give, so
 *  demanding them would leave the profile permanently incomplete and the
 *  completion prompt permanently on screen. The gate has to agree with the
 *  form, or saving the form changes nothing the learner can see. */
export const REQUIRED = {
  trainer: [
    { key: "name", label: "Full name" },
    { key: "bio", label: "Bio" },
    { key: "experience", label: "Experience" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
    { key: "specializations", label: "Specializations" },
    { key: "resume_key", label: "Resume" },
  ],
  learner: [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "phone", label: "Mobile number" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "company_name", label: "Company", employedOnly: true },
    { key: "industry", label: "Industry", employedOnly: true },
    { key: "job_title", label: "Job title", employedOnly: true },
    { key: "department", label: "Department", employedOnly: true },
    { key: "years_experience", label: "Years of experience", employedOnly: true },
    { key: "linkedin_url", label: "LinkedIn profile" },
  ],
};

export function isFilled(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true; // numbers (incl. 0), booleans
}

/**
 * The still-missing required fields for a flattened profile.
 *
 * A learner with no `employment_status` is treated as employed: that is what
 * every profile saved before the field existed looks like, and the
 * requirements for them must not change.
 */
export function missingProfileFields(role, flat) {
  const required = REQUIRED[role];
  if (!required) return [];
  const employed = role !== "learner" || flat?.employment_status !== "not_employed";
  return required
    .filter((f) => employed || !f.employedOnly)
    .filter((f) => !isFilled(flat?.[f.key]));
}
