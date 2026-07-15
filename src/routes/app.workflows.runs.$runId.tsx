import { createFileRoute } from "@tanstack/react-router";

import { RunView } from "../components/workflow/RunView";

export const Route = createFileRoute("/app/workflows/runs/$runId")({ component: RunPage });

function RunPage() {
  const { runId } = Route.useParams();
  return (
    <div className="space-y-6">
      <RunView runId={runId} />
    </div>
  );
}
