// src/components/layout/Footer.jsx
import React from "react";
import { NavLink } from "react-router-dom";
// === START CHANGE: import Wallet และเอา Store ออก ===
import { Briefcase, HeartPulse, Home, Wallet, User } from "lucide-react";
// === END CHANGE ===

const FooterLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `footer-link ${isActive ? "active" : ""}`}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

function Footer() {
  return (
    <footer className="app-footer">
      <FooterLink to="/amway" icon={<Briefcase size={24} />} label="Amway" />
      <FooterLink to="/health" icon={<HeartPulse size={24} />} label="สุขภาพ" />
      <FooterLink to="/" icon={<Home size={24} />} label="หลัก" />

      {/* === START CHANGE: เปลี่ยนจาก Shop เป็น Finance === */}
      <FooterLink to="/finance" icon={<Wallet size={24} />} label="การเงิน" />
      {/* === END CHANGE === */}

      <FooterLink to="/profile" icon={<User size={24} />} label="โปรไฟล์" />
    </footer>
  );
}

export default Footer;
