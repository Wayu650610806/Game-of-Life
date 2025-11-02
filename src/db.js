// src/db.js
import Dexie from "dexie";

export const db = new Dexie("gameOfLifeApp");

// === START CHANGE: อัปเดต Version 18 ===

// v.18 (Latest)
// (แก้ไข) เพิ่ม 'rewardsMet' (object) ใน 'dailyMacros'
db.version(18).stores({
  userProfile:
    "++id, name, birthday, level, money, weight, height, activityLevel, goal",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime, activityId, activityLevel, userLevel, taskId, taskReward, taskPenalty",
  shopItems: "++id, name, detail, rank, price, imageUrl",

  accounts: "++id, name, balance",
  liabilities: "++id, name, amount, status",
  receivables: "++id, name, amount, status",
  budgets: "++id, &name, currentAmount, totalAmount, lastReset, icon",
  tags: "++id, &name, type",
  transactions:
    "++id, timestamp, type, amount, accountId, tagId, classification",
  settings: "key, value",

  // (แก้ไข) เพิ่ม rewardsMet
  dailyMacros:
    "date, consumedCalories, consumedProtein, consumedFat, consumedCarbs, consumedWater, vegetableGoalMet, rewardsMet",

  foodLibrary:
    "++id, name, type, unit, caloriesPerUnit, proteinPerUnit, fatPerUnit, carbsPerUnit, colorCategory",
});

// v.17 (Previous)
db.version(17)
  .stores({
    userProfile:
      "++id, name, birthday, level, money, weight, height, activityLevel, goal",
    activities: "++id, name, level",
    routineSets: "++id, name, items",
    dailyRoutines: "dayOfWeek, routineSetId",
    tasks:
      "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
    penalties: "++id, name",
    dreams: "++id, name, imageUrl, targetDate, status",
    mailbox:
      "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime, activityId, activityLevel, userLevel, taskId, taskReward, taskPenalty",
    shopItems: "++id, name, detail, rank, price, imageUrl",

    accounts: "++id, name, balance",
    liabilities: "++id, name, amount, status",
    receivables: "++id, name, amount, status",
    budgets: "++id, &name, currentAmount, totalAmount, lastReset, icon",
    tags: "++id, &name, type",
    transactions:
      "++id, timestamp, type, amount, accountId, tagId, classification",
    settings: "key, value",

    dailyMacros:
      "date, consumedCalories, consumedProtein, consumedFat, consumedCarbs, consumedWater, vegetableGoalMet", // (Schema เก่า)

    foodLibrary:
      "++id, name, type, unit, caloriesPerUnit, proteinPerUnit, fatPerUnit, carbsPerUnit, colorCategory",
  })
  .upgrade(async (tx) => {
    // v.17 -> v.18
    // เพิ่ม 'rewardsMet' object ให้ข้อมูลเก่า
    const defaultRewards = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      water: 0,
      vegetable: 0,
    };
    return tx
      .table("dailyMacros")
      .toCollection()
      .modify({ rewardsMet: defaultRewards });
  });

// --- (เวอร์ชัน v.16 ถึง v.1 เหมือนเดิม) ---
db.version(16)
  .stores({
    userProfile:
      "++id, name, birthday, level, money, weight, height, activityLevel, goal",
    activities: "++id, name, level",
    routineSets: "++id, name, items",
    dailyRoutines: "dayOfWeek, routineSetId",
    tasks:
      "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
    penalties: "++id, name",
    dreams: "++id, name, imageUrl, targetDate, status",
    mailbox:
      "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime, activityId, activityLevel, userLevel, taskId, taskReward, taskPenalty",
    shopItems: "++id, name, detail, rank, price, imageUrl",

    accounts: "++id, name, balance",
    liabilities: "++id, name, amount, status",
    receivables: "++id, name, amount, status",
    budgets: "++id, &name, currentAmount, totalAmount, lastReset, icon",
    tags: "++id, &name, type",
    transactions:
      "++id, timestamp, type, amount, accountId, tagId, classification",
    settings: "key, value",
    dailyMacros:
      "date, consumedCalories, consumedProtein, consumedFat, consumedCarbs, consumedWater",
  })
  .upgrade(async (tx) => {
    return tx
      .table("dailyMacros")
      .toCollection()
      .modify({ vegetableGoalMet: 0 });
  });
// ( ... v.15 ถึง v.1 ... )
// ... (วางโค้ดเวอร์ชันเก่าทั้งหมดต่อที่นี่) ...

// === END CHANGE ===

// ฟังก์ชัน helper (เหมือนเดิม)
export const calculateLevel = (birthday) => {
  if (!birthday) return 0;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
