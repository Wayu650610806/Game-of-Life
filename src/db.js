// src/db.js
import Dexie from "dexie";

export const db = new Dexie("gameOfLifeApp");

// === START CHANGE: อัปเดต Version 20 ===

// v.20 (Latest)
db.version(20).stores({
  userProfile:
    "++id, name, birthday, level, money, weight, height, activityLevel, goal",
  activities: "++id, name, level",
  routineSets: "++id, name, items",
  dailyRoutines: "dayOfWeek, routineSetId",
  tasks:
    "++id, type, status, startTime, endTime, name, detail, difficulty, reward, penalty",
  penalties: "++id, name",
  dreams: "++id, name, imageUrl, targetDate, status",

  // (อัปเดต) เพิ่ม habitId, habitLevel
  mailbox:
    "++id, timestamp, &isRead, type, message, activityName, levelDrop, penaltyName, activityStartTime, activityEndTime, activityId, activityLevel, userLevel, taskId, taskReward, taskPenalty, habitId, habitLevel",

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
  foodLibrary:
    "++id, name, type, unit, caloriesPerUnit, proteinPerUnit, fatPerUnit, carbsPerUnit, colorCategory",
  exerciseMasterList: "++id, &name, type",
  exerciseSets: "++id, name",
  exerciseSetItems:
    "++id, exerciseSetId, exerciseMasterId, templateSets, templateReps, templateWeight, templateDuration",
  dailyExerciseRoutines: "dayOfWeek, exerciseSetIdOdd, exerciseSetIdEven",
  exerciseLog: "++id, date, exerciseMasterId, sets, reps, weight, duration",

  // (ใหม่) ตารางนิสัยที่อยากเลิก
  badHabits: "++id, &name, level, lastFailedTimestamp",
});

// v.19 (Previous)
// (นี่คือเวอร์ชันที่คุณมีอยู่)
db.version(19).stores({
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
  foodLibrary:
    "++id, name, type, unit, caloriesPerUnit, proteinPerUnit, fatPerUnit, carbsPerUnit, colorCategory",
  exerciseMasterList: "++id, &name, type",
  exerciseSets: "++id, name",
  exerciseSetItems:
    "++id, exerciseSetId, exerciseMasterId, templateSets, templateReps, templateWeight, templateDuration",
  dailyExerciseRoutines: "dayOfWeek, exerciseSetIdOdd, exerciseSetIdEven",
  exerciseLog: "++id, date, exerciseMasterId, sets, reps, weight, duration",
});

// ... (v.18 -> v.1 ... เหมือนเดิม)
// ...

// === END CHANGE ===

// (Helper calculateLevel ... เหมือนเดิม)
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

