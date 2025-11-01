// src/db.js
import Dexie from "dexie";

export const db = new Dexie("gameOfLifeApp");

// === START CHANGE: อัปเดต Version 13 ===

// v.13 (Latest)
// (สำคัญ) เพิ่ม 'activityId', 'activityLevel', 'userLevel' ใน 'mailbox'
// และ 'taskId', 'taskReward', 'taskPenalty'
db.version(13).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",

  // (อัปเดต)
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
});

// --- ประกาศเวอร์ชันก่อนหน้าทั้งหมด ---

// v.12 (Previous)
db.version(12).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
  shopItems: "++id, name, detail, rank, price, imageUrl",
  accounts: "++id, name, balance",
  liabilities: "++id, name, amount, status",
  receivables: "++id, name, amount, status",
  budgets: "++id, &name, currentAmount, totalAmount, lastReset, icon",
  tags: "++id, &name, type",
  transactions:
    "++id, timestamp, type, amount, accountId, tagId, classification",
  settings: "key, value",
});

// v.11 (Previous)
db.version(11).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
  shopItems: "++id, name, detail, rank, price, imageUrl",
  accounts: "++id, name, balance",
  liabilities: "++id, name, amount, status",
  receivables: "++id, name, amount, status",
  budgets: "++id, &name, currentAmount, totalAmount, lastReset",
  tags: "++id, name, type",
  transactions:
    "++id, timestamp, type, amount, accountId, tagId, classification",
});

// v.10 (Previous)
db.version(10)
  .stores({
    userProfile: "++id, name, birthday, level, money",
    activities: "++id, name, level",
    routineSets: "++id, name, items",
    dailyRoutines: "dayOfWeek, routineSetId",
    tasks:
      "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
    penalties: "++id, name",
    dreams: "++id, name, imageUrl, targetDate, status",
    mailbox:
      "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
    shopItems: "++id, name, detail, rank, price, imageUrl",
    accounts: "++id, name, balance",
    liabilities: "++id, name, amount, status",
    receivables: "++id, name, amount, status",
    budgets: "++id, &name, currentAmount, totalAmount",
    tags: "++id, name, type",
    transactions:
      "++id, timestamp, type, amount, accountId, tagId, classification",
  })
  .upgrade(async (tx) => {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    return tx
      .table("budgets")
      .toCollection()
      .modify({ lastReset: startOfMonth });
  });

// v.9 (Previous)
db.version(9)
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
    tasks:
      "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
    accounts: "++id, name, balance",
    liabilities: "++id, name, amount, status",
    receivables: "++id, name, amount, status",
    budgets: "name, currentAmount, totalAmount",
    tags: "++id, name, type",
    transactions:
      "++id, timestamp, type, amount, accountId, tagId, classification",
  })
  .upgrade(async (tx) => {
    const oldTables = tx.tables.map((t) => t.name);
    if (oldTables.includes("budgets")) {
      if ((await tx.table("budgets").count()) > 0) {
        const oldBudgets = await tx.table("budgets").toArray();
        await tx.table("budgets").clear();
        await tx.table("budgets").bulkAdd(
          oldBudgets.map((b) => ({
            name: b.name,
            currentAmount: b.currentAmount,
            totalAmount: b.totalAmount,
          }))
        );
      }
    }
  });

// v.8 (Previous Buggy)
db.version(8).stores({
  userProfile: "++id, name, birthday, level, money",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime",
  shopItems: "++id, name, detail, rank, price, imageUrl",
  tasks:
    "++id, &type, &status, startTime, endTime, name, detail, difficulty, reward, penalty",
  accounts: "++id, name, balance",
  liabilities: "++id, name, amount, status",
  receivables: "++id, name, amount, status",
  budgets: "name, currentAmount, totalAmount",
  tags: "++id, name, type",
  transactions:
    "++id, timestamp, type, amount, accountId, tagId, classification",
});

// v.7 (Previous)
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
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
});

// v.6 (Previous Buggy)
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
    tasks:
      "++id, &type, &status, startTime, endTime, name, detail, difficulty, reward, penalty",
  })
  .upgrade(async (tx) => {
    const oldTables = tx.tables.map((t) => t.name);
    if (oldTables.includes("quests")) {
      if ((await tx.table("quests").count()) > 0) {
        const oldQuests = await tx.table("quests").toArray();
        const newTasks = oldQuests.map((q) => ({ ...q, type: "quest" }));
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
    "++id, name, detail, startTime, endTime, difficulty, reward, penalty, status",
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
