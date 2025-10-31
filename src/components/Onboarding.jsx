// src/components/Onboarding.jsx
import React, { useState } from "react";
import { db, calculateLevel } from "../db";

// รับ onComplete prop ที่ส่งมาจาก App.jsx
function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !birthday) {
      alert("กรุณากรอกชื่อและวันเกิด");
      return;
    }

    const userLevel = calculateLevel(birthday);

    const newUser = {
      name: name,
      birthday: birthday,
      level: userLevel,
      money: 0,
    };

    try {
      // เพิ่มข้อมูลลง DB
      const id = await db.userProfile.add(newUser);

      // === START CHANGE ===
      // ส่งข้อมูลผู้ใช้ใหม่ (พร้อม id) กลับไปให้ App.jsx
      onComplete({ ...newUser, id });
      // === END CHANGE ===
    } catch (error) {
      console.error("Failed to save user profile:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  // ... (ส่วน JSX ที่ return เหมือนเดิม ไม่ต้องแก้)
  return (
    <div
      style={{
        padding: "20px",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <h1>Welcome!</h1>
      <p>กรุณาตั้งชื่อและวันเกิดของคุณ</p>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label
            htmlFor="name"
            style={{ display: "block", marginBottom: "5px" }}
          >
            ชื่อผู้ใช้:
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label
            htmlFor="birthday"
            style={{ display: "block", marginBottom: "5px" }}
          >
            วันเกิด:
          </label>
          <input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "12px",
            background: "#646cff",
            border: "none",
            color: "white",
            borderRadius: "8px",
            fontSize: "1rem",
          }}
        >
          เริ่มใช้งาน
        </button>
      </form>
    </div>
  );
}

export default Onboarding;
