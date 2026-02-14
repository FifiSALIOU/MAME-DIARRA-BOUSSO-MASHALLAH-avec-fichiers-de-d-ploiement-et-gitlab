/**
 * Section Maintenance du dashboard DSI/Admin.
 * Onglets : État système, Base de données, Tâches, Journaux.
 */

import {
  Activity,
  Database,
  Wrench,
  FileText,
  Shield,
  Network,
  AlertTriangle,
  CheckCircle,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Notification } from "../../types";

export type DatabaseTableStat = {
  name: string;
  row_estimate: number;
  rls_enabled: boolean;
};

export type MaintenanceSectionProps = {
  maintenanceTab: string;
  setMaintenanceTab: (tab: string) => void;
  formatAvailability: (value: number) => string;
  dbAvailability: number;
  authAvailability: number;
  apiAvailability: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  bandwidthUsage: number;
  databaseTables: DatabaseTableStat[];
  databaseTablesError: string | null;
  isLoadingDatabaseTables: boolean;
  loadDatabaseTablesStats: () => void | Promise<void>;
  maintenanceLogs: Notification[];
  maintenanceLogsError: string | null;
  isLoadingMaintenanceLogs: boolean;
  formatNotificationMessage: (message: string) => string;
};

export function MaintenanceSection({
  maintenanceTab,
  setMaintenanceTab,
  formatAvailability,
  dbAvailability,
  authAvailability,
  apiAvailability,
  cpuUsage,
  memoryUsage,
  storageUsage,
  bandwidthUsage,
  databaseTables,
  databaseTablesError,
  isLoadingDatabaseTables,
  loadDatabaseTablesStats,
  maintenanceLogs,
  maintenanceLogsError,
  isLoadingMaintenanceLogs,
  formatNotificationMessage,
}: MaintenanceSectionProps) {
  return (
    <div style={{ padding: "24px 24px 24px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: "0",
          padding: "4px",
          borderRadius: "9999px",
          background: "#f5f5f5",
          marginBottom: "24px",
          boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.15)",
        }}
      >
        {[
          { id: "etat-systeme", label: "État système", icon: Activity },
          { id: "base-de-donnees", label: "Base de données", icon: Database },
          { id: "taches", label: "Tâches", icon: Wrench },
          { id: "journaux", label: "Journaux", icon: FileText },
        ].map((tab, index, allTabs) => {
          const isActive = maintenanceTab === tab.id;
          const isFirst = index === 0;
          const isLast = index === allTabs.length - 1;
          const radius = isFirst
            ? "9999px 0 0 9999px"
            : isLast
              ? "0 9999px 9999px 0"
              : "0";

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMaintenanceTab(tab.id)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: radius,
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#111827" : "#4b5563",
                boxShadow: isActive ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              <tab.icon
                size={16}
                color={isActive ? "#111827" : "#6b7280"}
                strokeWidth={2.5}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {maintenanceTab === "etat-systeme" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              { id: "db", label: "Base de données", icon: Database },
              { id: "auth", label: "Authentification", icon: Shield },
              { id: "api", label: "API Backend", icon: Network },
            ].map((service) => (
              <div
                key={service.id}
                style={{
                  borderRadius: "14px",
                  padding: "16px 18px",
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: "#f9fafb",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "9999px",
                        background: "rgba(16,185,129,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <service.icon size={18} color="#047857" />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#111827",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {service.label}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          marginTop: "4px",
                        }}
                      >
                        Disponibilité:{" "}
                        {service.id === "db"
                          ? formatAvailability(dbAvailability)
                          : service.id === "auth"
                            ? formatAvailability(authAvailability)
                            : formatAvailability(apiAvailability)}
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      background: "rgba(16,185,129,0.1)",
                      color: "#047857",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "1px solid rgba(16,185,129,0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Opérationnel
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderRadius: "14px",
              border: "1px solid rgba(148,163,184,0.35)",
              padding: "18px 20px",
              background: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Santé globale du système
              </h3>
              <p
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                Indicateurs calculés à partir des tickets, des actifs et des notifications en temps réel.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {[
                { label: "CPU", value: cpuUsage },
                { label: "Mémoire", value: memoryUsage },
                { label: "Stockage", value: storageUsage },
                { label: "Bande passante", value: bandwidthUsage },
              ].map((metric) => (
                <div
                  key={metric.label}
                  style={{ display: "flex", flexDirection: "column", gap: "4px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "12px",
                      color: "#374151",
                    }}
                  >
                    <span>{metric.label}</span>
                    <span>{metric.value}%</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      borderRadius: "9999px",
                      background: "#e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${metric.value}%`,
                        height: "100%",
                        borderRadius: "9999px",
                        background:
                          metric.label === "CPU" || metric.label === "Mémoire"
                            ? "linear-gradient(90deg,#f97316,#111827)"
                            : "#111827",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {maintenanceTab === "base-de-donnees" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(15,23,42,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {[
              { key: "tickets", label: "Tickets", color: "#f97316", background: "rgba(249,115,22,0.08)" },
              { key: "users", label: "Profils", color: "#2563eb", background: "rgba(37,99,235,0.08)" },
              { key: "comments", label: "Commentaires", color: "#10b981", background: "rgba(16,185,129,0.08)" },
              { key: "ticket_history", label: "Historiques", color: "#8b5cf6", background: "rgba(139,92,246,0.08)" },
            ].map((card) => {
              const table = databaseTables.find((t) => t.name.toLowerCase() === card.key);
              const value = table ? table.row_estimate : 0;
              return (
                <div
                  key={card.key}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "#f9fafb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{card.label}</span>
                    <span style={{ fontSize: "28px", fontWeight: 700, color: card.color }}>{value}</span>
                  </div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "9999px",
                      background: card.background,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => void loadDatabaseTablesStats()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "9999px",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                color: "#111827",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20px",
                  height: "20px",
                  borderRadius: "9999px",
                  background: "#f3f4ff",
                  color: "#4f46e5",
                  fontSize: "12px",
                }}
              >
                ↻
              </span>
              <span>Rafraîchir</span>
            </button>
          </div>
          {databaseTablesError && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              {databaseTablesError}
            </div>
          )}
          {isLoadingDatabaseTables ? (
            <p style={{ textAlign: "center", padding: "16px", color: "#6b7280", fontSize: "14px" }}>
              Chargement des statistiques de la base de données...
            </p>
          ) : (
            <div style={{ borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "9999px",
                        background: "#eef2ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Database size={16} strokeWidth={2.4} color="#4f46e5" />
                    </span>
                    <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#111827" }}>
                      Tables de la base de données
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                    Statistiques des tables principales de notre instance PostgreSQL.
                  </p>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", textAlign: "left", color: "#6b7280" }}>
                      <th style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>Tables</th>
                      <th style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>Enregistrements</th>
                      <th style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", fontWeight: 500 }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {databaseTables.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
                          Aucune table détectée dans la base de données.
                        </td>
                      </tr>
                    ) : (
                      databaseTables.map((table) => (
                        <tr key={table.name}>
                          <td
                            style={{
                              padding: "10px 16px",
                              borderBottom: "1px solid #f3f4f6",
                              color: "#111827",
                              fontWeight: 500,
                              textTransform: "none",
                            }}
                          >
                            {table.name}
                          </td>
                          <td
                            style={{
                              padding: "10px 16px",
                              borderBottom: "1px solid #f3f4f6",
                              color: "#111827",
                            }}
                          >
                            {table.row_estimate}
                          </td>
                          <td
                            style={{
                              padding: "10px 16px",
                              borderBottom: "1px solid #f3f4f6",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: table.rls_enabled ? "rgba(16,185,129,0.1)" : "rgba(148,163,184,0.12)",
                                color: table.rls_enabled ? "#047857" : "#4b5563",
                                border: `1px solid ${table.rls_enabled ? "rgba(16,185,129,0.3)" : "rgba(148,163,184,0.5)"}`,
                              }}
                            >
                              {table.rls_enabled ? "RLS Actif" : "RLS Inactif"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {maintenanceTab === "taches" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 2px 4px rgba(15,23,42,0.06)",
            textAlign: "center",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Cette sous-section Tâches sera développée ultérieurement.
        </div>
      )}

      {maintenanceTab === "journaux" && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 4px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#111827" }}>
                Journal d&apos;activité système
              </h2>
              <p style={{ marginTop: "4px", fontSize: "13px", color: "#6b7280" }}>
                Historique des événements récents de maintenance et des notifications système pour ce compte administrateur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  const rows = maintenanceLogs.map((log) => ({
                    Date: new Date(log.created_at).toLocaleString("fr-FR"),
                    Type: log.type,
                    Message: log.message,
                    Ticket: log.ticket_id ?? "",
                  }));
                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.json_to_sheet(rows);
                  XLSX.utils.book_append_sheet(wb, ws, "Journaux");
                  XLSX.writeFile(wb, `Journaux_maintenance_${new Date().toISOString().split("T")[0]}.xlsx`);
                } catch (error) {
                  console.error("Erreur export journaux maintenance:", error);
                  alert("Erreur lors de l'export des journaux.");
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "9999px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                fontSize: "13px",
                fontWeight: 500,
                color: "#111827",
                cursor: "pointer",
              }}
            >
              <Download size={16} />
              <span>Exporter</span>
            </button>
          </div>
          {maintenanceLogsError && (
            <div
              style={{
                marginBottom: "12px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              {maintenanceLogsError}
            </div>
          )}
          {isLoadingMaintenanceLogs ? (
            <p style={{ textAlign: "center", padding: "24px", color: "#6b7280", fontSize: "14px" }}>
              Chargement des journaux...
            </p>
          ) : maintenanceLogs.length === 0 ? (
            <p style={{ textAlign: "center", padding: "24px", color: "#6b7280", fontSize: "14px" }}>
              Aucun événement de maintenance récent trouvé pour ce compte.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {maintenanceLogs.map((log) => {
                const typeString = String(log.type || "");
                const isWarning =
                  typeString.includes("alerte") ||
                  typeString.includes("problème") ||
                  typeString.includes("faible") ||
                  typeString.includes("indisponible");
                const iconBg = isWarning ? "#fef3c7" : "#dcfce7";
                const iconColor = isWarning ? "#f59e0b" : "#16a34a";
                return (
                  <div
                    key={log.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "9999px",
                          background: iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {isWarning ? (
                          <AlertTriangle size={18} color={iconColor} />
                        ) : (
                          <CheckCircle size={18} color={iconColor} />
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatNotificationMessage(log.message)}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {typeString || "Notification"} {log.ticket_id ? `• Ticket #${log.ticket_id}` : ""}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        marginLeft: "8px",
                      }}
                    >
                      {new Date(log.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
