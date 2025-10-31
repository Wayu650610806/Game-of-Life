// src/pages/RoutineSetEditor.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Plus, Trash2, X, AlertTriangle, ArrowLeft } from "lucide-react";

// === Helper Function: ตรวจสอบเวลาทับซ้อน ===
/**
 * @param {string} start1 - "HH:mm"
 * @param {string} end1 - "HH:mm"
 * @param {string} start2 - "HH:mm"
 * @param {string} end2 - "HH:mm"
 * @returns {boolean} - true ถ้าทับซ้อน
 */
const checkOverlap = (start1, end1, start2, end2) => {
  // ตรรกะคือ: (StartA < EndB) และ (EndA > StartB)
  return start1 < end2 && end1 > start2;
};

// === Main Component ===
function RoutineSetEditor() {
  const { setId } = useParams(); // ดึง ID จาก URL
  const [isAdding, setIsAdding] = useState(false); // State เปิด/ปิด Modal

  // 1. ดึงข้อมูล Routine Set ที่กำลังแก้ไข
  const routineSet = useLiveQuery(
    () => db.routineSets.get(parseInt(setId, 10)),
    [setId] // dependency
  );

  // 2. ดึง "คลัง" กิจกรรมทั้งหมด (สำหรับ Dropdown)
  const allActivities = useLiveQuery(() => db.activities.toArray(), []);

  // 3. สร้าง State สำหรับเก็บ items (เราจะไม่แก้ routineSet.items ตรงๆ)
  const [items, setItems] = useState([]);

  // 4. เมื่อ routineSet โหลดเสร็จ ให้คัดลอก items มาใส่ State
  useEffect(() => {
    if (routineSet) {
      // เรียงตามเวลาเริ่มก่อน
      const sortedItems = [...routineSet.items].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
      setItems(sortedItems);
    }
  }, [routineSet]); // ทำงานใหม่เมื่อ routineSet เปลี่ยน

  // === 5. Logic การจัดการ ===

  // ลบ item ออกจาก Set
  const handleDeleteItem = async (indexToDelete) => {
    if (!window.confirm("ลบกิจกรรมนี้ออกจาก Set?")) return;

    try {
      const newItems = items.filter((_, index) => index !== indexToDelete);
      setItems(newItems); // อัปเดต UI ทันที

      // บันทึกลง DB
      await db.routineSets.update(parseInt(setId, 10), { items: newItems });
    } catch (error) {
      console.error("Failed to delete item from set:", error);
    }
  };

  // เมื่อ Modal "AddActivityModal" บันทึกสำเร็จ
  const handleSaveNewItem = (newItemList) => {
    // อัปเดต State (และ UI)
    const sortedItems = [...newItemList].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    setItems(sortedItems);
    setIsAdding(false); // ปิด Modal
  };

  if (!routineSet || !allActivities) {
    return <div>กำลังโหลด...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <Link to="/routine-set-manager" style={styles.backButton}>
          <ArrowLeft size={20} />
        </Link>
        <h2 style={styles.title}>{routineSet.name}</h2>
        <button onClick={() => setIsAdding(true)} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>

      {/* --- รายการกิจกรรมใน Set นี้ --- */}
      <div style={styles.list}>
        {items.length > 0 ? (
          items.map((item, index) => {
            // หาชื่อ Activity จากคลัง
            const activity = allActivities.find(
              (a) => a.id === item.activityId
            );
            return (
              <div key={index} style={styles.listItem}>
                <div style={styles.timeGroup}>
                  <span style={styles.time}>{item.startTime}</span>
                  <span style={styles.timeSeparator}>-</span>
                  <span style={styles.time}>{item.endTime}</span>
                </div>
                <div style={styles.activityDetails}>
                  <span style={styles.activityName}>
                    {activity ? activity.name : "N/A"}
                  </span>
                  <span style={styles.activityLevel}>
                    LV: {activity ? activity.level : 0}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteItem(index)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })
        ) : (
          <p style={styles.emptyText}>
            ยังไม่มีกิจกรรมใน Set นี้
            <br />
            กดปุ่ม (+) เพื่อเพิ่ม
          </p>
        )}
      </div>

      {/* --- Modal สำหรับเพิ่มกิจกรรม --- */}
      {isAdding && (
        <AddActivityModal
          onClose={() => setIsAdding(false)}
          currentSetId={parseInt(setId, 10)}
          currentItems={items} // ส่ง items ปัจจุบันไปเช็คเวลาทับซ้อน
          allActivities={allActivities} // ส่งคลังกิจกรรมไปให้ Dropdown
          onSave={handleSaveNewItem} // ส่งฟังก์ชัน Callback
        />
      )}
    </div>
  );
}

// =======================================================
// === Component ย่อย: Modal สำหรับเพิ่ม/สร้าง กิจกรรม ===
// =======================================================
function AddActivityModal({
  onClose,
  currentSetId,
  currentItems,
  allActivities,
  onSave,
}) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [newActivityName, setNewActivityName] = useState("");
  const [error, setError] = useState(null);

  // ฟังก์ชันหลัก: เมื่อกดปุ่ม "บันทึก"
  const handleSubmit = async () => {
    setError(null); // เคลียร์ error เก่า

    // --- 1. ตรวจสอบ Input พื้นฐาน ---
    if (!startTime || !endTime) {
      setError("กรุณาใส่เวลาเริ่มและเวลาเสร็จ");
      return;
    }
    if (startTime >= endTime) {
      setError("เวลาเริ่ม ต้องมาก่อน เวลาเสร็จ");
      return;
    }
    if (!selectedActivityId) {
      setError("กรุณาเลือกกิจกรรม");
      return;
    }

    let activityToSaveId = parseInt(selectedActivityId, 10);

    // --- 2. ตรวจสอบว่าเป็นการ "สร้างใหม่" หรือไม่ ---
    if (selectedActivityId === "NEW") {
      if (!newActivityName.trim()) {
        setError("กรุณาตั้งชื่อกิจกรรมใหม่");
        return;
      }
      try {
        // เพิ่มกิจกรรมใหม่ลง "คลัง" (lv 0)
        const newId = await db.activities.add({
          name: newActivityName.trim(),
          level: 0,
        });
        activityToSaveId = newId; // ใช้ ID ใหม่นี้
      } catch (error) {
        console.error("Failed to create new activity:", error);
        setError("ไม่สามารถสร้างกิจกรรมใหม่ได้");
        return;
      }
    }

    // --- 3. ตรวจสอบ "เวลาทับซ้อน" ---
    for (const item of currentItems) {
      if (checkOverlap(startTime, endTime, item.startTime, item.endTime)) {
        const conflictingActivity = allActivities.find(
          (a) => a.id === item.activityId
        );
        setError(
          `เวลาทับซ้อนกับ: ${conflictingActivity.name} (${item.startTime} - ${item.endTime})`
        );
        return;
      }
    }

    // --- 4. บันทึก (ถ้าผ่านทั้งหมด) ---
    try {
      const newItem = {
        activityId: activityToSaveId,
        startTime: startTime,
        endTime: endTime,
      };

      const newItemsList = [...currentItems, newItem];

      // อัปเดต DB
      await db.routineSets.update(currentSetId, { items: newItemsList });

      // ส่งรายการใหม่กลับไปหน้าหลัก
      onSave(newItemsList);
    } catch (error) {
      console.error("Failed to save item to set:", error);
      setError("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>เพิ่มกิจกรรม</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.modalForm}>
          {/* --- ส่วนเวลา --- */}
          <div style={styles.timeInputGroup}>
            <div style={styles.inputGroup}>
              <label>เวลาเริ่ม (24hr)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>เวลาเสร็จ (24hr)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {/* --- ส่วนเลือกกิจกรรม --- */}
          <div style={styles.inputGroup}>
            <label>เลือกกิจกรรม</label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              style={styles.select}
            >
              <option value="" disabled>
                -- เลือก --
              </option>
              {allActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name} (Lv: {act.level})
                </option>
              ))}
              <option
                value="NEW"
                style={{ color: "#64cfff", fontWeight: "bold" }}
              >
                -- สร้างกิจกรรมใหม่ --
              </option>
            </select>
          </div>

          {/* --- ส่วนสร้างกิจกรรมใหม่ (ถ้าเลือก "NEW") --- */}
          {selectedActivityId === "NEW" && (
            <div style={styles.inputGroup}>
              <label>ชื่อกิจกรรมใหม่ (จะเริ่มที่ Lv 0)</label>
              <input
                type="text"
                value={newActivityName}
                onChange={(e) => setNewActivityName(e.target.value)}
                style={styles.input}
                placeholder="เช่น: ออกกำลังกาย"
              />
            </div>
          )}

          {/* --- ส่วนแสดง Error --- */}
          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* --- ปุ่ม --- */}
          <button onClick={handleSubmit} style={styles.saveButton}>
            <Plus size={18} /> บันทึก
          </button>
        </div>
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
    paddingBottom: "10px",
    marginBottom: "15px",
    borderBottom: "1px solid #444",
  },
  backButton: {
    color: "white",
    padding: "8px",
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
    padding: "10px",
    borderRadius: "8px",
  },
  timeGroup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#333",
    padding: "5px 8px",
    borderRadius: "5px",
    width: "50px", // กว้างคงที่
  },
  time: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "white",
  },
  timeSeparator: {
    fontSize: "0.7rem",
    color: "#888",
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
  activityLevel: {
    fontSize: "0.8rem",
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
  // Modal Styles
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
    marginBottom: "20px",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
  },
  modalForm: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  timeInputGroup: { display: "flex", gap: "10px", width: "100%" },
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
};

export default RoutineSetEditor;
