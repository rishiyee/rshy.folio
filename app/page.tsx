import MultiplayerRoom from "@/components/multiplayer/MultiplayerRoom";

export default function Home() {
  const deployment = process.env.VERCEL_ENV;
  const previewHost = (process.env.VERCEL_URL ?? "local")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 80);
  const roomId = deployment === "production"
    ? "portfolio-production"
    : `portfolio-preview-${previewHost}`;

  return (
    <MultiplayerRoom
      roomId={roomId}
      supabaseKey={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
    />
  );
}
