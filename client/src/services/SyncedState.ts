import { useEffect, useRef } from "react";
import { StateWebsocketUrl } from "./StaticConstants";

export interface State {
  s: [number, number];
}

export const InitialState: State = {
  s: [0, 0],
};

interface SyncedStateSetAngularVelocity {
  type: "deltaTheta";
  deltaTheta: number;
}

interface SyncedStateModifyRotation {
  type: "dTheta";
  dTheta: number;
}

export type SyncedStateActions = SyncedStateSetAngularVelocity | SyncedStateModifyRotation;

export interface SyncedState {
  state: State,
  setAngularVelocity: (angularVelocity: number) => void,
  modifyRotation: (deltaRadians: number) => void
}

interface StatePayload {
  options: string[],
  s: [number, number]
}

export function useSyncedState(): SyncedState {
  const stateRef = useRef<State>(InitialState);
  const socketRef = useRef<WebSocket>(undefined);

  useEffect(() => {
    const socket = new WebSocket(StateWebsocketUrl);
    socketRef.current = socket;
    socketRef.current.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as StatePayload;
      stateRef.current = {
        ...payload,
      };
    });

    return () => socket.close();
  }, []);

  const socketSend = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current !== undefined && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    }
  }

  const modifyRotation = (deltaRadians: number) => {
    const msg: SyncedStateModifyRotation = {
      type: 'dTheta',
      dTheta: deltaRadians
    }
    socketSend(JSON.stringify(msg));
  }

  const setAngularVelocity = (angularVelocity: number) => {
    const msg: SyncedStateSetAngularVelocity = {
      type: 'deltaTheta',
      deltaTheta: angularVelocity
    }
    socketSend(JSON.stringify(msg));
  }

  return {
    state: stateRef.current,
    setAngularVelocity,
    modifyRotation
  };
}
