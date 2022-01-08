import { useEffect, useRef } from "react";

export function useWindowVariable<T>(name: string, defaultValue: T) {
  useEffect(() => {
    const anyWindow: any = window as any;
    if (anyWindow[name] === undefined) {
      anyWindow[name] = defaultValue;
    }
  }, []);

  return  () => (window as any)[name];
}
