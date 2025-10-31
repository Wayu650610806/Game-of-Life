// src/db.js
import Dexie from "dexie";

export const db = new Dexie("gameOfLifeApp");

// === START CHANGE: อัปเดต Version 7 (The Correct One) ===

// v.7 (Latest)
// (แก้ไข) ลบ '&' (Unique) ออกจาก 'type' และ 'status'
db.version(7).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
  shopItems: "++id, name, detail, rank, price, imageUrl",

  // (แก้ไข) เอา & ออกจาก type และ status (นี่คือ Bug)
  // แต่เรายังเก็บ 'startTime' และ 'endTime' ไว้ใน index เพื่อการค้นหา
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
});

// v.6 (Previous Buggy Version)
// (สำคัญ) เราต้อง "ประกาศ" v.6 ที่พังๆ ไว้ด้วย
// เพื่อให้ Dexie รู้ว่าต้อง "อัปเกรด" จาก v.6 (ที่พัง) ไป v.7 (ที่ถูก)
db.version(6)
  .stores({
    userProfile: "++id, name, birthday, level, money",
    activities: "++id, name, level",
    routineSets: "++id, name, items",
    dailyRoutines: "dayOfWeek, routineSetId",
    penalties: "++id, name",
    dreams: "++id, name, imageUrl, targetDate, status",
    mailbox:
      "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
    shopItems: "++id, name, detail, rank, price, imageUrl",

    // นี่คือ Schema ที่ "พัง" ที่ผมให้ไป (มี &)
    tasks:
      "++id, &type, &status, startTime, endTime, name, detail, difficulty, reward, penalty",
  })
  .upgrade(async (tx) => {
    // ผู้ใช้ v.5 -> v.6
    const oldTables = tx.tables.map((t) => t.name);
    if (oldTables.includes("quests")) {
      if ((await tx.table("quests").count()) > 0) {
        const oldQuests = await tx.table("quests").toArray();
        const newTasks = oldQuests.map((q) => ({
          ...q,
          type: "quest",
        }));
        await tx.table("tasks").bulkAdd(newTasks);
      }
    }
  });

// v.5 (Previous)
db.version(5).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  quests:
    "++id, name, detail, startTime, endTime, difficulty, reward, penalty, status", // <-- ตาราง 'quests' เก่า
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
  shopItems: "++id, name, detail, rank, price, imageUrl",
});

// v.4 (Previous)
db.version(4).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  quests:
    "++id, name, detail, startTime, endTime, difficulty, reward, penalty, status",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
});

// v.3 (Previous)
db.version(3).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  quests:
    "++id, name, detail, startTime, endTime, difficulty, reward, penalty, status",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName",
});

// v.2 (Previous)
db.version(2)
  .stores({
    userProfile: "++id, name, birthday, level, money",
    activities: "++id, name, level",
    routineSets: "++id, name, items",
    dailyRoutines: "dayOfWeek, routineSetId",
    quests:
      "++id, name, detail, startTime, endTime, difficulty, reward, penalty, status",
    penalties: "++id, name",
    dreams: "++id, name, imageUrl, targetDate, status",
    mailbox:
      "++id, timestamp, type, message, activityName, levelDrop, penaltyName",
  })
  .upgrade((tx) => {
    return tx.table("mailbox").toCollection().modify({ isRead: 1 });
  });

// v.1 (Original)
db.version(1).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  quests:
    "++id, name, detail, startTime, endTime, difficulty, reward, penalty, status",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
});
// === END CHANGE ===

// ฟังก์ชัน helper สำหรับคำนวณอายุ/เลเวล
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
