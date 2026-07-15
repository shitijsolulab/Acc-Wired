import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approveAccessRequest, rejectAccessRequest } from "../client";

/** Approve or reject a pending connector access request (admin). Approving entitles
 *  the tenant, so the connector catalogue is refreshed too. */
export const useDecideAccessRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      decision === "approve" ? approveAccessRequest(id) : rejectAccessRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["access-requests"] });
      qc.invalidateQueries({ queryKey: ["connectors"] });
      qc.invalidateQueries({ queryKey: ["connector-catalog"] });
    },
  });
};
