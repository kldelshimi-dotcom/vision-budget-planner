import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Plus, Wallet, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronDown, Highlighter, ArrowUpDown, X, Pencil, Check } from "lucide-react";
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

function shiftMonth(current: string, delta: number): string {
  const [y, m] = current.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function Dashboard() {
  const {
    month, categories, transactions, incomes,
    cashOnHand, bank,
    addTransaction, deleteTransaction, updateTransaction, addIncome, deleteIncome,
    updateCategoryBudget, setBalances, setMonth,
  } = useBudget();

  const [tab, setTab] = useState<"panoramica" | "movimenti" | "budget">("panoramica");
  const [hideAmount, setHideAmount] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (g: string) => setExpandedGroups((s) => ({ ...s, [g]: !s[g] }));

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

  const spentDonutData = categories
    .map((c) => ({ name: c.name, value: spentByCat.get(c.name) ?? 0, color: c.color }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

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
          <div className="flex items-center justify-center gap-1 md:gap-2">
            <button
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Mese precedente"
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <ChevronLeft className="w-7 h-7 md:w-8 md:h-8" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient text-center min-w-[150px] md:min-w-[200px]">
              {monthLabel}
            </h1>
            <button
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Mese successivo"
              className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <ChevronRight className="w-7 h-7 md:w-8 md:h-8" />
            </button>
          </div>
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
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Rimanente questo mese</div>
                  <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
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
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, totalBudget ? (totalSpent / totalBudget) * 100 : 0)}%`,
                        background: "var(--gradient-primary)",
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
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
              <div className="grid grid-cols-2 gap-3">
                <BanknoteInput value={cashOnHand} onChange={(v) => setBalances({ cashOnHand: v })} />
                <CreditCardInput value={bank} onChange={(v) => setBalances({ bank: v })} />
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
                <div className="flex items-center px-4 py-3 border-t border-white/5" style={{ background: "linear-gradient(90deg, transparent, oklch(0.75 0.18 152 / 0.08))" }}>
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Totale</span>
                  <span className="ml-auto font-bold text-primary text-base">{fmt(totalIncome)}</span>
                </div>
              </div>
            </section>

            {/* SPENT DONUT */}
            <section>
              <SectionTitle>Spese per categoria</SectionTitle>
              <div className="glass-card rounded-2xl p-4">
                <div className="h-64 relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Speso</div>
                    <div className="text-xl font-bold text-gradient">{fmt(totalSpent)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{spentDonutData.length} categorie</div>
                  </div>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={spentDonutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        stroke="oklch(0.14 0.015 160)"
                        strokeWidth={2}
                      >
                        {spentDonutData.map((d) => (
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
                  {spentDonutData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}80` }} />
                      <span className="text-muted-foreground truncate">{d.name}</span>
                      <span className="ml-auto text-foreground/90 font-semibold">
                        {((d.value / totalSpent) * 100).toFixed(1)}%
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
                  const isOpen = !!expandedGroups[g.group];
                  const groupCats = categories.filter((c) => c.group === g.group);
                  return (
                    <div key={g.group} className="glass-card rounded-2xl p-4 relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" style={{ background: "var(--gradient-primary)" }} />
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.group)}
                        aria-expanded={isOpen}
                        className="relative w-full text-left focus:outline-none"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{g.group}</div>
                            <div className="text-xl font-bold text-gradient font-display">{fmt(g.budget)}</div>
                          </div>
                          <div className="text-right flex items-start gap-1.5">
                            <div>
                              <div className="text-[10px] text-muted-foreground">del totale</div>
                              <div className="text-xs font-semibold text-foreground/80">{g.pct.toFixed(1)}%</div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform mt-1 ${isOpen ? "rotate-180" : ""}`} />
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
                      </button>
                      {isOpen && (
                        <div className="relative mt-3 pt-3 border-t border-white/5 space-y-2">
                          {groupCats.map((c) => {
                            const catSpent = spentByCat.get(c.name) ?? 0;
                            const catRemaining = c.budget - catSpent;
                            const catPct = c.budget ? (catSpent / c.budget) * 100 : 0;
                            const catOver = catSpent > c.budget;
                            return (
                              <div key={c.name}>
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                                    <span className="text-foreground/90 truncate">{c.name}</span>
                                  </div>
                                  <div className="text-right shrink-0 ml-2">
                                    <span className={catOver ? "text-destructive font-semibold" : "text-foreground/80 font-semibold"}>{fmt(catSpent)}</span>
                                    <span className="text-muted-foreground"> / {fmt(c.budget)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="text-muted-foreground">Rimanente</span>
                                  <span className={catRemaining < 0 ? "text-destructive font-semibold" : "text-primary font-semibold"}>{fmt(catRemaining)}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, catPct)}%`,
                                      background: catOver ? "var(--color-destructive)" : c.color,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
                        <stop offset="0%" stopColor="oklch(0.75 0.18 152)" stopOpacity={1} />
                        <stop offset="100%" stopColor="oklch(0.78 0.15 210)" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "oklch(0.78 0.01 260)", fontSize: 9 }} angle={-45} textAnchor="end" interval={1} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "oklch(0.78 0.01 260)", fontSize: 9 }} tickFormatter={(v) => `€${v}`} axisLine={false} tickLine={false} />
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
            onUpdate={updateTransaction}
            month={month}
          />
        )}

        {tab === "budget" && (
          <BudgetTab
            categories={categories}
            spentByCat={spentByCat}
            onUpdate={updateCategoryBudget}
            totalBudget={totalBudget}
            donutData={donutData}
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

function BanknoteInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl cursor-text" style={{ aspectRatio: "1.58 / 1" }}>
      <div
        className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.38 0.008 260) 0%, oklch(0.30 0.005 260) 45%, oklch(0.22 0.004 260) 100%)",
          boxShadow:
            "0 14px 34px -12px oklch(0 0 0 / 0.7), inset 0 0 0 1px oklch(1 0 0 / 0.14), inset 0 1px 0 oklch(1 0 0 / 0.10)",
        }}
      >
        {/* Outer ornamental frame */}
        <div
          className="absolute inset-2 rounded-xl pointer-events-none"
          style={{
            border: "1.5px solid oklch(0.65 0.01 80 / 0.65)",
            boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.25), 0 0 0 1px oklch(0 0 0 / 0.25)",
          }}
        />
        {/* Inner dashed frame */}
        <div
          className="absolute inset-3 rounded-lg pointer-events-none"
          style={{
            border: "1px dashed oklch(0.70 0.01 80 / 0.55)",
          }}
        />
        {/* Corner rosettes */}
        {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos) => (
          <div
            key={pos}
            className={`absolute ${pos} w-7 h-7 rounded-full pointer-events-none`}
            style={{
              background:
                "radial-gradient(circle, oklch(0.60 0.01 80 / 0.95) 0%, oklch(0.45 0.008 80 / 0.75) 50%, transparent 72%)",
              boxShadow: "inset 0 0 0 1px oklch(0.70 0.01 80 / 0.6)",
            }}
          />
        ))}
        {/* Guilloché / mesh pattern */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 6px, oklch(1 0 0 / 0.05) 6px, oklch(1 0 0 / 0.05) 7px), repeating-linear-gradient(-45deg, transparent, transparent 10px, oklch(1 0 0 / 0.04) 10px, oklch(1 0 0 / 0.04) 11px)",
          }}
        />
        {/* Holographic security strip */}
        <div
          className="absolute top-0 bottom-0 left-[18%] w-2 opacity-60 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, oklch(0.72 0.12 150 / 0.35) 30%, oklch(0.78 0.1 200 / 0.30) 60%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span
              className="text-[9px] uppercase tracking-[0.3em] font-display font-bold"
              style={{ color: "oklch(0.88 0.01 80 / 1)" }}
            >
              Contanti
            </span>
            <Wallet className="w-4 h-4" style={{ color: "oklch(0.82 0.01 80 / 0.95)" }} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-display" style={{ color: "oklch(0.88 0.01 80 / 0.95)" }}>
              €
            </span>
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value) || 0)}
              className="w-full bg-transparent text-2xl md:text-3xl font-bold font-display outline-none"
              style={{ color: "oklch(1 0 0 / 1)", textShadow: "0 1px 3px oklch(0 0 0 / 0.5)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CreditCardInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl cursor-text" style={{ aspectRatio: "1.58 / 1" }}>
      <div
        className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.02]"
        style={{
          background: "linear-gradient(135deg, oklch(0.12 0.005 260), oklch(0.08 0.003 260))",
          boxShadow: "0 12px 30px -12px oklch(0 0 0 / 0.7), inset 0 0 0 1px oklch(1 0 0 / 0.08)",
        }}
      >
        {/* Subtle holographic sheen */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.75 0.18 152 / 0.15) 0%, transparent 30%, oklch(0.78 0.15 210 / 0.12) 60%, transparent 80%)",
          }}
        />
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              {/* EMV chip */}
              <div
                className="w-8 h-6 rounded-[3px]"
                style={{
                  background: "linear-gradient(135deg, oklch(0.8 0.1 85), oklch(0.7 0.09 85), oklch(0.85 0.08 85))",
                  boxShadow: "inset 0 0 0 1px oklch(0 0 0 / 0.3)",
                }}
              />
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/70 font-display font-bold mt-1">In banca</span>
            </div>
            {/* American Express style logo */}
            <div className="text-right">
              <div className="text-[7px] uppercase tracking-[0.2em] text-white/50 font-display">American</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/90 font-display font-bold leading-tight">Express</div>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-white/60 text-sm font-display">€</span>
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value) || 0)}
              className="w-full bg-transparent text-2xl md:text-3xl font-bold font-display text-white outline-none focus:text-white/90"
            />
          </div>
        </div>
      </div>
    </div>
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
  transactions, categories, onAdd, onDelete, onUpdate, month,
}: {
  transactions: Transaction[];
  categories: string[];
  onAdd: (t: { date: string; amount: number; description: string; category: string; note?: string }) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  month: string;
}) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today = new Date();
  const initialDay = Math.min(today.getDate(), daysInMonth);

  const [day, setDay] = useState(initialDay);
  useEffect(() => {
    setDay(initialDay);
  }, [month, initialDay]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterHighlighted, setFilterHighlighted] = useState(false);

  const [sortKey, setSortKey] = useState<"date" | "category" | "highlight">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [confirmDelete, setConfirmDelete] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const filtered = transactions.filter((t) => {
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterDate && t.date !== filterDate) return false;
    if (filterHighlighted && !t.highlight) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "date") return a.date.localeCompare(b.date) * dir;
    if (sortKey === "category") return a.category.localeCompare(b.category) * dir;
    return ((a.highlight ? 1 : 0) - (b.highlight ? 1 : 0)) * dir;
  });

  const activeFilters = (filterCategory ? 1 : 0) + (filterDate ? 1 : 0) + (filterHighlighted ? 1 : 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <section>
        <SectionTitle>Nuovo movimento</SectionTitle>
        <div className="glass-card rounded-2xl p-2.5 flex flex-wrap gap-1.5 items-center">
          <div className="flex items-center gap-1.5 bg-input/60 rounded-md px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground uppercase">{MONTHS_IT[m - 1]} {y}</span>
            <input
              type="number"
              min={1}
              max={daysInMonth}
              value={day}
              onChange={(e) => {
                const val = Number(e.target.value) || 1;
                setDay(Math.min(daysInMonth, Math.max(1, val)));
              }}
              className="w-10 bg-transparent text-[11px] outline-none focus:ring-1 focus:ring-primary/50 text-center"
            />
          </div>
          <input type="number" placeholder="€" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 w-[70px]" />
          <input placeholder="Descrizione" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-[100px]" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 flex-1 min-w-[100px]">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => {
              const n = parseFloat(amount);
              if (n > 0) {
                onAdd({ date: `${month}-${String(day).padStart(2, "0")}`, amount: n, description, category });
                setAmount(""); setDescription("");
              }
            }}
            className="rounded-md px-2.5 py-1.5 text-[11px] font-bold hover:opacity-90 flex items-center gap-1 shadow-md shadow-primary/25"
            style={{ background: "var(--gradient-primary)", color: "var(--color-primary-foreground)" }}
          >
            <Plus className="w-3 h-3" /> Aggiungi
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2 gap-2">
          <SectionTitle>Movimenti · {sorted.length}{activeFilters > 0 && <span className="text-primary"> (filtrati)</span>}</SectionTitle>
          <div className="flex items-center gap-1 bg-white/5 rounded-md px-1.5 py-1">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as "date" | "category" | "highlight")}
              className="bg-transparent text-[10px] outline-none"
            >
              <option value="date">Data</option>
              <option value="category">Categoria</option>
              <option value="highlight">Evidenziati</option>
            </select>
            <button
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              className="text-[10px] text-muted-foreground hover:text-foreground px-1"
              aria-label="Inverti direzione"
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-2.5 mb-2 flex flex-wrap gap-1.5 items-center">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none flex-1 min-w-[110px]">
            <option value="">Tutte le categorie</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none w-[130px]" placeholder="Data" />
          <button
            onClick={() => setFilterHighlighted((v) => !v)}
            className={`text-[10px] px-2 py-1.5 rounded-md flex items-center gap-1 ${filterHighlighted ? "bg-highlight/30 text-highlight" : "bg-white/5 hover:bg-white/10"}`}
          >
            <Highlighter className={`w-3 h-3 ${filterHighlighted ? "" : ""}`} /> Evidenziati
          </button>
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterCategory(""); setFilterDate(""); setFilterHighlighted(false); }}
              className="text-[10px] px-2 py-1.5 rounded-md bg-white/5 hover:bg-destructive/20 flex items-center gap-1 text-muted-foreground"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          {sorted.map((t) => (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0 transition-colors ${
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
              <button
                onClick={() => onUpdate(t.id, { highlight: !t.highlight })}
                className={`p-1 rounded-md hover:bg-white/10 ${t.highlight ? "text-highlight" : "text-muted-foreground hover:text-highlight"}`}
                aria-label="Evidenzia"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditTx(t)}
                className="text-muted-foreground hover:text-primary p-1 rounded-md hover:bg-white/10"
                aria-label="Modifica"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirmDelete(t)} className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs">Nessun movimento</div>
          )}
        </div>
      </section>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="glass-card rounded-2xl p-5 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-sm mb-1">Eliminare questo movimento?</h3>
              <p className="text-xs text-muted-foreground">
                {confirmDelete.description || confirmDelete.category} · <span className="text-destructive font-semibold">−{fmt(confirmDelete.amount)}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">L'operazione non può essere annullata.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10"
              >
                Annulla
              </button>
              <button
                onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-destructive text-destructive-foreground hover:opacity-90 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Elimina
              </button>
            </div>
          </div>
        </div>
      )}

      {editTx && (
        <EditTransactionModal
          tx={editTx}
          categories={categories}
          onClose={() => setEditTx(null)}
          onSave={(patch) => { onUpdate(editTx.id, patch); setEditTx(null); }}
        />
      )}
    </div>
  );
}

