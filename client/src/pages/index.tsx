import { useRef, useState } from "react"
import Menu from "../components/Menu";
import MouseOverlay from "../components/MouseOverlay";
import Spinner from "../components/Spinner"
import { createInitialState, State } from "../models/CircleState";
import { Lobby, UserDataState } from "../models/Lobby";
import { useSyncedOptions } from "../services/SyncedOptions";
import { useSyncServer } from "../services/SyncedState";
import { useWindowVariable } from "../services/WindowVariables";
import { lerp } from "../utils/math";
import { useAnimationLoop } from "../utils/useAnimationLoop";



function HomePage() {
  const options = useSyncedOptions();
  const [renderState, setRenderState] = useState<State>(createInitialState);
  const clientCircleStateRef = useRef<State>(renderState);
  const [renderLobby, setRenderLobby] = useState<Lobby>({ selfId: 0, users: {} });

  const getTerp = useWindowVariable('terp', 0.9);
  const {
    stateRef: serverCircleStateRef,
    lobbyRef,
    setAngularVelocity,
    modifyRotation,
    getPredictedServerTimestamp,
    setMousePosition
  } = useSyncServer();

  const friction = 1 / 1000

  useAnimationLoop((dt: number) => {
    const serverState = serverCircleStateRef.current ?? clientCircleStateRef.current;
    const clientState = clientCircleStateRef.current;

    const t = clientState.timestamp - serverState.timestamp >= 0 ? 1 : getTerp();
    const s1 = lerp(clientState.s[1], serverState.s[1], t) * (1 - (dt * friction));
    const s0 = lerp(clientState.s[0], serverState.s[0], t) + (s1 * dt);

    const newRenderState: State = {
      timestamp: getPredictedServerTimestamp(),
      s: [s0, s1]
    }

    setRenderState(newRenderState);
    clientCircleStateRef.current = {
      ...newRenderState,
      timestamp: clientCircleStateRef.current.timestamp
    };
  })

  useAnimationLoop((dt: number) => {
    if (lobbyRef.current === undefined) { return; }
    const serverState = lobbyRef.current;

    setRenderLobby(renderLobby => {
      // Overwrite existing users with server state but lerp between ser mousePositions to smooth.
      const newRenderLobby = { ...serverState }

      for (const [userIdStr, userData] of Object.entries(renderLobby.users)) {
        const userId = Number(userIdStr);
        if (userId in newRenderLobby.users) {
          const [serverX, serverY] = newRenderLobby.users[userId].mousePosition;
          const [renderX, renderY] = userData.mousePosition;
          newRenderLobby.users[userId].mousePosition = [
            lerp(renderX, serverX, 0.5),
            lerp(renderY, serverY, 0.5),
          ]
        }
      }
      return newRenderLobby;
    })
  })

  const latency = 200;

  return (
    <div style={{
      width: '100%',
      height: '100%'
    }}>
      <MouseOverlay
        lobby={renderLobby}
        onMouseMove={(mousePosition) => {
          setMousePosition(...mousePosition);
        }}
      >
      <Menu
        options={options}
      />
      <Spinner
        options={options.map(syncedText => syncedText.toString())}
        rads={renderState.s[0]}
        onThetaUpdate={(delta) => {
          clientCircleStateRef.current = {
            timestamp: getPredictedServerTimestamp() + latency,
            s: [clientCircleStateRef.current.s[0] + delta.rads, clientCircleStateRef.current.s[1]]
          };
          modifyRotation(delta.rads);
        }}
        onDeltaThetaUpdate={(delta) => {
          clientCircleStateRef.current = {
            timestamp: getPredictedServerTimestamp() + latency,
            s: [clientCircleStateRef.current.s[0], delta.deltaRads / delta.dt]
          };
          setAngularVelocity(delta.deltaRads / delta.dt);
        }}
      />

    </MouseOverlay>
    </div >
  )
}

export default HomePage