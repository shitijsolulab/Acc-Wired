import { useMutation, useQueryClient } from "@tanstack/react-query";

import { requestConnectorAccess } from "../client";

/** Request access to a connector the tenant is not yet entitled to. */
export const useRequestAccess = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, note }: { key: string; note?: string }) =>
      requestConnectorAccess(key, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access-requests"] }),
  });
};
