"use client";

import Desktop from "@/components/desktop/Desktop";
import MultiplayerCursors from "./MultiplayerCursors";

export default function MultiplayerRoom({
  supabaseUrl,
  supabaseKey,
  roomId,
}: {
  supabaseUrl?: string;
  supabaseKey?: string;
  roomId: string;
}) {
  if (!supabaseUrl || !supabaseKey) return <Desktop />;

  return (
    <Desktop
      multiplayerLayer={
        <MultiplayerCursors roomId={roomId} supabaseKey={supabaseKey} supabaseUrl={supabaseUrl} />
      }
    />
  );
}
