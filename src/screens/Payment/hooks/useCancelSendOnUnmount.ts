import { useManager } from "@cashu/coco-react";
import { err } from "@log";
import { useEffect, useRef } from "react";

export function useCancelSendOnUnmount(operationId?: string | null) {
  const manager = useManager();
  const managerRef = useRef(manager);
  const operationIdRef = useRef<string | null>(operationId ?? null);

  managerRef.current = manager;
  operationIdRef.current = operationId ?? null;

  useEffect(() => {
    return () => {
      const latestOperationId = operationIdRef.current;

      if (!latestOperationId) {
        return;
      }

      void (async () => {
        try {
          const operation = await managerRef.current.ops.send.get(latestOperationId);

          if (operation?.state === "prepared") {
            await managerRef.current.ops.send.cancel(latestOperationId);
          }
        } catch (error) {
          err("Failed to cancel prepared send on unmount", error);
        }
      })();
    };
  }, []);
}
