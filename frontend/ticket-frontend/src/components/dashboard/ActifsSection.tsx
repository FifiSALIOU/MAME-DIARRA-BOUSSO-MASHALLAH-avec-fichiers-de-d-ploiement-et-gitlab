/**
 * Section Actifs du dashboard DSI/Admin.
 * Gestion de l'inventaire des équipements informatiques.
 */

import {
  Download,
  Plus,
  Monitor,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Package,
  Archive,
  Banknote,
  Clock,
  Search,
  QrCode,
  MapPin,
  User,
  Calendar,
  Eye,
  Edit,
  HardDrive,
  Laptop,
  Printer,
  Monitor as MonitorIconAsset,
  Keyboard,
  Mouse,
  Phone,
  Tablet,
  Network,
} from "lucide-react";
import type { Asset, DepartmentConfig } from "../../types";
import { assetStatusLabels, assetStatusColors, assetTypeLabels } from "../../utils/assetConstants";
import { DSIOrangeSelect } from "../ui/DSIOrangeSelect.tsx";

export type ActifsSectionProps = {
  totalAssets: number;
  inServiceCount: number;
  inMaintenanceCount: number;
  inPanneCount: number;
  inStockCount: number;
  reformedCount: number;
  totalValue: number;
  warrantiesExpiringCount: number;
  assetSearchQuery: string;
  setAssetSearchQuery: (v: string) => void;
  assetStatusFilter: string;
  setAssetStatusFilter: (v: string) => void;
  assetTypeFilter: string;
  setAssetTypeFilter: (v: string) => void;
  assetDepartmentFilter: string;
  setAssetDepartmentFilter: (v: string) => void;
  assetDepartments: DepartmentConfig[];
  filteredAssets: Asset[];
  assetError: string | null;
  isLoadingAssets: boolean;
  canEditAssets: boolean;
  onOpenCreateModal: () => void;
  onOpenEditAsset: (asset: Asset) => void;
};

