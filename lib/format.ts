// Tous les calculs de dates se font en heure de Paris pour que le serveur (UTC sur Vercel)
// et le navigateur affichent exactement la même chose.
export const TZ = "Europe/Paris";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatEUR(n: number | null | undefined) {
  return eur.format(Number(n ?? 0));
}

export function formatEURCompact(n: number | null | undefined) {
  return eurCompact.format(Number(n ?? 0));
}

const ymdFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Date AAAA-MM-JJ (heure de Paris) d'un instant. */
export function toYMD(d: Date | string) {
  return ymdFmt.format(typeof d === "string" ? new Date(d) : d);
}

/** Aujourd'hui (AAAA-MM-JJ) à Paris. */
export function todayYMD() {
  return toYMD(new Date());
}

/** Ajoute n jours à une date AAAA-MM-JJ. */
export function addDaysYMD(ymd: string, n: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Lundi et dimanche (AAAA-MM-JJ) de la semaine contenant ymd. */
export function weekRangeYMD(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche
  const offset = dow === 0 ? -6 : 1 - dow;
  const start = addDaysYMD(ymd, offset);
  return { start, end: addDaysYMD(start, 6) };
}

/** Mois AAAA-MM d'une date / AAAA-MM-JJ. */
export function monthKey(d: Date | string) {
  return (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : toYMD(d)).slice(0, 7);
}

const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function monthLabel(key: string, long = false) {
  const [y, m] = key.split("-").map(Number);
  return long ? `${MONTHS_LONG[m - 1]} ${y}` : `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
}

/** 15 mars 2026 */
export function formatDate(ymdOrIso: string | null | undefined) {
  if (!ymdOrIso) return "—";
  const ymd = /^\d{4}-\d{2}-\d{2}$/.test(ymdOrIso) ? ymdOrIso : toYMD(ymdOrIso);
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** 15 mars · 14:30 */
export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

const timeFmt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

/** « Aujourd'hui », « Demain », « Dans 3 j », « En retard de 2 j » */
export function relativeDay(ymd: string, today = todayYMD()) {
  const diff = Math.round((Date.parse(ymd) - Date.parse(today)) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff === -1) return "Hier";
  if (diff < 0) return `Retard ${-diff} j`;
  return `Dans ${diff} j`;
}

/** Convertit une valeur <input type="datetime-local"> (heure de Paris) en ISO UTC. */
export function parisLocalToISO(local: string) {
  if (!local) return null;
  const [datePart, timePart = "00:00"] = local.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  // On devine le décalage Paris (UTC+1 ou +2) pour cet instant.
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const parisH = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(guess),
  );
  let offset = parisH - guess.getUTCHours();
  if (offset < -12) offset += 24;
  if (offset > 12) offset -= 24;
  return new Date(Date.UTC(y, mo - 1, d, h - offset, mi)).toISOString();
}

/** Convertit un ISO en valeur pour <input type="datetime-local"> (heure de Paris). */
export function isoToParisLocal(iso: string | null | undefined) {
  if (!iso) return "";
  return `${toYMD(iso)}T${formatTime(iso)}`;
}
