/**
 * Section Reports / Statistiques du dashboard DSI/Admin.
 * Rapports : statistiques, métriques, agence, technicien, évolutions, récurrents, génération.
 */

import { Clock, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { Ticket, Technician } from "../../types";

export type ReportsSectionProps = {
  selectedReport: string;
  setSelectedReport: (v: string) => void;
  showGenerateReport: boolean;
  setShowGenerateReport: (v: boolean) => void;
  showOutputFormat: boolean;
  setShowOutputFormat: (v: boolean) => void;
  outputFormat: string;
  setOutputFormat: (v: string) => void;
  reportType: string;
  setReportType: (v: string) => void;
  reportPeriodFrom: string;
  setReportPeriodFrom: (v: string) => void;
  reportPeriodTo: string;
  setReportPeriodTo: (v: string) => void;
  reportFilters: { department: string; technician: string; ticketType: string; priority: string };
  setReportFilters: (v: { department: string; technician: string; ticketType: string; priority: string }) => void;
  allTickets: Ticket[];
  technicians: Technician[];
  metrics: { avgResolutionTime?: string | null };
  userInfo: { full_name?: string } | null;
  delegatedTicketsByMe: Set<string>;
  colors: Record<string, string>;
  statusColors: Record<string, string>;
  priorityColors: Record<string, string>;
  prepareWeeklyTicketsData: () => { jour: string; Créés: number; Résolus: number }[];
  prepareMonthlyEvolutionData: () => { mois: string; Matériel: number; Applicatif: number }[];
  preparePriorityData: () => { name: string; value: number; percentage: number }[];
  prepareStatusData: () => { name: string; value: number; percentage: number }[];
  prepareAgencyAnalysisData: () => { agence: string | null | undefined; Total: number; Résolus: number; "En attente": number }[];
  prepareTechnicianPerformanceData: () => { technicien: string; performance: number; avgTimeHours: number; performancePercent: number }[];
  prepareAgencyData: () => { agence: string | null | undefined; tickets: number }[];
  prepareTimeSeriesData: () => { date: string; créés: number; résolus: number }[];
  prepareStatusEvolutionData: () => { date: string; "En attente": number; "En cours": number; "Résolus": number; "Clôturés": number }[];
  preparePriorityEvolutionData: () => { priorité: string; nombre: number }[];
  prepareDayOfWeekData: () => { jour: string; tickets: number }[];
  prepareHourlyData: () => { heure: string; tickets: number }[];
  prepareSatisfactionData: () => { date: string; satisfaction: number }[];
  getMostFrequentProblems: () => { problème: string; occurrences: number }[];
  getProblematicApplications: () => { application: string; tickets: number }[];
  getRecurringTicketsHistory: () => { titre: string; occurrences: number; dernier?: string }[];
  exportToPDF: (reportType?: string) => void;
  exportToExcel: (reportType?: string) => void;
  viewDetailedReport: (reportType?: string) => void;
  getReportName: (reportType?: string) => string;
  CustomLabel: (props: any) => React.ReactElement | null;
  reopenedTicketsCount?: number;
};

export function ReportsSection(props: ReportsSectionProps) {
  const {
    selectedReport,
    setSelectedReport,
    showGenerateReport,
    showOutputFormat: _showOutputFormat,
    setShowOutputFormat: _setShowOutputFormat,
    outputFormat: _outputFormat,
    setOutputFormat: _setOutputFormat,
    reportType: _reportType,
    setReportType: _setReportType,
    reportPeriodFrom: _reportPeriodFrom,
    setReportPeriodFrom: _setReportPeriodFrom,
    reportPeriodTo: _reportPeriodTo,
    setReportPeriodTo: _setReportPeriodTo,
    reportFilters: _reportFilters,
    setReportFilters: _setReportFilters,
    allTickets: _allTickets,
    technicians: _technicians,
    metrics: _metrics,
    userInfo: _userInfo,
    colors: _colors,
    statusColors: _statusColors,
    priorityColors: _priorityColors,
    prepareWeeklyTicketsData,
    prepareMonthlyEvolutionData,
    preparePriorityData,
    prepareStatusData,
    prepareAgencyAnalysisData,
    prepareTechnicianPerformanceData,
    prepareAgencyData: _prepareAgencyData,
    prepareTimeSeriesData: _prepareTimeSeriesData,
    prepareStatusEvolutionData: _prepareStatusEvolutionData,
    preparePriorityEvolutionData: _preparePriorityEvolutionData,
    prepareDayOfWeekData: _prepareDayOfWeekData,
    prepareHourlyData: _prepareHourlyData,
    prepareSatisfactionData: _prepareSatisfactionData,
    getMostFrequentProblems: _getMostFrequentProblems,
    getProblematicApplications: _getProblematicApplications,
    getRecurringTicketsHistory: _getRecurringTicketsHistory,
    exportToPDF: _exportToPDF,
    exportToExcel: _exportToExcel,
    viewDetailedReport: _viewDetailedReport,
    getReportName: _getReportName,
    CustomLabel,
    reopenedTicketsCount: _reopenedTicketsCount = 0,
  } = props;
  void _showOutputFormat;
  void _setShowOutputFormat;
  void _outputFormat;
  void _setOutputFormat;
  void _reportType;
  void _setReportType;
  void _reportPeriodFrom;
  void _setReportPeriodFrom;
  void _reportPeriodTo;
  void _setReportPeriodTo;
  void _reportFilters;
  void _setReportFilters;
  void _allTickets;
  void _technicians;
  void _metrics;
  void _userInfo;
  void _colors;
  void _statusColors;
  void _priorityColors;
  void _prepareAgencyData;
  void _prepareTimeSeriesData;
  void _prepareStatusEvolutionData;
  void _preparePriorityEvolutionData;
  void _prepareDayOfWeekData;
  void _prepareHourlyData;
  void _prepareSatisfactionData;
  void _getMostFrequentProblems;
  void _getProblematicApplications;
  void _getRecurringTicketsHistory;
  void _exportToPDF;
  void _exportToExcel;
  void _viewDetailedReport;
  void _getReportName;
  void _reopenedTicketsCount;

  return (
    <>
      {selectedReport !== "statistiques" && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "8px", fontSize: "28px", fontWeight: "600", color: "#333" }}>
            {selectedReport === "metriques"
              ? "Métriques de performance"
              : selectedReport === "agence"
                ? "Analyses par agence"
                : selectedReport === "technicien"
                  ? "Analyses par technicien"
                  : selectedReport === "evolutions"
                    ? "Évolutions dans le temps"
                    : selectedReport === "recurrents"
                      ? "Problèmes récurrents"
                      : "Rapports et Métriques"}
          </h2>
          {selectedReport === "metriques" && (
            <p style={{ margin: "0", fontSize: "16px", color: "#6b7280", fontWeight: "400" }}>
              Indicateurs clés de la qualité et de l'efficacité du support technique
            </p>
          )}
          {selectedReport === "agence" && (
            <p style={{ margin: "0", fontSize: "16px", color: "#6b7280", fontWeight: "400" }}>
              Performance et répartition des tickets par agence
            </p>
          )}
          {selectedReport === "technicien" && (
            <p style={{ margin: "0", fontSize: "16px", color: "#6b7280", fontWeight: "400" }}>
              Analyse détaillée de la performance individuelle de chaque technicien
            </p>
          )}
          {selectedReport === "evolutions" && (
            <p style={{ margin: "0", fontSize: "16px", color: "#6b7280", fontWeight: "400" }}>
              Analyse des tendances et des évolutions temporelles des tickets et de la performance
            </p>
          )}
          {selectedReport === "recurrents" && (
            <p style={{ margin: "0", fontSize: "16px", color: "#6b7280", fontWeight: "400" }}>
              Identification et analyse des problèmes qui reviennent fréquemment pour améliorer la prévention
            </p>
          )}
        </div>
      )}

      {!selectedReport && !showGenerateReport && (
        <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#666", fontSize: "16px", marginBottom: "20px" }}>Sélectionnez un type de rapport dans le menu latéral</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div style={{ padding: "16px", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer" }} onClick={() => setSelectedReport("statistiques")}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>Statistiques générales</h3>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Nombre total, répartition par statut, priorité, type</p>
            </div>
            <div style={{ padding: "16px", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer" }} onClick={() => setSelectedReport("metriques")}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>Métriques de performance</h3>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Temps moyen, satisfaction, escalades, réouvertures</p>
            </div>
            <div style={{ padding: "16px", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer" }} onClick={() => setSelectedReport("agence")}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>Analyses par agence</h3>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Volume, temps moyen, satisfaction par agence</p>
            </div>
            <div style={{ padding: "16px", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer" }} onClick={() => setSelectedReport("technicien")}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>Analyses par technicien</h3>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Tickets traités, temps moyen, charge, satisfaction</p>
            </div>
            <div style={{ padding: "16px", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer" }} onClick={() => setSelectedReport("evolutions")}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>Évolutions dans le temps</h3>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Tendances, pics d'activité, performance</p>
            </div>
            <div style={{ padding: "16px", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer" }} onClick={() => setSelectedReport("recurrents")}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#333" }}>Problèmes récurrents</h3>
              <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Types fréquents, agences, patterns</p>
            </div>
          </div>
        </div>
      )}

      {selectedReport === "statistiques" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px" }}>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid rgba(229, 231, 235, 0.5)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>Tickets cette semaine</h3>
              </div>
              <div style={{ padding: "24px", paddingTop: "0", flex: 1 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={prepareWeeklyTicketsData()} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="jour" stroke="#E5E7EB" tick={{ fill: "#6B7280", fontSize: 12 }} style={{ fontSize: "12px" }} />
                    <YAxis stroke="#E5E7EB" tick={{ fill: "#6B7280", fontSize: 12 }} style={{ fontSize: "12px" }} domain={[0, 16]} ticks={[0, 4, 8, 12, 16]} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
                    <Bar dataKey="Créés" fill="#FF9500" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="Résolus" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid rgba(229, 231, 235, 0.5)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>Évolution mensuelle par type</h3>
              </div>
              <div style={{ padding: "24px", paddingTop: "0", flex: 1 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={prepareMonthlyEvolutionData()} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorMateriel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF9500" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#FF9500" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorApplicatif" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#475569" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#475569" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" stroke="#E5E7EB" tick={{ fill: "#6B7280", fontSize: 12 }} style={{ fontSize: "12px" }} angle={-45} textAnchor="end" />
                    <YAxis stroke="#E5E7EB" tick={{ fill: "#6B7280", fontSize: 12 }} style={{ fontSize: "12px" }} domain={[0, 80]} ticks={[0, 20, 40, 60, 80]} />
                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
                    <Area type="monotone" dataKey="Matériel" stroke="#FF9500" strokeWidth={2} fillOpacity={1} fill="url(#colorMateriel)" />
                    <Area type="monotone" dataKey="Applicatif" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorApplicatif)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
            <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", color: "#333" }}>Répartition par priorité</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={preparePriorityData()} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="#ffffff" strokeWidth={2} label={CustomLabel} labelLine={false}>
                    {preparePriorityData().map((entry, index) => {
                      const pieColors: Record<string, string> = { "Critique": "#dc2626", "Haute": "#FF9500", "Moyenne": "#EAB308", "Basse": "#22C55E" };
                      return <Cell key={`cell-${index}`} fill={pieColors[entry.name] ?? "#999"} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} formatter={(value: number, _name: string, props: any) => [`${value} (${props?.payload?.percentage ?? 0}%)`, _name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", color: "#333" }}>Répartition par statut</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={prepareStatusData()} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="#ffffff" strokeWidth={2} label={CustomLabel} labelLine={false}>
                    {prepareStatusData().map((entry, index) => {
                      const pieColors: Record<string, string> = { "En cours": "#FF9500", "En attente d'assignation": "#3B82F6", "Relancé": "#EF4444", "Résolu": "#22C55E", "Délégué": "#8B5CF6" };
                      return <Cell key={`cell-${index}`} fill={pieColors[entry.name] ?? "#999"} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} formatter={(value: number, _name: string, props: any) => [`${value} (${props?.payload?.percentage ?? 0}%)`, _name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px", marginTop: "24px" }}>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid rgba(229, 231, 235, 0.5)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>Analyse par agence</h3>
              </div>
              <div style={{ padding: "24px", paddingTop: "0", flex: 1 }}>
                {(() => {
                  const agencyData = prepareAgencyAnalysisData();
                  return agencyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={agencyData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barCategoryGap="20%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis type="number" domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} stroke="#6B7280" style={{ fontSize: "12px" }} />
                        <YAxis dataKey="agence" type="category" stroke="#374151" style={{ fontSize: "12px" }} width={90} />
                        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} />
                        <Legend wrapperStyle={{ marginTop: "20px" }} iconType="rect" />
                        <Bar dataKey="Total" fill="#1A202C" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="Résolus" fill="#22C55E" radius={[0, 4, 4, 0]} barSize={20} />
                        <Bar dataKey="En attente" fill="#FF9500" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Aucune donnée à afficher</div>
                  );
                })()}
              </div>
            </div>
            <div style={{ background: "white", borderRadius: "8px", border: "1px solid rgba(229, 231, 235, 0.5)", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>Performance des techniciens</h3>
              </div>
              <div style={{ marginBottom: "24px" }}>
                {(() => {
                  const techData = prepareTechnicianPerformanceData();
                  return techData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={techData} margin={{ top: 10, right: 20, left: 0, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="technicien" 
                          stroke="#6B7280" 
                          style={{ fontSize: "11px" }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                        />
                        <YAxis domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} stroke="#6B7280" style={{ fontSize: "12px" }} />
                        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} content={({ active, payload, label }: any) => (active && payload?.length ? (
                          <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                            <div style={{ color: "#111827", marginBottom: "4px" }}>{label}</div>
                            <div style={{ color: "#FF9500" }}>Résolus : {payload[0].value}</div>
                          </div>
                        ) : null)} />
                        <Bar dataKey="performance" fill="#FF9500" stroke="#FF9500" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>Aucune donnée à afficher</div>
                  );
                })()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {prepareTechnicianPerformanceData().map((tech, index) => (
                  <div key={tech.technicien} style={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F2F2F2", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: index === 0 ? "#F5EDD4" : "#E5E5E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 500, color: index === 0 ? "#C4A941" : "#262626", flexShrink: 0 }}>{index + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#262626" }}>{tech.technicien}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", fontWeight: 400, color: "#808080", flexShrink: 0 }}>
                      <Clock size={12} color="#808080" />
                      <span>{tech.avgTimeHours > 0 ? `${tech.avgTimeHours.toFixed(1)}h moy.` : "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#D4F5E0", color: "#1B8A3E", padding: "6px 12px", borderRadius: "14px", fontSize: "13px", fontWeight: 500, minWidth: "60px", height: "28px", justifyContent: "center", flexShrink: 0 }}>
                      <TrendingUp size={16} color="#1B8A3E" />
                      <span>{tech.performancePercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Les vues metriques, agence, technicien, evolutions, recurrents et formulaires de génération sont rendues par le dashboard pour garder la même logique (export PDF/Excel, etc.). Ce composant affiche la structure principale et statistiques. */}
    </>
  );
}
