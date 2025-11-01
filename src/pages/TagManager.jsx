// src/pages/TagManager.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
// === START CHANGE: แก้ 'in' เป็น 'from' ===
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit, Trash2, X, CheckCircle2 } from "lucide-react";
// === END CHANGE ===

function TagManager() {
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("expense"); // 'expense' or 'income'

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // 1. ดึงข้อมูล Tags
  const incomeTags = useLiveQuery(
    () => db.tags.where("type").equals("income").toArray(),
    []
  );
  const expenseTags = useLiveQuery(
    () => db.tags.where("type").equals("expense").toArray(),
    []
  );

  // 2. เพิ่ม
  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await db.tags.add({
        name: newName,
        type: newType,
      });
      setNewName("");
    } catch (e) {
      if (e.name === "ConstraintError") alert("มีชื่อนี้อยู่แล้ว");
    }
  };

  // 3. ลบ
  const handleDelete = async (id) => {
    // (อนาคต: ควรเช็คว่ามี Transaction ใช้อยู่หรือไม่)
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแท็กนี้?")) {
      await db.tags.delete(id);
    }
  };

  // 4. แก้ไข
  const handleRename = async () => {
    if (!editName.trim()) return;
    try {
      await db.tags.update(editingId, { name: editName });
      setEditingId(null);
      setEditName("");
    } catch (e) {
      if (e.name === "ConstraintError") alert("มีชื่อนี้อยู่แล้ว");
    }
  };

  const renderTagList = (tags) => {
    if (!tags) return <p>กำลังโหลด...</p>;
    if (tags.length === 0) return <p style={styles.emptyText}>ไม่มีแท็ก</p>;

    return tags.map((tag) => (
      <div key={tag.id} style={styles.budgetItem}>
        {editingId === tag.id ? (
          // โหมดแก้ไข
          <div style={styles.budgetInputBox}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleRename} style={styles.saveButton}>
              <CheckCircle2 size={18} />
            </button>
          </div>
        ) : (
          // โหมดแสดงผล
          <>
            <span>{tag.name}</span>
            <div style={styles.budgetAdminButtons}>
              <button
                onClick={() => {
                  setEditingId(tag.id);
                  setEditName(tag.name);
                }}
                style={styles.iconButton}
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    ));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>จัดการแท็ก (Tags)</h2>
      </div>

      {/* ส่วนเพิ่ม */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>เพิ่มแท็กใหม่</h3>
        <div style={styles.inputGroup}>
          <label>ชื่อแท็ก</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={styles.input}
            placeholder="เช่น 'เงินเดือน', 'ค่าอาหาร'"
          />
        </div>
        <div style={styles.inputGroup}>
          <label>ประเภท</label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            style={styles.select}
          >
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
        </div>
        <button onClick={handleAdd} style={styles.saveButton}>
          <Plus size={18} /> เพิ่มแท็ก
        </button>
      </div>

      {/* ส่วนรายการ */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>แท็กรายจ่าย (Expense Tags)</h3>
        <div style={styles.budgetManagerList}>{renderTagList(expenseTags)}</div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>แท็กรายรับ (Income Tags)</h3>
        <div style={styles.budgetManagerList}>{renderTagList(incomeTags)}</div>
      </div>
    </div>
  );
}

// === CSS Styles (ใช้ร่วมกับ Finance) ===
const styles = {
  page: { padding: "10px", height: "100%", overflowY: "auto" },
  header: {
    display: "flex",
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
    marginRight: "10px",
    cursor: "pointer",
    display: "flex",
  },
  title: {
    margin: 0,
    fontSize: "1.2rem",
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem",
    marginBottom: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
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
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "10px",
  },
  budgetManagerList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  budgetItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#333",
    borderRadius: "5px",
  },
  budgetInputBox: {
    display: "flex",
    gap: "5px",
    flexGrow: 1,
  },
  budgetAdminButtons: {
    display: "flex",
    gap: "8px",
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
};

export default TagManager;
