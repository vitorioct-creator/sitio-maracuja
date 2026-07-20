import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Lê um valor salvo (equivalente ao antigo window.storage.get)
export async function loadShared(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value;
  } catch (e) {
    console.error("Erro ao carregar", key, e);
    return fallback;
  }
}

// Salva um valor (equivalente ao antigo window.storage.set)
export async function saveShared(key, value) {
  try {
    const { error } = await supabase
      .from("app_data")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) console.error("Erro ao salvar", key, error);
  } catch (e) {
    console.error("Erro ao salvar", key, e);
  }
}
