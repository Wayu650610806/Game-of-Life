// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { db } from "./db";

// Layout & Pages
import MainLayout from "./components/layout/MainLayout";
import Onboarding from "./components/Onboarding";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditRoutine from "./pages/EditRoutine";
import Penalty from "./pages/Penalty";
import Mailbox from "./pages/Mailbox";
import Shop from "./pages/Shop";
import Health from "./pages/Health";
import Amway from "./pages/Amway";
import Finance from "./pages/Finance";
import DreamListPage from "./pages/DreamListPage";

// === START CHANGE: IMPORT 2 ไฟล์ใหม่ ===
import RoutineSetManager from "./pages/RoutineSetManager";
import RoutineSetEditor from "./pages/RoutineSetEditor";
// === END CHANGE ===

function App() {
  const [userProfile, setUserProfile] = useState(undefined);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await db.userProfile.toCollection().first();
        setUserProfile(user || null);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล:", error);
        setUserProfile(null);
      }
    };
    checkUser();
  }, []);

  if (userProfile === undefined) {
    return <div>Loading...</div>;
  }

  if (!userProfile) {
    const handleOnboardComplete = (newUser) => {
      setUserProfile(newUser);
    };
    return <Onboarding onComplete={handleOnboardComplete} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout user={userProfile} />}>
          <Route index element={<Home />} />

          <Route path="amway" element={<Amway />} />
          <Route path="health" element={<Health />} />
          <Route path="finance" element={<Finance />} />
          <Route path="profile" element={<Profile />} />

          <Route path="edit-routine" element={<EditRoutine />} />
          <Route path="penalty" element={<Penalty />} />

          <Route path="mailbox" element={<Mailbox />} />
          <Route path="shop" element={<Shop />} />
          <Route path="dreams" element={<DreamListPage />} />

          {/* === START CHANGE: ADD 2 ROUTES ใหม่สำหรับ Routine === */}
          {/* หน้าสำหรับ "จัดการ" รายการ Routine Sets (เช่น สร้าง/ลบ กิจวัตรเช้า) */}
          <Route path="routine-set-manager" element={<RoutineSetManager />} />

          {/* หน้าสำหรับ "แก้ไข" กิจกรรมภายใน Routine Set นั้นๆ */}
          {/* :setId คือการบอกว่าเราจะส่ง ID ของ Set ไปใน URL */}
          <Route
            path="routine-set-editor/:setId"
            element={<RoutineSetEditor />}
          />
          {/* === END CHANGE === */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
