// src/utils/healthUtils.js
import { calculateLevel } from "../db"; // (Import)

/**
 * 6 หมวดสีผัก/ผลไม้
 */
export const VEGETABLE_COLOR_CATEGORIES = {
  green: { name: "เขียว", color: "#2ecc71" },
  red: { name: "แดง", color: "#e74c3c" },
  orange: { name: "ส้ม", color: "#e67e22" },
  purple_blue: { name: "ม่วง/น้ำเงิน", color: "#8e44ad" },
  yellow: { name: "เหลือง", color: "#f1c40f" },
  white_brown: { name: "ขาว/น้ำตาล", color: "#ecf0f1" },
  free: { name: "Free Style", color: "#95a5a6" },
};

/**
 * วงจร 7 วัน
 */
const VEGETABLE_DAY_CYCLE = [
  "green", // 0 (Sun)
  "red", // 1 (Mon)
  "orange", // 2 (Tue)
  "purple_blue", // 3 (Wed)
  "yellow", // 4 (Thu)
  "white_brown", // 5 (Fri)
  "free", // 6 (Sat)
];

/**
 * ดึงเป้าหมายสีผัก/ผลไม้สำหรับวันนี้
 */
export const getTodayVegetableGoal = () => {
  const todayIndex = new Date().getDay();
  const todayColorKey = VEGETABLE_DAY_CYCLE[todayIndex];
  return {
    key: todayColorKey,
    ...VEGETABLE_COLOR_CATEGORIES[todayColorKey],
  };
};

// === START CHANGE: ย้าย Logic มารวมที่นี่ ===

/**
 * คำนวณอายุ
 */
export const getAge = (birthday) => {
  if (!birthday) return 0;
  return calculateLevel(birthday);
};

/**
 * ดึงตัวคูณ Activity
 */
export const getActivityMultiplier = (levelKey) => {
  switch (String(levelKey)) {
    case "1":
      return 1.2;
    case "2":
      return 1.375;
    case "3":
      return 1.55;
    case "4":
      return 1.725;
    case "5":
      return 1.9;
    default:
      return 1.2;
  }
};

/**
 * สุ่มรางวัล
 * 90% (100-600), 10% (600-1800)
 */
export const calculateReward = () => {
  const chance = Math.random();
  const min = (low, high) => Math.floor(Math.random() * (high - low + 1)) + low;

  if (chance <= 0.9) {
    // 90%
    return min(100, 600);
  } else {
    // 10%
    return min(600, 1800);
  }
};
// === END CHANGE ===
