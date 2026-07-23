import { supabase } from "./storage";

// ---------- LOGIN POR USUÁRIO (não e-mail) ----------
// Busca o e-mail interno ligado a esse username e faz o login normal
// do Supabase Auth com ele. A pessoa nunca vê nem digita esse e-mail.
export async function signInWithUsername(username, senha) {
  const { data: email, error: erroBusca } = await supabase.rpc("get_email_by_username", {
    p_username: username,
  });
  if (erroBusca || !email) {
    return { error: "Usuário ou senha incorretos." };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { error: "Usuário ou senha incorretos." };
  return { data };
}

// Busca o perfil (nome, cargo, role, status...) do usuário autenticado.
export async function fetchOwnProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) return null;
  return data;
}

// ---------- ESQUECI MINHA SENHA ----------
// Passo 1: mostra o e-mail parcialmente oculto (ex: e*********@gmail.com)
export async function buscarEmailMascarado(username) {
  const { data, error } = await supabase.rpc("get_masked_email_by_username", { p_username: username });
  if (error || !data) return null;
  return data;
}

// Passo 2: dispara o código de recuperação para o e-mail cadastrado.
// (Requer configurar, no painel do Supabase, o template de e-mail de
// "Reset Password" para mostrar {{ .Token }} — ver DEPLOY.md.)
export async function enviarCodigoRecuperacao(username) {
  const { data: email, error } = await supabase.rpc("get_email_by_username", { p_username: username });
  if (error || !email) return { error: "Usuário não encontrado." };
  const { error: erroEnvio } = await supabase.auth.resetPasswordForEmail(email);
  if (erroEnvio) return { error: "Não foi possível enviar o código. Tente novamente." };
  return { ok: true, email };
}

// Passo 3: confirma o código de 6 dígitos recebido por e-mail.
export async function confirmarCodigoRecuperacao(email, codigo) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "recovery" });
  if (error) return { error: "Código inválido ou expirado." };
  return { data };
}

// Passo 4: define a nova senha (precisa estar com a sessão de recuperação ativa).
export async function definirNovaSenha(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { error: "Não foi possível salvar a nova senha." };
  return { ok: true };
}

// ---------- PRESENÇA (online/offline, último acesso, dispositivo) ----------
function detectarDispositivo() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return "iPhone/iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "Navegador";
}

export async function registrarLogin(userId) {
  await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), last_device: detectarDispositivo() })
    .eq("id", userId);
}

export async function atualizarPresenca(userId) {
  await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
}

// Considera "online" quem deu sinal de vida nos últimos 2 minutos.
export function estaOnline(lastSeenAt) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 2 * 60 * 1000;
}

// ---------- GESTÃO DE USUÁRIOS (chama a Edge Function admin-users) ----------
async function chamarAdminUsers(payload) {
  const { data: sessao } = await supabase.auth.getSession();
  const token = sessao?.session?.access_token;
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) return { error: error.message || "Erro ao comunicar com o servidor." };
  if (data?.error) return { error: data.error };
  return { ok: true, ...data };
}

export const criarUsuario = (dados) => chamarAdminUsers({ action: "create", ...dados });
export const atualizarUsuario = (dados) => chamarAdminUsers({ action: "update", ...dados });
export const resetarSenhaUsuario = (id, novaSenha) => chamarAdminUsers({ action: "resetPassword", id, novaSenha });
export const excluirUsuario = (id) => chamarAdminUsers({ action: "delete", id });
