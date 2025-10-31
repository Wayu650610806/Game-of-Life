// src/pages/RoutineSetManager.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit, ArrowLeft } from "lucide-react"; // <-- 1. IMPORT ArrowLeft

function RoutineSetManager() {
  const [newSetName, setNewSetName] = useState("");
  const navigate = useNavigate();
  const routineSets = useLiveQuery(() => db.routineSets.toArray());

  // ... (handler functions 'handleCreateSet' และ 'handleDeleteSet' เหมือนเดิม)
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

  return (
    <div style={styles.page}>
      {/* === 2. START CHANGE: เพิ่ม Header ใหม่ที่มีปุ่มกลับ === */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>จัดการ Routine Sets</h2>
        <div style={{ width: "40px" }} /> {/* Placeholder to balance flexbox */}
      </div>
      {/* === END CHANGE === */}

      {/* --- ส่วนที่เหลือของ JSX (Input Form, List) เหมือนเดิม --- */}
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
      <ul style={styles.list}>
        {routineSets && routineSets.length > 0 ? (
          routineSets.map((set) => (
            <li key={set.id} style={styles.listItem}>
              <span style={styles.setName}>{set.name}</span>
              <div style={styles.buttonGroup}>
                <button
                  onClick={() => handleDeleteSet(set.id, set.name)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} />
                </button>
                <Link
                  to={`/routine-set-editor/${set.id}`}
                  style={styles.editButton}
                >
                  <Edit size={18} /> <span>แก้ไข</span>
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
    </div>
  );
}

// === 3. CSS Styles Object (เพิ่ม/แก้ไข) ===
const styles = {
  page: { padding: "10px" },
  // CSS ใหม่สำหรับ Header
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
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  deleteButton: {
    background: "none",
    border: "1px solid #ffaaaa",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: "8px",
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
};

export default RoutineSetManager;
