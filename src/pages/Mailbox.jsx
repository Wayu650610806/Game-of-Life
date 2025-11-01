// src/pages/Mailbox.jsx
import React, { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
// === 1. START CHANGE: Import ไอคอนใหม่ ===
import {
  Trash2,
  AlertTriangle,
  Inbox,
  ShieldX,
  Check,
  X,
  HelpCircle,
  PartyPopper,
} from "lucide-react";
// === END CHANGE ===

// (Helper Function)
const getRewardMultiplier = (activityLevel) => {
  const baseMin = 10;
  const baseMax = 15;
  const levelCap = 100;
  const currentLevel = Math.min(activityLevel, levelCap);
  const minReward = Math.floor(
    baseMin + (baseMax - baseMin) * (currentLevel / levelCap)
  );
  return Math.floor(Math.random() * (baseMax - minReward + 1)) + minReward;
};

function Mailbox() {
  // 1. ดึงข้อมูล
  const messages = useLiveQuery(
    () => db.mailbox.orderBy("timestamp").reverse().toArray(),
    []
  );
  // (ใหม่) ดึงข้อมูลที่จำเป็นสำหรับ Logic
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const penalties = useLiveQuery(() => db.penalties.toArray());
  const activities = useLiveQuery(() => db.activities.toArray());

  // 2. (อัปเดต) มาร์คว่าอ่านแล้ว
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        const unreadMessageIds = await db.mailbox
          .where("isRead")
          .equals(0)
          .primaryKeys();

        if (unreadMessageIds.length > 0) {
          await db.mailbox.bulkUpdate(
            unreadMessageIds.map((id) => ({ key: id, changes: { isRead: 1 } }))
          );
        }
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    };

    // (หน่วงเวลาเล็กน้อย)
    setTimeout(markAllAsRead, 1000);
  }, []);

  // === 3. (ใหม่) Logic ปุ่มกดยืนยัน ===

  // 3a. กดยืนยัน (สำเร็จ)
  const handleConfirm = async (msg) => {
    if (!user) return;

    try {
      if (msg.type === "pending-activity") {
        // --- สำเร็จ (Activity) ---
        // (Logic คัดลอกมาจาก Home.jsx)
        const activity = activities.find((a) => a.id === msg.activityId);
        if (!activity) throw new Error("Activity not found");

        const levelForRewardCalc =
          msg.activityLevel === 0 ? 1 : msg.activityLevel;
        const cappedLevel = Math.min(30, levelForRewardCalc);
        const multiplier = getRewardMultiplier(msg.activityLevel);
        const reward = cappedLevel * multiplier;
        const newLevel = msg.activityLevel + 1;
        const newMoney = user.money + reward;

        // อัปเดต DB
        await db.activities.update(msg.activityId, { level: newLevel });
        await db.userProfile.update(user.id, { money: newMoney });

        // อัปเดต Mailbox
        await db.mailbox.update(msg.id, {
          type: "success-log",
          message: `(สำเร็จ) ${msg.activityName}`,
          levelDrop: -1, // (เครื่องหมายว่า Level Up)
          penaltyName: `+${reward} Coins`,
        });
      } else if (msg.type === "pending-task") {
        // --- สำเร็จ (Task) ---
        const newMoney = user.money + msg.taskReward;
        await db.userProfile.update(user.id, { money: newMoney });

        // อัปเดต Mailbox
        await db.mailbox.update(msg.id, {
          type: "success-log",
          message: `(สำเร็จ) ${msg.activityName}`,
          levelDrop: 0,
          penaltyName: `+${msg.taskReward} Coins`,
        });
      }
    } catch (error) {
      console.error("Failed to confirm success:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // 3b. กดยอมรับ (ไม่สำเร็จ)
  const handleReject = async (msg) => {
    if (!penalties || !activities) return;

    try {
      if (msg.type === "pending-activity") {
        // --- ไม่สำเร็จ (Activity) ---
        const activity = activities.find((a) => a.id === msg.activityId);
        if (!activity) throw new Error("Activity not found");

        const levelDrop = Math.ceil(msg.activityLevel / 3);
        const newLevel = Math.max(0, msg.activityLevel - levelDrop);
        const randomPenalty =
          penalties.length > 0
            ? penalties[Math.floor(Math.random() * penalties.length)]
            : { name: "N/A" };

        // อัปเดต DB
        await db.activities.update(msg.activityId, { level: newLevel });

        // อัปเดต Mailbox
        await db.mailbox.update(msg.id, {
          type: "fail-log",
          message: `(ไม่สำเร็จ) ${msg.activityName}`,
          levelDrop: levelDrop,
          penaltyName: randomPenalty.name,
        });
      } else if (msg.type === "pending-task") {
        // --- ไม่สำเร็จ (Task) ---
        // (ไม่ลดเลเวล แต่ใช้ Penalty ที่เก็บมา)
        await db.mailbox.update(msg.id, {
          type: "fail-log",
          message: `(ไม่สำเร็จ) ${msg.activityName}`,
          levelDrop: 0,
          penaltyName: msg.taskPenalty,
        });
      }
    } catch (error) {
      console.error("Failed to confirm failure:", error);
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  };

  // 3c. ลบข้อความ
  const handleDelete = async (id) => {
    await db.mailbox.delete(id);
  };

  // 3d. ลบทั้งหมด
  const handleClearAll = async () => {
    if (window.confirm('คุณต้องการลบข้อความ "ที่อ่านแล้ว" ทั้งหมดหรือไม่?')) {
      // (ลบเฉพาะ Log, ไม่ลบ Pending)
      await db.mailbox
        .where("type")
        .notEqual("pending-activity")
        .and((item) => item.type !== "pending-task")
        .delete();
    }
  };

  // (Helper สำหรับแสดงผล)
  const renderMessageContent = (msg) => {
    // 1. ถ้าเป็น "รอยืนยัน" (Pending)
    if (msg.type === "pending-activity" || msg.type === "pending-task") {
      return (
        <>
          <strong style={styles.messageTitlePending}>{msg.message}</strong>
          <span style={styles.messageTime}>
            (กิจกรรมเวลา: {msg.activityStartTime} - {msg.activityEndTime})
          </span>
          {/* (ใหม่) ปุ่มกด */}
          <div style={styles.actionButtons}>
            <button
              onClick={() => handleConfirm(msg)}
              style={styles.confirmButton}
            >
              <Check size={16} /> สำเร็จ
            </button>
            <button
              onClick={() => handleReject(msg)}
              style={styles.rejectButton}
            >
              <X size={16} /> ไม่สำเร็จ
            </button>
          </div>
        </>
      );
    }

    // 2. ถ้าเป็น "Log" (สำเร็จ / ไม่สำเร็จ)
    const isSuccess = msg.type === "success-log";
    return (
      <>
        <strong
          style={
            isSuccess ? styles.messageTitleSuccess : styles.messageTitleFail
          }
        >
          {msg.message}
        </strong>
        {isSuccess ? (
          // (Log สำเร็จ)
          <span style={styles.messageDetail}>
            {msg.levelDrop === -1 ? `(Level Up!)` : ""} {msg.penaltyName}
          </span>
        ) : (
          // (Log ล้มเหลว)
          <>
            {msg.levelDrop > 0 && (
              <span style={styles.messageDetail}>
                {msg.activityName} (ลด {msg.levelDrop} LV)
              </span>
            )}
            <span style={styles.messageDetail}>บทลงโทษ: {msg.penaltyName}</span>
          </>
        )}
      </>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>กล่องจดหมาย</h2>
        {messages && messages.length > 0 && (
          <button onClick={handleClearAll} style={styles.clearButton}>
            <ShieldX size={16} />
            <span>ล้าง Log</span>
          </button>
        )}
      </div>

      <div style={styles.list}>
        {!messages ? (
          <p>กำลังโหลด...</p>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <Inbox size={48} color="#555" />
            <p>กล่องจดหมายว่างเปล่า</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.messageItem,
                backgroundColor: msg.isRead === 0 ? "#3a3a3a" : "#2a2a2a",
                borderColor: msg.type.includes("pending")
                  ? "#FFD700"
                  : msg.type.includes("success")
                  ? "#64ff64"
                  : msg.type.includes("fail")
                  ? "#ffaaaa"
                  : "#444",
              }}
            >
              <div style={styles.messageIcon}>
                {msg.type.includes("pending") ? (
                  <HelpCircle size={24} color="#FFD700" />
                ) : msg.type.includes("success") ? (
                  <PartyPopper size={24} color="#64ff64" />
                ) : (
                  <AlertTriangle size={24} color="#ffaaaa" />
                )}
              </div>

              {/* (เนื้อหา + ปุ่ม) */}
              <div style={styles.messageContent}>
                {renderMessageContent(msg)}
              </div>

              <button
                onClick={() => handleDelete(msg.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
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
  clearButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "#5c3a3a",
    color: "#ffaaaa",
    border: "1px solid #ffaaaa",
    padding: "5px 10px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#555",
    marginTop: "50px",
  },
  messageItem: {
    display: "flex",
    gap: "10px",
    padding: "10px",
    borderRadius: "8px",
    transition: "background-color 0.3s",
    borderLeft: "4px solid", // (ใหม่)
  },
  messageIcon: {
    padding: "5px",
    flexShrink: 0,
  },
  messageContent: {
    display: "flex",
    flexDirection: "column",
    gap: "5px", // (เพิ่ม Gap)
    flexGrow: 1,
  },
  messageTime: {
    fontSize: "0.8rem",
    color: "#888",
  },
  messageTitlePending: {
    fontSize: "1rem",
    color: "#FFD700",
    fontWeight: "bold",
  },
  messageTitleSuccess: {
    fontSize: "1rem",
    color: "#64ff64",
    fontStyle: "italic",
  },
  messageTitleFail: {
    fontSize: "1rem",
    color: "#ffaaaa",
    fontStyle: "italic",
  },
  messageDetail: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    padding: "5px",
    alignSelf: "flex-start", // (ใหม่)
  },
  // (ใหม่) Action Buttons
  actionButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "5px",
  },
  confirmButton: {
    background: "#3a8b3a",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.9rem",
  },
  rejectButton: {
    background: "#c0392b",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.9rem",
  },
};

export default Mailbox;
