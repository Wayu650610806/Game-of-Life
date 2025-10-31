// src/components/layout/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import SlideMenu from "./SlideMenu";

// หนังที่ต้องการให้ Content ไม่เลื่อน
const noScrollPages = ["/"];

function MainLayout({ user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // ตรวจสอบว่าหน้านี้ควรเลื่อนได้หรือไม่
  const useNoScroll = noScrollPages.includes(location.pathname);

  return (
    <div className="app-layout">
      <SlideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <Header user={user} onMenuClick={() => setIsMenuOpen(true)} />

      <main className={useNoScroll ? "app-content-no-scroll" : "app-content"}>
        {/* Outlet คือที่ที่ React Router จะแสดง Component ของแต่ละหน้า */}
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
