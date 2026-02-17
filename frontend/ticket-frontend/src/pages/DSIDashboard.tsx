import { useEffect, useState, useRef, startTransition } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Bell,
  BarChart3,
  Search,
  CheckCircle2,
  Clock,
  Box,
  FileText,
  RefreshCcw,
  PlusCircle,
  UserCog,
  Layers,
  X,
  FolderTree,
  Settings,
  MessageCircle,
  Flag,
  MapPin,
  Lock,
  Send,
} from "lucide-react";
import React from "react";
import helpdeskLogo from "../assets/helpdesk-logo.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Ticket, Technician, Notification, TicketHistory, TicketComment, UserRead, Asset, AssetTypeConfig, DepartmentConfig, AssetFormState } from "../types";
import { CustomLabel } from "../components/ui/CustomLabel.tsx";
import { DepartementsSection } from "../components/dashboard/DepartementsSection.tsx";
import { AuditLogsSection } from "../components/dashboard/AuditLogsSection.tsx";
import { MaintenanceSection } from "../components/dashboard/MaintenanceSection.tsx";
import { ActifsSection } from "../components/dashboard/ActifsSection.tsx";
import { TicketsSection } from "../components/dashboard/TicketsSection.tsx";
import { TypesSection } from "../components/dashboard/TypesSection.tsx";
import { CategoriesSection } from "../components/dashboard/CategoriesSection.tsx";
import { PrioritesSection } from "../components/dashboard/PrioritesSection.tsx";
import { TechniciensSection } from "../components/dashboard/TechniciensSection.tsx";
import { GroupesSection } from "../components/dashboard/GroupesSection.tsx";
import { UsersSection } from "../components/dashboard/UsersSection.tsx";
import { RolesSection } from "../components/dashboard/RolesSection.tsx";
import { EmailSection } from "../components/dashboard/EmailSection.tsx";
import { ReportsSection } from "../components/dashboard/ReportsSection.tsx";
import { SecuriteSection } from "../components/dashboard/SecuriteSection.tsx";
import { DashboardSection } from "../components/dashboard/DashboardSection.tsx";

interface DSIDashboardProps {
  token: string;
}

function DSIDashboard({ token }: DSIDashboardProps) {
  const [searchParams] = useSearchParams();
  
  // Fonction helper pour formater le numéro de ticket en "TKT-XXX"
  const formatTicketNumber = (number: number): string => {
    return `TKT-${number.toString().padStart(3, '0')}`;
  };
  
  // Fonction pour formater le message de notification en remplaçant #X par TKT-XXX
  const formatNotificationMessage = (message: string): string => {
    return message.replace(/#(\d+)/g, (match, number) => {
      void match;
      return formatTicketNumber(parseInt(number, 10));
    });
  };

  // Fonction pour obtenir le libellé d'une priorité
  function getPriorityLabel(priority: string): string {
    switch (priority) {
      case "non_definie": return "Non définie";
      case "faible": return "Faible";
      case "moyenne": return "Moyenne";
      case "haute": return "Haute";
      case "critique": return "Critique";
      default: return priority ? (priority === "non_definie" ? "Non définie" : priority) : "Non définie";
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "en_attente_analyse": return "En attente d'assignation";
      case "assigne_technicien": return "Assigné au technicien";
      case "en_cours": return "En cours";
      case "resolu": return "Résolu";
      case "rejete": return "Relancé";
      case "retraite": return "Retraité";
      case "cloture": return "Clôturé";
      default: return status;
    }
  }

  // Fonction helper pour déterminer l'icône et les couleurs de la timeline d'historique
  const getHistoryVisuals = (entry: TicketHistory) => {
    const status = (entry.new_status || "").toLowerCase();
    const oldStatus = (entry.old_status || "").toLowerCase();
    const reason = (entry.reason || "").toLowerCase();

    let Icon = Clock;
    let iconBg = "#F3F4F6";
    let iconBorder = "#E5E7EB";
    let iconColor = "#111827";

    if (reason.startsWith("commentaire:") || reason.startsWith("commentaire :")) {
      Icon = MessageCircle;
      iconBg = "#EFF6FF";
      iconBorder = "#BFDBFE";
      iconColor = "#1D4ED8";
      return { Icon, iconBg, iconBorder, iconColor };
    }
    if (!entry.old_status || entry.new_status === "creation") {
      // Création du ticket
      Icon = FileText;
    } else if (
      // Détecter délégation à l'Adjoint DSI (en_attente_analyse → en_attente_analyse avec reason contenant "délégation")
      entry.old_status &&
      (oldStatus.includes("en_attente_analyse") || oldStatus.includes("en attente analyse")) &&
      (status.includes("en_attente_analyse") || status.includes("en attente analyse")) &&
      (reason.includes("délégation") || reason.includes("délégu") || reason.includes("delegat"))
    ) {
      // Délégation à l'Adjoint DSI
      Icon = Users;
    } else if (status.includes("assigne") || status.includes("assigné") || status.includes("assign")) {
      // Assignation
      Icon = UserCheck;
    } else if (status.includes("deleg") || status.includes("délégu")) {
      // Délégation (autres cas)
      Icon = Users;
    } else if (
      // Détecter rejet de résolution (resolu ou retraite → rejete avec Validation utilisateur: Rejeté)
      entry.old_status &&
      (oldStatus.includes("resolu") || oldStatus.includes("résolu") || oldStatus.includes("retraite") || oldStatus.includes("retraité")) &&
      (status.includes("rejete") || status.includes("rejeté")) &&
      reason.includes("validation utilisateur: rejeté")
    ) {
      // Ticket relancé (rejet de résolution)
      Icon = RefreshCcw;
    } else if (
      status.includes("resolu") ||
      status.includes("résolu") ||
      status.includes("valide") ||
      status.includes("validé") ||
      status.includes("cloture") ||
      status.includes("clôture") ||
      status.includes("retraite") ||
      status.includes("retraité")
    ) {
      // Résolution / validation / retraite : même icône "Résolu" (coche verte)
      Icon = CheckCircle2;
      iconBg = "#ECFDF3";
      iconBorder = "#BBF7D0";
      iconColor = "#166534";
    } else if (status.includes("relance") || status.includes("relancé")) {
      // Relance
      Icon = RefreshCcw;
    }

    return { Icon, iconBg, iconBorder, iconColor };
  };

  // Formate la date/heure pour l'historique (ex. "25 janv. 2026 à 10:36")
  const formatHistoryDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString("fr-FR", { day: "2-digit" });
    const month = d.toLocaleDateString("fr-FR", { month: "short" });
    const year = d.toLocaleDateString("fr-FR", { year: "numeric" });
    const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${month} ${year} à ${time}`;
  };

  // Fonction helper pour déterminer le titre principal d'une entrée d'historique (pour DSI, affiche "ancien → nouveau")
  const getHistoryTitle = (entry: TicketHistory, ticket?: Ticket | null): string => {
    if (!entry.old_status) {
      return "Création du ticket";
    }
    const reason = (entry.reason || "").toLowerCase();
    if (reason.startsWith("commentaire:") || reason.startsWith("commentaire :")) {
      return "Commentaire ajouté";
    }
    const oldStatus = (entry.old_status || "").toLowerCase();
    const newStatus = (entry.new_status || "").toLowerCase();
    
    // Cas spécifique: délégation à l'Adjoint DSI (en_attente_analyse → en_attente_analyse avec "Délégation au Adjoint DSI")
    if ((oldStatus.includes("en_attente_analyse") || oldStatus.includes("en attente analyse")) &&
        (newStatus.includes("en_attente_analyse") || newStatus.includes("en attente analyse")) &&
        (reason.includes("délégation") || reason.includes("délégu") || reason.includes("delegat"))) {
      // Essayer d'obtenir le nom de l'Adjoint depuis le ticket (secretary_id)
      if (ticket && ticket.secretary_id && allUsers.length > 0) {
        const adjoint = allUsers.find((u: any) => String(u.id) === String(ticket.secretary_id));
        if (adjoint && adjoint.full_name) {
          return `Ticket Délégué à ${adjoint.full_name}`;
        }
      }
      // Si pas de nom trouvé, utiliser "Adjoint DSI" par défaut
      return "Ticket Délégué à Adjoint DSI";
    }
    
    // Cas spécifique: réassignation (assigne_technicien → assigne_technicien) : afficher "Réassigné à [nom]"
    if ((oldStatus.includes("assigne_technicien") || oldStatus.includes("assigné technicien")) &&
        (newStatus.includes("assigne_technicien") || newStatus.includes("assigné technicien"))) {
      if (reason.startsWith("réassigné à ")) {
        return (entry.reason || "").split(".")[0].trim();
      }
      return ticket?.technician?.full_name ? `Réassigné à ${ticket.technician.full_name}` : "Réassigné à un technicien";
    }
    
    // Cas spécifique: assignation (en_attente_analyse → assigne_technicien)
    if ((oldStatus.includes("en_attente_analyse") || oldStatus.includes("en attente analyse")) &&
        (newStatus.includes("assigne_technicien") || newStatus.includes("assigne technicien") || newStatus.includes("assigné technicien"))) {
      const assignMatch = (entry.reason || "").match(/Assigné à ([^|.]+?)(?:\s*[|.]|$)/i);
      if (assignMatch && assignMatch[1]) {
        return `Assigné à ${assignMatch[1].trim()}`;
      }
      if (ticket && ticket.technician && ticket.technician.full_name) {
        return `Assigné à ${ticket.technician.full_name}`;
      }
      return "Assigné à technicien";
    }
    
    // Cas spécifique: technicien prend en charge (assigne_technicien → en_cours)
    if ((oldStatus.includes("assigne_technicien") || oldStatus.includes("assigne technicien") || oldStatus.includes("assigné technicien")) &&
        (newStatus.includes("en_cours") || newStatus.includes("en cours"))) {
      return "Ticket en cours de traitement";
    }
    
    // Cas spécifique: rejet de résolution par l'utilisateur (resolu ou retraite → rejete) : afficher "Ticket relancé"
    if ((oldStatus.includes("resolu") || oldStatus.includes("résolu") || oldStatus.includes("retraite") || oldStatus.includes("retraité")) &&
        (newStatus.includes("rejete") || newStatus.includes("rejeté"))) {
      return "Ticket relancé";
    }
    
    // Cas spécifique: reprise du ticket après relance (rejete → en_cours)
    if ((oldStatus.includes("rejete") || oldStatus.includes("rejeté")) &&
        (newStatus.includes("en_cours") || newStatus.includes("en cours"))) {
      return "Ticket repris en charge par le technicien";
    }
    
    // Cas spécifique: réouverture et réassignation (rejete → assigne_technicien) : afficher "Réouverture du ticket"
    if ((oldStatus.includes("rejete") || oldStatus.includes("rejeté")) &&
        (newStatus.includes("assigne_technicien") || newStatus.includes("assigne technicien") || newStatus.includes("assigné technicien"))) {
      return "Réouverture du ticket";
    }
    
    // Cas spécifique: technicien résout le ticket (en_cours → resolu)
    if ((oldStatus.includes("en_cours") || oldStatus.includes("en cours")) &&
        (newStatus.includes("resolu") || newStatus.includes("résolu"))) {
      // Afficher "Résolu par [nom du technicien]" si disponible
      if (entry.user && entry.user.full_name) {
        return `Résolu par ${entry.user.full_name}`;
      }
      return "Résolu par technicien";
    }
    
    // Cas spécifique: validation et clôture par l'utilisateur (resolu ou retraite → cloture avec "Validation utilisateur: Validé")
    if ((oldStatus.includes("resolu") || oldStatus.includes("résolu") || oldStatus.includes("retraite") || oldStatus.includes("retraité")) &&
        (newStatus.includes("cloture") || newStatus.includes("clôture")) &&
        (reason.includes("validation utilisateur: validé") || reason.includes("validation utilisateur: validé"))) {
      // Afficher "Validé par [nom de l'utilisateur]" si disponible
      if (entry.user && entry.user.full_name) {
        return `Validé par ${entry.user.full_name}`;
      }
      return "Validé par utilisateur";
    }
    
    // Cas spécifique: passage en retraite (ex. en_cours → retraite) : afficher uniquement "Retraité"
    if (newStatus.includes("retraite") || newStatus.includes("retraité")) {
      return "Retraité";
    }
    
    // Pour le DSI, on affiche toujours le format "ancien → nouveau"
    return `${entry.old_status} → ${entry.new_status}`;
  };

  // Historique affiché : "Création du ticket" en premier, puis le reste trié par date ascendante
  const getDisplayHistory = (ticket: Ticket, history: TicketHistory[]): TicketHistory[] => {
    const creation: TicketHistory = {
      id: `creation-${ticket.id}`,
      ticket_id: ticket.id,
      old_status: null,
      new_status: "creation",
      user_id: "",
      reason: null,
      changed_at: ticket.created_at ?? new Date().toISOString(),
      user: ticket.creator ? { full_name: ticket.creator.full_name } : null,
    };
    // Filtrer les entrées d'historique pour exclure les modifications par l'utilisateur
    const rest = history.filter((h) => {
      // Garder toutes les entrées qui ont un old_status
      if (h.old_status == null) return false;
      
      // Exclure les modifications par l'utilisateur
      const reason = (h.reason || "").toLowerCase();
      const isUserModification = reason.includes("ticket modifié par l'utilisateur") || 
                                  reason.includes("modifié par l'utilisateur") ||
                                  reason.includes("modification par l'utilisateur");
      
      // Vérifier si l'utilisateur qui a fait l'action est le créateur du ticket
      const isCreatorAction = ticket.creator && 
                              h.user && 
                              h.user.full_name === ticket.creator.full_name;
      
      // Exclure si c'est une modification par l'utilisateur créateur
      if (isUserModification && isCreatorAction) {
        return false;
      }
      
      return true;
    });
    const combined = [creation, ...rest];
    combined.sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
    return combined;
  };

  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState<string>("");
  const [assignmentPriority, setAssignmentPriority] = useState<string>("moyenne");
  const [activePrioritiesForAssign, setActivePrioritiesForAssign] = useState<Array<{ id: number; code: string; label: string; color_hex?: string | null; display_order: number }>>([]);
  const [reopenTicketId, setReopenTicketId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [loadingRejectionReason, setLoadingRejectionReason] = useState<boolean>(false);
  const [ticketDetails, setTicketDetails] = useState<Ticket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<TicketHistory[]>([]);
  const [ticketComments, setTicketComments] = useState<TicketComment[]>([]);
  const [detailCommentText, setDetailCommentText] = useState("");
  const [detailCommentInternal, setDetailCommentInternal] = useState(true);
  const [showTicketDetailsPage, setShowTicketDetailsPage] = useState<boolean>(false);
  const [showReopenModal, setShowReopenModal] = useState<boolean>(false);
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [reassignTicketId, setReassignTicketId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [assignTicketId, setAssignTicketId] = useState<string | null>(null);
  const [showDelegateModal, setShowDelegateModal] = useState<boolean>(false);
  const [delegateTicketId, setDelegateTicketId] = useState<string | null>(null);
  const [selectedAdjoint, setSelectedAdjoint] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [ticketsSectionReady, setTicketsSectionReady] = useState(false);
  const ticketsSectionReadyRef = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<{
    openTickets: number;
    avgResolutionTime: string | null;
    userSatisfaction: string | null;
  }>({
    openTickets: 0,
    avgResolutionTime: null,
    userSatisfaction: null,
  });
  const [, setTechniciansSatisfaction] = useState<string>("0.0");
  const [reopenedTicketsCount, setReopenedTicketsCount] = useState<number>(0);
  const [reopeningCalculated, setReopeningCalculated] = useState<boolean>(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  // Filtres visuels pour les actifs (DSI/Admin) – n'affectent pas la logique
  const [assetStatusFilter, setAssetStatusFilter] = useState<string>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all");
  const [assetDepartmentFilter, setAssetDepartmentFilter] = useState<string>("all");
  const [assetSearchQuery, setAssetSearchQuery] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [showAssetModal, setShowAssetModal] = useState<boolean>(false);
  const [assetModalMode, setAssetModalMode] = useState<"create" | "edit">("create");
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormState>({
    nom: "",
    type: "desktop",
    statut: "en_stock",
    numero_de_serie: "",
    marque: "",
    modele: "",
    localisation: "",
    departement: "",
    assigned_to_user_id: "",
    date_d_achat: "",
    date_de_fin_garantie: "",
    prix_d_achat: "",
    fournisseur: "",
    notes: "",
  });

  const [assetTypes, setAssetTypes] = useState<AssetTypeConfig[]>([]);
  const [assetDepartments, setAssetDepartments] = useState<DepartmentConfig[]>([]);

  // États pour la gestion des départements
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentConfig | null>(null);
  const [departmentName, setDepartmentName] = useState("");

  // KPIs calculés à partir des actifs chargés
  const totalAssets = assets.length;
  const inServiceCount = assets.filter((a) => a.statut === "in_service").length;
  const inMaintenanceCount = assets.filter((a) => a.statut === "en_maintenance").length;
  const inPanneCount = assets.filter((a) => a.statut === "en_panne").length;
  const inStockCount = assets.filter((a) => a.statut === "en_stock").length;
  const reformedCount = assets.filter((a) => a.statut === "reformes").length;
  const totalValue = assets.reduce((sum, a) => sum + (a.prix_d_achat || 0), 0);
  const warrantiesExpiringCount = assets.filter((a) => {
    if (!a.date_de_fin_garantie) return false;
    const end = new Date(a.date_de_fin_garantie);
    const now = new Date();
    const diffDays = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const location = useLocation();
  const _navigate = useNavigate();
  
  // Fonction pour déterminer la section depuis l'URL au montage
  const getInitialSection = (): string => {
    const path = location.pathname;
    if (path === "/dashboard/dsi/notifications") return "notifications";
    if (path === "/dashboard/dsi/audit-logs") return "audit-logs";
    if (path === "/dashboard/dsi/maintenance") return "maintenance";
    if (path === "/dashboard/dsi/reports") return "reports";
    if (path === "/dashboard/dsi/users") return "users";
    if (path === "/dashboard/dsi/roles") return "roles";
    if (path === "/dashboard/dsi/technicians") return "technicians";
    if (path === "/dashboard/dsi/actifs") return "actifs";
    if (path === "/dashboard/dsi/types") return "types";
    if (path === "/dashboard/dsi/categories") return "categories";
    if (path === "/dashboard/dsi/parametres/priorites") return "priorites";
    if (path === "/dashboard/dsi/tickets") return "tickets";
    if (path === "/dashboard/dsi/departements") return "departements";
    if (path === "/dashboard/dsi") return "dashboard";
    return "dashboard";
  };
  
  // État local pour la navigation instantanée (DSI)
  const [activeSection, setActiveSection] = useState<string>(getInitialSection());
  // Flag pour désactiver la synchronisation URL lors des clics internes (DSI)
  const isInternalNavigationRef = useRef(false);
  
  // Déterminer activeSection depuis l'URL (DSI : uniquement routes /dashboard/dsi)
  const getActiveSectionFromPath = (): string => {
    const path = location.pathname;
    if (path === "/dashboard/dsi/notifications") return "notifications";
    if (path === "/dashboard/dsi/audit-logs") return "audit-logs";
    if (path === "/dashboard/dsi/maintenance") return "maintenance";
    if (path === "/dashboard/dsi/reports") return "reports";
    if (path === "/dashboard/dsi/users") return "users";
    if (path === "/dashboard/dsi/roles") return "roles";
    if (path === "/dashboard/dsi/technicians") return "technicians";
    if (path === "/dashboard/dsi/actifs") return "actifs";
    if (path === "/dashboard/dsi/types") return "types";
    if (path === "/dashboard/dsi/categories") return "categories";
    if (path === "/dashboard/dsi/parametres/priorites") return "priorites";
    if (path === "/dashboard/dsi/tickets") return "tickets";
    if (path === "/dashboard/dsi/departements") return "departements";
    if (path === "/dashboard/dsi") return "dashboard";
    return "dashboard";
  };
  
  // Pour DSI : utiliser activeSection directement pour une navigation instantanée
  // La synchronisation avec l'URL se fait uniquement au montage ou si l'URL change depuis l'extérieur
  const showTicketsPlaceholder = activeSection === "tickets" && !ticketsSectionReady;

  // Afficher la section Tickets : d'abord "En chargement", puis le contenu au frame suivant (DSI)
  // Le chargement ne bloque pas la navigation - on peut changer de section même pendant "En chargement"
  useEffect(() => {
    // Annuler immédiatement tout requestAnimationFrame en cours quand on change de section
    if (ticketsSectionReadyRef.current !== null) {
      cancelAnimationFrame(ticketsSectionReadyRef.current);
      ticketsSectionReadyRef.current = null;
    }
    
    if (activeSection === "tickets") {
      // Utiliser requestAnimationFrame pour afficher "En chargement" brièvement
      // Mais la navigation reste possible même pendant ce temps
      ticketsSectionReadyRef.current = requestAnimationFrame(() => {
        // Vérifier qu'on est toujours sur la section Tickets avant de mettre à jour
        if (activeSection === "tickets") {
          setTicketsSectionReady(true);
        }
        ticketsSectionReadyRef.current = null;
      });
      return () => {
        if (ticketsSectionReadyRef.current !== null) {
          cancelAnimationFrame(ticketsSectionReadyRef.current);
          ticketsSectionReadyRef.current = null;
        }
        setTicketsSectionReady(false);
      };
    } else {
      // Réinitialiser immédiatement quand on quitte la section Tickets
      setTicketsSectionReady(false);
    }
  }, [activeSection]);

  // Fonction helper pour changer de section (DSI) - désactive la synchronisation URL temporairement
  const changeSectionForDSI = (section: string) => {
    // Annuler immédiatement tout chargement en cours de la section Tickets
    if (ticketsSectionReadyRef.current !== null) {
      cancelAnimationFrame(ticketsSectionReadyRef.current);
      ticketsSectionReadyRef.current = null;
    }
    setTicketsSectionReady(false);
    
    // Changer de section immédiatement
    isInternalNavigationRef.current = true;
    setActiveSection(section);
    // Réactiver la synchronisation après un court délai pour permettre les changements d'URL externes
    setTimeout(() => {
      isInternalNavigationRef.current = false;
    }, 100);
  };

  // Synchroniser activeSection avec l'URL pour DSI (uniquement au montage ou si l'URL change depuis l'extérieur)
  // La navigation interne utilise maintenant changeSectionForDSI pour être instantanée
  useEffect(() => {
    // Ignorer la synchronisation si c'est une navigation interne (clic utilisateur)
    if (isInternalNavigationRef.current) {
      return;
    }
    const sectionFromPath = getActiveSectionFromPath();
    // Ne mettre à jour que si la section a vraiment changé pour éviter les re-renders inutiles
    if (activeSection !== sectionFromPath) {
      setActiveSection(sectionFromPath);
    }
  }, [location.pathname, activeSection]);

  // Fermer la vue "détails du ticket" quand on change de section (ex: Actifs, Types, Catégories) pour afficher le contenu de la section
  useEffect(() => {
    if (activeSection !== "dashboard" && activeSection !== "tickets") {
      setShowTicketDetailsPage(false);
    }
  }, [activeSection]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agencyFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [delegationFilter, setDelegationFilter] = useState<string>("all");
  // États pour les filtres avancés de la section Tickets (DSI)
  const [advancedPeriodRange, setAdvancedPeriodRange] = useState<{ from: Date | undefined; to?: Date | undefined } | undefined>(undefined);
  const [showPeriodCalendar, setShowPeriodCalendar] = useState<boolean>(false);
  const periodCalendarRef = useRef<HTMLDivElement>(null);
  const [advancedMonthFilter] = useState<string>("all");
  const [advancedAgencyFilter, setAdvancedAgencyFilter] = useState<string>("all");
  const [advancedCategoryFilter, setAdvancedCategoryFilter] = useState<string>("all");
  const [advancedTypeFilter, setAdvancedTypeFilter] = useState<string>("all");
  const [advancedNonResolvedFilter, setAdvancedNonResolvedFilter] = useState<string>("all");
  const [advancedUserFilter, setAdvancedUserFilter] = useState<string>("all");
  const [advancedCreatorFilter, setAdvancedCreatorFilter] = useState<string>("");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const canEditAssets =
    userRole === "Admin" || userRole === "DSI" || userRole === "Adjoint DSI";

  const filteredAssets: Asset[] = assets.filter((asset) => {
    if (assetStatusFilter !== "all" && asset.statut !== assetStatusFilter) {
      return false;
    }
    if (assetTypeFilter !== "all" && asset.type !== assetTypeFilter) {
      return false;
    }
    if (
      assetDepartmentFilter !== "all" &&
      asset.departement &&
      assetDepartmentFilter !== asset.departement
    ) {
      return false;
    }
    if (assetSearchQuery.trim()) {
      const q = assetSearchQuery.trim().toLowerCase();
      const haystack = [
        asset.nom,
        asset.numero_de_serie,
        asset.marque,
        asset.modele,
        asset.localisation,
        asset.departement,
        asset.assigned_to_name || "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Fonction helper pour obtenir le préfixe de route (DSI : toujours /dashboard/dsi)
  const _getRoutePrefix = (): string => {
    return "/dashboard/dsi";
  };
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [openActionsMenuFor, setOpenActionsMenuFor] = useState<string | null>(null);
  const [actionsMenuPosition, setActionsMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showNotificationsTicketsView, setShowNotificationsTicketsView] = useState<boolean>(false);
  const [notificationsTickets, setNotificationsTickets] = useState<Ticket[]>([]);
  const [selectedNotificationTicket, setSelectedNotificationTicket] = useState<string | null>(null);
  const [selectedNotificationTicketDetails, setSelectedNotificationTicketDetails] = useState<Ticket | null>(null);
  const [selectedNotificationTicketHistory, setSelectedNotificationTicketHistory] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<UserRead | null>(null);
  const myComments = ticketComments.filter(c => userInfo?.id != null && String(c.user_id) === String(userInfo.id));
  const notificationsSectionRef = useRef<HTMLDivElement>(null);
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [delegatedTicketsByMe, setDelegatedTicketsByMe] = useState<Set<string>>(new Set());
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userAgencyFilter, setUserAgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>("");
  // États pour la création de ticket (DSI)
  const [showCreateTicketModal, setShowCreateTicketModal] = useState<boolean>(false);
  const [newTicketTitle, setNewTicketTitle] = useState<string>("");
  const [newTicketDescription, setNewTicketDescription] = useState<string>("");
  const [newTicketType, setNewTicketType] = useState<string>("materiel");
  const [newTicketCategory, setNewTicketCategory] = useState<string>("");
  const [newTicketPriority, setNewTicketPriority] = useState<string>("");
  const [createTicketError, setCreateTicketError] = useState<string | null>(null);
  const [validationTicket, setValidationTicket] = useState<string | null>(null);
  const [validationRejectionReason, setValidationRejectionReason] = useState<string>("");
  const [showValidationRejectionForm, setShowValidationRejectionForm] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(10);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Onglets internes de la section Maintenance (État système, Base de données, Tâches, Journaux)
  const [maintenanceTab, setMaintenanceTab] = useState<string>("etat-systeme");
  // États pour la section Techniciens
  const [selectedTechnicianDetails, setSelectedTechnicianDetails] = useState<Technician | null>(null);
  const [showTechnicianDetailsModal, setShowTechnicianDetailsModal] = useState<boolean>(false);
  const [showCreateTechnicianModal, setShowCreateTechnicianModal] = useState<boolean>(false);
  const [showEditTechnicianModal, setShowEditTechnicianModal] = useState<boolean>(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [technicianToDelete, setTechnicianToDelete] = useState<Technician | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showEditUserModal, setShowEditUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showGenerateReport, setShowGenerateReport] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>("");
  const [reportPeriodFrom, setReportPeriodFrom] = useState<string>("2024-01-01");
  const [reportPeriodTo, setReportPeriodTo] = useState<string>("2024-01-31");
  const [reportFilters, setReportFilters] = useState({
    department: "all",
    technician: "all",
    ticketType: "all",
    priority: "all"
  });
  const [showOutputFormat, setShowOutputFormat] = useState<boolean>(false);
  const [outputFormat, setOutputFormat] = useState<string>("");
  // Journaux de maintenance (onglet Journaux de la section Maintenance)
  const [maintenanceLogs, setMaintenanceLogs] = useState<Notification[]>([]);
  const [isLoadingMaintenanceLogs, setIsLoadingMaintenanceLogs] = useState<boolean>(false);
  const [maintenanceLogsError, setMaintenanceLogsError] = useState<string | null>(null);

  // Statistiques de la base de données (onglet Base de données de la section Maintenance)
  type DatabaseTableStat = {
    name: string;
    row_estimate: number;
    rls_enabled: boolean;
  };
  const [databaseTables, setDatabaseTables] = useState<DatabaseTableStat[]>([]);
  const [isLoadingDatabaseTables, setIsLoadingDatabaseTables] = useState<boolean>(false);
  const [databaseTablesError, setDatabaseTablesError] = useState<string | null>(null);
  
  // États pour les paramètres d'apparence
  const [appName, setAppName] = useState<string>(() => {
    return localStorage.getItem("appName") || "Système de Gestion des Tickets";
  });
  const [appTheme, setAppTheme] = useState<string>(() => {
    return localStorage.getItem("appTheme") || "clair";
  });
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem("primaryColor") || "#007bff";
  });
  const [appLogo, setAppLogo] = useState<string | null>(() => {
    return localStorage.getItem("appLogo");
  });
  
  // États locaux pour la section Apparence
  const [localAppName, setLocalAppName] = useState(appName);
  const [localAppTheme, setLocalAppTheme] = useState(appTheme);
  const [localPrimaryColor, setLocalPrimaryColor] = useState(primaryColor);
  const [localAppLogo, setLocalAppLogo] = useState(appLogo);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour les types de tickets (depuis la base de données)
  const [ticketTypes, setTicketTypes] = useState<Array<{
    id: number;
    code: string;
    label: string;
    is_active: boolean;
    type: string;
    description: string;
    color: string;
  }>>([]);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<number | null>(null);
  const [newType, setNewType] = useState({ type: "", description: "", color: "#007bff", is_active: true });
  const [loadingTypes, setLoadingTypes] = useState(false);
  
  // États pour la section Catégories (données depuis l'API)
  const [categoriesList, setCategoriesList] = useState<Array<{
    id: number;
    name: string;
    description?: string | null;
    type_code: string;
    is_active: boolean;
  }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesTypes, setCategoriesTypes] = useState<Array<{
    id: number;
    code: string;
    label: string;
    is_active: boolean;
  }>>([]);
  const [expandedCategoryType, setExpandedCategoryType] = useState<string | null>(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
    type_code: string;
    is_active: boolean;
  } | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryTypeCode, setEditCategoryTypeCode] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryTypeCode, setNewCategoryTypeCode] = useState("");
  
  // États pour les priorités
  const [priorities, setPriorities] = useState<Array<{
    id: number;
    priority: string;
    level: number;
    color: string;
    maxTime: string;
    maxTimeValue: number;
    maxTimeUnit: string;
  }>>(() => {
    const saved = localStorage.getItem("priorities");
    if (saved) {
      return JSON.parse(saved);
    }
    // Priorités par défaut
    return [
      { id: 1, priority: "Critique", level: 1, color: "#dc3545", maxTime: "1 heure", maxTimeValue: 1, maxTimeUnit: "heure" },
      { id: 2, priority: "Haute", level: 2, color: "rgba(245, 158, 11, 0.1)", maxTime: "4 heures", maxTimeValue: 4, maxTimeUnit: "heures" },
      { id: 3, priority: "Moyenne", level: 3, color: "#0DADDB", maxTime: "1 jour", maxTimeValue: 1, maxTimeUnit: "jour" },
      { id: 4, priority: "Basse", level: 4, color: "#28a745", maxTime: "3 jours", maxTimeValue: 3, maxTimeUnit: "jours" }
    ];
  });
  const [prioritiesFromDb, setPrioritiesFromDb] = useState<Array<{
    id: number;
    code: string;
    label: string;
    color_hex: string | null;
    background_hex: string | null;
    display_order: number;
    is_active: boolean;
  }>>([]);
  const [loadingPrioritiesFromDb, setLoadingPrioritiesFromDb] = useState(false);
  const [editingPriorityFromDb, setEditingPriorityFromDb] = useState<{
    id: number;
    code: string;
    label: string;
    color_hex: string | null;
    background_hex: string | null;
    display_order: number;
    is_active: boolean;
  } | null>(null);
  const [editPriorityForm, setEditPriorityForm] = useState({ label: "", color_hex: "", background_hex: "" });
  const [showAddPriorityFromDbModal, setShowAddPriorityFromDbModal] = useState(false);
  const [addPriorityForm, setAddPriorityForm] = useState({
    code: "",
    label: "",
    color_hex: "#E53E3E",
    background_hex: "rgba(229, 62, 62, 0.1)",
    display_order: 1,
  });
  const [showAddPriorityModal, setShowAddPriorityModal] = useState(false);
  const [editingPriority, setEditingPriority] = useState<number | null>(null);
  const [newPriority, setNewPriority] = useState({ 
    priority: "", 
    level: 1, 
    color: "#dc3545", 
    maxTimeValue: 1, 
    maxTimeUnit: "heure" 
  });
  
  // États pour les paramètres SMTP/Email
  const [emailSettings, setEmailSettings] = useState(() => {
    const saved = localStorage.getItem("emailSettings");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      provider: "gmail",
      senderEmail: "tickets@entreprise.com",
      displayName: "Système de Gestion des Tickets",
      smtpServer: "smtp.gmail.com",
      smtpPort: "587",
      authType: "password",
      smtpUsername: "tickets@entreprise.com",
      smtpPassword: "",
      useTLS: true,
      verifySSL: true
    };
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailSubSection, setEmailSubSection] = useState<string>("smtp");
  
  // États pour les templates email
  const [emailTemplates, setEmailTemplates] = useState<Array<{
    id: number;
    name: string;
    active: boolean;
  }>>(() => {
    const saved = localStorage.getItem("emailTemplates");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 1, name: "Confirmation de Création de Ticket", active: true },
      { id: 2, name: "Assignation de Ticket", active: true },
      { id: 3, name: "Ticket Résolu", active: true },
      { id: 4, name: "Demande de Validation", active: true },
      { id: 5, name: "Ticket Clôturé", active: true },
      { id: 6, name: "Demande de Feedback", active: true },
      { id: 7, name: "Réinitialisation de Mot de Passe", active: true },
      { id: 8, name: "Bienvenue Nouvel Utilisateur", active: true },
      { id: 9, name: "Rapport Programmé", active: true },
      { id: 10, name: "Alerte Ticket Critique", active: true }
    ];
  });
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState<boolean>(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    recipients: "creator",
    customRecipients: "",
    active: true,
    content: ""
  });
  
  // États pour les notifications email
  const [emailNotifications, setEmailNotifications] = useState<Array<{
    event: string;
    active: boolean;
    recipients: string;
  }>>(() => {
    const saved = localStorage.getItem("emailNotifications");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { event: "Nouveau Ticket Créé", active: true, recipients: "Secrétaire/Adjoint" },
      { event: "Ticket Assigné", active: true, recipients: "Technicien" },
      { event: "Ticket Réassigné", active: true, recipients: "Ancien + Nouveau Tech" },
      { event: "Ticket Résolu", active: true, recipients: "Utilisateur" },
      { event: "Ticket Relancé", active: true, recipients: "Technicien" },
      { event: "Ticket Clôturé", active: true, recipients: "Utilisateur" },
      { event: "Commentaire Ajouté", active: true, recipients: "Tous les Participants" },
      { event: "Ticket Escaladé", active: true, recipients: "DSI" },
      { event: "Ticket Critique en Attente", active: true, recipients: "DSI + Adjoint" },
      { event: "Rapport Généré", active: true, recipients: "Destinataires Rapport" },
      { event: "Alerte Système", active: true, recipients: "Admin + DSI" }
    ];
  });
  
  // États pour la fréquence d'envoi
  const [emailFrequency, setEmailFrequency] = useState(() => {
    const saved = localStorage.getItem("emailFrequency");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      frequency: "immediate",
      groupInterval: 30,
      dailyTime: "09:00",
      silenceFrom: "18:00",
      silenceTo: "09:00",
      applyWeekend: true
    };
  });
  
  // États pour le test email
  const [testEmail, setTestEmail] = useState({
    address: "admin@entreprise.com",
    template: ""
  });
  const [testResult, setTestResult] = useState<any>(null);
  
  // États pour les logs d'envoi
  const [emailLogs] = useState<Array<{
    id: number;
    date: string;
    recipient: string;
    template: string;
    status: "success" | "error";
    error?: string;
  }>>(() => {
    const saved = localStorage.getItem("emailLogs");
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 1, date: "22/01 14:32:15", recipient: "admin@entreprise.com", template: "Confirmation", status: "success" },
      { id: 2, date: "22/01 14:15:42", recipient: "jean@entreprise.fr", template: "Assignation", status: "success" },
      { id: 3, date: "22/01 14:10:28", recipient: "marie@entreprise.com", template: "Résolution", status: "success" },
      { id: 4, date: "22/01 13:45:10", recipient: "pierre@entreprise.com", template: "Clôture", status: "success" },
      { id: 5, date: "22/01 13:30:55", recipient: "support@entreprise.com", template: "Alerte Critique", status: "error", error: "Serveur SMTP non disponible. Vérifiez les paramètres de connexion." }
    ];
  });
  
  // États pour les paramètres de sécurité
  const [securitySettings, setSecuritySettings] = useState(() => {
    const saved = localStorage.getItem("securitySettings");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      // Authentification
      mfaRequired: true,
      sessionTimeout: 30,
      connectionHistory: true,
      suspiciousConnectionAlerts: true,
      // Mot de Passe
      minPasswordLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiration: 90,
      // Audit et Logging
      recordAllActions: true,
      recordSensitiveDataChanges: true,
      recordFailedLogins: true,
      keepLogsFor: 90
    };
  });
  
  
  // Mettre à jour les états locaux quand on entre dans la section Apparence
  useEffect(() => {
    if (activeSection === "apparence") {
      setLocalAppName(appName);
      setLocalAppTheme(appTheme);
      setLocalPrimaryColor(primaryColor);
      setLocalAppLogo(appLogo);
    }
  }, [activeSection, appName, appTheme, primaryColor, appLogo]);

  // Fermer le Popover Période au clic extérieur
  useEffect(() => {
    if (!showPeriodCalendar) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (periodCalendarRef.current && !periodCalendarRef.current.contains(e.target as Node)) {
        setShowPeriodCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPeriodCalendar]);
  
  // Gérer les paramètres URL pour ouvrir automatiquement les modals
  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    const action = searchParams.get("action");
    
    if (ticketId && allTickets.length > 0) {
      // Vérifier que le ticket existe
      const ticket = allTickets.find(t => t.id === ticketId);
      if (ticket) {
        if (action === "assign") {
          setAssignTicketId(ticketId);
          setShowAssignModal(true);
          // Nettoyer l'URL après avoir ouvert le modal
          window.history.replaceState({}, "", window.location.pathname);
        } else if (action === "delegate") {
          setDelegateTicketId(ticketId);
          setShowDelegateModal(true);
          // Nettoyer l'URL après avoir ouvert le modal
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    }
  }, [searchParams, allTickets]);
  
  // Afficher la section Tickets immédiatement : d’abord un placeholder, puis le contenu au frame suivant
  useEffect(() => {
    if (activeSection === "tickets") {
      const id = requestAnimationFrame(() => setTicketsSectionReady(true));
      return () => {
        cancelAnimationFrame(id);
        setTicketsSectionReady(false);
      };
    } else {
      setTicketsSectionReady(false);
    }
  }, [activeSection]);

  // Définir automatiquement "statistiques" comme rapport sélectionné quand on arrive sur la page reports
  useEffect(() => {
    const path = location.pathname;
    if ((path === "/dashboard/dsi/reports") && !selectedReport) {
      setSelectedReport("statistiques");
    }
  }, [location.pathname]);
  
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    phone: "",
    agency: "",
    role: "",
    actif: true,
    password: "",
    confirmPassword: "",
    generateRandomPassword: true,
    sendEmail: true,
    // Par défaut : 08h-13h / 14h-17h avec une heure de pause déjeuner
  });
  const [editUser, setEditUser] = useState({
    full_name: "",
    email: "",
    phone: "",
    agency: "",
    role: "",
    actif: true,
    // Par défaut : 08h-13h / 14h-17h avec une heure de pause déjeuner
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    // Mapper les données de l'utilisateur au format du formulaire
    let roleName = "";
    if (user.role) {
      if (typeof user.role === "object" && user.role.name) {
        roleName = user.role.name;
      } else if (typeof user.role === "string") {
        roleName = user.role;
      }
    }
    
    // actif est maintenant un Boolean
    const actifValue = user.actif !== undefined ? user.actif : (user.is_active !== undefined ? user.is_active : true);
    
    setEditUser({
      full_name: user.full_name || user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      agency: user.agency || "",
      role: roleName,
      actif: actifValue,
    });
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !token) return;

    try {
      // Trouver le rôle_id correspondant au nom du rôle
      const roleMap: { [key: string]: string } = {
        "Utilisateur": "Utilisateur",
        "Technicien (Matériel)": "Technicien",
        "Technicien (Applicatif)": "Technicien",
        "Secrétaire DSI": "Secrétaire DSI",
        "Adjoint DSI": "Adjoint DSI",
        "DSI": "DSI",
        "Administrateur": "Admin"
      };

      // Charger les rôles pour obtenir les IDs
      const rolesRes = await fetch("http://localhost:8000/auth/roles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      let roleId = null;
      if (rolesRes.ok) {
        const roles = await rolesRes.json();
        const roleName = roleMap[editUser.role] || editUser.role;
        const role = roles.find((r: any) => r.name === roleName);
        if (role) {
          roleId = role.id;
        }
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        full_name: editUser.full_name,
        email: editUser.email,
        phone: editUser.phone || null,
        agency: editUser.agency,
        actif: editUser.actif
      };

      if (roleId) {
        updateData.role_id = roleId;
      }

      // Gérer la spécialisation pour les techniciens
      if (editUser.role === "Technicien (Matériel)") {
        updateData.specialization = "materiel";
      } else if (editUser.role === "Technicien (Applicatif)") {
        updateData.specialization = "applicatif";
      } else {
        updateData.specialization = null;
      }

      // Ajouter les informations spécifiques aux techniciens
      if (editUser.role === "Technicien (Matériel)" || editUser.role === "Technicien (Applicatif)") {
      }

      const res = await fetch(`http://localhost:8000/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        alert("Utilisateur modifié avec succès !");
        setShowEditUserModal(false);
        setEditingUser(null);
        // Recharger la liste des utilisateurs
        const usersRes = await fetch("http://localhost:8000/users/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData || []);
        }
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de modifier l'utilisateur"}`);
      }
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      alert("Erreur lors de la modification de l'utilisateur");
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message || "Utilisateur supprimé avec succès !");
        // Recharger la liste des utilisateurs
        const usersRes = await fetch("http://localhost:8000/users/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData || []);
        }
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de supprimer l'utilisateur"}`);
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  };

  const handleResetPassword = async (user: any) => {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Mot de passe réinitialisé avec succès !\nNouveau mot de passe: ${result.new_password}\n\nCopiez ce mot de passe et communiquez-le à l'utilisateur.`);
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de réinitialiser le mot de passe"}`);
      }
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      alert("Erreur lors de la réinitialisation du mot de passe");
    }
  };

  const handleToggleUserActif = async (user: any) => {
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ actif: !user.actif })
      });

      if (res.ok) {
        const usersRes = await fetch("http://localhost:8000/users/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData || []);
        }
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de modifier le statut"}`);
      }
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
      alert("Erreur lors du changement de statut");
    }
  };

  const randomPassword = (length: number = 12) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let s = "";
    for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const roleMap: { [key: string]: string } = {
      "Utilisateur": "Utilisateur",
      "Technicien (Matériel)": "Technicien",
      "Technicien (Applicatif)": "Technicien",
      "Secrétaire DSI": "Secrétaire DSI",
      "Adjoint DSI": "Adjoint DSI",
      "DSI": "DSI",
      "Administrateur": "Admin"
    };

    let password = newUser.password;
    if (newUser.generateRandomPassword) {
      password = randomPassword(12);
    } else {
      if (newUser.password !== newUser.confirmPassword) {
        alert("Les mots de passe ne correspondent pas.");
        return;
      }
      if (!newUser.password || newUser.password.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }
    }

    const username = newUser.email.trim() || "user";
    const roleName = roleMap[newUser.role] || newUser.role;
    if (!roleName) {
      alert("Veuillez sélectionner un rôle.");
      return;
    }

    try {
      const rolesRes = await fetch("http://localhost:8000/auth/roles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!rolesRes.ok) {
        alert("Impossible de charger les rôles.");
        return;
      }
      const roles = await rolesRes.json();
      const role = roles.find((r: any) => r.name === roleName);
      if (!role) {
        alert(`Rôle "${newUser.role}" introuvable.`);
        return;
      }

      const body = {
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim(),
        agency: newUser.agency || null,
        phone: newUser.phone?.trim() || null,
        username,
        password,
        role_id: role.id,
        specialization: newUser.role === "Technicien (Matériel)" ? "materiel" : newUser.role === "Technicien (Applicatif)" ? "applicatif" : null,
        send_credentials_email: !!newUser.sendEmail
      };

      const res = await fetch("http://localhost:8000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const usersRes = await fetch("http://localhost:8000/users/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData || []);
        }
        setShowAddUserModal(false);
        setNewUser({
          full_name: "",
          email: "",
          phone: "",
          agency: "",
          role: "",
          actif: true,
          password: "",
          confirmPassword: "",
          generateRandomPassword: true,
          sendEmail: true
        });
        if (newUser.sendEmail) {
          alert(`Utilisateur créé avec succès.\n\nLes identifiants ont été envoyés par email à ${newUser.email.trim()}.`);
        } else if (newUser.generateRandomPassword) {
          alert(`Utilisateur créé avec succès.\n\nMot de passe généré : ${password}\n\nCopiez ce mot de passe et communiquez-le à l'utilisateur.`);
        } else {
          alert("Utilisateur créé avec succès !");
        }
      } else {
        const err = await res.json();
        let msg = "Impossible de créer l'utilisateur.";
        if (typeof err.detail === "string") msg = err.detail;
        else if (Array.isArray(err.detail) && err.detail[0]?.msg) msg = err.detail[0].msg;
        else if (err.detail?.msg) msg = err.detail.msg;
        alert(`Erreur : ${msg}`);
      }
    } catch (err) {
      console.error("Erreur lors de la création:", err);
      alert("Erreur lors de la création de l'utilisateur.");
    }
  };

  // Fonctions pour la section Apparence
  const handleSaveAppearance = () => {
    // Sauvegarder dans localStorage
    localStorage.setItem("appName", localAppName);
    localStorage.setItem("appTheme", localAppTheme);
    localStorage.setItem("primaryColor", localPrimaryColor);
    if (localAppLogo) {
      localStorage.setItem("appLogo", localAppLogo);
    } else {
      // Supprimer le logo de localStorage si localAppLogo est null
      localStorage.removeItem("appLogo");
    }
    
    // Mettre à jour les états globaux
    setAppName(localAppName);
    setAppTheme(localAppTheme);
    setPrimaryColor(localPrimaryColor);
    setAppLogo(localAppLogo);
    
    // Appliquer le thème
    if (localAppTheme === "sombre") {
      document.body.style.backgroundColor = "#1a1a1a";
      document.body.style.color = "#fff";
    } else if (localAppTheme === "clair") {
      document.body.style.backgroundColor = "#fff";
      document.body.style.color = "#333";
    } else {
      // Auto - utiliser les préférences du système
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.style.backgroundColor = prefersDark ? "#1a1a1a" : "#fff";
      document.body.style.color = prefersDark ? "#fff" : "#333";
    }
    
    alert("Paramètres d'apparence enregistrés avec succès !");
  };

  const handleCancelAppearance = () => {
    setLocalAppName(appName);
    setLocalAppTheme(appTheme);
    setLocalPrimaryColor(primaryColor);
    setLocalAppLogo(appLogo);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Le fichier est trop volumineux. Taille maximale : 2MB");
        // Réinitialiser l'input pour permettre de sélectionner un autre fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      // Vérifier le format du fichier
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        alert("Format non accepté. Utilisez PNG ou JPG");
        // Réinitialiser l'input pour permettre de sélectionner un autre fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      // Lire le fichier et le convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setLocalAppLogo(reader.result as string);
          // Afficher un message de succès
          alert("Logo téléchargé avec succès ! N'oubliez pas de cliquer sur 'Enregistrer' pour sauvegarder les modifications.");
        } else {
          alert("Erreur lors de la lecture du fichier. Veuillez réessayer.");
        }
        // Réinitialiser l'input pour permettre de télécharger le même fichier à nouveau si nécessaire
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.onerror = () => {
        alert("Erreur lors de la lecture du fichier. Veuillez réessayer.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    setLocalAppLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getColorName = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#007bff": "Bleu",
      "#28a745": "Vert",
      "#dc3545": "Rouge",
      "#ffc107": "Jaune",
      "#6c757d": "Gris",
      "#17a2b8": "Cyan",
      "#ff9800": "Orange",
      "#9c27b0": "Violet"
    };
    return colorMap[color] || "Personnalisé";
  };

  // Fonctions pour les types de tickets
  const handleAddType = async () => {
    if (!newType.type.trim()) {
      alert("Veuillez remplir le nom du type");
      return;
    }
    if (!token) {
      alert("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/ticket-config/types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newType.type.trim(),
          is_active: newType.is_active,
        }),
      });

      if (res.ok) {
        const typesRes = await fetch("http://localhost:8000/ticket-config/types", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (typesRes.ok) {
          const data = await typesRes.json();
          setTicketTypes(data);
        }
        setNewType({ type: "", description: "", color: "#007bff", is_active: true });
        setShowAddTypeModal(false);
        alert("Type de ticket ajouté avec succès !");
      } else {
        const error = await res.json().catch(() => ({ detail: "Erreur lors de l'ajout" }));
        alert(error.detail || "Erreur lors de l'ajout du type");
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout du type:", err);
      alert("Erreur lors de l'ajout du type");
    }
  };

  const handleEditType = (typeId: number) => {
    const type = ticketTypes.find(t => t.id === typeId);
    if (type) {
      setNewType({ type: type.label, description: "", color: "#007bff", is_active: type.is_active });
      setEditingType(typeId);
      setShowAddTypeModal(true);
    }
  };

  const handleToggleActive = () => {
    setNewType({ ...newType, is_active: !newType.is_active });
  };

  const handleUpdateType = async () => {
    if (!newType.type.trim()) {
      alert("Veuillez remplir le nom du type");
      return;
    }
    if (!editingType || !token) {
      alert("Erreur: type non sélectionné");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/ticket-config/types/${editingType}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: newType.type,
          is_active: newType.is_active,
        }),
      });

      if (res.ok) {
        // Recharger les types depuis l'API
        const typesRes = await fetch("http://localhost:8000/ticket-config/types", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (typesRes.ok) {
          const data = await typesRes.json();
          setTicketTypes(data);
        }
        setNewType({ type: "", description: "", color: "#007bff", is_active: true });
        setEditingType(null);
        setShowAddTypeModal(false);
        alert("Type de ticket modifié avec succès !");
      } else {
        const error = await res.json().catch(() => ({ detail: "Erreur lors de la modification" }));
        alert(error.detail || "Erreur lors de la modification du type");
      }
    } catch (err) {
      console.error("Erreur lors de la modification du type:", err);
      alert("Erreur lors de la modification du type");
    }
  };

  const handleDeleteType = async (typeId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce type de ticket ?")) return;
    if (!token) {
      alert("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/ticket-config/types/${typeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const typesRes = await fetch("http://localhost:8000/ticket-config/types", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (typesRes.ok) {
          const data = await typesRes.json();
          setTicketTypes(data);
        }
        alert("Type de ticket supprimé avec succès !");
      } else {
        const error = await res.json().catch(() => ({ detail: "Erreur lors de la suppression" }));
        alert(error.detail || "Erreur lors de la suppression du type");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du type:", err);
      alert("Erreur lors de la suppression du type");
    }
  };

  async function handleAddCategory() {
    if (!token?.trim()) {
      alert("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    const name = newCategoryName?.trim();
    if (!name) {
      alert("Le nom de la catégorie est obligatoire.");
      return;
    }
    const selectedType = categoriesTypes.find((t) => t.code === newCategoryTypeCode);
    if (!selectedType) {
      alert("Veuillez sélectionner un type de ticket.");
      return;
    }
    try {
      const res = await fetch("http://localhost:8000/ticket-config/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          ticket_type_id: selectedType.id,
          is_active: true,
        }),
      });
      if (res.ok) {
        const [typesRes, categoriesRes] = await Promise.all([
          fetch("http://localhost:8000/ticket-config/types", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:8000/ticket-config/categories", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (typesRes.ok) setCategoriesTypes(await typesRes.json());
        if (categoriesRes.ok) setCategoriesList(await categoriesRes.json());
        setShowAddCategoryModal(false);
        setNewCategoryName("");
        setNewCategoryTypeCode(categoriesTypes[0]?.code ?? "");
      } else {
        const err = await res.json().catch(() => ({ detail: "Erreur lors de l'ajout" }));
        alert(err.detail || "Erreur lors de l'ajout de la catégorie");
      }
    } catch (err) {
      console.error("Erreur lors de l'ajout de la catégorie:", err);
      alert("Erreur lors de l'ajout de la catégorie");
    }
  }

  async function handleUpdateCategory() {
    if (!editingCategory || !token?.trim()) {
      if (!token?.trim()) alert("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    const name = editCategoryName?.trim();
    if (!name) {
      alert("Le nom de la catégorie est obligatoire.");
      return;
    }
    const selectedType = categoriesTypes.find((t) => t.code === editCategoryTypeCode);
    if (!selectedType) {
      alert("Veuillez sélectionner un type de ticket.");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/ticket-config/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          ticket_type_id: selectedType.id,
          is_active: editingCategory.is_active,
        }),
      });
      if (res.ok) {
        const [typesRes, categoriesRes] = await Promise.all([
          fetch("http://localhost:8000/ticket-config/types", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:8000/ticket-config/categories", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (typesRes.ok) setCategoriesTypes(await typesRes.json());
        if (categoriesRes.ok) setCategoriesList(await categoriesRes.json());
        setShowEditCategoryModal(false);
        setEditingCategory(null);
      } else {
        const err = await res.json().catch(() => ({ detail: "Erreur lors de la modification" }));
        alert(err.detail || "Erreur lors de la modification de la catégorie");
      }
    } catch (err) {
      console.error("Erreur lors de la modification de la catégorie:", err);
      alert("Erreur lors de la modification de la catégorie");
    }
  }

  const getTypeColorName = (color: string) => {
    const colorMap: { [key: string]: string } = {
      "#dc3545": "Rouge",
      "#28a745": "Vert",
      "#ffc107": "Jaune",
      "#9c27b0": "Violet",
      "#6c757d": "Gris",
      "#007bff": "Bleu",
      "#17a2b8": "Cyan",
      "#ff9800": "Orange"
    };
    return colorMap[color] || "Personnalisé";
  };

  // Fonctions pour les priorités
  const handleAddPriority = () => {
    if (!newPriority.priority.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    const maxTime = `${newPriority.maxTimeValue} ${newPriority.maxTimeUnit}`;
    const newId = priorities.length > 0 ? Math.max(...priorities.map(p => p.id)) + 1 : 1;
    const updatedPriorities = [...priorities, { 
      ...newPriority, 
      id: newId,
      maxTime 
    }];
    setPriorities(updatedPriorities);
    localStorage.setItem("priorities", JSON.stringify(updatedPriorities));
    setNewPriority({ priority: "", level: 1, color: "#dc3545", maxTimeValue: 1, maxTimeUnit: "heure" });
    setShowAddPriorityModal(false);
    alert("Priorité ajoutée avec succès !");
  };

  const handleUpdatePriority = () => {
    if (!newPriority.priority.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    const maxTime = `${newPriority.maxTimeValue} ${newPriority.maxTimeUnit}`;
    const updatedPriorities = priorities.map(p => 
      p.id === editingPriority ? { ...p, ...newPriority, maxTime } : p
    );
    setPriorities(updatedPriorities);
    localStorage.setItem("priorities", JSON.stringify(updatedPriorities));
    setNewPriority({ priority: "", level: 1, color: "#dc3545", maxTimeValue: 1, maxTimeUnit: "heure" });
    setEditingPriority(null);
    setShowAddPriorityModal(false);
    alert("Priorité modifiée avec succès !");
  };

  // Fonction pour sauvegarder les paramètres de sécurité
  const handleSaveSecurity = () => {
    localStorage.setItem("securitySettings", JSON.stringify(securitySettings));
    alert("Paramètres de sécurité enregistrés avec succès !");
  };

  const handleCancelSecurity = () => {
    const saved = localStorage.getItem("securitySettings");
    if (saved) {
      setSecuritySettings(JSON.parse(saved));
    }
  };

  async function loadNotifications() {
    if (!token || token.trim() === "") {
      return;
    }
    
    try {
      const res = await fetch("http://localhost:8000/notifications/?unread_only=true", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des notifications:", err);
    }
  }

  // Charger l'historique des notifications pour l'onglet Journaux de la section Maintenance
  async function loadMaintenanceLogs() {
    if (!token || token.trim() === "") {
      return;
    }

    try {
      setIsLoadingMaintenanceLogs(true);
      setMaintenanceLogsError(null);

      const res = await fetch("http://localhost:8000/notifications/?skip=0&limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMaintenanceLogs(data);
      } else {
        setMaintenanceLogsError("Impossible de charger les journaux système.");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des journaux de maintenance:", err);
      setMaintenanceLogsError("Erreur lors du chargement des journaux système.");
    } finally {
      setIsLoadingMaintenanceLogs(false);
    }
  }

  async function loadNotificationsTickets() {
    if (!token || notifications.length === 0) {
      setNotificationsTickets([]);
      return;
    }
    
    try {
      // Récupérer tous les ticket_id uniques des notifications
      const ticketIds = notifications
        .filter(n => n.ticket_id)
        .map(n => n.ticket_id)
        .filter((id, index, self) => self.indexOf(id) === index) as string[];
      
      if (ticketIds.length === 0) {
        setNotificationsTickets([]);
        return;
      }

      // Charger les détails de chaque ticket
      const ticketsPromises = ticketIds.map(async (ticketId) => {
        try {
          const res = await fetch(`http://localhost:8000/tickets/${ticketId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            return await res.json();
          }
          return null;
        } catch (err) {
          console.error(`Erreur chargement ticket ${ticketId}:`, err);
          return null;
        }
      });

      const tickets = (await Promise.all(ticketsPromises)).filter(t => t !== null) as Ticket[];
      setNotificationsTickets(tickets);
      
      // Si un ticket est déjà sélectionné, charger ses détails
      if (selectedNotificationTicket) {
        const ticket = tickets.find(t => t.id === selectedNotificationTicket);
        if (ticket) {
          setSelectedNotificationTicketDetails(ticket);
          // Charger l'historique
          try {
            const res = await fetch(`http://localhost:8000/tickets/${selectedNotificationTicket}/history`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setSelectedNotificationTicketHistory(Array.isArray(data) ? data : []);
            }
          } catch (err) {
            console.error("Erreur chargement historique:", err);
          }
        } else {
          // Si le ticket sélectionné n'est pas dans la liste, le charger séparément
          try {
            const res = await fetch(`http://localhost:8000/tickets/${selectedNotificationTicket}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setSelectedNotificationTicketDetails(data);
              // Charger l'historique
              const historyRes = await fetch(`http://localhost:8000/tickets/${selectedNotificationTicket}/history`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              if (historyRes.ok) {
                const historyData = await historyRes.json();
                setSelectedNotificationTicketHistory(Array.isArray(historyData) ? historyData : []);
              }
            }
          } catch (err) {
            console.error("Erreur chargement détails ticket sélectionné:", err);
          }
        }
      }
    } catch (err) {
      console.error("Erreur chargement tickets notifications:", err);
    }
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.ticket_id) return;
    
    // Marquer comme lu
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    
    // Ouvrir la vue des tickets avec notifications dans le contenu principal
    setShowNotifications(false);
    changeSectionForDSI("notifications");
    setSelectedNotificationTicket(notification.ticket_id);
    
    // Charger les tickets avec notifications
    await loadNotificationsTickets();
  }

  // Charger les tickets avec notifications quand la vue s'ouvre
  useEffect(() => {
    if ((activeSection === "notifications" || showNotificationsTicketsView) && notifications.length > 0) {
      void loadNotificationsTickets();
    }
  }, [activeSection, showNotificationsTicketsView, notifications.length]);

  // Charger les journaux de maintenance quand l'onglet Journaux est ouvert dans la section Maintenance
  useEffect(() => {
    if (activeSection === "maintenance" && maintenanceTab === "journaux") {
      void loadMaintenanceLogs();
    }
  }, [activeSection, maintenanceTab, token]);

  // Charger les statistiques de la base de données quand l'onglet Base de données est ouvert dans la section Maintenance
  useEffect(() => {
    if (activeSection === "maintenance" && maintenanceTab === "base-de-donnees") {
      void loadDatabaseTablesStats();
    }
  }, [activeSection, maintenanceTab, token]);

  // Charger automatiquement les détails du ticket sélectionné dans la section notifications
  useEffect(() => {
    if (activeSection === "notifications" && selectedNotificationTicket) {
      async function loadDetails() {
        try {
          const res = await fetch(`http://localhost:8000/tickets/${selectedNotificationTicket}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setSelectedNotificationTicketDetails(data);
            if (selectedNotificationTicket) {
              await Promise.all([loadTicketHistory(selectedNotificationTicket), loadTicketComments(selectedNotificationTicket)]);
            }
          }
        } catch (err) {
          console.error("Erreur chargement détails:", err);
        }
      }
      void loadDetails();
    }
  }, [activeSection, selectedNotificationTicket, token]);

  // Fermer les détails du ticket et scroll vers le haut quand la section notifications s'ouvre
  useEffect(() => {
    if (activeSection === "notifications") {
      setShowTicketDetailsPage(false);
      setTicketDetails(null);
      setTicketHistory([]);
      setTicketComments([]);
      setDetailCommentText("");
      // Attendre un peu pour que le DOM soit mis à jour
      setTimeout(() => {
        // Scroller vers le haut de la fenêtre
        window.scrollTo({ top: 0, behavior: "smooth" });
        // Aussi scroller vers le conteneur de la section notifications si disponible
        if (notificationsSectionRef.current) {
          notificationsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [activeSection]);

  // Charger les types d'actifs depuis la base (Admin / DSI / Adjoint) pour les filtres et le formulaire
  useEffect(() => {
    if (!token) return;
    if (!(userRole === "Admin" || userRole === "DSI" || userRole === "Adjoint DSI")) return;

    void loadAssetTypes();
    void loadAssetDepartments();
  }, [token, userRole]);

  // Charger les types de tickets depuis la base de données (Admin et DSI)
  useEffect(() => {
    if (activeSection === "types" && (userRole === "Admin" || userRole === "DSI") && token) {
      async function loadTicketTypes() {
        setLoadingTypes(true);
        try {
          const res = await fetch("http://localhost:8000/ticket-config/types", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setTicketTypes(data);
          } else {
            console.error("Erreur lors du chargement des types:", res.statusText);
          }
        } catch (err) {
          console.error("Erreur lors du chargement des types:", err);
        } finally {
          setLoadingTypes(false);
        }
      }
      void loadTicketTypes();
    }
  }, [activeSection, userRole, token]);

  // Charger toutes les agences (y compris inactives) pour la section Agences
  useEffect(() => {
    if (activeSection === "departements" && (userRole === "Admin" || userRole === "DSI") && token) {
      void loadAssetDepartments(true);
    }
  }, [activeSection, userRole, token]);

  // Charger types et catégories pour:
  // - la section Catégories (Admin et DSI)
  // - la section Tickets (DSI) pour alimenter le filtre Catégorie
  useEffect(() => {
    if (!token) return;

    const isAdminCategories = activeSection === "categories" && userRole === "Admin";
    const isDSICategories = activeSection === "categories" && userRole === "DSI";
    const isDSITickets = activeSection === "tickets" && userRole === "DSI";

    if (!isAdminCategories && !isDSICategories && !isDSITickets) return;

    async function loadCategoriesData() {
      setLoadingCategories(true);
      try {
        const [typesRes, categoriesRes] = await Promise.all([
          fetch("http://localhost:8000/ticket-config/types", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8000/ticket-config/categories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setCategoriesTypes(typesData);
        }
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategoriesList(categoriesData);
        }
      } catch (err) {
        console.error("Erreur chargement catégories:", err);
      } finally {
        setLoadingCategories(false);
      }
    }
    void loadCategoriesData();
  }, [activeSection, userRole, token]);

  const loadPrioritiesFromDb = async () => {
    if (!token) return;
    setLoadingPrioritiesFromDb(true);
    try {
      const res = await fetch("http://localhost:8000/ticket-config/priorities?all=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setPrioritiesFromDb(Array.isArray(data) ? data : []);
    } catch {
      setPrioritiesFromDb([]);
    } finally {
      setLoadingPrioritiesFromDb(false);
    }
  };

  useEffect(() => {
    if (!token || activeSection !== "priorites") return;
    loadPrioritiesFromDb();
  }, [activeSection, token]);

  // Charger types, catégories et priorités quand le modal de création de ticket s'ouvre (DSI et Admin)
  useEffect(() => {
    if (showCreateTicketModal && (userRole === "DSI" || userRole === "Admin") && token) {
      (async () => {
        try {
          const [typesRes, categoriesRes, prioritiesRes] = await Promise.all([
            fetch("http://localhost:8000/ticket-config/types", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:8000/ticket-config/categories", { headers: { Authorization: `Bearer ${token}` } }),
            fetch("http://localhost:8000/ticket-config/priorities", { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (typesRes.ok) setTicketTypes((await typesRes.json()) || []);
          if (categoriesRes.ok) setCategoriesList((await categoriesRes.json()) || []);
          if (prioritiesRes.ok) setActivePrioritiesForAssign((await prioritiesRes.json()) || []);
        } catch (e) {
          console.error("Erreur chargement types/catégories/priorités pour création:", e);
        }
      })();
    }
  }, [showCreateTicketModal, userRole, token]);

  async function loadUnreadCount() {
    if (!token || token.trim() === "") {
      return;
    }
    
    try {
      const res = await fetch("http://localhost:8000/notifications/unread/count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error("Erreur lors du chargement du nombre de notifications non lues:", err);
    }
  }

  async function markNotificationAsRead(notificationId: string) {
    if (!token || token.trim() === "") {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (err) {
      console.error("Erreur lors du marquage de la notification comme lue:", err);
    }
  }

  async function markTicketNotificationsAsRead(ticketId: string) {
    const unreadForTicket = notifications.filter((n) => n.ticket_id === ticketId && !n.read);
    if (unreadForTicket.length === 0 || !token || token.trim() === "") return;
    try {
      await Promise.all(
        unreadForTicket.map((n) =>
          fetch(`http://localhost:8000/notifications/${n.id}/read`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      await loadNotifications();
      await loadUnreadCount();
    } catch (err) {
      console.error("Erreur lors du marquage des notifications du ticket comme lues:", err);
    }
  }

  async function markAllAsRead() {
    if (!token || token.trim() === "") return;
    try {
      const res = await fetch("http://localhost:8000/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadNotifications();
        await loadUnreadCount();
      }
    } catch (err) {
      console.error("Erreur lors du marquage de toutes les notifications comme lues:", err);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  }

  // Appliquer le thème et la couleur primaire au chargement
  useEffect(() => {
    if (appTheme === "sombre") {
      document.body.style.backgroundColor = "#1a1a1a";
      document.body.style.color = "#fff";
    } else if (appTheme === "clair") {
      document.body.style.backgroundColor = "#fff";
      document.body.style.color = "#333";
    } else {
      // Auto - utiliser les préférences du système
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.style.backgroundColor = prefersDark ? "#1a1a1a" : "#fff";
      document.body.style.color = prefersDark ? "#fff" : "#333";
    }
  }, [appTheme]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreateTicketError(null);
    setLoading(true);
    
    if (!token || token.trim() === "") {
      setCreateTicketError("Erreur d'authentification : veuillez vous reconnecter");
      setLoading(false);
      return;
    }
    
    try {
      const requestBody: Record<string, unknown> = {
        title: newTicketTitle.trim(),
        description: newTicketDescription.trim(),
        type: newTicketType.toLowerCase(),
        category: newTicketCategory.trim() || undefined,
      };
      if (newTicketPriority.trim()) requestBody.priority = newTicketPriority.trim();
      
      const res = await fetch("http://localhost:8000/tickets/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!res.ok) {
        let errorMessage = `Erreur ${res.status}: ${res.statusText}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          const textError = await res.text();
          console.error("Erreur (texte):", textError);
        }
        throw new Error(errorMessage);
      }
      
      const newTicket = await res.json();
      console.log("Ticket créé avec succès:", newTicket);
      setNewTicketTitle("");
      setNewTicketDescription("");
      setNewTicketType("materiel");
      setNewTicketCategory("");
      setNewTicketPriority("");
      setShowCreateTicketModal(false);
      changeSectionForDSI("dashboard");
      void loadTickets();
      void loadNotifications();
      void loadUnreadCount();
      alert("Ticket créé avec succès !");
    } catch (err: any) {
      console.error("Erreur lors de la création du ticket:", err);
      setCreateTicketError(err.message || "Une erreur est survenue lors de la création du ticket");
    } finally {
      setLoading(false);
    }
  }

  // Fonction pour charger les tickets (séparée pour pouvoir être appelée périodiquement)
  async function loadTickets(searchTerm?: string): Promise<Ticket[]> {
    if (!token || token.trim() === "") {
      return [];
    }
    
    try {
      const url = new URL("http://localhost:8000/tickets/");
      if (searchTerm && searchTerm.trim() !== "") {
        url.searchParams.append("search", searchTerm.trim());
      }
      
      const ticketsRes = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      let ticketsData: Ticket[] = [];
      if (ticketsRes.ok) {
        ticketsData = await ticketsRes.json();
        setAllTickets(ticketsData);
        // Calculer les métriques
        const openCount = ticketsData.filter((t: Ticket) => 
          t.status !== "cloture" && t.status !== "resolu"
        ).length;
        setMetrics(prev => ({ ...prev, openTickets: openCount }));
      }
      return ticketsData;
    } catch (err) {
      console.error("Erreur lors du chargement des tickets:", err);
      return [];
    }
  }

  async function loadAssets(): Promise<void> {
    if (!token || token.trim() === "") {
      return;
    }

    // Ne charger les actifs que lorsque la section Actifs est affichée côté Admin/DSI
    if (activeSection !== "actifs") {
      return;
    }

    setIsLoadingAssets(true);
    setAssetError(null);

    try {
      const url = new URL("http://localhost:8000/assets/", "http://localhost:8000");

      if (assetStatusFilter !== "all") {
        url.searchParams.append("status", assetStatusFilter);
      }
      if (assetTypeFilter !== "all") {
        url.searchParams.append("type", assetTypeFilter);
      }
      if (assetDepartmentFilter !== "all") {
        url.searchParams.append("department", assetDepartmentFilter);
      }
      if (assetSearchQuery.trim() !== "") {
        url.searchParams.append("search", assetSearchQuery.trim());
      }

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Erreur HTTP chargement actifs:", res.status);
        setAssetError("Erreur lors du chargement des actifs.");
        setAssets([]);
        return;
      }

      const data: Asset[] = await res.json();
      setAssets(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des actifs:", err);
      setAssetError("Erreur lors du chargement des actifs.");
    } finally {
      setIsLoadingAssets(false);
    }
  }

  async function loadAssetTypes(): Promise<void> {
    if (!token || token.trim() === "") {
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/asset-types", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Erreur HTTP chargement types d'actifs:", res.status);
        return;
      }

      const data: AssetTypeConfig[] = await res.json();
      setAssetTypes(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des types d'actifs:", err);
    }
  }

  async function loadAssetDepartments(includeInactive: boolean = false): Promise<void> {
    if (!token || token.trim() === "") {
      return;
    }

    try {
      const url = includeInactive 
        ? "http://localhost:8000/departments?include_inactive=true"
        : "http://localhost:8000/departments";
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Erreur HTTP chargement départements:", res.status);
        return;
      }

      const data: DepartmentConfig[] = await res.json();
      setAssetDepartments(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des départements:", err);
    }
  }

  // Charger les statistiques des tables de la base de données (onglet Maintenance > Base de données)
  async function loadDatabaseTablesStats(): Promise<void> {
    if (!token || token.trim() === "") {
      return;
    }

    try {
      setIsLoadingDatabaseTables(true);
      setDatabaseTablesError(null);

      const res = await fetch("http://localhost:8000/maintenance/db-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Erreur HTTP chargement statistiques base de données:", res.status);
        setDatabaseTablesError("Impossible de charger les statistiques de la base de données.");
        setDatabaseTables([]);
        return;
      }

      const data: DatabaseTableStat[] = await res.json();
      setDatabaseTables(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques de la base de données:", err);
      setDatabaseTablesError("Erreur lors du chargement des statistiques de la base de données.");
    } finally {
      setIsLoadingDatabaseTables(false);
    }
  }

  // Fonctions de gestion des départements
  async function handleCreateDepartment() {
    if (!departmentName.trim()) {
      alert("Le nom du département est requis");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/departments?name=${encodeURIComponent(departmentName.trim())}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Erreur lors de la création du département");
        return;
      }

      alert("Agence créée avec succès");
      setShowDepartmentModal(false);
      setDepartmentName("");
      await loadAssetDepartments(true);
    } catch (err) {
      console.error("Erreur lors de la création du département:", err);
      alert("Erreur lors de la création de l'agence");
    }
  }

  async function handleUpdateDepartment() {
    if (!editingDepartment || !departmentName.trim()) {
      alert("Le nom du département est requis");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/departments/${editingDepartment.id}?name=${encodeURIComponent(departmentName.trim())}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Erreur lors de la modification du département");
        return;
      }

      alert("Agence modifiée avec succès");
      setShowDepartmentModal(false);
      setEditingDepartment(null);
      setDepartmentName("");
      await loadAssetDepartments(true);
    } catch (err) {
      console.error("Erreur lors de la modification du département:", err);
      alert("Erreur lors de la modification de l'agence");
    }
  }

  async function handleToggleDepartment(departmentId: number) {
    try {
      const res = await fetch(`http://localhost:8000/departments/${departmentId}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Erreur lors du changement de statut");
        return;
      }

      await loadAssetDepartments(true);
    } catch (err) {
      console.error("Erreur lors du changement de statut:", err);
      alert("Erreur lors du changement de statut");
    }
  }

  function openAddDepartmentModal() {
    setEditingDepartment(null);
    setDepartmentName("");
    setShowDepartmentModal(true);
  }

  function openEditDepartmentModal(dept: DepartmentConfig) {
    setEditingDepartment(dept);
    setDepartmentName(dept.name);
    setShowDepartmentModal(true);
  }

  useEffect(() => {
    async function loadData() {
      try {
        // Charger les informations de l'utilisateur connecté en premier
        const meRes = await fetch("http://localhost:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        let currentUserInfo: any = null;
        let currentUserRole: string = "";
        if (meRes.ok) {
          const meData = await meRes.json();
          currentUserInfo = {
            id: meData.id,
            full_name: meData.full_name,
            email: meData.email,
            agency: meData.agency,
            role: meData.role
          };
          setUserInfo(currentUserInfo);
          if (meData.role && meData.role.name) {
            currentUserRole = meData.role.name;
            setUserRole(currentUserRole);
            
            // Charger tous les utilisateurs (si Admin ou DSI)
            if (meData.role.name === "Admin" || meData.role.name === "DSI") {
              try {
                const usersRes = await fetch("http://localhost:8000/users/", {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (usersRes.ok) {
                  const usersData = await usersRes.json();
                  setAllUsers(usersData || []);
                } else {
                  console.error("Erreur chargement utilisateurs:", usersRes.status);
                  setAllUsers([]);
                }
              } catch (err) {
                console.error("Erreur chargement utilisateurs:", err);
                setAllUsers([]);
              }
              try {
                const rolesRes = await fetch("http://localhost:8000/auth/roles", {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (rolesRes.ok) {
                  const rolesData = await rolesRes.json();
                  setRoles(rolesData || []);
                } else {
                  setRoles([]);
                }
              } catch (err) {
                console.error("Erreur chargement rôles:", err);
                setRoles([]);
              }
            }
          }
        }

        // Charger les tickets (avec recherche si saisie, comme Adjoint DSI)
        const ticketsData = await loadTickets(ticketSearchQuery);

        // Charger les priorités actives (table priorities, is_active = true) pour le formulaire d'assignation
        try {
          const prioritiesRes = await fetch("http://localhost:8000/ticket-config/priorities", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (prioritiesRes.ok) {
            const prioritiesData = await prioritiesRes.json();
            setActivePrioritiesForAssign(prioritiesData);
          }
        } catch (err) {
          console.error("Erreur chargement priorités:", err);
        }

        // Charger la liste des techniciens avec leurs stats
        const techRes = await fetch("http://localhost:8000/users/technicians", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (techRes.ok) {
          const techData = await techRes.json();
          // Charger les stats pour chaque technicien
          const techsWithStats = await Promise.all(
            techData.map(async (tech: any) => {
              try {
                const statsRes = await fetch(`http://localhost:8000/users/technicians/${tech.id}/stats`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                if (statsRes.ok) {
                  const stats = await statsRes.json();
                  return { ...tech, ...stats };
                }
              } catch (err) {
                console.error(`Erreur stats pour ${tech.id}:`, err);
              }
              return { ...tech, workload_ratio: "0/5", resolved_today: 0, avg_response_time_minutes: 0 };
            })
          );
          setTechnicians(techsWithStats);
        }

        // Identifier les tickets délégués par le DSI connecté
        if (currentUserRole === "DSI" && currentUserInfo?.id && ticketsData && ticketsData.length > 0) {
          const delegatedTickets = ticketsData.filter((t: Ticket) => t.secretary_id !== null && t.secretary_id !== undefined);
          const ticketsDelegatedByMe = new Set<string>();
          
          // Vérifier l'historique de chaque ticket délégué pour voir s'il a été délégué par le DSI connecté
          for (const ticket of delegatedTickets) {
            try {
              const historyRes = await fetch(`http://localhost:8000/tickets/${ticket.id}/history`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (historyRes.ok) {
                const history: TicketHistory[] = await historyRes.json();
                // Chercher dans l'historique si le ticket a été délégué par le DSI connecté
                // On cherche une entrée d'historique où le user_id correspond au DSI connecté
                // et où il y a une mention de délégation (dans le reason) ou où le statut a été changé vers "en_attente_analyse" 
                // (car lors de la délégation, le statut est mis à "en_attente_analyse")
                // Comparer les IDs en tant que strings pour éviter les problèmes de type
                const dsiIdStr = String(currentUserInfo.id);
                
                // Chercher une entrée d'historique où le DSI connecté a délégué le ticket
                // Critères : user_id correspond au DSI connecté ET (raison contient mots-clés de délégation OU changement vers "en_attente_analyse")
                const delegationEntry = history.find((h: TicketHistory) => {
                  const userIdMatches = String(h.user_id) === dsiIdStr;
                  if (!userIdMatches) return false;
                  
                  // Vérifier si le reason contient des mots-clés de délégation
                  const reasonLower = (h.reason || "").toLowerCase();
                  const hasDelegationKeywords = reasonLower.includes("délégu") || 
                                                 reasonLower.includes("delegat") ||
                                                 reasonLower.includes("adjoint") ||
                                                 reasonLower.includes("délégation");
                  
                  // Vérifier si le statut a été changé vers "en_attente_analyse" (car lors de la délégation, le statut est mis à "en_attente_analyse")
                  const statusChangedToPending = h.new_status === "en_attente_analyse";
                  
                  // Si l'ancien statut n'était pas "en_attente_analyse", c'est plus probablement une délégation
                  const wasNotAlreadyPending = h.old_status !== "en_attente_analyse";
                  
                  // Un ticket est délégué si :
                  // 1. La raison contient des mots-clés de délégation, OU
                  // 2. Le DSI a mis le ticket en "en_attente_analyse" (et il n'était pas déjà en attente)
                  return hasDelegationKeywords || (statusChangedToPending && wasNotAlreadyPending);
                });
                
                if (delegationEntry) {
                  ticketsDelegatedByMe.add(ticket.id);
                } else {
                  // Fallback : si le ticket a un secretary_id et le DSI connecté a une entrée dans l'historique
                  // qui met le ticket en "en_attente_analyse", considérer comme délégation
                  const hasDSIEntryWithPendingStatus = history.some((h: TicketHistory) => 
                    String(h.user_id) === dsiIdStr && 
                    h.new_status === "en_attente_analyse"
                  );
                  
                  if (hasDSIEntryWithPendingStatus) {
                    ticketsDelegatedByMe.add(ticket.id);
                  }
                }
              } else {
                console.error(`Erreur HTTP lors du chargement de l'historique du ticket ${ticket.id}: ${historyRes.status}`);
              }
            } catch (err) {
              console.error(`Erreur lors du chargement de l'historique du ticket ${ticket.id}:`, err);
            }
          }
          setDelegatedTicketsByMe(ticketsDelegatedByMe);
          console.log(`Tickets délégués par le DSI connecté (${currentUserInfo.id}): ${ticketsDelegatedByMe.size} sur ${delegatedTickets.length} tickets avec secretary_id`);
        } else if (currentUserRole === "DSI" && currentUserInfo?.id) {
          // Si on n'a pas de tickets ou si currentUserInfo.id n'est pas défini, initialiser avec un Set vide
          setDelegatedTicketsByMe(new Set());
        }

        // Calculer les métriques à partir des tickets existants (après chargement)
        // Utiliser ticketsData directement au lieu de allTickets pour éviter le problème d'état asynchrone
        try {
          if (ticketsData && ticketsData.length > 0) {
            // Fonction pour calculer la satisfaction implicite basée sur les métriques
            const calculateImplicitSatisfaction = async (ticket: Ticket, history: TicketHistory[]): Promise<number> => {
              let score = 0;
              
              // 1. Temps de résolution (40% du score)
              if (ticket.created_at) {
                const created = new Date(ticket.created_at);
                let resolvedDate: Date | null = null;
                
                // Trouver la date de résolution - priorité : historique > resolved_at/closed_at > null
                const resolutionHistory = history.find(
                  h => h.new_status === "resolu" || h.new_status === "cloture"
                );
                if (resolutionHistory && resolutionHistory.changed_at) {
                  resolvedDate = new Date(resolutionHistory.changed_at);
                } else if (ticket.status === "cloture" && ticket.closed_at) {
                  resolvedDate = new Date(ticket.closed_at);
                } else if (ticket.status === "resolu" && ticket.resolved_at) {
                  resolvedDate = new Date(ticket.resolved_at);
                }
                // Si aucune date disponible, on ne peut pas calculer ce critère (score = 0 pour cette partie)
                
                if (resolvedDate) {
                  const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                  const diffDays = diffHours / 24;
                  
                  let resolutionScore = 0;
                  if (ticket.priority === "haute" || ticket.priority === "critique") {
                    if (diffHours < 24) resolutionScore = 100;
                    else if (diffHours < 48) resolutionScore = 80;
                    else if (diffHours < 72) resolutionScore = 60;
                    else resolutionScore = 40;
                  } else if (ticket.priority === "moyenne") {
                    if (diffDays < 3) resolutionScore = 100;
                    else if (diffDays < 5) resolutionScore = 80;
                    else if (diffDays < 7) resolutionScore = 60;
                    else resolutionScore = 40;
                  } else {
                    if (diffDays < 7) resolutionScore = 100;
                    else if (diffDays < 14) resolutionScore = 80;
                    else if (diffDays < 21) resolutionScore = 60;
                    else resolutionScore = 40;
                  }
                  score += resolutionScore * 0.4;
                }
              }
              
              // 2. Absence de réouverture (30% du score)
              const reopenCount = history.filter(
                h => h.old_status === "cloture" || h.old_status === "resolu"
              ).length;
              if (reopenCount === 0) score += 100 * 0.3;
              else if (reopenCount === 1) score += 70 * 0.3;
              else score += 40 * 0.3;
              
              // 3. Absence d'escalade (20% du score) - Vérifier si le ticket a été assigné à un technicien puis réassigné
              const assignmentChanges = history.filter(
                h => h.new_status === "assigne_technicien" || h.new_status === "en_cours"
              ).length;
              if (assignmentChanges <= 1) score += 100 * 0.2;
              else if (assignmentChanges === 2) score += 50 * 0.2;
              else score += 20 * 0.2;
              
              // 4. Temps de réponse initial (10% du score)
              const firstResponse = history.find(
                h => h.new_status === "assigne_technicien" || h.new_status === "en_cours"
              );
              if (firstResponse && ticket.created_at) {
                const created = new Date(ticket.created_at);
                const firstResponseTime = new Date(firstResponse.changed_at);
                const responseHours = (firstResponseTime.getTime() - created.getTime()) / (1000 * 60 * 60);
                
                if (responseHours < 2) score += 100 * 0.1;
                else if (responseHours < 4) score += 80 * 0.1;
                else if (responseHours < 8) score += 60 * 0.1;
                else score += 40 * 0.1;
              } else {
                score += 60 * 0.1; // Score moyen si pas de réponse enregistrée
              }
              
              return Math.round(score);
            };
            
            // Fonction helper pour formater le temps en heures et minutes
            const formatTimeInHoursMinutes = (hoursDecimal: number): string => {
              if (hoursDecimal === 0) return "0 mn";
              
              // Afficher en heures et minutes
              const hours = Math.floor(hoursDecimal);
              const minutes = Math.floor((hoursDecimal - hours) * 60);
              if (hours === 0) {
                return `${minutes} mn`;
              } else if (minutes === 0) {
                return `${hours} h`;
              } else {
                return `${hours} h ${minutes} mn`;
              }
            };
            
            // Calculer le temps moyen de résolution réel
            const resolvedTickets = ticketsData.filter((t: Ticket) => t.status === "resolu" || t.status === "cloture");
            let totalResolutionTimeHours = 0;
            let resolvedCount = 0;
            
            // Tableau pour stocker les satisfactions calculées (tous les tickets)
            const satisfactionScores: number[] = [];
            // Tableau pour stocker les satisfactions calculées (uniquement tickets assignés aux techniciens)
            const techniciansSatisfactionScores: number[] = [];
            
            // Charger l'historique pour chaque ticket résolu pour obtenir la date de résolution
            await Promise.all(
              resolvedTickets.map(async (ticket: Ticket) => {
                if (!ticket.created_at) return;
                
                try {
                  const historyRes = await fetch(`http://localhost:8000/tickets/${ticket.id}/history`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  
                  if (historyRes.ok) {
                    const history: TicketHistory[] = await historyRes.json();
                    // Trouver la date de résolution (première occurrence de "resolu" ou "cloture")
                    const resolutionHistory = history.find(
                      h => h.new_status === "resolu" || h.new_status === "cloture"
                    );
                    
                    // Trouver la date de résolution - priorité : historique > resolved_at/closed_at
                    let resolvedDate: Date | null = null;
                    if (resolutionHistory && resolutionHistory.changed_at) {
                      resolvedDate = new Date(resolutionHistory.changed_at);
                    } else if (ticket.status === "cloture" && ticket.closed_at) {
                      resolvedDate = new Date(ticket.closed_at);
                    } else if (ticket.status === "resolu" && ticket.resolved_at) {
                      resolvedDate = new Date(ticket.resolved_at);
                    }
                    
                    if (resolvedDate && ticket.created_at) {
                      const created = new Date(ticket.created_at);
                      const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                      if (diffHours >= 0) {
                        totalResolutionTimeHours += diffHours;
                        resolvedCount++;
                      }
                    }
                    // Si aucune date de résolution disponible, on exclut ce ticket du calcul du temps moyen
                    
                    // Calculer la satisfaction (hybride : feedback explicite si disponible, sinon implicite)
                    let score: number | null = null;
                    if (ticket.feedback_score !== null && ticket.feedback_score !== undefined && ticket.feedback_score > 0) {
                      // Utiliser le feedback explicite (convertir de 1-5 à pourcentage)
                      score = (ticket.feedback_score / 5) * 100;
                      satisfactionScores.push(score);
                    } else {
                      // Calculer la satisfaction implicite
                      score = await calculateImplicitSatisfaction(ticket, history);
                      satisfactionScores.push(score);
                    }
                    
                    // Si le ticket est assigné à un technicien, ajouter le score à la liste des techniciens
                    if (ticket.technician_id !== null && score !== null) {
                      techniciansSatisfactionScores.push(score);
                    }
                  }
                } catch (err) {
                  console.error(`Erreur historique ticket ${ticket.id}:`, err);
                  // En cas d'erreur, essayer d'utiliser resolved_at ou closed_at
                  if (ticket.created_at) {
                    let resolvedDate: Date | null = null;
                    if (ticket.status === "cloture" && ticket.closed_at) {
                      resolvedDate = new Date(ticket.closed_at);
                    } else if (ticket.status === "resolu" && ticket.resolved_at) {
                      resolvedDate = new Date(ticket.resolved_at);
                    }
                    
                    if (resolvedDate) {
                      const created = new Date(ticket.created_at);
                      const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                      if (diffHours >= 0) {
                        totalResolutionTimeHours += diffHours;
                        resolvedCount++;
                      }
                    }
                    // Si aucune date disponible, on exclut ce ticket du calcul
                  }
                  
                  // Score de satisfaction en cas d'erreur - seulement si on a un feedback explicite
                  if (ticket.feedback_score !== null && ticket.feedback_score !== undefined && ticket.feedback_score > 0) {
                    const score = (ticket.feedback_score / 5) * 100;
                    satisfactionScores.push(score);
                    // Si le ticket est assigné à un technicien, ajouter le score à la liste des techniciens
                    if (ticket.technician_id !== null) {
                      techniciansSatisfactionScores.push(score);
                    }
                  }
                  // Si pas de feedback et erreur, on n'ajoute pas de score (on ne peut pas calculer l'implicite sans historique)
                }
              })
            );
            
            // Note : La satisfaction est calculée uniquement pour les tickets résolus/clôturés
            // Les tickets non résolus ne sont pas inclus dans le calcul de satisfaction
            // car la satisfaction mesure la qualité du service rendu, qui n'est complète qu'après résolution
            
            const avgResolutionHours = resolvedCount > 0 ? totalResolutionTimeHours / resolvedCount : 0;
            const avgResolutionTimeFormatted = resolvedCount > 0 ? formatTimeInHoursMinutes(avgResolutionHours) : null;
            
            // Calculer la satisfaction moyenne (tous les tickets)
            let satisfactionPct: string | null = null;
            if (satisfactionScores.length > 0) {
              const avgSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
              satisfactionPct = avgSatisfaction.toFixed(1);
            }
            
            // Calculer la satisfaction moyenne pour les techniciens (uniquement tickets assignés aux techniciens)
            let techniciansSatisfactionPct = "0.0";
            if (techniciansSatisfactionScores.length > 0) {
              const avgTechniciansSatisfaction = techniciansSatisfactionScores.reduce((sum, score) => sum + score, 0) / techniciansSatisfactionScores.length;
              techniciansSatisfactionPct = avgTechniciansSatisfaction.toFixed(1);
            }
            
            // Mettre à jour les métriques (en conservant openTickets déjà calculé)
            // Ne mettre à jour que si on a calculé de nouvelles valeurs valides
            setMetrics(prev => ({
              ...prev,
              avgResolutionTime: avgResolutionTimeFormatted ?? prev.avgResolutionTime,
              userSatisfaction: satisfactionPct !== null ? `${satisfactionPct}%` : prev.userSatisfaction,
            }));
            
            // Mettre à jour la satisfaction moyenne des techniciens
            setTechniciansSatisfaction(techniciansSatisfactionPct);
          } else {
            // Si aucun ticket, garder "Chargement..." ou les valeurs précédentes (ne pas mettre "0")
            setMetrics(prev => ({
              ...prev,
              avgResolutionTime: prev.avgResolutionTime ?? null,
              userSatisfaction: prev.userSatisfaction ?? null,
            }));
            // Ne pas modifier techniciansSatisfaction si on n'a pas de données
          }
        } catch (err) {
          console.log("Erreur calcul métriques:", err);
          // En cas d'erreur, garder les valeurs précédentes (ne pas mettre "0")
          setMetrics(prev => ({
            ...prev,
            avgResolutionTime: prev.avgResolutionTime ?? null,
            userSatisfaction: prev.userSatisfaction ?? null,
          }));
          // Ne pas modifier techniciansSatisfaction en cas d'erreur
        }

         // Charger les notifications
         await loadNotifications();
         await loadUnreadCount();
       } catch (err) {
         console.error("Erreur chargement données:", err);
       }
    }
    void loadData();
    void loadNotifications();
    void loadUnreadCount();

    // Recharger automatiquement les tickets et notifications toutes les 30 secondes
    // Cela permet aux métriques (temps moyen, satisfaction, etc.) de se mettre à jour automatiquement avec les données réelles
    const interval = setInterval(() => {
      void loadTickets(ticketSearchQuery); // Rafraîchir les tickets pour mettre à jour les métriques automatiquement
      void loadNotifications();
      void loadUnreadCount();
    }, 30000);
     
     return () => clearInterval(interval);
  }, [token, ticketSearchQuery]);

  // Charger / recharger les actifs lorsque la section Actifs est visible ou que les filtres changent
  useEffect(() => {
    if (!token || token.trim() === "") return;
    if (activeSection !== "actifs") return;
    if (!(userRole === "Admin" || userRole === "DSI" || userRole === "Adjoint DSI")) return;

    void loadAssets();
  }, [
    token,
    activeSection,
    userRole,
    assetStatusFilter,
    assetTypeFilter,
    assetDepartmentFilter,
    assetSearchQuery,
  ]);

  // Debounce pour la recherche de tickets
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTickets(ticketSearchQuery);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [ticketSearchQuery, token]);

  // Recalculer les tickets délégués quand allTickets ou userInfo change
  useEffect(() => {
    async function recalculateDelegatedTickets() {
      if (userRole === "DSI" && userInfo?.id && allTickets && allTickets.length > 0) {
        const delegatedTickets = allTickets.filter((t: Ticket) => t.secretary_id !== null && t.secretary_id !== undefined);
        const ticketsDelegatedByMe = new Set<string>();
        const dsiIdStr = String(userInfo.id);
        
        // Vérifier l'historique de chaque ticket délégué
        for (const ticket of delegatedTickets) {
          try {
            const historyRes = await fetch(`http://localhost:8000/tickets/${ticket.id}/history`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (historyRes.ok) {
              const history: TicketHistory[] = await historyRes.json();
              
              // Chercher une entrée d'historique où le DSI connecté a délégué le ticket
              // Critères : user_id correspond au DSI connecté ET (raison contient mots-clés de délégation OU changement vers "en_attente_analyse")
              const delegationEntry = history.find((h: TicketHistory) => {
                const userIdMatches = String(h.user_id) === dsiIdStr;
                if (!userIdMatches) return false;
                
                // Vérifier si le reason contient des mots-clés de délégation
                const reasonLower = (h.reason || "").toLowerCase();
                const hasDelegationKeywords = reasonLower.includes("délégu") || 
                                               reasonLower.includes("delegat") ||
                                               reasonLower.includes("adjoint") ||
                                               reasonLower.includes("délégation");
                
                // Vérifier si le statut a été changé vers "en_attente_analyse" (car lors de la délégation, le statut est mis à "en_attente_analyse")
                const statusChangedToPending = h.new_status === "en_attente_analyse";
                
                // Si l'ancien statut n'était pas "en_attente_analyse", c'est plus probablement une délégation
                const wasNotAlreadyPending = h.old_status !== "en_attente_analyse";
                
                // Un ticket est délégué si :
                // 1. La raison contient des mots-clés de délégation, OU
                // 2. Le DSI a mis le ticket en "en_attente_analyse" (et il n'était pas déjà en attente)
                return hasDelegationKeywords || (statusChangedToPending && wasNotAlreadyPending);
              });
              
              if (delegationEntry) {
                ticketsDelegatedByMe.add(ticket.id);
              } else {
                // Fallback : si le ticket a un secretary_id et le DSI connecté a une entrée dans l'historique
                // qui met le ticket en "en_attente_analyse", considérer comme délégation
                const hasDSIEntryWithPendingStatus = history.some((h: TicketHistory) => 
                  String(h.user_id) === dsiIdStr && 
                  h.new_status === "en_attente_analyse"
                );
                
                if (hasDSIEntryWithPendingStatus) {
                  ticketsDelegatedByMe.add(ticket.id);
                }
              }
            }
          } catch (err) {
            console.error(`Erreur lors du chargement de l'historique du ticket ${ticket.id}:`, err);
          }
        }
        
        setDelegatedTicketsByMe(ticketsDelegatedByMe);
        console.log(`[Recalcul] Tickets délégués par le DSI (${userInfo.id}): ${ticketsDelegatedByMe.size} sur ${delegatedTickets.length} tickets avec secretary_id`);
      } else if (userRole === "DSI" && userInfo?.id && (!allTickets || allTickets.length === 0)) {
        setDelegatedTicketsByMe(new Set());
      }
    }
    
    void recalculateDelegatedTickets();
  }, [allTickets, userInfo, userRole, token]);

  // Recalculer les métriques quand allTickets change (quand un ticket est traité)
  useEffect(() => {
    if (allTickets.length === 0) return;
    
    async function recalculateMetrics() {
      try {
        // Fonction helper pour formater le temps en heures et minutes
        const formatTimeInHoursMinutes = (hoursDecimal: number): string => {
          if (hoursDecimal === 0) return "0 mn";
          
          // Afficher en heures et minutes
          const hours = Math.floor(hoursDecimal);
          const minutes = Math.floor((hoursDecimal - hours) * 60);
          if (hours === 0) {
            return `${minutes} mn`;
          } else if (minutes === 0) {
            return `${hours} h`;
          } else {
            return `${hours} h ${minutes} mn`;
          }
        };
        
        // Même logique de calcul que dans loadData mais uniquement pour les métriques
        const resolvedTickets = allTickets.filter((t: Ticket) => t.status === "resolu" || t.status === "cloture");
        let totalResolutionTimeHours = 0;
        let resolvedCount = 0;
        const satisfactionScores: number[] = [];
        const techniciansSatisfactionScores: number[] = [];
        
        // Fonction pour calculer la satisfaction implicite (même logique que dans loadData)
        const calculateImplicitSatisfaction = async (ticket: Ticket, history: TicketHistory[]): Promise<number> => {
          let score = 0;
          if (ticket.created_at) {
            const created = new Date(ticket.created_at);
            let resolvedDate: Date | null = null;
            if (ticket.status === "cloture" && ticket.closed_at) {
              resolvedDate = new Date(ticket.closed_at);
            } else if (ticket.status === "resolu" && ticket.resolved_at) {
              resolvedDate = new Date(ticket.resolved_at);
            }
            
            if (resolvedDate) {
              const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
              const diffDays = diffHours / 24;
              
              let resolutionScore = 0;
              if (ticket.priority === "haute" || ticket.priority === "critique") {
                if (diffHours < 24) resolutionScore = 100;
                else if (diffHours < 48) resolutionScore = 80;
                else if (diffHours < 72) resolutionScore = 60;
                else resolutionScore = 40;
              } else if (ticket.priority === "moyenne") {
                if (diffDays < 3) resolutionScore = 100;
                else if (diffDays < 5) resolutionScore = 80;
                else if (diffDays < 7) resolutionScore = 60;
                else resolutionScore = 40;
              } else {
                if (diffDays < 7) resolutionScore = 100;
                else if (diffDays < 14) resolutionScore = 80;
                else if (diffDays < 21) resolutionScore = 60;
                else resolutionScore = 40;
              }
              score += resolutionScore * 0.4;
            }
            
            const reopenCount = history.filter(h => h.old_status === "cloture" || h.old_status === "resolu").length;
            if (reopenCount === 0) score += 100 * 0.3;
            else if (reopenCount === 1) score += 70 * 0.3;
            else score += 40 * 0.3;
            
            const assignmentChanges = history.filter(h => h.new_status === "assigne_technicien" || h.new_status === "en_cours").length;
            if (assignmentChanges <= 1) score += 100 * 0.2;
            else if (assignmentChanges === 2) score += 50 * 0.2;
            else score += 20 * 0.2;
            
            const firstResponse = history.find(h => h.new_status === "assigne_technicien" || h.new_status === "en_cours");
            if (firstResponse && ticket.created_at) {
              const created = new Date(ticket.created_at);
              const firstResponseTime = new Date(firstResponse.changed_at);
              const responseHours = (firstResponseTime.getTime() - created.getTime()) / (1000 * 60 * 60);
              if (responseHours < 2) score += 100 * 0.1;
              else if (responseHours < 4) score += 80 * 0.1;
              else if (responseHours < 8) score += 60 * 0.1;
              else score += 40 * 0.1;
            } else {
              score += 60 * 0.1;
            }
          }
          return Math.round(score);
        };
        
        await Promise.all(
          resolvedTickets.map(async (ticket: Ticket) => {
            if (!ticket.created_at) return;
            
            try {
              const historyRes = await fetch(`http://localhost:8000/tickets/${ticket.id}/history`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (historyRes.ok) {
                const history: TicketHistory[] = await historyRes.json();
                const resolutionHistory = history.find(h => h.new_status === "resolu" || h.new_status === "cloture");
                
                let resolvedDate: Date | null = null;
                if (resolutionHistory && resolutionHistory.changed_at) {
                  resolvedDate = new Date(resolutionHistory.changed_at);
                } else if (ticket.status === "cloture" && ticket.closed_at) {
                  resolvedDate = new Date(ticket.closed_at);
                } else if (ticket.status === "resolu" && ticket.resolved_at) {
                  resolvedDate = new Date(ticket.resolved_at);
                }
                
                if (resolvedDate && ticket.created_at) {
                  const created = new Date(ticket.created_at);
                  const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                  if (diffHours >= 0) {
                    totalResolutionTimeHours += diffHours;
                    resolvedCount++;
                  }
                }
                
                let score: number | null = null;
                if (ticket.feedback_score !== null && ticket.feedback_score !== undefined && ticket.feedback_score > 0) {
                  score = (ticket.feedback_score / 5) * 100;
                  satisfactionScores.push(score);
                } else {
                  score = await calculateImplicitSatisfaction(ticket, history);
                  satisfactionScores.push(score);
                }
                
                if (ticket.technician_id !== null && score !== null) {
                  techniciansSatisfactionScores.push(score);
                }
              }
            } catch (err) {
              console.error(`Erreur historique ticket ${ticket.id}:`, err);
              if (ticket.created_at) {
                let resolvedDate: Date | null = null;
                if (ticket.status === "cloture" && ticket.closed_at) {
                  resolvedDate = new Date(ticket.closed_at);
                } else if (ticket.status === "resolu" && ticket.resolved_at) {
                  resolvedDate = new Date(ticket.resolved_at);
                }
                
                if (resolvedDate) {
                  const created = new Date(ticket.created_at);
                  const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                  if (diffHours >= 0) {
                    totalResolutionTimeHours += diffHours;
                    resolvedCount++;
                  }
                }
              }
              
              if (ticket.feedback_score !== null && ticket.feedback_score !== undefined && ticket.feedback_score > 0) {
                const score = (ticket.feedback_score / 5) * 100;
                satisfactionScores.push(score);
                if (ticket.technician_id !== null) {
                  techniciansSatisfactionScores.push(score);
                }
              }
            }
          })
        );
        
        const avgResolutionHours = resolvedCount > 0 ? totalResolutionTimeHours / resolvedCount : 0;
        // Ne mettre à jour que si on a des données valides (ne pas mettre "0 mn")
        const avgResolutionTimeFormatted = resolvedCount > 0 ? formatTimeInHoursMinutes(avgResolutionHours) : null;
        let satisfactionPct: string | null = null;
        if (satisfactionScores.length > 0) {
          const avgSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
          satisfactionPct = avgSatisfaction.toFixed(1);
        }
        
        // Ne mettre à jour techniciansSatisfaction que si on a des données valides
        let techniciansSatisfactionPct: string | null = null;
        if (techniciansSatisfactionScores.length > 0) {
          const avgTechniciansSatisfaction = techniciansSatisfactionScores.reduce((sum, score) => sum + score, 0) / techniciansSatisfactionScores.length;
          techniciansSatisfactionPct = avgTechniciansSatisfaction.toFixed(1);
        }
        
        // Mettre à jour seulement si on a calculé de nouvelles valeurs valides
        if (avgResolutionTimeFormatted !== null || satisfactionPct !== null) {
          setMetrics(prev => ({
            ...prev,
            avgResolutionTime: avgResolutionTimeFormatted ?? prev.avgResolutionTime,
            userSatisfaction: satisfactionPct !== null ? `${satisfactionPct}%` : prev.userSatisfaction,
          }));
        }
        // Ne mettre à jour techniciansSatisfaction que si on a une nouvelle valeur valide
        if (techniciansSatisfactionPct !== null) {
          setTechniciansSatisfaction(techniciansSatisfactionPct);
        }
      } catch (err) {
        console.error("Erreur recalcul métriques:", err);
      }
    }
    
    void recalculateMetrics();
  }, [allTickets, token]);

  // Calculer le taux de réouverture quand on est dans la section métriques
  useEffect(() => {
    if (selectedReport === "metriques" && !reopeningCalculated && allTickets.length > 0) {
      const checkReopenedTickets = async () => {
        let reopenedCount = 0;
        
        // Vérifier tous les tickets pour voir s'ils ont été réouverts
        await Promise.all(
          allTickets.map(async (ticket) => {
            try {
              const historyRes = await fetch(`http://localhost:8000/tickets/${ticket.id}/history`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (historyRes.ok) {
                const history: TicketHistory[] = await historyRes.json();
                // Vérifier si le ticket a été résolu/clôturé puis réouvert
                const resolutionIndex = history.findIndex(h => 
                  h.new_status === "resolu" || h.new_status === "cloture"
                );
                if (resolutionIndex >= 0) {
                  // Vérifier s'il y a un changement de statut après la résolution
                  const afterResolution = history.slice(resolutionIndex + 1);
                  if (afterResolution.length > 0 && 
                      afterResolution.some(h => 
                        h.new_status !== "resolu" && h.new_status !== "cloture"
                      )) {
                    reopenedCount++;
                  }
                }
              }
            } catch (err) {
              console.error(`Erreur historique ticket ${ticket.id}:`, err);
            }
          })
        );
        
        setReopenedTicketsCount(reopenedCount);
        setReopeningCalculated(true);
      };
      
      void checkReopenedTickets();
    }
    
    // Réinitialiser quand on change de section
    if (selectedReport !== "metriques") {
      setReopeningCalculated(false);
      setReopenedTicketsCount(0);
    }
  }, [selectedReport, allTickets, token, reopeningCalculated]);

  // Fonction pour filtrer les techniciens selon le type du ticket
  function getFilteredTechnicians(ticketType: string | undefined): Technician[] {
    if (!ticketType) return technicians;
    
    // Si le ticket est de type "materiel", afficher uniquement les techniciens matériel
    if (ticketType === "materiel") {
      return technicians.filter(tech => tech.specialization === "materiel");
    }
    
    // Si le ticket est de type "applicatif", afficher uniquement les techniciens applicatif
    if (ticketType === "applicatif") {
      return technicians.filter(tech => tech.specialization === "applicatif");
    }
    
    // Par défaut, retourner tous les techniciens
    return technicians;
  }

  async function handleAssign(ticketId: string) {
    if (!selectedTechnician) {
      alert("Veuillez sélectionner un technicien");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          technician_id: selectedTechnician,
          priority: assignmentPriority,
        }),
      });

      if (res.ok) {
        const ticketsRes = await fetch("http://localhost:8000/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
        }
        setSelectedTechnician("");
        setAssignmentNotes("");
        setAssignmentPriority(activePrioritiesForAssign.length > 0 ? activePrioritiesForAssign[0].code : "moyenne");
        setShowAssignModal(false);
        setAssignTicketId(null);
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Ticket assigné avec succès");
      } else {
        let errorMessage = "Impossible d'assigner le ticket";
        try {
          const error = await res.json();
          errorMessage = error.detail || error.message || errorMessage;
        } catch (e) {
          const errorText = await res.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (err) {
      console.error("Erreur assignation:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'assignation";
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadTicketDetails(ticketId: string) {
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTicketDetails(data);
        setShowTicketDetailsPage(true);
        await Promise.all([loadTicketHistory(ticketId), loadTicketComments(ticketId)]);
      } else {
        alert("Erreur lors du chargement des détails du ticket");
      }
    } catch {
      alert("Erreur lors du chargement des détails");
    }
  }

  async function loadTicketHistory(ticketId: string) {
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTicketHistory(Array.isArray(data) ? data : []);
      } else {
        setTicketHistory([]);
      }
    } catch {
      setTicketHistory([]);
    }
  }

  async function loadTicketComments(ticketId: string) {
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTicketComments(Array.isArray(data) ? data : []);
      } else {
        setTicketComments([]);
      }
    } catch {
      setTicketComments([]);
    }
  }

  async function handleAddCommentFromDetails(ticketId: string) {
    const content = detailCommentText.trim();
    if (!content) {
      alert("Veuillez entrer un commentaire");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          content,
          type: detailCommentInternal ? "technique" : "utilisateur",
        }),
      });
      if (res.ok) {
        setDetailCommentText("");
        await Promise.all([loadTicketComments(ticketId), loadTicketHistory(ticketId)]);
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Commentaire ajouté avec succès");
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible d'ajouter le commentaire"}`);
      }
    } catch (err) {
      console.error("Erreur ajout commentaire:", err);
      alert("Erreur lors de l'ajout du commentaire");
    } finally {
      setLoading(false);
    }
  }

  const getInitialsForComment = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  async function handleReassign(ticketId: string) {
    if (!selectedTechnician) {
      alert("Veuillez sélectionner un technicien pour la réassignation");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/reassign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          technician_id: selectedTechnician,
          reason: "Réassignation par DSI",
          notes: assignmentNotes || undefined,
        }),
      });

      if (res.ok) {
        const ticketsRes = await fetch("http://localhost:8000/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
        }
        setSelectedTechnician("");
        setAssignmentNotes("");
        setShowReassignModal(false);
        setReassignTicketId(null);
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Ticket réassigné avec succès");
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de réassigner le ticket"}`);
      }
    } catch (err) {
      console.error("Erreur réassignation:", err);
      alert("Erreur lors de la réassignation");
    } finally {
      setLoading(false);
    }
  }

  function handleReassignClick(ticketId: string) {
    setReassignTicketId(ticketId);
    setSelectedTechnician("");
    setAssignmentNotes("");
    setShowReassignModal(true);
  }

  function handleAssignClick(ticketId: string) {
    const ticket = allTickets.find(t => t.id === ticketId);
    setAssignTicketId(ticketId);
    setSelectedTechnician("");
    setAssignmentNotes("");
    const activeCodes = activePrioritiesForAssign.map((p) => p.code);
    const defaultPriority = activePrioritiesForAssign.length > 0 ? activePrioritiesForAssign[0].code : "moyenne";
    setAssignmentPriority(ticket?.priority && activeCodes.includes(ticket.priority) ? ticket.priority : defaultPriority);
    setShowAssignModal(true);
  }
  function handleDelegateClick(ticketId: string) {
    setDelegateTicketId(ticketId);
    setSelectedAdjoint("");
    setAssignmentNotes("");
    setShowDelegateModal(true);
  }
  async function handleDelegate(ticketId: string) {
    if (!selectedAdjoint) {
      alert("Veuillez sélectionner un adjoint DSI");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/delegate-adjoint`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adjoint_id: selectedAdjoint,
          reason: assignmentNotes || undefined,
          notes: assignmentNotes || undefined,
        }),
      });
      if (res.ok) {
        const ticketsRes = await fetch("http://localhost:8000/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
        }
        setSelectedAdjoint("");
        setAssignmentNotes("");
        setShowDelegateModal(false);
        setDelegateTicketId(null);
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Ticket délégué à un adjoint avec succès");
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de déléguer le ticket"}`);
      }
    } catch (err) {
      alert("Erreur lors de la délégation");
    } finally {
      setLoading(false);
    }
  }

  // Fonction helper pour vérifier si l'utilisateur peut escalader
  function canEscalate(): boolean {
    return userRole === "Adjoint DSI" || userRole === "DSI" || userRole === "Admin";
  }

  async function handleEscalate(ticketId: string) {
    if (!confirm("Êtes-vous sûr de vouloir escalader ce ticket ? La priorité sera augmentée.")) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/escalate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const ticketsRes = await fetch("http://localhost:8000/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
        }
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Ticket escaladé avec succès");
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible d'escalader le ticket"}`);
      }
    } catch (err) {
      console.error("Erreur escalade:", err);
      alert("Erreur lors de l'escalade");
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(ticketId: string) {
    if (!confirm("Êtes-vous sûr de vouloir clôturer ce ticket ?")) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "cloture",
        }),
      });

      if (res.ok) {
        const ticketsRes = await fetch("http://localhost:8000/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
        }
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Ticket clôturé avec succès");
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de clôturer le ticket"}`);
      }
    } catch (err) {
      console.error("Erreur clôture:", err);
      alert("Erreur lors de la clôture");
    } finally {
      setLoading(false);
    }
  }

  async function loadRejectionReason(ticketId: string) {
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const history = await res.json();
        console.log("Historique du ticket:", history); // Debug
        // Trouver l'entrée d'historique correspondant au rejet
        const rejectionEntry = history.find((h: any) => 
          h.new_status === "rejete" && h.reason && (
            h.reason.includes("Validation utilisateur: Rejeté") || 
            h.reason.includes("Rejeté")
          )
        );
        console.log("Entrée de rejet trouvée:", rejectionEntry); // Debug
        if (rejectionEntry && rejectionEntry.reason) {
          // Extraire le motif du format "Validation utilisateur: Rejeté. Motif: [motif]"
          const match = rejectionEntry.reason.match(/Motif:\s*(.+)/);
          const extractedReason = match ? match[1].trim() : rejectionEntry.reason;
          console.log("Motif extrait:", extractedReason); // Debug
          return extractedReason;
        }
      } else {
        console.error("Erreur HTTP:", res.status, res.statusText);
      }
      return "Motif non disponible";
    } catch (err) {
      console.error("Erreur chargement historique:", err);
      return "Erreur lors du chargement du motif";
    }
  }

  async function handleReopenClick(ticketId: string) {
    setReopenTicketId(ticketId);
    setShowReopenModal(true);
    setSelectedTechnician("");
    setAssignmentNotes("");
    setRejectionReason("");
    setLoadingRejectionReason(true);
    
    try {
      const reason = await loadRejectionReason(ticketId);
      setRejectionReason(reason);
    } catch (err) {
      console.error("Erreur:", err);
      setRejectionReason("Erreur lors du chargement du motif de rejet");
    } finally {
      setLoadingRejectionReason(false);
    }
  }

  async function handleReopen(ticketId: string) {
    if (!selectedTechnician) {
      alert("Veuillez sélectionner un technicien pour la réouverture");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/reopen`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          technician_id: selectedTechnician,
          reason: assignmentNotes || "Réouverture après rejet utilisateur",
        }),
      });

      if (res.ok) {
        const ticketsRes = await fetch("http://localhost:8000/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
        }
        setSelectedTechnician("");
        setAssignmentNotes("");
        setReopenTicketId(null);
        setRejectionReason("");
        setShowReopenModal(false);
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
        alert("Ticket réouvert et réassigné avec succès");
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de réouvrir le ticket"}`);
      }
    } catch (err) {
      console.error("Erreur réouverture:", err);
      alert("Erreur lors de la réouverture");
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateTicket(ticketId: string, validated: boolean) {
    if (!validated && (!validationRejectionReason || !validationRejectionReason.trim())) {
      alert("Veuillez indiquer un motif de rejet");
      return;
    }

    setLoading(true);
    try {
      const requestBody: { validated: boolean; rejection_reason?: string } = { validated };
      if (!validated && validationRejectionReason) {
        requestBody.rejection_reason = validationRejectionReason.trim();
      }

      const res = await fetch(`http://localhost:8000/tickets/${ticketId}/validate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        alert(validated ? "Ticket validé et clôturé avec succès !" : "Ticket relancé. Le technicien a été notifié avec le motif.");
        const ticketsData = await loadTickets(ticketSearchQuery);
        setAllTickets(ticketsData);
        setValidationTicket(null);
        setValidationRejectionReason("");
        setShowValidationRejectionForm(false);
        if (ticketDetails?.id === ticketId) await loadTicketDetails(ticketId);
      } else {
        const error = await res.json();
        alert(`Erreur: ${error.detail || "Impossible de valider le ticket"}`);
      }
    } catch (err) {
      console.error("Erreur validation:", err);
      alert("Erreur lors de la validation");
    } finally {
      setLoading(false);
    }
  }

  // Filtrer les tickets selon leur statut
  const pendingTickets = allTickets.filter((t) => t.status === "en_attente_analyse");
  const assignedTickets = allTickets.filter((t) => t.status === "assigne_technicien" || t.status === "en_cours");
  const resolvedTickets = allTickets.filter((t) => t.status === "resolu");
  const closedTickets = allTickets.filter((t) => t.status === "cloture");
  const rejectedTickets = allTickets.filter((t) => t.status === "rejete");

  const pendingCount = pendingTickets.length;
  const assignedCount = assignedTickets.length;
  const resolvedCount = resolvedTickets.length;
  const closedCount = closedTickets.length;
  const totalTicketsCount = allTickets.length;
  // Taux de résolution GLOBAL = (résolu + clôturé) / total
  const resolvedOrClosedCount = resolvedCount + closedCount;
  const resolutionRate =
    totalTicketsCount > 0 ? `${Math.round((resolvedOrClosedCount / totalTicketsCount) * 100)}%` : "0%";

  // Indicateurs simplifiés pour la section "État système" (basés sur les vraies données tickets/actifs)
  const openTicketsCount = pendingCount + assignedCount;
  const workloadRatio = totalTicketsCount > 0 ? openTicketsCount / totalTicketsCount : 0;
  const cpuUsage = Math.round(
    Math.min(95, Math.max(5, 20 + workloadRatio * 60)) // entre ~20% et 80–95% selon la charge
  );
  const memoryUsage = Math.round(
    Math.min(95, Math.max(5, 15 + (pendingCount / Math.max(openTicketsCount || 1, 1)) * 70))
  );
  const storageUsage = Math.round(
    totalAssets > 0 ? Math.min(95, Math.max(5, ((totalAssets - inStockCount) / totalAssets) * 100)) : 10
  );
  const bandwidthUsage = Math.round(
    Math.min(
      95,
      Math.max(
        5,
        notifications.length > 0
          ? 20 + Math.min(notifications.length, 50) * 1.2 // plus il y a de notifications récentes, plus la “bande passante” est utilisée
          : 10
      )
    )
  );

  // Pourcentages de disponibilité par service (basés sur les vraies données de charge)
  const baseDbAvailability = 100 - workloadRatio * 5;
  const dbAvailability = Math.max(95, Math.min(99.99, baseDbAvailability));

  const baseAuthAvailability =
    100 -
    (notifications.length > 0 ? Math.min(notifications.length, 100) * 0.03 : 0);
  const authAvailability = Math.max(95, Math.min(99.99, baseAuthAvailability));

  const baseApiAvailability =
    100 -
    (openTicketsCount > 0
      ? Math.min(openTicketsCount, Math.max(totalTicketsCount, 1)) * 0.05
      : 0);
  const apiAvailability = Math.max(95, Math.min(99.99, baseApiAvailability));

  const formatAvailability = (value: number): string => `${value.toFixed(2)}%`;

  // Statistiques agrégées pour la section Techniciens
  const activeTechniciansCount = technicians.filter((tech) => {
    return tech.actif === true;
  }).length;

  // Taux de résolution pour les TECHNICIENS (uniquement les tickets assignés aux techniciens)
  // Fonctions pour préparer les données des graphiques
  const prepareTimeSeriesData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at).toISOString().split('T')[0];
        return ticketDate === dateStr;
      });
      const resolvedDayTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at).toISOString().split('T')[0];
        return ticketDate === dateStr && (t.status === "resolu" || t.status === "cloture");
      });

      return {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        créés: dayTickets.length,
        résolus: resolvedDayTickets.length
      };
    });
  };

  const prepareStatusEvolutionData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at).toISOString().split('T')[0];
        return ticketDate === dateStr;
      });

      return {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        'En attente': dayTickets.filter(t => t.status === "en_attente_analyse").length,
        'En cours': dayTickets.filter(t => t.status === "assigne_technicien" || t.status === "en_cours").length,
        'Résolus': dayTickets.filter(t => t.status === "resolu").length,
        'Clôturés': dayTickets.filter(t => t.status === "cloture").length
      };
    });
  };

  const preparePriorityEvolutionData = () => {
    const priorities = ['critique', 'haute', 'moyenne', 'faible', 'non_definie'];
    const fromPriorities = priorities.map(priority => ({
      priorité: priority === 'non_definie' ? 'Non définie' : priority.charAt(0).toUpperCase() + priority.slice(1),
      nombre: allTickets.filter(t => t.priority === priority).length
    }));
    const nonDefinieCount = allTickets.filter(t => t.priority == null || t.priority === "").length;
    if (nonDefinieCount > 0) {
      fromPriorities.push({ priorité: "Non définie", nombre: nonDefinieCount });
    }
    return fromPriorities;
  };

  const prepareDayOfWeekData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((day, index) => {
      const dayTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at);
        return ticketDate.getDay() === (index === 6 ? 0 : index + 1);
      });
      return {
        jour: day,
        tickets: dayTickets.length
      };
    });
  };

  const prepareHourlyData = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const hourTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at);
        return ticketDate.getHours() === i;
      });
      return {
        heure: `${i}h`,
        tickets: hourTickets.length
      };
    });
  };

  const prepareSatisfactionData = () => {
    const ticketsWithFeedback = allTickets.filter(t => t.feedback_score !== null && t.feedback_score !== undefined);
    if (ticketsWithFeedback.length === 0) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const dayTickets = ticketsWithFeedback.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at).toISOString().split('T')[0];
        return ticketDate === dateStr;
      });
      const avgSatisfaction = dayTickets.length > 0
        ? dayTickets.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / dayTickets.length
        : 0;

      return {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        satisfaction: Number(avgSatisfaction.toFixed(1))
      };
    });
  };

  // Fonction pour préparer les données du graphique "Tickets cette semaine"
  const prepareWeeklyTicketsData = () => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lundi = 1, Dimanche = 0
    startOfWeek.setDate(today.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return days.map((day, index) => {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + index);
      const nextDay = new Date(currentDay);
      nextDay.setDate(currentDay.getDate() + 1);

      // Tickets créés ce jour
      const createdTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at);
        return ticketDate >= currentDay && ticketDate < nextDay;
      });

      // Tickets résolus ce jour
      const resolvedTickets = allTickets.filter(t => {
        if (!t.resolved_at) return false;
        const ticketDate = new Date(t.resolved_at);
        return ticketDate >= currentDay && ticketDate < nextDay;
      });

      return {
        jour: day,
        Créés: createdTickets.length,
        Résolus: resolvedTickets.length
      };
    });
  };

  // Fonction pour préparer les données du graphique "Évolution mensuelle par type"
  const prepareMonthlyEvolutionData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    return months.map((month, index) => {
      const monthIndex = index; // Janvier = 0, Février = 1, etc.
      const startOfMonth = new Date(currentYear, monthIndex, 1);
      const endOfMonth = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999);

      // Tickets Matériel ce mois
      const materielTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at);
        return ticketDate >= startOfMonth && ticketDate <= endOfMonth && 
               (t.type === "materiel" || t.type?.toLowerCase() === "materiel" || 
                t.category?.toLowerCase().includes("materiel"));
      });

      // Tickets Applicatif ce mois
      const applicatifTickets = allTickets.filter(t => {
        if (!t.created_at) return false;
        const ticketDate = new Date(t.created_at);
        return ticketDate >= startOfMonth && ticketDate <= endOfMonth && 
               (t.type === "applicatif" || t.type?.toLowerCase() === "applicatif" || 
                t.category?.toLowerCase().includes("applicatif"));
      });

      return {
        mois: month,
        Matériel: materielTickets.length,
        Applicatif: applicatifTickets.length
      };
    });
  };

  // Fonction pour préparer les données du graphique "Répartition par priorité"
  const preparePriorityData = () => {
    const critique = allTickets.filter(t => t.priority === "critique").length;
    const haute = allTickets.filter(t => t.priority === "haute").length;
    const moyenne = allTickets.filter(t => t.priority === "moyenne").length;
    const basse = allTickets.filter(t => t.priority === "basse" || t.priority === "faible").length;
    const nonDefinie = allTickets.filter(t => t.priority === "non_definie").length;
    const total = allTickets.length;
    
    return [
      { name: "Critique", value: critique, percentage: total > 0 ? Math.round((critique / total) * 100) : 0 },
      { name: "Haute", value: haute, percentage: total > 0 ? Math.round((haute / total) * 100) : 0 },
      { name: "Moyenne", value: moyenne, percentage: total > 0 ? Math.round((moyenne / total) * 100) : 0 },
      { name: "Basse", value: basse, percentage: total > 0 ? Math.round((basse / total) * 100) : 0 },
      { name: "Non définie", value: nonDefinie, percentage: total > 0 ? Math.round((nonDefinie / total) * 100) : 0 }
    ];
  };

  // Fonction pour préparer les données du graphique "Répartition par statut"
  const prepareStatusData = () => {
    // Tickets délégués par le DSI connecté (priorité sur les autres catégories)
    const delegue = allTickets.filter(t => delegatedTicketsByMe.has(t.id)).length;
    
    // Tickets en cours (excluant les délégués par le DSI connecté)
    const enCours = allTickets.filter(t => 
      (t.status === "en_cours" || t.status === "assigne_technicien") && 
      !delegatedTicketsByMe.has(t.id)
    ).length;
    
    // Tickets ouverts (excluant les délégués par le DSI connecté)
    const ouvert = allTickets.filter(t => 
      (t.status === "ouvert" || t.status === "en_attente_analyse") && 
      !delegatedTicketsByMe.has(t.id)
    ).length;
    
    // Tickets relancés (excluant les délégués par le DSI connecté)
    const relance = allTickets.filter(t => 
      t.status === "rejete" && 
      !delegatedTicketsByMe.has(t.id)
    ).length;
    
    // Tickets résolus (excluant les délégués par le DSI connecté)
    const resolu = allTickets.filter(t => 
      t.status === "resolu" && 
      !delegatedTicketsByMe.has(t.id)
    ).length;
    
    const total = allTickets.length;
    
    return [
      { name: "En cours", value: enCours, percentage: total > 0 ? Math.round((enCours / total) * 100) : 0 },
      { name: "En attente d'assignation", value: ouvert, percentage: total > 0 ? Math.round((ouvert / total) * 100) : 0 },
      { name: "Relancé", value: relance, percentage: total > 0 ? Math.round((relance / total) * 100) : 0 },
      { name: "Résolu", value: resolu, percentage: total > 0 ? Math.round((resolu / total) * 100) : 0 },
      { name: "Délégué", value: delegue, percentage: total > 0 ? Math.round((delegue / total) * 100) : 0 }
    ];
  };

  // Couleurs pour les graphiques
  const colors = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#a855f7',
    pink: '#ec4899',
    indigo: '#6366f1',
    teal: '#14b8a6',
    orange: '#f97316',
    cyan: '#06b6d4'
  };

  const statusColors = {
    'En attente': '#f59e0b',
    'En cours': '#3b82f6',
    'Résolus': '#10b981',
    'Clôturés': '#6b7280'
  };

  const priorityColors = {
    'Critique': '#E53E3E',
    'Haute': '#F59E0B',
    'Moyenne': '#0DADDB',
    'Faible': '#6b7280',
    'Non définie': '#6b7280'
  };

  const prepareAgencyData = () => {
    const agencies = Array.from(new Set(allTickets.map((t) => t.creator?.agency || t.user_agency).filter(Boolean)));
    return agencies.map(agency => {
      const agencyTickets = allTickets.filter((t) => (t.creator?.agency || t.user_agency) === agency);
      return {
        agence: agency,
        tickets: agencyTickets.length
      };
    }).sort((a, b) => b.tickets - a.tickets); // Trier par ordre décroissant
  };

  // Fonctions pour préparer les données sur les rôles/utilisateurs
  const prepareUsersByRoleData = () => {
    const roleCounts: { [key: string]: number } = {};
    allUsers.forEach((user: any) => {
      const roleName = user.role?.name || "Sans rôle";
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });
    return Object.entries(roleCounts).map(([role, count]) => ({
      rôle: role,
      nombre: count
    })).sort((a, b) => b.nombre - a.nombre);
  };

  // Fonction pour préparer les données sur les techniciens par spécialisation
  const prepareTechniciansBySpecializationData = () => {
    const specializationCounts: { [key: string]: number } = {};
    technicians.forEach((tech) => {
      const spec = tech.specialization || "Non spécifié";
      specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
    });
    return Object.entries(specializationCounts).map(([spec, count]) => ({
      spécialisation: spec,
      nombre: count
    }));
  };

  // Fonction pour préparer les données sur la charge de travail par technicien
  const prepareTechnicianWorkloadData = () => {
    return technicians.map((tech) => {
      const assignedTickets = allTickets.filter((t) => t.technician_id === tech.id);
      const resolvedTickets = assignedTickets.filter((t) => t.status === "resolu" || t.status === "cloture");
      return {
        technicien: tech.full_name,
        assignés: assignedTickets.length,
        résolus: resolvedTickets.length
      };
    }).sort((a, b) => b.assignés - a.assignés).slice(0, 10); // Top 10
  };

  // Fonction pour préparer les données "Analyse par agence" (Total, Résolus, En attente)
  const prepareAgencyAnalysisData = () => {
    const agencies = Array.from(new Set(allTickets.map((t) => t.creator?.agency || t.user_agency).filter(Boolean)));
    
    // Si aucune agence, utiliser les 5 agences par défaut avec des données vides
    const defaultAgencies = ["Siège Abidjan", "Agence Cocody", "Agence Plateau", "Agence Marcory", "Agence Yopougon"];
    const allAgencies = agencies.length > 0 ? agencies : defaultAgencies;
    
    return allAgencies.map(agency => {
      const agencyTickets = allTickets.filter((t) => (t.creator?.agency || t.user_agency) === agency);
      const total = agencyTickets.length;
      const resolved = agencyTickets.filter((t) => t.status === "resolu" || t.status === "cloture").length;
      const pending = agencyTickets.filter((t) => t.status === "en_attente_analyse" || t.status === "assigne_technicien" || t.status === "en_cours").length;
      
      return {
        agence: agency,
        Total: total,
        Résolus: resolved,
        "En attente": pending
      };
    }).sort((a, b) => b.Total - a.Total).slice(0, 5); // Top 5 agences
  };

  // Fonction pour préparer les données "Performance des techniciens"
  const prepareTechnicianPerformanceData = () => {
    return technicians.map((tech) => {
      // Utiliser les données du backend qui sont plus fiables
      const resolvedCount = (tech.resolved_tickets_count || 0) + (tech.closed_tickets_count || 0);
      
      // Calculer le temps moyen de résolution en heures
      let avgTimeHours = 0;
      if (tech.avg_resolution_time_days) {
        avgTimeHours = tech.avg_resolution_time_days * 24;
      } else {
        // Fallback: calculer depuis les tickets si disponible
        const assignedTickets = allTickets.filter((t) => t.technician_id === tech.id);
        const resolvedTickets = assignedTickets.filter((t) => t.status === "resolu" || t.status === "cloture");
        if (resolvedTickets.length > 0) {
          const times: number[] = [];
          resolvedTickets.forEach(ticket => {
            if (ticket.created_at && ticket.resolved_at) {
              const created = new Date(ticket.created_at).getTime();
              const resolved = new Date(ticket.resolved_at).getTime();
              const diffHours = (resolved - created) / (1000 * 60 * 60);
              if (diffHours > 0) {
                times.push(diffHours);
              }
            }
          });
          if (times.length > 0) {
            avgTimeHours = times.reduce((a, b) => a + b, 0) / times.length;
          }
        }
      }
      
      // Calculer le pourcentage de performance (taux de réussite)
      const assignedTickets = allTickets.filter((t) => t.technician_id === tech.id);
      const performance = tech.success_rate || (resolvedCount > 0 && assignedTickets.length > 0 
        ? Math.round((resolvedCount / assignedTickets.length) * 100) 
        : 0);
      
      return {
        technicien: tech.full_name,
        performance: resolvedCount, // Nombre de tickets résolus pour la hauteur des barres
        avgTimeHours: avgTimeHours,
        performancePercent: performance,
        resolvedCount: resolvedCount
      };
    }).sort((a, b) => b.performance - a.performance); // Tous les techniciens triés par performance
  };

  // Fonction pour préparer les données sur les utilisateurs les plus actifs (créateurs de tickets)
  const prepareMostActiveUsersData = () => {
    const userTicketCounts: { [key: string]: { name: string; count: number } } = {};
    allTickets.forEach((ticket) => {
      const userId = ticket.creator_id;
      const userName = ticket.creator?.full_name || "Utilisateur inconnu";
      if (userId) {
        if (!userTicketCounts[userId]) {
          userTicketCounts[userId] = { name: userName, count: 0 };
        }
        userTicketCounts[userId].count += 1;
      }
    });
    return Object.values(userTicketCounts)
      .map((user) => ({
        utilisateur: user.name,
        tickets: user.count
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10); // Top 10
  };

  // Fonction pour préparer les données sur le temps moyen de résolution par type
  const prepareResolutionTimeByTypeData = () => {
    const typeData: { [key: string]: { total: number; count: number } } = {};
    allTickets.forEach((ticket) => {
      if (ticket.type && ticket.resolved_at && ticket.created_at) {
        const created = new Date(ticket.created_at).getTime();
        const resolved = new Date(ticket.resolved_at).getTime();
        const hours = (resolved - created) / (1000 * 60 * 60);
        
        if (!typeData[ticket.type]) {
          typeData[ticket.type] = { total: 0, count: 0 };
        }
        typeData[ticket.type].total += hours;
        typeData[ticket.type].count += 1;
      }
    });
    return Object.entries(typeData).map(([type, data]) => ({
      type: type === "materiel" ? "Matériel" : "Applicatif",
      tempsMoyen: data.count > 0 ? Math.round(data.total / data.count) : 0
    }));
  };

  // Fonctions pour analyser les problèmes récurrents
  const getMostFrequentProblems = () => {
    // Analyser les titres de tickets pour trouver des patterns récurrents significatifs
    // Utiliser les titres complets des tickets récurrents plutôt que des mots individuels
    const ticketGroups: { [key: string]: { title: string; count: number } } = {};
    
    allTickets.forEach(ticket => {
      if (ticket.title) {
        // Normaliser le titre pour grouper les tickets similaires
        const normalizedTitle = ticket.title.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim();
        
        // Utiliser les premiers mots significatifs comme clé (3-5 mots)
        const words = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
        if (words.length >= 3) {
          // Prendre les 3-5 premiers mots significatifs
          const key = words.slice(0, Math.min(5, words.length)).join(' ');
          
          if (!ticketGroups[key]) {
            ticketGroups[key] = { title: ticket.title, count: 0 };
          }
          ticketGroups[key].count += 1;
        }
      }
    });

    // Filtrer pour ne garder que les patterns qui apparaissent au moins 2 fois
    // Retourner TOUS les problèmes (pas de limitation)
    return Object.values(ticketGroups)
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map(item => ({
        problème: item.title,
        occurrences: item.count
      }));
  };

  const getProblematicApplications = () => {
    // Analyser les types de tickets et les titres pour identifier les applications/équipements problématiques
    const typeCounts: { [key: string]: number } = {};
    
    allTickets.forEach(ticket => {
      const type = ticket.type || 'autre';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        application: type === 'materiel' ? 'Matériel' : type === 'applicatif' ? 'Applicatif' : type.charAt(0).toUpperCase() + type.slice(1),
        tickets: count
      }));
  };

  const getRecurringTicketsHistory = () => {
    // Trouver les tickets avec des titres similaires (problèmes récurrents)
    const ticketGroups: { [key: string]: Ticket[] } = {};
    
    allTickets.forEach(ticket => {
      if (ticket.title) {
        // Normaliser le titre pour grouper les tickets similaires
        const normalizedTitle = ticket.title.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim();
        
        // Utiliser les premiers mots comme clé de regroupement
        const key = normalizedTitle.split(/\s+/).slice(0, 3).join(' ');
        
        if (!ticketGroups[key]) {
          ticketGroups[key] = [];
        }
        ticketGroups[key].push(ticket);
      }
    });

    // Retourner TOUS les groupes avec plus d'un ticket (problèmes récurrents) - pas de limitation
    return Object.entries(ticketGroups)
      .filter(([_, tickets]) => tickets.length > 1)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([_, tickets]) => ({
        titre: tickets[0].title,
        occurrences: tickets.length,
        dernier: tickets.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })[0].created_at
      }));
  };

  // Fonctions d'export pour les rapports
  const exportProblemsHistoryToPDF = (reportType: string = "Problèmes récurrents") => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Rapport: ${reportType}`, 14, 20);
      
      const problems = getRecurringTicketsHistory();
      const mostFrequent = getMostFrequentProblems();
      const problematicApps = getProblematicApplications();
      
      if (problems.length > 0) {
        doc.setFontSize(14);
        doc.text("Historique des problèmes", 14, 35);
        
        const tableData = problems.map(item => [
          item.titre || "",
          item.occurrences.toString(),
          item.dernier ? new Date(item.dernier).toLocaleDateString('fr-FR') : 'N/A'
        ]);
        
        autoTable(doc, {
          startY: 40,
          head: [['Problème', 'Occurrences', 'Dernière occurrence']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 95] },
        });
      }
      
      if (mostFrequent.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 40;
        doc.setFontSize(14);
        doc.text("Problèmes les plus fréquents", 14, finalY + 15);
        
        const tableData2 = mostFrequent.map(item => [
          item.problème || "",
          item.occurrences.toString()
        ]);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Problème', 'Occurrences']],
          body: tableData2,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 95] },
        });
      }
      
      if (problematicApps.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 40;
        doc.setFontSize(14);
        doc.text("Applications/équipements problématiques", 14, finalY + 15);
        
        const tableData3 = problematicApps.map(item => [
          item.application || "",
          item.tickets.toString()
        ]);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Application/Équipement', 'Nombre de tickets']],
          body: tableData3,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 95] },
        });
      }
      
      doc.save(`Rapport_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Erreur lors de l'export PDF");
    }
  };

  // Fonction pour nettoyer les noms de feuilles Excel (caractères interdits: \ / ? * [ ])
  const sanitizeSheetName = (name: string): string => {
    // Excel limite les noms de feuilles à 31 caractères et interdit: \ / ? * [ ]
    return name
      .replace(/[\\/:?*[\]]/g, '-') // Remplacer les caractères interdits par des tirets
      .substring(0, 31); // Limiter à 31 caractères
  };

  const exportProblemsHistoryToExcel = (reportType: string = "Problèmes récurrents") => {
    try {
      const problems = getRecurringTicketsHistory();
      const mostFrequent = getMostFrequentProblems();
      const problematicApps = getProblematicApplications();
      
      const wb = XLSX.utils.book_new();
      let hasSheets = false;
      
      // Feuille 1: Historique des problèmes
      if (problems.length > 0) {
        const wsData = [
          ['Problème', 'Occurrences', 'Dernière occurrence'],
          ...problems.map(item => [
            item.titre || "",
            item.occurrences,
            item.dernier ? new Date(item.dernier).toLocaleDateString('fr-FR') : 'N/A'
          ])
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName("Historique des problèmes"));
        hasSheets = true;
      }
      
      // Feuille 2: Problèmes les plus fréquents
      if (mostFrequent.length > 0) {
        const wsData2 = [
          ['Problème', 'Occurrences'],
          ...mostFrequent.map(item => [
            item.problème || "",
            item.occurrences
          ])
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(wsData2);
        XLSX.utils.book_append_sheet(wb, ws2, sanitizeSheetName("Problèmes fréquents"));
        hasSheets = true;
      }
      
      // Feuille 3: Applications/équipements problématiques
      if (problematicApps.length > 0) {
        const wsData3 = [
          ['Application/Équipement', 'Nombre de tickets'],
          ...problematicApps.map(item => [
            item.application || "",
            item.tickets
          ])
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(wsData3);
        XLSX.utils.book_append_sheet(wb, ws3, sanitizeSheetName("Applications-Équipements"));
        hasSheets = true;
      }
      
      // Si aucune feuille n'a été créée, créer une feuille par défaut
      if (!hasSheets) {
        const defaultData = [
          ['Rapport', reportType],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          [''],
          ['Aucune donnée disponible pour ce rapport.']
        ];
        const ws = XLSX.utils.aoa_to_sheet(defaultData);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName("Rapport"));
      }
      
      // Générer le nom de fichier
      const fileName = `Rapport_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Vérifier que le workbook n'est pas vide avant d'écrire
      if (wb.SheetNames.length === 0) {
        throw new Error("Le classeur Excel est vide");
      }
      
      // Essayer d'abord avec writeFile, puis avec une méthode alternative si nécessaire
      try {
        XLSX.writeFile(wb, fileName);
      } catch (writeError) {
        // Méthode alternative utilisant un blob
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Erreur lors de l'export Excel: ${errorMessage}`);
    }
  };

  // Fonction pour obtenir le nom du rapport
  const getReportName = (reportType?: string): string => {
    if (reportType) return reportType;
    const reportNames: { [key: string]: string } = {
      "statistiques": "Statistiques générales",
      "metriques": "Métriques de performance",
      "agence": "Analyses par agence",
      "technicien": "Analyses par technicien",
      "evolution": "Évolutions dans le temps",
      "recurrents": "Problèmes récurrents",
      "performance": "Rapports de Performance",
      "tickets": "Rapports Tickets"
    };
    return reportNames[selectedReport] || "Rapport";
  };

  // Fonction générique pour exporter en PDF selon le type de rapport
  const exportToPDF = (reportType?: string) => {
    const reportName = getReportName(reportType);
    try {
      if (selectedReport === "recurrents") {
        exportProblemsHistoryToPDF(reportName);
      } else if (selectedReport === "statistiques") {
        // Export spécifique pour Statistiques générales
        const doc = new jsPDF();
        let yPos = 20;
        
        // En-tête
        doc.setFontSize(16);
        doc.text(`Rapport: ${reportName}`, 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPos);
        yPos += 7;
        doc.text(`Généré par: ${userInfo?.full_name || 'Utilisateur'}`, 14, yPos);
        yPos += 15;
        
        // Métriques principales
        doc.setFontSize(14);
        doc.text("Métriques principales", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.text(`Nombre total de tickets: ${allTickets.length}`, 14, yPos);
        yPos += 7;
        doc.text(`Tickets résolus/clôturés: ${resolvedCount + closedCount}`, 14, yPos);
        yPos += 15;
        
        // Répartition par statut
        doc.setFontSize(14);
        doc.text("Répartition par statut", 14, yPos);
        yPos += 10;
        
        const statusData = [
          ["Statut", "Nombre", "Pourcentage"],
          ["En attente", pendingCount.toString(), allTickets.length > 0 ? ((pendingCount / allTickets.length) * 100).toFixed(1) + "%" : "0%"],
          ["Assignés/En cours", assignedCount.toString(), allTickets.length > 0 ? ((assignedCount / allTickets.length) * 100).toFixed(1) + "%" : "0%"],
          ["Résolus", resolvedCount.toString(), allTickets.length > 0 ? ((resolvedCount / allTickets.length) * 100).toFixed(1) + "%" : "0%"],
          ["Clôturés", closedCount.toString(), allTickets.length > 0 ? ((closedCount / allTickets.length) * 100).toFixed(1) + "%" : "0%"],
          ["Relancés", rejectedTickets.length.toString(), allTickets.length > 0 ? ((rejectedTickets.length / allTickets.length) * 100).toFixed(1) + "%" : "0%"]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [statusData[0]],
          body: statusData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [0, 123, 255] },
          styles: { fontSize: 10 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Répartition par priorité
        doc.setFontSize(14);
        doc.text("Répartition par priorité", 14, yPos);
        yPos += 10;
        
        const priorityData = [
          ["Priorité", "Nombre", "Pourcentage"]
        ];
        
        ["critique", "haute", "moyenne", "faible", "non_definie"].forEach((priority) => {
          const count = allTickets.filter((t) => t.priority === priority).length;
          priorityData.push([
            priority === "non_definie" ? "Non définie" : priority.charAt(0).toUpperCase() + priority.slice(1),
            count.toString(),
            allTickets.length > 0 ? ((count / allTickets.length) * 100).toFixed(1) + "%" : "0%"
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [priorityData[0]],
          body: priorityData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [40, 167, 69] },
          styles: { fontSize: 10 }
        });
        
        doc.save(`Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (selectedReport === "metriques") {
        // Export spécifique pour Métriques de performance
        const doc = new jsPDF();
        let yPos = 20;
        
        // En-tête
        doc.setFontSize(16);
        doc.text(`Rapport: ${reportName}`, 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPos);
        yPos += 7;
        doc.text(`Généré par: ${userInfo?.full_name || 'Utilisateur'}`, 14, yPos);
        yPos += 15;
        
        // Calculer les métriques principales (identique au calcul dans l'interface)
        const avgResolutionTimeDisplay = metrics.avgResolutionTime ?? "N/A";
        const resolvedTickets = allTickets.filter(t => t.status === "resolu" || t.status === "cloture");
        
        // Taux de satisfaction
        const ticketsWithFeedback = resolvedTickets.filter(t => t.feedback_score !== null && t.feedback_score !== undefined);
        const avgFeedback = ticketsWithFeedback.length > 0 
          ? ticketsWithFeedback.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / ticketsWithFeedback.length
          : null;
        const rejectedTicketsRpt = allTickets.filter(t => t.status === "rejete");
        const resolvedCountRpt = resolvedTickets.length;
        const rejectedCountRpt = rejectedTicketsRpt.length;
        const denomRpt = resolvedCountRpt + rejectedCountRpt;
        let satisfactionRate = 0;
        if (avgFeedback !== null) {
          satisfactionRate = (avgFeedback / 5) * 100;
        } else if (denomRpt > 0) {
          satisfactionRate = (resolvedCountRpt / denomRpt) * 100;
        }
        
        // Tickets escaladés
        const escalatedTickets = allTickets.filter((t) => 
          t.priority === "critique" && 
          (t.status === "en_attente_analyse" || t.status === "assigne_technicien" || t.status === "en_cours")
        ).length;
        
        // Taux de réouverture
        const totalResolvedOrClosed = resolvedTickets.length;
        const reopeningRate = totalResolvedOrClosed > 0 
          ? ((reopenedTicketsCount / totalResolvedOrClosed) * 100).toFixed(1) 
          : "0.0";
        
        // Volume de tickets - Ce mois
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const thisMonthTickets = allTickets.filter(t => {
          if (!t.created_at) return false;
          const created = new Date(t.created_at);
          return created >= currentMonthStart;
        });
        
        const lastMonthTickets = allTickets.filter(t => {
          if (!t.created_at) return false;
          const created = new Date(t.created_at);
          return created >= lastMonthStart && created <= lastMonthEnd;
        });
        
        const thisMonthResolved = thisMonthTickets.filter(t => t.status === "resolu" || t.status === "cloture").length;
        const thisMonthCreated = thisMonthTickets.length;
        const thisMonthPending = thisMonthTickets.filter(t => 
          t.status !== "resolu" && t.status !== "cloture" && t.status !== "rejete"
        ).length;
        
        const lastMonthCreated = lastMonthTickets.length;
        const createdChange = lastMonthCreated > 0 
          ? ((thisMonthCreated - lastMonthCreated) / lastMonthCreated * 100).toFixed(0)
          : "0";
        const resolutionRate = thisMonthCreated > 0 
          ? ((thisMonthResolved / thisMonthCreated) * 100).toFixed(0)
          : "0";
        const pendingRate = thisMonthCreated > 0 
          ? ((thisMonthPending / thisMonthCreated) * 100).toFixed(0)
          : "0";
        
        // Performance par catégorie
        const materielTickets = resolvedTickets.filter(t => t.type === "materiel");
        const applicatifTickets = resolvedTickets.filter(t => t.type === "applicatif");
        
        const calculateAvgTime = (tickets: Ticket[]) => {
          let total = 0;
          let count = 0;
          tickets.forEach(ticket => {
            // Ne compter que les tickets avec une date de création ET une date de résolution/clôture réelle
            if (ticket.created_at && (ticket.resolved_at || ticket.closed_at)) {
              const created = new Date(ticket.created_at);
              const resolved = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date(ticket.closed_at!);
              const diffDays = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
              // Ne compter que si le résultat est valide (différence positive)
              if (diffDays >= 0) {
                total += diffDays;
                count++;
              }
            }
          });
          return count > 0 ? (total / count).toFixed(1) : "0.0";
        };
        
        const materielAvgDays = calculateAvgTime(materielTickets);
        const applicatifAvgDays = calculateAvgTime(applicatifTickets);
        
        // Indicateurs clés de performance
        doc.setFontSize(14);
        doc.text("Indicateurs clés de performance", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const kpiData = [
          ["Indicateur", "Valeur", "Détails"],
          ["Temps moyen de résolution", avgResolutionTimeDisplay, "Objectif: 3 jours"],
          ["Taux de satisfaction utilisateur", `${satisfactionRate.toFixed(1)}%`, avgFeedback !== null ? `Note moyenne: ${avgFeedback.toFixed(1)}/5` : "Basé sur résolu/rejeté"],
          ["Tickets escaladés", escalatedTickets.toString(), "Critiques en cours"],
          ["Taux de réouverture", `${reopeningRate}%`, "Tickets rouverts après résolution"]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [kpiData[0]],
          body: kpiData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [0, 123, 255] },
          styles: { fontSize: 10 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Volume de tickets - Ce mois
        doc.setFontSize(14);
        doc.text("Volume de tickets - Ce mois", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const volumeData = [
          ["Métrique", "Valeur", "Détails"],
          ["Total créés", thisMonthCreated.toString(), `vs mois dernier: ${createdChange}%`],
          ["Total résolus", thisMonthResolved.toString(), `Taux de résolution: ${resolutionRate}%`],
          ["En attente", thisMonthPending.toString(), `Nécessitent action: ${pendingRate}%`]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [volumeData[0]],
          body: volumeData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [40, 167, 69] },
          styles: { fontSize: 10 }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Performance par catégorie
        doc.setFontSize(14);
        doc.text("Performance par catégorie - Temps moyen", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const categoryData = [
          ["Catégorie", "Temps moyen (jours)", "Tickets traités"],
          ["Matériel", materielAvgDays + " jours", materielTickets.length.toString()],
          ["Applicatif", applicatifAvgDays + " jours", applicatifTickets.length.toString()]
        ];
        
        autoTable(doc, {
          startY: yPos,
          head: [categoryData[0]],
          body: categoryData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [124, 58, 237] },
          styles: { fontSize: 10 }
        });
        
        doc.save(`Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (selectedReport === "agence") {
        // Export spécifique pour Analyses par agence
        const doc = new jsPDF();
        let yPos = 20;
        
        // En-tête
        doc.setFontSize(16);
        doc.text(`Rapport: ${reportName}`, 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPos);
        yPos += 7;
        doc.text(`Généré par: ${userInfo?.full_name || 'Utilisateur'}`, 14, yPos);
        yPos += 15;
        
        // Préparer les données des agences
        const agencies = Array.from(new Set(allTickets.map((t) => t.creator?.agency || t.user_agency).filter(Boolean)));
        const agencyData = agencies.map((agency) => {
          const agencyTickets = allTickets.filter((t) => (t.creator?.agency || t.user_agency) === agency);
          const resolvedAgencyTickets = agencyTickets.filter(t => t.status === "resolu" || t.status === "cloture");
          
          // Calculer le temps moyen de résolution (uniquement avec dates réelles)
          let totalResolutionTime = 0;
          let countWithDates = 0;
          
          resolvedAgencyTickets.forEach(ticket => {
            if (ticket.created_at && (ticket.resolved_at || ticket.closed_at)) {
              const created = new Date(ticket.created_at);
              const resolved = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date(ticket.closed_at!);
              const diffTime = resolved.getTime() - created.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              if (diffDays >= 0) {
                totalResolutionTime += diffDays;
                countWithDates++;
              }
            }
          });
          
          const avgResolutionDays = countWithDates > 0 ? totalResolutionTime / countWithDates : 0;
          const avgResolutionDisplay = countWithDates > 0 
            ? avgResolutionDays % 1 === 0 
              ? `${Math.round(avgResolutionDays)} jour${Math.round(avgResolutionDays) > 1 ? 's' : ''}`
              : `${avgResolutionDays.toFixed(1)} jours`
            : "N/A";
          
          // Calculer la satisfaction
          const ticketsWithFeedback = resolvedAgencyTickets.filter(t => t.feedback_score !== null && t.feedback_score !== undefined);
          let satisfactionDisplay = "N/A";
          
          if (ticketsWithFeedback.length > 0) {
            const avgFeedback = ticketsWithFeedback.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / ticketsWithFeedback.length;
            satisfactionDisplay = `${((avgFeedback / 5) * 100).toFixed(1)}%`;
          } else if (resolvedAgencyTickets.length > 0) {
            const rejectedAgencyTickets = agencyTickets.filter(t => t.status === "rejete");
            const resolvedCount = resolvedAgencyTickets.length;
            const rejectedCount = rejectedAgencyTickets.length;
            const totalProcessed = resolvedCount + rejectedCount;
            if (totalProcessed > 0) {
              const satisfactionRate = (resolvedCount / totalProcessed) * 100;
              satisfactionDisplay = `${satisfactionRate.toFixed(1)}%`;
            }
          }
          
          return {
            agence: agency,
            nombreTickets: agencyTickets.length,
            tempsMoyen: avgResolutionDisplay,
            satisfaction: satisfactionDisplay
          };
        }).sort((a, b) => b.nombreTickets - a.nombreTickets);
        
        // Tableau Volume de tickets par agence
        doc.setFontSize(14);
        doc.text("Volume de tickets par agence", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const agencyTableData = [
          ["Agence", "Nombre de tickets", "Temps moyen", "Satisfaction"]
        ];
        
        agencyData.forEach(agency => {
          agencyTableData.push([
            agency.agence || "N/A",
            agency.nombreTickets.toString(),
            agency.tempsMoyen,
            agency.satisfaction
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [agencyTableData[0]],
          body: agencyTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [0, 123, 255] },
          styles: { fontSize: 10 }
        });
        
        doc.save(`Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (selectedReport === "technicien") {
        // Export spécifique pour Analyses par technicien
        const doc = new jsPDF();
        let yPos = 20;
        
        // En-tête
        doc.setFontSize(16);
        doc.text(`Rapport: ${reportName}`, 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPos);
        yPos += 7;
        doc.text(`Généré par: ${userInfo?.full_name || 'Utilisateur'}`, 14, yPos);
        yPos += 15;
        
        // Préparer les données des techniciens (identique au calcul dans l'interface)
        const technicianData = technicians.map((tech) => {
          const techTickets = allTickets.filter((t) => t.technician_id === tech.id);
          const inProgress = techTickets.filter((t) => t.status === "assigne_technicien" || t.status === "en_cours").length;
          const resolvedTickets = techTickets.filter((t) => t.status === "resolu" || t.status === "cloture");
          
          // Calculer le temps moyen de résolution (uniquement avec dates réelles)
          let avgTimeDisplay = "N/A";
          if (resolvedTickets.length > 0) {
            let totalHours = 0;
            let countWithDates = 0;
            
            resolvedTickets.forEach((ticket) => {
              if (ticket.created_at) {
                const created = new Date(ticket.created_at);
                let resolvedDate: Date | null = null;
                
                if (ticket.status === "cloture" && ticket.closed_at) {
                  resolvedDate = new Date(ticket.closed_at);
                } else if (ticket.status === "resolu" && ticket.resolved_at) {
                  resolvedDate = new Date(ticket.resolved_at);
                }
                
                if (resolvedDate) {
                  const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                  if (diffHours >= 0) {
                    totalHours += diffHours;
                    countWithDates++;
                  }
                }
              }
            });
            
            if (countWithDates > 0) {
              const avgHours = totalHours / countWithDates;
              if (avgHours < 24) {
                avgTimeDisplay = `${avgHours.toFixed(1)}h`;
              } else {
                const avgDays = avgHours / 24;
                avgTimeDisplay = `${avgDays.toFixed(1)}j`;
              }
            }
          }
          
          // Calculer la satisfaction
          let satisfactionDisplay = "N/A";
          if (resolvedTickets.length > 0) {
            const ticketsWithFeedback = resolvedTickets.filter((t) => t.feedback_score !== null && t.feedback_score !== undefined);
            
            if (ticketsWithFeedback.length > 0) {
              const avgFeedback = ticketsWithFeedback.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / ticketsWithFeedback.length;
              const satisfactionRate = (avgFeedback / 5) * 100;
              satisfactionDisplay = `${satisfactionRate.toFixed(1)}%`;
            } else {
              // Calculer satisfaction implicite basée sur le temps de résolution
              let totalSatisfaction = 0;
              let countSatisfaction = 0;
              
              resolvedTickets.forEach((ticket) => {
                if (ticket.created_at) {
                  const created = new Date(ticket.created_at);
                  let resolvedDate: Date | null = null;
                  
                  if (ticket.status === "cloture" && ticket.closed_at) {
                    resolvedDate = new Date(ticket.closed_at);
                  } else if (ticket.status === "resolu" && ticket.resolved_at) {
                    resolvedDate = new Date(ticket.resolved_at);
                  }
                  
                  if (resolvedDate) {
                    const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                    const diffDays = diffHours / 24;
                    
                    let satisfactionScore = 0;
                    if (ticket.priority === "haute" || ticket.priority === "critique") {
                      if (diffHours < 24) satisfactionScore = 100;
                      else if (diffHours < 48) satisfactionScore = 80;
                      else if (diffHours < 72) satisfactionScore = 60;
                      else satisfactionScore = 40;
                    } else if (ticket.priority === "moyenne") {
                      if (diffDays < 3) satisfactionScore = 100;
                      else if (diffDays < 5) satisfactionScore = 80;
                      else if (diffDays < 7) satisfactionScore = 60;
                      else satisfactionScore = 40;
                    } else {
                      if (diffDays < 7) satisfactionScore = 100;
                      else if (diffDays < 14) satisfactionScore = 80;
                      else if (diffDays < 21) satisfactionScore = 60;
                      else satisfactionScore = 40;
                    }
                    
                    totalSatisfaction += satisfactionScore;
                    countSatisfaction++;
                  }
                }
              });
              
              if (countSatisfaction > 0) {
                const avgSatisfaction = totalSatisfaction / countSatisfaction;
                satisfactionDisplay = `${avgSatisfaction.toFixed(1)}%`;
              }
            }
          }
          
          return {
            technicien: tech.full_name,
            ticketsTraites: resolvedTickets.length,
            tempsMoyen: avgTimeDisplay,
            chargeActuelle: inProgress,
            satisfaction: satisfactionDisplay
          };
        });
        
        // Tableau Performance des techniciens
        doc.setFontSize(14);
        doc.text("Performance des techniciens", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const techTableData = [
          ["Technicien", "Tickets traités", "Temps moyen", "Charge actuelle", "Satisfaction"]
        ];
        
        technicianData.forEach(tech => {
          techTableData.push([
            tech.technicien,
            tech.ticketsTraites.toString(),
            tech.tempsMoyen,
            tech.chargeActuelle.toString(),
            tech.satisfaction
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [techTableData[0]],
          body: techTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [0, 123, 255] },
          styles: { fontSize: 10 }
        });
        
        doc.save(`Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else if (selectedReport === "evolutions") {
        // Export spécifique pour Évolutions dans le temps
        const doc = new jsPDF();
        let yPos = 20;
        
        // En-tête
        doc.setFontSize(16);
        doc.text(`Rapport: ${reportName}`, 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, yPos);
        yPos += 7;
        doc.text(`Généré par: ${userInfo?.full_name || 'Utilisateur'}`, 14, yPos);
        yPos += 15;
        
        // Volume de tickets (30 derniers jours)
        doc.setFontSize(14);
        doc.text("Volume de tickets (30 derniers jours)", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const timeSeriesData = prepareTimeSeriesData();
        const timeSeriesTableData = [
          ["Date", "Créés", "Résolus"]
        ];
        timeSeriesData.forEach(item => {
          timeSeriesTableData.push([
            item.date,
            item.créés.toString(),
            item.résolus.toString()
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [timeSeriesTableData[0]],
          body: timeSeriesTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [0, 123, 255] },
          styles: { fontSize: 9 },
          pageBreak: 'auto'
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Évolution par statut (7 derniers jours)
        doc.setFontSize(14);
        doc.text("Évolution par statut (7 derniers jours)", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const statusEvolutionData = prepareStatusEvolutionData();
        const statusEvolutionTableData = [
          ["Date", "En attente", "En cours", "Résolus", "Clôturés"]
        ];
        statusEvolutionData.forEach(item => {
          statusEvolutionTableData.push([
            item.date,
            item['En attente'].toString(),
            item['En cours'].toString(),
            item['Résolus'].toString(),
            item['Clôturés'].toString()
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [statusEvolutionTableData[0]],
          body: statusEvolutionTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [40, 167, 69] },
          styles: { fontSize: 9 },
          pageBreak: 'auto'
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Répartition par priorité
        doc.setFontSize(14);
        doc.text("Répartition par priorité", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const priorityEvolutionData = preparePriorityEvolutionData();
        const priorityTableData = [
          ["Priorité", "Nombre"]
        ];
        priorityEvolutionData.forEach(item => {
          priorityTableData.push([
            item.priorité,
            item.nombre.toString()
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [priorityTableData[0]],
          body: priorityTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [124, 58, 237] },
          styles: { fontSize: 10 },
          pageBreak: 'auto'
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Pics d'activité (jours de la semaine)
        doc.setFontSize(14);
        doc.text("Pics d'activité (jours de la semaine)", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const dayOfWeekData = prepareDayOfWeekData();
        const dayTableData = [
          ["Jour", "Nombre de tickets"]
        ];
        dayOfWeekData.forEach(item => {
          dayTableData.push([
            item.jour,
            item.tickets.toString()
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [dayTableData[0]],
          body: dayTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [255, 193, 7] },
          styles: { fontSize: 10 },
          pageBreak: 'auto'
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Répartition par heure
        doc.setFontSize(14);
        doc.text("Répartition des tickets par heure de la journée", 14, yPos);
        yPos += 10;
        doc.setFontSize(11);
        
        const hourlyData = prepareHourlyData();
        const hourlyTableData = [
          ["Heure", "Nombre de tickets"]
        ];
        hourlyData.forEach(item => {
          hourlyTableData.push([
            item.heure,
            item.tickets.toString()
          ]);
        });
        
        autoTable(doc, {
          startY: yPos,
          head: [hourlyTableData[0]],
          body: hourlyTableData.slice(1),
          theme: 'striped',
          headStyles: { fillColor: [23, 162, 184] },
          styles: { fontSize: 9 },
          pageBreak: 'auto'
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 15;
        
        // Évolution de la satisfaction (si disponible)
        const satisfactionData = prepareSatisfactionData();
        if (satisfactionData.length > 0) {
          doc.setFontSize(14);
          doc.text("Évolution de la satisfaction utilisateur (7 derniers jours)", 14, yPos);
          yPos += 10;
          doc.setFontSize(11);
          
          const satisfactionTableData = [
            ["Date", "Satisfaction (sur 5)"]
          ];
          satisfactionData.forEach(item => {
            satisfactionTableData.push([
              item.date,
              item.satisfaction.toString()
            ]);
          });
          
          autoTable(doc, {
            startY: yPos,
            head: [satisfactionTableData[0]],
            body: satisfactionTableData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [220, 53, 69] },
            styles: { fontSize: 10 }
          });
        }
        
        doc.save(`Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // Export générique pour les autres rapports
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Rapport: ${reportName}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
        doc.text(`Généré par: ${userInfo?.full_name || 'Utilisateur'}`, 14, 40);
        doc.save(`Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Erreur lors de l'export PDF");
    }
  };

  // Fonction générique pour exporter en Excel selon le type de rapport
  const exportToExcel = (reportType?: string) => {
    const reportName = getReportName(reportType);
    try {
      if (selectedReport === "recurrents") {
        exportProblemsHistoryToExcel(reportName);
      } else if (selectedReport === "statistiques") {
        // Export spécifique pour Statistiques générales
        const wb = XLSX.utils.book_new();
        
        // Feuille 1: Métriques principales
        const metricsData = [
          ['Rapport', reportName],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          ['Généré par', userInfo?.full_name || 'Utilisateur'],
          [''],
          ['Métriques principales'],
          ['Nombre total de tickets', allTickets.length],
          ['Tickets résolus/clôturés', resolvedCount + closedCount],
          ['']
        ];
        const metricsWs = XLSX.utils.aoa_to_sheet(metricsData);
        XLSX.utils.book_append_sheet(wb, metricsWs, sanitizeSheetName("Métriques"));
        
        // Feuille 2: Répartition par statut
        const statusData = [
          ['Statut', 'Nombre', 'Pourcentage'],
          ['En attente', pendingCount, allTickets.length > 0 ? ((pendingCount / allTickets.length) * 100).toFixed(1) + '%' : '0%'],
          ['Assignés/En cours', assignedCount, allTickets.length > 0 ? ((assignedCount / allTickets.length) * 100).toFixed(1) + '%' : '0%'],
          ['Résolus', resolvedCount, allTickets.length > 0 ? ((resolvedCount / allTickets.length) * 100).toFixed(1) + '%' : '0%'],
          ['Clôturés', closedCount, allTickets.length > 0 ? ((closedCount / allTickets.length) * 100).toFixed(1) + '%' : '0%'],
          ['Relancés', rejectedTickets.length, allTickets.length > 0 ? ((rejectedTickets.length / allTickets.length) * 100).toFixed(1) + '%' : '0%']
        ];
        const statusWs = XLSX.utils.aoa_to_sheet(statusData);
        XLSX.utils.book_append_sheet(wb, statusWs, sanitizeSheetName("Par statut"));
        
        // Feuille 3: Répartition par priorité
        const priorityData = [
          ['Priorité', 'Nombre', 'Pourcentage']
        ];
        ["critique", "haute", "moyenne", "faible", "non_definie"].forEach((priority) => {
          const count = allTickets.filter((t) => t.priority === priority).length;
          priorityData.push([
            priority === "non_definie" ? "Non définie" : priority.charAt(0).toUpperCase() + priority.slice(1),
            count.toString(),
            allTickets.length > 0 ? ((count / allTickets.length) * 100).toFixed(1) + '%' : '0%'
          ]);
        });
        const priorityWs = XLSX.utils.aoa_to_sheet(priorityData);
        XLSX.utils.book_append_sheet(wb, priorityWs, sanitizeSheetName("Par priorité"));
        
        XLSX.writeFile(wb, `Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (selectedReport === "metriques") {
        // Export spécifique pour Métriques de performance
        const wb = XLSX.utils.book_new();
        
        // Calculer les métriques principales (identique au calcul dans l'interface)
        const avgResolutionTimeDisplay = metrics.avgResolutionTime ?? "N/A";
        const resolvedTickets = allTickets.filter(t => t.status === "resolu" || t.status === "cloture");
        
        // Taux de satisfaction
        const ticketsWithFeedback = resolvedTickets.filter(t => t.feedback_score !== null && t.feedback_score !== undefined);
        const avgFeedback = ticketsWithFeedback.length > 0 
          ? ticketsWithFeedback.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / ticketsWithFeedback.length
          : null;
        const rejectedTicketsRpt = allTickets.filter(t => t.status === "rejete");
        const resolvedCountRpt = resolvedTickets.length;
        const rejectedCountRpt = rejectedTicketsRpt.length;
        const denomRpt = resolvedCountRpt + rejectedCountRpt;
        let satisfactionRate = 0;
        if (avgFeedback !== null) {
          satisfactionRate = (avgFeedback / 5) * 100;
        } else if (denomRpt > 0) {
          satisfactionRate = (resolvedCountRpt / denomRpt) * 100;
        }
        
        // Tickets escaladés
        const escalatedTickets = allTickets.filter((t) => 
          t.priority === "critique" && 
          (t.status === "en_attente_analyse" || t.status === "assigne_technicien" || t.status === "en_cours")
        ).length;
        
        // Taux de réouverture
        const totalResolvedOrClosed = resolvedTickets.length;
        const reopeningRate = totalResolvedOrClosed > 0 
          ? ((reopenedTicketsCount / totalResolvedOrClosed) * 100).toFixed(1) 
          : "0.0";
        
        // Volume de tickets - Ce mois
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const thisMonthTickets = allTickets.filter(t => {
          if (!t.created_at) return false;
          const created = new Date(t.created_at);
          return created >= currentMonthStart;
        });
        
        const lastMonthTickets = allTickets.filter(t => {
          if (!t.created_at) return false;
          const created = new Date(t.created_at);
          return created >= lastMonthStart && created <= lastMonthEnd;
        });
        
        const thisMonthResolved = thisMonthTickets.filter(t => t.status === "resolu" || t.status === "cloture").length;
        const thisMonthCreated = thisMonthTickets.length;
        const thisMonthPending = thisMonthTickets.filter(t => 
          t.status !== "resolu" && t.status !== "cloture" && t.status !== "rejete"
        ).length;
        
        const lastMonthCreated = lastMonthTickets.length;
        const createdChange = lastMonthCreated > 0 
          ? ((thisMonthCreated - lastMonthCreated) / lastMonthCreated * 100).toFixed(0)
          : "0";
        const resolutionRate = thisMonthCreated > 0 
          ? ((thisMonthResolved / thisMonthCreated) * 100).toFixed(0)
          : "0";
        const pendingRate = thisMonthCreated > 0 
          ? ((thisMonthPending / thisMonthCreated) * 100).toFixed(0)
          : "0";
        
        // Performance par catégorie
        const materielTickets = resolvedTickets.filter(t => t.type === "materiel");
        const applicatifTickets = resolvedTickets.filter(t => t.type === "applicatif");
        
        const calculateAvgTime = (tickets: Ticket[]) => {
          let total = 0;
          let count = 0;
          tickets.forEach(ticket => {
            // Ne compter que les tickets avec une date de création ET une date de résolution/clôture réelle
            if (ticket.created_at && (ticket.resolved_at || ticket.closed_at)) {
              const created = new Date(ticket.created_at);
              const resolved = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date(ticket.closed_at!);
              const diffDays = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
              // Ne compter que si le résultat est valide (différence positive)
              if (diffDays >= 0) {
                total += diffDays;
                count++;
              }
            }
          });
          return count > 0 ? (total / count).toFixed(1) : "0.0";
        };
        
        const materielAvgDays = calculateAvgTime(materielTickets);
        const applicatifAvgDays = calculateAvgTime(applicatifTickets);
        
        // Feuille 1: Indicateurs clés de performance
        const kpiData = [
          ['Rapport', reportName],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          ['Généré par', userInfo?.full_name || 'Utilisateur'],
          [''],
          ['Indicateurs clés de performance'],
          ['Indicateur', 'Valeur', 'Détails'],
          ['Temps moyen de résolution', avgResolutionTimeDisplay, 'Objectif: 3 jours'],
          ['Taux de satisfaction utilisateur', `${satisfactionRate.toFixed(1)}%`, avgFeedback !== null ? `Note moyenne: ${avgFeedback.toFixed(1)}/5` : 'Basé sur résolu/rejeté'],
          ['Tickets escaladés', escalatedTickets, 'Critiques en cours'],
          ['Taux de réouverture', `${reopeningRate}%`, 'Tickets rouverts après résolution']
        ];
        const kpiWs = XLSX.utils.aoa_to_sheet(kpiData);
        XLSX.utils.book_append_sheet(wb, kpiWs, sanitizeSheetName("KPIs"));
        
        // Feuille 2: Volume de tickets - Ce mois
        const volumeData = [
          ['Volume de tickets - Ce mois'],
          ['Métrique', 'Valeur', 'Détails'],
          ['Total créés', thisMonthCreated, `vs mois dernier: ${createdChange}%`],
          ['Total résolus', thisMonthResolved, `Taux de résolution: ${resolutionRate}%`],
          ['En attente', thisMonthPending, `Nécessitent action: ${pendingRate}%`]
        ];
        const volumeWs = XLSX.utils.aoa_to_sheet(volumeData);
        XLSX.utils.book_append_sheet(wb, volumeWs, sanitizeSheetName("Volume"));
        
        // Feuille 3: Performance par catégorie
        const categoryData = [
          ['Performance par catégorie - Temps moyen'],
          ['Catégorie', 'Temps moyen (jours)', 'Tickets traités'],
          ['Matériel', parseFloat(materielAvgDays), materielTickets.length],
          ['Applicatif', parseFloat(applicatifAvgDays), applicatifTickets.length]
        ];
        const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
        XLSX.utils.book_append_sheet(wb, categoryWs, sanitizeSheetName("Catégories"));
        
        XLSX.writeFile(wb, `Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (selectedReport === "agence") {
        // Export spécifique pour Analyses par agence
        const wb = XLSX.utils.book_new();
        
        // Préparer les données des agences
        const agencies = Array.from(new Set(allTickets.map((t) => t.creator?.agency || t.user_agency).filter(Boolean)));
        const agencyData = agencies.map((agency) => {
          const agencyTickets = allTickets.filter((t) => (t.creator?.agency || t.user_agency) === agency);
          const resolvedAgencyTickets = agencyTickets.filter(t => t.status === "resolu" || t.status === "cloture");
          
          // Calculer le temps moyen de résolution (uniquement avec dates réelles)
          let totalResolutionTime = 0;
          let countWithDates = 0;
          
          resolvedAgencyTickets.forEach(ticket => {
            if (ticket.created_at && (ticket.resolved_at || ticket.closed_at)) {
              const created = new Date(ticket.created_at);
              const resolved = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date(ticket.closed_at!);
              const diffTime = resolved.getTime() - created.getTime();
              const diffDays = diffTime / (1000 * 60 * 60 * 24);
              if (diffDays >= 0) {
                totalResolutionTime += diffDays;
                countWithDates++;
              }
            }
          });
          
          const avgResolutionDays = countWithDates > 0 ? totalResolutionTime / countWithDates : 0;
          const avgResolutionDisplay = countWithDates > 0 
            ? avgResolutionDays % 1 === 0 
              ? `${Math.round(avgResolutionDays)} jour${Math.round(avgResolutionDays) > 1 ? 's' : ''}`
              : `${avgResolutionDays.toFixed(1)} jours`
            : "N/A";
          
          // Calculer la satisfaction
          const ticketsWithFeedback = resolvedAgencyTickets.filter(t => t.feedback_score !== null && t.feedback_score !== undefined);
          let satisfactionDisplay = "N/A";
          
          if (ticketsWithFeedback.length > 0) {
            const avgFeedback = ticketsWithFeedback.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / ticketsWithFeedback.length;
            satisfactionDisplay = `${((avgFeedback / 5) * 100).toFixed(1)}%`;
          } else if (resolvedAgencyTickets.length > 0) {
            const rejectedAgencyTickets = agencyTickets.filter(t => t.status === "rejete");
            const resolvedCount = resolvedAgencyTickets.length;
            const rejectedCount = rejectedAgencyTickets.length;
            const totalProcessed = resolvedCount + rejectedCount;
            if (totalProcessed > 0) {
              const satisfactionRate = (resolvedCount / totalProcessed) * 100;
              satisfactionDisplay = `${satisfactionRate.toFixed(1)}%`;
            }
          }
          
          return {
            agence: agency,
            nombreTickets: agencyTickets.length,
            tempsMoyen: avgResolutionDisplay,
            tempsMoyenJours: countWithDates > 0 ? avgResolutionDays : null,
            satisfaction: satisfactionDisplay
          };
        }).sort((a, b) => b.nombreTickets - a.nombreTickets);
        
        // Feuille: Volume de tickets par agence
        const agencyTableData = [
          ['Rapport', reportName],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          ['Généré par', userInfo?.full_name || 'Utilisateur'],
          [''],
          ['Volume de tickets par agence'],
          ['Agence', 'Nombre de tickets', 'Temps moyen', 'Satisfaction']
        ];
        
        agencyData.forEach(agency => {
          agencyTableData.push([
            agency.agence || "N/A",
            agency.nombreTickets.toString(),
            agency.tempsMoyen,
            agency.satisfaction
          ]);
        });
        
        const agencyWs = XLSX.utils.aoa_to_sheet(agencyTableData);
        XLSX.utils.book_append_sheet(wb, agencyWs, sanitizeSheetName("Par agence"));
        
        XLSX.writeFile(wb, `Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (selectedReport === "technicien") {
        // Export spécifique pour Analyses par technicien
        const wb = XLSX.utils.book_new();
        
        // Préparer les données des techniciens (identique au calcul dans l'interface)
        const technicianData = technicians.map((tech) => {
          const techTickets = allTickets.filter((t) => t.technician_id === tech.id);
          const inProgress = techTickets.filter((t) => t.status === "assigne_technicien" || t.status === "en_cours").length;
          const resolvedTickets = techTickets.filter((t) => t.status === "resolu" || t.status === "cloture");
          
          // Calculer le temps moyen de résolution (uniquement avec dates réelles)
          let avgTimeDisplay = "N/A";
          if (resolvedTickets.length > 0) {
            let totalHours = 0;
            let countWithDates = 0;
            
            resolvedTickets.forEach((ticket) => {
              if (ticket.created_at) {
                const created = new Date(ticket.created_at);
                let resolvedDate: Date | null = null;
                
                if (ticket.status === "cloture" && ticket.closed_at) {
                  resolvedDate = new Date(ticket.closed_at);
                } else if (ticket.status === "resolu" && ticket.resolved_at) {
                  resolvedDate = new Date(ticket.resolved_at);
                }
                
                if (resolvedDate) {
                  const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                  if (diffHours >= 0) {
                    totalHours += diffHours;
                    countWithDates++;
                  }
                }
              }
            });
            
            if (countWithDates > 0) {
              const avgHours = totalHours / countWithDates;
              if (avgHours < 24) {
                avgTimeDisplay = `${avgHours.toFixed(1)}h`;
              } else {
                const avgDays = avgHours / 24;
                avgTimeDisplay = `${avgDays.toFixed(1)}j`;
              }
            }
          }
          
          // Calculer la satisfaction
          let satisfactionDisplay = "N/A";
          if (resolvedTickets.length > 0) {
            const ticketsWithFeedback = resolvedTickets.filter((t) => t.feedback_score !== null && t.feedback_score !== undefined);
            
            if (ticketsWithFeedback.length > 0) {
              const avgFeedback = ticketsWithFeedback.reduce((sum, t) => sum + (t.feedback_score || 0), 0) / ticketsWithFeedback.length;
              const satisfactionRate = (avgFeedback / 5) * 100;
              satisfactionDisplay = `${satisfactionRate.toFixed(1)}%`;
            } else {
              // Calculer satisfaction implicite basée sur le temps de résolution
              let totalSatisfaction = 0;
              let countSatisfaction = 0;
              
              resolvedTickets.forEach((ticket) => {
                if (ticket.created_at) {
                  const created = new Date(ticket.created_at);
                  let resolvedDate: Date | null = null;
                  
                  if (ticket.status === "cloture" && ticket.closed_at) {
                    resolvedDate = new Date(ticket.closed_at);
                  } else if (ticket.status === "resolu" && ticket.resolved_at) {
                    resolvedDate = new Date(ticket.resolved_at);
                  }
                  
                  if (resolvedDate) {
                    const diffHours = (resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60);
                    const diffDays = diffHours / 24;
                    
                    let satisfactionScore = 0;
                    if (ticket.priority === "haute" || ticket.priority === "critique") {
                      if (diffHours < 24) satisfactionScore = 100;
                      else if (diffHours < 48) satisfactionScore = 80;
                      else if (diffHours < 72) satisfactionScore = 60;
                      else satisfactionScore = 40;
                    } else if (ticket.priority === "moyenne") {
                      if (diffDays < 3) satisfactionScore = 100;
                      else if (diffDays < 5) satisfactionScore = 80;
                      else if (diffDays < 7) satisfactionScore = 60;
                      else satisfactionScore = 40;
                    } else {
                      if (diffDays < 7) satisfactionScore = 100;
                      else if (diffDays < 14) satisfactionScore = 80;
                      else if (diffDays < 21) satisfactionScore = 60;
                      else satisfactionScore = 40;
                    }
                    
                    totalSatisfaction += satisfactionScore;
                    countSatisfaction++;
                  }
                }
              });
              
              if (countSatisfaction > 0) {
                const avgSatisfaction = totalSatisfaction / countSatisfaction;
                satisfactionDisplay = `${avgSatisfaction.toFixed(1)}%`;
              }
            }
          }
          
          return {
            technicien: tech.full_name,
            ticketsTraites: resolvedTickets.length,
            tempsMoyen: avgTimeDisplay,
            chargeActuelle: inProgress,
            satisfaction: satisfactionDisplay
          };
        });
        
        // Feuille: Performance des techniciens
        const techTableData = [
          ['Rapport', reportName],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          ['Généré par', userInfo?.full_name || 'Utilisateur'],
          [''],
          ['Performance des techniciens'],
          ['Technicien', 'Tickets traités', 'Temps moyen', 'Charge actuelle', 'Satisfaction']
        ];
        
        technicianData.forEach(tech => {
          techTableData.push([
            tech.technicien,
            tech.ticketsTraites.toString(),
            tech.tempsMoyen,
            tech.chargeActuelle.toString(),
            tech.satisfaction
          ]);
        });
        
        const techWs = XLSX.utils.aoa_to_sheet(techTableData);
        XLSX.utils.book_append_sheet(wb, techWs, sanitizeSheetName("Techniciens"));
        
        XLSX.writeFile(wb, `Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (selectedReport === "evolutions") {
        // Export spécifique pour Évolutions dans le temps
        const wb = XLSX.utils.book_new();
        
        // Feuille 1: Volume de tickets (30 derniers jours)
        const timeSeriesData = prepareTimeSeriesData();
        const timeSeriesTableData = [
          ['Rapport', reportName],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          ['Généré par', userInfo?.full_name || 'Utilisateur'],
          [''],
          ['Volume de tickets (30 derniers jours)'],
          ['Date', 'Créés', 'Résolus']
        ];
        timeSeriesData.forEach(item => {
          timeSeriesTableData.push([
            item.date,
            item.créés.toString(),
            item.résolus.toString()
          ]);
        });
        const timeSeriesWs = XLSX.utils.aoa_to_sheet(timeSeriesTableData);
        XLSX.utils.book_append_sheet(wb, timeSeriesWs, sanitizeSheetName("Volume 30j"));
        
        // Feuille 2: Évolution par statut (7 derniers jours)
        const statusEvolutionData = prepareStatusEvolutionData();
        const statusEvolutionTableData = [
          ['Évolution par statut (7 derniers jours)'],
          ['Date', 'En attente', 'En cours', 'Résolus', 'Clôturés']
        ];
        statusEvolutionData.forEach(item => {
          statusEvolutionTableData.push([
            item.date,
            item['En attente'].toString(),
            item['En cours'].toString(),
            item['Résolus'].toString(),
            item['Clôturés'].toString()
          ]);
        });
        const statusEvolutionWs = XLSX.utils.aoa_to_sheet(statusEvolutionTableData);
        XLSX.utils.book_append_sheet(wb, statusEvolutionWs, sanitizeSheetName("Par statut"));
        
        // Feuille 3: Répartition par priorité
        const priorityEvolutionData = preparePriorityEvolutionData();
        const priorityTableData = [
          ['Répartition par priorité'],
          ['Priorité', 'Nombre']
        ];
        priorityEvolutionData.forEach(item => {
          priorityTableData.push([
            item.priorité,
            item.nombre.toString()
          ]);
        });
        const priorityWs = XLSX.utils.aoa_to_sheet(priorityTableData);
        XLSX.utils.book_append_sheet(wb, priorityWs, sanitizeSheetName("Par priorité"));
        
        // Feuille 4: Pics d'activité (jours de la semaine)
        const dayOfWeekData = prepareDayOfWeekData();
        const dayTableData = [
          ["Pics d'activité (jours de la semaine)"],
          ['Jour', 'Nombre de tickets']
        ];
        dayOfWeekData.forEach(item => {
          dayTableData.push([
            item.jour,
            item.tickets.toString()
          ]);
        });
        const dayWs = XLSX.utils.aoa_to_sheet(dayTableData);
        XLSX.utils.book_append_sheet(wb, dayWs, sanitizeSheetName("Jours semaine"));
        
        // Feuille 5: Répartition par heure
        const hourlyData = prepareHourlyData();
        const hourlyTableData = [
          ['Répartition des tickets par heure de la journée'],
          ['Heure', 'Nombre de tickets']
        ];
        hourlyData.forEach(item => {
          hourlyTableData.push([
            item.heure,
            item.tickets.toString()
          ]);
        });
        const hourlyWs = XLSX.utils.aoa_to_sheet(hourlyTableData);
        XLSX.utils.book_append_sheet(wb, hourlyWs, sanitizeSheetName("Par heure"));
        
        // Feuille 6: Évolution de la satisfaction (si disponible)
        const satisfactionData = prepareSatisfactionData();
        if (satisfactionData.length > 0) {
          const satisfactionTableData = [
            ['Évolution de la satisfaction utilisateur (7 derniers jours)'],
            ['Date', 'Satisfaction (sur 5)']
          ];
          satisfactionData.forEach(item => {
            satisfactionTableData.push([
              item.date,
              item.satisfaction.toString()
            ]);
          });
          const satisfactionWs = XLSX.utils.aoa_to_sheet(satisfactionTableData);
          XLSX.utils.book_append_sheet(wb, satisfactionWs, sanitizeSheetName("Satisfaction"));
        }
        
        XLSX.writeFile(wb, `Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // Export générique pour les autres rapports
        const wb = XLSX.utils.book_new();
        const wsData = [
          ['Rapport', reportName],
          ['Date de génération', new Date().toLocaleDateString('fr-FR')],
          ['Généré par', userInfo?.full_name || 'Utilisateur'],
          [''],
          ['Note: Les données détaillées seront disponibles dans une prochaine version.']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName("Rapport"));
        XLSX.writeFile(wb, `Rapport_${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      alert("Erreur lors de l'export Excel");
    }
  };

  // Fonction générique pour voir le rapport détaillé
  const viewDetailedReport = (reportType?: string) => {
    const reportName = getReportName(reportType);
    if (selectedReport === "recurrents") {
      const problems = getRecurringTicketsHistory();
      const mostFrequent = getMostFrequentProblems();
      const problematicApps = getProblematicApplications();
      
      let reportContent = `RAPPORT: ${reportName}\n`;
      reportContent += `Date de génération: ${new Date().toLocaleDateString('fr-FR')}\n`;
      reportContent += `Date de génération (heure): ${new Date().toLocaleTimeString('fr-FR')}\n\n`;
      
      reportContent += "=".repeat(80) + "\n";
      reportContent += "HISTORIQUE DES PROBLÈMES\n";
      reportContent += "=".repeat(80) + "\n\n";
      
      if (problems.length > 0) {
        problems.forEach((item, index) => {
          reportContent += `${index + 1}. ${item.titre}\n`;
          reportContent += `   Occurrences: ${item.occurrences}\n`;
          reportContent += `   Dernière occurrence: ${item.dernier ? new Date(item.dernier).toLocaleDateString('fr-FR') : 'N/A'}\n\n`;
        });
      } else {
        reportContent += "Aucun problème récurrent dans l'historique.\n\n";
      }
      
      reportContent += "=".repeat(80) + "\n";
      reportContent += "PROBLÈMES LES PLUS FRÉQUENTS\n";
      reportContent += "=".repeat(80) + "\n\n";
      
      if (mostFrequent.length > 0) {
        mostFrequent.forEach((item, index) => {
          reportContent += `${index + 1}. ${item.problème}\n`;
          reportContent += `   Occurrences: ${item.occurrences}\n\n`;
        });
      } else {
        reportContent += "Aucun problème fréquent identifié.\n\n";
      }
      
      reportContent += "=".repeat(80) + "\n";
      reportContent += "APPLICATIONS/ÉQUIPEMENTS PROBLÉMATIQUES\n";
      reportContent += "=".repeat(80) + "\n\n";
      
      if (problematicApps.length > 0) {
        problematicApps.forEach((item, index) => {
          reportContent += `${index + 1}. ${item.application}\n`;
          reportContent += `   Nombre de tickets: ${item.tickets}\n\n`;
        });
      } else {
        reportContent += "Aucune application ou équipement problématique identifié.\n\n";
      }
      
      // Afficher le rapport dans une nouvelle fenêtre
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Rapport: ${reportName}</title>
              <style>
                body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
                h1 { color: #1e3a5f; }
              </style>
            </head>
            <body>
              <h1>Rapport: ${reportName}</h1>
              <pre>${reportContent}</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      // Afficher un rapport générique pour les autres types
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Rapport: ${reportName}</title>
              <style>
                body { font-family: monospace; padding: 20px; white-space: pre-wrap; }
                h1 { color: #1e3a5f; }
              </style>
            </head>
            <body>
              <h1>Rapport: ${reportName}</h1>
              <pre>RAPPORT: ${reportName}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}
Heure de génération: ${new Date().toLocaleTimeString('fr-FR')}

Ce rapport est actuellement en cours de développement.
Les données détaillées seront disponibles dans une prochaine version.</pre>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  // Récupérer toutes les agences uniques
  const allAgencies = Array.from(new Set(
    allTickets.map((t) => t.creator?.agency || t.user_agency).filter(Boolean)
  ));

  // Catégories actives (matériel / applicatif) depuis l'API
  const advancedCategories = Array.from(
    new Set(categoriesList.filter((c) => c.is_active).map((c) => c.name))
  );

  // Types de ticket existants dans les tickets
  const advancedTypes = Array.from(
    new Set(allTickets.map((t) => t.type).filter(Boolean))
  );

  // Utilisateurs pour le filtre "Utilisateur" : tous les utilisateurs connus (sauf Administrateur)
  const advancedUsers = Array.from(
    new Set(
      allUsers
        .filter((u: any) => u.role?.name !== "Admin")
        .map((u: any) => u.full_name)
        .filter(Boolean)
    )
  );

  // Filtrer les tickets selon les filtres sélectionnés
  let filteredTickets = allTickets;
  
  if (statusFilter !== "all") {
    if (statusFilter === "en_traitement") {
      filteredTickets = filteredTickets.filter((t) => t.status === "assigne_technicien" || t.status === "en_cours");
    } else {
      filteredTickets = filteredTickets.filter((t) => t.status === statusFilter);
    }
  }
  
  if (agencyFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => {
      const agency = t.creator?.agency || t.user_agency;
      return agency === agencyFilter;
    });
  }
  
  if (priorityFilter !== "all") {
    if (priorityFilter === "non_definie") {
      filteredTickets = filteredTickets.filter((t) =>
        !t.priority || t.priority === "" || t.priority === "non_definie"
      );
    } else {
      filteredTickets = filteredTickets.filter((t) => t.priority === priorityFilter);
    }
  }
  
  // Filtre par délégation (UNIQUEMENT les tickets délégués par le DSI connecté)
  if (delegationFilter !== "all" && userRole === "DSI") {
    if (delegationFilter === "delegated") {
      // Filtrer uniquement les tickets délégués par le DSI connecté
      filteredTickets = filteredTickets.filter((t) => delegatedTicketsByMe.has(t.id));
    } else if (delegationFilter === "not_delegated") {
      // Filtrer les tickets non délégués OU délégués par quelqu'un d'autre
      filteredTickets = filteredTickets.filter((t) => !delegatedTicketsByMe.has(t.id));
    }
  } else if (delegationFilter !== "all" && userRole !== "DSI") {
    // Pour les autres rôles, utiliser la logique basée sur secretary_id
    if (delegationFilter === "delegated") {
      filteredTickets = filteredTickets.filter((t) => t.secretary_id !== null && t.secretary_id !== undefined);
    } else if (delegationFilter === "not_delegated") {
      filteredTickets = filteredTickets.filter((t) => t.secretary_id === null || t.secretary_id === undefined);
    }
  }

  // --- Filtres avancés appliqués sur les tickets ---
  if (advancedPeriodRange?.from !== undefined) {
    const fromStart = new Date(advancedPeriodRange.from);
    fromStart.setHours(0, 0, 0, 0);
    filteredTickets = filteredTickets.filter((t) => {
      if (!t.created_at) return false;
      const created = new Date(t.created_at).getTime();
      if (created < fromStart.getTime()) return false;
      if (advancedPeriodRange.to !== undefined) {
        const toEnd = new Date(advancedPeriodRange.to);
        toEnd.setHours(23, 59, 59, 999);
        return created <= toEnd.getTime();
      }
      return true;
    });
  } else if (advancedPeriodRange?.to !== undefined) {
    const toEnd = new Date(advancedPeriodRange.to);
    toEnd.setHours(23, 59, 59, 999);
    filteredTickets = filteredTickets.filter((t) => {
      if (!t.created_at) return false;
      return new Date(t.created_at).getTime() <= toEnd.getTime();
    });
  }
  if (advancedMonthFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === advancedMonthFilter;
    });
  }

  if (advancedAgencyFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => {
      const agency = t.creator?.agency || t.user_agency;
      return agency === advancedAgencyFilter;
    });
  }

  if (advancedCategoryFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => t.category === advancedCategoryFilter);
  }

  if (advancedTypeFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => t.type === advancedTypeFilter);
  }

  if (advancedNonResolvedFilter !== "all") {
    const days = parseInt(advancedNonResolvedFilter, 10);
    const now = Date.now();
    filteredTickets = filteredTickets.filter((t) => {
      if (t.resolved_at) return false; // déjà résolu
      if (!t.created_at || Number.isNaN(days) || days <= 0) return true;
      const createdTime = new Date(t.created_at).getTime();
      const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24);
      return diffDays >= days;
    });
  }

  if (advancedUserFilter !== "all") {
    filteredTickets = filteredTickets.filter((t) => {
      const techName = t.technician?.full_name || "";
      const creatorName = t.creator?.full_name || "";
      return techName === advancedUserFilter || creatorName === advancedUserFilter;
    });
  }

  if (advancedCreatorFilter.trim() !== "") {
    const query = advancedCreatorFilter.trim().toLowerCase();
    filteredTickets = filteredTickets.filter((t) =>
      (t.creator?.full_name || "").toLowerCase().includes(query)
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f5f5f5", overflowX: "visible" }}>
      <style>{`
        #dsi-sidebar-menu::-webkit-scrollbar {
          display: none;
        }
        #dsi-sidebar-menu {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Sidebar */}
      <div 
        id="dsi-sidebar"
        style={{ 
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: sidebarCollapsed ? "80px" : "250px", 
        background: "hsl(226, 34%, 15%)", 
        color: "white", 
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "0px",
        transition: "width 0.3s ease",
        overflow: "hidden",
        overflowX: "visible",
        zIndex: 100,
        boxSizing: "border-box"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "8px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "white", borderRadius: "0.75rem", padding: "2px" }}>
              <img 
                src={helpdeskLogo} 
                alt="HelpDesk Logo" 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "contain",
                  borderRadius: "0.5rem"
                }} 
              />
            </div>
            {!sidebarCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "18px", fontWeight: "700", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: "white", whiteSpace: "nowrap" }}>
                  HelpDesk
                </div>
                <div style={{ fontSize: "12px", fontFamily: "'Inter', system-ui, sans-serif", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", marginTop: "2px" }}>
                  Gestion des tickets
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bouton de collapse/expand du sidebar */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: "fixed",
            left: sidebarCollapsed ? "calc(80px - 14px)" : "calc(250px - 14px)",
            top: "75px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "hsl(25, 95%, 53%)",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            transition: "all 0.3s ease",
            padding: 0,
            boxSizing: "border-box",
            overflow: "visible"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.background = "hsl(25, 95%, 48%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "hsl(25, 95%, 53%)";
          }}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={14} color="white" />
          ) : (
            <ChevronLeft size={14} color="white" />
          )}
        </button>
        
        {/* Profil utilisateur */}
        {!sidebarCollapsed && userInfo && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 0",
            marginBottom: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "hsl(25, 95%, 53%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "16px",
              flexShrink: 0
            }}>
              {userInfo.full_name
                ? userInfo.full_name
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "D"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "16px",
                fontFamily: "'Inter', system-ui, sans-serif",
                color: "white",
                fontWeight: "500",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {userInfo.full_name || "Utilisateur"}
              </div>
              <div style={{
                fontSize: "12px",
                fontFamily: "'Inter', system-ui, sans-serif",
                color: "hsl(25, 95%, 53%)",
                fontWeight: "500",
                marginTop: "2px"
              }}>
                {userInfo.role?.name || userRole || "DSI"}
              </div>
            </div>
          </div>
        )}
        
        {/* Zone défilable : uniquement les sections du menu */}
        <div id="dsi-sidebar-menu" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "visible" }}>
        <div 
          onClick={() => {
            setShowTicketDetailsPage(false);
            setTicketDetails(null);
            setTicketHistory([]);
            setTicketComments([]);
            setDetailCommentText("");
            changeSectionForDSI("dashboard");
          }}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "10px", 
            background: activeSection === "dashboard" ? "hsl(25, 95%, 53%)" : "transparent", 
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "8px"
          }}
        >
          <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LayoutDashboard size={20} color={activeSection === "dashboard" ? "white" : "rgba(180, 180, 180, 0.7)"} />
          </div>
          <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Tableau de Bord</div>
        </div>
        
        <div 
          onClick={() => setShowCreateTicketModal(true)}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "10px", 
            background: "transparent", 
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "8px"
          }}
        >
          <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PlusCircle size={20} color="rgba(180, 180, 180, 0.7)" />
          </div>
          <div style={{ fontSize: "15px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500", color: "white" }}>Nouveau ticket</div>
        </div>
        
        <div 
          onClick={() => {
            setShowTicketDetailsPage(false);
            setTicketDetails(null);
            setTicketHistory([]);
            setTicketComments([]);
            setDetailCommentText("");
            setStatusFilter("all");
            changeSectionForDSI("tickets");
          }}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "10px", 
            cursor: "pointer",
            color: "white",
            borderRadius: "4px",
            background: activeSection === "tickets" ? "hsl(25, 95%, 53%)" : "transparent",
            marginBottom: "8px"
          }}
        >
          <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeSection === "tickets" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="16" y2="14" />
              <line x1="8" y1="18" x2="12" y2="18" />
            </svg>
          </div>
          <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Tickets</div>
        </div>
        {(userRole === "Admin" || userRole === "DSI") && (
          <div 
            onClick={() => {
              changeSectionForDSI("actifs");
            }}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "actifs" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box size={18} color={activeSection === "actifs" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Actifs</div>
          </div>
        )}
        {userRole === "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("types")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "types" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} color={activeSection === "types" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Types</div>
          </div>
        )}
        {userRole === "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("categories")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "categories" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderTree size={18} color={activeSection === "categories" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Catégories</div>
          </div>
        )}
        {userRole !== "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("types")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "types" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} color={activeSection === "types" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Types</div>
          </div>
        )}
        {userRole !== "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("categories")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "categories" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderTree size={18} color={activeSection === "categories" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Catégories</div>
          </div>
        )}
        {(userRole === "DSI" || userRole === "Admin") && (
          <div 
            onClick={() => changeSectionForDSI("priorites")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "priorites" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flag size={18} color={activeSection === "priorites" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2} />
            </div>
            <div style={{ fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Priorités</div>
          </div>
        )}
        {userRole !== "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("technicians")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "technicians" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} color={activeSection === "technicians" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Équipe</div>
          </div>
        )}
        {(userRole === "Admin" || userRole === "DSI") && (
          <div 
            onClick={() => changeSectionForDSI("users")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "users" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeSection === "users" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ flex: 1, fontSize: "16px", fontFamily: "'Inter', system-ui, sans-serif", fontWeight: "500" }}>Utilisateurs</div>
          </div>
        )}
        {userRole === "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("groupes")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "groupes" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeSection === "groupes" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>Groupes</div>
          </div>
        )}
        {userRole === "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("roles")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "roles" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCog size={20} color={activeSection === "roles" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>Rôles</div>
          </div>
        )}
        {/* Agences (déplacé au-dessus de Statistiques) */}
        <div 
          onClick={() => changeSectionForDSI("departements")}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "10px", 
            background: activeSection === "departements" ? "hsl(25, 95%, 53%)" : "transparent",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "8px"
          }}
        >
          <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={20} color={activeSection === "departements" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>Agences</div>
        </div>

        {/* Statistiques */}
        <div 
          onClick={() => {
            setSelectedReport("statistiques");
            changeSectionForDSI("reports");
          }}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "12px", 
            padding: "10px", 
            background: activeSection === "reports" ? "hsl(25, 95%, 53%)" : "transparent",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "8px"
          }}
        >
          <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={20} color={activeSection === "reports" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>Statistiques</div>
        </div>
        {userRole === "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("maintenance")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "maintenance" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeSection === "maintenance" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <div style={{ flex: 1 }}>Maintenance</div>
          </div>
        )}
        {userRole === "Admin" && (
          <div 
            onClick={() => changeSectionForDSI("audit-logs")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "10px", 
              cursor: "pointer",
              color: "white",
              borderRadius: "4px",
              background: activeSection === "audit-logs" ? "hsl(25, 95%, 53%)" : "transparent",
              marginBottom: "8px"
            }}
          >
            <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeSection === "audit-logs" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
            </div>
            <div style={{ flex: 1 }}>Audit et Logs</div>
          </div>
        )}
        {userRole === "Admin" && (
          <div>
            <div
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "12px", 
                padding: "10px", 
                cursor: "pointer",
                color: "white",
                borderRadius: "4px",
                background: activeSection === "settings" ? "hsl(25, 95%, 53%)" : "transparent",
                marginBottom: "8px"
              }}
            >
              <div style={{ width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Settings size={20} color={activeSection === "settings" ? "white" : "rgba(180, 180, 180, 0.7)"} />
              </div>
              <div style={{ flex: 1 }}>Paramètres</div>
              <div style={{ width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeSection === "settings" ? "white" : "rgba(180, 180, 180, 0.7)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {showSettingsDropdown ? (
                    <polyline points="6 9 12 15 18 9" />
                  ) : (
                    <polyline points="9 18 15 12 9 6" />
                  )}
                </svg>
              </div>
            </div>
            {showSettingsDropdown && (
              <div style={{ 
                marginLeft: "48px", 
                marginTop: "8px", 
                marginBottom: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <div
                  onClick={() => changeSectionForDSI("apparence")}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "white",
                    borderRadius: "4px",
                    background: activeSection === "apparence" ? "hsl(25, 95%, 53%)" : "transparent",
                    fontSize: "14px"
                  }}
                >
                  Apparence
                </div>
                <div
                  onClick={() => changeSectionForDSI("email")}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "white",
                    borderRadius: "4px",
                    background: activeSection === "email" ? "hsl(25, 95%, 53%)" : "transparent",
                    fontSize: "14px"
                  }}
                >
                  Email
                </div>
                <div
                  onClick={() => changeSectionForDSI("securite")}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    color: "white",
                    borderRadius: "4px",
                    background: activeSection === "securite" ? "hsl(25, 95%, 53%)" : "transparent",
                    fontSize: "14px"
                  }}
                >
                  Sécurité
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Section Notifications + Déconnexion en bas */}
        <div style={{ marginTop: "auto", flexShrink: 0 }}>
          {/* Trait de séparation (même style qu'au-dessus de Tableau de bord) */}
          <div style={{
            height: "1px",
            background: "rgba(255, 255, 255, 0.1)",
            margin: "0 12px 8px 12px"
          }} />
          {/* Bouton Notifications */}
          <div
            onClick={() => changeSectionForDSI("notifications")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              transition: "background 0.2s",
              position: "relative"
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={20} color="rgba(180, 180, 180, 0.7)" />
            </div>
            <div style={{ fontSize: "14px", color: "white", flex: 1 }}>Notifications</div>
            {unreadCount > 0 && (
              <div style={{
                minWidth: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "hsl(25, 95%, 53%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 600,
                color: "white",
                padding: "0 6px"
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </div>

          {/* Bouton Déconnexion */}
          <div
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "white",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="16 17 21 12 16 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="21"
                  y1="12"
                  x2="9"
                  y2="12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ fontSize: "14px", color: "white" }}>Déconnexion</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden",
        marginLeft: sidebarCollapsed ? "80px" : "250px",
        transition: "margin-left 0.3s ease"
      }}>
        {/* Barre de navigation en haut */}
        <div style={{
          position: "fixed",
          top: 0,
          left: sidebarCollapsed ? "80px" : "250px",
          right: 0,
          background: "hsl(0, 0%, 100%)",
          padding: "16px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 99,
          transition: "left 0.3s ease"
        }}>
          {/* Left side - Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ 
              fontSize: "20px", 
              fontWeight: "700",
              color: "#111827",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }}>
              {activeSection === "notifications"
                ? "Notifications"
                : activeSection === "actifs"
                ? "Gestion des Actifs"
                : activeSection === "roles"
                ? "Gestion des rôles"
                : activeSection === "users"
                ? "Gestion des utilisateurs"
                : activeSection === "groupes"
                ? "Groupes"
                : activeSection === "tickets"
                ? "Tickets"
                : activeSection === "types"
                ? "Types"
                : activeSection === "categories"
                ? "Catégories"
                : activeSection === "technicians"
                ? "Équipe"
                : activeSection === "departements"
                ? "Agences"
                : activeSection === "maintenance"
                ? "Maintenance"
                : activeSection === "audit-logs"
                ? "Audit et Logs"
                : activeSection === "reports"
                ? "Statistiques générales"
                : activeSection === "apparence"
                ? "Apparence"
                : activeSection === "email"
                ? "Email"
                : activeSection === "securite"
                ? "Sécurité"
                : activeSection === "priorites"
                ? "Priorités"
                : "Tableau de bord"}
            </div>
            <div style={{ 
              fontSize: "13px", 
              fontWeight: "400",
              color: "#6b7280",
              fontFamily: "system-ui, -apple-system, sans-serif",
              paddingLeft: 0,
              marginLeft: 0,
              textAlign: "left"
            }}>
              {activeSection === "notifications"
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : activeSection === "actifs"
                ? "Gérez l'inventaire des équipements informatiques"
                : activeSection === "roles"
                ? "Créez, modifiez et gérez les rôles et permissions"
                : activeSection === "users"
                ? "Créez, modifiez et gérez les comptes utilisateurs"
                : activeSection === "groupes"
                ? "Gestion des groupes"
                : activeSection === "tickets"
                ? "Gérez tous vos tickets"
                : activeSection === "types"
                ? "Types de tickets (Matériel / Applicatif)"
                : activeSection === "categories"
                ? "Gérez les catégories par type de ticket"
                : activeSection === "technicians"
                ? "Gestion des membres de l'équipe DSI et des techniciens"
                : activeSection === "departements"
                ? "Gestion des agences de l'organisation"
                : activeSection === "maintenance"
                ? "Surveillance de l'état du système et de la base de données"
                : activeSection === "audit-logs"
                ? "Consultation et analyse des journaux d'activité"
                : activeSection === "reports"
                ? "Vue d'ensemble des tickets et de l'activité du support"
                : activeSection === "apparence"
                ? "Personnalisez le thème et l'aspect de l'interface"
                : activeSection === "email"
                ? "Configurez les paramètres d'envoi et de réception des emails"
                : activeSection === "securite"
                ? "Gérez les mots de passe et les paramètres de sécurité du compte"
                : activeSection === "priorites"
                ? "Gérez les niveaux de priorité des tickets"
                : "Vue d'ensemble de votre activité"}
            </div>
          </div>
          
          {/* Right side - Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Barre de recherche */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            position: "relative",
            width: "300px"
          }}>
            <Search 
              size={18} 
              color="#6b7280" 
              style={{ 
                position: "absolute", 
                left: "12px", 
                pointerEvents: "none",
                zIndex: 1
              }} 
            />
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              value={ticketSearchQuery}
              onChange={(e) => {
                setTicketSearchQuery(e.target.value);
              }}
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

          {/* Icône boîte de réception - tickets à assigner */}
          <div
            style={{
              cursor: "default",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000000",
              position: "relative",
              opacity: pendingCount > 0 ? 1 : 0.5,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="6" width="16" height="12" rx="1" />
              <circle cx="4" cy="10" r="1" fill="#000000" />
              <circle cx="4" cy="14" r="1" fill="#000000" />
              <circle cx="20" cy="10" r="1" fill="#000000" />
              <circle cx="20" cy="14" r="1" fill="#000000" />
            </svg>
            {pendingCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "18px",
                  height: "18px",
                  background: "#22c55e",
                  borderRadius: "50%",
                  border: "2px solid white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "white",
                  padding: "0 4px",
                }}
              >
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </div>

          {/* Cloche notifications */}
          <div 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              cursor: "pointer", 
              width: "24px", 
              height: "24px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "#000000",
              position: "relative"
            }}>
            <Bell size={20} color="#000000" />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                minWidth: "18px",
                height: "18px",
                background: "hsl(25, 95%, 53%)",
                borderRadius: "50%",
                border: "2px solid white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                color: "white",
                padding: "0 4px"
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          </div>
        </div>

        {/* Contenu principal avec scroll */}
        <div style={{
          flex: 1,
          padding: activeSection === "notifications" ? "72px 30px 30px 0" : "72px 30px 30px 30px",
          overflow: activeSection === "notifications" ? "hidden" : "auto"
        }}>
        {/* Affichage des détails du ticket en pleine page */}
        {showTicketDetailsPage && ticketDetails ? (
          <div>
            {/* Header avec bouton retour */}
            <div style={{ marginBottom: "24px" }}>
              <button
                onClick={() => {
                  setShowTicketDetailsPage(false);
                  startTransition(() => {
                    setTicketDetails(null);
                    setTicketHistory([]);
                    setTicketComments([]);
                    setDetailCommentText("");
                  });
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  background: "transparent",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#374151",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  marginBottom: "16px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Retour aux tickets
              </button>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", marginBottom: "8px" }}>
                Détails du ticket {formatTicketNumber(ticketDetails.number)}
              </h2>
            </div>

            {/* Contenu des détails du ticket */}
            <div style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <div style={{ marginBottom: "16px" }}>
                <strong>Titre :</strong>
                <p style={{ marginTop: "4px", padding: "8px", background: "#f8f9fa", borderRadius: "4px" }}>
                  {ticketDetails.title}
                </p>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong>Description :</strong>
                <p style={{ marginTop: "4px", padding: "8px", background: "#f8f9fa", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                  {ticketDetails.description || ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div>
                  <strong>Priorité :</strong>
                  <span style={{
                    marginLeft: "8px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: ticketDetails.priority === "critique" ? "rgba(229, 62, 62, 0.1)" : ticketDetails.priority === "haute" ? "rgba(245, 158, 11, 0.1)" : ticketDetails.priority === "moyenne" ? "rgba(13, 173, 219, 0.1)" : ticketDetails.priority === "faible" ? "#E5E7EB" : ticketDetails.priority === "non_definie" ? "#E5E7EB" : "#9e9e9e",
                    color: ticketDetails.priority === "critique" ? "#E53E3E" : ticketDetails.priority === "haute" ? "#F59E0B" : ticketDetails.priority === "moyenne" ? "#0DADDB" : ticketDetails.priority === "faible" ? "#6B7280" : ticketDetails.priority === "non_definie" ? "#6B7280" : "white"
                  }}>
                    {getPriorityLabel(ticketDetails.priority ?? "non_definie")}
                  </span>
                </div>
                <div>
                  <strong>Type :</strong>
                  <span style={{ marginLeft: "8px", padding: "4px 8px", borderRadius: "4px" }}>
                    {ticketDetails.type === "materiel" ? "Matériel" : ticketDetails.type === "applicatif" ? "Applicatif" : ticketDetails.type || "—"}
                  </span>
                </div>
                <div>
                  <strong>Catégorie :</strong>
                  <span style={{ marginLeft: "8px" }}>
                    {ticketDetails.category || "Non spécifiée"}
                  </span>
                </div>
                <div>
                  <strong>Statut :</strong>
                  <span style={{
                    marginLeft: "8px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: ticketDetails.status === "en_attente_analyse" ? "rgba(13, 173, 219, 0.1)" : ticketDetails.status === "assigne_technicien" ? "rgba(255, 122, 27, 0.1)" : ticketDetails.status === "en_cours" ? "rgba(15, 31, 61, 0.1)" : ticketDetails.status === "retraite" ? "#EDE7F6" : ticketDetails.status === "resolu" ? "rgba(47, 158, 68, 0.1)" : ticketDetails.status === "rejete" ? "#fee2e2" : ticketDetails.status === "cloture" ? "#E5E7EB" : "#f3f4f6",
                    color: ticketDetails.status === "en_attente_analyse" ? "#0DADDB" : ticketDetails.status === "assigne_technicien" ? "#FF7A1B" : ticketDetails.status === "en_cours" ? "#0F1F3D" : ticketDetails.status === "retraite" ? "#4A148C" : ticketDetails.status === "resolu" ? "#2F9E44" : ticketDetails.status === "rejete" ? "#991b1b" : ticketDetails.status === "cloture" ? "#374151" : "#6b7280"
                  }}>
                    {getStatusLabel(ticketDetails.status)}
                  </span>
                </div>
                {ticketDetails.creator && (
                  <div>
                    <strong>Créateur :</strong>
                    <span style={{ marginLeft: "8px" }}>
                      {ticketDetails.creator.full_name}
                    </span>
                  </div>
                )}
                {ticketDetails.technician && (
                  <div>
                    <strong>Technicien assigné :</strong>
                    <span style={{ marginLeft: "8px" }}>
                      {ticketDetails.technician.full_name}
                    </span>
                  </div>
                )}
              </div>

              {/* Section Commentaires (DSI et Admin uniquement) - affiche uniquement les commentaires de l'utilisateur connecté */}
              {(userRole === "DSI" || userRole === "Admin") && (
              <div
                ref={commentSectionRef}
                style={{
                marginTop: "24px",
                padding: "16px",
                background: "white",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <MessageCircle size={20} color="hsl(25, 95%, 53%)" strokeWidth={2} />
                  <strong style={{ fontSize: "15px", color: "#111827" }}>
                    Commentaires ({myComments.length})
                  </strong>
                </div>
                {myComments.length === 0 ? (
                  <p style={{ color: "#6b7280", fontStyle: "italic", marginBottom: "16px", fontSize: "14px" }}>
                    Aucun commentaire pour ce ticket
                  </p>
                ) : (
                  <div style={{ marginBottom: "16px" }}>
                    {myComments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: "12px 14px",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          marginBottom: "8px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "rgba(255, 122, 27, 0.2)",
                            color: "hsl(25, 95%, 53%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 600,
                            flexShrink: 0
                          }}>
                            {getInitialsForComment(c.user?.full_name || "Utilisateur")}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                              {c.user?.full_name || "Utilisateur"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>
                              {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} à {new Date(c.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: "14px", color: "#111827", marginLeft: "42px" }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: "rgba(255, 122, 27, 0.2)",
                      color: "hsl(25, 95%, 53%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600
                    }}>
                      {userInfo?.full_name ? getInitialsForComment(userInfo.full_name) : "?"}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                      {userInfo?.full_name || "Utilisateur"}
                    </span>
                  </div>
                  <textarea
                    value={detailCommentText}
                    onChange={(e) => setDetailCommentText(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "14px",
                      resize: "vertical",
                      background: "#f8f9fa"
                    }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", cursor: "pointer", fontSize: "13px", color: "#6b7280" }}>
                    <input
                      type="checkbox"
                      checked={detailCommentInternal}
                      onChange={(e) => setDetailCommentInternal(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <Lock size={14} color="hsl(25, 95%, 53%)" />
                    Commentaire interne (visible par l'équipe uniquement)
                  </label>
                  <button
                    onClick={() => handleAddCommentFromDetails(ticketDetails.id)}
                    disabled={loading || !detailCommentText.trim()}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      background: detailCommentText.trim() && !loading ? "hsl(25, 95%, 53%)" : "#d1d5db",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: detailCommentText.trim() && !loading ? "pointer" : "not-allowed",
                      fontSize: "14px",
                      fontWeight: 600
                    }}
                  >
                    <Send size={16} />
                    Envoyer
                  </button>
                </div>
              </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <strong>Historique :</strong>
                <div style={{ marginTop: "8px" }}>
                  {(() => {
                    const displayHistory = getDisplayHistory(ticketDetails, ticketHistory);
                    if (displayHistory.length === 0) {
                      return <p style={{ color: "#999", fontStyle: "italic" }}>Aucun historique</p>;
                    }
                    return displayHistory.map((h, index) => {
                      const { Icon, iconBg, iconBorder, iconColor } = getHistoryVisuals(h);
                      const isLast = index === displayHistory.length - 1;
                      const isCreation = h.new_status === "creation";

                      return (
                        <div key={h.id} style={{ display: "flex", gap: "12px" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "60px" }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "9999px",
                                border: `2px solid ${iconBorder}`,
                                backgroundColor: iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: iconColor,
                                boxShadow: "0 0 0 4px rgba(148, 163, 184, 0.15)",
                              }}
                            >
                              <Icon size={18} />
                            </div>
                            {!isLast && (
                              <div
                                style={{
                                  flexGrow: 1,
                                  width: "2px",
                                  backgroundColor: "#E5E7EB",
                                  marginTop: "4px",
                                  marginBottom: "-4px",
                                }}
                              />
                            )}
                          </div>
                          <div
                            style={{
                              padding: "8px 12px",
                              marginBottom: "12px",
                              background: "#F9FAFB",
                              borderRadius: "8px",
                              border: "1px solid #E5E7EB",
                              flex: 1,
                            }}
                          >
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                              {getHistoryTitle(h, ticketDetails)}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                              {formatHistoryDate(h.changed_at)}
                            </div>
                            {!isCreation && (
                              <>
                                {h.user && (
                                  <div style={{ marginTop: "4px", fontSize: "12px", color: "#6B7280" }}>
                                    Par: {h.user.full_name}
                                  </div>
                                )}
                                {h.reason && (() => {
                                  // Ne pas afficher le reason pour les assignations par Secrétaire/Adjoint DSI
                                  const reason = (h.reason || "").toLowerCase();
                                  const isAssignmentBySecretary = reason.includes("assignation par secrétaire") || 
                                                                   reason.includes("assignation par adjoint") ||
                                                                   reason.includes("secrétaire/adjoint dsi");
                                  if (isAssignmentBySecretary) {
                                    return null;
                                  }
                                  // Ne pas afficher le reason pour les réassignations par DSI
                                  if (reason.includes("réassignation par dsi")) {
                                    return null;
                                  }
                                  // Si c'est une validation rejetée, extraire seulement "Motif: ..."
                                  let displayReason = h.reason || "";
                                  if (reason.includes("validation utilisateur: rejeté") && displayReason.includes("Motif:")) {
                                    const motifMatch = displayReason.match(/Motif:\s*(.+)/i);
                                    if (motifMatch && motifMatch[1]) {
                                      displayReason = `Motif: ${motifMatch[1].trim()}`;
                                    }
                                  }
                                  // Enlever le doublon "Résumé de la résolution:" si présent
                                  if (displayReason.startsWith("Résumé de la résolution: Résumé de la résolution:")) {
                                    displayReason = displayReason.replace("Résumé de la résolution: Résumé de la résolution:", "Résumé de la résolution:");
                                  }
                                  return (
                                    <div style={{ marginTop: "4px", fontSize: "13px", color: "#4B5563" }}>
                                      {displayReason}
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Actions disponibles pour le DSI */}
              <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
                <strong>Actions :</strong>
                <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {(ticketDetails.status === "resolu" || ticketDetails.status === "retraite" || ticketDetails.status === "cloture") ? (
                    (userRole === "DSI" || userRole === "Admin") ? (
                      <>
                        {/* Valider / Relancer : uniquement si DSI ou Admin EST le créateur du ticket (résolu ou retraité) */}
                        {(ticketDetails.status === "resolu" || ticketDetails.status === "retraite") && userInfo?.id != null && String(ticketDetails.creator_id) === String(userInfo.id) && (
                          <>
                            <button
                              onClick={() => {
                                setValidationTicket(ticketDetails.id);
                                setShowValidationRejectionForm(false);
                                setValidationRejectionReason("");
                              }}
                              disabled={loading}
                              style={{
                                padding: "10px 20px",
                                backgroundColor: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500"
                              }}
                              onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.backgroundColor = "#218838";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#28a745";
                              }}
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => {
                                setValidationTicket(ticketDetails.id);
                                setShowValidationRejectionForm(true);
                                setValidationRejectionReason("");
                              }}
                              disabled={loading}
                              style={{
                                padding: "10px 20px",
                                backgroundColor: "#e5e7eb",
                                color: "#dc3545",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                              onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.backgroundColor = "#d1d5db";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#e5e7eb";
                              }}
                            >
                              <RefreshCcw size={16} color="#dc3545" />
                              Relancer
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          disabled={loading}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#e5e7eb",
                            color: "black",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                          onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.backgroundColor = "#d1d5db";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#e5e7eb";
                          }}
                        >
                          <MessageCircle size={16} color="#374151" strokeWidth={2} />
                          Ajouter un commentaire
                        </button>
                      </>
                    ) : (
                      <span style={{ fontStyle: "italic" }}>Aucune action disponible pour ce ticket</span>
                    )
                  ) : (
                  <>
                  {/* Bouton Assigner */}
                  {ticketDetails.status === "en_attente_analyse" && (
                    <button
                      onClick={() => {
                        handleAssignClick(ticketDetails.id);
                      }}
                      disabled={loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: loading ? "#d1d5db" : "#f3f4f6",
                        color: "black",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: loading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                    >
                      <UserCheck size={16} />
                      Assigner
                    </button>
                  )}

                  {/* Bouton Déléguer à un adjoint */}
                  {userRole === "DSI" && ticketDetails.status === "en_attente_analyse" && (
                    <button
                      onClick={() => {
                        handleDelegateClick(ticketDetails.id);
                      }}
                      disabled={loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: loading ? "#d1d5db" : "#f3f4f6",
                        color: "black",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: loading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                    >
                      <Users size={16} />
                      Déléguer à un adjoint
                    </button>
                  )}

                  {/* Bouton Escalader */}
                  {userRole === "DSI" && ticketDetails.status === "en_attente_analyse" && (
                    <button
                      onClick={() => {
                        handleEscalate(ticketDetails.id);
                      }}
                      disabled={loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: loading ? "#d1d5db" : "#f59e0b",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: loading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#d97706";
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#f59e0b";
                      }}
                    >
                      Escalader
                    </button>
                  )}

                  {/* Bouton Réassigner (si assigné ou en cours) */}
                  {(ticketDetails.status === "assigne_technicien" || ticketDetails.status === "en_cours") && (
                    <button
                      onClick={() => {
                        handleReassignClick(ticketDetails.id);
                      }}
                      disabled={loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: loading ? "#d1d5db" : "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: loading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#059669";
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) e.currentTarget.style.backgroundColor = "#10b981";
                      }}
                    >
                      Réassigner
                    </button>
                  )}

                  {/* Bouton Rouvrir (si relancé) - style spécifique pour DSI / Admin */}
                  {ticketDetails.status === "rejete" && (
                    <button
                      onClick={() => {
                        handleReopenClick(ticketDetails.id);
                      }}
                      disabled={loading}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: loading
                          ? "#d1d5db"
                          : (userRole === "DSI" || userRole === "Admin")
                            ? "hsl(25, 95%, 53%)"
                            : "#f3f4f6",
                        color: (userRole === "DSI" || userRole === "Admin") ? "white" : "black",
                        border: "none",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        opacity: loading ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                      onMouseEnter={(e) => {
                        if (loading) return;
                        if (userRole === "DSI" || userRole === "Admin") {
                          e.currentTarget.style.backgroundColor = "hsl(25, 95%, 48%)";
                        } else {
                          e.currentTarget.style.backgroundColor = "#e5e7eb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (loading) return;
                        if (userRole === "DSI" || userRole === "Admin") {
                          e.currentTarget.style.backgroundColor = "hsl(25, 95%, 53%)";
                        } else {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                        }
                      }}
                    >
                      Rouvrir
                    </button>
                  )}
                  </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
          {activeSection === "dashboard" && (
            <DashboardSection
              userRole={userRole}
              pendingCount={pendingCount}
              activeTechniciansCount={activeTechniciansCount}
              technicians={technicians}
              metrics={metrics}
              resolutionRate={resolutionRate}
              totalTicketsCount={totalTicketsCount}
              filteredTickets={filteredTickets}
              formatTicketNumber={formatTicketNumber}
              loadTicketDetails={loadTicketDetails}
              loading={loading}
              openActionsMenuFor={openActionsMenuFor}
              setOpenActionsMenuFor={setOpenActionsMenuFor}
              setActionsMenuPosition={setActionsMenuPosition}
              prepareWeeklyTicketsData={prepareWeeklyTicketsData}
              prepareMonthlyEvolutionData={prepareMonthlyEvolutionData}
              preparePriorityData={preparePriorityData}
              prepareStatusData={prepareStatusData}
              prepareAgencyAnalysisData={prepareAgencyAnalysisData}
              prepareTechnicianPerformanceData={prepareTechnicianPerformanceData}
              prepareTimeSeriesData={prepareTimeSeriesData}
              prepareStatusEvolutionData={prepareStatusEvolutionData}
              prepareResolutionTimeByTypeData={prepareResolutionTimeByTypeData}
              allTickets={allTickets}
              preparePriorityEvolutionData={preparePriorityEvolutionData}
              prepareAgencyData={prepareAgencyData}
              prepareDayOfWeekData={prepareDayOfWeekData}
              prepareUsersByRoleData={prepareUsersByRoleData}
              prepareTechniciansBySpecializationData={prepareTechniciansBySpecializationData}
              prepareTechnicianWorkloadData={prepareTechnicianWorkloadData}
              prepareMostActiveUsersData={prepareMostActiveUsersData}
            />
          )}
          </>
        )}

        {activeSection === "actifs" && (
          <ActifsSection
            totalAssets={totalAssets}
            inServiceCount={inServiceCount}
            inMaintenanceCount={inMaintenanceCount}
            inPanneCount={inPanneCount}
            inStockCount={inStockCount}
            reformedCount={reformedCount}
            totalValue={totalValue}
            warrantiesExpiringCount={warrantiesExpiringCount}
            assetSearchQuery={assetSearchQuery}
            setAssetSearchQuery={setAssetSearchQuery}
            assetStatusFilter={assetStatusFilter}
            setAssetStatusFilter={setAssetStatusFilter}
            assetTypeFilter={assetTypeFilter}
            setAssetTypeFilter={setAssetTypeFilter}
            assetDepartmentFilter={assetDepartmentFilter}
            setAssetDepartmentFilter={setAssetDepartmentFilter}
            assetDepartments={assetDepartments}
            filteredAssets={filteredAssets}
            assetError={assetError}
            isLoadingAssets={isLoadingAssets}
            canEditAssets={canEditAssets}
            onOpenCreateModal={() => {
              setAssetModalMode("create");
              setEditingAsset(null);
              setAssetForm({
                nom: "",
                type: "desktop",
                statut: "en_stock",
                numero_de_serie: "",
                marque: "",
                modele: "",
                localisation: "",
                departement: "",
                assigned_to_user_id: "",
                date_d_achat: "",
                date_de_fin_garantie: "",
                prix_d_achat: "",
                fournisseur: "",
                notes: "",
              });
              setShowAssetModal(true);
            }}
            onOpenEditAsset={(asset) => {
              setAssetModalMode("edit");
              setEditingAsset(asset);
              setAssetForm({
                nom: asset.nom || "",
                type: asset.type || "desktop",
                statut: asset.statut || "en_stock",
                numero_de_serie: asset.numero_de_serie || "",
                marque: asset.marque || "",
                modele: asset.modele || "",
                localisation: asset.localisation || "",
                departement: asset.departement || "",
                assigned_to_user_id: asset.assigned_to_user_id ? String(asset.assigned_to_user_id) : "",
                date_d_achat: asset.date_d_achat?.slice(0, 10) || "",
                date_de_fin_garantie: asset.date_de_fin_garantie?.slice(0, 10) || "",
                prix_d_achat: asset.prix_d_achat != null ? String(asset.prix_d_achat) : "",
                fournisseur: asset.fournisseur || "",
                notes: asset.notes || "",
              });
              setShowAssetModal(true);
            }}
          />
        )}

          {activeSection === "tickets" && (
            <div style={{ display: showTicketDetailsPage ? "none" : "block" }}>
              <TicketsSection
                showTicketsPlaceholder={showTicketsPlaceholder}
                ticketSearchQuery={ticketSearchQuery}
                setTicketSearchQuery={setTicketSearchQuery}
                loadTickets={loadTickets}
                filteredTickets={filteredTickets}
                formatTicketNumber={formatTicketNumber}
                getPriorityLabel={getPriorityLabel}
                advancedPeriodRange={advancedPeriodRange}
                setAdvancedPeriodRange={setAdvancedPeriodRange}
                showPeriodCalendar={showPeriodCalendar}
                setShowPeriodCalendar={setShowPeriodCalendar}
                periodCalendarRef={periodCalendarRef}
                advancedAgencyFilter={advancedAgencyFilter}
                setAdvancedAgencyFilter={setAdvancedAgencyFilter}
                allAgencies={allAgencies.filter((x): x is string => !!x)}
                advancedCategoryFilter={advancedCategoryFilter}
                setAdvancedCategoryFilter={setAdvancedCategoryFilter}
                advancedCategories={advancedCategories.filter((x): x is string => !!x)}
                advancedTypeFilter={advancedTypeFilter}
                setAdvancedTypeFilter={setAdvancedTypeFilter}
                advancedTypes={advancedTypes.filter((x): x is string => !!x)}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                delegationFilter={delegationFilter}
                setDelegationFilter={setDelegationFilter}
                userRole={userRole}
                advancedNonResolvedFilter={advancedNonResolvedFilter}
                setAdvancedNonResolvedFilter={setAdvancedNonResolvedFilter}
                advancedUserFilter={advancedUserFilter}
                setAdvancedUserFilter={setAdvancedUserFilter}
                advancedUsers={advancedUsers.filter((x): x is string => !!x)}
                advancedCreatorFilter={advancedCreatorFilter}
                setAdvancedCreatorFilter={setAdvancedCreatorFilter}
                loadTicketDetails={loadTicketDetails}
                openActionsMenuFor={openActionsMenuFor}
                setOpenActionsMenuFor={setOpenActionsMenuFor}
                setActionsMenuPosition={setActionsMenuPosition}
                loading={loading}
                onExportExcel={() => {
                  try {
                    const wb = XLSX.utils.book_new();
                    const rows = filteredTickets.map((t) => ({
                      Numéro: formatTicketNumber(t.number),
                      Titre: t.title,
                      Description: t.description || "",
                      Statut: t.status,
                      Priorité: getPriorityLabel(t.priority || "non_definie"),
                      Catégorie: t.category || "",
                      Type: t.type || "",
                      Agence: t.creator?.agency || t.user_agency || "",
                      Créé_par: t.creator?.full_name || "",
                      Technicien: t.technician?.full_name || "",
                      Créé_le: t.created_at ? new Date(t.created_at).toLocaleString("fr-FR") : "",
                      Résolu_le: t.resolved_at ? new Date(t.resolved_at).toLocaleString("fr-FR") : "",
                    }));
                    const ws = XLSX.utils.json_to_sheet(rows);
                    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
                    XLSX.writeFile(wb, `Tickets_DSI_${new Date().toISOString().split("T")[0]}.xlsx`);
                  } catch (error) {
                    console.error("Erreur export Excel tickets:", error);
                    alert("Erreur lors de l'export Excel des tickets");
                  }
                }}
                onExportPdf={() => {
                  try {
                    const doc = new jsPDF();
                    doc.setFontSize(14);
                    doc.text("Liste des tickets (DSI)", 14, 20);
                    doc.setFontSize(10);
                    doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, 14, 28);
                    const tableData = filteredTickets.map((t) => [
                      formatTicketNumber(t.number),
                      t.title,
                      getPriorityLabel(t.priority || "non_definie"),
                      t.status,
                      t.category || "",
                      t.type || "",
                      t.creator?.agency || t.user_agency || "",
                      t.creator?.full_name || "",
                      t.technician?.full_name || "",
                    ]);
                    autoTable(doc, {
                      startY: 34,
                      head: [["N°", "Titre", "Priorité", "Statut", "Catégorie", "Type", "Agence", "Créé par", "Technicien"]],
                      body: tableData,
                      styles: { fontSize: 8 },
                      headStyles: { fillColor: [15, 23, 42] },
                    });
                    doc.save(`Tickets_DSI_${new Date().toISOString().split("T")[0]}.pdf`);
                  } catch (error) {
                    console.error("Erreur export PDF tickets:", error);
                    alert("Erreur lors de l'export PDF des tickets");
                  }
                }}
              />
            </div>
          )}
          {activeSection === "reports" && (
            <ReportsSection
              selectedReport={selectedReport}
              setSelectedReport={setSelectedReport}
              showGenerateReport={showGenerateReport}
              setShowGenerateReport={setShowGenerateReport}
              showOutputFormat={showOutputFormat}
              setShowOutputFormat={setShowOutputFormat}
              outputFormat={outputFormat}
              setOutputFormat={setOutputFormat}
              reportType={reportType}
              setReportType={setReportType}
              reportPeriodFrom={reportPeriodFrom}
              setReportPeriodFrom={setReportPeriodFrom}
              reportPeriodTo={reportPeriodTo}
              setReportPeriodTo={setReportPeriodTo}
              reportFilters={reportFilters}
              setReportFilters={setReportFilters}
              allTickets={allTickets}
              technicians={technicians}
              metrics={metrics}
              userInfo={userInfo}
              delegatedTicketsByMe={delegatedTicketsByMe}
              colors={colors}
              statusColors={statusColors}
              priorityColors={priorityColors}
              prepareWeeklyTicketsData={prepareWeeklyTicketsData}
              prepareMonthlyEvolutionData={prepareMonthlyEvolutionData}
              preparePriorityData={preparePriorityData}
              prepareStatusData={prepareStatusData}
              prepareAgencyAnalysisData={prepareAgencyAnalysisData}
              prepareTechnicianPerformanceData={prepareTechnicianPerformanceData}
              prepareAgencyData={prepareAgencyData}
              prepareTimeSeriesData={prepareTimeSeriesData}
              prepareStatusEvolutionData={prepareStatusEvolutionData}
              preparePriorityEvolutionData={preparePriorityEvolutionData}
              prepareDayOfWeekData={prepareDayOfWeekData}
              prepareHourlyData={prepareHourlyData}
              prepareSatisfactionData={prepareSatisfactionData}
              getMostFrequentProblems={getMostFrequentProblems}
              getProblematicApplications={getProblematicApplications}
              getRecurringTicketsHistory={getRecurringTicketsHistory}
              exportToPDF={exportToPDF}
              exportToExcel={exportToExcel}
              viewDetailedReport={viewDetailedReport}
              getReportName={getReportName}
              CustomLabel={CustomLabel}
              reopenedTicketsCount={reopenedTicketsCount}
            />
          )}

           {activeSection === "groupes" && (
            <GroupesSection
              allUsers={allUsers}
              expandedGroupId={expandedGroupId}
              setExpandedGroupId={setExpandedGroupId}
            />
          )}

           {activeSection === "users" && (
            <UsersSection
              allUsers={allUsers}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              userStatusFilter={userStatusFilter}
              setUserStatusFilter={setUserStatusFilter}
              userAgencyFilter={userAgencyFilter}
              setUserAgencyFilter={setUserAgencyFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              usersPerPage={usersPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setShowAddUserModal={setShowAddUserModal}
              handleToggleUserActif={handleToggleUserActif}
              handleEditUser={handleEditUser}
              handleResetPassword={handleResetPassword}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {activeSection === "roles" && (
            <RolesSection roles={roles} />
          )}

          {activeSection === "categories" && (userRole === "Admin" || userRole === "DSI") && (
            <CategoriesSection
              categoriesList={categoriesList}
              loadingCategories={loadingCategories}
              categoriesTypes={categoriesTypes}
              expandedCategoryType={expandedCategoryType}
              setExpandedCategoryType={setExpandedCategoryType}
              showAddCategoryModal={showAddCategoryModal}
              setShowAddCategoryModal={setShowAddCategoryModal}
              showEditCategoryModal={showEditCategoryModal}
              setShowEditCategoryModal={setShowEditCategoryModal}
              editingCategory={editingCategory}
              setEditingCategory={setEditingCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              newCategoryTypeCode={newCategoryTypeCode}
              setNewCategoryTypeCode={setNewCategoryTypeCode}
              editCategoryName={editCategoryName}
              setEditCategoryName={setEditCategoryName}
              editCategoryTypeCode={editCategoryTypeCode}
              setEditCategoryTypeCode={setEditCategoryTypeCode}
              onOpenAddModal={() => {
                setNewCategoryName("");
                setNewCategoryTypeCode(categoriesTypes[0]?.code ?? "");
                setShowAddCategoryModal(true);
              }}
              handleAddCategory={handleAddCategory}
              handleUpdateCategory={handleUpdateCategory}
              onOpenEditModal={(cat) => {
                setEditingCategory(cat);
                setEditCategoryName(cat.name);
                setEditCategoryTypeCode(cat.type_code);
                setShowEditCategoryModal(true);
              }}
              onCloseEditModal={() => {
                setShowEditCategoryModal(false);
                setEditingCategory(null);
              }}
            />
          )}

          {activeSection === "types" && (userRole === "Admin" || userRole === "DSI") && (
            <TypesSection
              ticketTypes={ticketTypes}
              loadingTypes={loadingTypes}
              showAddTypeModal={showAddTypeModal}
              setShowAddTypeModal={setShowAddTypeModal}
              editingType={editingType}
              setEditingType={setEditingType}
              newType={newType}
              setNewType={setNewType}
              onOpenAddModal={() => {
                setNewType({ type: "", description: "", color: "#007bff", is_active: true });
                setEditingType(null);
                setShowAddTypeModal(true);
              }}
              handleEditType={handleEditType}
              handleAddType={handleAddType}
              handleUpdateType={handleUpdateType}
              handleDeleteType={handleDeleteType}
              handleToggleActive={handleToggleActive}
            />
          )}

          {activeSection === "technicians" && userRole !== "Admin" && (
            <TechniciensSection
              token={token}
              allUsers={allUsers}
              technicians={technicians}
              setTechnicians={setTechnicians}
              showDeleteConfirmModal={showDeleteConfirmModal}
              setShowDeleteConfirmModal={setShowDeleteConfirmModal}
              technicianToDelete={technicianToDelete}
              setTechnicianToDelete={setTechnicianToDelete}
              selectedTechnicianDetails={selectedTechnicianDetails}
              setSelectedTechnicianDetails={setSelectedTechnicianDetails}
              showTechnicianDetailsModal={showTechnicianDetailsModal}
              setShowTechnicianDetailsModal={setShowTechnicianDetailsModal}
              showCreateTechnicianModal={showCreateTechnicianModal}
              setShowCreateTechnicianModal={setShowCreateTechnicianModal}
              showEditTechnicianModal={showEditTechnicianModal}
              setShowEditTechnicianModal={setShowEditTechnicianModal}
              editingTechnician={editingTechnician}
              setEditingTechnician={setEditingTechnician}
              loading={loading}
              setLoading={setLoading}
            />
          )}

          {activeSection === "apparence" && (
               <div style={{ padding: "24px 24px 24px 0" }}>

                 {/* Nom de l'Application */}
                 <div style={{ 
                   marginBottom: "32px", 
                   border: "1px solid #ddd", 
                   borderRadius: "8px", 
                   padding: "24px",
                   background: "white"
                 }}>
                   <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>
                     Nom de l'Application
                   </h3>
                   <input
                     type="text"
                     value={localAppName}
                     onChange={(e) => setLocalAppName(e.target.value)}
                     placeholder="Système de Gestion des Tickets_______"
                     style={{
                       width: "100%",
                       padding: "12px 16px",
                       border: "1px solid #ddd",
                       borderRadius: "4px",
                       fontSize: "14px",
                       marginBottom: "8px"
                     }}
                   />
                   <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                     Ce nom apparaît dans l'en-tête de l'application
                   </p>
                 </div>

                 {/* Logo de l'Application */}
                 <div style={{ 
                   marginBottom: "32px", 
                   border: "1px solid #ddd", 
                   borderRadius: "8px", 
                   padding: "24px",
                   background: "white"
                 }}>
                   <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>
                     Logo de l'Application
                   </h3>
                   {localAppLogo && (
                     <div style={{ marginBottom: "12px" }}>
                       <img 
                         src={localAppLogo} 
                         alt="Logo actuel" 
                         style={{ maxWidth: "200px", maxHeight: "100px", marginBottom: "12px" }}
                       />
                     </div>
                   )}
                   <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                     {localAppLogo && (
                       <button
                         onClick={() => {
                           const newWindow = window.open();
                           if (newWindow) {
                             newWindow.document.write(`<img src="${localAppLogo}" style="max-width: 100%;" />`);
                           }
                         }}
                         style={{
                           padding: "8px 16px",
                           backgroundColor: "#f8f9fa",
                           color: "#333",
                           border: "1px solid #ddd",
                           borderRadius: "4px",
                           cursor: "pointer",
                           fontSize: "14px"
                         }}
                       >
                         [Logo actuel]
                       </button>
                     )}
                     <button
                       onClick={() => fileInputRef.current?.click()}
                       style={{
                         padding: "8px 16px",
                         backgroundColor: "#007bff",
                         color: "white",
                         border: "none",
                         borderRadius: "4px",
                         cursor: "pointer",
                         fontSize: "14px"
                       }}
                     >
                       [Télécharger nouveau logo]
                     </button>
                     <input
                       ref={fileInputRef}
                       type="file"
                       accept="image/png,image/jpeg,image/jpg"
                       onChange={handleLogoUpload}
                       style={{ display: "none" }}
                     />
                     {localAppLogo && (
                       <button
                         onClick={handleDeleteLogo}
                         style={{
                           padding: "8px 16px",
                           backgroundColor: "#dc3545",
                           color: "white",
                           border: "none",
                           borderRadius: "4px",
                           cursor: "pointer",
                           fontSize: "14px"
                         }}
                       >
                         [Supprimer]
                       </button>
                     )}
                   </div>
                   <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                     Format accepté : PNG, JPG (Max <span style={{ color: "#007bff" }}>2MB</span>)
                   </p>
                 </div>

                 {/* Thème */}
                 <div style={{ 
                   marginBottom: "32px", 
                   border: "1px solid #ddd", 
                   borderRadius: "8px", 
                   padding: "24px",
                   background: "white"
                 }}>
                   <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>
                     <span style={{ color: "#dc3545" }}>Thème</span>
                   </h3>
                   <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                     <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                       <input
                         type="radio"
                         name="theme"
                         value="clair"
                         checked={localAppTheme === "clair"}
                         onChange={(e) => setLocalAppTheme(e.target.value)}
                         style={{ cursor: "pointer" }}
                       />
                       <span>Clair</span>
                     </label>
                     <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                       <input
                         type="radio"
                         name="theme"
                         value="sombre"
                         checked={localAppTheme === "sombre"}
                         onChange={(e) => setLocalAppTheme(e.target.value)}
                         style={{ cursor: "pointer" }}
                       />
                       <span>Sombre</span>
                     </label>
                     <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                       <input
                         type="radio"
                         name="theme"
                         value="auto"
                         checked={localAppTheme === "auto"}
                         onChange={(e) => setLocalAppTheme(e.target.value)}
                         style={{ cursor: "pointer" }}
                       />
                       <span><span style={{ color: "#dc3545" }}>Auto</span> (selon les préférences du <span style={{ color: "#dc3545" }}>système</span>)</span>
                     </label>
                   </div>
                 </div>

                 {/* Couleur Primaire */}
                 <div style={{ 
                   marginBottom: "32px", 
                   border: "1px solid #ddd", 
                   borderRadius: "8px", 
                   padding: "24px",
                   background: "white"
                 }}>
                   <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>
                     Couleur Primaire
                   </h3>
                   <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                       <div style={{ 
                         width: "24px", 
                         height: "24px", 
                         backgroundColor: localPrimaryColor, 
                         borderRadius: "4px",
                         border: "1px solid #ddd"
                       }}></div>
                       <span style={{ fontSize: "14px", color: "#333" }}>[■ {getColorName(localPrimaryColor)}]</span>
                     </div>
                     <input
                       type="color"
                       value={localPrimaryColor}
                       onChange={(e) => setLocalPrimaryColor(e.target.value)}
                       style={{
                         width: "40px",
                         height: "40px",
                         border: "1px solid #ddd",
                         borderRadius: "4px",
                         cursor: "pointer"
                       }}
                     />
                     <button
                       onClick={() => setShowColorPicker(!showColorPicker)}
                       style={{
                         padding: "8px 16px",
                         backgroundColor: "#f8f9fa",
                         color: "#333",
                         border: "1px solid #ddd",
                         borderRadius: "4px",
                         cursor: "pointer",
                         fontSize: "14px"
                       }}
                     >
                       [Sélectionner une couleur]
                     </button>
                   </div>
                   {showColorPicker && (
                     <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                       {["#007bff", "#28a745", "#dc3545", "#ffc107", "#6c757d", "#17a2b8", "#ff9800", "#9c27b0"].map((color) => (
                         <div
                           key={color}
                           onClick={() => {
                             setLocalPrimaryColor(color);
                             setShowColorPicker(false);
                           }}
                           style={{
                             width: "40px",
                             height: "40px",
                             backgroundColor: color,
                             borderRadius: "4px",
                             border: localPrimaryColor === color ? "3px solid #333" : "1px solid #ddd",
                             cursor: "pointer"
                           }}
                         />
                       ))}
                     </div>
                   )}
                 </div>

                 {/* Boutons d'action */}
                 <div style={{ 
                   display: "flex", 
                   justifyContent: "flex-end", 
                   gap: "12px",
                   marginTop: "32px",
                   paddingTop: "24px",
                   borderTop: "1px solid #eee"
                 }}>
                   <button
                     onClick={handleCancelAppearance}
                     style={{
                       padding: "10px 20px",
                       backgroundColor: "#6c757d",
                       color: "white",
                       border: "none",
                       borderRadius: "4px",
                       cursor: "pointer",
                       fontSize: "14px"
                     }}
                   >
                     [Annuler]
                   </button>
                   <button
                     onClick={handleSaveAppearance}
                     style={{
                       padding: "10px 20px",
                       backgroundColor: "#28a745",
                       color: "white",
                       border: "none",
                       borderRadius: "4px",
                       cursor: "pointer",
                       fontSize: "14px"
                     }}
                   >
                     [Enregistrer]
                   </button>
                 </div>
               </div>
           )}

           {activeSection === "types-tickets" && (
             <div style={{ padding: "24px" }}>
               <h1 style={{ marginBottom: "24px", fontSize: "28px", fontWeight: "600", color: "#333" }}>
                 Types de Tickets
               </h1>

               {/* Bouton Ajouter */}
               <div style={{ marginBottom: "24px" }}>
                 <button
                   onClick={() => {
                     setNewType({ type: "", description: "", color: "#007bff", is_active: true });
                     setEditingType(null);
                     setShowAddTypeModal(true);
                   }}
                   style={{
                     padding: "10px 20px",
                     backgroundColor: "white",
                     color: "#007bff",
                     border: "1px solid #007bff",
                     borderRadius: "4px",
                     cursor: "pointer",
                     fontSize: "14px",
                     fontWeight: "500"
                   }}
                 >
                   [+ Ajouter un type]
                 </button>
               </div>

               {/* Tableau des types */}
               <div style={{ 
                 background: "white", 
                 borderRadius: "8px", 
                 boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                 overflow: "hidden"
               }}>
                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
                   <thead>
                     <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#333", borderBottom: "1px solid #dee2e6" }}>Type</th>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#333", borderBottom: "1px solid #dee2e6" }}>Description</th>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#333", borderBottom: "1px solid #dee2e6" }}>Couleur</th>
                       <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", color: "#333", borderBottom: "1px solid #dee2e6" }}>Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {ticketTypes.map((ticketType) => (
                       <tr key={ticketType.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                         <td style={{ padding: "12px 16px", color: "#333" }}>{ticketType.type}</td>
                         <td style={{ padding: "12px 16px", color: "#333" }}>
                           {ticketType.description.includes("d'accès") ? (
                             <>
                               {ticketType.description.split("d'accès")[0]}
                               <span style={{ color: "#ff9800" }}>d'accès</span>
                               {ticketType.description.split("d'accès")[1]}
                             </>
                           ) : (
                             ticketType.description
                           )}
                         </td>
                         <td style={{ padding: "12px 16px" }}>
                           <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                             <div style={{
                               width: "20px",
                               height: "20px",
                               borderRadius: "50%",
                               backgroundColor: ticketType.color,
                               border: "1px solid #ddd"
                             }}></div>
                             <span style={{ color: "#333" }}>{getTypeColorName(ticketType.color)}</span>
                           </div>
                         </td>
                         <td style={{ padding: "12px 16px" }}>
                           <div style={{ display: "flex", gap: "12px" }}>
                             <button
                               onClick={() => handleEditType(ticketType.id)}
                               style={{
                                 padding: "0",
                                 backgroundColor: "transparent",
                                 border: "none",
                                 cursor: "pointer",
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 width: "28px",
                                 height: "28px"
                               }}
                               title="Modifier"
                             >
                               <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                 {/* Crayon jaune */}
                                 <path d="M6 22L2 18L10 10L14 14L6 22Z" fill="#ffc107" stroke="#d4a574" strokeWidth="0.8"/>
                                 <path d="M2 18L6 22L2 22L2 18Z" fill="#d4a574"/>
                                 <path d="M10 10L14 14L10 14L10 10Z" fill="#ffeb3b"/>
                                 {/* Pointe grise */}
                                 <path d="M2 18L6 22L2 22Z" fill="#757575"/>
                                 {/* Gomme rose */}
                                 <rect x="20" y="2" width="4" height="4" rx="0.5" fill="#ffb3d9" stroke="#ff91c7" strokeWidth="0.5"/>
                                 {/* Bande métallique bleue */}
                                 <rect x="19" y="5" width="6" height="1.5" fill="#87ceeb"/>
                               </svg>
                             </button>
                             <button
                               onClick={() => handleDeleteType(ticketType.id)}
                               style={{
                                 padding: "0",
                                 backgroundColor: "transparent",
                                 border: "none",
                                 cursor: "pointer",
                                 display: "flex",
                                 alignItems: "center",
                                 justifyContent: "center",
                                 width: "28px",
                                 height: "28px"
                               }}
                               title="Supprimer"
                             >
                               <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                 {/* Poubelle bleue claire avec motif grille */}
                                 <rect x="7" y="6" width="14" height="16" rx="1.5" fill="#87ceeb" stroke="#5ba3d4" strokeWidth="1.2"/>
                                 {/* Motif de grille */}
                                 <line x1="10" y1="8" x2="10" y2="20" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 <line x1="14" y1="8" x2="14" y2="20" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 <line x1="18" y1="8" x2="18" y2="20" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 <line x1="8" y1="10" x2="20" y2="10" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 <line x1="8" y1="13" x2="20" y2="13" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 <line x1="8" y1="16" x2="20" y2="16" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 <line x1="8" y1="19" x2="20" y2="19" stroke="#5ba3d4" strokeWidth="0.6" opacity="0.7"/>
                                 {/* Bord supérieur */}
                                 <rect x="9" y="3" width="10" height="3" rx="0.5" fill="#5ba3d4"/>
                               </svg>
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               {/* Modal Ajouter/Modifier un type */}
               {showAddTypeModal && (
                 <div 
                   onClick={() => {
                     setShowAddTypeModal(false);
                     setEditingType(null);
                     setNewType({ type: "", description: "", color: "#007bff", is_active: true });
                   }}
                   style={{
                     position: "fixed",
                     top: 0,
                     left: 0,
                     right: 0,
                     bottom: 0,
                     background: "rgba(0,0,0,0.5)",
                     display: "flex",
                     alignItems: "center",
                     justifyContent: "center",
                     zIndex: 1000,
                     padding: "20px"
                   }}
                 >
                   <div 
                     onClick={(e) => e.stopPropagation()}
                     style={{
                       background: "white",
                       borderRadius: "12px",
                       width: "100%",
                       maxWidth: "500px",
                       boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                       padding: "24px"
                     }}
                   >
                     <h2 style={{ marginBottom: "24px", fontSize: "24px", fontWeight: "600", color: "#333" }}>
                       {editingType ? "Modifier le type" : "Ajouter un type"}
                     </h2>
                     
                     <div style={{ marginBottom: "16px" }}>
                       <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                         Type <span style={{ color: "#dc3545" }}>*</span>
                       </label>
                       <input
                         type="text"
                         value={newType.type}
                         onChange={(e) => setNewType({ ...newType, type: e.target.value })}
                         placeholder="Ex: Matériel"
                         style={{
                           width: "100%",
                           padding: "10px 12px",
                           border: "1px solid #ddd",
                           borderRadius: "4px",
                           fontSize: "14px"
                         }}
                       />
                     </div>

                     <div style={{ marginBottom: "16px" }}>
                       <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                         Description <span style={{ color: "#dc3545" }}>*</span>
                       </label>
                       <input
                         type="text"
                         value={newType.description}
                         onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                         placeholder="Ex: Problèmes matériels"
                         style={{
                           width: "100%",
                           padding: "10px 12px",
                           border: "1px solid #ddd",
                           borderRadius: "4px",
                           fontSize: "14px"
                         }}
                       />
                     </div>

                     <div style={{ marginBottom: "24px" }}>
                       <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                         Couleur
                       </label>
                       <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                         <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                           <div style={{
                             width: "30px",
                             height: "30px",
                             borderRadius: "50%",
                             backgroundColor: newType.color,
                             border: "1px solid #ddd"
                           }}></div>
                           <input
                             type="color"
                             value={newType.color}
                             onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                             style={{
                               width: "50px",
                               height: "40px",
                               border: "1px solid #ddd",
                               borderRadius: "4px",
                               cursor: "pointer"
                             }}
                           />
                         </div>
                         <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                           {["#dc3545", "#28a745", "#ffc107", "#9c27b0", "#6c757d", "#007bff", "#17a2b8", "#ff9800"].map((color) => (
                             <div
                               key={color}
                               onClick={() => setNewType({ ...newType, color })}
                               style={{
                                 width: "30px",
                                 height: "30px",
                                 borderRadius: "50%",
                                 backgroundColor: color,
                                 border: newType.color === color ? "3px solid #333" : "1px solid #ddd",
                                 cursor: "pointer"
                               }}
                             />
                           ))}
                         </div>
                       </div>
                     </div>

                     <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                       <button
                         onClick={() => {
                           setShowAddTypeModal(false);
                           setEditingType(null);
                           setNewType({ type: "", description: "", color: "#007bff", is_active: true });
                         }}
                         style={{
                           padding: "10px 20px",
                           backgroundColor: "#6c757d",
                           color: "white",
                           border: "none",
                           borderRadius: "4px",
                           cursor: "pointer",
                           fontSize: "14px"
                         }}
                       >
                         Annuler
                       </button>
                       <button
                         onClick={editingType ? handleUpdateType : handleAddType}
                         style={{
                           padding: "10px 20px",
                           backgroundColor: "#28a745",
                           color: "white",
                           border: "none",
                           borderRadius: "4px",
                           cursor: "pointer",
                           fontSize: "14px"
                         }}
                       >
                         {editingType ? "Modifier" : "Ajouter"}
                       </button>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}

           {activeSection === "priorites" && (
            <PrioritesSection
              token={token}
              prioritiesFromDb={prioritiesFromDb}
              loadingPrioritiesFromDb={loadingPrioritiesFromDb}
              loadPrioritiesFromDb={loadPrioritiesFromDb}
              addPriorityForm={addPriorityForm}
              setAddPriorityForm={setAddPriorityForm}
              showAddPriorityFromDbModal={showAddPriorityFromDbModal}
              setShowAddPriorityFromDbModal={setShowAddPriorityFromDbModal}
              editingPriorityFromDb={editingPriorityFromDb}
              setEditingPriorityFromDb={setEditingPriorityFromDb}
              editPriorityForm={editPriorityForm}
              setEditPriorityForm={setEditPriorityForm}
              showAddPriorityModal={showAddPriorityModal}
              setShowAddPriorityModal={setShowAddPriorityModal}
              editingPriority={editingPriority}
              setEditingPriority={setEditingPriority}
              newPriority={newPriority}
              setNewPriority={setNewPriority}
              handleAddPriority={handleAddPriority}
              handleUpdatePriority={handleUpdatePriority}
            />
          )}

          {activeSection === "email" && (
            <EmailSection
              emailSubSection={emailSubSection}
              setEmailSubSection={setEmailSubSection}
              emailSettings={emailSettings}
              setEmailSettings={setEmailSettings}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              emailTemplates={emailTemplates}
              setEmailTemplates={setEmailTemplates}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              showTemplateEditor={showTemplateEditor}
              setShowTemplateEditor={setShowTemplateEditor}
              templateForm={templateForm}
              setTemplateForm={setTemplateForm}
              emailNotifications={emailNotifications}
              setEmailNotifications={setEmailNotifications}
              emailFrequency={emailFrequency}
              setEmailFrequency={setEmailFrequency}
              testEmail={testEmail}
              setTestEmail={setTestEmail}
              testResult={testResult}
              setTestResult={setTestResult}
              emailLogs={emailLogs}
            />
          )}

          {activeSection === "securite" && (
            <SecuriteSection
              securitySettings={securitySettings}
              setSecuritySettings={setSecuritySettings}
              handleSaveSecurity={handleSaveSecurity}
              handleCancelSecurity={handleCancelSecurity}
            />
          )}

          {/* Modal Nouvel actif / Modifier l'actif */}
          {showAssetModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                // Fond sombre plein écran derrière la modale (équivalent à bg-black/80 de Radix)
                backgroundColor: "rgba(0, 0, 0, 0.80)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1200,
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  boxShadow: "0 24px 60px rgba(15,23,42,0.35)",
                  width: "100%",
                  maxWidth: "720px",
                  maxHeight: "85vh",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "18px 22px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#111827",
                      }}
                    >
                      {assetModalMode === "create"
                        ? "Nouvel actif"
                        : "Modifier l'actif"}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#6b7280",
                      }}
                    >
                      Renseignez les informations de l&apos;équipement
                      informatique.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssetModal(false)}
                    style={{
                      border: "none",
                      background: "transparent",
                      borderRadius: "999px",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#6b7280",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contenu scrollable */}
                <div
                  style={{
                    padding: "18px 22px 16px",
                    overflowY: "auto",
                  }}
                >
                  {/* Informations générales */}
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        marginBottom: "10px",
                      }}
                    >
                      Informations générales
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px 16px",
                      }}
                    >
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Nom de l&apos;actif *
                        </label>
                        <input
                          type="text"
                          value={assetForm.nom}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              nom: e.target.value,
                            }))
                          }
                          placeholder="Ex: Dell OptiPlex 7090"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Type *
                        </label>
                        <select
                          value={assetForm.type}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              type: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="">Sélectionner un type</option>
                          {assetTypes.map((type) => (
                            <option key={type.code} value={type.code}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Statut *
                        </label>
                        <select
                          value={assetForm.statut}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              statut: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="en_stock">
                            En stock
                          </option>
                          <option value="in_service">
                            En service
                          </option>
                          <option value="en_maintenance">
                            En maintenance
                          </option>
                          <option value="en_panne">
                            En panne
                          </option>
                          <option value="reformes">
                            Réformés
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          N° de série *
                        </label>
                        <input
                          type="text"
                          value={assetForm.numero_de_serie}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              numero_de_serie: e.target.value,
                            }))
                          }
                          placeholder="Ex: DELL-7090-001"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Marque *
                        </label>
                        <input
                          type="text"
                          value={assetForm.marque}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              marque: e.target.value,
                            }))
                          }
                          placeholder="Ex: Dell"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Modèle
                        </label>
                        <input
                          type="text"
                          value={assetForm.modele}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              modele: e.target.value,
                            }))
                          }
                          placeholder="Ex: Dell OptiPlex 7090"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Localisation & Attribution */}
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        marginBottom: "10px",
                      }}
                    >
                      Localisation & attribution
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px 16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Localisation
                        </label>
                        <input
                          type="text"
                          value={assetForm.localisation}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              localisation: e.target.value,
                            }))
                          }
                          placeholder="Ex: Bâtiment A - Étage 2"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Agence
                        </label>
                        <input
                          type="text"
                          value={assetForm.departement}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              departement: e.target.value,
                            }))
                          }
                          placeholder="Ex: Marketing"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Assigné à
                        </label>
                        <select
                          value={assetForm.assigned_to_user_id}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              assigned_to_user_id: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <option value="">Non assigné</option>
                          {allUsers.map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Achat & Garantie */}
                  <div style={{ marginBottom: "18px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        marginBottom: "10px",
                      }}
                    >
                      Achat & garantie
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px 16px",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Date d&apos;achat
                        </label>
                        <input
                          type="date"
                          value={assetForm.date_d_achat}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              date_d_achat: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Fin de garantie
                        </label>
                        <input
                          type="date"
                          value={assetForm.date_de_fin_garantie}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              date_de_fin_garantie: e.target.value,
                            }))
                          }
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Prix d&apos;achat (FCFA)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={assetForm.prix_d_achat}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              prix_d_achat: e.target.value,
                            }))
                          }
                          placeholder="Ex: 850"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#111827",
                          }}
                        >
                          Fournisseur
                        </label>
                        <input
                          type="text"
                          value={assetForm.fournisseur}
                          onChange={(e) =>
                            setAssetForm((f) => ({
                              ...f,
                              fournisseur: e.target.value,
                            }))
                          }
                          placeholder="Ex: Dell Technologies"
                          style={{
                            width: "100%",
                            padding: "9px 11px",
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "14px",
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.09em",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        marginBottom: "10px",
                      }}
                    >
                      Notes
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: "4px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#111827",
                        }}
                      >
                        Informations supplémentaires
                      </label>
                      <textarea
                        rows={3}
                        value={assetForm.notes}
                        onChange={(e) =>
                          setAssetForm((f) => ({
                            ...f,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Informations supplémentaires..."
                        style={{
                          width: "100%",
                          padding: "9px 11px",
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          fontSize: "14px",
                          resize: "vertical",
                          minHeight: "70px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: "12px 22px 16px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAssetModal(false)}
                    style={{
                    padding: "8px 16px",
                    // Forme rectangulaire avec coins légèrement arrondis
                    borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 500,
                      // Texte du bouton Annuler en noir (comme demandé)
                      color: "#111827",
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token) return;

                      if (
                        !assetForm.nom.trim() ||
                        !assetForm.type ||
                        !assetForm.statut ||
                        !assetForm.numero_de_serie.trim() ||
                        !assetForm.marque.trim() ||
                        !assetForm.localisation.trim() ||
                        !assetForm.departement.trim() ||
                        !assetForm.date_d_achat
                      ) {
                        alert(
                          "Merci de renseigner tous les champs obligatoires."
                        );
                        return;
                      }

                      const assignedUserId = assetForm.assigned_to_user_id
                        ? Number(assetForm.assigned_to_user_id)
                        : null;
                      const assignedUser =
                        allUsers.find(
                          (u: any) => u.id === assignedUserId
                        ) || null;

                      const payload: any = {
                        nom: assetForm.nom.trim(),
                        type: assetForm.type,
                        numero_de_serie:
                          assetForm.numero_de_serie.trim(),
                        marque: assetForm.marque.trim(),
                        modele: assetForm.modele.trim(),
                        statut: assetForm.statut,
                        localisation: assetForm.localisation.trim(),
                        departement: assetForm.departement.trim(),
                        date_d_achat: assetForm.date_d_achat,
                        date_de_fin_garantie:
                          assetForm.date_de_fin_garantie || null,
                        prix_d_achat: assetForm.prix_d_achat
                          ? Number(assetForm.prix_d_achat)
                          : null,
                        fournisseur: assetForm.fournisseur || null,
                        assigned_to_user_id: assignedUserId,
                        assigned_to_name:
                          assignedUser?.full_name || null,
                        specifications: null,
                        notes: assetForm.notes || null,
                      };

                      try {
                        const endpoint =
                          assetModalMode === "edit" && editingAsset
                            ? `http://localhost:8000/assets/${editingAsset.id}`
                            : "http://localhost:8000/assets/";
                        const method =
                          assetModalMode === "edit" && editingAsset
                            ? "PUT"
                            : "POST";

                        const res = await fetch(endpoint, {
                          method,
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify(payload),
                        });

                        if (!res.ok) {
                          const error = await res.json().catch(() => null);
                          console.error(
                            "Erreur création actif:",
                            res.status,
                            error
                          );
                          alert(
                            error?.detail ||
                              "Erreur lors de la création de l'actif."
                          );
                          return;
                        }

                        await loadAssets();
                        setShowAssetModal(false);
                      } catch (err) {
                        console.error(
                          "Erreur réseau création actif:",
                          err
                        );
                        alert(
                          "Erreur réseau lors de la création de l'actif."
                        );
                      }
                    }}
                    style={{
                      padding: "8px 18px",
                      // Forme rectangulaire avec coins légèrement arrondis
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#111827",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#ffffff",
                      cursor: "pointer",
                    }}
                  >
                    {assetModalMode === "create"
                      ? "Créer l'actif"
                      : "Enregistrer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "departements" && (
            <DepartementsSection
              assetDepartments={assetDepartments}
              showDepartmentModal={showDepartmentModal}
              editingDepartment={editingDepartment}
              departmentName={departmentName}
              openAddDepartmentModal={openAddDepartmentModal}
              openEditDepartmentModal={openEditDepartmentModal}
              handleToggleDepartment={handleToggleDepartment}
              setShowDepartmentModal={setShowDepartmentModal}
              setEditingDepartment={setEditingDepartment}
              setDepartmentName={setDepartmentName}
              handleCreateDepartment={handleCreateDepartment}
              handleUpdateDepartment={handleUpdateDepartment}
            />
          )}

          {activeSection === "maintenance" && (
            <MaintenanceSection
              maintenanceTab={maintenanceTab}
              setMaintenanceTab={setMaintenanceTab}
              formatAvailability={formatAvailability}
              dbAvailability={dbAvailability}
              authAvailability={authAvailability}
              apiAvailability={apiAvailability}
              cpuUsage={cpuUsage}
              memoryUsage={memoryUsage}
              storageUsage={storageUsage}
              bandwidthUsage={bandwidthUsage}
              databaseTables={databaseTables}
              databaseTablesError={databaseTablesError}
              isLoadingDatabaseTables={isLoadingDatabaseTables}
              loadDatabaseTablesStats={loadDatabaseTablesStats}
              maintenanceLogs={maintenanceLogs}
              maintenanceLogsError={maintenanceLogsError}
              isLoadingMaintenanceLogs={isLoadingMaintenanceLogs}
              formatNotificationMessage={formatNotificationMessage}
            />
          )}

          {activeSection === "audit-logs" && <AuditLogsSection />}

            {/* Section Notifications dans le contenu principal */}
            {activeSection === "notifications" && (
              <div style={{
                display: "flex",
                width: "100%",
                height: "100vh",
                background: "white",
                overflow: "hidden"
              }}>
                {/* Panneau gauche - Liste des tickets avec notifications */}
                <div style={{
                  width: "400px",
                  borderRight: "1px solid #e0e0e0",
                  display: "flex",
                  flexDirection: "column",
                  background: "#f8f9fa",
                  height: "100%",
                  overflow: "hidden",
                  flexShrink: 0
                }}>
                  <div style={{
                    padding: "28px 20px 20px 30px",
                    borderBottom: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "white",
                    borderRadius: "8px 0 0 0"
                  }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#333" }}>
                      Tickets avec notifications
                    </h3>
                    <button
                      onClick={() => {
                        changeSectionForDSI("dashboard");
                        setSelectedNotificationTicket(null);
                        setSelectedNotificationTicketDetails(null);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "24px",
                        cursor: "pointer",
                        color: "#999",
                        padding: "0",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "10px 10px 10px 0"
                  }}>
                    {notificationsTickets.length === 0 ? (
                      <div style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: "#999"
                      }}>
                        Aucun ticket avec notification
                      </div>
                    ) : (
                      notificationsTickets.map((ticket) => {
                        const ticketNotifications = notifications.filter(n => n.ticket_id === ticket.id);
                        const unreadCount = ticketNotifications.filter(n => !n.read).length;
                        const isSelected = selectedNotificationTicket === ticket.id;
                        
                        return (
                          <div
                            key={ticket.id}
                            onClick={async () => {
                              setSelectedNotificationTicket(ticket.id);
                              try {
                                const res = await fetch(`http://localhost:8000/tickets/${ticket.id}`, {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setSelectedNotificationTicketDetails(data);
                                  await Promise.all([loadTicketHistory(ticket.id), loadTicketComments(ticket.id)]);
                                  await markTicketNotificationsAsRead(ticket.id);
                                }
                              } catch (err) {
                                console.error("Erreur chargement détails:", err);
                              }
                            }}
                            style={{
                              padding: "12px 12px 12px 30px",
                              marginBottom: "8px",
                              borderRadius: "8px",
                              background: isSelected ? "#e3f2fd" : "white",
                              border: isSelected ? "2px solid #2196f3" : "1px solid #e0e0e0",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "10px"
                            }}>
                              <div style={{ flex: 1 }}>
                                <p style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: isSelected ? "600" : "500",
                                  color: "#333",
                                  lineHeight: "1.5"
                                }}>
                                  {formatTicketNumber(ticket.number)}
                                </p>
                                <p style={{
                                  margin: "4px 0 0 0",
                                  fontSize: "13px",
                                  color: "#666",
                                  lineHeight: "1.4",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}>
                                  {ticket.title}
                                </p>
                                <p style={{
                                  margin: "4px 0 0 0",
                                  fontSize: "11px",
                                  color: "#999"
                                }}>
                                  {ticketNotifications.length} notification{ticketNotifications.length > 1 ? "s" : ""}
                                </p>
                              </div>
                              {unreadCount > 0 && (
                                <div style={{
                                  minWidth: "20px",
                                  height: "20px",
                                  borderRadius: "10px",
                                  background: "#f44336",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  padding: "0 6px"
                                }}>
                                  {unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Panneau droit - Détails du ticket sélectionné */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  background: "white"
                }}>
                  {selectedNotificationTicketDetails ? (
                    <>
                      <div style={{
                        padding: "28px 20px 20px 30px",
                        borderBottom: "1px solid #e0e0e0",
                        background: "white",
                        borderRadius: "0 8px 0 0"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#333" }}>Détails du ticket {formatTicketNumber(selectedNotificationTicketDetails.number)}</h3>
                          {selectedNotificationTicketDetails.status === "rejete" && (
                            <span style={{
                              padding: "6px 10px",
                              borderRadius: "16px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#fee2e2",
                              color: "#991b1b",
                              border: "1px solid #fecaca"
                            }}>
                              Relancé
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "20px 20px 20px 30px"
                      }}>
                        <div style={{ marginBottom: "16px" }}>
                          <strong>Titre :</strong>
                          <p style={{ marginTop: "4px", padding: "8px", background: "#f8f9fa", borderRadius: "4px" }}>
                            {selectedNotificationTicketDetails.title}
                          </p>
                        </div>

                        {selectedNotificationTicketDetails.description && (
                          <div style={{ marginBottom: "16px" }}>
                            <strong>Description :</strong>
                            <p style={{ marginTop: "4px", padding: "8px", background: "#f8f9fa", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                              {selectedNotificationTicketDetails.description}
                            </p>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                          <div>
                            <strong>Priorité :</strong>
                            <span style={{
                              marginLeft: "8px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                              background: selectedNotificationTicketDetails.priority === "critique" ? "rgba(229, 62, 62, 0.1)" : selectedNotificationTicketDetails.priority === "haute" ? "rgba(245, 158, 11, 0.1)" : selectedNotificationTicketDetails.priority === "moyenne" ? "rgba(13, 173, 219, 0.1)" : selectedNotificationTicketDetails.priority === "faible" ? "#E5E7EB" : "#9e9e9e",
                              color: selectedNotificationTicketDetails.priority === "critique" ? "#E53E3E" : selectedNotificationTicketDetails.priority === "haute" ? "#F59E0B" : selectedNotificationTicketDetails.priority === "moyenne" ? "#0DADDB" : selectedNotificationTicketDetails.priority === "faible" ? "#6B7280" : "white"
                           }}>
                              {getPriorityLabel(selectedNotificationTicketDetails.priority ?? "non_definie")}
                            </span>
                          </div>
                          <div>
                            <strong>Type :</strong>
                            <span style={{ marginLeft: "8px", padding: "4px 8px", borderRadius: "4px" }}>
                              {selectedNotificationTicketDetails.type === "materiel" ? "Matériel" : selectedNotificationTicketDetails.type === "applicatif" ? "Applicatif" : selectedNotificationTicketDetails.type || "—"}
                            </span>
                          </div>
                          <div>
                            <strong>Catégorie :</strong>
                            <span style={{ marginLeft: "8px" }}>
                              {selectedNotificationTicketDetails.category || "Non spécifiée"}
                            </span>
                          </div>
                          <div>
                            <strong>Statut :</strong>
                            <span style={{
                              marginLeft: "8px",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                              background: selectedNotificationTicketDetails.status === "en_attente_analyse" ? "rgba(13, 173, 219, 0.1)" : selectedNotificationTicketDetails.status === "assigne_technicien" ? "rgba(255, 122, 27, 0.1)" : selectedNotificationTicketDetails.status === "en_cours" ? "rgba(15, 31, 61, 0.1)" : selectedNotificationTicketDetails.status === "retraite" ? "#EDE7F6" : selectedNotificationTicketDetails.status === "resolu" ? "rgba(47, 158, 68, 0.1)" : selectedNotificationTicketDetails.status === "rejete" ? "#fee2e2" : selectedNotificationTicketDetails.status === "cloture" ? "#E5E7EB" : "#f3f4f6",
                              color: selectedNotificationTicketDetails.status === "en_attente_analyse" ? "#0DADDB" : selectedNotificationTicketDetails.status === "assigne_technicien" ? "#FF7A1B" : selectedNotificationTicketDetails.status === "en_cours" ? "#0F1F3D" : selectedNotificationTicketDetails.status === "retraite" ? "#4A148C" : selectedNotificationTicketDetails.status === "resolu" ? "#2F9E44" : selectedNotificationTicketDetails.status === "rejete" ? "#991b1b" : selectedNotificationTicketDetails.status === "cloture" ? "#374151" : "#6b7280"
                            }}>
                              {getStatusLabel(selectedNotificationTicketDetails.status)}
                            </span>
                          </div>
                          {selectedNotificationTicketDetails.creator && (
                            <div>
                              <strong>Créateur :</strong>
                              <span style={{ marginLeft: "8px" }}>
                                {selectedNotificationTicketDetails.creator.full_name}
                              </span>
                            </div>
                          )}
                          {selectedNotificationTicketDetails.technician && (
                            <div>
                              <strong>Technicien assigné :</strong>
                              <span style={{ marginLeft: "8px" }}>
                                {selectedNotificationTicketDetails.technician.full_name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Section Commentaires (DSI) - au-dessus de Historique */}
                        {(userRole === "DSI" || userRole === "Admin") && (
                        <div style={{
                          marginTop: "24px",
                          padding: "16px",
                          background: "#f8f9fa",
                          borderRadius: "8px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                            <MessageCircle size={20} color="hsl(25, 95%, 53%)" strokeWidth={2} />
                            <strong style={{ fontSize: "15px", color: "#111827" }}>
                              Commentaires ({myComments.length})
                            </strong>
                          </div>
                          {myComments.length === 0 ? (
                            <p style={{ color: "#6b7280", fontStyle: "italic", marginBottom: "16px", fontSize: "14px" }}>
                              Aucun commentaire pour ce ticket
                            </p>
                          ) : (
                            <div style={{ marginBottom: "16px" }}>
                              {myComments.map((c) => (
                                <div
                                  key={c.id}
                                  style={{
                                    padding: "12px 14px",
                                    background: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb",
                                    marginBottom: "8px"
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                    <div style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      background: "rgba(255, 122, 27, 0.2)",
                                      color: "hsl(25, 95%, 53%)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      flexShrink: 0
                                    }}>
                                      {getInitialsForComment(c.user?.full_name || "Utilisateur")}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                                        {c.user?.full_name || "Utilisateur"}
                                      </span>
                                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                                        {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })} à {new Date(c.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: "14px", color: "#111827", marginLeft: "42px" }}>{c.content}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                              <div style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: "rgba(255, 122, 27, 0.2)",
                                color: "hsl(25, 95%, 53%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 600
                              }}>
                                {userInfo?.full_name ? getInitialsForComment(userInfo.full_name) : "?"}
                              </div>
                              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                                {userInfo?.full_name || "Utilisateur"}
                              </span>
                            </div>
                            <textarea
                              value={detailCommentText}
                              onChange={(e) => setDetailCommentText(e.target.value)}
                              placeholder="Ajouter un commentaire..."
                              style={{
                                width: "100%",
                                minHeight: "80px",
                                padding: "10px 12px",
                                marginBottom: "12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "14px",
                                resize: "vertical",
                                background: "white",
                                boxSizing: "border-box"
                              }}
                            />
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", cursor: "pointer", fontSize: "13px", color: "#6b7280" }}>
                              <input
                                type="checkbox"
                                checked={detailCommentInternal}
                                onChange={(e) => setDetailCommentInternal(e.target.checked)}
                                style={{ width: 16, height: 16 }}
                              />
                              <Lock size={14} color="hsl(25, 95%, 53%)" />
                              Commentaire interne (visible par l'équipe uniquement)
                            </label>
                            <button
                              onClick={() => handleAddCommentFromDetails(selectedNotificationTicketDetails.id)}
                              disabled={loading || !detailCommentText.trim()}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "10px 20px",
                                background: detailCommentText.trim() && !loading ? "hsl(25, 95%, 53%)" : "#d1d5db",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: detailCommentText.trim() && !loading ? "pointer" : "not-allowed",
                                fontSize: "14px",
                                fontWeight: 600
                              }}
                            >
                              <Send size={16} />
                              Envoyer
                            </button>
                          </div>
                        </div>
                        )}

                        <div style={{ marginTop: "24px", marginBottom: "16px" }}>
                          <strong>Historique :</strong>
                          <div style={{ marginTop: "8px" }}>
                            {(() => {
                              const displayHistory = getDisplayHistory(selectedNotificationTicketDetails, ticketHistory);
                              if (displayHistory.length === 0) {
                                return <p style={{ color: "#999", fontStyle: "italic" }}>Aucun historique</p>;
                              }
                              return displayHistory.map((h, index) => {
                                const { Icon, iconBg, iconBorder, iconColor } = getHistoryVisuals(h);
                                const isLast = index === displayHistory.length - 1;
                                const isCreation = h.new_status === "creation";

                                return (
                                  <div key={h.id} style={{ display: "flex", gap: "12px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "60px" }}>
                                      <div
                                        style={{
                                          width: "32px",
                                          height: "32px",
                                          borderRadius: "9999px",
                                          border: `2px solid ${iconBorder}`,
                                          backgroundColor: iconBg,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: iconColor,
                                          boxShadow: "0 0 0 4px rgba(148, 163, 184, 0.15)",
                                        }}
                                      >
                                        <Icon size={18} />
                                      </div>
                                      {!isLast && (
                                        <div
                                          style={{
                                            flexGrow: 1,
                                            width: "2px",
                                            backgroundColor: "#E5E7EB",
                                            marginTop: "4px",
                                            marginBottom: "-4px",
                                          }}
                                        />
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        padding: "8px 12px",
                                        marginBottom: "12px",
                                        background: "#F9FAFB",
                                        borderRadius: "8px",
                                        border: "1px solid #E5E7EB",
                                        flex: 1,
                                      }}
                                    >
                                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                                        {getHistoryTitle(h, selectedNotificationTicketDetails)}
                                      </div>
                                      <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                                        {formatHistoryDate(h.changed_at)}
                                      </div>
                                      {!isCreation && (
                                        <>
                                          {h.user && (
                                            <div style={{ marginTop: "4px", fontSize: "12px", color: "#6B7280" }}>
                                              Par: {h.user.full_name}
                                            </div>
                                          )}
                                          {h.reason && (
                                            <div style={{ marginTop: "4px", fontSize: "13px", color: "#4B5563" }}>
                                              Résumé de la résolution: {h.reason}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#999"
                    }}>
                      Sélectionnez un ticket pour voir les détails
                    </div>
                  )}
                </div>
              </div>
            )}
      </div>

       {/* Modal Ajouter un utilisateur */}
       {showAddUserModal && (
         <div 
           onClick={() => setShowAddUserModal(false)}
           style={{
             position: "fixed",
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             background: "rgba(0,0,0,0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000,
             padding: "20px"
           }}
         >
           <div 
             onClick={(e) => e.stopPropagation()}
             style={{
               background: "white",
               borderRadius: "12px",
               width: "100%",
               maxWidth: "480px",
               maxHeight: "90vh",
               overflowY: "auto",
               boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
               padding: "24px"
             }}
           >
             <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#111827" }}>Nouvel utilisateur</h2>
               <button
                 type="button"
                 onClick={() => setShowAddUserModal(false)}
                 style={{
                   background: "none",
                   border: "none",
                   fontSize: "20px",
                   cursor: "pointer",
                   color: "#6b7280",
                   padding: "0",
                   width: "28px",
                   height: "28px",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   borderRadius: "6px"
                 }}
               >
                 ×
               </button>
             </div>

             <form onSubmit={handleCreateUser}>
               <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Nom complet <span style={{ color: "#dc3545" }}>*</span>
                   </label>
                   <input
                     type="text"
                     required
                     value={newUser.full_name}
                     onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                     style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: "white" }}
                     placeholder="Jean Dupont"
                   />
                 </div>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Email <span style={{ color: "#dc3545" }}>*</span>
                   </label>
                   <input
                     type="email"
                     required
                     value={newUser.email}
                     onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                     style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: "white" }}
                     placeholder="jean.dupont@entreprise.com"
                   />
                 </div>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Rôle <span style={{ color: "#dc3545" }}>*</span>
                   </label>
                   <select
                     required
                     value={newUser.role}
                     onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                     style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: "white", cursor: "pointer" }}
                   >
                     <option value="">Sélectionner un rôle</option>
                     {["Utilisateur", "Technicien (Matériel)", "Technicien (Applicatif)", "Secrétaire DSI", "Adjoint DSI", "DSI", "Administrateur"].map((r) => (
                       <option key={r} value={r}>{r}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Agence <span style={{ color: "#dc3545" }}>*</span>
                   </label>
                   <select
                    required
                    value={newUser.agency}
                    onChange={(e) => setNewUser({ ...newUser, agency: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: "white", cursor: "pointer" }}
                  >
                    <option value="">Sélectionner une agence</option>
                    {assetDepartments.filter(d => d.is_active).map((dept) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                 </div>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Numéro de téléphone
                   </label>
                   <input
                     type="tel"
                     value={newUser.phone}
                     onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                     style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: "white" }}
                     placeholder="Numéro de téléphone"
                   />
                 </div>
                 <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px", marginTop: "4px" }}>
                   <div style={{ marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Statut <span style={{ color: "#dc3545" }}>*</span>
                   </div>
                   <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                     <input
                       type="checkbox"
                       checked={newUser.actif === true}
                       onChange={(e) => setNewUser({ ...newUser, actif: e.target.checked })}
                       style={{ cursor: "pointer" }}
                     />
                     <span>Actif</span>
                   </label>
                 </div>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Mot de passe <span style={{ color: "#dc3545" }}>*</span>
                   </label>
                   <input
                     type="password"
                     required={!newUser.generateRandomPassword}
                     disabled={newUser.generateRandomPassword}
                     value={newUser.password}
                     onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                     style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: newUser.generateRandomPassword ? "#f9fafb" : "white" }}
                     placeholder="Mot de passe"
                   />
                 </div>
                 <div>
                   <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                     Confirmer le mot de passe <span style={{ color: "#dc3545" }}>*</span>
                   </label>
                   <input
                     type="password"
                     required={!newUser.generateRandomPassword}
                     disabled={newUser.generateRandomPassword}
                     value={newUser.confirmPassword}
                     onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                     style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", backgroundColor: newUser.generateRandomPassword ? "#f9fafb" : "white" }}
                     placeholder="Confirmer le mot de passe"
                   />
                 </div>
                 <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                   <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                     <input
                       type="checkbox"
                       checked={newUser.generateRandomPassword}
                       onChange={(e) => setNewUser({ ...newUser, generateRandomPassword: e.target.checked })}
                       style={{ cursor: "pointer" }}
                     />
                     <span>Générer un mot de passe aléatoire</span>
                   </label>
                   <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
                     <input
                       type="checkbox"
                       checked={newUser.sendEmail}
                       onChange={(e) => setNewUser({ ...newUser, sendEmail: e.target.checked })}
                       style={{ cursor: "pointer" }}
                     />
                     <span>Envoyer les identifiants par email</span>
                   </label>
                 </div>
               </div>

               <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                 <button
                   type="button"
                   onClick={() => {
                     setShowAddUserModal(false);
                     setNewUser({
                       full_name: "",
                       email: "",
                       phone: "",
                       agency: "",
                       role: "",
                       actif: true,
                       password: "",
                       confirmPassword: "",
                       generateRandomPassword: true,
                       sendEmail: true,
                     });
                   }}
                   style={{
                     padding: "10px 20px",
                     backgroundColor: "white",
                     color: "#374151",
                     border: "1px solid #d1d5db",
                     borderRadius: "8px",
                     cursor: "pointer",
                     fontSize: "14px",
                     fontWeight: "500"
                   }}
                 >
                   Annuler
                 </button>
                 <button
                   type="submit"
                   style={{
                     padding: "10px 20px",
                     backgroundColor: "hsl(24, 95%, 53%)",
                     color: "white",
                     border: "none",
                     borderRadius: "8px",
                     cursor: "pointer",
                     fontSize: "14px",
                     fontWeight: "500"
                   }}
                 >
                   Ajouter
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Modal Modifier un utilisateur */}
       {showEditUserModal && editingUser && (
         <div 
           onClick={() => {
             setShowEditUserModal(false);
             setEditingUser(null);
           }}
           style={{
             position: "fixed",
             top: 0,
             left: 0,
             right: 0,
             bottom: 0,
             background: "rgba(0,0,0,0.5)",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             zIndex: 1000,
             padding: "20px"
           }}
         >
           <div 
             onClick={(e) => e.stopPropagation()}
             style={{
               background: "white",
               borderRadius: "12px",
               width: "100%",
               maxWidth: "600px",
               maxHeight: "90vh",
               overflowY: "auto",
               boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
               padding: "24px"
             }}
           >
             <div style={{ marginBottom: "24px" }}>
               <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
                 MODIFIER L'UTILISATEUR
               </h2>
               <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                 {editingUser.full_name || editingUser.name} (ID: {editingUser.id || editingUser.user_id})
               </p>
             </div>

             <div style={{ borderTop: "1px solid #ddd", marginBottom: "24px" }}></div>

             <form onSubmit={handleUpdateUser}>
               {/* Informations Personnelles */}
               <div style={{ marginBottom: "24px" }}>
                 <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>Informations Personnelles</h3>
                 <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
                   <div style={{ marginBottom: "16px" }}>
                     <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                       Nom Complet <span style={{ color: "#dc3545" }}>*</span>
                     </label>
                     <input
                       type="text"
                       required
                       value={editUser.full_name}
                       onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                       style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                       placeholder="Nom complet"
                     />
                   </div>
                   <div style={{ marginBottom: "16px" }}>
                     <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                       Email <span style={{ color: "#dc3545" }}>*</span>
                     </label>
                     <input
                       type="email"
                       required
                       value={editUser.email}
                       onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                       style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                       placeholder="email@example.com"
                     />
                   </div>
                   <div style={{ marginBottom: "16px" }}>
                     <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                       Numéro de Téléphone
                     </label>
                     <input
                       type="tel"
                       value={editUser.phone || ""}
                       onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                       style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                       placeholder="Numéro de téléphone"
                     />
                   </div>
                   <div style={{ marginBottom: "16px" }}>
                     <label style={{ display: "block", marginBottom: "8px", color: "#333", fontWeight: "500" }}>
                       Agence <span style={{ color: "#dc3545" }}>*</span>
                     </label>
                     <select
                      required
                      value={editUser.agency}
                      onChange={(e) => setEditUser({ ...editUser, agency: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
                    >
                      <option value="">Sélectionner une agence</option>
                      {assetDepartments.filter(d => d.is_active).map((dept) => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                   </div>
                 </div>
               </div>

               {/* Rôle et Permissions */}
               <div style={{ marginBottom: "24px" }}>
                 <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>Rôle et Permissions</h3>
                 <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", borderLeft: "4px solid #007bff" }}>
                   <div style={{ marginBottom: "20px" }}>
                     <label style={{ display: "block", marginBottom: "12px", color: "#333", fontWeight: "500" }}>
                       Rôle <span style={{ color: "#dc3545" }}>*</span>
                     </label>
                     <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                       {["Utilisateur", "Technicien (Matériel)", "Technicien (Applicatif)", "Secrétaire DSI", "Adjoint DSI", "DSI", "Administrateur"].map((role) => (
                         <label key={role} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                           <input
                             type="radio"
                             name="editRole"
                             value={role}
                             checked={editUser.role === role}
                             onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                             required
                             style={{ cursor: "pointer" }}
                           />
                           <span>{role}{editUser.role === role ? " (Sélectionné)" : ""}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                   <div style={{ borderTop: "1px solid #eee", paddingTop: "16px" }}>
                     <label style={{ display: "block", marginBottom: "12px", color: "#333", fontWeight: "500" }}>
                       Statut <span style={{ color: "#dc3545" }}>*</span>
                     </label>
                     <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                       <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                         <input
                           type="checkbox"
                           checked={editUser.actif === true}
                           onChange={(e) => setEditUser({ ...editUser, actif: e.target.checked })}
                           style={{ cursor: "pointer" }}
                         />
                         <span>Actif</span>
                       </label>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Informations Technicien (conditionnel) */}
               {(editUser.role === "Technicien (Matériel)" || editUser.role === "Technicien (Applicatif)") && (
                 <div style={{ marginBottom: "24px" }}>
                   <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>Informations Technicien</h3>
                   <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", borderLeft: "4px solid #17a2b8", background: "#f8f9fa" }}>
                   </div>
                 </div>
               )}

               {/* Historique */}
               <div style={{ marginBottom: "24px" }}>
                 <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#333" }}>Historique</h3>
                 <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px" }}>
                   <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #007bff" }}>
                     <div style={{ fontSize: "14px", color: "#333" }}>
                       Créé le : {editingUser.created_at ? new Date(editingUser.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " à " + new Date(editingUser.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                     </div>
                   </div>
                   <div style={{ marginBottom: "8px", paddingLeft: "8px", borderLeft: "2px solid #007bff" }}>
                     <div style={{ fontSize: "14px", color: "#333" }}>
                       Modifié le : {editingUser.updated_at ? new Date(editingUser.updated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " à " + new Date(editingUser.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                     </div>
                   </div>
                   <div style={{ paddingLeft: "8px", borderLeft: "2px solid #007bff" }}>
                     <div style={{ fontSize: "14px", color: "#333" }}>
                       Dernière connexion : {editingUser.last_login ? new Date(editingUser.last_login).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " à " + new Date(editingUser.last_login).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Boutons d'action */}
               <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                 <button
                   type="button"
                   onClick={() => {
                     setShowEditUserModal(false);
                     setEditingUser(null);
                   }}
                   style={{ 
                     padding: "10px 20px", 
                     backgroundColor: "#6c757d", 
                     color: "white", 
                     border: "none", 
                     borderRadius: "4px", 
                     cursor: "pointer", 
                     fontSize: "14px"
                   }}
                 >
                   [Annuler]
                 </button>
                 <button
                   type="submit"
                   style={{ 
                     padding: "10px 20px", 
                     backgroundColor: "#28a745", 
                     color: "white", 
                     border: "none", 
                     borderRadius: "4px", 
                     cursor: "pointer", 
                     fontSize: "14px"
                   }}
                 >
                   [Enregistrer Modifications]
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}

       {/* Modal de notifications */}
       {showNotifications && (
        <div 
          onClick={() => setShowNotifications(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "60px 20px 20px 20px",
            zIndex: 1000
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "12px",
              width: "400px",
              maxHeight: "600px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#333" }}>
                Notifications
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#F58220",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "6px 8px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#999",
                    padding: "0",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px"
            }}>
              {notifications.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "#999"
                }}>
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (notif.ticket_id) {
                        void handleNotificationClick(notif);
                      } else {
                        if (!notif.read) {
                          void markNotificationAsRead(notif.id);
                        }
                      }
                    }}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      borderRadius: "8px",
                      background: notif.read ? "#f9f9f9" : "#e3f2fd",
                      border: notif.read ? "1px solid #eee" : "1px solid #90caf9",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "10px"
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#333",
                          lineHeight: "1.5"
                        }}>
                          {formatNotificationMessage(notif.message)}
                        </p>
                        <p style={{
                          margin: "4px 0 0 0",
                          fontSize: "11px",
                          color: "#999"
                        }}>
                          {new Date(notif.created_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "#007bff",
                          flexShrink: 0,
                          marginTop: "4px"
                        }}></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de réouverture avec motif de rejet */}
      {/* Modal de réassignation */}
      {showReassignModal && reassignTicketId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginBottom: "16px", color: "#17a2b8" }}>Réassigner le ticket</h3>
            
            {/* Informations du ticket */}
            {(() => {
              const ticket = allTickets.find(t => t.id === reassignTicketId);
              return ticket ? (
                <div style={{ marginBottom: "20px", padding: "12px", background: "#f8f9fa", borderRadius: "4px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Ticket {formatTicketNumber(ticket.number)}:</strong> {ticket.title}
                  </div>
                  {ticket.technician && (
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      Actuellement assigné à: <strong>{ticket.technician.full_name}</strong>
                    </div>
                  )}
                </div>
              ) : null;
            })()}

            {/* Sélection du technicien */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Sélectionner un technicien <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "8px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="">Sélectionner un technicien</option>
                {(() => {
                  const ticket = allTickets.find(t => t.id === reassignTicketId);
                  const filteredTechs = ticket ? getFilteredTechnicians(ticket.type) : technicians;
                  return filteredTechs.map((tech) => {
                    const workload = allTickets.filter((tk) => 
                      tk.technician_id === tech.id && 
                      (tk.status === "assigne_technicien" || tk.status === "en_cours")
                    ).length;
                    const specialization = tech.specialization ? ` (${tech.specialization})` : "";
                    return (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name}{specialization} - {workload} ticket(s)
                      </option>
                    );
                  });
                })()}
              </select>
            </div>

            {/* Notes optionnelles */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Notes/Instructions pour le technicien (optionnel)
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder=""
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setReassignTicketId(null);
                  setSelectedTechnician("");
                  setAssignmentNotes("");
                }}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => reassignTicketId && handleReassign(reassignTicketId)}
                disabled={loading || !selectedTechnician}
                style={{
                  padding: "10px 20px",
                  background: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading || !selectedTechnician ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading || !selectedTechnician ? 0.6 : 1
                }}
              >
                {loading ? "Réassignation..." : "Confirmer la réassignation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'assignation */}
      {showAssignModal && assignTicketId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginBottom: "16px", color: "#f97316" }}>Assigner le ticket</h3>
            
            {/* Informations du ticket */}
            {(() => {
              const ticket = allTickets.find(t => t.id === assignTicketId);
              return ticket ? (
                <div style={{ marginBottom: "20px", padding: "12px", background: "#f8f9fa", borderRadius: "4px" }}>
                  <div>
                    <strong>Ticket {formatTicketNumber(ticket.number)}:</strong> {ticket.title}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Sélection du technicien */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Sélectionner un technicien <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "8px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="">Sélectionner un technicien</option>
                {(() => {
                  const ticket = allTickets.find(t => t.id === assignTicketId);
                  const filteredTechs = ticket ? getFilteredTechnicians(ticket.type) : technicians;
                  return filteredTechs.map((tech) => {
                    const workload = allTickets.filter((tk) => 
                      tk.technician_id === tech.id && 
                      (tk.status === "assigne_technicien" || tk.status === "en_cours")
                    ).length;
                    const specialization = tech.specialization ? ` (${tech.specialization})` : "";
                    return (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name}{specialization} - {workload} ticket(s)
                      </option>
                    );
                  });
                })()}
              </select>
            </div>

            {/* Définir la priorité (uniquement les priorités actives de la table priorities) */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Définir la priorité
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      activePrioritiesForAssign.find((p) => p.code === assignmentPriority)?.color_hex ??
                      (assignmentPriority === "critique" ? "#E53E3E" :
                       assignmentPriority === "haute" ? "#F59E0B" :
                       assignmentPriority === "moyenne" ? "#0DADDB" : "#6B7280")
                  }}
                />
                <select
                  value={assignmentPriority}
                  onChange={(e) => setAssignmentPriority(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px"
                  }}
                >
                  {activePrioritiesForAssign.length > 0 ? (
                    activePrioritiesForAssign
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((p) => (
                        <option key={p.id} value={p.code}>{p.label}</option>
                      ))
                  ) : (
                    <>
                      <option value="faible">Faible</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute</option>
                      <option value="critique">Critique</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Notes optionnelles */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Notes/Instructions pour le technicien (optionnel)
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder=""
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssignTicketId(null);
                  setSelectedTechnician("");
                  setAssignmentNotes("");
                  setAssignmentPriority(activePrioritiesForAssign.length > 0 ? activePrioritiesForAssign[0].code : "moyenne");
                }}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  background: "white",
                  color: "black",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => assignTicketId && handleAssign(assignTicketId)}
                disabled={loading || !selectedTechnician}
                style={{
                  padding: "10px 20px",
                  background: "#f97316",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading || !selectedTechnician ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading || !selectedTechnician ? 0.6 : 1
                }}
              >
                {loading ? "Assignation..." : "Confirmer l'assignation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelegateModal && delegateTicketId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "24px", borderRadius: "8px", maxWidth: "600px", width: "90%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginBottom: "16px", color: "#f97316" }}>Déléguer à un adjoint DSI</h3>
            {(() => {
              const ticket = allTickets.find(t => t.id === delegateTicketId);
              return ticket ? (
                <div style={{ marginBottom: "20px", padding: "12px", background: "#f8f9fa", borderRadius: "4px" }}>
                  <div>
                    <strong>Ticket {formatTicketNumber(ticket.number)}:</strong> {ticket.title}
                  </div>
                </div>
              ) : null;
            })()}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Sélectionner un adjoint DSI <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                value={selectedAdjoint}
                onChange={(e) => setSelectedAdjoint(e.target.value)}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px" }}
              >
                <option value="">Sélectionner un adjoint DSI</option>
                {allUsers.filter((u: any) => u.role?.name === "Adjoint DSI").map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} {u.agency ? `- ${u.agency}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Notes pour l’adjoint (optionnel)
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Instructions ou contexte pour l’adjoint..."
                rows={3}
                style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowDelegateModal(false);
                  setDelegateTicketId(null);
                  setSelectedAdjoint("");
                  setAssignmentNotes("");
                }}
                disabled={loading}
                style={{ padding: "10px 20px", background: "white", color: "black", border: "1px solid #ddd", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "500" }}
              >
                Annuler
              </button>
              <button
                onClick={() => delegateTicketId && handleDelegate(delegateTicketId)}
                disabled={loading || !selectedAdjoint}
                style={{ padding: "10px 20px", background: "#f97316", color: "white", border: "none", borderRadius: "4px", cursor: loading || !selectedAdjoint ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "500", opacity: loading || !selectedAdjoint ? 0.6 : 1 }}
              >
                {loading ? "Délégation..." : "Confirmer la délégation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation/relance (DSI/Admin créateur du ticket) */}
      {validationTicket && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            maxWidth: "500px",
            width: "90%"
          }}>
            {!showValidationRejectionForm ? (
              <>
                <h3 style={{ marginBottom: "16px" }}>Valider la résolution</h3>
                <p style={{ marginBottom: "16px", color: "#666" }}>
                  Le problème a-t-il été résolu de manière satisfaisante ?
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button
                    onClick={() => handleValidateTicket(validationTicket, true)}
                    disabled={loading}
                    style={{ flex: 1, padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Oui, valider
                  </button>
                  <button
                    onClick={() => {
                      setShowValidationRejectionForm(true);
                      setValidationRejectionReason("");
                    }}
                    disabled={loading}
                    style={{ flex: 1, padding: "10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Non, relancer
                  </button>
                  <button
                    onClick={() => {
                      setValidationTicket(null);
                      setShowValidationRejectionForm(false);
                      setValidationRejectionReason("");
                    }}
                    style={{ flex: 1, padding: "10px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", color: "#333" }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: "16px", color: "#dc3545" }}>Relancer la résolution</h3>
                <p style={{ marginBottom: "16px", color: "#666" }}>
                  Veuillez indiquer le motif de relance. Cette information sera transmise au technicien pour l'aider à mieux résoudre votre problème.
                </p>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                    Motif de relance <span style={{ color: "#dc3545" }}>*</span>
                  </label>
                  <textarea
                    value={validationRejectionReason}
                    onChange={(e) => setValidationRejectionReason(e.target.value)}
                    placeholder=""
                    rows={4}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button
                    onClick={() => handleValidateTicket(validationTicket, false)}
                    disabled={loading || !validationRejectionReason.trim()}
                    style={{
                      flex: 1,
                      padding: "10px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: validationRejectionReason.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Confirmer la relance
                  </button>
                  <button
                    onClick={() => {
                      setShowValidationRejectionForm(false);
                      setValidationRejectionReason("");
                    }}
                    disabled={loading}
                    style={{ flex: 1, padding: "10px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", color: "#000" }}
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      setValidationTicket(null);
                      setShowValidationRejectionForm(false);
                      setValidationRejectionReason("");
                    }}
                    style={{ flex: 1, padding: "10px", background: "#f5f5f5", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", color: "#000" }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showReopenModal && reopenTicketId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "24px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3 style={{ marginBottom: "16px", color: "#dc3545" }}>Réouvrir le ticket</h3>
            
            {/* Affichage du motif de rejet */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#333" }}>
                Motif de rejet par l'utilisateur :
              </label>
              <div style={{
                padding: "12px",
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "4px",
                color: "#856404",
                fontSize: "14px",
                lineHeight: "1.5",
                minHeight: "60px",
                whiteSpace: "pre-wrap"
              }}>
                {loadingRejectionReason ? (
                  <div style={{ color: "#856404", fontStyle: "italic" }}>Chargement du motif...</div>
                ) : rejectionReason ? (
                  rejectionReason
                ) : (
                  "Aucun motif disponible"
                )}
              </div>
            </div>

            {/* Sélection du technicien */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Sélectionner un technicien <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "8px", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
              >
                <option value="">Sélectionner un technicien</option>
                {(() => {
                  const ticket = allTickets.find(t => t.id === reopenTicketId);
                  const filteredTechs = ticket ? getFilteredTechnicians(ticket.type) : technicians;
                  return filteredTechs.map((tech) => {
                    const workload = allTickets.filter((tk) => 
                      tk.technician_id === tech.id && 
                      (tk.status === "assigne_technicien" || tk.status === "en_cours")
                    ).length;
                    const specialization = tech.specialization ? ` (${tech.specialization})` : "";
                    return (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name}{specialization} - {workload} ticket(s)
                      </option>
                    );
                  });
                })()}
              </select>
            </div>

            {/* Notes optionnelles */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#333" }}>
                Notes/Instructions pour le technicien (optionnel)
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Exemple: Prendre en compte le motif de rejet ci-dessus..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Boutons d'action */}
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button
                onClick={() => reopenTicketId && handleReopen(reopenTicketId)}
                disabled={loading || !selectedTechnician}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  backgroundColor: selectedTechnician ? "#17a2b8" : "#ccc", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px", 
                  cursor: selectedTechnician ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                {loading ? "Réouverture..." : "Confirmer la réouverture"}
              </button>
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setReopenTicketId(null);
                  setRejectionReason("");
                  setSelectedTechnician("");
                  setAssignmentNotes("");
                }}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  background: "#f5f5f5", 
                  border: "1px solid #ddd", 
                  borderRadius: "4px", 
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interface split-view pour les tickets avec notifications */}
      {showNotificationsTicketsView && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          zIndex: 1001
        }}>
          <div style={{
            display: "flex",
            width: "100%",
            height: "100vh",
            background: "white",
            overflow: "hidden"
          }}>
            {/* Panneau gauche - Liste des tickets avec notifications */}
            <div style={{
              width: "400px",
              borderRight: "1px solid #e0e0e0",
              display: "flex",
              flexDirection: "column",
              background: "#f8f9fa",
              height: "100%",
              overflow: "hidden",
              flexShrink: 0
            }}>
              <div style={{
                padding: "28px 20px 20px 30px",
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
                borderRadius: "8px 0 0 0"
              }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#333" }}>
                  Tickets avec notifications
                </h3>
                <button
                  onClick={() => {
                    setShowNotificationsTicketsView(false);
                    setSelectedNotificationTicket(null);
                    setSelectedNotificationTicketDetails(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#999",
                    padding: "0",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 10px 10px 0"
              }}>
                {notificationsTickets.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#999"
                  }}>
                    Aucun ticket avec notification
                  </div>
                ) : (
                  notificationsTickets.map((ticket) => {
                    const ticketNotifications = notifications.filter(n => n.ticket_id === ticket.id);
                    const unreadCount = ticketNotifications.filter(n => !n.read).length;
                    const isSelected = selectedNotificationTicket === ticket.id;
                    
                    return (
                      <div
                        key={ticket.id}
                        onClick={async () => {
                          setSelectedNotificationTicket(ticket.id);
                          try {
                            const res = await fetch(`http://localhost:8000/tickets/${ticket.id}`, {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            });
                            if (res.ok) {
                              const data = await res.json();
                              setSelectedNotificationTicketDetails(data);
                              // Charger l'historique
                              try {
                                const historyRes = await fetch(`http://localhost:8000/tickets/${ticket.id}/history`, {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                });
                                if (historyRes.ok) {
                                  const historyData = await historyRes.json();
                                  setSelectedNotificationTicketHistory(Array.isArray(historyData) ? historyData : []);
                                }
                              } catch (err) {
                                console.error("Erreur chargement historique:", err);
                              }
                              await markTicketNotificationsAsRead(ticket.id);
                            }
                          } catch (err) {
                            console.error("Erreur chargement détails:", err);
                          }
                        }}
                        style={{
                          padding: "12px 12px 12px 30px",
                          marginBottom: "8px",
                          borderRadius: "8px",
                          background: isSelected ? "#e3f2fd" : "white",
                          border: isSelected ? "2px solid #2196f3" : "1px solid #e0e0e0",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px"
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: 0,
                              fontSize: "14px",
                              fontWeight: isSelected ? "600" : "500",
                              color: "#333",
                              lineHeight: "1.5"
                            }}>
                              Ticket {formatTicketNumber(ticket.number)}
                            </p>
                            <p style={{
                              margin: "4px 0 0 0",
                              fontSize: "13px",
                              color: "#666",
                              lineHeight: "1.4",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical"
                            }}>
                              {ticket.title}
                            </p>
                            <p style={{
                              margin: "4px 0 0 0",
                              fontSize: "11px",
                              color: "#999"
                            }}>
                              {ticketNotifications.length} notification{ticketNotifications.length > 1 ? "s" : ""}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <div style={{
                              minWidth: "20px",
                              height: "20px",
                              borderRadius: "10px",
                              background: "#f44336",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "0 6px"
                            }}>
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Panneau droit - Détails du ticket sélectionné */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "white",
              borderRadius: "0 8px 8px 0"
            }}>
              {selectedNotificationTicketDetails ? (
                <>
                  <div style={{
                    padding: "28px 20px 20px 30px",
                    borderBottom: "1px solid #e0e0e0",
                    background: "white",
                    borderRadius: "0 8px 0 0"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#333" }}>Détails du ticket {formatTicketNumber(selectedNotificationTicketDetails.number)}</h3>
                      {selectedNotificationTicketDetails.status === "rejete" && (
                        <span style={{
                          padding: "6px 10px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "1px solid #fecaca"
                        }}>
                          Relancé
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px 20px 20px 30px"
                  }}>
                    <div style={{ marginBottom: "16px" }}>
                      <strong>Titre :</strong>
                      <p style={{ marginTop: "4px", padding: "8px", background: "#f8f9fa", borderRadius: "4px" }}>
                        {selectedNotificationTicketDetails.title}
                      </p>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <strong>Description :</strong>
                      <p style={{ marginTop: "4px", padding: "8px", background: "#f8f9fa", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                        {selectedNotificationTicketDetails.description || ""}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                      <div>
                        <strong>Priorité :</strong>
                        <span style={{
                          marginLeft: "8px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          background: selectedNotificationTicketDetails.priority === "critique" ? "rgba(229, 62, 62, 0.1)" : selectedNotificationTicketDetails.priority === "haute" ? "rgba(245, 158, 11, 0.1)" : selectedNotificationTicketDetails.priority === "moyenne" ? "rgba(13, 173, 219, 0.1)" : selectedNotificationTicketDetails.priority === "faible" ? "#E5E7EB" : "#9e9e9e",
                          color: selectedNotificationTicketDetails.priority === "critique" ? "#E53E3E" : selectedNotificationTicketDetails.priority === "haute" ? "#F59E0B" : selectedNotificationTicketDetails.priority === "moyenne" ? "#0DADDB" : selectedNotificationTicketDetails.priority === "faible" ? "#6B7280" : "white"
                        }}>
                          {getPriorityLabel(selectedNotificationTicketDetails.priority ?? "non_definie")}
                        </span>
                      </div>
                      <div>
                        <strong>Type :</strong>
                        <span style={{ marginLeft: "8px", padding: "4px 8px", borderRadius: "4px" }}>
                          {selectedNotificationTicketDetails.type === "materiel" ? "Matériel" : selectedNotificationTicketDetails.type === "applicatif" ? "Applicatif" : selectedNotificationTicketDetails.type || "—"}
                        </span>
                      </div>
                      <div>
                        <strong>Catégorie :</strong>
                        <span style={{ marginLeft: "8px" }}>
                          {selectedNotificationTicketDetails.category || "Non spécifiée"}
                        </span>
                      </div>
                      <div>
                        <strong>Statut :</strong>
                        <span style={{
                          marginLeft: "8px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          background: selectedNotificationTicketDetails.status === "en_attente_analyse" ? "rgba(13, 173, 219, 0.1)" : selectedNotificationTicketDetails.status === "assigne_technicien" ? "rgba(255, 122, 27, 0.1)" : selectedNotificationTicketDetails.status === "en_cours" ? "rgba(15, 31, 61, 0.1)" : selectedNotificationTicketDetails.status === "retraite" ? "#EDE7F6" : selectedNotificationTicketDetails.status === "resolu" ? "rgba(47, 158, 68, 0.1)" : selectedNotificationTicketDetails.status === "rejete" ? "#fee2e2" : selectedNotificationTicketDetails.status === "cloture" ? "#E5E7EB" : "#f3f4f6",
                          color: selectedNotificationTicketDetails.status === "en_attente_analyse" ? "#0DADDB" : selectedNotificationTicketDetails.status === "assigne_technicien" ? "#FF7A1B" : selectedNotificationTicketDetails.status === "en_cours" ? "#0F1F3D" : selectedNotificationTicketDetails.status === "retraite" ? "#4A148C" : selectedNotificationTicketDetails.status === "resolu" ? "#2F9E44" : selectedNotificationTicketDetails.status === "rejete" ? "#991b1b" : selectedNotificationTicketDetails.status === "cloture" ? "#374151" : "#6b7280"
                        }}>
                          {getStatusLabel(selectedNotificationTicketDetails.status)}
                        </span>
                      </div>
                      {selectedNotificationTicketDetails.creator && (
                        <div>
                          <strong>Créateur :</strong>
                          <span style={{ marginLeft: "8px" }}>
                            {selectedNotificationTicketDetails.creator.full_name}
                          </span>
                        </div>
                      )}
                      {selectedNotificationTicketDetails.technician && (
                        <div>
                          <strong>Technicien assigné :</strong>
                          <span style={{ marginLeft: "8px" }}>
                            {selectedNotificationTicketDetails.technician.full_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "24px", marginBottom: "16px" }}>
                      <strong>Historique :</strong>
                      <div style={{ marginTop: "8px" }}>
                        {(() => {
                          const displayHistory = getDisplayHistory(selectedNotificationTicketDetails, selectedNotificationTicketHistory as TicketHistory[]);
                          if (displayHistory.length === 0) {
                            return <p style={{ color: "#999", fontStyle: "italic" }}>Aucun historique</p>;
                          }
                          return displayHistory.map((h, index) => {
                            const { Icon, iconBg, iconBorder, iconColor } = getHistoryVisuals(h);
                            const isLast = index === displayHistory.length - 1;
                            const isCreation = h.new_status === "creation";

                            return (
                              <div key={h.id} style={{ display: "flex", gap: "12px" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "60px" }}>
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "9999px",
                                      border: `2px solid ${iconBorder}`,
                                      backgroundColor: iconBg,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: iconColor,
                                      boxShadow: "0 0 0 4px rgba(148, 163, 184, 0.15)",
                                    }}
                                  >
                                    <Icon size={18} />
                                  </div>
                                  {!isLast && (
                                    <div
                                      style={{
                                        flexGrow: 1,
                                        width: "2px",
                                        backgroundColor: "#E5E7EB",
                                        marginTop: "4px",
                                        marginBottom: "-4px",
                                      }}
                                    />
                                  )}
                                </div>
                                <div
                                  style={{
                                    padding: "8px 12px",
                                    marginBottom: "12px",
                                    background: "#F9FAFB",
                                    borderRadius: "8px",
                                    border: "1px solid #E5E7EB",
                                    flex: 1,
                                  }}
                                >
                                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                                    {getHistoryTitle(h, selectedNotificationTicketDetails)}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                                    {formatHistoryDate(h.changed_at)}
                                  </div>
                                  {!isCreation && (
                                    <>
                                      {h.user && (
                                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#6B7280" }}>
                                          Par: {h.user.full_name}
                                        </div>
                                      )}
                                      {h.reason && (
                                        <div style={{ marginTop: "4px", fontSize: "13px", color: "#4B5563" }}>
                                          Résumé de la résolution: {h.reason}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999"
                }}>
                  Sélectionnez un ticket pour voir les détails
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu d'actions pour la section Dashboard (rendu au niveau racine pour éviter les problèmes d'overflow) */}
      {activeSection === "dashboard" && openActionsMenuFor !== null && actionsMenuPosition !== null && (() => {
        const ticket = allTickets.find(t => t.id === openActionsMenuFor);
        if (!ticket) return null;
        
        return (
          <>
            <div
              onClick={() => { setOpenActionsMenuFor(null); setActionsMenuPosition(null); }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9998,
                background: "transparent",
                cursor: "default"
              }}
            />
            <div
            data-menu-id={ticket.id}
            style={{
              position: "fixed",
              top: actionsMenuPosition?.top || 0,
              left: actionsMenuPosition?.left || 0,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
              minWidth: 180,
              zIndex: 9999,
              maxHeight: 280,
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.status === "en_attente_analyse" && (
              <>
                <button
                  onClick={() => { loadTicketDetails(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    textAlign: "left", 
                    cursor: "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Voir détails
                </button>
                <button
                  onClick={() => { handleAssignClick(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "left", 
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap",
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Assigner
                </button>
                {userRole === "DSI" && (
                  <button
                    onClick={() => { handleDelegateClick(ticket.id); setOpenActionsMenuFor(null); }}
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      background: "transparent", 
                      border: "none", 
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "left", 
                      cursor: loading ? "not-allowed" : "pointer",
                      color: "#111827",
                      fontSize: "14px",
                      display: "block",
                      whiteSpace: "nowrap",
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Déléguer à un adjoint
                  </button>
                )}
                {canEscalate() && (
                  <button
                    onClick={() => { handleEscalate(ticket.id); setOpenActionsMenuFor(null); }}
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      background: "transparent", 
                      border: "none", 
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "left", 
                      cursor: loading ? "not-allowed" : "pointer",
                      color: "#111827",
                      fontSize: "14px",
                      display: "block",
                      whiteSpace: "nowrap",
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Escalader
                  </button>
                )}
              </>
            )}
            {(ticket.status === "assigne_technicien" || ticket.status === "en_cours") && (
              <>
                <button
                  onClick={() => { loadTicketDetails(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    textAlign: "left", 
                    cursor: "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Voir détails
                </button>
                <button
                  onClick={() => { handleReassignClick(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "left", 
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap",
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Réassigner
                </button>
                {canEscalate() && (
                  <button
                    onClick={() => { handleEscalate(ticket.id); setOpenActionsMenuFor(null); }}
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      background: "transparent", 
                      border: "none", 
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "left", 
                      cursor: loading ? "not-allowed" : "pointer",
                      color: "#111827",
                      fontSize: "14px",
                      display: "block",
                      whiteSpace: "nowrap",
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Escalader
                  </button>
                )}
              </>
            )}
            {ticket.status === "resolu" && (
              <button
                onClick={() => { handleClose(ticket.id); setOpenActionsMenuFor(null); }}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: "transparent", 
                  border: "none", 
                  textAlign: "left", 
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#111827",
                  fontSize: "14px",
                  display: "block",
                  whiteSpace: "nowrap",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Clôturer
              </button>
            )}
            {ticket.status === "rejete" && (
              <button
                onClick={() => { handleReopenClick(ticket.id); setOpenActionsMenuFor(null); }}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: (userRole === "DSI" || userRole === "Admin") ? "hsl(25, 95%, 53%)" : "transparent", 
                  border: "none", 
                  textAlign: "left", 
                  cursor: loading ? "not-allowed" : "pointer",
                  color: (userRole === "DSI" || userRole === "Admin") ? "white" : "#111827",
                  fontSize: "14px",
                  display: "block",
                  whiteSpace: "nowrap",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  if (userRole === "DSI" || userRole === "Admin") {
                    e.currentTarget.style.backgroundColor = "hsl(25, 95%, 48%)";
                  } else {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }
                }}
                onMouseLeave={(e) => {
                  if (userRole === "DSI" || userRole === "Admin") {
                    e.currentTarget.style.backgroundColor = "hsl(25, 95%, 53%)";
                  } else {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                Rouvrir
              </button>
            )}
            {ticket.status === "retraite" && (
              <button
                onClick={() => { loadTicketDetails(ticket.id); setOpenActionsMenuFor(null); }}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: "transparent", 
                  border: "none", 
                  textAlign: "left", 
                  cursor: "pointer",
                  color: "#111827",
                  fontSize: "14px",
                  display: "block",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Voir détails
              </button>
            )}
          </div>
          </>
        );
      })()}

      {/* Menu d'actions pour la section Tickets (rendu au niveau racine pour éviter les problèmes d'overflow) */}
      {activeSection === "tickets" && openActionsMenuFor !== null && actionsMenuPosition !== null && (() => {
        const ticket = allTickets.find(t => t.id === openActionsMenuFor);
        if (!ticket) return null;
        
        return (
          <>
            <div
              onClick={() => { setOpenActionsMenuFor(null); setActionsMenuPosition(null); }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9998,
                background: "transparent",
                cursor: "default"
              }}
            />
            <div
            data-menu-id={ticket.id}
            style={{
              position: "fixed",
              top: actionsMenuPosition?.top || 0,
              left: actionsMenuPosition?.left || 0,
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
              minWidth: 180,
              zIndex: 9999,
              maxHeight: 280,
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.status === "en_attente_analyse" && (
              <>
                <button
                  onClick={() => { loadTicketDetails(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    textAlign: "left", 
                    cursor: "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Voir détails
                </button>
                <button
                  onClick={() => { handleAssignClick(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "left", 
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap",
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Assigner
                </button>
                {userRole === "DSI" && (
                  <button
                    onClick={() => { handleDelegateClick(ticket.id); setOpenActionsMenuFor(null); }}
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      background: "transparent", 
                      border: "none", 
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "left", 
                      cursor: loading ? "not-allowed" : "pointer",
                      color: "#111827",
                      fontSize: "14px",
                      display: "block",
                      whiteSpace: "nowrap",
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Déléguer à un adjoint
                  </button>
                )}
                {canEscalate() && (
                  <button
                    onClick={() => { handleEscalate(ticket.id); setOpenActionsMenuFor(null); }}
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      background: "transparent", 
                      border: "none", 
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "left", 
                      cursor: loading ? "not-allowed" : "pointer",
                      color: "#111827",
                      fontSize: "14px",
                      display: "block",
                      whiteSpace: "nowrap",
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Escalader
                  </button>
                )}
              </>
            )}
            {(ticket.status === "assigne_technicien" || ticket.status === "en_cours") && (
              <>
                <button
                  onClick={() => { loadTicketDetails(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    textAlign: "left", 
                    cursor: "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Voir détails
                </button>
                <button
                  onClick={() => { handleReassignClick(ticket.id); setOpenActionsMenuFor(null); }}
                  disabled={loading}
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    background: "transparent", 
                    border: "none", 
                    borderTop: "1px solid #e5e7eb",
                    textAlign: "left", 
                    cursor: loading ? "not-allowed" : "pointer",
                    color: "#111827",
                    fontSize: "14px",
                    display: "block",
                    whiteSpace: "nowrap",
                    opacity: loading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Réassigner
                </button>
                {canEscalate() && (
                  <button
                    onClick={() => { handleEscalate(ticket.id); setOpenActionsMenuFor(null); }}
                    disabled={loading}
                    style={{ 
                      width: "100%", 
                      padding: "10px 12px", 
                      background: "transparent", 
                      border: "none", 
                      borderTop: "1px solid #e5e7eb",
                      textAlign: "left", 
                      cursor: loading ? "not-allowed" : "pointer",
                      color: "#111827",
                      fontSize: "14px",
                      display: "block",
                      whiteSpace: "nowrap",
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Escalader
                  </button>
                )}
              </>
            )}
            {ticket.status === "resolu" && (
              <button
                onClick={() => { handleClose(ticket.id); setOpenActionsMenuFor(null); }}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: "transparent", 
                  border: "none", 
                  textAlign: "left", 
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#111827",
                  fontSize: "14px",
                  display: "block",
                  whiteSpace: "nowrap",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Clôturer
              </button>
            )}
            {ticket.status === "rejete" && (
              <button
                onClick={() => { handleReopenClick(ticket.id); setOpenActionsMenuFor(null); }}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: "transparent", 
                  border: "none", 
                  textAlign: "left", 
                  cursor: loading ? "not-allowed" : "pointer",
                  color: "#111827",
                  fontSize: "14px",
                  display: "block",
                  whiteSpace: "nowrap",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Réouvrir
              </button>
            )}
            {ticket.status === "retraite" && (
              <button
                onClick={() => { loadTicketDetails(ticket.id); setOpenActionsMenuFor(null); }}
                disabled={loading}
                style={{ 
                  width: "100%", 
                  padding: "10px 12px", 
                  background: "transparent", 
                  border: "none", 
                  textAlign: "left", 
                  cursor: "pointer",
                  color: "#111827",
                  fontSize: "14px",
                  display: "block",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Voir détails
              </button>
            )}
          </div>
          </>
        );
      })()}

      {/* Modal de création de ticket (DSI) */}
      {showCreateTicketModal && (
        <div
          onClick={() => {
            setShowCreateTicketModal(false);
            setNewTicketTitle("");
            setNewTicketDescription("");
            setNewTicketType("materiel");
            setNewTicketCategory("");
            setNewTicketPriority("");
            setCreateTicketError(null);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: "0", fontSize: "22px", fontWeight: "600", color: "#333" }}>
                Créer un nouveau ticket
              </h2>
              <button
                onClick={() => {
                  setShowCreateTicketModal(false);
                  setNewTicketTitle("");
                  setNewTicketDescription("");
                  setNewTicketType("materiel");
                  setNewTicketCategory("");
                  setNewTicketPriority("");
                  setCreateTicketError(null);
                }}
                style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999" }}
              >
                ×
              </button>
            </div>
            
            {createTicketError && (
              <div style={{
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffebee",
                color: "#c62828",
                border: "1px solid #ef5350"
              }}>
                <strong>Erreur :</strong> {createTicketError}
              </div>
            )}
            
            <form onSubmit={async (e) => { await handleCreateTicket(e); }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Titre</label>
                <input
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  required
                  disabled={loading}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Description</label>
                <textarea
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", resize: "vertical" }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Type</label>
                <select
                  value={newTicketType}
                  onChange={(e) => {
                    setNewTicketType(e.target.value);
                    setNewTicketCategory("");
                  }}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Catégorie</label>
                <select
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="">Sélectionner une catégorie...</option>
                  {categoriesList
                    .filter((c) => c.type_code === newTicketType)
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>Définir la priorité</label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
                >
                  <option value="">Sélectionner une priorité...</option>
                  {activePrioritiesForAssign
                    .slice()
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.label}
                      </option>
                    ))}
                </select>
              </div>
              
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button 
                  type="submit" 
                  disabled={loading || !newTicketTitle.trim() || !newTicketDescription.trim()} 
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    backgroundColor: "#FB7E06",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "opacity 0.2s ease",
                    opacity: loading || !newTicketTitle.trim() || !newTicketDescription.trim() ? 0.5 : 1
                  }}
                >
                  <Send size={16} style={{ color: "white" }} />
                  {loading ? "Création en cours..." : "Soumettre le ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTicketModal(false);
                    setNewTicketTitle("");
                    setNewTicketDescription("");
                    setNewTicketType("materiel");
                    setNewTicketCategory("");
                    setNewTicketPriority("");
                    setCreateTicketError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    background: "#f5f5f5",
                    color: "#333",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default DSIDashboard;
