// src/pages/Penalty.jsx
import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Plus, Trash2, X } from "lucide-react";

// === CSS Styles ===
// เราจะใช้ CSS แบบง่ายๆ ภายในไฟล์นี้เลย เพื่อความสะดวกครับ
const styles = {
  page: {
    padding: "10px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "20px",
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
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: 0,
    display: "flex",
  },
  emptyState: {
    textAlign: "center",
    color: "#888",
    marginTop: "50px",
  },
};

// === React Component ===
function Penalty() {
  const [newPenaltyName, setNewPenaltyName] = useState("");

  // 1. READ: ดึงรายการบทลงโทษทั้งหมดจาก DB (อัปเดตอัตโนมัติ)
  const penalties = useLiveQuery(() => db.penalties.toArray());

  // 2. CREATE: ฟังก์ชันเพิ่มบทลงโทษใหม่
  const handleAddPenalty = async () => {
    // ป้องกันการเพิ่มค่าว่าง
    if (!newPenaltyName.trim()) {
      alert("กรุณากรอกชื่อบทลงโทษ");
      return;
    }

    try {
      await db.penalties.add({
        name: newPenaltyName.trim(),
      });
      // เคลียร์ช่อง input หลังเพิ่มสำเร็จ
      setNewPenaltyName("");
    } catch (error) {
      console.error("Failed to add penalty:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    }
  };

  // 3. DELETE: ฟังก์ชันลบบทลงโทษ (ตาม id)
  const handleDeletePenalty = async (id) => {
    // ยืนยันก่อนลบ
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
      try {
        await db.penalties.delete(id);
      } catch (error) {
        console.error("Failed to delete penalty:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>จัดการบทลงโทษ (Penalty)</h2>
      </div>

      {/* --- ส่วน Input สำหรับเพิ่มรายการ --- */}
      <div style={styles.inputForm}>
        <input
          type="text"
          value={newPenaltyName}
          onChange={(e) => setNewPenaltyName(e.target.value)}
          placeholder="เช่น: วิดพื้น 20 ครั้ง"
          style={styles.input}
          // กด Enter เพื่อเพิ่มได้
          onKeyPress={(e) => e.key === "Enter" && handleAddPenalty()}
        />
        <button onClick={handleAddPenalty} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>

      {/* --- ส่วนแสดงผลรายการ --- */}
      <ul style={styles.list}>
        {/*
         * เราใช้ penalties?.map(...)
         * เครื่องหมาย ? เพื่อป้องกัน error ในกรณีที่ penalties ยังโหลดไม่เสร็จ (เป็น undefined)
         */}
        {penalties && penalties.length > 0 ? (
          penalties.map((penalty) => (
            <li key={penalty.id} style={styles.listItem}>
              <span>{penalty.name}</span>
              <button
                onClick={() => handleDeletePenalty(penalty.id)}
                style={styles.deleteButton}
                title="ลบ"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))
        ) : (
          // กรณีไม่มีข้อมูลใน DB หรือยังโหลดไม่เสร็จ
          <div style={styles.emptyState}>
            {penalties ? (
              <p>
                ยังไม่มีบทลงโทษ
                <br />
                เพิ่มรายการแรกของคุณได้เลย
              </p>
            ) : (
              <p>กำลังโหลด...</p>
            )}
          </div>
        )}
      </ul>
    </div>
  );
}

export default Penalty;
