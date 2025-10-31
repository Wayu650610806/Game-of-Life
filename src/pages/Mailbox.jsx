// src/pages/Mailbox.jsx
import React, { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Trash2, AlertTriangle, Inbox, ShieldX } from "lucide-react";

function Mailbox() {
  const messages = useLiveQuery(
    () => db.mailbox.orderBy("timestamp").reverse().toArray(),
    []
  );

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
    markAllAsRead();
  }, []);

  const handleDelete = async (id) => {
    await db.mailbox.delete(id);
  };

  const handleClearAll = async () => {
    if (window.confirm("คุณต้องการลบข้อความทั้งหมดหรือไม่?")) {
      await db.mailbox.clear();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>กล่องจดหมาย</h2>
        {messages && messages.length > 0 && (
          <button onClick={handleClearAll} style={styles.clearButton}>
            <ShieldX size={16} />
            <span>ลบทั้งหมด</span>
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
              }}
            >
              <div style={styles.messageIcon}>
                <AlertTriangle
                  size={24}
                  color={msg.isRead === 0 ? "#ffcccc" : "#ffaaaa"}
                />
              </div>
              <div style={styles.messageContent}>
                {/* === แสดงเวลาของกิจกรรม === */}
                <span style={styles.messageTime}>
                  {/*
                   * ถ้ามีเวลาของกิจกรรม (ข้อมูลใหม่ v.4) ให้แสดงเวลานั้น
                   * ถ้าไม่มี (ข้อมูลเก่า) ให้แสดงเวลาที่แจ้งเตือน (timestamp)
                   */}
                  {msg.activityStartTime
                    ? `กิจกรรมเวลา: ${msg.activityStartTime} - ${msg.activityEndTime}`
                    : new Date(msg.timestamp).toLocaleString("th-TH")}
                </span>

                <strong
                  style={{
                    ...styles.messageTitle,
                    color: msg.isRead === 0 ? "#ffcccc" : "#ffaaaa",
                  }}
                >
                  {msg.message}
                </strong>
                <span style={styles.messageDetail}>
                  {msg.activityName} (ลด {msg.levelDrop} LV)
                </span>
                <span style={styles.messageDetail}>
                  บทลงโทษ: {msg.penaltyName}
                </span>
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

// === CSS Styles (เหมือนเดิม) ===
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
  },
  messageIcon: {
    padding: "5px",
    flexShrink: 0,
  },
  messageContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flexGrow: 1,
  },
  messageTime: {
    fontSize: "0.8rem",
    color: "#888",
  },
  messageTitle: {
    fontSize: "1rem",
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
  },
};

export default Mailbox;
