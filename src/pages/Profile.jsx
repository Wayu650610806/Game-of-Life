// src/pages/Profile.jsx
import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, calculateLevel } from "../db";
import { Link } from "react-router-dom";
import { Edit, Save, X, ChevronRight, Trash2 } from "lucide-react"; // <-- 1. IMPORT Trash2

// === React Component ===
function Profile() {
  // --- 1. ดึงข้อมูล ---
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const allDreams = useLiveQuery(() => db.dreams.toArray(), []);
  const allActivities = useLiveQuery(() => db.activities.toArray(), []);

  // --- 2. States ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBirthday, setEditBirthday] = useState("");

  // --- 3. Logic การแก้ไขโปรไฟล์ ---
  const handleEditToggle = () => {
    if (user) {
      setEditName(user.name);
      setEditBirthday(user.birthday);
      setIsEditing(true);
    }
  };
  const handleSaveProfile = async () => {
    if (!editName || !editBirthday) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    const newLevel = calculateLevel(editBirthday);
    try {
      await db.userProfile.update(user.id, {
        name: editName,
        birthday: editBirthday,
        level: newLevel,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  // --- 4. Logic Dream List ---
  const { completedCount, totalCount } = useMemo(() => {
    if (!allDreams) return { completedCount: 0, totalCount: 0 };
    const completed = allDreams.filter((d) => d.status === "complete").length;
    return { completedCount: completed, totalCount: allDreams.length };
  }, [allDreams]);

  // === 5. START CHANGE: Logic ลบ Activity ===
  const handleDeleteActivity = async (id, name) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกิจกรรม "${name}"?`)) {
      return;
    }

    try {
      // 1. ตรวจสอบว่ามี Routine Set ไหนใช้อยู่หรือไม่
      const setsUsingThis = await db.routineSets
        .filter((set) => set.items.some((item) => item.activityId === id))
        .toArray();

      if (setsUsingThis.length > 0) {
        // 2. ถ้ามีคนใช้ ให้แจ้งเตือนและไม่ลบ
        const setNames = setsUsingThis.map((s) => s.name).join(", ");
        alert(`ไม่สามารถลบได้: กิจกรรมนี้ถูกใช้งานใน Routine Set: ${setNames}`);
        return;
      }

      // 3. ถ้าไม่มีคนใช้ ลบได้เลย
      await db.activities.delete(id);
    } catch (error) {
      console.error("Failed to delete activity:", error);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };
  // === END CHANGE ===

  if (!user) {
    return <div>กำลังโหลดข้อมูลโปรไฟล์...</div>;
  }

  return (
    <div style={styles.page}>
      {/* --- ส่วนที่ 1: ข้อมูลโปรไฟล์ --- */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>โปรไฟล์</h2>
        {/* (โค้ดส่วนนี้เหมือนเดิม) */}
        {!isEditing ? (
          <div style={styles.profileView}>
            <div style={styles.profileInfo}>
              <p>
                <strong>ชื่อ:</strong> {user.name}
              </p>
              <p>
                <strong>Level:</strong> {user.level}
              </p>
              <p>
                <strong>วันเกิด:</strong> {user.birthday}
              </p>
            </div>
            <button onClick={handleEditToggle} style={styles.editButton}>
              <Edit size={18} />
            </button>
          </div>
        ) : (
          <div style={styles.profileEdit}>
            <div style={styles.inputGroup}>
              <label>ชื่อ:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label>วันเกิด:</label>
              <input
                type="date"
                value={editBirthday}
                onChange={(e) => setEditBirthday(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => setIsEditing(false)}
                style={styles.cancelButton}
              >
                <X size={18} /> ยกเลิก
              </button>
              <button onClick={handleSaveProfile} style={styles.saveButton}>
                <Save size={18} /> บันทึก
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- ส่วนที่ 2: Dream List (เหมือนเดิม) --- */}
      <Link to="/dreams" style={styles.dreamLink}>
        <div style={styles.section} className="dream-list-link">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Dream List ({completedCount} / {totalCount})
            </h2>
            <ChevronRight size={24} color="#888" />
          </div>
        </div>
      </Link>

      {/* --- ส่วนที่ 3: Activity Levels --- */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>เลเวลกิจกรรม</h2>
        <div style={styles.activityList}>
          {allActivities && allActivities.length > 0 ? (
            allActivities.map((activity) => (
              // === START CHANGE: เพิ่มปุ่มลบ ===
              <div key={activity.id} style={styles.activityItem}>
                <div style={styles.activityItemInfo}>
                  <span>{activity.name}</span>
                  <span style={styles.activityItemLevel}>
                    LV: {activity.level}
                  </span>
                </div>
                <button
                  onClick={() =>
                    handleDeleteActivity(activity.id, activity.name)
                  }
                  style={styles.deleteButton}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              // === END CHANGE ===
            ))
          ) : (
            <p style={styles.emptyText}>ยังไม่มีกิจกรรม</p>
          )}
        </div>
      </div>
    </div>
  );
}

// === CSS Styles Object (อัปเดต) ===
const styles = {
  page: {
    padding: "10px",
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    transition: "background-color 0.2s",
  },
  dreamLink: {
    textDecoration: "none",
    color: "inherit",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem",
  },
  profileView: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileInfo: {
    lineHeight: "1.4",
  },
  editButton: {
    background: "none",
    border: "1px solid #646cff",
    color: "#646cff",
    padding: "8px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  profileEdit: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
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
  buttonGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
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
    gap: "5px",
  },
  cancelButton: {
    background: "#555",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "200px",
    overflowY: "auto",
  },
  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: "10px",
    borderRadius: "5px",
  },
  // === START CHANGE: CSS สำหรับส่วน Activity Item ===
  activityItemInfo: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  activityItemLevel: {
    fontSize: "0.8rem",
    color: "#aaa",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: "5px",
    flexShrink: 0,
  },
  // === END CHANGE ===
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "10px",
  },
};

export default Profile;
