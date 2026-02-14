/**
 * Section Tickets du dashboard DSI/Admin.
 * Liste des tickets avec filtres avancés et cartes.
 */

import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  AlertTriangle,
  Layers,
  CheckCircle,
  Flag,
  Share2,
  Clock,
  Ticket as TicketIcon,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { fr } from "date-fns/locale";
import React from "react";
import type { Ticket } from "../../types";
import { DSIOrangeSelect } from "../ui/DSIOrangeSelect.tsx";

export type TicketsSectionProps = {
  showTicketsPlaceholder: boolean;
  ticketSearchQuery: string;
  setTicketSearchQuery: (v: string) => void;
  loadTickets: (query?: string) => void;
  filteredTickets: Ticket[];
  formatTicketNumber: (n: number) => string;
  getPriorityLabel: (p: string) => string;
  advancedPeriodRange: { from: Date | undefined; to?: Date } | undefined;
  setAdvancedPeriodRange: (r: { from: Date | undefined; to?: Date } | undefined) => void;
  showPeriodCalendar: boolean;
  setShowPeriodCalendar: (v: boolean) => void;
  periodCalendarRef: React.RefObject<HTMLDivElement | null>;
  advancedAgencyFilter: string;
  setAdvancedAgencyFilter: (v: string) => void;
  allAgencies: string[];
  advancedCategoryFilter: string;
  setAdvancedCategoryFilter: (v: string) => void;
  advancedCategories: string[];
  advancedTypeFilter: string;
  setAdvancedTypeFilter: (v: string) => void;
  advancedTypes: string[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  delegationFilter: string;
  setDelegationFilter: (v: string) => void;
  userRole: string | null;
  advancedNonResolvedFilter: string;
  setAdvancedNonResolvedFilter: (v: string) => void;
  advancedUserFilter: string;
  setAdvancedUserFilter: (v: string) => void;
  advancedUsers: string[];
  advancedCreatorFilter: string;
  setAdvancedCreatorFilter: (v: string) => void;
  loadTicketDetails: (id: string) => void;
  openActionsMenuFor: string | null;
  setOpenActionsMenuFor: (v: string | null) => void;
  setActionsMenuPosition: (v: { top: number; left: number } | null) => void;
  loading: boolean;
  onExportExcel: () => void;
  onExportPdf: () => void;
};

export function TicketsSection({
  showTicketsPlaceholder,
  ticketSearchQuery,
  setTicketSearchQuery,
  loadTickets,
  filteredTickets,
  formatTicketNumber,
  getPriorityLabel,
  advancedPeriodRange,
  setAdvancedPeriodRange,
  showPeriodCalendar,
  setShowPeriodCalendar,
  periodCalendarRef,
  advancedAgencyFilter,
  setAdvancedAgencyFilter,
  allAgencies,
  advancedCategoryFilter,
  setAdvancedCategoryFilter,
  advancedCategories,
  advancedTypeFilter,
  setAdvancedTypeFilter,
  advancedTypes,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  delegationFilter,
  setDelegationFilter,
  userRole,
  advancedNonResolvedFilter,
  setAdvancedNonResolvedFilter,
  advancedUserFilter,
  setAdvancedUserFilter,
  advancedUsers,
  advancedCreatorFilter,
  setAdvancedCreatorFilter,
  loadTicketDetails,
  openActionsMenuFor,
  setOpenActionsMenuFor,
  setActionsMenuPosition,
  loading,
  onExportExcel,
  onExportPdf,
}: TicketsSectionProps) {
  return (
    <div style={{ padding: "24px 24px 24px 0" }}>
      <div style={{ display: showTicketsPlaceholder ? "block" : "none" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "280px",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "16px", color: "#6b7280" }}>En chargement.......</span>
        </div>
      </div>
      {!showTicketsPlaceholder && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              position: "relative",
              width: "100%",
              maxWidth: "500px",
              marginTop: "24px",
              marginBottom: "16px",
            }}
          >
            <Search
              size={18}
              color="#6b7280"
              style={{
                position: "absolute",
                left: "12px",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              value={ticketSearchQuery}
              onChange={(e) => setTicketSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadTickets(ticketSearchQuery);
                }
              }}
              style={{
                width: "100%",
                padding: "8px 12px 8px 38px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                backgroundColor: "#f9fafb",
                color: "#111827",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
            />
          </div>

          <div
            style={{
              border: "1px solid rgba(148, 163, 184, 0.5)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Filter size={16} color="#f97316" />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#0f172a" }}>Filtres avancés</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={onExportExcel}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    borderRadius: "9999px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  <FileSpreadsheet size={16} />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={onExportPdf}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    borderRadius: "9999px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  <FileText size={16} />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px 16px",
              }}
            >
              <div
                ref={periodCalendarRef}
                style={{
                  gridColumn: "span 2",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <Calendar size={12} />
                  <span>Période</span>
                </span>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPeriodCalendar(!showPeriodCalendar)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowPeriodCalendar(!showPeriodCalendar);
                    }
                  }}
                  className="dsi-period-filter-trigger"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "14px",
                    color: "#6b7280",
                    height: "36px",
                    cursor: "pointer",
                  }}
                >
                  <Calendar size={16} color="#6b7280" className="dsi-period-filter-trigger-icon" />
                  <span>
                    {advancedPeriodRange?.from
                      ? advancedPeriodRange.to
                        ? `${advancedPeriodRange.from.toLocaleDateString("fr-FR")} – ${advancedPeriodRange.to.toLocaleDateString("fr-FR")}`
                        : advancedPeriodRange.from.toLocaleDateString("fr-FR")
                      : "Sélectionner une période"}
                  </span>
                </div>
                {showPeriodCalendar && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "4px",
                      zIndex: 1000,
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                      border: "1px solid #e5e7eb",
                      padding: "12px",
                      pointerEvents: "auto",
                      minWidth: "560px",
                    }}
                    className="rdp-root"
                  >
                    <DayPicker
                      mode="range"
                      numberOfMonths={2}
                      locale={fr}
                      weekStartsOn={1}
                      showOutsideDays
                      selected={advancedPeriodRange}
                      onSelect={(range) => setAdvancedPeriodRange(range)}
                      defaultMonth={advancedPeriodRange?.from ?? new Date()}
                      navLayout="around"
                      styles={{
                        months: { flexWrap: "nowrap", display: "flex", gap: "2rem" },
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <Building2 size={12} />
                  <span>Agence</span>
                </span>
                <DSIOrangeSelect
                  value={advancedAgencyFilter}
                  onChange={setAdvancedAgencyFilter}
                  options={[
                    { value: "all", label: "Toutes les agences" },
                    ...allAgencies.map((agency) => ({ value: agency, label: agency })),
                  ]}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <AlertTriangle size={12} />
                  <span>Catégorie</span>
                </span>
                <DSIOrangeSelect
                  value={advancedCategoryFilter}
                  onChange={setAdvancedCategoryFilter}
                  options={[
                    { value: "all", label: "Toutes" },
                    ...advancedCategories.map((category) => ({ value: category, label: category })),
                  ]}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <Layers size={12} />
                  <span>Type</span>
                </span>
                <DSIOrangeSelect
                  value={advancedTypeFilter}
                  onChange={setAdvancedTypeFilter}
                  options={[
                    { value: "all", label: "Tous" },
                    ...advancedTypes.map((type) => ({ value: type, label: type })),
                  ]}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <CheckCircle size={12} />
                  <span>Statut</span>
                </span>
                <DSIOrangeSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: "all", label: "Tous" },
                    { value: "en_attente_analyse", label: "En attente d'assignation" },
                    { value: "en_traitement", label: "En traitement" },
                    { value: "resolu", label: "Résolus" },
                    { value: "retraite", label: "Retraités" },
                    { value: "cloture", label: "Clôturés" },
                    { value: "rejete", label: "Relancés" },
                  ]}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <Flag size={12} />
                  <span>Priorité</span>
                </span>
                <DSIOrangeSelect
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={[
                    { value: "all", label: "Toutes" },
                    { value: "non_definie", label: "Non définie" },
                    { value: "critique", label: "Critique" },
                    { value: "haute", label: "Haute" },
                    { value: "moyenne", label: "Moyenne" },
                    { value: "faible", label: "Faible" },
                  ]}
                />
              </div>

              {userRole === "DSI" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    <Share2 size={12} />
                    <span>Délégation</span>
                  </span>
                  <DSIOrangeSelect
                    value={delegationFilter}
                    onChange={setDelegationFilter}
                    options={[
                      { value: "all", label: "Tous" },
                      { value: "delegated", label: "Tickets délégués" },
                      { value: "not_delegated", label: "Tickets non délégués" },
                    ]}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <Clock size={12} />
                  <span>Non résolu depuis</span>
                </span>
                <DSIOrangeSelect
                  value={advancedNonResolvedFilter}
                  onChange={setAdvancedNonResolvedFilter}
                  options={[
                    { value: "all", label: "Tous" },
                    { value: "3", label: "3+ jours" },
                    { value: "5", label: "5+ jours" },
                    { value: "7", label: "7+ jours (1 semaine)" },
                    { value: "14", label: "14+ jours (2 semaines)" },
                    { value: "30", label: "30+ jours (1 mois)" },
                  ]}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Utilisateur</span>
                <DSIOrangeSelect
                  value={advancedUserFilter}
                  onChange={setAdvancedUserFilter}
                  options={[
                    { value: "all", label: "Tous" },
                    ...advancedUsers.map((u) => ({ value: u, label: u })),
                  ]}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Créé par (nom)</span>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={advancedCreatorFilter}
                  onChange={(e) => setAdvancedCreatorFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "14px",
                    height: "36px",
                    color: "#111827",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
              marginBottom: "12px",
            }}
          >
            <TicketIcon size={20} color="#4b5563" />
            <span style={{ fontSize: "14px", fontWeight: "500", color: "#4b5563" }}>
              {filteredTickets.length} ticket(s) trouvé(s)
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              overflow: "visible",
            }}
          >
            {filteredTickets.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#999",
                  fontWeight: "500",
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                Aucun ticket
              </div>
            ) : (
              filteredTickets.map((t) => {
                const getInitials = (name: string) => {
                  if (!name) return "??";
                  const parts = name.split(" ");
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[1][0]).toUpperCase();
                  }
                  return name.substring(0, 2).toUpperCase();
                };
                const getRelativeTime = (date: string) => {
                  const now = new Date();
                  const past = new Date(date);
                  const diffInMs = now.getTime() - past.getTime();
                  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                  if (diffInDays === 0) return "aujourd'hui";
                  if (diffInDays === 1) return "il y a 1 jour";
                  return `il y a ${diffInDays} jours`;
                };
                const borderColor =
                  t.priority === "critique"
                    ? "#E53E3E"
                    : t.priority === "haute"
                      ? "#F59E0B"
                      : t.priority === "faible" || t.priority === "non_definie"
                        ? "rgba(107, 114, 128, 0.3)"
                        : "#0DADDB";
                const category = t.category || "";
                const isApplicatif =
                  category.toLowerCase().includes("logiciel") ||
                  category.toLowerCase().includes("applicatif") ||
                  category.toLowerCase().includes("application");
                const categoryType = isApplicatif ? "Applicatif" : "Matériel";

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetails(t.id)}
                    style={{
                      position: "relative",
                      background: "white",
                      borderRadius: "12px",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      overflow: "visible",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)";
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: "4px",
                        background: borderColor,
                        borderTopLeftRadius: "12px",
                        borderBottomLeftRadius: "12px",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            fontFamily: "monospace",
                            fontWeight: "600",
                          }}
                        >
                          {formatTicketNumber(t.number)}
                        </span>
                        <span
                          style={{
                            padding: t.status === "en_cours" ? "2px 10px" : "3px 8px",
                            borderRadius: "20px",
                            fontSize: t.status === "en_cours" ? "12px" : "10px",
                            fontWeight: "500",
                            background:
                              t.status === "en_attente_analyse"
                                ? "rgba(13, 173, 219, 0.1)"
                                : t.status === "assigne_technicien"
                                  ? "rgba(255, 122, 27, 0.1)"
                                  : t.status === "en_cours"
                                    ? "rgba(15, 31, 61, 0.1)"
                                    : t.status === "retraite"
                                      ? "#EDE7F6"
                                      : t.status === "resolu"
                                        ? "rgba(47, 158, 68, 0.1)"
                                        : t.status === "rejete"
                                          ? "#fee2e2"
                                          : t.status === "cloture"
                                            ? "#e5e7eb"
                                            : "#e5e7eb",
                            color:
                              t.status === "en_attente_analyse"
                                ? "#0DADDB"
                                : t.status === "assigne_technicien"
                                  ? "#FF7A1B"
                                  : t.status === "en_cours"
                                    ? "#0F1F3D"
                                    : t.status === "retraite"
                                      ? "#4A148C"
                                      : t.status === "resolu"
                                        ? "#2F9E44"
                                        : t.status === "rejete"
                                          ? "#991b1b"
                                          : t.status === "cloture"
                                            ? "#374151"
                                            : "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {t.status === "en_attente_analyse"
                            ? "En attente d'assignation"
                            : t.status === "assigne_technicien"
                              ? "Assigné"
                              : t.status === "en_cours"
                                ? "En cours"
                                : t.status === "retraite"
                                  ? "Retraité"
                                  : t.status === "resolu"
                                    ? "Résolu"
                                    : t.status === "rejete"
                                      ? "Relancé"
                                      : t.status === "cloture"
                                        ? "Clôturé"
                                        : t.status}
                        </span>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "20px",
                            fontSize: "10px",
                            fontWeight: "500",
                            background:
                              t.priority === "critique"
                                ? "rgba(229, 62, 62, 0.1)"
                                : t.priority === "haute"
                                  ? "rgba(245, 158, 11, 0.1)"
                                  : t.priority === "moyenne"
                                    ? "rgba(13, 173, 219, 0.1)"
                                    : t.priority === "faible" || t.priority === "non_definie"
                                      ? "#E5E7EB"
                                      : "#e5e7eb",
                            color:
                              t.priority === "critique"
                                ? "#E53E3E"
                                : t.priority === "haute"
                                  ? "#F59E0B"
                                  : t.priority === "moyenne"
                                    ? "#0DADDB"
                                    : t.priority === "faible" || t.priority === "non_definie"
                                      ? "#6B7280"
                                      : "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                            {getPriorityLabel(t.priority || "non_definie")}
                        </span>
                        {t.category && (
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontWeight: "500",
                              background: "#f3f4f6",
                              color: "#1f2937",
                              whiteSpace: "nowrap",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {isApplicatif ? (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                              </svg>
                            ) : (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                              </svg>
                            )}
                            <span>{categoryType}</span>
                          </span>
                        )}
                      </div>
                      <div style={{ position: "relative" }}>
                        {t.status === "cloture" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadTicketDetails(t.id);
                            }}
                            style={{
                              background: "#6b7280",
                              border: "1px solid white",
                              borderRadius: "6px",
                              cursor: "pointer",
                              padding: "6px 8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "32px",
                              height: "32px",
                            }}
                            title="Voir les détails"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isOpen = openActionsMenuFor === t.id;
                              if (isOpen) {
                                setOpenActionsMenuFor(null);
                                setActionsMenuPosition(null);
                                return;
                              }
                              const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const viewportHeight = window.innerHeight;
                              const menuWidth = 220;
                              const menuHeight = 220;
                              let top = buttonRect.bottom + 4;
                              if (viewportHeight - buttonRect.bottom < menuHeight && buttonRect.top > menuHeight) {
                                top = buttonRect.top - menuHeight - 4;
                              }
                              let left = buttonRect.right - menuWidth;
                              if (left < 8) left = 8;
                              setActionsMenuPosition({ top, left });
                              setOpenActionsMenuFor(t.id);
                            }}
                            disabled={loading}
                            title="Actions"
                            aria-label="Actions"
                            style={{
                              width: 28,
                              height: 28,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "transparent",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              color: "#475569",
                              backgroundImage:
                                'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'><circle cx=\'12\' cy=\'5\' r=\'2\' fill=\'%23475569\'/><circle cx=\'12\' cy=\'12\' r=\'2\' fill=\'%23475569\'/><circle cx=\'12\' cy=\'19\' r=\'2\' fill=\'%23475569\'/></svg>")',
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              backgroundSize: "18px 18px",
                              transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f3f4f6";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "6px",
                        lineHeight: "1.3",
                      }}
                    >
                      {t.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        marginBottom: "12px",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {t.description || "Aucune description"}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            {getInitials(t.creator?.full_name || "Inconnu")}
                          </div>
                          <span style={{ fontSize: "12px", color: "#374151", fontWeight: "500" }}>
                            {t.creator?.full_name || "N/A"}
                          </span>
                        </div>
                        {t.created_at && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#9ca3af"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                              {getRelativeTime(t.created_at)}
                            </span>
                          </div>
                        )}
                        {(t.creator?.agency || t.user_agency) && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#9ca3af"
                              strokeWidth="2"
                            >
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                              {t.creator?.agency || t.user_agency}
                            </span>
                          </div>
                        )}
                        {t.technician && (
                          <>
                            <span style={{ fontSize: "11px", color: "#9ca3af" }}>→</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  background: "rgba(255, 122, 27, 0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: "600",
                                  color: "#FF7A1B",
                                }}
                              >
                                {getInitials(t.technician.full_name)}
                              </div>
                              <span style={{ fontSize: "12px", color: "#374151", fontWeight: "500" }}>
                                {t.technician.full_name}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
