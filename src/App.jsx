import { useState, useEffect, useMemo } from "react";
import { Droplet, LogOut, Plus, Trash2, Lock, User, Users, Zap, FlaskConical, Package, TrendingUp, Wallet, X, Check, ChevronRight } from "lucide-react";
import { loadShared, saveShared } from "./lib/storage";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const todayISO = () => new Date().toISOString().slice(0, 10);


const PALETTE = {
  bg: "#1f1626",
  bgSoft: "#2a1c34",
  card: "#2e1f3b",
  cardBorder: "#4a3459",
  polpa: "#f5a623",
  polpaSoft: "#f9c463",
  casca: "#5c2d6b",
  vine: "#7a9b5e",
  text: "#f4ece0",
  textDim: "#c7b8d4",
  danger: "#e0654f",
  ok: "#7a9b5e",
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide mb-1" style={{ color: PALETTE.textDim }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg px-3 py-2 bg-black/20 border outline-none focus:ring-2 transition text-[15px]";
const inputStyle = { borderColor: PALETTE.cardBorder, color: PALETTE.text };

function Btn({ children, onClick, variant = "primary", type = "button", className = "", disabled }) {
  const base = "px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 justify-center disabled:opacity-40";
  const styles = {
    primary: { background: PALETTE.polpa, color: "#2a1305" },
    ghost: { background: "transparent", color: PALETTE.text, border: `1px solid ${PALETTE.cardBorder}` },
    danger: { background: "rgba(224,101,79,0.15)", color: PALETTE.danger, border: `1px solid ${PALETTE.danger}55` },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={base + " " + className}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

function Card({ title, icon: Icon, children, right }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.cardBorder}` }}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} style={{ color: PALETTE.polpa }} />}
            <h3 className="font-semibold" style={{ color: PALETTE.text }}>{title}</h3>
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// ---------- LOGIN ----------
function LoginScreen({ users, onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const tryLogin = () => {
    const found = users.find((x) => x.username === u.trim() && x.password === p);
    if (found) {
      onLogin(found);
    } else {
      setErr("Usuário ou senha incorretos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: `radial-gradient(circle at 20% 10%, ${PALETTE.casca} 0%, ${PALETTE.bg} 55%)` }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: PALETTE.polpa }}>
            <Droplet size={28} style={{ color: "#2a1305" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: PALETTE.text, fontFamily: "Georgia, serif" }}>Sítio Maracujá</h1>
          <p className="text-sm mt-1" style={{ color: PALETTE.textDim }}>Controle de produção e polpa</p>
        </div>
        <div className="rounded-2xl p-6 space-y-4" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.cardBorder}` }}>
          <Field label="Usuário">
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: PALETTE.textDim }} />
              <input className={inputCls + " pl-9"} style={inputStyle} value={u} onChange={(e) => setU(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryLogin()} placeholder="ex: pai" />
            </div>
          </Field>
          <Field label="Senha">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: PALETTE.textDim }} />
              <input type="password" className={inputCls + " pl-9"} style={inputStyle} value={p} onChange={(e) => setP(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryLogin()} placeholder="••••••" />
            </div>
          </Field>
          {err && <p className="text-sm" style={{ color: PALETTE.danger }}>{err}</p>}
          <Btn onClick={tryLogin} className="w-full">Entrar <ChevronRight size={16} /></Btn>
        </div>
      </div>
    </div>
  );
}

