import { useEffect, useRef } from "react";

export function useIntervalLoop(
  callback: (dt: number, timestamp: number) => boolean | void,
  ms: number,
) {
  const lastIntervalTimestamp = useRef<DOMHighResTimeStamp | undefined>();

  useEffect(() => {
    const setIntervalHandle = setInterval(() => {

      if (lastIntervalTimestamp.current === undefined) {
        lastIntervalTimestamp.current = performance.now();

      }

      const timestamp = performance.now();
      const dt = timestamp - lastIntervalTimestamp.current;

      const shouldClearInterval = callback(dt, timestamp);
      if (shouldClearInterval) {
        clearInterval(setIntervalHandle)
      }

      lastIntervalTimestamp.current = timestamp;
    }, ms);

    return () => clearInterval(setIntervalHandle);
  }, []);
}
