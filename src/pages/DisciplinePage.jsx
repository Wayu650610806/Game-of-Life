// src/pages/DisciplinePage.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
  Plus,
  Trash2,
  X,
  Edit,
  FileSignature,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

// === 1. START CHANGE: (ใหม่) เพิ่ม Helper Function ที่ลืมไป ===
const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
};
// === END CHANGE ===

// === Main Component (ระบบ Tabs) ===
function DisciplinePage() {
  const [currentTab, setCurrentTab] = useState("habits"); // 'habits' or 'penalties'

  return (
    <div style={styles.page}>
      <div style={styles.tabs}>
        <button
          style={currentTab === "habits" ? styles.tabActive : styles.tab}
          onClick={() => setCurrentTab("habits")}
        >
          นิสัย (Bad Habits)
        </button>
        <button
          style={currentTab === "penalties" ? styles.tabActive : styles.tab}
          onClick={() => setCurrentTab("penalties")}
        >
          บทลงโทษ (Penalties)
        </button>
      </div>

      {currentTab === "habits" && <BadHabitsTab />}
      {currentTab === "penalties" && <PenaltiesTab />}
    </div>
  );
}

// =======================================================
// === Component: แท็บนิสัย (Bad Habits) ===
// =======================================================
function BadHabitsTab() {
  const [isManaging, setIsManaging] = useState(false);

  const habits = useLiveQuery(() => db.badHabits.toArray(), []);
  const penalties = useLiveQuery(() => db.penalties.toArray(), []);

  // Handler: "ยอมรับผิด"
  const handleFailNow = async (habit) => {
    if (!penalties || penalties.length === 0) {
      alert("กรุณาเพิ่มบทลงโทษในแท็บ 'Penalties' ก่อน");
      return;
    }

    if (
      window.confirm(
        `คุณยอมรับว่าได้ทำ "${habit.name}" (เลิกนิสัยล้มเหลว)?\n\nเลเวลจะถูกรีเซ็ตเป็น 0 และคุณจะโดนสุ่มลงโทษทันที`
      )
    ) {
      try {
        const randomPenalty =
          penalties[Math.floor(Math.random() * penalties.length)];

        await db.badHabits.update(habit.id, {
          level: 0,
          lastFailedTimestamp: new Date().toISOString(),
        });

        await db.mailbox.add({
          timestamp: new Date().toISOString(),
          type: "fail-log",
          isRead: 0,
          message: `(ล้มเหลว) ${habit.name}`,
          activityName: habit.name,
          levelDrop: habit.level,
          penaltyName: randomPenalty.name,
        });

        alert(`บันทึกความล้มเหลว.\nบทลงโทษ: ${randomPenalty.name}`);
      } catch (e) {
        console.error("Failed to confess:", e);
      }
    }
  };

  // (Helper) เช็คว่าวันนี้ยอมรับผิดไปหรือยัง
  const today = getTodayDateString(); // <-- (ตอนนี้จะทำงานได้แล้ว)
  const getHabitStatus = (habit) => {
    if (habit.lastFailedTimestamp?.startsWith(today)) {
      return { text: "ล้มเหลวแล้ว (วันนี้)", disabled: true };
    }
    return { text: "ฉันทำพลาด!", disabled: false };
  };

  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.sectionTitle}>นิสัยที่อยากเลิก (Bad Habits)</h2>
        <button onClick={() => setIsManaging(true)} style={styles.manageButton}>
          <Edit size={16} /> จัดการ
        </button>
      </div>

      <ul style={styles.list}>
        {habits && habits.length > 0 ? (
          habits.map((habit) => {
            const status = getHabitStatus(habit);
            return (
              <li key={habit.id} style={styles.listItem}>
                <div style={styles.habitInfo}>
                  <span style={styles.setName}>{habit.name}</span>
                  <span style={styles.levelText}>
                    Lv. {habit.level} (Streak)
                  </span>
                </div>
                <button
                  style={
                    status.disabled ? styles.disabledButton : styles.failButton
                  }
                  onClick={() => handleFailNow(habit)}
                  disabled={status.disabled}
                >
                  <ShieldAlert size={16} />
                  <span>{status.text}</span>
                </button>
              </li>
            );
          })
        ) : (
          <p style={styles.emptyText}>
            ยังไม่มีนิสัยที่อยากเลิก (กด 'จัดการ' เพื่อเพิ่ม)
          </p>
        )}
      </ul>

      {isManaging && <ManageHabitsModal onClose={() => setIsManaging(false)} />}
    </div>
  );
}

