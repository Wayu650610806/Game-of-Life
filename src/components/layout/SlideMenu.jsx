// src/components/layout/SlideMenu.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, CalendarCog, X } from "lucide-react";

// CSS สำหรับ Slide Menu (เพิ่มใน src/index.css)
/*
.slide-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
  z-index: 100;
}

.slide-menu {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: #2a2a2a;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 101;
  display: flex;
  flex-direction: column;
}

.slide-menu.open {
  transform: translateX(0);
}

.slide-menu-header {
  padding: 15px;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slide-menu-nav {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 10px 0;
}

.slide-menu-link {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  color: white;
  text-decoration: none;
  font-size: 1rem;
}

.slide-menu-link:hover {
  background-color: #333;
}
*/

// อย่าลืมเพิ่ม CSS ข้างบนนี้ใน src/index.css นะครับ
// (ผมใส่เป็น comment ไว้ในนี้เพื่อง่ายต่อการคัดลอก)

function SlideMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="slide-menu-overlay" onClick={onClose}></div>
      <div className={`slide-menu ${isOpen ? "open" : ""}`}>
        <div className="slide-menu-header">
          <h3>Menu</h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "white",
              padding: 0,
            }}
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
            <span>Edit Routine</span>
          </Link>
          <Link to="/penalty" className="slide-menu-link" onClick={onClose}>
            <ShieldAlert size={20} />
            <span>Penalty</span>
          </Link>
        </nav>
      </div>
    </>
  );
}

export default SlideMenu;
