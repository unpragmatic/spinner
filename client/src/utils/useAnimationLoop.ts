import { useEffect, useRef } from "react";

export function useAnimationLoop(
  callback: (dt: number, timestamp: number) => void,
) {
  const lastAnimationFrameHandle = useRef<number | undefined>(undefined);
  const lastAnimationTimestamp = useRef<DOMHighResTimeStamp | undefined>();

  const render = (timestamp) => {
    if (lastAnimationTimestamp.current === undefined) {
      lastAnimationTimestamp.current = timestamp;
    }
    const dt = timestamp - lastAnimationTimestamp.current;

    callback(dt, timestamp);

    lastAnimationFrameHandle.current = requestAnimationFrame(render);
    lastAnimationTimestamp.current = timestamp;
  };

  useEffect(() => {
    lastAnimationFrameHandle.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(lastAnimationFrameHandle.current);
  }, []);
}
