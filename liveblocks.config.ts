declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      user: { name: string; color: string };
    };
  }
}

export {};
