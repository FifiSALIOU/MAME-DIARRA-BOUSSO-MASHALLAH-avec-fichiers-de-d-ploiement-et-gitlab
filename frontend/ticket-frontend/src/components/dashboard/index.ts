/**
 * Emplacement des sections du dashboard DSI/Admin.
 * Chaque section (Tickets, Actifs, Techniciens, etc.) doit être un composant ici :
 * - TicketsSection.tsx
 * - ActifsSection.tsx
 * - TypesSection.tsx
 * - CategoriesSection.tsx
 * - PrioritesSection.tsx
 * - TechniciensSection.tsx
 * - UsersSection.tsx
 * - RolesSection.tsx
 * - DepartementsSection.tsx
 * - ReportsSection.tsx
 * - MaintenanceSection.tsx
 * - AuditLogsSection.tsx
 * - SettingsSection.tsx (apparence, email, securite)
 * - NotificationsSection.tsx
 * - DashboardHomeSection.tsx (tableau de bord accueil)
 *
 * Pour l’instant le contenu reste dans DSIDashboard.tsx / AdminDashboard.tsx.
 * Les extraire ici sans modifier le comportement.
 *
 * Organisation : src/types, src/utils, src/services, src/hooks, src/components/ui,
 * src/components/dashboard, src/pages, src/assets — chaque chose à sa place.
 */
export { DepartementsSection } from "./DepartementsSection.tsx";
export { AuditLogsSection } from "./AuditLogsSection.tsx";
export { MaintenanceSection } from "./MaintenanceSection.tsx";
