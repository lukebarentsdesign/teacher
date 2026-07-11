"use client";

import { useState } from "react";
import type { MonthlyForecastRow } from "@/lib/forecast";

function formatMonth(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

const CHART_HEIGHT = 220;
const BAR_GROUP_WIDTH = 72;
const BAR_WIDTH = 24;

export function IncomeChart({ rows }: { rows: MonthlyForecastRow[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-500">No income or expense data yet.</p>;
  }

  const maxValue = Math.max(1, ...rows.flatMap((r) => [r.income, r.expenses, r.projectedIncome ?? 0]));
  const chartWidth = rows.length * BAR_GROUP_WIDTH;

  function barHeight(value: number) {
    return (value / maxValue) * (CHART_HEIGHT - 40);
  }

  return (
    <div className="viz-root rounded-xl bg-white p-4 shadow-sm">
      <style>{`
        .viz-root {
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --muted: #898781;
          --gridline: #e1e0d9;
          --series-income: #2a78d6;
          --series-expenses: #1baf7a;
        }
        @media (prefers-color-scheme: dark) {
          .viz-root {
            --surface-1: #1a1a19;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --muted: #898781;
            --gridline: #2c2c2a;
            --series-income: #3987e5;
            --series-expenses: #199e70;
          }
        }
      `}</style>

      <div className="mb-3 flex items-center gap-4 text-xs text-[color:var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-income)" }} />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--series-expenses)" }} />
          Expenses
        </span>
        {rows.some((r) => r.projectedIncome !== null) && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-3"
              style={{ background: "var(--series-income)", opacity: 0.5 }}
            />
            Projected income
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          width={chartWidth}
          height={CHART_HEIGHT}
          role="img"
          aria-label="Monthly income vs expenses, with forward income projection"
        >
          <line
            x1={0}
            y1={CHART_HEIGHT - 24}
            x2={chartWidth}
            y2={CHART_HEIGHT - 24}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
          {rows.map((row, i) => {
            const groupX = i * BAR_GROUP_WIDTH;
            const incomeH = barHeight(row.income);
            const expensesH = barHeight(row.expenses);
            const baseline = CHART_HEIGHT - 24;
            return (
              <g
                key={row.month}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  x={groupX + 8}
                  y={baseline - incomeH}
                  width={BAR_WIDTH}
                  height={incomeH}
                  rx={4}
                  fill="var(--series-income)"
                  opacity={hovered === null || hovered === i ? 1 : 0.5}
                />
                <rect
                  x={groupX + 8 + BAR_WIDTH + 2}
                  y={baseline - expensesH}
                  width={BAR_WIDTH}
                  height={expensesH}
                  rx={4}
                  fill="var(--series-expenses)"
                  opacity={hovered === null || hovered === i ? 1 : 0.5}
                />
                {row.projectedIncome !== null && (
                  <circle
                    cx={groupX + 8 + BAR_WIDTH / 2}
                    cy={baseline - barHeight(row.projectedIncome)}
                    r={3}
                    fill="var(--series-income)"
                    opacity={0.6}
                  />
                )}
                <text
                  x={groupX + BAR_GROUP_WIDTH / 2}
                  y={CHART_HEIGHT - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill="var(--muted)"
                >
                  {formatMonth(row.month)}
                </text>
                {hovered === i && (
                  <text
                    x={groupX + BAR_GROUP_WIDTH / 2}
                    y={baseline - Math.max(incomeH, expensesH) - 8}
                    textAnchor="middle"
                    fontSize={11}
                    fill="var(--text-primary)"
                  >
                    £{row.income.toFixed(0)} / £{row.expenses.toFixed(0)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
