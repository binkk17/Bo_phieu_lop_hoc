import { useEffect, useRef } from "react";
import { subscribePostStream } from "../lib/api";

/**
 * Lắng nghe SSE từ server và làm mới feed ngay khi có bài mới.
 */
export function usePostFeedAutoRefresh(enabled: boolean, refresh: () => Promise<void>) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribePostStream(() => {
      void refreshRef.current().catch(() => {});
    });

    return unsubscribe;
  }, [enabled]);
}
