// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// === 1. START CHANGE: (ย้ายกลับมา) Import ฟังก์ชันจาก db.js ===
import { db, populateInitialExercises } from "./db";
// === END CHANGE ===

// (Imports ... ทั้งหมดเหมือนเดิม)
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
import TagManager from "./pages/TagManager";
import ExercisePage from "./pages/ExercisePage";
import LogFood from "./pages/LogFood";
import AddFood from "./pages/AddFood";
import ExerciseSettings from "./pages/ExerciseSettings";
import ExerciseSetManager from "./pages/ExerciseSetManager";
import ExerciseSetEditor from "./pages/ExerciseSetEditor";

function App() {
  const [userProfile, setUserProfile] = useState(undefined);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // === 2. START CHANGE: (ย้ายกลับมา) เรียกใช้ฟังก์ชันนี้ ===
        await populateInitialExercises();
        // === END CHANGE ===

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

          {/* (Routes ... ทั้งหมดเหมือนเดิม) */}
          <Route path="amway" element={<Amway />} />
          <Route path="health" element={<Health />} />
          <Route path="finance" element={<Finance />} />
          <Route path="profile" element={<Profile />} />
          <Route path="edit-routine" element={<EditRoutine />} />
          <Route path="penalty" element={<Penalty />} />
          <Route path="mailbox" element={<Mailbox />} />
          <Route path="shop" element={<Shop />} />
          <Route path="dreams" element={<DreamListPage />} />
          <Route path="routine-set-manager" element={<RoutineSetManager />} />
          <Route
            path="routine-set-editor/:setId"
            element={<RoutineSetEditor />}
          />
          <Route path="finance-summary" element={<FinanceSummary />} />
          <Route path="tag-manager" element={<TagManager />} />
          <Route path="log-food" element={<LogFood />} />
          <Route path="add-food" element={<AddFood />} />
          <Route path="add-food/:foodId" element={<AddFood />} />
          <Route path="exercise" element={<ExercisePage />} />
          <Route path="exercise-settings" element={<ExerciseSettings />} />
          <Route path="exercise-set-manager" element={<ExerciseSetManager />} />
          <Route
            path="exercise-set-editor/:setId"
            element={<ExerciseSetEditor />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
