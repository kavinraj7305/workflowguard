import { redirect } from "next/navigation";

export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  redirect(`/workspace/${assignmentId}/dashboard`);
}
