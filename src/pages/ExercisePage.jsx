// src/pages/ExercisePage.jsx
import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link, useNavigate } from "react-router-dom";
import {
  Settings,
  Dumbbell,
  Edit,
  History,
  X,
  Save,
  ArrowLeft,
} from "lucide-react";

const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA");
};
const getTodayDayOfWeek = () => {
  return new Date().getDay();
};
const isCurrentMonthOdd = () => {
  const monthIndex = new Date().getMonth();
  return (monthIndex + 1) % 2 !== 0;
};

// === Main Component (เหมือนเดิม) ===
function ExercisePage() {
  const todayDayOfWeek = getTodayDayOfWeek();
  const todayDate = getTodayDateString();
  const navigate = useNavigate();
  const [isLogModalOpen, setIsLogModalOpen] = useState(null);

  // (Data Hooks ... เหมือนเดิม)
  const dailyRoutine = useLiveQuery(
    () => db.dailyExerciseRoutines.get(todayDayOfWeek),
    [todayDayOfWeek]
  );
  const exerciseSetId = useMemo(() => {
    if (!dailyRoutine) return null;
    return isCurrentMonthOdd()
      ? dailyRoutine.exerciseSetIdOdd
      : dailyRoutine.exerciseSetIdEven;
  }, [dailyRoutine]);
  const exerciseSet = useLiveQuery(
    () =>
      exerciseSetId
        ? db.exerciseSets.get(exerciseSetId)
        : Promise.resolve(null),
    [exerciseSetId]
  );
  const setTemplateItems = useLiveQuery(
    () =>
      exerciseSetId
        ? db.exerciseSetItems
            .where("exerciseSetId")
            .equals(exerciseSetId)
            .toArray()
        : Promise.resolve([]),
    [exerciseSetId]
  );
  const masterList = useLiveQuery(() => db.exerciseMasterList.toArray(), []);
  const todayLog = useLiveQuery(
    () => db.exerciseLog.where("date").equals(todayDate).toArray(),
    [todayDate]
  );
  const lastLogs = useLiveQuery(async () => {
    if (!setTemplateItems || setTemplateItems.length === 0) return new Map();
    const lastLogMap = new Map();
    for (const item of setTemplateItems) {
      const lastEntry = await db.exerciseLog
        .where("exerciseMasterId")
        .equals(item.exerciseMasterId)
        .and((log) => log.date !== todayDate)
        .reverse()
        .first();
      if (lastEntry) {
        lastLogMap.set(item.exerciseMasterId, lastEntry);
      }
    }
    return lastLogMap;
  }, [setTemplateItems, todayDate]);
  const todayWorkoutList = useMemo(() => {
    if (!setTemplateItems || !masterList || !todayLog || !lastLogs) return [];
    return setTemplateItems.map((item) => {
      const details = masterList.find((m) => m.id === item.exerciseMasterId);
      const todayEntry = todayLog.find(
        (l) => l.exerciseMasterId === item.exerciseMasterId
      );
      const lastEntry = lastLogs.get(item.exerciseMasterId);
      return {
        template: item,
        details: details,
        todayLog: todayEntry || null,
        lastLog: lastEntry || null,
      };
    });
  }, [setTemplateItems, masterList, todayLog, lastLogs]);

  // (หน้าว่าง ... เหมือนเดิม)
  if (!dailyRoutine || !exerciseSetId || !exerciseSet || !setTemplateItems) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={styles.title}>My Workout</h2>
          <Link to="/exercise-settings" style={styles.settingsButton}>
            <Settings size={18} />
            <span>ตั้งค่า</span>
          </Link>
        </div>
        <div style={styles.emptyState}>
          <Dumbbell size={48} color="#555" />
          <p>ยังไม่มีการออกกำลังกายสำหรับวันนี้</p>
          <p>กรุณาไปที่ "ตั้งค่า" เพื่อกำหนด Exercise Set ให้กับวันนี้</p>
        </div>
      </div>
    );
  }

  // (หน้าแสดงผลหลัก ... เหมือนเดิม)
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>{exerciseSet.name}</h2>
        <Link to="/exercise-settings" style={styles.settingsButton}>
          <Settings size={18} />
          <span>ตั้งค่า</span>
        </Link>
      </div>
      <div style={styles.list}>
        {todayWorkoutList.map((workout) => (
          <ExerciseCard
            key={workout.details.id}
            workout={workout}
            onEditLog={() => setIsLogModalOpen(workout)}
          />
        ))}
      </div>
      {isLogModalOpen && (
        <LogEditModal
          workout={isLogModalOpen}
          onClose={() => setIsLogModalOpen(null)}
          todayDate={todayDate}
        />
      )}
    </div>
  );
}

