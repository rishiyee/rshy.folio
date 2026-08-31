import { createClient } from "@supabase/supabase-js";

const PROJECT_TYPES = ["Brand", "Product", "Website", "Other"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactRequest = {
  name?: unknown;
  email?: unknown;
  projectType?: unknown;
  message?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Contact delivery is not configured." }, { status: 503 });
  }

  let body: ContactRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Bots commonly fill hidden fields. Return success without storing their payload.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ received: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const projectType = typeof body.projectType === "string" ? body.projectType : "";

  if (
    !name || name.length > 100 ||
    !email || email.length > 254 || !EMAIL_PATTERN.test(email) ||
    !message || message.length > 1200 ||
    !PROJECT_TYPES.some((type) => type === projectType)
  ) {
    return Response.json({ error: "Please check the inquiry details and try again." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error } = await supabase.from("contact_inquiries").insert({
    name,
    email,
    project_type: projectType,
    message,
  });

  if (error) {
    console.error("Contact inquiry insert failed", error.message);
    return Response.json({ error: "Your inquiry could not be saved. Please try again." }, { status: 502 });
  }

  return Response.json({ received: true }, { status: 201 });
}

