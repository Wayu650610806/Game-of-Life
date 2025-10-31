// src/pages/EditRoutine.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link } from "react-router-dom";
import { Cog } from "lucide-react";

const daysOfWeek = [
  { key: "monday", name: "จันทร์" },
  { key: "tuesday", name: "อังคาร" },
  { key: "wednesday", name: "พุธ" },
  { key: "thursday", name: "พฤหัสบดี" },
  { key: "friday", name: "ศุกร์" },
  { key: "saturday", name: "เสาร์" },
  { key: "sunday", name: "อาทิตย์" },
];

function EditRoutine() {
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[0].key); // เริ่มที่วันจันทร์

  // 1. ดึง "เทมเพลต" ทั้งหมดที่มี
  const routineSets = useLiveQuery(() => db.routineSets.toArray(), []);

  // 2. ดึง "ตาราง" ทั้งหมด (ว่าวันไหน ใช้อะไร)
  const dailyRoutines = useLiveQuery(() => db.dailyRoutines.toArray(), []);

  // 3. หาว่าวันที่เราเลือก (selectedDay) ถูกตั้งค่าไว้ว่าใช้ Set ID อะไร
  const assignedSetId =
    dailyRoutines?.find((r) => r.dayOfWeek === selectedDay)?.routineSetId ||
    "none";

  // ฟังก์ชันสำหรับบันทึกการจับคู่
  const handleAssignSet = async (e) => {
    const setId = e.target.value;

    try {
      if (setId === "none") {
        // ถ้าเลือก "ไม่มี" ให้ลบออกจากตาราง
        await db.dailyRoutines.delete(selectedDay);
      } else {
        // ถ้าเลือก Set อื่น ให้ "เพิ่ม หรือ อัปเดต" (put)
        await db.dailyRoutines.put({
          dayOfWeek: selectedDay,
          routineSetId: parseInt(setId, 10), // แปลงเป็นตัวเลข
        });
      }
    } catch (error) {
      console.error("Failed to assign routine set:", error);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>ตั้งค่า Routine 7 วัน</h2>
        {/* ลิงก์ไปหน้า "จัดการเทมเพลต" */}
        <Link to="/routine-set-manager" style={styles.manageButton}>
          <Cog size={20} />
          <span>จัดการ Routine Sets</span>
        </Link>
      </div>

      {/* --- 1. ส่วนเลือกวัน --- */}
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

      {/* --- 2. ส่วนเลือก Set ให้วันนั้น --- */}
      <div style={styles.assignmentBox}>
        <h3>
          สำหรับ:{" "}
          <span style={{ color: "#64cfff" }}>
            {daysOfWeek.find((d) => d.key === selectedDay).name}
          </span>
        </h3>

        <label
          htmlFor="set-selector"
          style={{ display: "block", marginBottom: "10px" }}
        >
          เลือก Routine Set ที่จะใช้:
        </label>

        {/* Dropdown ที่ดึงข้อมูลจาก DB */}
        <select
          id="set-selector"
          style={styles.select}
          value={assignedSetId}
          onChange={handleAssignSet}
        >
          <option value="none">-- ไม่ใช้งาน --</option>
          {routineSets && routineSets.length > 0 ? (
            routineSets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              ยังไม่มี Routine Set
            </option>
          )}
        </select>

        <p style={styles.helpText}>
          คุณสามารถ "สร้าง" หรือ "แก้ไข" กิจกรรมใน Routine Set ได้ที่หน้า
          "จัดการ Routine Sets" (ปุ่ม ⚙️ ด้านบน)
        </p>
      </div>
    </div>
  );
}

// === CSS Styles ===
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
  },
  daySelector: {
    display: "flex",
    overflowX: "auto", // ทำให้เลื่อนซ้ายขวาได้บนมือถือ
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

export default EditRoutine;