// (Helper populateInitialExercises ... เหมือนเดิม)
export const populateInitialExercises = async () => {
  const count = await db.exerciseMasterList.count();
  if (count === 0) {
    console.log("Populating initial exercise data...");
    try {
      const masterList = [
        { id: 1, name: "Bench Press (Barbell)", type: "reps" },
        { id: 2, name: "Seated Dumbbell OHP", type: "reps" },
        { id: 3, name: "Dumbbell Fly", type: "reps" },
        { id: 4, name: "Lateral Raise", type: "reps" },
        { id: 5, name: "Triceps Pushdown", type: "reps" },
        { id: 6, name: "Barbell Squat", type: "reps" },
        { id: 7, name: "Leg Press", type: "reps" },
        { id: 8, name: "Lying Leg Curl", type: "reps" },
        { id: 9, name: "Leg Extension", type: "reps" },
        { id: 10, name: "Plank", type: "time" },
        { id: 11, name: "Pull-ups / Lat Pulldown", type: "reps" },
        { id: 12, name: "Barbell/Dumbbell Row", type: "reps" },
        { id: 13, name: "Face Pull", type: "reps" },
        { id: 14, name: "Bicep Curl", type: "reps" },
        { id: 15, name: "Hammer Curl", type: "reps" },
        { id: 16, name: "Deadlift", type: "reps" },
        { id: 17, name: "Bulgarian Split Squat", type: "reps" },
        { id: 18, name: "Hip Thrust", type: "reps" },
        { id: 19, name: "Calf Raise", type: "reps" },
        { id: 20, name: "Hanging Leg Raise", type: "reps" },
        { id: 21, name: "Incline Dumbbell Press", type: "reps" },
        { id: 22, name: "Seated Machine OHP", type: "reps" },
        { id: 23, name: "Cable Crossover", type: "reps" },
        { id: 24, name: "Cable Lateral Raise", type: "reps" },
        { id: 25, name: "Overhead Triceps Extension", type: "reps" },
        { id: 26, name: "Wide-Grip Lat Pulldown", type: "reps" },
        { id: 27, name: "Seated Cable Row", type: "reps" },
        { id: 28, name: "Dumbbell Preacher Curl", type: "reps" },
        { id: 29, name: "Reverse Pec Dec Fly", type: "reps" },
        { id: 30, name: "Hack Squat / Smith Machine Squat", type: "reps" },
        { id: 31, name: "Walking Lunge", type: "reps" },
        { id: 32, name: "Leg Extension (Drop Set)", type: "reps" },
        { id: 33, name: "Seated Leg Curl", type: "reps" },
        { id: 34, name: "Cable Crunch", type: "reps" },
        { id: 35, name: "Flat Dumbbell Press", type: "reps" },
        { id: 36, name: "Smith Machine Overhead Press", type: "reps" },
        { id: 37, name: "Decline Dumbbell Press / Dip", type: "reps" },
        { id: 38, name: "Cable Front Raise", type: "reps" },
        { id: 39, name: "Triceps Rope Pushdown", type: "reps" },
        { id: 40, name: "T-Bar Row / Pendlay Row", type: "reps" },
        { id: 41, name: "Straight Arm Pulldown", type: "reps" },
        { id: 42, name: "Machine Row (Close Grip)", type: "reps" },
        { id: 43, name: "Dumbbell Shrugs", type: "reps" },
        { id: 44, name: "Concentration Curl", type: "reps" },
        { id: 45, name: "Romanian Deadlift (RDL)", type: "reps" },
        { id: 46, name: "Goblet Squat / Safety Bar Squat", type: "reps" },
        { id: 47, name: "Hip Abduction/Adduction", type: "reps" },
        { id: 48, name: "Standing Calf Raise", type: "reps" },
        { id: 49, name: "Weighted Crunch", type: "reps" },
        { id: 100, name: "Running", type: "time" },
        { id: 101, name: "Calisthenics", type: "time" },
      ];
      await db.exerciseMasterList.bulkAdd(masterList);
      const sets = [
        { id: 1, name: "Upper Body A (Odd)" },
        { id: 2, name: "Lower Body A (Odd)" },
        { id: 3, name: "Cardio (Odd)" },
        { id: 4, name: "Upper Body B (Odd)" },
        { id: 5, name: "Lower Body B (Odd)" },
        { id: 6, name: "Calisthenics (Odd)" },
        { id: 7, name: "Push A (Even)" },
        { id: 8, name: "Pull A (Even)" },
        { id: 9, name: "Legs A (Even)" },
        { id: 10, name: "Push B (Even)" },
        { id: 11, name: "Pull B (Even)" },
        { id: 12, name: "Legs B (Even)" },
        { id: 13, name: "Rest" },
      ];
      await db.exerciseSets.bulkAdd(sets);
      const setItems = [
        {
          exerciseSetId: 1,
          exerciseMasterId: 1,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 1,
          exerciseMasterId: 2,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 1,
          exerciseMasterId: 3,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 1,
          exerciseMasterId: 4,
          templateSets: 3,
          templateReps: "12-15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 1,
          exerciseMasterId: 5,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        { exerciseSetId: 1, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 2,
          exerciseMasterId: 6,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 2,
          exerciseMasterId: 7,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 2,
          exerciseMasterId: 9,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 2,
          exerciseMasterId: 8,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 2,
          exerciseMasterId: 10,
          templateSets: 3,
          templateDuration: 1,
        },
        { exerciseSetId: 2, exerciseMasterId: 100, templateDuration: 20 },
        { exerciseSetId: 3, exerciseMasterId: 100, templateDuration: 30 },
        {
          exerciseSetId: 4,
          exerciseMasterId: 11,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 4,
          exerciseMasterId: 12,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 4,
          exerciseMasterId: 13,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 4,
          exerciseMasterId: 14,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 4,
          exerciseMasterId: 15,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        { exerciseSetId: 4, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 5,
          exerciseMasterId: 16,
          templateSets: 3,
          templateReps: "5",
          templateWeight: 0,
        },
        {
          exerciseSetId: 5,
          exerciseMasterId: 17,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 5,
          exerciseMasterId: 18,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 5,
          exerciseMasterId: 19,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 5,
          exerciseMasterId: 20,
          templateSets: 3,
          templateReps: "AMRAP",
          templateWeight: 0,
        },
        { exerciseSetId: 5, exerciseMasterId: 100, templateDuration: 20 },
        { exerciseSetId: 6, exerciseMasterId: 101, templateDuration: 30 },
        {
          exerciseSetId: 7,
          exerciseMasterId: 21,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 7,
          exerciseMasterId: 22,
          templateSets: 3,
          templateReps: "10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 7,
          exerciseMasterId: 23,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 7,
          exerciseMasterId: 24,
          templateSets: 3,
          templateReps: "12-15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 7,
          exerciseMasterId: 25,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        { exerciseSetId: 7, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 8,
          exerciseMasterId: 26,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 8,
          exerciseMasterId: 27,
          templateSets: 3,
          templateReps: "10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 8,
          exerciseMasterId: 13,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 8,
          exerciseMasterId: 28,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 8,
          exerciseMasterId: 29,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        { exerciseSetId: 8, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 9,
          exerciseMasterId: 30,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 9,
          exerciseMasterId: 31,
          templateSets: 3,
          templateReps: "10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 9,
          exerciseMasterId: 32,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 9,
          exerciseMasterId: 33,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 9,
          exerciseMasterId: 34,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        { exerciseSetId: 9, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 10,
          exerciseMasterId: 35,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 10,
          exerciseMasterId: 36,
          templateSets: 3,
          templateReps: "10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 10,
          exerciseMasterId: 37,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 10,
          exerciseMasterId: 38,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 10,
          exerciseMasterId: 39,
          templateSets: 3,
          templateReps: "12",
          templateWeight: 0,
        },
        { exerciseSetId: 10, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 11,
          exerciseMasterId: 40,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 11,
          exerciseMasterId: 41,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 11,
          exerciseMasterId: 42,
          templateSets: 3,
          templateReps: "10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 11,
          exerciseMasterId: 43,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 11,
          exerciseMasterId: 44,
          templateSets: 3,
          templateReps: "10",
          templateWeight: 0,
        },
        { exerciseSetId: 11, exerciseMasterId: 100, templateDuration: 20 },
        {
          exerciseSetId: 12,
          exerciseMasterId: 45,
          templateSets: 3,
          templateReps: "8-10",
          templateWeight: 0,
        },
        {
          exerciseSetId: 12,
          exerciseMasterId: 46,
          templateSets: 3,
          templateReps: "10-12",
          templateWeight: 0,
        },
        {
          exerciseSetId: 12,
          exerciseMasterId: 47,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        {
          exerciseSetId: 12,
          exerciseMasterId: 48,
          templateSets: 3,
          templateReps: "15-20",
          templateWeight: 0,
        },
        {
          exerciseSetId: 12,
          exerciseMasterId: 49,
          templateSets: 3,
          templateReps: "15",
          templateWeight: 0,
        },
        { exerciseSetId: 12, exerciseMasterId: 100, templateDuration: 20 },
      ];
      await db.exerciseSetItems.bulkAdd(setItems);
      const scheduler = [
        { dayOfWeek: 1, exerciseSetIdOdd: 1, exerciseSetIdEven: 7 },
        { dayOfWeek: 2, exerciseSetIdOdd: 2, exerciseSetIdEven: 8 },
        { dayOfWeek: 3, exerciseSetIdOdd: 3, exerciseSetIdEven: 9 },
        { dayOfWeek: 4, exerciseSetIdOdd: 4, exerciseSetIdEven: 10 },
        { dayOfWeek: 5, exerciseSetIdOdd: 5, exerciseSetIdEven: 11 },
        { dayOfWeek: 6, exerciseSetIdOdd: 6, exerciseSetIdEven: 12 },
        { dayOfWeek: 0, exerciseSetIdOdd: 13, exerciseSetIdEven: 13 },
      ];
      await db.dailyExerciseRoutines.bulkAdd(scheduler);
      console.log("Initial exercises populated.");
    } catch (e) {
      console.error("Failed to populate initial exercises:", e);
    }
  }
};
