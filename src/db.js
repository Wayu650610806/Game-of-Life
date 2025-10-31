// src/db.js
import Dexie from "dexie";

export const db = new Dexie("gameOfLifeApp");

// === START CHANGE: อัปเดต Version 5 ===

// v.5 (Latest)
// เพิ่มตาราง 'shopItems'
db.version(5).stores({
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

  // ตารางใหม่สำหรับร้านค้า
  // rank: 1-5
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
