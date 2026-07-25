import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Btn } from "../../components/ui/Btn";
import { inputCls } from "../../lib/tokens";
import { addDaysISO, fmtShort, isoWeekNum, mondayISOof, todayISO } from "../../lib/planningDates";
import { getDiffusionPreview, sendDiffusion } from "../../api/planning";
import { ApiError } from "../../api/client";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      /* navigateur sans support clipboard */
    }
    document.body.removeChild(ta);
  }
}

function WeekNav({ weekStart, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={inputCls + " w-auto px-3 py-1.5"} onClick={() => onChange(addDaysISO(weekStart, -7))}>
        ‹
      </button>
      <b className="min-w-[190px] text-center inline-block text-sm">
        {fmtShort(weekStart)} – {fmtShort(addDaysISO(weekStart, 6))} · S{isoWeekNum(weekStart)}
      </b>
      <button type="button" className={inputCls + " w-auto px-3 py-1.5"} onClick={() => onChange(addDaysISO(weekStart, 7))}>
        ›
      </button>
      <Btn variant="outline" onClick={() => onChange(mondayISOof(todayISO()))}>
        Cette semaine
      </Btn>
    </div>
  );
}

export default function DiffusionTab({ rooms, currentRoomId, setCurrentRoomId, weekStart, setWeekStart }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendResult, setSendResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const flashCopied = (id) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1200);
  };

  const handleCopyOne = async (mail) => {
    await copyText(mail.body);
    flashCopied(mail.employee_id);
  };

  const handleCopyAll = async () => {
    const room = rooms.find((r) => r.id === currentRoomId);
    const header = `PLANNINGS – Control Room ${room?.name ?? ""} – semaine du ${fmtShort(weekStart)} au ${fmtShort(addDaysISO(weekStart, 6))}`;
    const all = `${header}\n\n${emails.map((m) => m.body).join("\n\n=========================================\n\n")}`;
    await copyText(all);
    flashCopied("all");
  };

  const reload = useCallback(async () => {
    if (!currentRoomId) return;
    setLoading(true);
    setError("");
    setSendResult(null);
    try {
      setEmails(await getDiffusionPreview(currentRoomId, weekStart));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur de chargement de l'aperçu de diffusion.");
    } finally {
      setLoading(false);
    }
  }, [currentRoomId, weekStart]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSend = async () => {
    if (!currentRoomId) return;
    if (!confirm("Envoyer réellement les e-mails de planning pour cette semaine ?")) return;
    setSending(true);
    setError("");
    try {
      setSendResult(await sendDiffusion(currentRoomId, weekStart));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur lors de l'envoi de la diffusion.");
    } finally {
      setSending(false);
    }
  };

  if (!rooms.length) {
    return (
      <Card className="p-4">
        <div className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-md p-4">
          Crée une salle dans l'onglet « Salles ».
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-1 text-slate-900">Diffusion du planning</h2>
      <p className="text-sm text-slate-500 mb-3">
        Aperçu du planning personnalisé par agent. « Envoyer » déclenche un envoi réel (best-effort) via le backend.
      </p>

      <div className="flex gap-3 items-end flex-wrap mb-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Salle</label>
          <select className={inputCls} value={currentRoomId ?? ""} onChange={(e) => setCurrentRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Semaine</label>
          <WeekNav weekStart={weekStart} onChange={setWeekStart} />
        </div>
        <Btn variant="outline" disabled={loading || emails.length === 0} onClick={handleCopyAll}>
          {copiedId === "all" ? "Tout copié ✓" : "Copier tout"}
        </Btn>
        <Btn variant="danger" disabled={sending || loading || emails.length === 0} onClick={handleSend}>
          {sending ? "Envoi…" : "Envoyer les e-mails"}
        </Btn>
      </div>

      {error && <div className="mb-4 text-sm text-[#E31E3D] bg-[#fce8ea] border border-[#E31E3D]/30 rounded-md px-3 py-2">{error}</div>}

      {sendResult && (
        <div className="mb-4 text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-amber-900">
          <b>{sendResult.sent.length}</b> envoi(s) réussi(s), <b>{sendResult.failed.length}</b> échec(s).
          {sendResult.failed.length > 0 && (
            <ul className="list-disc ml-5 mt-1">
              {sendResult.failed.map((f) => (
                <li key={f.employee_id}>
                  {f.name} {f.email ? `(${f.email})` : ""} : {f.error || "échec"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Chargement…</div>
      ) : emails.length === 0 ? (
        <div className="text-slate-400 text-sm text-center border border-dashed border-slate-200 rounded-md p-4">
          Aucun agent planifié.
        </div>
      ) : (
        emails.map((mail) => {
          const noMail = !mail.email;
          const mailtoHref = `mailto:${encodeURIComponent(mail.email || "")}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
          return (
            <div key={mail.employee_id} className="border border-slate-200 rounded-lg p-3.5 mb-3">
              <div className="flex justify-between items-center gap-2.5 flex-wrap">
                <div>
                  <b className="text-slate-900">{mail.name}</b>{" "}
                  {mail.email ? (
                    <span className="text-xs text-slate-400">{mail.email}</span>
                  ) : (
                    <span className="text-xs text-[#E31E3D]">e-mail manquant</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="text-xs text-slate-400">{mail.subject}</div>
                  <a
                    href={noMail ? undefined : mailtoHref}
                    aria-disabled={noMail}
                    className={
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold " +
                      (noMail ? "bg-[#fce8ea] text-[#E31E3D]/50 cursor-not-allowed pointer-events-none" : "bg-[#E31E3D] text-white hover:brightness-110")
                    }
                  >
                    ✉ Ouvrir l&apos;e-mail
                  </a>
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:border-slate-400"
                    onClick={() => handleCopyOne(mail)}
                  >
                    {copiedId === mail.employee_id ? "Copié ✓" : "Copier"}
                  </button>
                </div>
              </div>
              <pre className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-[13px] whitespace-pre-wrap mt-2.5 font-sans">
                {mail.body}
              </pre>
            </div>
          );
        })
      )}
    </Card>
  );
}
