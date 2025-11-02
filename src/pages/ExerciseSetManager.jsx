// src/pages/ExerciseSetManager.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Edit,
  ArrowLeft,
  Copy,
  FileSignature,
  X,
} from "lucide-react";

function ExerciseSetManager() {
  const [newSetName, setNewSetName] = useState("");
  const navigate = useNavigate();
  const [editingSet, setEditingSet] = useState(null);

  const exerciseSets = useLiveQuery(() => db.exerciseSets.toArray());

  // (Handler: Create ... เหมือนเดิม)
  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    try {
      const newId = await db.exerciseSets.add({
        name: newSetName.trim(),
      });
      setNewSetName("");
      navigate(`/exercise-set-editor/${newId}`);
    } catch (error) {
      console.error("Failed to create new set:", error);
    }
  };

  // (Handler: Delete ... อัปเดตแล้ว)
  const handleDeleteSet = async (id, name) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ Set "${name}"?`)) {
      try {
        await db.exerciseSets.delete(id);
        await db.exerciseSetItems.where("exerciseSetId").equals(id).delete();

        const assignmentsOdd = await db.dailyExerciseRoutines
          .where("exerciseSetIdOdd")
          .equals(id)
          .toArray();
        const assignmentsEven = await db.dailyExerciseRoutines
          .where("exerciseSetIdEven")
          .equals(id)
          .toArray();

        for (const assign of assignmentsOdd) {
          await db.dailyExerciseRoutines.update(assign.dayOfWeek, {
            exerciseSetIdOdd: null,
          });
        }
        for (const assign of assignmentsEven) {
          await db.dailyExerciseRoutines.update(assign.dayOfWeek, {
            exerciseSetIdEven: null,
          });
        }
      } catch (error) {
        console.error("Failed to delete set:", error);
      }
    }
  };

  // (Handler: Copy ... อัปเดตแล้ว)
  const handleCopySet = async (id) => {
    try {
      const originalSet = await db.exerciseSets.get(id);
      if (!originalSet) return;

      const newSet = {
        ...originalSet,
        name: `${originalSet.name} (Copy)`,
      };
      delete newSet.id;

      const newId = await db.exerciseSets.add(newSet);

      const originalItems = await db.exerciseSetItems
        .where("exerciseSetId")
        .equals(id)
        .toArray();

      const newItems = originalItems.map((item) => {
        const newItem = {
          ...item,
          exerciseSetId: newId,
        };
        delete newItem.id;
        return newItem;
      });

      await db.exerciseSetItems.bulkAdd(newItems);
    } catch (error) {
      console.error("Failed to copy set:", error);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        {/* === START CHANGE: แก้ Bug ลิงก์กลับ (กลับไปใช้ navigate(-1)) === */}
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        {/* === END CHANGE === */}
        <h2 style={styles.title}>Exercise Sets</h2>
        <div style={{ width: "40px" }} />
      </div>

      {/* (Input Form ... เหมือนเดิม) */}
      <div style={styles.inputForm}>
        <input
          type="text"
          value={newSetName}
          onChange={(e) => setNewSetName(e.target.value)}
          placeholder="เช่น: Push Day, Leg Day"
          style={styles.input}
          onKeyPress={(e) => e.key === "Enter" && handleCreateSet()}
        />
        <button onClick={handleCreateSet} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>

      {/* (List ... เหมือนเดิม) */}
      <ul style={styles.list}>
        {exerciseSets && exerciseSets.length > 0 ? (
          exerciseSets.map((set) => (
            <li key={set.id} style={styles.listItem}>
              <span style={styles.setName}>{set.name}</span>
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => handleCopySet(set.id)}
                  style={styles.iconButton}
                  title="คัดลอก"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setEditingSet(set)}
                  style={styles.iconButton}
                  title="แก้ไขชื่อ"
                >
                  <FileSignature size={16} />
                </button>
                <button
                  onClick={() => handleDeleteSet(set.id, set.name)}
                  style={styles.deleteButton}
                  title="ลบ"
                >
                  <Trash2 size={16} />
                </button>
                <Link
                  to={`/exercise-set-editor/${set.id}`}
                  style={styles.editButton}
                >
                  <Edit size={16} /> <span>แก้ไข</span>
                </Link>
              </div>
            </li>
          ))
        ) : (
          <p style={styles.emptyText}>
            {exerciseSets
              ? "ยังไม่มี Exercise Set... สร้าง Set แรกของคุณได้เลย"
              : "กำลังโหลด..."}
          </p>
        )}
      </ul>

      {/* (Modal ... เหมือนเดิม) */}
      {editingSet && (
        <EditNameModal set={editingSet} onClose={() => setEditingSet(null)} />
      )}
    </div>
  );
}

// (Modal แก้ไขชื่อ ... เหมือนเดิม)
function EditNameModal({ set, onClose }) {
  const [newName, setNewName] = useState(set.name);
  const handleSave = async () => {
    if (!newName.trim()) {
      alert("ชื่อห้ามว่าง");
      return;
    }
    try {
      await db.exerciseSets.update(set.id, { name: newName.trim() });
      onClose();
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>แก้ไขชื่อ Exercise Set</h3>
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

// === CSS Styles (เหมือนเดิม) ===
const styles = {
  page: { padding: "10px" },
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
    wordBreak: "break-word",
    marginRight: "10px",
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
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

export default ExerciseSetManager;
