// src/pages/ExerciseSettings.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link, useNavigate } from "react-router-dom";
import { Cog, ArrowLeft } from "lucide-react";

const daysOfWeek = [
  { key: 1, name: "จันทร์" },
  { key: 2, name: "อังคาร" },
  { key: 3, name: "พุธ" },
  { key: 4, name: "พฤหัสบดี" },
  { key: 5, name: "ศุกร์" },
  { key: 6, name: "เสาร์" },
  { key: 0, name: "อาทิตย์" },
];

function ExerciseSettings() {
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0].key);
  const navigate = useNavigate();

  // 1. ดึง "เทมเพลต" ทั้งหมด
  const exerciseSets = useLiveQuery(() => db.exerciseSets.toArray(), []);

  // 2. ดึง "ข้อมูลของวันที่เลือก"
  const dailyRoutine = useLiveQuery(
    () => db.dailyExerciseRoutines.get(selectedDay),
    [selectedDay] // (ดึงใหม่เมื่อ selectedDay เปลี่ยน)
  );

  // 3. หาค่า Set ID (ถ้ามี)
  const assignedSetIdOdd = dailyRoutine?.exerciseSetIdOdd || "none";
  const assignedSetIdEven = dailyRoutine?.exerciseSetIdEven || "none";

  // 4. (อัปเดต) ฟังก์ชันสำหรับบันทึก
  const handleAssignSet = async (e, monthType) => {
    const setId = e.target.value;
    const newId = setId === "none" ? null : parseInt(setId, 10);

    try {
      // (อ่านข้อมูลปัจจุบัน)
      const current = await db.dailyExerciseRoutines.get(selectedDay);

      if (monthType === "odd") {
        await db.dailyExerciseRoutines.put({
          dayOfWeek: selectedDay,
          exerciseSetIdOdd: newId,
          exerciseSetIdEven: current?.exerciseSetIdEven || null, // (คงค่าเดิม)
        });
      } else if (monthType === "even") {
        await db.dailyExerciseRoutines.put({
          dayOfWeek: selectedDay,
          exerciseSetIdOdd: current?.exerciseSetIdOdd || null, // (คงค่าเดิม)
          exerciseSetIdEven: newId,
        });
      }
    } catch (error) {
      console.error("Failed to assign exercise set:", error);
    }
  };

  // (Helper)
  const renderOptions = () => {
    if (!exerciseSets) return null;
    return exerciseSets.map((set) => (
      <option key={set.id} value={set.id}>
        {set.name}
      </option>
    ));
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>Day Scheduler</h2>
        <Link to="/exercise-set-manager" style={styles.manageButton}>
          <Cog size={20} />
          <span>Exercise Sets</span>
        </Link>
      </div>

      {/* --- 1. ส่วนเลือกวัน (เหมือนเดิม) --- */}
      <div style={styles.daySelector}>
        {daysOfWeek.map((day) => (
          <button
            key={day.key}
            style={
              selectedDay === day.key
                ? styles.dayButtonActive
                : styles.dayButton
            }
            onClick={() => setSelectedDay(day.key)}
          >
            {day.name}
          </button>
        ))}
      </div>

      {/* --- 2. START CHANGE: (อัปเดต) ส่วนเลือก Set (มี 2 อัน) --- */}
      <div style={styles.assignmentBox}>
        <h3>
          สำหรับ:{" "}
          <span style={{ color: "#64cfff" }}>
            {daysOfWeek.find((d) => d.key === selectedDay).name}
          </span>
        </h3>

        {/* Dropdown 1: เดือนคี่ */}
        <div style={styles.inputGroup}>
          <label htmlFor="set-selector-odd">
            🗓️ เดือนคี่ (ม.ค., มี.ค., ...)
          </label>
          <select
            id="set-selector-odd"
            style={styles.select}
            value={assignedSetIdOdd}
            onChange={(e) => handleAssignSet(e, "odd")}
          >
            <option value="none">-- ไม่ใช้งาน --</option>
            {renderOptions()}
          </select>
        </div>

        {/* Dropdown 2: เดือนคู่ */}
        <div style={styles.inputGroup}>
          <label htmlFor="set-selector-even">
            🗓️ เดือนคู่ (ก.พ., เม.ย., ...)
          </label>
          <select
            id="set-selector-even"
            style={styles.select}
            value={assignedSetIdEven}
            onChange={(e) => handleAssignSet(e, "even")}
          >
            <option value="none">-- ไม่ใช้งาน --</option>
            {renderOptions()}
          </select>
        </div>

        <p style={styles.helpText}>
          คุณสามารถ "สร้าง" หรือ "แก้ไข" ท่าใน Set ได้ที่หน้า "Exercise Sets"
          (ปุ่ม ⚙️ ด้านบน)
        </p>
      </div>
      {/* === END CHANGE === */}
    </div>
  );
}

// === CSS Styles (อัปเดต) ===
const styles = {
  page: { padding: "10px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "20px",
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
  manageButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#333",
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    fontSize: "0.9rem",
    flexShrink: 0,
  },
  daySelector: {
    display: "flex",
    overflowX: "auto",
    paddingBottom: "10px",
    marginBottom: "20px",
    gap: "5px",
  },
  dayButton: {
    padding: "10px 15px",
    border: "1px solid #555",
    background: "#333",
    color: "white",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.9rem",
    flexShrink: 0,
  },
  dayButtonActive: {
    padding: "10px 15px",
    border: "1px solid #64cfff",
    background: "#64cfff",
    color: "black",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.9rem",
    flexShrink: 0,
    fontWeight: "bold",
  },
  assignmentBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "20px",
    display: "flex", // (ใหม่)
    flexDirection: "column", // (ใหม่)
    gap: "15px", // (ใหม่)
  },
  // (ใหม่)
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  select: {
    width: "100%",
    padding: "12px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  helpText: {
    fontSize: "0.8rem",
    color: "#888",
    marginTop: "15px",
    textAlign: "center",
  },
};

export default ExerciseSettings;
