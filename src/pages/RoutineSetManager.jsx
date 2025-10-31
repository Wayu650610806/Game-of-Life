// src/pages/RoutineSetManager.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link, useNavigate } from "react-router-dom";
// === 1. START CHANGE: Import ไอคอนใหม่ ===
import {
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Copy,
  FileSignature,
  X,
} from "lucide-react";
// === END CHANGE ===

function RoutineSetManager() {
  const [newSetName, setNewSetName] = useState("");
  const navigate = useNavigate();

  // === 2. (ใหม่) State สำหรับ Modal แก้ไขชื่อ ===
  const [editingSet, setEditingSet] = useState(null); // (null หรือ set object)

  const routineSets = useLiveQuery(() => db.routineSets.toArray());

  // (ฟังก์ชัน 'handleCreateSet' เหมือนเดิม)
  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    try {
      const newId = await db.routineSets.add({
        name: newSetName.trim(),
        items: [],
      });
      setNewSetName("");
      navigate(`/routine-set-editor/${newId}`);
    } catch (error) {
      console.error("Failed to create new set:", error);
    }
  };

  // (ฟังก์ชัน 'handleDeleteSet' เหมือนเดิม)
  const handleDeleteSet = async (id, name) => {
    if (
      window.confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบ Set "${name}"? (กิจกรรมในวันที่จะถูกลบด้วย)`
      )
    ) {
      try {
        await db.routineSets.delete(id);
        const assignments = await db.dailyRoutines
          .where("routineSetId")
          .equals(id)
          .toArray();
        for (const assign of assignments) {
          await db.dailyRoutines.delete(assign.dayOfWeek);
        }
      } catch (error) {
        console.error("Failed to delete set:", error);
      }
    }
  };

  // === 3. (ใหม่) ฟังก์ชัน Copy Set ===
  const handleCopySet = async (id) => {
    try {
      const originalSet = await db.routineSets.get(id);
      if (!originalSet) return;

      const newSet = {
        ...originalSet,
        name: `${originalSet.name} (Copy)`,
      };
      delete newSet.id; // (สำคัญ) ลบ ID เก่าออก

      await db.routineSets.add(newSet);
    } catch (error) {
      console.error("Failed to copy set:", error);
    }
  };

  return (
    <div style={styles.page}>
      {/* 4. (อัปเดต) Header ให้มีปุ่มกลับ */}
      <div style={styles.header}>
        <button
          onClick={() => navigate("/edit-routine")}
          style={styles.backButton}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>จัดการ Routine Sets</h2>
        <div style={{ width: "40px" }} /> {/* Placeholder */}
      </div>

      {/* --- ส่วน Input (เหมือนเดิม) --- */}
      <div style={styles.inputForm}>
        <input
          type="text"
          value={newSetName}
          onChange={(e) => setNewSetName(e.target.value)}
          placeholder="เช่น: กิจวัตรตอนเช้า"
          style={styles.input}
          onKeyPress={(e) => e.key === "Enter" && handleCreateSet()}
        />
        <button onClick={handleCreateSet} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>

      {/* --- 5. (อัปเดต) รายการ Set --- */}
      <ul style={styles.list}>
        {routineSets && routineSets.length > 0 ? (
          routineSets.map((set) => (
            <li key={set.id} style={styles.listItem}>
              <span style={styles.setName}>{set.name}</span>

              <div style={styles.buttonGroup}>
                {/* ปุ่ม Copy */}
                <button
                  onClick={() => handleCopySet(set.id)}
                  style={styles.iconButton}
                  title="คัดลอก"
                >
                  <Copy size={16} />
                </button>
                {/* ปุ่ม Rename */}
                <button
                  onClick={() => setEditingSet(set)}
                  style={styles.iconButton}
                  title="แก้ไขชื่อ"
                >
                  <FileSignature size={16} />
                </button>
                {/* ปุ่ม Delete */}
                <button
                  onClick={() => handleDeleteSet(set.id, set.name)}
                  style={styles.deleteButton}
                  title="ลบ"
                >
                  <Trash2 size={16} />
                </button>
                {/* ปุ่ม Edit Activities */}
                <Link
                  to={`/routine-set-editor/${set.id}`}
                  style={styles.editButton}
                >
                  <Edit size={16} /> <span>แก้ไข</span>
                </Link>
              </div>
            </li>
          ))
        ) : (
          <p style={styles.emptyText}>
            {routineSets
              ? "ยังไม่มี Routine Set... สร้าง Set แรกของคุณได้เลย"
              : "กำลังโหลด..."}
          </p>
        )}
      </ul>

      {/* === 6. (ใหม่) Modal สำหรับแก้ไขชื่อ === */}
      {editingSet && (
        <EditNameModal set={editingSet} onClose={() => setEditingSet(null)} />
      )}
    </div>
  );
}

// =======================================================
// === 7. (ใหม่) Component ย่อย: Modal แก้ไขชื่อ ===
// =======================================================
function EditNameModal({ set, onClose }) {
  const [newName, setNewName] = useState(set.name);

  const handleSave = async () => {
    if (!newName.trim()) {
      alert("ชื่อห้ามว่าง");
      return;
    }
    try {
      await db.routineSets.update(set.id, { name: newName.trim() });
      onClose();
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>แก้ไขชื่อ Routine Set</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อ Set</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={styles.input}
            />
          </div>
          <button onClick={handleSave} style={styles.saveButton}>
            <FileSignature size={18} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// === 8. (อัปเดต) CSS Styles ===
const styles = {
  page: { padding: "10px" },
  // (ใหม่) Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    marginBottom: "15px",
    borderBottom: "1px solid #444",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
  },
  title: {
    margin: 0,
    fontSize: "1.2rem",
    textAlign: "center",
    flexGrow: 1,
  },
  inputForm: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  input: {
    flexGrow: 1,
    padding: "10px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
  },
  addButton: {
    flexShrink: 0,
    padding: "0 15px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#646cff",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
  },
  setName: {
    fontWeight: "bold",
    fontSize: "1.1rem",
    wordBreak: "break-word", // (ใหม่) กันชื่อยาว
    marginRight: "10px", // (ใหม่)
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0, // (ใหม่)
  },
  // (ใหม่) ปุ่มไอคอน (Copy, Rename)
  iconButton: {
    background: "none",
    border: "1px solid #888",
    color: "#888",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "5px",
    display: "flex",
  },
  deleteButton: {
    background: "none",
    border: "1px solid #ffaaaa",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "5px",
    display: "flex",
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#646cff",
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    fontSize: "0.9rem",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "10px",
  },

  // (ใหม่) CSS สำหรับ Modal
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "15px",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "20px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  saveButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "1rem",
  },
};

export default RoutineSetManager;
