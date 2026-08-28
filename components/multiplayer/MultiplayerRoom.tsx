"use client";

import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import Desktop from "@/components/desktop/Desktop";
import MultiplayerCursors from "./MultiplayerCursors";

const INITIAL_USER = { name: "Visitor", color: "#f2c94c" };

export default function MultiplayerRoom({
  apiKey,
  roomId,
}: {
  apiKey?: string;
  roomId: string;
}) {
  if (!apiKey) return <Desktop />;

  return (
    <LiveblocksProvider publicApiKey={apiKey} throttle={33}>
      <RoomProvider id={roomId} initialPresence={{ cursor: null, user: INITIAL_USER }}>
        <Desktop multiplayerLayer={<MultiplayerCursors />} />
      </RoomProvider>
    </LiveblocksProvider>
  );
}