function EditTransactionModal({
  tx, categories, onClose, onSave,
}: {
  tx: Transaction;
  categories: string[];
  onClose: () => void;
  onSave: (patch: Partial<Transaction>) => void;
}) {
  const [amount, setAmount] = useState(String(tx.amount));
  const [description, setDescription] = useState(tx.description ?? "");
  const [category, setCategory] = useState(tx.category);
  const [date, setDate] = useState(tx.date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl p-5 max-w-sm w-full space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-sm">Modifica movimento</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 flex-1"
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 w-[90px]"
              placeholder="€"
            />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 w-full"
            placeholder="Descrizione"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-input/60 rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary/50 w-full"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 rounded-md text-xs bg-white/5 hover:bg-white/10">
            Annulla
          </button>
          <button
            onClick={() => {
              const n = parseFloat(amount);
              if (!isFinite(n) || n <= 0) return;
              onSave({ amount: n, description, category, date });
            }}
            className="px-3 py-1.5 rounded-md text-xs font-bold hover:opacity-90 flex items-center gap-1 shadow-md shadow-primary/25"
            style={{ background: "var(--gradient-primary)", color: "var(--color-primary-foreground)" }}
          >
            <Check className="w-3 h-3" /> Salva
          </button>
        </div>
      </div>
    </div>
  );
}

