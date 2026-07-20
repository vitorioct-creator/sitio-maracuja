import { useState, useEffect, useMemo, useRef } from "react";
import {
  Droplet, LogOut, Plus, Trash2, Lock, User, Users, Zap, FlaskConical,
  Package, TrendingUp, Wallet, X, Check, ChevronRight, FileText, Download,
} from "lucide-react";
import html2canvas from "html2canvas";
import { loadShared, saveShared } from "./lib/storage";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const money = (v) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const kg = (v) => (Number(v) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

const todayISO = () => new Date().toISOString().slice(0, 10);

const parsePeso = (v) => Number(String(v).replace(",", "."));

// ---------- CORES DO SISTEMA ----------
// fundo cinza claro, cards brancos, texto cinza escuro,
// laranja como cor principal (botões/destaques), roxo como cor secundária
const PALETTE = {
  bg: "#ECECEC",
  card: "#FFFFFF",
  cardBorder: "#E1E1E1",
  polpa: "#F5A623", // laranja — cor principal
  polpaDark: "#B8720E", // laranja mais escuro, para texto sobre fundo claro
  polpaText: "#2A1305", // texto sobre botão laranja
  casca: "#6B3F7A", // roxo — cor secundária
  cascaSoft: "#F1E9F4",
  text: "#333333",
  textDim: "#7A7A7A",
  danger: "#D9534F",
  dangerSoft: "#FBEAEA",
  ok: "#3F8F4F",
  okSoft: "#EAF5EC",
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
  "w-full rounded-lg px-3 py-2 border outline-none focus:ring-2 transition text-[15px]";
const inputStyle = {
  borderColor: PALETTE.cardBorder,
  color: PALETTE.text,
  background: "#FAFAFA",
  "--tw-ring-color": PALETTE.polpa,
};

function Btn({ children, onClick, variant = "primary", type = "button", className = "", disabled }) {
  const base = "px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 justify-center disabled:opacity-40";
  const styles = {
    primary: { background: PALETTE.polpa, color: PALETTE.polpaText },
    ghost: { background: "transparent", color: PALETTE.text, border: `1px solid ${PALETTE.cardBorder}` },
    secondary: { background: PALETTE.cascaSoft, color: PALETTE.casca, border: `1px solid ${PALETTE.casca}33` },
    danger: { background: PALETTE.dangerSoft, color: PALETTE.danger, border: `1px solid ${PALETTE.danger}55` },
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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: `radial-gradient(circle at 20% 10%, rgba(107,63,122,0.16) 0%, ${PALETTE.bg} 60%)` }}
    >
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3" style={{ background: PALETTE.polpa }}>
            <Droplet size={28} style={{ color: PALETTE.polpaText }} />
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

// ---------- ADICIONAR BALDE (peso individual) ----------
// Componente reutilizado na Colheita e nas Entregas: cada balde tem um peso próprio.
function BaldeAdder({ onAdd, proximoNumero }) {
  const [peso, setPeso] = useState("");

  const add = () => {
    const v = parsePeso(peso);
    if (!v || v <= 0) return;
    onAdd(v);
    setPeso("");
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Field label={`Balde ${proximoNumero} — peso (kg)`}>
          <input
            type="number"
            step="0.1"
            inputMode="decimal"
            className={inputCls}
            style={inputStyle}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="ex: 13,7"
          />
        </Field>
      </div>
      <Btn onClick={add}><Plus size={16} /> Adicionar</Btn>
    </div>
  );
}

function ListaBaldes({ baldes, onRemove }) {
  if (baldes.length === 0) return null;
  return (
    <div className="mt-3 space-y-1 max-h-48 overflow-auto">
      {baldes.map((p, i) => (
        <div key={i} className="flex items-center justify-between text-sm rounded-md px-3 py-1.5" style={{ background: PALETTE.bg }}>
          <span style={{ color: PALETTE.text }}>Balde {i + 1} — {kg(p)} kg</span>
          <button onClick={() => onRemove(i)}><Trash2 size={13} style={{ color: PALETTE.danger }} /></button>
        </div>
      ))}
    </div>
  );
}

function ResumoBaldes({ totalBaldes, totalKg, valor, mostrarValor }) {
  return (
    <div className={`grid ${mostrarValor ? "grid-cols-3" : "grid-cols-2"} gap-3 mt-3`}>
      <div className="rounded-lg px-3 py-2 text-center" style={{ background: PALETTE.bg }}>
        <p className="text-lg font-bold" style={{ color: PALETTE.text }}>{totalBaldes}</p>
        <p className="text-xs" style={{ color: PALETTE.textDim }}>baldes</p>
      </div>
      <div className="rounded-lg px-3 py-2 text-center" style={{ background: PALETTE.bg }}>
        <p className="text-lg font-bold" style={{ color: PALETTE.text }}>{kg(totalKg)}</p>
        <p className="text-xs" style={{ color: PALETTE.textDim }}>kg</p>
      </div>
      {mostrarValor && (
        <div className="rounded-lg px-3 py-2 text-center" style={{ background: PALETTE.bg }}>
          <p className="text-lg font-bold" style={{ color: PALETTE.polpaDark }}>{money(valor)}</p>
          <p className="text-xs" style={{ color: PALETTE.textDim }}>valor</p>
        </div>
      )}
    </div>
  );
}

// ---------- COLHEITA (baldes com peso individual) ----------
function ColheitaTab({ colheitas, setColheitas, precoKg, setPrecoKg, isAdmin, currentUser }) {
  const [semanaInicio, setSemanaInicio] = useState(todayISO());
  const [semanaFim, setSemanaFim] = useState(todayISO());
  const [baldesAtuais, setBaldesAtuais] = useState([]);
  const [semanaAberta, setSemanaAberta] = useState(null);

  const addBalde = (peso) => setBaldesAtuais((b) => [...b, peso]);
  const removeBaldeAtual = (idx) => setBaldesAtuais((b) => b.filter((_, i) => i !== idx));

  const totalBaldesAtual = baldesAtuais.length;
  const totalKgAtual = baldesAtuais.reduce((s, p) => s + p, 0);
  const totalValorAtual = totalKgAtual * precoKg;

  const salvarSemana = async () => {
    if (baldesAtuais.length === 0) return;
    const novo = {
      id: uid(),
      semanaInicio,
      semanaFim,
      baldes: baldesAtuais.map((peso, i) => ({
        id: uid(),
        numero: i + 1,
        peso,
        status: "estoque", // "estoque" | "entregue"
        entregaId: null,
      })),
      registradoPor: currentUser.nome,
      data: todayISO(),
    };
    const next = [...colheitas, novo];
    setColheitas(next);
    await saveShared("colheitas", next);
    setBaldesAtuais([]);
  };

  const removerColheita = async (id) => {
    const c = colheitas.find((x) => x.id === id);
    if (c && c.baldes.some((b) => b.status === "entregue")) {
      alert("Não é possível excluir: essa semana tem baldes que já foram entregues. Exclua a entrega correspondente primeiro.");
      return;
    }
    const next = colheitas.filter((c) => c.id !== id);
    setColheitas(next);
    await saveShared("colheitas", next);
  };

  // Correção manual de status (útil para registros migrados do formato antigo,
  // que não sabiam distinguir baldes já vendidos anteriormente).
  const alternarStatusBalde = async (colheitaId, baldeId) => {
    const next = colheitas.map((c) => {
      if (c.id !== colheitaId) return c;
      return {
        ...c,
        baldes: c.baldes.map((b) => {
          if (b.id !== baldeId) return b;
          if (b.status === "entregue") return b; // vinculado a uma entrega real, não alterna aqui
          return { ...b, status: "estoque" };
        }),
      };
    });
    setColheitas(next);
    await saveShared("colheitas", next);
  };

  const totalBaldesGeral = colheitas.reduce((s, c) => s + c.baldes.length, 0);
  const totalKgGeral = colheitas.reduce((s, c) => s + c.baldes.reduce((a, b) => a + b.peso, 0), 0);
  const totalValorGeral = totalKgGeral * precoKg;

  const historico = colheitas
    .map((c) => ({ ...c, totalKg: c.baldes.reduce((a, b) => a + b.peso, 0) }))
    .sort((a, b) => (a.semanaInicio < b.semanaInicio ? 1 : -1));

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
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label="Início da semana">
            <input type="date" className={inputCls} style={inputStyle} value={semanaInicio} onChange={(e) => setSemanaInicio(e.target.value)} />
          </Field>
          <Field label="Fim da semana">
            <input type="date" className={inputCls} style={inputStyle} value={semanaFim} onChange={(e) => setSemanaFim(e.target.value)} />
          </Field>
        </div>

        <BaldeAdder onAdd={addBalde} proximoNumero={totalBaldesAtual + 1} />
        <ListaBaldes baldes={baldesAtuais} onRemove={removeBaldeAtual} />
        <ResumoBaldes totalBaldes={totalBaldesAtual} totalKg={totalKgAtual} valor={totalValorAtual} mostrarValor={isAdmin} />

        <Btn onClick={salvarSemana} disabled={baldesAtuais.length === 0} className="mt-4 w-full">
          <Check size={16} /> Salvar registro da semana
        </Btn>
      </Card>

      <Card title="Histórico da colheita" icon={TrendingUp}>
        {historico.length === 0 && <p style={{ color: PALETTE.textDim }} className="text-sm">Nenhum registro ainda.</p>}
        <div className="space-y-2">
          {historico.map((s) => {
            const aberta = semanaAberta === s.id;
            return (
              <div key={s.id} className="rounded-lg overflow-hidden" style={{ background: PALETTE.bg }}>
                <button
                  onClick={() => setSemanaAberta(aberta ? null : s.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left"
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: PALETTE.text }}>{s.semanaInicio} → {s.semanaFim}</p>
                    <p className="text-xs" style={{ color: PALETTE.textDim }}>
                      {s.baldes.length} baldes · {kg(s.totalKg)} kg{isAdmin ? ` · ${money(s.totalKg * precoKg)}` : ""}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    style={{ color: PALETTE.textDim, transform: aberta ? "rotate(90deg)" : "none", transition: "transform .15s" }}
                  />
                </button>
                {aberta && (
                  <div className="px-3 pb-3 space-y-1">
                    {s.baldes.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm rounded-md px-3 py-1.5" style={{ background: PALETTE.card }}>
                        <span style={{ color: PALETTE.text }}>Balde {String(b.numero).padStart(3, "0")} — {kg(b.peso)} kg</span>
                        <button
                          onClick={() => isAdmin && alternarStatusBalde(s.id, b.id)}
                          disabled={!isAdmin}
                          className="text-xs px-2 py-0.5 rounded-full"
                          title={b.status === "entregue" ? "Vinculado a uma entrega — exclua a entrega para liberar" : "Em estoque"}
                          style={{
                            background: b.status === "entregue" ? PALETTE.cascaSoft : PALETTE.okSoft,
                            color: b.status === "entregue" ? PALETTE.casca : PALETTE.ok,
                          }}
                        >
                          {b.status === "entregue" ? "Entregue" : "Em estoque"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Total geral">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: PALETTE.text }}>{totalBaldesGeral}</p>
            <p className="text-xs" style={{ color: PALETTE.textDim }}>baldes</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: PALETTE.text }}>{kg(totalKgGeral)}</p>
            <p className="text-xs" style={{ color: PALETTE.textDim }}>kg</p>
          </div>
          {isAdmin && (
            <div>
              <p className="text-2xl font-bold" style={{ color: PALETTE.polpaDark }}>{money(totalValorGeral)}</p>
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
                <span style={{ color: PALETTE.textDim }}>{c.semanaInicio}→{c.semanaFim} · {c.baldes.length} baldes · {c.registradoPor}</span>
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
        <p className="text-2xl font-bold" style={{ color: PALETTE.polpaDark }}>{money(total)}</p>
      </Card>

      <Card title="Histórico">
        {itens.length === 0 && <p style={{ color: PALETTE.textDim }} className="text-sm">Nenhum lançamento.</p>}
        <div className="space-y-2">
          {itens.slice().reverse().map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: PALETTE.bg }}>
              <div className="text-sm" style={{ color: PALETTE.text }}>
                {campos.filter((c) => c.key !== "valor").map((c) => i[c.key]).filter(Boolean).join(" · ")}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold" style={{ color: PALETTE.polpaDark }}>{money(i.valor)}</span>
                <button onClick={() => remover(i.id)}><Trash2 size={14} style={{ color: PALETTE.danger }} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- RELATÓRIO PARA O COMPRADOR (gera PNG) ----------
function Linha({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#333", margin: "4px 0" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function RelatorioComprador({ comprador, entregas, onClose }) {
  const reportRef = useRef(null);
  const [baixando, setBaixando] = useState(false);

  const totalBaldes = entregas.reduce((s, e) => s + (e.baldesResolvidos || []).length, 0);
  const totalKg = entregas.reduce((s, e) => s + (e.baldesResolvidos || []).reduce((a, b) => a + b.peso, 0), 0);
  const valorTotal = entregas.reduce((s, e) => s + Number(e.valor || 0), 0);
  const precoMedio = totalKg > 0 ? valorTotal / totalKg : 0;

  const datas = entregas.map((e) => e.dataEntrega).filter(Boolean).sort();
  const periodoInicio = datas[0];
  const periodoFim = datas[datas.length - 1];

  const prazos = entregas.map((e) => e.prazo).filter(Boolean).sort();
  const prazoExibido = prazos[prazos.length - 1];

  const todasPagas = entregas.length > 0 && entregas.every((e) => e.pago);
  const nenhumaPaga = entregas.every((e) => !e.pago);
  const status = todasPagas ? "Pago" : nenhumaPaga ? "Pendente" : "Parcialmente pago";
  const statusCores = {
    Pago: { bg: PALETTE.okSoft, cor: PALETTE.ok },
    Pendente: { bg: PALETTE.dangerSoft, cor: PALETTE.danger },
    "Parcialmente pago": { bg: "#FDF3E3", cor: PALETTE.polpaDark },
  };

  const baixar = async () => {
    setBaixando(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = `relatorio-${comprador.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      alert("Não foi possível gerar a imagem do relatório.");
    }
    setBaixando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full max-w-md max-h-[92vh] overflow-auto rounded-2xl" style={{ background: PALETTE.card }}>
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0" style={{ borderColor: PALETTE.cardBorder, background: PALETTE.card }}>
          <p className="font-semibold" style={{ color: PALETTE.text }}>Relatório — {comprador}</p>
          <button onClick={onClose}><X size={18} style={{ color: PALETTE.textDim }} /></button>
        </div>

        <div className="p-4">
          <div
            ref={reportRef}
            style={{ width: "100%", maxWidth: 440, margin: "0 auto", background: "#FFFFFF", padding: 28, fontFamily: "Georgia, serif" }}
          >
            <div style={{ borderBottom: `4px solid ${PALETTE.polpa}`, paddingBottom: 14, marginBottom: 18 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: PALETTE.casca, margin: 0 }}>Sítio Maracujá</p>
              <p style={{ fontSize: 13, color: "#777", margin: "2px 0 0" }}>Relatório de entrega de polpa</p>
            </div>

            <p style={{ fontSize: 16, fontWeight: 700, color: "#333", margin: "0 0 4px" }}>Comprador: {comprador}</p>
            {periodoInicio && (
              <p style={{ fontSize: 13, color: "#555", margin: "0 0 14px" }}>
                Período: {periodoInicio}{periodoFim && periodoFim !== periodoInicio ? ` a ${periodoFim}` : ""}
              </p>
            )}

            <div style={{ background: "#F7F7F7", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Baldes entregues
              </p>
              {entregas.map((e) => (
                <div key={e.id} style={{ marginBottom: 8 }}>
                  {entregas.length > 1 && (
                    <p style={{ fontSize: 11, color: "#999", margin: "0 0 3px" }}>Entrega de {e.dataEntrega}</p>
                  )}
                  {(e.baldesResolvidos || []).map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#333", padding: "2px 0" }}>
                      <span>Balde {String(b.numero ?? i + 1).padStart(3, "0")}</span>
                      <span>{kg(b.peso)} kg</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <Linha label="Total de baldes" value={totalBaldes} />
            <Linha label="Total de quilos" value={`${kg(totalKg)} kg`} />
            <Linha label="Preço por kg" value={money(precoMedio)} />
            {prazoExibido && <Linha label="Prazo de pagamento" value={prazoExibido} />}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: PALETTE.polpaDark, margin: "10px 0 4px", paddingTop: 10, borderTop: "1px solid #eee" }}>
              <span style={{ fontWeight: 700 }}>Valor total</span>
              <span style={{ fontWeight: 700 }}>{money(valorTotal)}</span>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "inline-block",
                padding: "5px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                background: statusCores[status].bg,
                color: statusCores[status].cor,
              }}
            >
              {status}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Btn onClick={baixar} disabled={baixando} className="w-full">
            {baixando ? "Gerando imagem..." : (<><Download size={16} /> Baixar imagem</>)}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ---------- ENTREGAS ----------
// Resolve os baldes "de verdade" de uma entrega, buscando na Colheita (fonte única dos dados).
// Também aceita entregas do formato antigo (antes da refatoração), que guardavam o peso solto.
function resolverBaldesDaEntrega(entrega, colheitas) {
  if (entrega.itens) {
    return entrega.itens
      .map(({ colheitaId, baldeId }) => {
        const c = colheitas.find((c) => c.id === colheitaId);
        const b = c?.baldes.find((b) => b.id === baldeId);
        return b ? { numero: b.numero, peso: b.peso } : null;
      })
      .filter(Boolean);
  }
  // formato antigo (pré-refatoração): peso ficava direto na entrega
  return (entrega.baldes || []).map((peso, i) => ({ numero: i + 1, peso }));
}

function EntregasTab({ colheitas, setColheitas, entregas, setEntregas, isAdmin, precoKg }) {
  const [form, setForm] = useState({ colheitaId: "", comprador: "", dataEntrega: todayISO(), prazo: "", precoKgEntrega: precoKg });
  const [selecionados, setSelecionados] = useState([]);
  const [entregaAberta, setEntregaAberta] = useState(null);
  const [relatorioEntregaId, setRelatorioEntregaId] = useState(null);

  const semanasComEstoque = useMemo(
    () =>
      colheitas
        .map((c) => ({ ...c, disponiveis: c.baldes.filter((b) => b.status === "estoque") }))
        .filter((c) => c.disponiveis.length > 0)
        .sort((a, b) => (a.semanaInicio < b.semanaInicio ? 1 : -1)),
    [colheitas]
  );

  const colheitaSelecionada = colheitas.find((c) => c.id === form.colheitaId);
  const baldesDisponiveis = colheitaSelecionada ? colheitaSelecionada.baldes.filter((b) => b.status === "estoque") : [];

  const toggleBalde = (id) =>
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const baldesSelecionadosObjs = baldesDisponiveis.filter((b) => selecionados.includes(b.id));
  const totalKgAtual = baldesSelecionadosObjs.reduce((s, b) => s + b.peso, 0);
  const valorAtual = totalKgAtual * (Number(form.precoKgEntrega) || 0);

  const escolherSemana = (colheitaId) => {
    setForm((f) => ({ ...f, colheitaId }));
    setSelecionados([]);
  };

  const add = async () => {
    if (!form.comprador || !form.colheitaId || selecionados.length === 0) return;
    const entregaId = uid();
    const novaEntrega = {
      id: entregaId,
      comprador: form.comprador.trim(),
      dataEntrega: form.dataEntrega,
      prazo: form.prazo,
      precoKgEntrega: Number(form.precoKgEntrega) || 0,
      valor: totalKgAtual * (Number(form.precoKgEntrega) || 0),
      pago: false,
      itens: selecionados.map((baldeId) => ({ colheitaId: form.colheitaId, baldeId })),
    };
    const nextEntregas = [...entregas, novaEntrega];
    const nextColheitas = colheitas.map((c) =>
      c.id !== form.colheitaId
        ? c
        : { ...c, baldes: c.baldes.map((b) => (selecionados.includes(b.id) ? { ...b, status: "entregue", entregaId } : b)) }
    );

    setEntregas(nextEntregas);
    setColheitas(nextColheitas);
    await saveShared("entregas", nextEntregas);
    await saveShared("colheitas", nextColheitas);

    setForm({ colheitaId: "", comprador: "", dataEntrega: todayISO(), prazo: "", precoKgEntrega: precoKg });
    setSelecionados([]);
  };

  const togglePago = async (id) => {
    const next = entregas.map((e) => (e.id === id ? { ...e, pago: !e.pago } : e));
    setEntregas(next);
    await saveShared("entregas", next);
  };

  // Exclui a entrega e devolve os baldes para o estoque (Em estoque novamente).
  const remover = async (id) => {
    const entrega = entregas.find((e) => e.id === id);
    if (!entrega) return;
    if (!confirm("Excluir esta entrega? Os baldes voltarão para o estoque.")) return;

    const nextColheitas = entrega.itens
      ? colheitas.map((c) => ({
          ...c,
          baldes: c.baldes.map((b) => (b.entregaId === id ? { ...b, status: "estoque", entregaId: null } : b)),
        }))
      : colheitas;

    const nextEntregas = entregas.filter((e) => e.id !== id);
    setColheitas(nextColheitas);
    setEntregas(nextEntregas);
    await saveShared("colheitas", nextColheitas);
    await saveShared("entregas", nextEntregas);
  };

  if (!isAdmin) return <p style={{ color: PALETTE.textDim }}>Acesso restrito ao dono.</p>;

  const totalReceber = entregas.filter((e) => !e.pago).reduce((s, e) => s + Number(e.valor || 0), 0);
  const totalRecebido = entregas.filter((e) => e.pago).reduce((s, e) => s + Number(e.valor || 0), 0);

  const entregaParaRelatorio = relatorioEntregaId ? entregas.find((e) => e.id === relatorioEntregaId) : null;

  return (
    <div className="space-y-5">
      <Card title="Nova entrega de polpa" icon={Package}>
        {semanasComEstoque.length === 0 ? (
          <p className="text-sm" style={{ color: PALETTE.textDim }}>Nenhum balde disponível em estoque. Registre uma colheita primeiro.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Semana da produção">
                <select className={inputCls} style={inputStyle} value={form.colheitaId} onChange={(e) => escolherSemana(e.target.value)}>
                  <option value="">Selecione...</option>
                  {semanasComEstoque.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.semanaInicio} → {c.semanaFim} ({c.disponiveis.length} disponíveis)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Comprador">
                <input className={inputCls} style={inputStyle} value={form.comprador} onChange={(e) => setForm((f) => ({ ...f, comprador: e.target.value }))} />
              </Field>
              <Field label="Data da entrega">
                <input type="date" className={inputCls} style={inputStyle} value={form.dataEntrega} onChange={(e) => setForm((f) => ({ ...f, dataEntrega: e.target.value }))} />
              </Field>
              <Field label="Prazo de pagamento">
                <input type="date" className={inputCls} style={inputStyle} value={form.prazo} onChange={(e) => setForm((f) => ({ ...f, prazo: e.target.value }))} />
              </Field>
              <Field label="Preço combinado (R$/kg)">
                <input type="number" step="0.01" className={inputCls} style={inputStyle} value={form.precoKgEntrega} onChange={(e) => setForm((f) => ({ ...f, precoKgEntrega: e.target.value }))} />
              </Field>
            </div>

            {form.colheitaId && (
              <>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: PALETTE.textDim }}>
                  Marque os baldes enviados a este comprador
                </p>
                <div className="space-y-1 max-h-56 overflow-auto mb-3">
                  {baldesDisponiveis.map((b) => {
                    const marcado = selecionados.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 text-sm rounded-md px-3 py-1.5 cursor-pointer"
                        style={{ background: marcado ? PALETTE.cascaSoft : PALETTE.bg }}
                      >
                        <input type="checkbox" checked={marcado} onChange={() => toggleBalde(b.id)} />
                        <span style={{ color: PALETTE.text }}>
                          Balde {String(b.numero).padStart(3, "0")} — {kg(b.peso)} kg
                        </span>
                      </label>
                    );
                  })}
                </div>
                <ResumoBaldes totalBaldes={selecionados.length} totalKg={totalKgAtual} valor={valorAtual} mostrarValor />
              </>
            )}

            <Btn onClick={add} disabled={!form.comprador || selecionados.length === 0} className="mt-4 w-full">
              <Plus size={16} /> Registrar entrega
            </Btn>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="A receber"><p className="text-xl font-bold" style={{ color: PALETTE.danger }}>{money(totalReceber)}</p></Card>
        <Card title="Recebido"><p className="text-xl font-bold" style={{ color: PALETTE.ok }}>{money(totalRecebido)}</p></Card>
      </div>

      <Card title="Entregas">
        {entregas.length === 0 && <p style={{ color: PALETTE.textDim }} className="text-sm">Nenhuma entrega registrada.</p>}
        <div className="space-y-2">
          {entregas.slice().reverse().map((e) => {
            const baldesResolvidos = resolverBaldesDaEntrega(e, colheitas);
            const kgEntrega = baldesResolvidos.reduce((s, b) => s + b.peso, 0);
            const aberta = entregaAberta === e.id;
            return (
              <div key={e.id} className="rounded-lg overflow-hidden" style={{ background: PALETTE.bg }}>
                <button onClick={() => setEntregaAberta(aberta ? null : e.id)} className="w-full text-left px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium" style={{ color: PALETTE.text }}>{e.comprador}</p>
                    <ChevronRight size={16} style={{ color: PALETTE.textDim, transform: aberta ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                  </div>
                  <p className="text-xs" style={{ color: PALETTE.textDim }}>
                    {baldesResolvidos.length} baldes · {kg(kgEntrega)} kg · {money(e.valor)} · entregue em {e.dataEntrega} {e.prazo && `· prazo ${e.prazo}`}
                  </p>
                </button>

                {aberta && (
                  <div className="px-3 pb-3">
                    <div className="space-y-1 max-h-48 overflow-auto mb-3">
                      {baldesResolvidos.map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-sm rounded-md px-3 py-1.5" style={{ background: PALETTE.card }}>
                          <span style={{ color: PALETTE.text }}>Balde {String(b.numero).padStart(3, "0")}</span>
                          <span style={{ color: PALETTE.text }}>{kg(b.peso)} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <p style={{ color: PALETTE.textDim }}>Preço por kg: <span style={{ color: PALETTE.text }}>{money(e.precoKgEntrega)}</span></p>
                      <p style={{ color: PALETTE.textDim }}>Valor total: <span className="font-semibold" style={{ color: PALETTE.polpaDark }}>{money(e.valor)}</span></p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => togglePago(e.id)}
                        className="text-xs px-2 py-1 rounded-md inline-flex items-center gap-1"
                        style={{ background: e.pago ? PALETTE.okSoft : PALETTE.dangerSoft, color: e.pago ? PALETTE.ok : PALETTE.danger }}
                      >
                        {e.pago ? <Check size={12} /> : <X size={12} />} {e.pago ? "Pago" : "Pendente — marcar como pago"}
                      </button>
                      <Btn variant="secondary" onClick={() => setRelatorioEntregaId(e.id)}>
                        <FileText size={14} /> Gerar Relatório
                      </Btn>
                      <Btn variant="danger" onClick={() => remover(e.id)}>
                        <Trash2 size={14} /> Excluir
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {entregaParaRelatorio && (
        <RelatorioComprador
          comprador={entregaParaRelatorio.comprador}
          entregas={[{ ...entregaParaRelatorio, baldesResolvidos: resolverBaldesDaEntrega(entregaParaRelatorio, colheitas) }]}
          onClose={() => setRelatorioEntregaId(null)}
        />
      )}
    </div>
  );
}

// ---------- DASHBOARD ----------
function Dashboard({ colheitas, precoKg, pagamentosEder, energia, quimicos, entregas }) {
  const totalKg = colheitas.reduce((s, c) => s + c.baldes.reduce((a, b) => a + b.peso, 0), 0);
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
        <Card title="Produção total"><p className="text-xl font-bold" style={{ color: PALETTE.text }}>{kg(totalKg)} kg</p><p className="text-xs" style={{ color: PALETTE.textDim }}>{money(producaoValor)} ao preço atual</p></Card>
        <Card title="Despesas totais"><p className="text-xl font-bold" style={{ color: PALETTE.danger }}>{money(totalDespesas)}</p><p className="text-xs" style={{ color: PALETTE.textDim }}>Eder + energia + químicos</p></Card>
        <Card title="Recebido de entregas"><p className="text-xl font-bold" style={{ color: PALETTE.ok }}>{money(totalRecebido)}</p></Card>
        <Card title="A receber"><p className="text-xl font-bold" style={{ color: PALETTE.polpaDark }}>{money(aReceber)}</p></Card>
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
              <option value="funcionario">Funcionário (só vê o Painel)</option>
              <option value="admin">Dono (acesso total)</option>
            </select>
          </Field>
        </div>
        <Btn onClick={add} className="mt-3"><Plus size={16} /> Criar usuário</Btn>
      </Card>
      <Card title="Usuários cadastrados">
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.username} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: PALETTE.bg }}>
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

// Converte colheitas do formato antigo (baldes = array de números) para o novo
// formato (baldes = array de objetos com id/status). Baldes migrados entram
// como "Em estoque" por padrão — o sistema antigo não guardava essa informação.
function migrarColheitas(raw) {
  let mudou = false;
  const next = raw.map((c) => {
    if (c.baldes.length > 0 && typeof c.baldes[0] === "number") {
      mudou = true;
      return {
        ...c,
        baldes: c.baldes.map((peso, i) => ({
          id: uid(),
          numero: i + 1,
          peso,
          status: "estoque",
          entregaId: null,
        })),
      };
    }
    return c;
  });
  return { next, mudou };
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
      const colheitasSalvas = await loadShared("colheitas", []);
      const { next: colheitasMigradas, mudou } = migrarColheitas(colheitasSalvas);
      if (mudou) await saveShared("colheitas", colheitasMigradas);
      setColheitas(colheitasMigradas);
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

  // Funcionário: acesso somente ao Painel, em modo de visualização.
  const tabsAdmin = [
    { key: "dashboard", label: "Painel", icon: TrendingUp },
    { key: "colheita", label: "Colheita", icon: Package },
    { key: "entregas", label: "Entregas", icon: Package },
    { key: "eder", label: "Pagamentos Eder", icon: Wallet },
    { key: "energia", label: "Energia", icon: Zap },
    { key: "quimicos", label: "Químicos", icon: FlaskConical },
    { key: "usuarios", label: "Usuários", icon: Users },
  ];
  const tabsFuncionario = [{ key: "dashboard", label: "Painel", icon: TrendingUp }];
  const tabs = isAdmin ? tabsAdmin : tabsFuncionario;

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <header className="flex items-center justify-between px-5 py-4 border-b" style={{ background: PALETTE.card, borderColor: PALETTE.cardBorder }}>
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

      <nav className="flex gap-2 px-5 py-3 overflow-x-auto border-b" style={{ background: PALETTE.card, borderColor: PALETTE.cardBorder }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition"
            style={{
              background: tab === t.key ? PALETTE.polpa : "transparent",
              color: tab === t.key ? PALETTE.polpaText : PALETTE.textDim,
              border: `1px solid ${tab === t.key ? PALETTE.polpa : PALETTE.cardBorder}`,
            }}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </nav>

      <main className="p-5 max-w-2xl mx-auto">
        {tab === "dashboard" && (
          <Dashboard colheitas={colheitas} precoKg={precoKg} pagamentosEder={pagamentosEder} energia={energia} quimicos={quimicos} entregas={entregas} />
        )}
        {tab === "colheita" && isAdmin && (
          <ColheitaTab colheitas={colheitas} setColheitas={setColheitas} precoKg={precoKg} setPrecoKg={setPrecoKg} isAdmin={isAdmin} currentUser={currentUser} />
        )}
        {tab === "entregas" && isAdmin && (
          <EntregasTab
            colheitas={colheitas}
            setColheitas={setColheitas}
            entregas={entregas}
            setEntregas={setEntregas}
            isAdmin={isAdmin}
            precoKg={precoKg}
          />
        )}
        {tab === "eder" && isAdmin && (
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
        {tab === "energia" && isAdmin && (
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
        {tab === "quimicos" && isAdmin && (
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
