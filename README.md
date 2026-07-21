# Vitorio Frutas — como publicar

## 1. Criar o banco de dados (Supabase — grátis)

1. Acesse https://supabase.com e crie uma conta grátis.
2. Clique em **New Project**, dê um nome (ex: `sitio-maracuja`) e uma senha (guarde-a).
3. Depois que o projeto for criado, vá em **SQL Editor** (menu lateral) e cole este comando, depois clique em **Run**:

```sql
create table app_data (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

alter table app_data enable row level security;

create policy "allow all"
on app_data
for all
using (true)
with check (true);
```

Isso cria a "gaveta" onde tudo (colheitas, entregas, usuários etc.) vai ficar salvo.

4. Vá em **Project Settings → API**. Copie dois valores:
   - **Project URL**
   - **anon public key**

## 2. Colocar o projeto no GitHub

1. Crie uma conta em https://github.com se ainda não tiver.
2. Crie um repositório novo (pode ser privado).
3. Suba esta pasta inteira para esse repositório (pelo site do GitHub mesmo, arrastando os arquivos, ou usando o GitHub Desktop se preferir).

## 3. Publicar no Vercel

1. Acesse https://vercel.com e crie conta (dá pra entrar direto com o GitHub).
2. Clique em **Add New → Project** e escolha o repositório que você acabou de subir.
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione:
   - `VITE_SUPABASE_URL` → cole a Project URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` → cole a anon public key do Supabase
4. Clique em **Deploy**. Em cerca de 1 minuto o site estará no ar, com um link tipo `sitio-maracuja.vercel.app`.

## 4. Primeiro acesso

O sistema cria automaticamente o usuário dono na primeira vez que alguém abrir o site:
- usuário: `ednilson`
- senha: `1234`

Entre e troque a senha (ou crie um usuário novo e apague esse) na aba **Usuários**.

## Aviso sobre segurança

A chave do Supabase (`anon key`) fica visível no código do site — é assim que funciona qualquer site que roda só no navegador, sem um servidor próprio. A política `"allow all"` acima permite que qualquer pessoa com essa chave leia/escreva na tabela. Para um app interno de uso familiar isso é aceitável (equivalente a ter uma senha simples de login), mas não é o mesmo nível de segurança de um sistema bancário ou comercial.
