'use client';

import { useState } from 'react';
import { dayLabel } from '@/lib/dates';
import { groupMatches, groupName, groupTable } from '@/lib/groups';
import { matchTitle, teamLabel } from '@/lib/labels';
import type { Match, State } from '@/lib/types';

const NAVY = '#14213d';
const MUTED = '#566074';
const YELLOW = '#f2b705';
const RED = '#d6283b';
const PAPER = '#eef1f4';

/** Familia tipográfica real de una variable CSS (--display o --body), para usarla en el canvas. */
function fontFamily(variable: string): string {
  const el = document.createElement('span');
  el.style.fontFamily = `var(${variable})`;
  document.body.appendChild(el);
  const family = getComputedStyle(el).fontFamily;
  el.remove();
  return family;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Texto en una línea: si no cabe en `maxWidth`, se achica la letra hasta que quepa. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  weight: string,
  size: number,
  family: string,
) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && s > 16) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  ctx.fillText(text, x, y);
}

function caption(state: State, m: Match): string {
  if (m.group !== undefined && !m.tb) {
    const n = groupMatches(state, m.group).findIndex((x) => x.id === m.id) + 1;
    return `${matchTitle(state, m)} · Partido ${n}`;
  }
  return matchTitle(state, m);
}

async function render(state: State, day: string, ids: Set<string>): Promise<HTMLCanvasElement> {
  const display = fontFamily('--display');
  const body = fontFamily('--body');
  await Promise.all([
    document.fonts.load(`700 40px ${display}`),
    document.fonts.load(`400 28px ${body}`),
    document.fonts.load(`700 28px ${body}`),
  ]).catch(() => undefined);

  const matches = state.matches
    .filter((m) => ids.has(m.id) && !m.bye && m.a && m.b)
    .sort((x, y) => x.round - y.round || (x.group ?? 99) - (y.group ?? 99) || x.slot - y.slot);

  // Con más de 3 partidos se usan 2 columnas: la foto queda ancha y no larguísima.
  const COLS = matches.length > 3 ? 2 : 1;
  const W = COLS === 2 ? 1800 : 1100;
  const PAD = 56;
  const HEADER = 230;
  const CARD_H = 200;
  const CAPTION_H = 54;
  const GAP = 34;
  const FOOTER = 90;
  const ROWS = Math.max(1, Math.ceil(matches.length / COLS));
  const COL_GAP = 48;
  const CARD_W = (W - 2 * PAD - (COLS - 1) * COL_GAP) / COLS;
  // Tablas de posiciones de cada grupo, debajo de los partidos.
  const groups = state.groups ?? [];
  const TITLE_H = 70;
  const TH_H = 60;
  const TR_H = 62;
  const maxTeams = Math.max(0, ...groups.map((g) => g.length));
  const TABLE_BLOCK = TITLE_H + TH_H + maxTeams * TR_H + GAP;
  const TABLE_ROWS = groups.length; // una tabla por fila, a todo el ancho, para que quepan los nombres
  const TABLES_H = TABLE_ROWS * TABLE_BLOCK;
  const MATCHES_H = matches.length ? ROWS * (CAPTION_H + CARD_H + GAP) : 0;
  const H = HEADER + MATCHES_H + GAP / 2 + TABLES_H + FOOTER;

  // WhatsApp en HD admite hasta 4096 px por lado: se dibuja lo más grande posible sin pasarse.
  const scale = Math.min(3, 4096 / Math.max(W, H));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la imagen.');
  ctx.scale(scale, scale);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Encabezado
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, HEADER);
  ctx.fillStyle = YELLOW;
  ctx.fillRect(0, HEADER - 12, W, 12);
  ctx.textAlign = 'center';
  ctx.fillStyle = YELLOW;
  fitText(ctx, 'CUARENTA B-TECH', W / 2, 85, W - 2 * PAD, '700', 96, display);
  ctx.fillStyle = '#ffffff';
  fitText(ctx, `Partidos del ${dayLabel(day)}`.toUpperCase(), W / 2, 160, W - 2 * PAD, '700', 52, display);

  // Partidos
  for (const [i, m] of matches.entries()) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CARD_W + COL_GAP);
    const w = CARD_W;
    let y = HEADER + GAP + row * (CAPTION_H + CARD_H + GAP);

    ctx.textAlign = 'left';
    ctx.fillStyle = MUTED;
    fitText(ctx, caption(state, m), x, y + CAPTION_H / 2, w, '400', 30, body);
    y += CAPTION_H;
    const half = CARD_H / 2;

    ctx.save();
    roundRect(ctx, x, y, w, CARD_H, 22);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, CARD_H);
    const slots: [string | null, number | null, number][] = [
      [m.a, m.scoreA, y],
      [m.b, m.scoreB, y + half],
    ];
    for (const [teamId, score, top] of slots) {
      const won = Boolean(m.winner) && m.winner === teamId;
      if (won) {
        ctx.fillStyle = YELLOW;
        ctx.fillRect(x, top, w, half);
      }
      ctx.fillStyle = NAVY;
      ctx.textAlign = 'left';
      const hasScore = m.winner && score !== null;
      fitText(
        ctx,
        teamLabel(state, teamId),
        x + 36,
        top + half / 2 + (top === y ? -8 : 8),
        w - 72 - (hasScore ? 110 : 0),
        won ? '700' : '400',
        42,
        body,
      );
      if (hasScore) {
        ctx.textAlign = 'right';
        ctx.font = `700 70px ${display}`;
        ctx.fillText(String(score), x + w - 36, top + half / 2 + (top === y ? -8 : 8));
      }
    }
    ctx.restore();

    ctx.lineWidth = 5;
    ctx.strokeStyle = NAVY;
    roundRect(ctx, x, y, w, CARD_H, 22);
    ctx.stroke();

    // VS al centro
    const cx = x + w / 2;
    const cy = y + half;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx - 54, cy - 28, 108, 56, 28);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = RED;
    ctx.stroke();
    ctx.fillStyle = RED;
    ctx.textAlign = 'center';
    ctx.font = `700 36px ${display}`;
    ctx.fillText('VS', cx, cy + 2);
  }

  // Tablas de grupos
  const cols: { label: string; key: 'played' | 'wins' | 'losses' | 'pf' | 'pa' | 'pts' | 'diff'; w: number }[] = [
    // Solo los puntos de tabla (3 por victoria): lo demás queda en la página.
    { label: 'Pts', key: 'pts', w: 120 },
  ];
  const numsW = cols.reduce((s, c) => s + c.w, 0);
  for (const [g, ids] of groups.entries()) {
    if (ids.length === 0) continue;
    const x = PAD;
    const w = W - 2 * PAD;
    let y = HEADER + MATCHES_H + GAP / 2 + g * TABLE_BLOCK;

    ctx.textAlign = 'left';
    ctx.fillStyle = NAVY;
    ctx.font = `700 54px ${display}`;
    ctx.fillText(`${groupName(g).toUpperCase()} · POSICIONES`, x, y + TITLE_H / 2);
    y += TITLE_H;

    const tableH = TH_H + ids.length * TR_H;
    ctx.save();
    roundRect(ctx, x, y, w, tableH, 18);
    ctx.clip();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, tableH);
    ctx.fillStyle = NAVY;
    ctx.fillRect(x, y, w, TH_H);
    ctx.restore();

    // Encabezados
    let cx = x + w - 20;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 28px ${body}`;
    for (const c of [...cols].reverse()) {
      ctx.fillText(c.label, cx, y + TH_H / 2);
      cx -= c.w;
    }
    ctx.textAlign = 'left';
    ctx.fillText('Equipo', x + 24, y + TH_H / 2);

    // Filas
    const table = groupTable(state, g);
    for (const [i, r] of table.entries()) {
      const ry = y + TH_H + i * TR_H;
      if (i > 0) {
        ctx.fillStyle = '#d9dfe9';
        ctx.fillRect(x + 4, ry, w - 8, 2);
      }
      const diff = r.pointsFor - r.pointsAgainst;
      const values = {
        played: String(r.played),
        wins: String(r.wins),
        losses: String(r.losses),
        pf: String(r.pointsFor),
        pa: String(r.pointsAgainst),
        pts: String(r.wins * 3),
        diff: diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '0',
      };
      ctx.fillStyle = NAVY;
      ctx.textAlign = 'left';
      fitText(ctx, `${i + 1}  ${teamLabel(state, r.teamId)}`, x + 24, ry + TR_H / 2, w - numsW - 60, i === 0 ? '700' : '400', 30, body);
      let nx = x + w - 20;
      ctx.textAlign = 'right';
      for (const c of [...cols].reverse()) {
        ctx.font = `${c.key === 'pts' || i === 0 ? '700' : '400'} 30px ${body}`;
        ctx.fillText(values[c.key], nx, ry + TR_H / 2);
        nx -= c.w;
      }
    }

    ctx.lineWidth = 5;
    ctx.strokeStyle = NAVY;
    roundRect(ctx, x, y, w, tableH, 18);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${body}`;
  ctx.fillText('Torneo de Cuarenta B-TECH', W / 2, H - FOOTER / 2);
  return canvas;
}

