/**
 * Section Tableau de bord du dashboard DSI/Admin.
 * Vue principale avec KPIs, métriques et graphiques.
 */

import { Clock, Clock3, TrendingUp, UserCheck, Star } from "lucide-react";
import {
  LineChart,
  Line,
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
  Pie
} from "recharts";
import { CustomLabel } from "../ui/CustomLabel.tsx";
import type { Ticket, Technician } from "../../types";

export type DashboardSectionProps = {
  userRole: string | null;
  pendingCount: number;
  activeTechniciansCount: number;
  technicians: Technician[];
  metrics: { avgResolutionTime?: string | null; userSatisfaction?: string | null };
  resolutionRate: string;
  totalTicketsCount: number;
  filteredTickets: Ticket[];
  formatTicketNumber: (n: number) => string;
  loadTicketDetails: (id: string) => void;
  loading: boolean;
  openActionsMenuFor: string | null;
  setOpenActionsMenuFor: (v: string | null) => void;
  setActionsMenuPosition: (v: { top: number; left: number } | null) => void;
  prepareWeeklyTicketsData: () => { jour: string; Créés: number; Résolus: number }[];
  prepareMonthlyEvolutionData: () => { mois: string; Matériel: number; Applicatif: number }[];
  preparePriorityData: () => { name: string; value: number; percentage: number }[];
  prepareStatusData: () => { name: string; value: number; percentage: number }[];
  prepareAgencyAnalysisData: () => { agence: string | null | undefined; Total: number; Résolus: number; "En attente": number }[];
  prepareTechnicianPerformanceData: () => { technicien: string; performance: number; avgTimeHours: number; performancePercent: number }[];
  prepareTimeSeriesData: () => { date: string; créés: number; résolus: number }[];
  prepareStatusEvolutionData: () => { date: string; "En attente": number; "En cours": number; "Résolus": number; "Clôturés": number }[];
  prepareResolutionTimeByTypeData: () => { type: string; tempsMoyen: number }[];
  allTickets?: Ticket[];
  preparePriorityEvolutionData?: () => { priorité: string; nombre: number }[];
  prepareAgencyData?: () => { agence: string | null | undefined; tickets: number }[];
  prepareDayOfWeekData?: () => { jour: string; tickets: number }[];
  prepareUsersByRoleData?: () => { rôle: string; nombre: number }[];
  prepareTechniciansBySpecializationData?: () => { spécialisation: string; nombre: number }[];
  prepareTechnicianWorkloadData?: () => { technicien: string; assignés: number; résolus: number }[];
  prepareMostActiveUsersData?: () => { utilisateur: string; tickets: number }[];
};

