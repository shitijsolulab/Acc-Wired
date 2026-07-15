import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approveRun, rejectRun } from "../client";

/** Approve or reject a run's human gate, then refresh the run view and the
 *  workflow list. After the mutation the run's polling advances the graph. */
export const useDecideRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      decision,
      comment,
    }: {
      runId: string;
      decision: "approve" | "reject";
      comment?: string;
    }) => (decision === "approve" ? approveRun(runId, comment) : rejectRun(runId, comment)),
    onSuccess: (_data, { runId }) => {
      qc.invalidateQueries({ queryKey: ["run", runId] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
};