// =======================================================
// === Component: Modal จัดการ Habits (CRUD) ===
// =======================================================
function ManageHabitsModal({ onClose }) {
  const habits = useLiveQuery(() => db.badHabits.toArray());
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await db.badHabits.add({
        name: newName,
        level: 0,
        lastFailedTimestamp: null,
      });
      setNewName("");
    } catch (e) {
      if (e.name === "ConstraintError") alert("มีชื่อนี้อยู่แล้ว");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("ลบนิสัยนี้?")) {
      await db.badHabits.delete(id);
    }
  };

  const handleRename = async () => {
    if (!editName.trim()) return;
    try {
      await db.badHabits.update(editingId, { name: editName });
      setEditingId(null);
      setEditName("");
    } catch (e) {
      if (e.name === "ConstraintError") alert("มีชื่อนี้อยู่แล้ว");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>จัดการนิสัย (Bad Habits)</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.inputGroup} className="modalForm">
          <label>เพิ่มนิสัยใหม่</label>
          <div style={styles.budgetInputBox}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={styles.input}
              placeholder="เช่น 'ไม่กินขนม'"
            />
            <button onClick={handleAdd} style={styles.saveButton}>
              <Plus size={18} />
            </button>
          </div>
        </div>
        <hr style={styles.hr} />
        <div style={styles.budgetManagerList}>
          {habits &&
            habits.map((h) => (
              <div key={h.id} style={styles.budgetItem}>
                {editingId === h.id ? (
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
                  <>
                    <span>
                      {h.name} (Lv. {h.level})
                    </span>
                    <div style={styles.budgetAdminButtons}>
                      <button
                        onClick={() => {
                          setEditingId(h.id);
                          setEditName(h.name);
                        }}
                        style={styles.iconButton}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// =======================================================
// === Component: แท็บบทลงโทษ (Penalties) ===
// =======================================================
function PenaltiesTab() {
  const [newPenaltyName, setNewPenaltyName] = useState("");
  const penalties = useLiveQuery(() => db.penalties.toArray());

  const handleAddPenalty = async () => {
    if (!newPenaltyName.trim()) {
      alert("กรุณากรอกชื่อบทลงโทษ");
      return;
    }
    try {
      await db.penalties.add({
        name: newPenaltyName.trim(),
      });
      setNewPenaltyName("");
    } catch (error) {
      console.error("Failed to add penalty:", error);
    }
  };

  const handleDeletePenalty = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      try {
        await db.penalties.delete(id);
      } catch (error) {
        console.error("Failed to delete penalty:", error);
      }
    }
  };

  return (
    <div>
      <div style={styles.tabHeader}>
        <h2 style={styles.sectionTitle}>บทลงโทษ (Penalties)</h2>
      </div>

      <div style={styles.inputForm}>
        <input
          type="text"
          value={newPenaltyName}
          onChange={(e) => setNewPenaltyName(e.target.value)}
          placeholder="เช่น: วิดพื้น 20 ครั้ง"
          style={styles.input}
          onKeyPress={(e) => e.key === "Enter" && handleAddPenalty()}
        />
        <button onClick={handleAddPenalty} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>

      <ul style={styles.list}>
        {penalties && penalties.length > 0 ? (
          penalties.map((penalty) => (
            <li key={penalty.id} style={styles.listItem}>
              <span>{penalty.name}</span>
              <button
                onClick={() => handleDeletePenalty(penalty.id)}
                style={styles.deleteButtonIcon}
                title="ลบ"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))
        ) : (
          <div style={styles.emptyState}>
            {penalties ? <p>ยังไม่มีบทลงโทษ</p> : <p>กำลังโหลด...</p>}
          </div>
        )}
      </ul>
    </div>
  );
}

// === CSS Styles ===
const styles = {
  page: { padding: "10px" },
  tabs: {
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid #444",
    marginBottom: "10px",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#888",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "1rem",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    background: "none",
    border: "none",
    color: "white",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "1rem",
    borderBottom: "2px solid #64cfff",
    fontWeight: "bold",
  },
  tabHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem",
  },
  manageButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#333",
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    fontSize: "0.9rem",
    border: "1px solid #555",
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
  emptyState: {
    textAlign: "center",
    color: "#888",
    marginTop: "50px",
  },
  habitInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  setName: {
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  levelText: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  failButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#c0392b",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  disabledButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#555",
    color: "#999",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "not-allowed",
    fontSize: "0.9rem",
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
  deleteButtonIcon: {
    background: "none",
    border: "none",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: 0,
    display: "flex",
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
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "15px",
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
  hr: {
    border: "none",
    borderTop: "1px solid #444",
    margin: "15px 0",
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

export default DisciplinePage;