export function DashboardSection(props: DashboardSectionProps) {
  const {
    userRole,
    pendingCount,
    activeTechniciansCount,
    technicians,
    metrics,
    resolutionRate,
    totalTicketsCount,
    filteredTickets,
    formatTicketNumber,
    loadTicketDetails,
    loading,
    openActionsMenuFor,
    setOpenActionsMenuFor,
    setActionsMenuPosition,
    prepareWeeklyTicketsData,
    prepareMonthlyEvolutionData,
    preparePriorityData,
    prepareStatusData,
    prepareAgencyAnalysisData,
    prepareTechnicianPerformanceData,
    prepareTimeSeriesData,
    prepareStatusEvolutionData,
    prepareResolutionTimeByTypeData,
    allTickets = [],
    preparePriorityEvolutionData = () => [],
    prepareAgencyData = () => [],
    prepareDayOfWeekData = () => [],
    prepareUsersByRoleData = () => [],
    prepareTechniciansBySpecializationData = () => [],
    prepareTechnicianWorkloadData = () => [],
    prepareMostActiveUsersData = () => [],
  } = props;

  return (
<>
      <div style={{ marginTop: "28px", marginBottom: "20px" }}>
        <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
          {userRole === "Admin" ? "Administration 🛠️" : "Tableau de bord DSI 🎯"}
        </div>
        <div style={{ fontSize: "15px", color: "#4b5563" }}>
          {userRole === "Admin" ? "Vue globale du système" : "Vue d'ensemble des tickets et de l'équipe"}
        </div>
      </div>

      {/* Métriques principales DSI - 6 KPIs alignés sur une même rangée */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "12px",
          margin: "20px 0",
        }}
      >
        {/* Tickets à assigner */}
        <div
          className="kpi-card"
          style={{
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            minHeight: "145px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(-4px)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1)";
          }}
        >
          <div
            className="kpi-badge"
            style={{
              position: "absolute",
              right: "-1rem",
              top: "-1rem",
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              background: "rgba(255, 138, 60, 0.05)",
              transition: "transform 500ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#fff4e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock3 size={20} color="#ff8a3c" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "12px" }}>
            Tickets à assigner
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "2px",
            }}
          >
            {pendingCount}
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            Action requise
          </div>
        </div>

        {/* Techniciens disponibles */}
        <div
          className="kpi-card"
          style={{
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            minHeight: "145px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(-4px)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1)";
          }}
        >
          <div
            className="kpi-badge"
            style={{
              position: "absolute",
              right: "-1rem",
              top: "-1rem",
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              background: "rgba(255, 138, 60, 0.05)",
              transition: "transform 500ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#e6fff3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserCheck size={20} color="#16a34a" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "12px" }}>
            Techniciens disponibles
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "2px",
            }}
          >
            {activeTechniciansCount}
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            Sur {technicians.length || 0} au total
          </div>
        </div>

        {/* Temps moyen */}
        <div
          className="kpi-card"
          style={{
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            minHeight: "145px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(-4px)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1)";
          }}
        >
          <div
            className="kpi-badge"
            style={{
              position: "absolute",
              right: "-1rem",
              top: "-1rem",
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              background: "rgba(255, 138, 60, 0.05)",
              transition: "transform 500ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#f4e9ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock3 size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "12px" }}>
            Temps<br />moyen
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "2px",
              whiteSpace: "nowrap",
            }}
          >
            {metrics.avgResolutionTime ?? "Chargement..."}
          </div>
          <div style={{ fontSize: "11px", color: "#16a34a" }}>
            ↗ -15% ce mois
          </div>
        </div>

        {/* Satisfaction client (en %) */}
        <div
          className="kpi-card"
          style={{
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            minHeight: "145px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(-4px)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1)";
          }}
        >
          <div
            className="kpi-badge"
            style={{
              position: "absolute",
              right: "-1rem",
              top: "-1rem",
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              background: "rgba(255, 138, 60, 0.05)",
              transition: "transform 500ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#fff8db",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star size={20} color="#eab308" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "12px" }}>
            Satisfaction client
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "2px",
            }}
          >
            {metrics.userSatisfaction ?? "Chargement..."}
          </div>
          <div style={{ fontSize: "11px", color: "#16a34a" }}>
            ↗ +0.3 ce mois
          </div>
        </div>

        {/* Volume total de tickets */}
        <div
          className="kpi-card"
          style={{
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            minHeight: "145px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(-4px)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1)";
          }}
        >
          <div
            className="kpi-badge"
            style={{
              position: "absolute",
              right: "-1rem",
              top: "-1rem",
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              background: "rgba(255, 138, 60, 0.05)",
              transition: "transform 500ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#e0f7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock3 size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "12px" }}>
            Volume<br />total
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "2px",
            }}
          >
            {totalTicketsCount}
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            Ce mois
          </div>
        </div>

        {/* Taux de résolution global */}
        <div
          className="kpi-card"
          style={{
            background: "#fff",
            borderRadius: "0.75rem",
            padding: "2rem 1.5rem",
            minHeight: "145px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid rgba(229,231,235,0.5)",
            position: "relative",
            overflow: "hidden",
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(-4px)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(0)";
            const badge = e.currentTarget.querySelector('.kpi-badge') as HTMLElement;
            if (badge) badge.style.transform = "scale(1)";
          }}
        >
          <div
            className="kpi-badge"
            style={{
              position: "absolute",
              right: "-1rem",
              top: "-1rem",
              width: "6rem",
              height: "6rem",
              borderRadius: "50%",
              background: "rgba(255, 138, 60, 0.05)",
              transition: "transform 500ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "16px",
              top: "16px",
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "hsla(142, 76%, 85%, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={20} color="hsl(142, 76%, 36%)" />
          </div>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "12px" }}>
            Taux de résolution
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "2px",
            }}
          >
            {resolutionRate}
          </div>
          <div style={{ fontSize: "11px", color: "#16a34a" }}>
            +2% (indicatif)
          </div>
        </div>
      </div>

      {/* Graphiques de la section Statistiques pour l'administrateur */}
      {userRole === "Admin" && (
        <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "32px" }}>
          {/* Graphique 1: Tickets cette semaine */}
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            border: "1px solid rgba(229, 231, 235, 0.5)", 
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
            display: "flex", 
            flexDirection: "column" 
          }}>
            {/* CardHeader */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>
                Tickets cette semaine
              </h3>
            </div>
            {/* CardContent */}
            <div style={{ padding: "24px", paddingTop: "0", flex: 1 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={prepareWeeklyTicketsData()}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="jour" 
                    stroke="#E5E7EB"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis 
                    stroke="#E5E7EB"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    style={{ fontSize: "12px" }}
                    domain={[0, 16]}
                    ticks={[0, 4, 8, 12, 16]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />
                  <Bar 
                    dataKey="Créés" 
                    fill="#FF9500"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar 
                    dataKey="Résolus" 
                    fill="#22C55E"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Graphique 2: Évolution mensuelle par type */}
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            border: "1px solid rgba(229, 231, 235, 0.5)", 
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
            display: "flex", 
            flexDirection: "column" 
          }}>
            {/* CardHeader */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>
                Évolution mensuelle par type
              </h3>
            </div>
            {/* CardContent */}
            <div style={{ padding: "24px", paddingTop: "0", flex: 1 }}>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart
                  data={prepareMonthlyEvolutionData()}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorMaterielDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9500" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF9500" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorApplicatifDashboard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#475569" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#475569" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="mois" 
                    stroke="#E5E7EB"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    style={{ fontSize: "12px" }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    stroke="#E5E7EB"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    style={{ fontSize: "12px" }}
                    domain={[0, 80]}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e5e7eb", 
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
                  <Area 
                    type="monotone" 
                    dataKey="Matériel" 
                    stroke="#FF9500" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMaterielDashboard)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Applicatif" 
                    stroke="#475569" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorApplicatifDashboard)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Deuxième ligne de graphiques - Donut charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Graphique 3: Répartition par priorité */}
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", color: "#333" }}>
              Répartition par priorité
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={preparePriorityData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={CustomLabel}
                  labelLine={false}
                >
                  {preparePriorityData().map((entry, index) => {
                    const colors = {
                      "Critique": "#dc2626",
                      "Haute": "#FF9500",
                      "Moyenne": "#EAB308",
                      "Basse": "#22C55E"
                    };
                    return (
                      <Cell key={`cell-priority-dashboard-${index}`} fill={colors[entry.name as keyof typeof colors]} />
                    );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e5e7eb", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    return [`${value} (${props.payload.percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique 4: Répartition par statut */}
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "16px", fontWeight: "600", color: "#333" }}>
              Répartition par statut
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={prepareStatusData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={CustomLabel}
                  labelLine={false}
                >
                  {prepareStatusData().map((entry, index) => {
                    const colors = {
                      "En cours": "#FF9500",
                      "En attente d'assignation": "#3B82F6",
                      "Relancé": "#EF4444",
                      "Résolu": "#22C55E",
                      "Délégué": "#8B5CF6"
                    };
                    return (
                      <Cell key={`cell-status-dashboard-${index}`} fill={colors[entry.name as keyof typeof colors]} />
                    );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "white", 
                    border: "1px solid #e5e7eb", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    return [`${value} (${props.payload.percentage}%)`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Troisième ligne de graphiques - Analyse par agence + Performance des techniciens */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px", marginTop: "24px" }}>
          {/* Analyse par agence */}
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            border: "1px solid rgba(229, 231, 235, 0.5)", 
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
            display: "flex", 
            flexDirection: "column" 
          }}>
            {/* CardHeader */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>
                Analyse par agence
              </h3>
            </div>
            {/* CardContent */}
            <div style={{ padding: "24px", paddingTop: "0", flex: 1 }}>
              {(() => {
                const agencyData = prepareAgencyAnalysisData();
                return agencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart 
                      data={agencyData} 
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        type="number" 
                        domain={[0, 60]}
                        ticks={[0, 15, 30, 45, 60]}
                        stroke="#6B7280" 
                        style={{ fontSize: "12px" }}
                      />
                      <YAxis 
                        dataKey="agence" 
                        type="category" 
                        stroke="#374151" 
                        style={{ fontSize: "12px" }} 
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ marginTop: "20px" }}
                        iconType="rect"
                      />
                      <Bar 
                        dataKey="Total" 
                        fill="#1A202C"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                      <Bar 
                        dataKey="Résolus" 
                        fill="#22C55E"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                      <Bar 
                        dataKey="En attente" 
                        fill="#FF9500"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    Aucune donnée à afficher
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Performance des techniciens */}
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            border: "1px solid rgba(229, 231, 235, 0.5)", 
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", 
            display: "flex", 
            flexDirection: "column",
            padding: "24px"
          }}>
            {/* CardHeader */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#333", margin: 0 }}>
                Performance des techniciens
              </h3>
            </div>
            
            {/* Graphique en barres verticales */}
            <div style={{ marginBottom: "24px" }}>
              {(() => {
                const techData = prepareTechnicianPerformanceData();
                return techData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart 
                      data={techData} 
                      margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
                    >
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
                      <YAxis 
                        domain={[0, 60]}
                        ticks={[0, 15, 30, 45, 60]}
                        stroke="#6B7280" 
                        style={{ fontSize: "12px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                        content={({ active, payload, label }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div style={{
                                backgroundColor: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                              }}>
                                <div style={{ color: "#111827", marginBottom: "4px" }}>
                                  {label}
                                </div>
                                <div style={{ color: "#FF9500" }}>
                                  Résolus : {payload[0].value}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="performance" 
                        fill="#FF9500"
                        stroke="#FF9500"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    Aucune donnée à afficher
                  </div>
                );
              })()}
            </div>

            {/* Liste détaillée des techniciens */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(() => {
                const techData = prepareTechnicianPerformanceData();
                return techData.map((tech, index) => {
                  // Identifier Seydou Wane et Backary DRAME pour appliquer des styles spécifiques
                  const isSeydouWane = tech.technicien.toLowerCase().includes("seydou") && tech.technicien.toLowerCase().includes("wane");
                  const isBackaryDrame = tech.technicien.toLowerCase().includes("backary") && tech.technicien.toLowerCase().includes("drame");
                  const isSpecialTechnician = isSeydouWane || isBackaryDrame;
                  
                  return (
                  <div 
                    key={`tech-dashboard-${tech.technicien}`}
                    style={{ 
                      background: isSpecialTechnician ? "#F5F5F5" : "#FFFFFF", 
                      borderRadius: "12px", 
                      border: "1px solid #F2F2F2", 
                      padding: isSpecialTechnician ? "10px 14px" : "16px 20px", 
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      minHeight: isSpecialTechnician ? "44px" : "56px",
                      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    }}
                  >
                    {/* Badge de rang */}
                    <div 
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: index === 0 
                          ? "#F5EDD4" // Rang 1 : Couleur exacte demandée
                          : "#E5E5E5", // Autres rangs : Gris clair
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: index === 0 
                          ? "#C4A941" // Rang 1 : Couleur exacte demandée
                          : "#262626", // Autres rangs : texte foncé
                        flexShrink: 0,
                        boxShadow: "none",
                        border: "none"
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Nom du technicien */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isSpecialTechnician ? "12px" : "14px", fontWeight: 600, color: "#262626" }}>
                        {tech.technicien}
                      </div>
                    </div>

                    {/* Temps moyen avec icône */}
                    <div 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: isSpecialTechnician ? "12px" : "14px",
                        fontWeight: 400,
                        color: isSpecialTechnician ? "#000000" : "#808080",
                        flexShrink: 0
                      }}
                    >
                      <Clock className="h-3 w-3" style={{ width: isSpecialTechnician ? "10px" : "12px", height: isSpecialTechnician ? "10px" : "12px", color: isSpecialTechnician ? "#000000" : "#808080" }} />
                      <span>{tech.avgTimeHours > 0 ? `${tech.avgTimeHours.toFixed(1)}h moy.` : "N/A"}</span>
                    </div>

                    {/* Badge de performance */}
                    <div 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        backgroundColor: "#D4F5E0",
                        color: "#1B8A3E",
                        padding: "6px 12px",
                        borderRadius: "14px",
                        fontSize: "13px",
                        fontWeight: 500,
                        minWidth: "60px",
                        height: "28px",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <TrendingUp className="h-4 w-4" style={{ width: "16px", height: "16px", color: "#1B8A3E" }} />
                      <span>{tech.performancePercent}%</span>
                    </div>
                  </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Section Tickets Récents pour DSI */}
      {userRole === "DSI" && (
        <>
          {/* Tableau des tickets récents */}
          <h3 style={{ marginTop: "32px", marginBottom: "12px", fontSize: "22px", fontWeight: "600", color: "#333" }}>
            Tickets Récents
          </h3>
          {/* Tickets Cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              overflow: "visible",
            }}
          >
            {(() => {
              // Appliquer les filtres puis trier les tickets par date de création (plus récents en premier) et prendre les 5 premiers
              let recentFilteredTickets = [...filteredTickets]
                .sort((a, b) => {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return dateB - dateA; // Tri décroissant (plus récent en premier)
                })
                .slice(0, 5); // Prendre les 5 premiers
              
              const recentTickets = recentFilteredTickets;

              if (recentTickets.length === 0) {
                return (
                  <div style={{ 
                    textAlign: "center", 
                    padding: "40px", 
                    color: "#999", 
                    fontWeight: "500",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}>
                    Aucun ticket
                  </div>
                );
              }

              return recentTickets.map((t) => {
                // Fonction helper pour obtenir les initiales
                const getInitials = (name: string) => {
                  if (!name) return "??";
                  const parts = name.split(" ");
                  if (parts.length >= 2) {
                    return (parts[0][0] + parts[1][0]).toUpperCase();
                  }
                  return name.substring(0, 2).toUpperCase();
                };

                // Fonction helper pour calculer la date relative
                const getRelativeTime = (date: string) => {
                  const now = new Date();
                  const past = new Date(date);
                  const diffInMs = now.getTime() - past.getTime();
                  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                  
                  if (diffInDays === 0) return "aujourd'hui";
                  if (diffInDays === 1) return "il y a 1 jour";
                  return `il y a ${diffInDays} jours`;
                };

                // Couleur de la barre selon la priorité (neutre si priorité non encore définie par DSI/Adjoint)
                const borderColor = !t.priority || t.priority === "faible" || t.priority === "non_definie" ? "rgba(107, 114, 128, 0.3)" :
                                   t.priority === "critique" ? "#E53E3E" : 
                                   t.priority === "haute" ? "#F59E0B" : 
                                   "#0DADDB";

                // Déterminer le type de ticket basé sur la catégorie
                const category = t.category || "";
                const isApplicatif = category.toLowerCase().includes("logiciel") || 
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
                    {/* Barre de priorité à gauche */}
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

                    {/* En-tête : ID + Badges + Menu 3 points */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", color: "#1f2937", fontFamily: "monospace", fontWeight: "600" }}>
                          {formatTicketNumber(t.number)}
                        </span>
                        
                        {/* Badge Statut */}
                        <span style={{
                          padding: t.status === "en_cours" ? "2px 10px" : "3px 8px",
                          borderRadius: "20px",
                          fontSize: t.status === "en_cours" ? "12px" : "10px",
                          fontWeight: "500",
                          background: t.status === "en_attente_analyse" ? "rgba(13, 173, 219, 0.1)" : 
                                     t.status === "assigne_technicien" ? "rgba(255, 122, 27, 0.1)" : 
                                     t.status === "en_cours" ? "rgba(15, 31, 61, 0.1)" : 
                                     t.status === "retraite" ? "#EDE7F6" : 
                                     t.status === "resolu" ? "rgba(47, 158, 68, 0.1)" : 
                                     t.status === "rejete" ? "#fee2e2" : 
                                     t.status === "cloture" ? "#e5e7eb" : "#e5e7eb",
                          color: t.status === "en_attente_analyse" ? "#0DADDB" : 
                                 t.status === "assigne_technicien" ? "#FF7A1B" : 
                                 t.status === "en_cours" ? "#0F1F3D" : 
                                 t.status === "retraite" ? "#4A148C" : 
                                 t.status === "resolu" ? "#2F9E44" : 
                                 t.status === "rejete" ? "#991b1b" : 
                                 t.status === "cloture" ? "#374151" : "#374151",
                          whiteSpace: "nowrap",
                        }}>
                          {t.status === "en_attente_analyse" ? "En attente d'assignation" :
                           t.status === "assigne_technicien" ? "Assigné" :
                           t.status === "en_cours" ? "En cours" :
                           t.status === "retraite" ? "Retraité" :
                           t.status === "resolu" ? "Résolu" :
                           t.status === "rejete" ? "Relancé" :
                           t.status === "cloture" ? "Clôturé" : t.status}
                        </span>

                        {/* Badge Priorité */}
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "20px",
                          fontSize: "10px",
                          fontWeight: "500",
                          background: t.priority === "critique" ? "rgba(229, 62, 62, 0.1)" : 
                                     t.priority === "haute" ? "rgba(245, 158, 11, 0.1)" : 
                                     t.priority === "moyenne" ? "rgba(13, 173, 219, 0.1)" : 
                                     t.priority === "faible" ? "#E5E7EB" : t.priority === "non_definie" ? "#E5E7EB" : "#e5e7eb",
                          color: t.priority === "critique" ? "#E53E3E" : 
                                 t.priority === "haute" ? "#F59E0B" : 
                                 t.priority === "moyenne" ? "#0DADDB" : 
                                 t.priority === "faible" ? "#6B7280" : t.priority === "non_definie" ? "#6B7280" : "#374151",
                          whiteSpace: "nowrap",
                        }}>
                          {t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) : "—"}
                        </span>

                        {/* Badge Catégorie */}
                        {t.category && (
                          <span style={{
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
                          }}>
                            {isApplicatif ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                              </svg>
                            )}
                            <span>{categoryType}</span>
                          </span>
                        )}
                      </div>

                      {/* Menu 3 points ou icône œil (pour clôturé) */}
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
                              height: "32px"
                            }}
                            title="Voir les détails"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        ) : (
                          <>
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
                                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='5' r='2' fill='%23475569'/><circle cx='12' cy='12' r='2' fill='%23475569'/><circle cx='12' cy='19' r='2' fill='%23475569'/></svg>\")",
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
                          </>
                        )}
                      </div>
                    </div>

                    {/* Titre du ticket */}
                    <h4 style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#1f2937",
                      marginBottom: "6px",
                      lineHeight: "1.3",
                    }}>
                      {t.title}
                    </h4>

                    {/* Description du ticket */}
                    <p style={{
                      fontSize: "13px",
                      color: "#6b7280",
                      marginBottom: "12px",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {t.description || "Aucune description"}
                    </p>

                    {/* Pied de carte : Créateur, Date, Agence, Assigné */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Avatar + Nom créateur */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <div style={{
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
                          }}>
                            {getInitials(t.creator?.full_name || "Inconnu")}
                          </div>
                          <span style={{ fontSize: "12px", color: "#374151", fontWeight: "500" }}>
                            {t.creator?.full_name || "N/A"}
                          </span>
                        </div>

                        {/* Séparateur */}
                        <span style={{ color: "#d1d5db" }}>•</span>

                        {/* Date relative */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {t.created_at ? getRelativeTime(t.created_at) : "N/A"}
                          </span>
                        </div>

                        {/* Séparateur */}
                        <span style={{ color: "#d1d5db" }}>•</span>

                        {/* Agence */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                          </svg>
                          <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            {t.creator ? (t.creator.agency || t.user_agency || "N/A") : (t.user_agency || "N/A")}
                          </span>
                        </div>

                        {/* Flèche + Technicien assigné si présent */}
                        {t.technician?.full_name && (
                          <>
                            {/* Flèche */}
                            <span style={{ color: "#d1d5db" }}>→</span>

                            {/* Avatar + Nom technicien */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "rgba(250, 124, 21, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: "600",
                                color: "#FA7C15",
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}>
                                {getInitials(t.technician.full_name)}
                              </div>
                              <span style={{ 
                                fontSize: "12px", 
                                color: "#0E1424", 
                                fontWeight: "500",
                                fontFamily: "Inter, system-ui, sans-serif",
                              }}>
                                {t.technician.full_name}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Espace vide pour l'alignement si besoin */}
                      {!t.technician?.full_name && (
                        <div></div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      {/* Vue d'ensemble globale - Graphiques pour l'administrateur */}
      {/* Section masquée selon demande utilisateur */}
      {false && userRole === "Admin" && (
      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>
          Vue d'ensemble de l'application
        </h2>
        <p style={{ fontSize: "14px", color: "#4b5563", marginBottom: "24px" }}>
          Synthèse globale de l'activité : volumes, statuts, priorités, agences, types et rythmes de création
        </p>

        {/* Ligne 1 : Volume dans le temps + Répartition par statut */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)", gap: "24px", marginBottom: "24px" }}>
          {/* Volume de tickets (30 jours) */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Volume de tickets (30 derniers jours)
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={prepareTimeSeriesData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
        borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="créés"
                  name="Créés"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="résolus"
                  name="Résolus"
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>

          {/* Répartition par statut */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Répartition par statut
            </h3>
            {(() => {
              const statusData = [
                { name: "En attente", value: allTickets.filter((t) => t.status === "en_attente_analyse").length, color: "#f97316" },
                { name: "Assignés / En cours", value: allTickets.filter((t) => t.status === "assigne_technicien" || t.status === "en_cours").length, color: "#3b82f6" },
                { name: "Résolus", value: allTickets.filter((t) => t.status === "resolu").length, color: "#22c55e" },
                { name: "Clôturés", value: allTickets.filter((t) => t.status === "cloture").length, color: "#facc15" },
                { name: "Relancés", value: allTickets.filter((t) => t.status === "rejete").length, color: "#ef4444" }
              ].filter(item => item.value > 0);

              return statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, _name: any, props: any) =>
                        [`${value} ticket(s)`, props.payload.name]
                      }
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
        </div>
              );
            })()}
        </div>
      </div>

        {/* Ligne 2 : Priorités + Types (Matériel/Applicatif) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px", marginBottom: "24px" }}>
          {/* Répartition par priorité */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Répartition par priorité
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={preparePriorityEvolutionData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="priorité" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                />
                <Legend />
                <Bar dataKey="nombre" radius={[8, 8, 0, 0]}>
                  {preparePriorityEvolutionData().map((entry, index) => {
                    const priorityColors: { [key: string]: string } = {
                      'Critique': '#E53E3E',
                      'Haute': '#F59E0B',
                      'Moyenne': '#0DADDB',
                      'Faible': '#6b7280',
                      'Non définie': '#6b7280'
                    };
                    return <Cell key={`cell-priority-${index}`} fill={priorityColors[entry.priorité] || '#3b82f6'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par type (Matériel/Applicatif) */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Répartition par type
            </h3>
            {(() => {
              const typeData = [
                { name: "Matériel", value: allTickets.filter((t) => t.type === "materiel").length, color: "#8b5cf6" },
                { name: "Applicatif", value: allTickets.filter((t) => t.type === "applicatif").length, color: "#06b6d4" }
              ].filter(item => item.value > 0);

              return typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-type-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, _name: any, props: any) =>
                        [`${value} ticket(s)`, props.payload.name]
                      }
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                </div>
              );
            })()}
          </div>
        </div>

        {/* Ligne 3 : Agences + Jours de la semaine */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: "24px", marginBottom: "24px" }}>
          {/* Tickets par agence */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Tickets par agence
            </h3>
            {(() => {
              const agencyData = prepareAgencyData().slice(0, 10); // Top 10 agences
              return agencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={agencyData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <YAxis dataKey="agence" type="category" stroke="#6b7280" style={{ fontSize: "12px" }} width={90} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="tickets" 
                      radius={[0, 8, 8, 0]}
                      fill="#4b5563"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                </div>
              );
            })()}
          </div>

          {/* Pics d'activité par jour */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Pics d'activité (jours de la semaine)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareDayOfWeekData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="jour" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                />
                <Legend />
                <Bar dataKey="tickets" radius={[8, 8, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ligne 4 : Évolution par statut (7 derniers jours) */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Évolution par statut (7 derniers jours)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={prepareStatusEvolutionData()}>
                <defs>
                  <linearGradient id="colorEnAttente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorEnCours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorResolus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorClotures" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "12px" }} />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                            border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="En attente" stackId="1" stroke="#f97316" fill="url(#colorEnAttente)" />
                <Area type="monotone" dataKey="En cours" stackId="1" stroke="#3b82f6" fill="url(#colorEnCours)" />
                <Area type="monotone" dataKey="Résolus" stackId="1" stroke="#22c55e" fill="url(#colorResolus)" />
                <Area type="monotone" dataKey="Clôturés" stackId="1" stroke="#facc15" fill="url(#colorClotures)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ligne 5 : Utilisateurs par rôle + Techniciens par spécialisation */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "24px", marginBottom: "24px" }}>
          {/* Répartition des utilisateurs par rôle */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Répartition des utilisateurs par rôle
            </h3>
            {(() => {
              const roleData = prepareUsersByRoleData();
              return roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="nombre"
                      nameKey="rôle"
                    >
                      {roleData.map((entry, index) => {
                        const roleColors: { [key: string]: string } = {
                          'Admin': '#ef4444',
                          'DSI': '#3b82f6',
                          'Secrétaire': '#22c55e',
                          'Adjoint DSI': '#f97316',
                          'Technicien': '#8b5cf6',
                          'Utilisateur': '#6b7280',
                          'Sans rôle': '#9ca3af'
                        };
                        return <Cell key={`cell-role-${index}`} fill={roleColors[entry.rôle] || '#9ca3af'} />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, _name: any, props: any) =>
                        [`${value} utilisateur(s)`, props.payload.rôle]
                      }
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                </div>
              );
            })()}
          </div>

          {/* Répartition des techniciens par spécialisation */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Répartition des techniciens par spécialisation
            </h3>
            {(() => {
              const specData = prepareTechniciansBySpecializationData();
              return specData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={specData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="nombre"
                      nameKey="spécialisation"
                    >
                      {specData.map((entry, index) => {
                        const specColors: { [key: string]: string } = {
                          'materiel': '#8b5cf6',
                          'applicatif': '#06b6d4',
                          'Non spécifié': '#9ca3af'
                        };
                        return <Cell key={`cell-spec-${index}`} fill={specColors[entry.spécialisation] || '#9ca3af'} />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, _name: any, props: any) => {
                        const displayName = props.payload.spécialisation === 'materiel' ? 'Matériel' : 
                                          props.payload.spécialisation === 'applicatif' ? 'Applicatif' : props.payload.spécialisation;
                        return [`${value} technicien(s)`, displayName];
                      }}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value: string) => {
                        if (value === 'materiel') return 'Matériel';
                        if (value === 'applicatif') return 'Applicatif';
                        return value;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                </div>
              );
            })()}
          </div>
        </div>

        {/* Ligne 6 : Charge de travail par technicien + Utilisateurs les plus actifs */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)", gap: "24px", marginBottom: "24px" }}>
          {/* Charge de travail par technicien */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Charge de travail par technicien (Top 10)
            </h3>
            {(() => {
              const workloadData = prepareTechnicianWorkloadData();
              return workloadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={workloadData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <YAxis dataKey="technicien" type="category" stroke="#6b7280" style={{ fontSize: "12px" }} width={110} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="assignés" radius={[0, 0, 0, 0]} fill="#3b82f6" name="Assignés" />
                    <Bar dataKey="résolus" radius={[0, 8, 8, 0]} fill="#22c55e" name="Résolus" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                </div>
              );
            })()}
          </div>

          {/* Utilisateurs les plus actifs */}
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Utilisateurs les plus actifs (Top 10)
            </h3>
            {(() => {
              const activeUsersData = prepareMostActiveUsersData();
              return activeUsersData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={activeUsersData} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <YAxis dataKey="utilisateur" type="category" stroke="#6b7280" style={{ fontSize: "12px" }} width={110} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="tickets" 
                      radius={[0, 8, 8, 0]}
                      fill="#8b5cf6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                        </div>
              );
            })()}
                    </div>
        </div>

        {/* Ligne 7 : Temps moyen de résolution par type */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 6px 18px rgba(15,23,42,0.06)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
              Temps moyen de résolution par type (en heures)
            </h3>
            {(() => {
              const resolutionTimeData = prepareResolutionTimeByTypeData();
              return resolutionTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="type" stroke="#6b7280" style={{ fontSize: "12px" }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} label={{ value: 'Heures', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value} heures`, 'Temps moyen']}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="tempsMoyen" radius={[8, 8, 0, 0]}>
                      {resolutionTimeData.map((entry, index) => {
                        const typeColors: { [key: string]: string } = {
                          'Matériel': '#8b5cf6',
                          'Applicatif': '#06b6d4'
                        };
                        return <Cell key={`cell-resolution-${index}`} fill={typeColors[entry.type] || '#3b82f6'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                  Aucune donnée à afficher
                </div>
              );
          })()}
          </div>
        </div>
      </div>
      )}

</>
  );
}
