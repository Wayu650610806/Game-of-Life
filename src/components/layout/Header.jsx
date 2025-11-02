// src/components/layout/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Menu, Mail, Coins } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";

function Header({ user, onMenuClick }) {
  const liveUser = useLiveQuery(() => db.userProfile.get(user.id), [user.id]);

  const unreadCount = useLiveQuery(
    () => db.mailbox.where("isRead").equals(0).count(),
    0
  );

  const currentUser = liveUser || user;

  return (
    <header style={styles.header}>
      <div className="header-left">
        {/* === START CHANGE === */}
        <button
          onClick={onMenuClick}
          style={styles.iconButton}
          aria-label="เมนู"
        >
          <Menu size={28} />
        </button>
        {/* === END CHANGE === */}
      </div>

      <div className="header-center">
        <div style={styles.userInfo}>
          <span style={styles.userName}>{currentUser.name}</span>
          <span style={styles.userLevel}>LV: {currentUser.level}</span>
        </div>
      </div>

      <div style={styles.headerRight}>
        <Link to="/shop" style={styles.moneyLink}>
          <Coins size={20} color="#FFD700" />
          <span>{currentUser.money}</span>
        </Link>

        {/* === START CHANGE === */}
        <Link to="/mailbox" style={styles.mailLink} aria-label="กล่องจดหมาย">
          <Mail size={24} />
          {unreadCount > 0 && (
            // (aria-hidden=true บอก Screen Reader ว่า "ไม่ต้องอ่านจุดนี้")
            <span style={styles.notificationDot} aria-hidden="true"></span>
          )}
        </Link>
        {/* === END CHANGE === */}
      </div>
    </header>
  );
}

// (CSS Styles ... เหมือนเดิม)
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
    display: "flex",
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
  mailLink: {
    position: "relative",
    color: "white",
    padding: 0,
    lineHeight: 0,
    display: "flex",
  },
  notificationDot: {
    position: "absolute",
    top: "-3px",
    right: "-3px",
    width: "10px",
    height: "10px",
    backgroundColor: "#ff3b30",
    borderRadius: "50%",
    border: "2px solid #333",
  },
};

export default Header;
