import { useEffect, useRef, useState } from "react"
import Spinner from "../components/Spinner"

interface State {
  timestamp: DOMHighResTimeStamp
  options: string[]
  s: [number, number]
}

interface StatePayload {
  options: string[]
  s: [number, number]
}

function HomePage() {
  const [renderState, setRenderState] = useState<State | undefined>(undefined);
  const socketRef = useRef<WebSocket>(undefined);
  const stateRef = useRef<State>({
    timestamp: performance.now(),
    options: [],
    s: [0, 0]
  });

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    socketRef.current = socket;
    socketRef.current.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data) as StatePayload;
      stateRef.current = {
        ...payload,
        timestamp: performance.now()
      };
      setRenderState(renderState => renderState === undefined ? { ...stateRef.current } : renderState);
    });

    return () => socket.close();
  }, []);

  const lastAnimationFrameHandle = useRef<number | undefined>(undefined);
  const lastAnimationTimestamp = useRef<DOMHighResTimeStamp | undefined>();
  const update = (timestamp) => {
    if (lastAnimationTimestamp.current === undefined) {
      lastAnimationTimestamp.current = timestamp;
    }
    const dt = timestamp - lastAnimationTimestamp.current;
    if (stateRef.current.s[1] !== 0) {
      setRenderState(renderState => {
        if (renderState !== undefined) {
          return {
            timestamp: performance.now(),
            options: stateRef.current.options,
            s: [
              // (0.5*renderState.s[0] + 0.5*stateRef.current.s[0]) + stateRef.current.s[1] * dt,
              (0.95*renderState.s[0] + 0.05*stateRef.current.s[0]) + renderState.s[1] * dt,
              // (0.9 * renderState.s[0] + 0.1 * stateRef.current.s[0]) + ((0.9 * renderState.s[1] + 0.1 * stateRef.current.s[1]) * dt),
              // renderState.s[1],
              // stateRef.current.s[1]
              (0.8 * renderState.s[1] + 0.2 * stateRef.current.s[1]) - (0.8 * renderState.s[1] + 0.2 * stateRef.current.s[1]) * dt * (1 / 1000)
              // renderState.s[1] - (0.2*renderState.s[1] + 0.8*stateRef.current.s[1]) * dt * (1 / 1000)
              // stateRef.current.s[1] - (stateRef.current.s[1] * dt * (1 / 1000))
            ]
          }
        }
      });
    } else {
      setRenderState(renderState => {
        if (renderState !== undefined) {
          return {
            timestamp: performance.now(),
            options: stateRef.current.options,
            s: [(0.95 * renderState.s[0] + 0.05 * stateRef.current.s[0]), 0]
          }
        }
      }
      );
    }

    lastAnimationFrameHandle.current = requestAnimationFrame(update);
    lastAnimationTimestamp.current = timestamp;
  };

  useEffect(() => {
    lastAnimationFrameHandle.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(lastAnimationFrameHandle.current);
  }, [])


  return (
    <div>
      {renderState !== undefined &&
        <Spinner
          options={renderState.options}
          rads={renderState.s[0]}
        />}
    </div>
  )
}

export default HomePage