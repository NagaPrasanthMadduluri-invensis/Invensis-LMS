/**
 * Canonical post-training feedback questions.
 *
 * Per API §3.7 the survey `questions` array is a flexible, frontend-owned shape
 * ({ id, type, label, options?, required? }) that the backend stores as-is, and
 * `answers` is a { questionId: answer } map keyed by these ids. These are the
 * fixed questions we author for every training's post-training survey — the
 * admin authoring UI sends them on create, the learner feedback dialog collects
 * them, and the admin responses view maps each answer back to its label.
 */

export const POST_TRAINING_SURVEY_TITLE = "Post-Training Feedback";

export const POST_TRAINING_QUESTIONS = [
  { id: "overall_rating", type: "rating", label: "Overall experience", hint: "How was the training overall?", required: true },
  { id: "trainer_rating", type: "rating", label: "Trainer", hint: "Knowledge, clarity, engagement", required: true },
  { id: "content_rating", type: "rating", label: "Course content", hint: "Material, pace, relevance", required: true },
  { id: "would_recommend", type: "boolean", label: "Would you recommend it?", required: true },
  { id: "comments", type: "text", label: "Comments", required: false },
];

/** Human-readable rendering of a single answer, keyed off its question type. */
export function formatSurveyAnswer(question, answer) {
  if (answer == null || answer === "") return "—";
  switch (question?.type) {
    case "rating":
      return `${answer} / 5`;
    case "boolean":
      return answer === true || answer === "true" ? "Yes" : "No";
    default:
      return String(answer);
  }
}
