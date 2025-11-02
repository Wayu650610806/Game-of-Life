// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { db, populateInitialExercises } from "./db";

// Layout & Pages
import MainLayout from "./components/layout/MainLayout";
import Onboarding from "./components/Onboarding";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditRoutine from "./pages/EditRoutine";
// === 1. START CHANGE: เปลี่ยน Penalty -> Discipline ===
import DisciplinePage from "./pages/DisciplinePage"; // (ชื่อใหม่)
// === END CHANGE ===
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
        await populateInitialExercises();
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
          {/* === 2. START CHANGE: เปลี่ยน Route === */}
          <Route path="discipline" element={<DisciplinePage />} />
          {/* === END CHANGE === */}

          {/* Header */}
          <Route path="mailbox" element={<Mailbox />} />
          <Route path="shop" element={<Shop />} />

          {/* (Routes ที่เหลือ ... เหมือนเดิม) */}
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
