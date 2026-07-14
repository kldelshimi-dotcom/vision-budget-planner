import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Plus, Wallet, Landmark, TrendingDown, Trash2, Vault, Eye, EyeOff } from "lucide-react";
import { useBudget } from "@/lib/budget-store";
import type { MacroGroup, Category, Transaction } from "@/lib/budget-data";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const MONTHS_IT = [
  "GENNAIO", "FEBBRAIO", "MARZO", "APRILE", "MAGGIO", "GIUGNO",
  "LUGLIO", "AGOSTO", "SETTEMBRE", "OTTOBRE", "NOVEMBRE", "DICEMBRE",
];

const fmt = (n: number) =>
  "€ " + n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const GROUPS: MacroGroup[] = ["Necessità", "Varie", "Spese annuali", "Risparmi/Investimenti"];

function Dashboard() {
  const {
    month, categories, transactions, incomes,
    cashOnHand, bank, owed,
    addTransaction, deleteTransaction, addIncome, deleteIncome,
    updateCategoryBudget, setBalances,
  } = useBudget();

  const [tab, setTab] = useState<"panoramica" | "movimenti" | "budget">("panoramica");
  const [hideAmount, setHideAmount] = useState(false);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${MONTHS_IT[m - 1]} ${y}`;

  const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  const spentByCat = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return map;
  }, [transactions]);

  const totalSpent = transactions.reduce((s, t) => s + t.amount, 0);
  const remaining = totalBudget - totalSpent;

  const groupTotals = GROUPS.map((g) => {
    const cats = categories.filter((c) => c.group === g);
    const budget = cats.reduce((s, c) => s + c.budget, 0);
    const spent = cats.reduce((s, c) => s + (spentByCat.get(c.name) ?? 0), 0);
    return { group: g, budget, spent, pct: totalBudget ? (budget / totalBudget) * 100 : 0 };
  });

  const donutData = categories
    .map((c) => ({ name: c.name, value: c.budget, color: c.color }))
    .filter((d) => d.value > 0);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => map.set(t.date, (map.get(t.date) ?? 0) + t.amount));
    const daysInMonth = new Date(y, m, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = String(i + 1).padStart(2, "0");
      const key = `${y}-${String(m).padStart(2, "0")}-${d}`;
      return { day: `${d}/${String(m).padStart(2, "0")}`, amount: map.get(key) ?? 0 };
    });
  }, [transactions, y, m]);

  return (
    <div className="min-h-screen text-foreground pb-24 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 pt-5 pb-3 flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-1">Budget Tracker</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient text-center">
            {monthLabel}
          </h1>
        </div>
        <nav className="max-w-6xl mx-auto px-4 pb-2">
          <div className="glass-card rounded-full p-1 flex gap-1">
            {(["panoramica", "movimenti", "budget"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-3 py-1.5 text-[10px] md:text-xs font-semibold capitalize rounded-full transition-all ${
                  tab === t
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-6">
        {tab === "panoramica" && (
          <>
            {/* HERO SUMMARY */}
            <section className="animate-fade-in">
              <div className="glass-card rounded-3xl p-4 md:p-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
                <div className="relative">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Rimanente questo mese</div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-3xl md:text-4xl font-bold text-gradient font-display">
                      {hideAmount ? "€ ••••••••" : fmt(remaining)}
                    </div>
                    <button
                      onClick={() => setHideAmount((v) => !v)}
                      aria-label={hideAmount ? "Mostra saldo" : "Nascondi saldo"}
                      aria-pressed={hideAmount}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {hideAmount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <div className="text-xs text-muted-foreground">
                      su <span className="text-foreground/80 font-semibold">{fmt(totalBudget)}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, totalBudget ? (totalSpent / totalBudget) * 100 : 0)}%`,
                        background: "var(--gradient-primary)",
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                    <span>Speso <span className="text-destructive font-semibold">{fmt(totalSpent)}</span></span>
                    <span>{totalBudget ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <MiniStat label="Budget" value={fmt(totalBudget)} />
                <MiniStat label="Speso" value={fmt(totalSpent)} tone="destructive" />
                <MiniStat label="Entrate" value={fmt(totalIncome)} tone="primary" />
              </div>
            </section>

            {/* WALLETS */}
            <section>
              <SectionTitle>Portafoglio</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <BalanceInput icon={<Wallet className="w-4 h-4" />} label="Contanti" value={cashOnHand} onChange={(v) => setBalances({ cashOnHand: v })} />
                <BalanceInput icon={<Landmark className="w-4 h-4" />} label="In banca" value={bank} onChange={(v) => setBalances({ bank: v })} />
                <BalanceInput icon={<TrendingDown className="w-4 h-4" />} label="Soldi in meno" value={owed} onChange={(v) => setBalances({ owed: v })} />
              </div>

              <div className="mt-3 glass-card rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                  <Vault className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Totale disponibile</div>
                  <div className="text-xl font-bold text-gradient">{fmt(cashOnHand + bank - owed)}</div>
                </div>
              </div>
            </section>

            {/* ENTRATE */}
            <section>
              <SectionTitle>Entrate</SectionTitle>
              <div className="glass-card rounded-2xl overflow-hidden">
                {incomes.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                      +
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{i.source}</div>
                      <div className="text-[10px] text-muted-foreground">{i.date}</div>
                    </div>
                    <div className="font-bold text-primary text-sm">{fmt(i.amount)}</div>
                    <button onClick={() => deleteIncome(i.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <AddIncomeRow onAdd={addIncome} defaultDate={`${month}-01`} />
                <div className="flex items-center px-4 py-3 border-t border-white/5" style={{ background: "linear-gradient(90deg, transparent, oklch(0.88 0.22 140 / 0.08))" }}>
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Totale</span>
                  <span className="ml-auto font-bold text-primary text-base">{fmt(totalIncome)}</span>
                </div>
              </div>
            </section>

            {/* BUDGET DONUT */}
            <section>
              <SectionTitle>Distribuzione budget</SectionTitle>
              <div className="glass-card rounded-2xl p-4">
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Totale</div>
                    <div className="text-xl font-bold text-gradient">{fmt(totalBudget)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{categories.length} categorie</div>
                  </div>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        stroke="oklch(0.14 0.015 160)"
                        strokeWidth={2}
                      >
                        {donutData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "oklch(0.19 0.02 165)", border: "1px solid oklch(0.28 0.02 160)", borderRadius: 12, backdropFilter: "blur(10px)" }}
                        formatter={(v: number, n) => [fmt(v), n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {donutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}80` }} />
                      <span className="text-muted-foreground truncate">{d.name}</span>
                      <span className="ml-auto text-foreground/90 font-semibold">
                        {((d.value / totalBudget) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* MACRO GROUPS */}
            <section>
              <SectionTitle>Macro categorie</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupTotals.map((g) => {
                  const pct = g.budget ? (g.spent / g.budget) * 100 : 0;
                  const over = g.spent > g.budget;
                  return (
                    <div key={g.group} className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" style={{ background: "var(--gradient-primary)" }} />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{g.group}</div>
                            <div className="text-xl font-bold text-gradient font-display">{fmt(g.budget)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground">del totale</div>
                            <div className="text-xs font-semibold text-foreground/80">{g.pct.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="text-muted-foreground">Speso</span>
                          <span className={over ? "text-destructive font-semibold" : "text-foreground/80 font-semibold"}>{fmt(g.spent)}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              background: over ? "var(--color-destructive)" : "var(--gradient-primary)",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* DAILY CHART */}
            <section>
              <SectionTitle>Spese giornaliere</SectionTitle>
              <div className="glass-card rounded-2xl p-4 h-64">
                <ResponsiveContainer>
                  <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.95 0.24 135)" stopOpacity={1} />
                        <stop offset="100%" stopColor="oklch(0.6 0.18 155)" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "oklch(0.68 0.02 160)", fontSize: 9 }} angle={-45} textAnchor="end" interval={1} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "oklch(0.68 0.02 160)", fontSize: 9 }} tickFormatter={(v) => `€${v}`} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "oklch(1 0 0 / 0.05)" }}
                      contentStyle={{ background: "oklch(0.19 0.02 165)", border: "1px solid oklch(0.28 0.02 160)", borderRadius: 12 }}
                      formatter={(v: number) => [fmt(v), "Speso"]}
                    />
                    <Bar dataKey="amount" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {tab === "movimenti" && (
          <MovimentiTab
            transactions={transactions}
            categories={categories.map((c) => c.name)}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            defaultDate={`${month}-01`}
          />
        )}

        {tab === "budget" && (
          <BudgetTab
            categories={categories}
            spentByCat={spentByCat}
            onUpdate={updateCategoryBudget}
          />
        )}
      </main>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-0.5 h-4 rounded-full" style={{ background: "var(--gradient-primary)" }} />
      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-foreground/90 font-display">{children}</h2>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "primary" | "destructive" }) {
  const color = tone === "destructive" ? "text-destructive" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm md:text-base font-bold font-display ${color}`}>{value}</div>
    </div>
  );
}

function BalanceInput({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="glass-card rounded-2xl p-3 flex items-center gap-3 hover:border-primary/30 transition-colors cursor-text group">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-muted-foreground text-xs">€</span>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-full bg-transparent text-base font-bold font-display outline-none focus:text-primary"
          />
        </div>
      </div>
    </label>
  );
}

function AddIncomeRow({ onAdd, defaultDate }: { onAdd: (i: { source: string; amount: number; date: string }) => void; defaultDate: string }) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white/[0.02] border-t border-white/5">
      <input placeholder="Fonte" value={source} onChange={(e) => setSource(e.target.value)} className="flex-1 min-w-[120px] bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50" />
      <input type="number" placeholder="€" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-24 bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50" />
      <button
        onClick={() => {
          const n = parseFloat(amount);
          if (source && n > 0) {
            onAdd({ source, amount: n, date });
            setSource(""); setAmount("");
          }
        }}
        className="rounded-lg p-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        style={{ background: "var(--gradient-primary)", color: "var(--color-primary-foreground)" }}
        aria-label="Aggiungi entrata"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function MovimentiTab({
  transactions, categories, onAdd, onDelete, defaultDate,
}: {
  transactions: Transaction[];
  categories: string[];
  onAdd: (t: { date: string; amount: number; description: string; category: string; note?: string }) => void;
  onDelete: (id: string) => void;
  defaultDate: string;
}) {
  const [date, setDate] = useState(defaultDate);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-5 animate-fade-in">
      <section>
        <SectionTitle>Nuovo movimento</SectionTitle>
        <div className="glass-card rounded-2xl p-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50 col-span-1" />
          <input type="number" placeholder="Importo €" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50 col-span-1" />
          <input placeholder="Descrizione" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50 col-span-2" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-input/60 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50 col-span-2 md:col-span-1">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => {
              const n = parseFloat(amount);
              if (n > 0) {
                onAdd({ date, amount: n, description, category });
                setAmount(""); setDescription("");
              }
            }}
            className="rounded-lg px-3 py-2 text-xs font-bold hover:opacity-90 col-span-2 md:col-span-5 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-opacity"
            style={{ background: "var(--gradient-primary)", color: "var(--color-primary-foreground)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Aggiungi movimento
          </button>
        </div>
      </section>

      <section>
        <SectionTitle>Movimenti · {transactions.length}</SectionTitle>
        <div className="glass-card rounded-2xl overflow-hidden">
          {sorted.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-2.5 border-b border-white/5 last:border-0 transition-colors ${
                t.highlight ? "bg-highlight/20 border-l-4 border-l-highlight" : "hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/5 flex-shrink-0">
                <div className="text-[9px] text-muted-foreground uppercase">{t.date.slice(5, 7) === "07" ? "LUG" : t.date.slice(5, 7)}</div>
                <div className="text-xs font-bold">{t.date.slice(8, 10)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-xs">{t.description || t.category}</div>
                <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">{t.category}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-destructive font-display text-xs">−{fmt(t.amount)}</div>
              </div>
              <button onClick={() => onDelete(t.id)} className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs">Nessun movimento</div>
          )}
        </div>
      </section>
    </div>
  );
}

function BudgetTab({
  categories, spentByCat, onUpdate,
}: {
  categories: Category[];
  spentByCat: Map<string, number>;
  onUpdate: (name: string, budget: number) => void;
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      {GROUPS.map((g) => {
        const cats = categories.filter((c) => c.group === g);
        const budget = cats.reduce((s, c) => s + c.budget, 0);
        const spent = cats.reduce((s, c) => s + (spentByCat.get(c.name) ?? 0), 0);
        const groupPct = budget ? (spent / budget) * 100 : 0;
        return (
          <section key={g}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Gruppo</div>
                <h2 className="text-2xl font-bold font-display text-gradient">{g}</h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Speso / Budget</div>
                <div className="text-sm">
                  <span className="text-foreground font-bold">{fmt(spent)}</span>
                  <span className="text-muted-foreground"> / {fmt(budget)}</span>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="h-1 bg-white/5">
                <div className="h-full transition-all" style={{ width: `${Math.min(100, groupPct)}%`, background: "var(--gradient-primary)" }} />
              </div>
              {cats.map((c) => {
                const s = spentByCat.get(c.name) ?? 0;
                const diff = c.budget - s;
                const pct = c.budget ? Math.min(100, (s / c.budget) * 100) : 0;
                const over = s > c.budget;
                return (
                  <div key={c.name} className="px-4 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: c.color, boxShadow: `0 0 12px ${c.color}60` }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmt(s)} spesi · <span className={over ? "text-destructive" : "text-primary"}>{over ? "Sforato" : `${fmt(diff)} rimasti`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-input/50 rounded-lg px-2 py-1">
                        <span className="text-xs text-muted-foreground">€</span>
                        <input
                          type="number"
                          value={c.budget}
                          onChange={(e) => onUpdate(c.name, Number(e.target.value) || 0)}
                          className="w-16 bg-transparent text-sm font-bold text-right outline-none focus:text-primary"
                        />
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden ml-11">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: over ? "var(--color-destructive)" : "var(--gradient-primary)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
