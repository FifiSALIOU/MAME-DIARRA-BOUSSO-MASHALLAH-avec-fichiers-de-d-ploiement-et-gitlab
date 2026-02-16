import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import logoImage from "../assets/logo.png";

const primaryOrange = "#f97316";
const borderColor = "#e5e7eb";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/login", { replace: true });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.detail || "Une erreur est survenue. Réessayez." });
        setLoading(false);
        return;
      }
      setMessage({ type: "success", text: "Mot de passe mis à jour. Redirection..." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch {
      setMessage({ type: "error", text: "Impossible de contacter le serveur. Réessayez plus tard." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", padding: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src={logoImage} alt="Logo" style={{ height: "56px", marginBottom: "16px" }} />
          <h1 style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: 0 }}>
            Changer votre mot de passe
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
            Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: `1px solid ${borderColor}` }}>
          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
                background: message.type === "success" ? "#dcfce7" : "#fee2e2",
                color: message.type === "success" ? "#166534" : "#991b1b",
                fontSize: "14px",
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              Mot de passe actuel
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Mot de passe reçu par email"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
                aria-label={showCurrent ? "Masquer" : "Afficher"}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              Nouveau mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <Shield size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Au moins 6 caractères"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
                aria-label={showNew ? "Masquer" : "Afficher"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
              Confirmer le nouveau mot de passe
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirmer le nouveau mot de passe"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}
                aria-label={showConfirm ? "Masquer" : "Afficher"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: primaryOrange,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
