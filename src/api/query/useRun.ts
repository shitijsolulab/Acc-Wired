import { useQuery } from "@tanstack/react-query";

import { api } from "../client";

/** Poll a single workflow run so the run view can watch steps advance in real time.
 *  Stops polling once the run reaches a terminal status. In TanStack Query v5 the
 *  `refetchInterval` callback receives the Query object (data lives at `q.state.data`);
 *  return `false` to stop, or a number of ms to keep polling. */
export const useRun = (runId?: string) =>
  useQuery({
    queryKey: ["run", runId],
    queryFn: () => api.getRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "completed" || s === "rejected" ? false : 1500;
    },
  });
