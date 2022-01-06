import { useEffect, useRef, useState } from "react"
import Menu from "../components/Menu";
import Spinner from "../components/Spinner"
import { useAnimationLoop } from "../utils/useAnimationLoop";

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


  useAnimationLoop((dt: number) => {
    setRenderState(renderState => {
      if (renderState !== undefined) {
        return {
          ...renderState,
          timestamp: performance.now(),
          options: renderState.timestamp < stateRef.current.timestamp ? renderState.options : stateRef.current.options,
          s: [
            (0.95 * renderState.s[0] + 0.05 * stateRef.current.s[0]) + renderState.s[1] * dt,
            (0.8 * renderState.s[1] + 0.2 * stateRef.current.s[1]) - (0.8 * renderState.s[1] + 0.2 * stateRef.current.s[1]) * dt * (1 / 1000)
          ]
        }
      }
    });
  })


  // console.log(OptionsStoreHostname);

  return (
    <div style={{
      width: '100%',
      height: '100%'
    }}>
      {renderState !== undefined &&
        <Menu
          options={renderState.options}
          onOptionsChange={(options) => {
            if (socketRef.current !== undefined && socketRef.current.readyState === WebSocket.OPEN) {
              const msg = JSON.stringify({
                type: 'options',
                options: options
              });
              socketRef.current.send(msg);
            }
            setRenderState(renderState => ({
              ...renderState,
              timestamp: performance.now(),
              options
            }));
          }}
        />
      }
      {renderState !== undefined &&
        <Spinner
          options={renderState.options}
          rads={renderState.s[0]}
          onThetaUpdate={(delta) => {
            setRenderState(renderState => ({ ...renderState, timestamp: performance.now(), s: [renderState.s[0] + delta.rads, renderState.s[1]] }));
            if (socketRef.current !== undefined && socketRef.current.readyState === WebSocket.OPEN) {
              const msg = JSON.stringify({
                type: 'deltaTheta',
                deltaTheta: delta.rads
              })
              socketRef.current.send(msg);
            }

          }}
          onDeltaThetaUpdate={(delta) => {
            setRenderState(renderState => ({ ...renderState,  timestamp: performance.now(), s: [renderState.s[0], delta.deltaRads / delta.dt] }));
            if (socketRef.current !== undefined && socketRef.current.readyState === WebSocket.OPEN) {
              const payload = JSON.stringify({
                type: 'dTheta',
                dTheta: (delta.deltaRads / delta.dt)
              })
              socketRef.current.send(payload);
            }
          }}
        />}
    </div>
  )
}

export default HomePage