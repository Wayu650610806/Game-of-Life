// src/components/layout/SlideMenu.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, CalendarCog, X } from "lucide-react";
// (เราใช้ไอคอน ShieldAlert เหมือนเดิมสำหรับ Discipline)

function SlideMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="slide-menu-overlay" onClick={onClose}></div>
      <div className={`slide-menu ${isOpen ? "open" : ""}`}>
        <div className="slide-menu-header">
          <h3>Menu</h3>

          {/* (แก้ไข) เพิ่ม aria-label สำหรับ Accessibility */}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              padding: 0,
              display: "flex", // (เพิ่ม)
            }}
            aria-label="ปิดเมนู"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="slide-menu-nav">
          <Link
            to="/edit-routine"
            className="slide-menu-link"
            onClick={onClose}
          >
            <CalendarCog size={20} />
            <span>Day Routine</span>
          </Link>

          {/* (แก้ไข) อัปเดตลิงก์และข้อความ */}
          <Link to="/discipline" className="slide-menu-link" onClick={onClose}>
            <ShieldAlert size={20} />
            <span>Discipline</span>
          </Link>
        </nav>
      </div>
    </>
  );
}

export default SlideMenu;
