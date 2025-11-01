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
import RoutineSetManager from "./pages/RoutineSetManager";
import RoutineSetEditor from "./pages/RoutineSetEditor";
import FinanceSummary from "./pages/FinanceSummary";
// === START CHANGE: IMPORT ไฟล์ใหม่ ===
import TagManager from "./pages/TagManager";
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

          {/* Footer Tabs */}
          <Route path="amway" element={<Amway />} />
          <Route path="health" element={<Health />} />
          <Route path="finance" element={<Finance />} />
          <Route path="profile" element={<Profile />} />

          {/* Slide Menu */}
          <Route path="edit-routine" element={<EditRoutine />} />
          <Route path="penalty" element={<Penalty />} />

          {/* Header */}
          <Route path="mailbox" element={<Mailbox />} />
          <Route path="shop" element={<Shop />} />

          {/* Sub Pages */}
          <Route path="dreams" element={<DreamListPage />} />
          <Route path="routine-set-manager" element={<RoutineSetManager />} />
          <Route
            path="routine-set-editor/:setId"
            element={<RoutineSetEditor />}
          />

          {/* Finance Sub Pages */}
          <Route path="finance-summary" element={<FinanceSummary />} />
          {/* === START CHANGE: ADD Route ใหม่สำหรับ Tags === */}
          <Route path="tag-manager" element={<TagManager />} />
          {/* === END CHANGE === */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
