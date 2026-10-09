import { TrainerTrainingView } from "@/components/trainer/trainer-sessions";

export default async function TrainerTrainingPage({ params }) {
  const { trainingRef } = await params;
  return <TrainerTrainingView trainingRef={trainingRef} />;
}