function BudgetTab({
  categories, spentByCat, onUpdate, totalBudget, donutData,
}: {
  categories: Category[];
  spentByCat: Map<string, number>;
  onUpdate: (name: string, budget: number) => void;
  totalBudget: number;
  donutData: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="space-y-6 animate-fade-in">
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
      {GROUPS.map((g) => {
        const cats = categories.filter((c) => c.group === g);
        const budget = cats.reduce((s, c) => s + c.budget, 0);
        const spent = cats.reduce((s, c) => s + (spentByCat.get(c.name) ?? 0), 0);
        const groupPct = budget ? (spent / budget) * 100 : 0;
        return (
          <section key={g}>
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-0.5">Gruppo</div>
                <h2 className="text-xl font-bold font-display text-gradient">{g}</h2>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">Speso / Budget</div>
                <div className="text-xs">
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
                  <div key={c.name} className="px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}60` }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-sm">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {fmt(s)} spesi · <span className={over ? "text-destructive" : "text-primary"}>{over ? "Sforato" : `${fmt(diff)} rimasti`}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-input/50 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-muted-foreground">€</span>
                        <input
                          type="number"
                          value={c.budget}
                          onChange={(e) => onUpdate(c.name, Number(e.target.value) || 0)}
                          className="w-14 bg-transparent text-xs font-bold text-right outline-none focus:text-primary"
                        />
                      </div>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden ml-10">
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
