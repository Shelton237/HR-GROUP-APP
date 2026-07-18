import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Field } from "../components/ui/Field";
import { Btn } from "../components/ui/Btn";
import { inputCls } from "../lib/tokens";
import { useAuth } from "../auth/useAuth";
import { changePassword } from "../api/auth";
import { ApiError } from "../api/client";
import logo from "../assets/logo.png";
import loginBg from "../assets/login-bg.jpg";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Set after a login response flags a mandatory password change.
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Merci de renseigner votre e-mail et votre mot de passe.");
      return;
    }
    setBusy(true);
    try {
      const res = await login(email.trim(), password);
      if (res?.user?.mustChangePassword) {
        setMustChangePassword(true);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Connexion impossible. Vérifiez vos identifiants.");
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async (ev) => {
    ev.preventDefault();
    setPwError("");
    if (newPassword.length < 8) {
      setPwError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== newPassword2) {
      setPwError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPwBusy(true);
    try {
      await changePassword(newPassword);
      setPwDone(true);
      setMustChangePassword(false);
    } catch (e) {
      setPwError(e instanceof ApiError ? e.message : "Impossible d'enregistrer le nouveau mot de passe.");
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen grid place-items-center p-4"
      style={{
        background: `linear-gradient(180deg, rgba(244,246,248,.55), rgba(244,246,248,.88)), url(${loginBg}) center/cover no-repeat fixed`,
        fontFamily: "ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img
            src={logo}
            alt="Thara Services"
            className="h-24 w-auto"
            style={{ filter: "drop-shadow(0 2px 6px rgba(15,27,45,.25))" }}
          />
        </div>

        <Card className="p-6">
          {mustChangePassword ? (
            pwDone ? (
              <div className="space-y-4 text-center">
                <ShieldCheck size={28} className="mx-auto text-emerald-600" />
                <p className="text-sm text-slate-700">Mot de passe mis à jour. Vous êtes connecté(e).</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submitNewPassword}>
                <div>
                  <h2 className="font-semibold text-slate-900">Nouveau mot de passe requis</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Pour des raisons de sécurité, définissez un nouveau mot de passe avant de continuer.
                  </p>
                </div>
                <Field label="Nouveau mot de passe">
                  <input
                    type="password"
                    className={inputCls}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Confirmer le mot de passe">
                  <input
                    type="password"
                    className={inputCls}
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                  />
                </Field>
                {pwError && (
                  <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 rounded-lg p-2.5">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>{pwError}</span>
                  </div>
                )}
                <Btn type="submit" className="w-full" disabled={pwBusy}>
                  {pwBusy ? "Enregistrement…" : "Définir le mot de passe"}
                </Btn>
              </form>
            )
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <h2 className="font-semibold text-slate-900">Connexion</h2>
                <p className="text-xs text-slate-500 mt-1">Accédez à votre espace RH.</p>
              </div>
              <Field label="E-mail">
                <input
                  type="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  autoComplete="username"
                />
              </Field>
              <Field label="Mot de passe">
                <input
                  type="password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              {error && (
                <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 rounded-lg p-2.5">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <Btn type="submit" className="w-full" disabled={busy}>
                {busy ? "Connexion…" : "Se connecter"}
              </Btn>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
