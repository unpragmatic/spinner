import { MutableRefObject, useEffect, useRef } from "react";
import { StateWebsocketUrl } from "./StaticConstants";

export interface State {
  timestamp: number
  s: [number, number];
}

interface SyncedStateModifyRotation {
  type: "deltaTheta";
  deltaTheta: number;
}

interface SyncedStateSetAngularVelocity {
  type: "dTheta";
  dTheta: number;
}

export type SyncedStateActions = SyncedStateSetAngularVelocity | SyncedStateModifyRotation;

export interface SyncedState {
  stateRef: MutableRefObject<State>,
  setAngularVelocity: (angularVelocity: number) => void,
  modifyRotation: (deltaRadians: number) => void,
  getPredictedServerTimestamp: () => number
}

interface StatePayload {
  timestamp: number
  s: [number, number]
}

export function useSyncedState(): SyncedState {
  const stateRef = useRef<State>(undefined);
  const lastStateUpdateTimestampRef = useRef<DOMHighResTimeStamp>(undefined);
  const socketRef = useRef<WebSocket>(undefined);

  useEffect(() => {
    const socket = new WebSocket(StateWebsocketUrl);
    socketRef.current = socket;
    socketRef.current.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as StatePayload;
      stateRef.current = {
        ...payload,
      };
      lastStateUpdateTimestampRef.current = performance.now();
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
      type: 'deltaTheta',
      deltaTheta: deltaRadians
    }
    socketSend(JSON.stringify(msg));
  }

  const setAngularVelocity = (angularVelocity: number) => {
    const msg: SyncedStateSetAngularVelocity = {
      type: 'dTheta',
      dTheta: angularVelocity
    }
    socketSend(JSON.stringify(msg));
  }

  const getPredictedServerTimestamp = (): number => {
    if (lastStateUpdateTimestampRef.current === undefined || stateRef.current.timestamp === undefined) {
      return performance.now();
    }

    const millisecondsSinceUpdate = performance.now() - lastStateUpdateTimestampRef.current;
    return stateRef.current.timestamp + millisecondsSinceUpdate;
  }

  return {
    stateRef: stateRef,
    setAngularVelocity,
    modifyRotation,
    getPredictedServerTimestamp
  };
}