export function ActifsSection({
  totalAssets,
  inServiceCount,
  inMaintenanceCount,
  inPanneCount,
  inStockCount,
  reformedCount,
  totalValue,
  warrantiesExpiringCount,
  assetSearchQuery,
  setAssetSearchQuery,
  assetStatusFilter,
  setAssetStatusFilter,
  assetTypeFilter,
  setAssetTypeFilter,
  assetDepartmentFilter,
  setAssetDepartmentFilter,
  assetDepartments,
  filteredAssets,
  assetError,
  isLoadingAssets,
  canEditAssets,
  onOpenCreateModal,
  onOpenEditAsset,
}: ActifsSectionProps) {
  return (
    <div style={{ padding: "24px 24px 24px 0" }}>
      <div style={{ marginTop: "40px", marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "24px",
            gap: "12px",
          }}
        >
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              backgroundColor: "#ffffff",
              color: "#111827",
              border: "1px solid #9ca3af",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Download size={18} />
            Exporter
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              backgroundColor: "hsl(226, 34%, 15%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={18} />
            Nouvel actif
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(220, 15%, 93%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Monitor size={18} color="#4b5563" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{totalAssets}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Total Actifs</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(145, 60%, 90%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={18} color="#16a34a" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{inServiceCount}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>En service</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(45, 80%, 90%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wrench size={18} color="#f97316" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{inMaintenanceCount}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>En maintenance</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(0, 80%, 93%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{inPanneCount}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>En panne</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(230, 60%, 93%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={18} color="#2563eb" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{inStockCount}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>En stock</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(220, 15%, 93%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Archive size={18} color="#4b5563" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{reformedCount}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Réformés</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(145, 60%, 90%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Banknote size={18} color="#16a34a" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>
                {`${totalValue.toLocaleString("fr-FR")} FCFA`}
              </div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Valeur totale</div>
            </div>
          </div>
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              border: "1px solid rgba(229,231,235,0.8)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "hsl(25, 80%, 92%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={18} color="#f97316" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}>{warrantiesExpiringCount}</div>
              <div style={{ fontSize: "14px", color: "#6b7280", fontWeight: 500 }}>Garanties expirant</div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>dans 30 jours</div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              flex: "1 1 260px",
              minWidth: "220px",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={18}
              color="#6b7280"
              style={{
                position: "absolute",
                left: "14px",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <input
              type="text"
              placeholder="Rechercher par nom, n° série, marque..."
              value={assetSearchQuery}
              onChange={(e) => setAssetSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 40px",
                borderRadius: "999px",
                border: "1px solid rgba(209,213,219,0.8)",
                backgroundColor: "#f9fafb",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
          <div style={{ flex: "0 0 190px", minWidth: "170px" }}>
            <DSIOrangeSelect
              value={assetStatusFilter}
              onChange={setAssetStatusFilter}
              options={[
                { value: "all", label: "Tous les statuts" },
                { value: "in_service", label: "En service" },
                { value: "en_maintenance", label: "En maintenance" },
                { value: "en_panne", label: "En panne" },
                { value: "reformes", label: "Réformés" },
                { value: "en_stock", label: "En stock" },
              ]}
            />
          </div>
          <div style={{ flex: "0 0 190px", minWidth: "170px" }}>
            <DSIOrangeSelect
              value={assetTypeFilter}
              onChange={setAssetTypeFilter}
              options={[
                { value: "all", label: "Tous les types" },
                { value: "desktop", label: "Ordinateur fixe" },
                { value: "laptop", label: "Ordinateur portable" },
                { value: "printer", label: "Imprimante" },
                { value: "monitor", label: "Écran" },
                { value: "mobile", label: "Mobile" },
                { value: "tablet", label: "Tablette" },
                { value: "phone", label: "Téléphone" },
                { value: "network", label: "Équipement réseau" },
              ]}
            />
          </div>
          <div style={{ flex: "0 0 210px", minWidth: "180px" }}>
            <DSIOrangeSelect
              value={assetDepartmentFilter}
              onChange={setAssetDepartmentFilter}
              options={[
                { value: "all", label: "Tous les départements" },
                ...assetDepartments.map((d) => ({ value: d.name, label: d.name })),
              ]}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            columnGap: "24px",
            rowGap: "24px",
            alignItems: "stretch",
          }}
        >
          {assetError && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "12px 16px",
                borderRadius: "12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "14px",
              }}
            >
              {assetError}
            </div>
          )}
          {isLoadingAssets && !filteredAssets.length ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "32px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Chargement des actifs...
            </div>
          ) : null}
          {!isLoadingAssets && filteredAssets.length === 0 && !assetError && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "32px",
                borderRadius: "16px",
                border: "1px dashed #e5e7eb",
                backgroundColor: "#f9fafb",
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
              }}
            >
              Aucun actif trouvé pour les filtres actuels.
            </div>
          )}
          {filteredAssets.map((asset) => {
            const statusConfig = assetStatusColors[asset.statut] || assetStatusColors.en_stock;
            const AssetIcon =
              asset.type === "desktop"
                ? HardDrive
                : asset.type === "laptop"
                  ? Laptop
                  : asset.type === "printer"
                    ? Printer
                    : asset.type === "monitor"
                      ? MonitorIconAsset
                      : asset.type === "keyboard"
                        ? Keyboard
                        : asset.type === "mouse"
                          ? Mouse
                          : asset.type === "phone"
                            ? Phone
                            : asset.type === "tablet"
                              ? Tablet
                              : asset.type === "network"
                                ? Network
                                : HardDrive;
            const isWarrantyExpiring = (() => {
              if (!asset.date_de_fin_garantie) return false;
              const end = new Date(asset.date_de_fin_garantie);
              const now = new Date();
              const diffDays = Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays <= 30;
            })();
            const formattedWarranty = asset.date_de_fin_garantie
              ? new Date(asset.date_de_fin_garantie).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={asset.id}
                className="asset-card group"
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "20px 24px",
                  border: "1px solid #E5EAF1",
                  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  cursor: "default",
                  transition: "all 0.3s ease",
                  minHeight: "300px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 14px 35px rgba(15,23,42,0.12)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(37,99,235,0.3)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(15,23,42,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(229,231,235,0.9)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    paddingBottom: "6px",
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
                        padding: "10px",
                        borderRadius: "14px",
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AssetIcon size={20} color="#4b5563" />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        minWidth: 0,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {asset.nom}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {asset.marque} {asset.modele}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: `1px solid ${statusConfig.badgeBorder}`,
                      backgroundColor: statusConfig.badgeBg,
                      fontSize: "11px",
                      fontWeight: 500,
                      color: statusConfig.badgeText,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      marginLeft: "auto",
                      marginRight: "4px",
                      marginTop: "2px",
                      textAlign: "center",
                    }}
                  >
                    {assetStatusLabels[asset.statut] || asset.statut}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 10px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <QrCode size={16} color="#9ca3af" />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {asset.numero_de_serie}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                    <span
                      style={{
                        borderRadius: "999px",
                        border: "1px solid #e5e7eb",
                        padding: "2px 8px",
                        fontSize: "11px",
                        color: "#4b5563",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      {assetTypeLabels[asset.type] || asset.type || "Type inconnu"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={16} color="#9ca3af" />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {asset.localisation}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                    <User
                      size={16}
                      color={asset.assigned_to_name ? "#9ca3af" : "rgba(156,163,175,0.7)"}
                    />
                    <span
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontStyle: asset.assigned_to_name ? "normal" : "italic",
                        color: asset.assigned_to_name ? "#6b7280" : "rgba(156,163,175,0.8)",
                      }}
                    >
                      {asset.assigned_to_name || "Non assigné"}
                    </span>
                  </div>
                </div>

                {formattedWarranty && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "7px 10px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor:
                        isWarrantyExpiring ||
                        asset.statut === "en_panne" ||
                        asset.statut === "in_service" ||
                        asset.statut === "en_maintenance" ||
                        asset.statut === "reformes"
                          ? "rgba(249, 115, 22, 0.1)"
                          : "#f3f4f6",
                      color:
                        isWarrantyExpiring ||
                        asset.statut === "en_panne" ||
                        asset.statut === "in_service" ||
                        asset.statut === "en_maintenance" ||
                        asset.statut === "reformes"
                          ? "#ea580c"
                          : "#4b5563",
                      fontSize: "12px",
                    }}
                  >
                    <Calendar
                      size={16}
                      color={
                        isWarrantyExpiring ||
                        asset.statut === "en_panne" ||
                        asset.statut === "in_service" ||
                        asset.statut === "en_maintenance" ||
                        asset.statut === "reformes"
                          ? "#ea580c"
                          : "#6b7280"
                      }
                    />
                    <span>Garantie jusqu&apos;au {formattedWarranty}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", paddingTop: "16px" }}>
                  <button
                    type="button"
                    style={{
                      flex: canEditAssets ? 1 : undefined,
                      width: canEditAssets ? undefined : "100%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "7px 10px",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#1d4ed8",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      alert(`Détails de l'actif: ${asset.nom} (${asset.numero_de_serie})`);
                    }}
                  >
                    <Eye size={16} />
                    <span>Détails</span>
                  </button>
                  {canEditAssets && (
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "7px 10px",
                        borderRadius: "12px",
                        border: "none",
                        backgroundColor: "#111827",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#ffffff",
                        cursor: "pointer",
                      }}
                      onClick={() => onOpenEditAsset(asset)}
                    >
                      <Edit size={16} />
                      <span>Modifier</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