// === (อัปเดต) Component: Exercise Card ===
function ExerciseCard({ workout, onEditLog }) {
  const { template, details, todayLog, lastLog } = workout;
  const isTimeBased = details.type === "time";

  // (เลือกข้อมูลที่จะโชว์: ถ้ามี Log วันนี้ ให้ใช้, ถ้าไม่มี ให้ใช้ Template)
  const displayData = todayLog || template;

  // (ใหม่) แยก Logic การแสดงผล
  const renderLogText = (data, isTemplate = false) => {
    const sets = isTemplate ? data.templateSets : data.sets;
    const reps = isTemplate ? data.templateReps : data.reps;
    const weight = isTemplate ? data.templateWeight : data.weight;
    const duration = isTemplate ? data.templateDuration : data.duration;

    if (isTimeBased) {
      // (ใหม่) ถ้าเป็น Time + Sets (เช่น Plank)
      if (sets) {
        return `${sets} เซ็ต x ${duration} นาที`;
      }
      // (เดิม) ถ้าเป็น Time Only (เช่น Running)
      return `${duration} นาที`;
    }

    // (เดิม) ถ้าเป็น Reps
    return `${sets} เซ็ต x ${reps} ครั้ง @ ${weight} kg`;
  };

  const displayLog = renderLogText(todayLog || template, !todayLog);
  const lastLogText = lastLog ? renderLogText(lastLog, false) : null;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>{details.name}</h3>
        <button onClick={onEditLog} style={styles.editLogButton}>
          <Edit size={16} /> {todayLog ? "แก้ไข" : "บันทึก"}
        </button>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.logRow}>
          <Dumbbell size={16} color="#aaa" />
          <span style={styles.logText}>{displayLog}</span>
        </div>
        {lastLogText && (
          <div
            style={styles.logRow}
            title={`(ข้อมูลจาก: ${new Date(lastLog.date).toLocaleDateString(
              "th-TH"
            )})`}
          >
            <History size={16} color="#64cfff" />
            <span style={styles.logTextLast}>ครั้งก่อน: {lastLogText}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// === (อัปเดต) Component: Modal แก้ไข Log ===
function LogEditModal({ workout, onClose, todayDate }) {
  const { template, details, todayLog } = workout;
  const isTimeBased = details.type === "time";

  // (ใหม่) เช็คว่ามี Sets หรือไม่
  const hasSets = isTimeBased ? !!template.templateSets : true;

  // (ตั้งค่าเริ่มต้น: ถ้ามี Log วันนี้, ใช้ค่านั้น. ถ้าไม่มี, ใช้ค่า Template)
  const [sets, setSets] = useState(
    todayLog?.sets || template.templateSets || ""
  );
  const [reps, setReps] = useState(
    todayLog?.reps || template.templateReps || ""
  );
  const [weight, setWeight] = useState(
    todayLog?.weight || template.templateWeight || ""
  );
  const [duration, setDuration] = useState(
    todayLog?.duration || template.templateDuration || ""
  );

  const handleSave = async () => {
    try {
      const logData = {
        date: todayDate,
        exerciseMasterId: details.id,
        // (อัปเดต)
        sets: hasSets ? Number(sets) : null,
        reps: isTimeBased ? null : String(reps),
        weight: isTimeBased ? null : Number(weight),
        duration: isTimeBased ? Number(duration) : null,
      };

      if (todayLog) {
        await db.exerciseLog.update(todayLog.id, logData);
      } else {
        await db.exerciseLog.add(logData);
      }
      onClose();
    } catch (e) {
      console.error("Failed to save exercise log:", e);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>บันทึก: {details.name}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          {/* (อัปเดต) ถ้าเป็น Time (ไม่ว่าจะมี Set หรือไม่) */}
          {isTimeBased && (
            <div style={styles.grid2}>
              {/* (ใหม่) ถ้ามี Set ให้โชว์ช่อง Set */}
              {hasSets && (
                <div style={styles.inputGroup}>
                  <label>จำนวนเซ็ต</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    style={styles.input}
                  />
                </div>
              )}
              <div style={styles.inputGroup}>
                <label>จำนวนนาที (รวม)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {/* (อัปเดต) ถ้าเป็น Reps (เหมือนเดิม) */}
          {!isTimeBased && (
            <>
              <div style={styles.grid3}>
                <div style={styles.inputGroup}>
                  <label>จำนวนเซ็ต</label>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
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
                    placeholder="เช่น 10,9,8"
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
              <p style={styles.helpText}>
                *หมายเหตุ: คุณสามารถใส่ "จำนวนครั้ง" เป็น (เช่น "10,9,8")
                เพื่อบันทึกแต่ละเซ็ตได้
              </p>
            </>
          )}
          <button onClick={handleSave} style={styles.saveButton}>
            <Save size={18} /> บันทึก Log
          </button>
        </div>
      </div>
    </div>
  );
}

// === CSS Styles (อัปเดต) ===
const styles = {
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
    marginRight: "10px",
    cursor: "pointer",
    display: "flex",
  },
  title: {
    margin: 0,
    fontSize: "1.2rem",
    flexGrow: 1,
  },
  settingsButton: {
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
    flexShrink: 0,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#555",
    marginTop: "50px",
    textAlign: "center",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    borderLeft: "4px solid #c0392b",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: "10px 15px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.1rem",
  },
  editLogButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "1px solid #64cfff",
    color: "#64cfff",
    padding: "5px 8px",
    borderRadius: "5px",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  cardBody: {
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  logRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logText: {
    fontSize: "1rem",
    fontWeight: "bold",
  },
  logTextLast: {
    fontSize: "0.9rem",
    color: "#64cfff",
    fontStyle: "italic",
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
  helpText: {
    fontSize: "0.8rem",
    color: "#888",
    margin: 0,
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
  // (CSS สำหรับ Modal 'AddExerciseModal')
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
  newExerciseForm: {
    border: "1px solid #444",
    borderRadius: "5px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    backgroundColor: "#333",
  },
  // (CSS สำหรับ Modal 'ManageMasterListModal')
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
};

export default ExercisePage;
