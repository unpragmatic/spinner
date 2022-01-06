import { syncedStore, getYjsValue, SyncedText } from "@syncedstore/core";
import { useSyncedStore } from "@syncedstore/react";
import { useEffect } from "react";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "yjs";
import { OptionsStoreServerUrl } from "./StaticConstants";


export type Options = {
  options: SyncedText[]
}

export function useSyncedOptions(): SyncedText[] {
  const store = syncedStore({ options: [] as SyncedText[] });
  const state = useSyncedStore(store);

  useEffect(() => {
    const doc = getYjsValue(store) as Doc;
    const webrtcProvider = new WebsocketProvider(
      OptionsStoreServerUrl,
      "main",
      doc,
    );

    return () => webrtcProvider.disconnect();
  }, []);

  return state.options;
}