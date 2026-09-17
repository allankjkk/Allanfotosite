import "server-only";
import { configured, privileged, sessionClient } from "./supabase/server";
export async function currentAdmin() {
  if (!configured()) return null;
  const auth = await sessionClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return null;
  const { data, error } = await privileged()
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? user : null;
}
export async function requireAdmin() {
  const user = await currentAdmin();
  if (!user)
    throw new Error(
      "Sua sessão expirou ou você não tem autorização. Entre novamente.",
    );
  return user;
}
