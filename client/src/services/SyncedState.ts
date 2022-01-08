import { MutableRefObject, useEffect, useRef } from "react";
import { UserData } from "../models/Lobby";
import { StateWebsocketUrl } from "./StaticConstants";

interface SyncedStateModifyRotation {
  type: "deltaTheta";
  deltaTheta: number;
}

interface SyncedStateSetAngularVelocity {
  type: "dTheta";
  dTheta: number;
}

interface SyncedLobbySetMousePosition {
  type: "mouse";
  mousePosition: [number, number];
}

export type SyncedStateActions =
  | SyncedStateSetAngularVelocity
  | SyncedStateModifyRotation;

export interface SyncServerService {
  stateRef: MutableRefObject<StatePayload>;
  lobbyRef: MutableRefObject<LobbyPayload>;
  setAngularVelocity: (angularVelocity: number) => void;
  modifyRotation: (deltaRadians: number) => void;
  setMousePosition: (x: number, y: number) => void;
  getPredictedServerTimestamp: () => number;
}

interface StatePayload {
  type: "state";
  timestamp: number;
  s: [number, number];
}

interface LobbyPayload {
  type: "lobby";
  selfId: number;
  users: { [userId: number]: UserData };
}

type DataPayload = StatePayload | LobbyPayload;

export function useSyncServer(): SyncServerService {
  const stateRef = useRef<StatePayload>(undefined);
  const lobbyRef = useRef<LobbyPayload>(undefined);
  const lastStateUpdateTimestampRef = useRef<DOMHighResTimeStamp>(undefined);
  const socketRef = useRef<WebSocket>(undefined);

  useEffect(() => {
    const socket = new WebSocket(StateWebsocketUrl);
    socketRef.current = socket;

    socketRef.current.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as DataPayload;

      if (payload.type === "state") {
        stateRef.current = {
          ...payload,
        };
        lastStateUpdateTimestampRef.current = performance.now();
      } else if (payload.type === "lobby") {
        lobbyRef.current = {
          ...payload,
        };
      }
    });

    return () => socket.close();
  }, []);

  const socketSend = (
    data: string | ArrayBufferLike | Blob | ArrayBufferView,
  ) => {
    if (
      socketRef.current !== undefined &&
      socketRef.current.readyState === WebSocket.OPEN
    ) {
      socketRef.current.send(data);
    }
  };

  const modifyRotation = (deltaRadians: number) => {
    const msg: SyncedStateModifyRotation = {
      type: "deltaTheta",
      deltaTheta: deltaRadians,
    };
    socketSend(JSON.stringify(msg));
  };

  const setAngularVelocity = (angularVelocity: number) => {
    const msg: SyncedStateSetAngularVelocity = {
      type: "dTheta",
      dTheta: angularVelocity,
    };
    socketSend(JSON.stringify(msg));
  };

  const setMousePosition = (x: number, y: number) => {
    const msg: SyncedLobbySetMousePosition = {
      type: "mouse",
      mousePosition: [x, y],
    };
    socketSend(JSON.stringify(msg));
  };

  const getPredictedServerTimestamp = (): number => {
    if (
      lastStateUpdateTimestampRef.current === undefined ||
      stateRef.current.timestamp === undefined
    ) {
      return performance.now();
    }

    const millisecondsSinceUpdate = performance.now() -
      lastStateUpdateTimestampRef.current;
    return stateRef.current.timestamp + millisecondsSinceUpdate;
  };

  return {
    stateRef,
    lobbyRef,
    setAngularVelocity,
    modifyRotation,
    setMousePosition,
    getPredictedServerTimestamp,
  };
}
