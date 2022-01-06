import { useRef, useState } from "react"
import Menu from "../components/Menu";
import Spinner from "../components/Spinner"
import { useSyncedOptions } from "../services/SyncedOptions";
import { State, useSyncedState } from "../services/SyncedState";
import { lerp } from "../utils/math";
import { useAnimationLoop } from "../utils/useAnimationLoop";


interface StatePayload {
  options: string[]
  s: [number, number]
}

const createInitialState = (): State => ({ timestamp: performance.now(), s: [0, 0] })

function HomePage() {
  const options = useSyncedOptions();
  const [renderState, setRenderState] = useState<State>(createInitialState);
  const clientStateRef = useRef<State>(renderState);

  const syncedState = useSyncedState();
  const { stateRef: serverStateRef, setAngularVelocity, modifyRotation, getPredictedServerTimestamp } = syncedState;

  const friction = 1 / 1000
  useAnimationLoop((dt: number) => {
    const serverState = serverStateRef.current ?? clientStateRef.current;
    const clientState = clientStateRef.current;
    
    // const absClientStates0 = Math.abs(clientState.s[0]);
    // if (absClientStates0 > 2*Math.PI) {
    //   clientState.s[0] -= (2*Math.PI * (clientState.s[0]/absClientStates0))
    // }

    const t = clientState.timestamp - serverState.timestamp > 0 ? 1 : 0.95;
    const s1 = lerp(clientState.s[1], serverState.s[1], t) * (1 - (dt * friction));
    const s0 = lerp(clientState.s[0], serverState.s[0], t) + (s1 * dt);

    const newRenderState: State = {
      timestamp: getPredictedServerTimestamp(),
      s: [s0, s1]
    }

    setRenderState(newRenderState);
    clientStateRef.current = newRenderState;
  })

  return (
    <div style={{
      width: '100%',
      height: '100%'
    }}>
      {renderState !== undefined &&
        <Menu
          options={options}
        />
      }
      {renderState !== undefined &&
        <Spinner
          options={options.map(syncedText => syncedText.toString())}
          rads={renderState.s[0]}
          onThetaUpdate={(delta) => {
            clientStateRef.current = {
              timestamp: getPredictedServerTimestamp(),
              s: [clientStateRef.current.s[0] + delta.rads, clientStateRef.current.s[1]]
            };
            modifyRotation(delta.rads);
          }}
          onDeltaThetaUpdate={(delta) => {
            clientStateRef.current = {
              timestamp: getPredictedServerTimestamp(),
              s: [clientStateRef.current.s[0], delta.deltaRads / delta.dt]
            };
            setAngularVelocity(delta.deltaRads / delta.dt);
          }}
        />}
    </div>
  )
}

export default HomePage