/** Elegir un día y descargar una foto (PNG) con los partidos de ese día. */
export function ScheduleImage({ state }: { state: State }) {
  const days = [...new Set(state.matches.filter((m) => m.date && !m.bye).map((m) => m.date as string))].sort();
  const [day, setDay] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // Por defecto: hoy, o el próximo día con partidos (si ya pasaron todos, el último).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fallback = days.find((d) => d >= today) ?? days[days.length - 1] ?? '';
  const selected = days.includes(day) ? day : fallback;

  // Partidos que se pueden poner en la foto. Marcados de entrada: los de ese día que ya tienen resultado.
  const candidates = state.matches
    .filter((m) => !m.bye && m.a && m.b)
    .sort((x, y) => x.round - y.round || (x.group ?? 99) - (y.group ?? 99) || x.slot - y.slot);
  const isDefault = (m: Match) => m.date === selected && Boolean(m.winner);
  const [picks, setPicks] = useState<Record<string, boolean>>({});
  const checked = (m: Match) => picks[m.id] ?? isDefault(m);
  const chosen = new Set(candidates.filter(checked).map((m) => m.id));

  async function download() {
    setBusy(true);
    setProblem(null);
    try {
      if (chosen.size === 0) throw new Error('Marca al menos un partido.');
      const canvas = await render(state, selected, chosen);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('No se pudo crear la imagen.');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cuarenta-b-tech-${selected}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'No se pudo crear la imagen.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section" aria-labelledby="foto">
      <h2 id="foto">Foto de los partidos del día</h2>
      {days.length === 0 ? (
        <p className="muted">Guarda primero las fechas de los partidos para poder crear la foto.</p>
      ) : (
        <>
          <p className="muted">Descarga una imagen con los partidos de un día, lista para compartir.</p>
          <div className="form-row">
            <div className="field">
              <label htmlFor="foto-dia">Día</label>
              <select
                id="foto-dia"
                className="input"
                value={selected}
                onChange={(e) => {
                  setDay(e.target.value);
                  setPicks({});
                }}
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {dayLabel(d)}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" type="button" disabled={busy} onClick={() => void download()}>
              {busy ? 'Creando…' : 'Descargar foto'}
            </button>
          </div>
          <p className="muted">
            Partidos en la foto ({chosen.size}). Marca o quita los que quieras, por ejemplo uno de otro día que se jugó
            hoy.
          </p>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {candidates.map((m) => (
              <label key={m.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={checked(m)}
                  onChange={(e) => setPicks((prev) => ({ ...prev, [m.id]: e.target.checked }))}
                />
                <span>
                  <span className="muted">
                    {matchTitle(state, m)}
                    {m.date ? ` · ${dayLabel(m.date)}` : ' · sin fecha'}
                    {m.winner ? ` · ${m.scoreA} a ${m.scoreB}` : ''}
                  </span>
                  <br />
                  {teamLabel(state, m.a)} contra {teamLabel(state, m.b)}
                </span>
              </label>
            ))}
          </div>
          {problem && (
            <p role="alert" className="message is-error">
              {problem}
            </p>
          )}
        </>
      )}
    </section>
  );
}
