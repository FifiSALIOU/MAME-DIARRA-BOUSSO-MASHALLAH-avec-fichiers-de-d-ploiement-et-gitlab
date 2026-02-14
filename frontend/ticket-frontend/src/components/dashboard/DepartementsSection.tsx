import type { DepartmentConfig } from "../../types/index.ts";

export type DepartementsSectionProps = {
  assetDepartments: DepartmentConfig[];
  showDepartmentModal: boolean;
  editingDepartment: DepartmentConfig | null;
  departmentName: string;
  openAddDepartmentModal: () => void;
  openEditDepartmentModal: (dept: DepartmentConfig) => void;
  handleToggleDepartment: (departmentId: number) => void;
  setShowDepartmentModal: (v: boolean) => void;
  setEditingDepartment: (v: DepartmentConfig | null) => void;
  setDepartmentName: (v: string) => void;
  handleCreateDepartment: () => void;
  handleUpdateDepartment: () => void;
};

export function DepartementsSection({
  assetDepartments,
  showDepartmentModal,
  editingDepartment,
  departmentName,
  openAddDepartmentModal,
  openEditDepartmentModal,
  handleToggleDepartment,
  setShowDepartmentModal,
  setEditingDepartment,
  setDepartmentName,
  handleCreateDepartment,
  handleUpdateDepartment,
}: DepartementsSectionProps) {
  return (
    <div style={{ padding: "24px 24px 24px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div />
        <button
          onClick={openAddDepartmentModal}
          style={{
            padding: "10px 20px",
            background: "hsl(25, 95%, 53%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span style={{ fontSize: "18px" }}>+</span>
          Ajouter une agence
        </button>
      </div>

      <div style={{
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "14px", color: "#374151" }}>
                Nom de l&apos;agence
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "600", fontSize: "14px", color: "#374151" }}>
                Statut
              </th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", fontSize: "14px", color: "#374151" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {assetDepartments.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                  Aucune agence trouvée
                </td>
              </tr>
            ) : (
              assetDepartments.map((dept) => (
                <tr key={dept.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#374151" }}>
                    {dept.name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "500",
                      background: dept.is_active ? "#d1fae5" : "#fee2e2",
                      color: dept.is_active ? "#065f46" : "#991b1b"
                    }}>
                      {dept.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openEditDepartmentModal(dept)}
                        style={{
                          padding: "6px 12px",
                          background: "hsl(25, 95%, 53%)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer"
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleDepartment(dept.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#e5e7eb",
                          color: "#111827",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer"
                        }}
                      >
                        {dept.is_active ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDepartmentModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            width: "90%",
            maxWidth: "500px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#333", marginBottom: "20px" }}>
              {editingDepartment ? "Modifier l'agence" : "Ajouter une agence"}
            </h2>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500", color: "#374151" }}>
                Nom de l&apos;agence <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Ex: Ressources Humaines"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowDepartmentModal(false);
                  setEditingDepartment(null);
                  setDepartmentName("");
                }}
                style={{
                  padding: "10px 20px",
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                onClick={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}
                style={{
                  padding: "10px 20px",
                  background: "hsl(25, 95%, 53%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                {editingDepartment ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