// ---------- COLHEITA (baldes) ----------
function ColheitaTab({ colheitas, setColheitas, precoKg, setPrecoKg, isAdmin, currentUser }) {
  const [semanaInicio, setSemanaInicio] = useState(todayISO());
  const [semanaFim, setSemanaFim] = useState(todayISO());
  const [baldes, setBaldes] = useState("");

  const addColheita = async () => {
    if (!baldes || Number(baldes) <= 0) return;
    const novo = {
      id: uid(),
      semanaInicio,
      semanaFim,
      baldes: Number(baldes),
      registradoPor: currentUser.nome,
      data: todayISO(),
    };
    const next = [...colheitas, novo];
    setColheitas(next);
    await saveShared("colheitas", next);
    setBaldes("");
  };

  const removerColheita = async (id) => {
    const next = colheitas.filter((c) => c.id !== id);
    setColheitas(next);
    await saveShared("colheitas", next);
  };

  const totalBaldes = colheitas.reduce((s, c) => s + c.baldes, 0);
  const totalKg = totalBaldes * 15;
  const totalValor = totalKg * precoKg;

  const porSemana = useMemo(() => {
    const map = {};
    colheitas.forEach((c) => {
      const key = `${c.semanaInicio} a ${c.semanaFim}`;
      if (!map[key]) map[key] = { baldes: 0, semanaInicio: c.semanaInicio, semanaFim: c.semanaFim };
      map[key].baldes += c.baldes;
    });
    return Object.entries(map)
      .map(([key, v]) => ({ key, ...v, kg: v.baldes * 15, valor: v.baldes * 15 * precoKg }))
      .sort((a, b) => (a.semanaInicio < b.semanaInicio ? 1 : -1));
  }, [colheitas, precoKg]);

  return (
    <div className="space-y-5">
      {isAdmin && (
        <Card title="Preço do quilo" icon={Wallet}>
          <div className="flex items-center gap-3">
            <span style={{ color: PALETTE.textDim }}>R$</span>
            <input
              type="number"
              step="0.01"
              className={inputCls + " max-w-[140px]"}
              style={inputStyle}
              value={precoKg}
              onChange={async (e) => {
                const v = Number(e.target.value) || 0;
                setPrecoKg(v);
                await saveShared("precoKg", v);
              }}
            />
            <span className="text-sm" style={{ color: PALETTE.textDim }}>por kg — altere quando o preço mudar</span>
          </div>
        </Card>
      )}

      <Card title="Registrar colheita da semana" icon={Package}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Início da semana">
            <input type="date" className={inputCls} style={inputStyle} value={semanaInicio} onChange={(e) => setSemanaInicio(e.target.value)} />
          </Field>
          <Field label="Fim da semana">
            <input type="date" className={inputCls} style={inputStyle} value={semanaFim} onChange={(e) => setSemanaFim(e.target.value)} />
          </Field>
        </div>
        <Field label="Quantidade de baldes de 15kg">
          <input type="number" className={inputCls} style={inputStyle} value={baldes} onChange={(e) => setBaldes(e.target.value)} placeholder="0" />
        </Field>
        {baldes > 0 && (
          <p className="text-sm mt-2" style={{ color: PALETTE.polpaSoft }}>
            = {Number(baldes) * 15} kg {isAdmin && <>· {money(Number(baldes) * 15 * precoKg)}</>}
          </p>
        )}
        <Btn onClick={addColheita} className="mt-3">
          <Plus size={16} /> Adicionar
        </Btn>
      </Card>

      <Card title="Totais por semana" icon={TrendingUp}>
        {porSemana.length === 0 && <p style={{ color: PALETTE.textDim }} className="text-sm">Nenhum registro ainda.</p>}
        <div className="space-y-2">
          {porSemana.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: PALETTE.text }}>{s.semanaInicio} → {s.semanaFim}</p>
                <p className="text-xs" style={{ color: PALETTE.textDim }}>{s.baldes} baldes · {s.kg} kg</p>
              </div>
              {isAdmin && <p className="font-semibold" style={{ color: PALETTE.polpa }}>{money(s.valor)}</p>}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Total geral">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: PALETTE.text }}>{totalBaldes}</p>
            <p className="text-xs" style={{ color: PALETTE.textDim }}>baldes</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: PALETTE.text }}>{totalKg}</p>
            <p className="text-xs" style={{ color: PALETTE.textDim }}>kg</p>
          </div>
          {isAdmin && (
            <div>
              <p className="text-2xl font-bold" style={{ color: PALETTE.polpa }}>{money(totalValor)}</p>
              <p className="text-xs" style={{ color: PALETTE.textDim }}>valor</p>
            </div>
          )}
        </div>
      </Card>

      {isAdmin && colheitas.length > 0 && (
        <Card title="Excluir registros">
          <div className="space-y-1 max-h-52 overflow-auto">
            {colheitas.slice().reverse().map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1">
                <span style={{ color: PALETTE.textDim }}>{c.semanaInicio}→{c.semanaFim} · {c.baldes} baldes · {c.registradoPor}</span>
                <button onClick={() => removerColheita(c.id)}><Trash2 size={14} style={{ color: PALETTE.danger }} /></button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------- Lista genérica (pagamentos / despesas) ----------
function ListaFinanceira({ titulo, icon, itens, setItens, storageKey, campos, isAdmin }) {
  const [form, setForm] = useState(() => Object.fromEntries(campos.map((c) => [c.key, c.default ?? ""])));

  const add = async () => {
    if (!campos.every((c) => !c.required || form[c.key])) return;
    const novo = { id: uid(), ...form };
    const next = [...itens, novo];
    setItens(next);
    await saveShared(storageKey, next);
    setForm(Object.fromEntries(campos.map((c) => [c.key, c.default ?? ""])));
  };

  const remover = async (id) => {
    const next = itens.filter((i) => i.id !== id);
    setItens(next);
    await saveShared(storageKey, next);
  };

  const total = itens.reduce((s, i) => s + Number(i.valor || 0), 0);

  if (!isAdmin) return <p style={{ color: PALETTE.textDim }}>Acesso restrito ao dono.</p>;

  return (
    <div className="space-y-5">
      <Card title={`Novo lançamento — ${titulo}`} icon={icon}>
        <div className="grid grid-cols-2 gap-3">
          {campos.map((c) => (
            <Field key={c.key} label={c.label}>
              <input
                type={c.type || "text"}
                step={c.type === "number" ? "0.01" : undefined}
                className={inputCls}
                style={inputStyle}
                value={form[c.key]}
                onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
              />
            </Field>
          ))}
        </div>
        <Btn onClick={add} className="mt-3"><Plus size={16} /> Adicionar</Btn>
      </Card>

      <Card title={`Total em ${titulo.toLowerCase()}`}>
        <p className="text-2xl font-bold" style={{ color: PALETTE.polpa }}>{money(total)}</p>
      </Card>

      <Card title="Histórico">
        {itens.length === 0 && <p style={{ color: PALETTE.textDim }} className="text-sm">Nenhum lançamento.</p>}
        <div className="space-y-2">
          {itens.slice().reverse().map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
              <div className="text-sm" style={{ color: PALETTE.text }}>
                {campos.filter((c) => c.key !== "valor").map((c) => i[c.key]).filter(Boolean).join(" · ")}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold" style={{ color: PALETTE.polpa }}>{money(i.valor)}</span>
                <button onClick={() => remover(i.id)}><Trash2 size={14} style={{ color: PALETTE.danger }} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- ENTREGAS ----------
function EntregasTab({ entregas, setEntregas, isAdmin }) {
  const [form, setForm] = useState({ comprador: "", kg: "", valor: "", prazo: "", dataEntrega: todayISO() });

  const add = async () => {
    if (!form.comprador || !form.kg || !form.valor) return;
    const novo = { id: uid(), ...form, pago: false };
    const next = [...entregas, novo];
    setEntregas(next);
    await saveShared("entregas", next);
    setForm({ comprador: "", kg: "", valor: "", prazo: "", dataEntrega: todayISO() });
  };

  const togglePago = async (id) => {
    const next = entregas.map((e) => (e.id === id ? { ...e, pago: !e.pago } : e));
    setEntregas(next);
    await saveShared("entregas", next);
  };

  const remover = async (id) => {
    const next = entregas.filter((e) => e.id !== id);
    setEntregas(next);
    await saveShared("entregas", next);
  };

  if (!isAdmin) return <p style={{ color: PALETTE.textDim }}>Acesso restrito ao dono.</p>;

  const totalReceber = entregas.filter((e) => !e.pago).reduce((s, e) => s + Number(e.valor || 0), 0);
  const totalRecebido = entregas.filter((e) => e.pago).reduce((s, e) => s + Number(e.valor || 0), 0);

  return (
    <div className="space-y-5">
      <Card title="Nova entrega de polpa" icon={Package}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Comprador"><input className={inputCls} style={inputStyle} value={form.comprador} onChange={(e) => setForm((f) => ({ ...f, comprador: e.target.value }))} /></Field>
          <Field label="Data da entrega"><input type="date" className={inputCls} style={inputStyle} value={form.dataEntrega} onChange={(e) => setForm((f) => ({ ...f, dataEntrega: e.target.value }))} /></Field>
          <Field label="Quilos (kg)"><input type="number" className={inputCls} style={inputStyle} value={form.kg} onChange={(e) => setForm((f) => ({ ...f, kg: e.target.value }))} /></Field>
          <Field label="Valor a pagar (R$)"><input type="number" step="0.01" className={inputCls} style={inputStyle} value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} /></Field>
          <Field label="Prazo de pagamento"><input type="date" className={inputCls} style={inputStyle} value={form.prazo} onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))} /></Field>
        </div>
        <Btn onClick={add} className="mt-3"><Plus size={16} /> Adicionar</Btn>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="A receber"><p className="text-xl font-bold" style={{ color: PALETTE.danger }}>{money(totalReceber)}</p></Card>
        <Card title="Recebido"><p className="text-xl font-bold" style={{ color: PALETTE.ok }}>{money(totalRecebido)}</p></Card>
      </div>

      <Card title="Entregas">
        {entregas.length === 0 && <p style={{ color: PALETTE.textDim }} className="text-sm">Nenhuma entrega registrada.</p>}
        <div className="space-y-2">
          {entregas.slice().reverse().map((e) => (
            <div key={e.id} className="rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
              <div className="flex items-center justify-between">
                <p className="font-medium" style={{ color: PALETTE.text }}>{e.comprador}</p>
                <button onClick={() => remover(e.id)}><Trash2 size={14} style={{ color: PALETTE.danger }} /></button>
              </div>
              <p className="text-xs" style={{ color: PALETTE.textDim }}>
                {e.kg} kg · {money(e.valor)} · entregue em {e.dataEntrega} {e.prazo && `· prazo ${e.prazo}`}
              </p>
              <button
                onClick={() => togglePago(e.id)}
                className="mt-2 text-xs px-2 py-1 rounded-md inline-flex items-center gap-1"
                style={{
                  background: e.pago ? "rgba(122,155,94,0.2)" : "rgba(224,101,79,0.2)",
                  color: e.pago ? PALETTE.ok : PALETTE.danger,
                }}
              >
                {e.pago ? <Check size={12} /> : <X size={12} />} {e.pago ? "Pago" : "Pendente — marcar como pago"}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- DASHBOARD ----------
function Dashboard({ colheitas, precoKg, pagamentosEder, energia, quimicos, entregas }) {
  const totalKg = colheitas.reduce((s, c) => s + c.baldes, 0) * 15;
  const producaoValor = totalKg * precoKg;
  const totalEder = pagamentosEder.reduce((s, p) => s + Number(p.valor || 0), 0);
  const totalEnergia = energia.reduce((s, p) => s + Number(p.valor || 0), 0);
  const totalQuimicos = quimicos.reduce((s, p) => s + Number(p.valor || 0), 0);
  const totalDespesas = totalEder + totalEnergia + totalQuimicos;
  const totalRecebido = entregas.filter((e) => e.pago).reduce((s, e) => s + Number(e.valor || 0), 0);
  const aReceber = entregas.filter((e) => !e.pago).reduce((s, e) => s + Number(e.valor || 0), 0);
  const lucro = totalRecebido - totalDespesas;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Card title="Produção total"><p className="text-xl font-bold" style={{ color: PALETTE.text }}>{totalKg} kg</p><p className="text-xs" style={{ color: PALETTE.textDim }}>{money(producaoValor)} ao preço atual</p></Card>
        <Card title="Despesas totais"><p className="text-xl font-bold" style={{ color: PALETTE.danger }}>{money(totalDespesas)}</p><p className="text-xs" style={{ color: PALETTE.textDim }}>Eder + energia + químicos</p></Card>
        <Card title="Recebido de entregas"><p className="text-xl font-bold" style={{ color: PALETTE.ok }}>{money(totalRecebido)}</p></Card>
        <Card title="A receber"><p className="text-xl font-bold" style={{ color: PALETTE.polpa }}>{money(aReceber)}</p></Card>
      </div>
      <Card title="Lucro (recebido − despesas)" icon={TrendingUp}>
        <p className="text-3xl font-bold" style={{ color: lucro >= 0 ? PALETTE.ok : PALETTE.danger }}>{money(lucro)}</p>
        <p className="text-xs mt-1" style={{ color: PALETTE.textDim }}>
          Baseado no que já foi recebido das entregas. Some o "a receber" para ver o potencial total.
        </p>
      </Card>
      <div className="grid grid-cols-3 gap-3">
        <Card title="Eder"><p className="font-semibold" style={{ color: PALETTE.text }}>{money(totalEder)}</p></Card>
        <Card title="Energia"><p className="font-semibold" style={{ color: PALETTE.text }}>{money(totalEnergia)}</p></Card>
        <Card title="Químicos"><p className="font-semibold" style={{ color: PALETTE.text }}>{money(totalQuimicos)}</p></Card>
      </div>
    </div>
  );
}

// ---------- USUÁRIOS ----------
function UsuariosTab({ users, setUsers }) {
  const [form, setForm] = useState({ nome: "", username: "", password: "", role: "funcionario" });

  const add = async () => {
    if (!form.nome || !form.username || !form.password) return;
    if (users.some((u) => u.username === form.username)) return alert("Usuário já existe.");
    const next = [...users, { ...form }];
    setUsers(next);
    await saveShared("users", next);
    setForm({ nome: "", username: "", password: "", role: "funcionario" });
  };

  const remover = async (username) => {
    if (username === "ednilson") return;
    const next = users.filter((u) => u.username !== username);
    setUsers(next);
    await saveShared("users", next);
  };

  return (
    <div className="space-y-5">
      <Card title="Novo usuário" icon={Users}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome"><input className={inputCls} style={inputStyle} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} /></Field>
          <Field label="Usuário (login)"><input className={inputCls} style={inputStyle} value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} /></Field>
          <Field label="Senha"><input className={inputCls} style={inputStyle} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></Field>
          <Field label="Função">
            <select className={inputCls} style={inputStyle} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="funcionario">Funcionário (só lança colheita)</option>
              <option value="admin">Dono (acesso total)</option>
            </select>
          </Field>
        </div>
        <Btn onClick={add} className="mt-3"><Plus size={16} /> Criar usuário</Btn>
      </Card>
      <Card title="Usuários cadastrados">
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.username} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: PALETTE.text }}>{u.nome} <span style={{ color: PALETTE.textDim }}>· @{u.username}</span></p>
                <p className="text-xs" style={{ color: PALETTE.textDim }}>{u.role === "admin" ? "Dono" : "Funcionário"}</p>
              </div>
              {u.username !== "ednilson" && <button onClick={() => remover(u.username)}><Trash2 size={14} style={{ color: PALETTE.danger }} /></button>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- APP ----------
export default function App() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  const [colheitas, setColheitas] = useState([]);
  const [precoKg, setPrecoKg] = useState(11);
  const [pagamentosEder, setPagamentosEder] = useState([]);
  const [energia, setEnergia] = useState([]);
  const [quimicos, setQuimicos] = useState([]);
  const [entregas, setEntregas] = useState([]);

  useEffect(() => {
    (async () => {
      let u = await loadShared("users", null);
      if (!u) {
        u = [{ nome: "Ednilson", username: "ednilson", password: "1234", role: "admin" }];
        await saveShared("users", u);
      }
      setUsers(u);
      setColheitas(await loadShared("colheitas", []));
      setPrecoKg(await loadShared("precoKg", 11));
      setPagamentosEder(await loadShared("pagamentosEder", []));
      setEnergia(await loadShared("energia", []));
      setQuimicos(await loadShared("quimicos", []));
      setEntregas(await loadShared("entregas", []));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: PALETTE.bg, color: PALETTE.text }}>Carregando...</div>;
  }

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={setCurrentUser} />;
  }

  const isAdmin = currentUser.role === "admin";

  const tabsAdmin = [
    { key: "dashboard", label: "Painel", icon: TrendingUp },
    { key: "colheita", label: "Colheita", icon: Package },
    { key: "entregas", label: "Entregas", icon: Package },
    { key: "eder", label: "Pagamentos Eder", icon: Wallet },
    { key: "energia", label: "Energia", icon: Zap },
    { key: "quimicos", label: "Químicos", icon: FlaskConical },
    { key: "usuarios", label: "Usuários", icon: Users },
  ];
  const tabsFuncionario = [{ key: "colheita", label: "Colheita", icon: Package }];
  const tabs = isAdmin ? tabsAdmin : tabsFuncionario;

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <header className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: PALETTE.cardBorder }}>
        <div className="flex items-center gap-2">
          <Droplet size={20} style={{ color: PALETTE.polpa }} />
          <span className="font-bold" style={{ color: PALETTE.text, fontFamily: "Georgia, serif" }}>Sítio Maracujá</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:block" style={{ color: PALETTE.textDim }}>{currentUser.nome}</span>
          <button onClick={() => setCurrentUser(null)} className="flex items-center gap-1 text-sm" style={{ color: PALETTE.textDim }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      <nav className="flex gap-2 px-5 py-3 overflow-x-auto border-b" style={{ borderColor: PALETTE.cardBorder }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition"
            style={{
              background: tab === t.key ? PALETTE.polpa : "transparent",
              color: tab === t.key ? "#2a1305" : PALETTE.textDim,
              border: `1px solid ${tab === t.key ? PALETTE.polpa : PALETTE.cardBorder}`,
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </nav>

      <main className="p-5 max-w-2xl mx-auto">
        {tab === "dashboard" && isAdmin && (
          <Dashboard colheitas={colheitas} precoKg={precoKg} pagamentosEder={pagamentosEder} energia={energia} quimicos={quimicos} entregas={entregas} />
        )}
        {tab === "colheita" && (
          <ColheitaTab colheitas={colheitas} setColheitas={setColheitas} precoKg={precoKg} setPrecoKg={setPrecoKg} isAdmin={isAdmin} currentUser={currentUser} />
        )}
        {tab === "entregas" && <EntregasTab entregas={entregas} setEntregas={setEntregas} isAdmin={isAdmin} />}
        {tab === "eder" && (
          <ListaFinanceira
            titulo="Pagamentos Eder"
            icon={Wallet}
            itens={pagamentosEder}
            setItens={setPagamentosEder}
            storageKey="pagamentosEder"
            isAdmin={isAdmin}
            campos={[
              { key: "data", label: "Data do pagamento", type: "date", required: true },
              { key: "valor", label: "Valor (R$)", type: "number", required: true },
            ]}
          />
        )}
        {tab === "energia" && (
          <ListaFinanceira
            titulo="Energia"
            icon={Zap}
            itens={energia}
            setItens={setEnergia}
            storageKey="energia"
            isAdmin={isAdmin}
            campos={[
              { key: "mes", label: "Mês/ano", type: "month", required: true },
              { key: "valor", label: "Valor (R$)", type: "number", required: true },
              { key: "descricao", label: "Obs. (câmara fria, máquinas...)" },
            ]}
          />
        )}
        {tab === "quimicos" && (
          <ListaFinanceira
            titulo="Produtos químicos"
            icon={FlaskConical}
            itens={quimicos}
            setItens={setQuimicos}
            storageKey="quimicos"
            isAdmin={isAdmin}
            campos={[
              { key: "data", label: "Data", type: "date", required: true },
              { key: "valor", label: "Valor (R$)", type: "number", required: true },
              { key: "descricao", label: "Produto" },
            ]}
          />
        )}
        {tab === "usuarios" && isAdmin && <UsuariosTab users={users} setUsers={setUsers} />}
      </main>
    </div>
  );
}
