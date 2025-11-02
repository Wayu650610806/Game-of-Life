// src/pages/ExerciseSetEditor.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
  Plus,
  Trash2,
  X,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Edit,
  CheckCircle2,
} from "lucide-react";

// === Main Component (เหมือนเดิม) ===
function ExerciseSetEditor() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingMasterList, setIsManagingMasterList] = useState(false);

  // (Data Hooks ... เหมือนเดิม)
  const exerciseSet = useLiveQuery(
    () => db.exerciseSets.get(parseInt(setId, 10)),
    [setId]
  );
  const allExercises = useLiveQuery(() => db.exerciseMasterList.toArray(), []);
  const setTemplateItems = useLiveQuery(
    () =>
      db.exerciseSetItems
        .where("exerciseSetId")
        .equals(parseInt(setId, 10))
        .toArray(),
    [setId]
  );

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("ลบท่านี้ออกจาก Set?")) {
      await db.exerciseSetItems.delete(itemId);
    }
  };

  if (!exerciseSet || !allExercises || !setTemplateItems) {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>{exerciseSet.name}</h2>
        <button onClick={() => setIsAdding(true)} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>

      {/* (List - อัปเดต) */}
      <div style={styles.list}>
        {setTemplateItems.length > 0 ? (
          setTemplateItems.map((item) => {
            const details = allExercises.find(
              (e) => e.id === item.exerciseMasterId
            );
            if (!details) return null;

            return (
              <div key={item.id} style={styles.listItem}>
                <div style={styles.activityDetails}>
                  <span style={styles.activityName}>{details.name}</span>
                  {/* (อัปเดต) Logic การแสดงผล */}
                  {details.type === "reps" ? (
                    <span style={styles.activityInfo}>
                      {item.templateSets} เซ็ต x {item.templateReps} ครั้ง @{" "}
                      {item.templateWeight} kg
                    </span>
                  ) : (
                    <span style={styles.activityInfo}>
                      {item.templateSets
                        ? `${item.templateSets} เซ็ต x ${item.templateDuration} นาที`
                        : `${item.templateDuration} นาที`}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })
        ) : (
          <p style={styles.emptyText}>
            ยังไม่มีท่าใน Set นี้
            <br />
            กดปุ่ม (+) เพื่อเพิ่ม
          </p>
        )}
      </div>

      {isAdding && (
        <AddExerciseModal
          onClose={() => setIsAdding(false)}
          currentSetId={parseInt(setId, 10)}
          allExercises={allExercises}
          onOpenMasterList={() => setIsManagingMasterList(true)}
        />
      )}

      {isManagingMasterList && (
        <ManageMasterListModal onClose={() => setIsManagingMasterList(false)} />
      )}
    </div>
  );
}

// =======================================================
// === (อัปเดต) Component: Modal เพิ่มท่าออกกำลังกาย ===
// =======================================================
function AddExerciseModal({
  onClose,
  currentSetId,
  allExercises,
  onOpenMasterList,
}) {
  const [selectedExId, setSelectedExId] = useState("");
  const [selectedExType, setSelectedExType] = useState(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseType, setNewExerciseType] = useState("reps");

  // (อัปเดต) States (แยก Time/Reps)
  const [repsSets, setRepsSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);

  const [timeSets, setTimeSets] = useState(3);
  const [duration, setDuration] = useState(1); // (นาที)
  const [isTimeWithSets, setIsTimeWithSets] = useState(false); // (Checkbox)

  const [error, setError] = useState(null);

  const handleSelectExercise = (e) => {
    const id = e.target.value;
    setSelectedExId(id);
    if (id === "NEW") {
      setSelectedExType(null);
    } else {
      const ex = allExercises.find((e) => e.id === Number(id));
      setSelectedExType(ex ? ex.type : null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    let finalExerciseId = Number(selectedExId);
    let finalExerciseType = selectedExType;

    if (selectedExId === "NEW") {
      if (!newExerciseName.trim()) {
        setError("กรุณากรอกชื่อท่าใหม่");
        return;
      }
      try {
        const newId = await db.exerciseMasterList.add({
          name: newExerciseName,
          type: newExerciseType,
        });
        finalExerciseId = newId;
        finalExerciseType = newExerciseType;
      } catch (e) {
        if (e.name === "ConstraintError") {
          setError("มีชื่อท่าออกกำลังกายนี้อยู่แล้ว");
        } else {
          setError("ไม่สามารถสร้างท่าใหม่ได้");
        }
        return;
      }
    }

    if (!finalExerciseId) {
      setError("กรุณาเลือกท่า");
      return;
    }

    const itemData = {
      exerciseSetId: currentSetId,
      exerciseMasterId: finalExerciseId,
      templateSets: null,
      templateReps: null,
      templateWeight: null,
      templateDuration: null,
    };

    if (finalExerciseType === "reps") {
      itemData.templateSets = Number(repsSets);
      itemData.templateReps = String(reps);
      itemData.templateWeight = Number(weight);
    } else {
      // (Time)
      itemData.templateDuration = Number(duration);
      if (isTimeWithSets) {
        itemData.templateSets = Number(timeSets);
      }
    }

    try {
      await db.exerciseSetItems.add(itemData);
      onClose();
    } catch (e) {
      console.error("Failed to add exercise item:", e);
      setError("เกิดข้อผิดพลาด");
    }
  };

  const showRepsForm =
    selectedExType === "reps" ||
    (selectedExId === "NEW" && newExerciseType === "reps");
  const showTimeForm =
    selectedExType === "time" ||
    (selectedExId === "NEW" && newExerciseType === "time");

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>เพิ่มท่าออกกำลังกาย</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>เลือกท่า</label>
            <div style={styles.inputWithButton}>
              <select
                value={selectedExId}
                onChange={handleSelectExercise}
                style={styles.select}
              >
                <option value="" disabled>
                  -- เลือก --
                </option>
                {allExercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.type})
                  </option>
                ))}
                <option
                  value="NEW"
                  style={{ color: "#64cfff", fontWeight: "bold" }}
                >
                  -- สร้างท่าใหม่ --
                </option>
              </select>
              <button
                onClick={onOpenMasterList}
                style={styles.manageButton}
                title="จัดการคลังท่า"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {selectedExId === "NEW" && (
            <div style={styles.newExerciseForm}>
              <div style={styles.inputGroup}>
                <label>ชื่อท่าใหม่</label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  style={styles.input}
                  placeholder="เช่น Bicep Curl"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>ประเภทท่า</label>
                <select
                  value={newExerciseType}
                  onChange={(e) => setNewExerciseType(e.target.value)}
                  style={styles.select}
                >
                  <option value="reps">นับครั้ง (Reps)</option>
                  <option value="time">นับเวลา (Time)</option>
                </select>
              </div>
            </div>
          )}

          {/* (Reps Form) */}
          {showRepsForm && (
            <div style={styles.grid3}>
              <div style={styles.inputGroup}>
                <label>จำนวนเซ็ต</label>
                <input
                  type="number"
                  value={repsSets}
                  onChange={(e) => setRepsSets(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label>จำนวนครั้ง (Reps)</label>
                <input
                  type="text"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  style={styles.input}
                  placeholder="เช่น 10"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>น้ำหนัก (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {/* (Time Form) */}
          {showTimeForm && (
            <>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isTimeWithSets"
                  checked={isTimeWithSets}
                  onChange={(e) => setIsTimeWithSets(e.target.checked)}
                />
                <label htmlFor="isTimeWithSets" style={styles.checkboxLabel}>
                  นับเวลาแบบแบ่งเซ็ต (เช่น Plank)
                </label>
              </div>

              <div style={isTimeWithSets ? styles.grid2 : styles.grid1}>
                {isTimeWithSets && (
                  <div style={styles.inputGroup}>
                    <label>จำนวนเซ็ต</label>
                    <input
                      type="number"
                      value={timeSets}
                      onChange={(e) => setTimeSets(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                )}
                <div style={styles.inputGroup}>
                  <label>เวลา (นาที)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            style={styles.saveButton}
            disabled={!selectedExId}
          >
            <Plus size={18} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'ManageMasterListModal' ... เหมือนเดิม)
function ManageMasterListModal({ onClose }) {
  const masterList = useLiveQuery(() => db.exerciseMasterList.toArray());
  const allSetItems = useLiveQuery(() => db.exerciseSetItems.toArray());
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleDelete = async (id, name) => {
    const isUsed = allSetItems.some((item) => item.exerciseMasterId === id);
    if (isUsed) {
      alert(
        `ไม่สามารถลบ "${name}" ได้: ท่านี้กำลังถูกใช้งานใน Exercise Set ของคุณ`
      );
      return;
    }
    if (
      window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}" ออกจากคลังท่า?`)
    ) {
      await db.exerciseMasterList.delete(id);
    }
  };

  const handleRename = async () => {
    if (!editName.trim()) return;
    try {
      await db.exerciseMasterList.update(editingId, { name: editName });
      setEditingId(null);
      setEditName("");
    } catch (e) {
      if (e.name === "ConstraintError") {
        alert("มีชื่อนี้อยู่แล้ว");
      } else {
        console.error("Failed to rename:", e);
      }
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>จัดการคลังท่าออกกำลังกาย</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.budgetManagerList}>
          {masterList &&
            masterList.map((ex) => (
              <div key={ex.id} style={styles.budgetItem}>
                {editingId === ex.id ? (
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
                    <span style={styles.masterListItemName}>
                      {ex.name} ({ex.type})
                    </span>
                    <div style={styles.budgetAdminButtons}>
                      <button
                        onClick={() => {
                          setEditingId(ex.id);
                          setEditName(ex.name);
                        }}
                        style={styles.iconButton}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id, ex.name)}
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

// === CSS Styles (อัปเดต) ===
const styles = {
  // (CSS ส่วนใหญ่เหมือนเดิม)
  page: { padding: "10px", height: "100%", overflowY: "auto" },
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
  },
  addButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#2a2a2a",
    padding: "10px 15px",
    borderRadius: "8px",
  },
  activityDetails: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  },
  activityName: {
    fontSize: "1rem",
    fontWeight: "bold",
  },
  activityInfo: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: "5px",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "20px",
  },
  // (Modal Styles)
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
    marginBottom: "20px",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },
  modalForm: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
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
    flexGrow: 1,
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#4d2a2a",
    color: "#ffaaaa",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "0.9rem",
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
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  grid2: {
    // (ใหม่)
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  grid1: {
    // (ใหม่)
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  newExerciseForm: {
    border: "1px solid #444",
    borderRadius: "5px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "#333",
  },
  inputWithButton: {
    display: "flex",
    gap: "5px",
  },
  manageButton: {
    background: "none",
    border: "1px solid #888",
    color: "#888",
    borderRadius: "5px",
    padding: "0 10px",
    cursor: "pointer",
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
  masterListItemName: {
    wordBreak: "break-word",
    marginRight: "10px",
  },
  checkboxGroup: {
    // (ใหม่)
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  checkboxLabel: {
    // (ใหม่)
    fontSize: "0.9rem",
    color: "#aaa",
  },
};

export default ExerciseSetEditor;
