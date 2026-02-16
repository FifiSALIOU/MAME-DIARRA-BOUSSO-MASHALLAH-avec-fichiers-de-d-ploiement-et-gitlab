import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import logoImage from "../assets/logo.png";
import { User, Mail, Building2, Phone, ArrowRight, Headphones, Shield, Clock, ChevronDown } from "lucide-react";

const primaryOrange = "#f97316";
const darkBg = "#0f172a";
const darkText = "hsl(220 50% 15%)";
const borderColor = "#e5e7eb";

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [defaultRoleId, setDefaultRoleId] = useState<number | null>(null);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [agency, setAgency] = useState("");
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);
  const agencyDropdownRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/auth/register-info")
      .then((res) => res.json())
      .then((data) => {
        setDefaultRoleId(data.default_role_id);
        setAgencies(Array.isArray(data.agencies) ? data.agencies : []);
      })
      .catch(() => setError("Impossible de charger les informations d'inscription."))
      .finally(() => setLoadingInfo(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agencyDropdownRef.current && !agencyDropdownRef.current.contains(event.target as Node)) {
        setAgencyDropdownOpen(false);
      }
    }
    if (agencyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [agencyDropdownOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!defaultRoleId) {
      setError("Inscription temporairement indisponible.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          agency: agency.trim() || null,
          phone: phone.trim() || null,
          username: username.trim(),
          role_id: defaultRoleId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.detail || "Erreur lors de l'inscription.";
        throw new Error(Array.isArray(msg) ? msg[0]?.msg || msg : msg);
      }
      navigate("/login", { state: { registered: true } });
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingInfo) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        <p style={{ color: darkText }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Panneau gauche - même design que la page de connexion */}
      <div style={{
        width: "50%",
        minHeight: "100vh",
        background: darkBg,
        padding: "48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}>
        <div style={{ marginTop: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "40px" }}>
            <img src={logoImage} alt="Logo Caisse de Sécurité Sociale" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
            <div>
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#ffffff", margin: "0 0 4px 0", lineHeight: "1.2" }}>HelpDesk</h1>
              <p style={{ fontSize: "16px", fontWeight: "600", color: primaryOrange, margin: 0 }}>Caisse de Sécurité Sociale</p>
            </div>
          </div>
          <p style={{ fontSize: "15px", lineHeight: "1.6", color: "rgba(255, 255, 255, 0.9)", marginBottom: "60px", maxWidth: "400px" }}>
            Créez votre compte pour accéder au système de gestion des incidents et créer des tickets de support.
          </p>
          {/* Blocs Support 24/7, Sécurisé, Rapide - comme sur la page de connexion */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(249, 115, 22, 0.2)", border: "1px solid rgba(249, 115, 22, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Headphones size={24} color={primaryOrange} strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff", margin: "0 0 4px 0" }}>Support 24/7</h3>
                <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: "1.5" }}>Assistance disponible à tout moment</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(249, 115, 22, 0.2)", border: "1px solid rgba(249, 115, 22, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={24} color={primaryOrange} strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff", margin: "0 0 4px 0" }}>Sécurisé</h3>
                <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: "1.5" }}>Vos données sont protégées</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(249, 115, 22, 0.2)", border: "1px solid rgba(249, 115, 22, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Clock size={24} color={primaryOrange} strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#ffffff", margin: "0 0 4px 0" }}>Rapide</h3>
                <p style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.7)", margin: 0, lineHeight: "1.5" }}>Résolution efficace des incidents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", background: "#fff" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: darkText, margin: "0 0 8px 0" }}>Inscription</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 24px 0" }}>Remplissez le formulaire pour créer votre compte</p>

          {error && (
            <div style={{ marginBottom: "16px", padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "14px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: "Nom complet", value: fullName, set: setFullName, icon: User, required: true },
              { label: "Email", value: email, set: setEmail, icon: Mail, type: "email", required: true },
            ].map(({ label, value, set, icon: Icon, type = "text", required }) => (
              <div key={label} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: darkText, marginBottom: "6px" }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <Icon size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    required={!!required}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      border: `1px solid ${borderColor}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            ))}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: darkText, marginBottom: "6px" }}>Agence (optionnel)</label>
              <div ref={agencyDropdownRef} style={{ position: "relative" }}>
                <Building2 size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                <button
                  type="button"
                  onClick={() => setAgencyDropdownOpen((o) => !o)}
                  style={{
                    width: "100%",
                    padding: "12px 36px 12px 40px",
                    border: `1px solid ${borderColor}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    appearance: "none",
                    fontFamily: "inherit",
                    color: agency ? darkText : "#6b7280",
                  }}
                >
                  {agency || "Sélectionner une agence (optionnel)"}
                </button>
                <ChevronDown size={18} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                {agencyDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: "4px",
                      maxHeight: "220px",
                      overflowY: "auto",
                      background: "#fff",
                      border: `1px solid ${borderColor}`,
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 50,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => { setAgency(""); setAgencyDropdownOpen(false); }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 12px 10px 40px",
                        border: "none",
                        background: "transparent",
                        fontSize: "14px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        color: "#6b7280",
                      }}
                    >
                      Sélectionner une agence (optionnel)
                    </button>
                    {agencies.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => { setAgency(a); setAgencyDropdownOpen(false); }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 12px 10px 40px",
                          border: "none",
                          background: agency === a ? "rgba(249, 115, 22, 0.1)" : "transparent",
                          fontSize: "14px",
                          textAlign: "left",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          color: darkText,
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {[
              { label: "Téléphone (optionnel)", value: phone, set: setPhone, icon: Phone },
              { label: "Nom d'utilisateur", value: username, set: setUsername, icon: User, required: true },
            ].map(({ label, value, set, icon: Icon, type = "text", required }) => (
              <div key={label} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: darkText, marginBottom: "6px" }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <Icon size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    required={!!required}
                    style={{
                      width: "100%",
                      padding: "12px 12px 12px 40px",
                      border: `1px solid ${borderColor}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            ))}

            <div style={{ marginTop: "8px", marginBottom: "0" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "48px",
                background: `linear-gradient(135deg, ${primaryOrange} 0%, #ea580c 100%)`,
                color: "white",
                border: "none",
                borderRadius: "9999px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Inscription..." : <>Créer mon compte <ArrowRight size={18} /></>}
            </button>
            </div>
          </form>

          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
            Vous avez déjà un compte ?{" "}
            <Link to="/login" style={{ color: primaryOrange, fontWeight: "600", textDecoration: "none" }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
