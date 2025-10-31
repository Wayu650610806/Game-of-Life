// src/components/layout/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Menu, Mail, Coins } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db"; // <-- 1. IMPORT db

function Header({ user, onMenuClick }) {
  // 2. ดึงข้อมูล "สด" ของผู้ใช้ (สำหรับเงิน)
  const liveUser = useLiveQuery(() => db.userProfile.get(user.id), [user.id]);

  // === 3. START CHANGE: นับข้อความที่ยังไม่อ่าน ===
  const unreadCount = useLiveQuery(
    () => db.mailbox.where("isRead").equals(0).count(),
    0 // ค่าเริ่มต้นคือ 0
  );
  // === END CHANGE ===

  const currentUser = liveUser || user;

  return (
    <header style={styles.header}>
      <div className="header-left">
        <button onClick={onMenuClick} style={styles.iconButton}>
          <Menu size={28} />
        </button>
      </div>

      <div className="header-center">
        <div style={styles.userInfo}>
          <span style={styles.userName}>{currentUser.name}</span>
          <span style={styles.userLevel}>LV: {currentUser.level}</span>
        </div>
      </div>

      <div style={styles.headerRight}>
        {/* === START CHANGE: ใช้ style จาก object === */}
        <Link to="/shop" style={styles.moneyLink}>
          <Coins size={20} color="#FFD700" />
          <span>{currentUser.money}</span>
        </Link>

        {/* 4. ใส่จุดแดง */}
        <Link to="/mailbox" style={styles.mailLink}>
          <Mail size={24} />
          {unreadCount > 0 && <span style={styles.notificationDot}></span>}
        </Link>
        {/* === END CHANGE === */}
      </div>
    </header>
  );
}

// === 5. START CHANGE: เพิ่ม CSS Styles Object ===
const styles = {
  header: {
    flexShrink: 0,
    backgroundColor: "#333",
    color: "white",
    padding: "10px 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    height: "50px",
    boxSizing: "border-box",
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
    display: "flex", // ช่วยจัด alignment
  },
  headerCenter: {
    flexGrow: 1,
    minWidth: 0,
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
    lineHeight: "1.1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userName: {
    fontWeight: "bold",
  },
  userLevel: {
    fontSize: "0.8rem",
    color: "#aaa",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  moneyLink: {
    textDecoration: "none",
    color: "white",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  // Style สำหรับไอคอน Mail
  mailLink: {
    position: "relative", // (สำคัญ) เพื่อให้จุดแดงลอยทับได้
    color: "white",
    padding: 0,
    lineHeight: 0, // ช่วยจัด alignment
    display: "flex",
  },
  // Style สำหรับจุดแดง
  notificationDot: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    width: "10px",
    height: "10px",
    backgroundColor: "#ff3b30", // สีแดงสด
    borderRadius: "50%",
    border: "2px solid #333", // ขอบสีเดียวกับพื้นหลัง
  },
};
// === END CHANGE ===

export default Header;
