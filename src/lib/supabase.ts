import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Debug logging
console.log("=== SUPABASE CLIENT DEBUG ===");
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key present:", !!supabaseAnonKey);
console.log("Supabase Key length:", supabaseAnonKey?.length || 0);
console.log("=============================");

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");


