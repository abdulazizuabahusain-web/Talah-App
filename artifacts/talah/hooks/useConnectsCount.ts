import { useEffect, useState } from "react";
import {
  getConnectsCount,
  refreshConnects,
  subscribeConnects,
} from "@/lib/connectsStore";

export function useConnectsCount(): number {
  const [count, setCount] = useState<number>(getConnectsCount);

  useEffect(() => {
    const unsub = subscribeConnects(setCount);
    refreshConnects();
    return unsub;
  }, []);

  return count;
}
