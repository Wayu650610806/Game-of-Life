// src/pages/Home.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
  Check,
  SkipForward,
  X,
  AlertTriangle,
  PartyPopper,
  Plus,
  Coins,
  ShieldAlert,
  CalendarClock,
  Dice5,
  Edit,
  Bell,
} from "lucide-react";

// === Helper Functions (อัปเดต) ===
const getItemKey = (item) => `${item.startTime}-${item.activityId}`;
const getRewardMultiplier = (activityLevel) => {
  // (Logic นี้เหมือนเดิม)
  const baseMin = 10;
  const baseMax = 15;
  const levelCap = 100;
  const currentLevel = Math.min(activityLevel, levelCap);
  const minReward = Math.floor(
    baseMin + (baseMax - baseMin) * (currentLevel / levelCap)
  );
  return Math.floor(Math.random() * (baseMax - minReward + 1)) + minReward;
};
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};
const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA");
};

// === 1. START CHANGE: เปลี่ยนชื่อ Key ===
const getStoredTodaySet = (key) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return new Set();
    const { date, items } = JSON.parse(stored);
    if (date === getTodayDateString()) {
      return new Set(items);
    }
    localStorage.removeItem(key);
    return new Set();
  } catch (e) {
    return new Set();
  }
};
const storeTodaySet = (key, set) => {
  try {
    const data = {
      date: getTodayDateString(),
      items: Array.from(set),
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to store state in localStorage", e);
  }
};
// === END CHANGE ===

const calculateQuestReward = (difficulty) => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  switch (difficulty) {
    case "low":
      return rand(10, 600);
    case "medium":
      return rand(30, 600) * 3;
    case "high":
      return rand(70, 600) * 7;
    default:
      return 0;
  }
};
const getQuestCountdown = (endTimeISO, now) => {
  const endTime = new Date(endTimeISO);
  const diff = endTime - now;
  if (diff <= 0) return "หมดเวลา";
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `เหลือ ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// === Main Component ===
function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // === 2. START CHANGE: เปลี่ยนชื่อ State ===
  // (จาก failedItems/completedItems เป็น 'processedItems' (ที่ประมวลผลแล้ว))
  const [processedItems, setProcessedItems] = useState(() =>
    getStoredTodaySet("processedItems")
  );
  // === END CHANGE ===

  const [isProcessing, setIsProcessing] = useState(false);

  // === 3. START CHANGE: อัปเดต Ref ===
  const processedItemsRef = useRef(processedItems);
  useEffect(() => {
    processedItemsRef.current = processedItems;
  }, [processedItems]);
  // === END CHANGE ===

  const [overrideActivity, setOverrideActivity] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // (ใหม่) State สำหรับล็อก Task
  const [isProcessingTasks, setIsProcessingTasks] = useState(false);

  // --- 1. ดึงข้อมูล DB ---
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const dailyRoutines = useLiveQuery(() => db.dailyRoutines.toArray(), []);
  const routineSets = useLiveQuery(() => db.routineSets.toArray(), []);
  const allActivities = useLiveQuery(() => db.activities.toArray(), []);
  const penalties = useLiveQuery(() => db.penalties.toArray(), []);
  const allTasks = useLiveQuery(() => db.tasks.toArray(), []);

  // (Logic จัดเรียง Task - เหมือนเดิม)
  const activeTasks = useMemo(() => {
    if (!allTasks) return [];
    const now = currentTime.getTime();
    const tasks = allTasks.filter((q) => q.status === "active");
    const startedTasks = tasks.filter(
      (q) => new Date(q.startTime).getTime() <= now
    );
    const notStartedTasks = tasks.filter(
      (q) => new Date(q.startTime).getTime() > now
    );
    startedTasks.sort((a, b) => {
      if (a.endTime === null && b.endTime === null) return 0;
      if (a.endTime === null) return 1;
      if (b.endTime === null) return -1;
      return new Date(a.endTime) - new Date(b.endTime);
    });
    notStartedTasks.sort((a, b) => {
      return new Date(a.startTime) - new Date(b.startTime);
    });
    return [...startedTasks, ...notStartedTasks];
  }, [allTasks, currentTime]);

  // --- 2. Ticker (ตัวนับเวลา) ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // === 4. START CHANGE: อัปเดตการรีเซ็ต ===
      const storedDate = JSON.parse(
        localStorage.getItem("processedItems") || "{}"
      ).date;
      if (storedDate && storedDate !== getTodayDateString()) {
        setProcessedItems(new Set());
        storeTodaySet("processedItems", new Set());
        setOverrideActivity(null);
      }
      // === END CHANGE ===
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 3. Core Logic (Routine) ---
  const scheduleData = useMemo(() => {
    if (!dailyRoutines || !routineSets || !allActivities) {
      return { current: null, next: null, todaySortedItems: [] };
    }
    const dayKey = currentTime
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const todayAssignment = dailyRoutines.find((r) => r.dayOfWeek === dayKey);
    if (!todayAssignment)
      return { current: null, next: null, todaySortedItems: [] };
    const todaySet = routineSets.find(
      (s) => s.id === todayAssignment.routineSetId
    );
    if (!todaySet || todaySet.items.length === 0)
      return { current: null, next: null, todaySortedItems: [] };

    const nowInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const sortedItems = [...todaySet.items].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    const itemsWithMinutes = sortedItems.map((item) => ({
      ...item,
      startMinutes: timeToMinutes(item.startTime),
      endMinutes: timeToMinutes(item.endTime),
    }));

    // === 5. START CHANGE: อัปเดต Logic การค้นหา ===
    const currentItem = itemsWithMinutes.find(
      (item) =>
        nowInMinutes >= item.startMinutes &&
        nowInMinutes < item.endMinutes &&
        !processedItems.has(getItemKey(item)) // (เช็คแค่ set เดียว)
    );
    const nextItem = itemsWithMinutes.find(
      (item) =>
        item.startMinutes > nowInMinutes &&
        !processedItems.has(getItemKey(item)) // (เช็คแค่ set เดียว)
    );
    // === END CHANGE ===

    let current = null;
    if (currentItem) {
      const activityData = allActivities.find(
        (a) => a.id === currentItem.activityId
      );
      if (activityData) current = { ...currentItem, ...activityData };
    }
    let next = null;
    if (nextItem) {
      const activityData = allActivities.find(
        (a) => a.id === nextItem.activityId
      );
      if (activityData) next = { ...nextItem, ...activityData };
    }
    return { current, next, todaySortedItems: itemsWithMinutes };
  }, [currentTime, dailyRoutines, routineSets, allActivities, processedItems]); // (อัปเดต dependency)

  // === 6. START CHANGE: Logic ตรวจจับ "หมดเวลา" (Routine) ===
  useEffect(() => {
    if (
      !allActivities ||
      !penalties ||
      !scheduleData.todaySortedItems ||
      isProcessing ||
      !user
    ) {
      return;
    }

    const nowInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const items = scheduleData.todaySortedItems;
    const currentProcessedItems = processedItemsRef.current;

    const itemsToProcess = items.filter(
      (item) =>
        nowInMinutes >= item.endMinutes &&
        !currentProcessedItems.has(getItemKey(item))
    );

    if (itemsToProcess.length > 0) {
      setIsProcessing(true);
      triggerPendingConfirmation(itemsToProcess, "activity"); // (ส่ง Type)
    }
  }, [
    scheduleData.todaySortedItems,
    allActivities,
    penalties,
    processedItems,
    isProcessing,
    currentTime,
    user,
  ]);
  // === END CHANGE ===

  // === 7. (ใหม่) Logic ตรวจจับ "หมดเวลา" (Task) ===
  useEffect(() => {
    // (เช็ค Task ที่หมดเวลา และยัง active)
    if (!allTasks || isProcessingTasks || !user) return;

    const now = currentTime.getTime();
    const tasksToProcess = activeTasks.filter(
      (task) =>
        task.type === "quest" && // (Event ไม่ต้องยืนยัน)
        task.endTime &&
        now > new Date(task.endTime).getTime() &&
        task.status === "active"
    );

    if (tasksToProcess.length > 0) {
      setIsProcessingTasks(true);
      triggerPendingConfirmation(tasksToProcess, "task"); // (ส่ง Type)
    }
  }, [activeTasks, currentTime, isProcessingTasks, user]);

  // === 8. (อัปเดต) ฟังก์ชัน (รวม Activity และ Task) ===
  const triggerPendingConfirmation = async (itemsToProcess, type) => {
    const newProcessedKeys = new Set(processedItemsRef.current);

    if (type === "activity") {
      for (const item of itemsToProcess) {
        const itemKey = getItemKey(item);
        const activity = allActivities.find((a) => a.id === item.activityId);
        if (!activity) continue;

        const currentActivityLevel = activity.level;
        const currentUserLevel = user.level;
        const message = `ยืนยัน: คุณทำ "${activity.name}" สำเร็จหรือไม่?`;

        try {
          await db.mailbox.add({
            timestamp: new Date().toISOString(),
            type: "pending-activity", // (Type ใหม่)
            isRead: 0,
            message: message,
            activityId: activity.id,
            activityName: activity.name,
            activityLevel: currentActivityLevel,
            userLevel: currentUserLevel,
            activityStartTime: item.startTime,
            activityEndTime: item.endTime,
          });
          newProcessedKeys.add(itemKey);
        } catch (error) {
          console.error("Failed to trigger pending activity:", error);
        }
      }
      setProcessedItems(newProcessedKeys);
      storeTodaySet("processedItems", newProcessedKeys);
      setIsProcessing(false); // (ปลดล็อก Routine)
    } else if (type === "task") {
      for (const task of itemsToProcess) {
        try {
          // (อัปเดต status)
          await db.tasks.update(task.id, { status: "pending" });

          await db.mailbox.add({
            timestamp: new Date().toISOString(),
            type: "pending-task", // (Type ใหม่)
            isRead: 0,
            message: `ยืนยัน: คุณทำ Task "${task.name}" สำเร็จหรือไม่?`,
            taskId: task.id,
            activityName: task.name,
            taskReward: task.reward,
            taskPenalty: task.penalty,
            activityStartTime: task.startTime,
            activityEndTime: task.endTime,
          });
        } catch (error) {
          console.error("Failed to trigger pending task:", error);
        }
      }
      setIsProcessingTasks(false); // (ปลดล็อก Task)
    }
  };
  // === END CHANGE ===

  // --- 9. Logic การแสดงผล (Routine) ---
  const currentActivity = overrideActivity || scheduleData.current;
  const isResting = !currentActivity;
  const nextActivity = overrideActivity ? null : scheduleData.next;

  // --- 10. Handlers (Routine) ---
  const executeDone = async () => {
    if (!currentActivity || !user) return;
    const levelForRewardCalc =
      currentActivity.level === 0 ? 1 : currentActivity.level;
    const cappedLevel = Math.min(30, levelForRewardCalc);
    const multiplier = getRewardMultiplier(currentActivity.level);
    const reward = cappedLevel * multiplier;
    const oldLevel = currentActivity.level;
    const newLevel = currentActivity.level + 1;
    const newMoney = user.money + reward;
    try {
      await db.activities.update(currentActivity.id, { level: newLevel });
      await db.userProfile.update(user.id, { money: newMoney });
      if (overrideActivity) {
        setOverrideActivity(null);
      }

      // === (อัปเดต) 'processedItems' ===
      const newProcessedSet = new Set(processedItems).add(
        getItemKey(currentActivity)
      );
      setProcessedItems(newProcessedSet);
      storeTodaySet("processedItems", newProcessedSet);

      setShowConfirm(false);
      setRewardInfo({
        activityName: currentActivity.name,
        oldLevel: oldLevel,
        newLevel: newLevel,
        reward: reward,
      });
    } catch (error) {
      console.error('Failed to save "Done" state:', error);
      setShowConfirm(false);
    }
  };
  const promptDoneClick = () => {
    setShowConfirm(true);
  };
  const cancelDone = () => {
    setShowConfirm(false);
  };
  const closeRewardModal = () => {
    setRewardInfo(null);
  };
  const handleSkip = () => {
    if (nextActivity) setOverrideActivity(nextActivity);
  };

  // (Handlers Task/Quest - เหมือนเดิม)
  const openAddTaskModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };
  const openEditTaskModal = (task) => {
    setSelectedTask(null);
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
  };

  // --- 11. JSX (เหมือนเดิม) ---
  return (
    <>
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <h2>
          {currentTime.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </h2>
        <p>
          {currentTime.toLocaleDateString("th-TH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div style={styles.mainBox}>
        {isResting ? (
          <>
            <h2 style={styles.activityTitle}>พักผ่อน</h2>
            <p style={styles.activityLevel}>
              {nextActivity
                ? `กิจกรรมถัดไป: ${nextActivity.name}`
                : "ไม่มีกิจกรรมเหลือ"}
            </p>
            <p style={styles.activityTime}>
              {nextActivity ? (
                `(เวลา ${nextActivity.startTime})`
              ) : (
                <Link to="/edit-routine" style={styles.link}>
                  ตั้งค่า Routine
                </Link>
              )}
            </p>
            {nextActivity && (
              <button onClick={handleSkip} style={styles.skipButton}>
                <SkipForward size={18} />
                <span>เริ่มเลย (Skip)</span>
              </button>
            )}
          </>
        ) : (
          <>
            <h2 style={styles.activityTitle}>{currentActivity.name}</h2>
            <p style={styles.activityLevel}>Level: {currentActivity.level}</p>
            <p style={styles.activityTime}>
              {currentActivity.startTime} - {currentActivity.endTime}
            </p>
            <button onClick={promptDoneClick} style={styles.doneButton}>
              <Check size={20} />
              <span>Done</span>
            </button>
          </>
        )}
      </div>

      <div style={styles.questSection}>
        <div style={styles.questHeader}>
          <h4>📜 Tasks</h4>
          <button onClick={openAddTaskModal} style={styles.questAddButton}>
            <Plus size={18} />
          </button>
        </div>

        {activeTasks.length > 0 ? (
          activeTasks.map((task) => {
            const now = currentTime;
            const startTime = new Date(task.startTime);
            const endTime = task.endTime ? new Date(task.endTime) : null;
            const isExpired = endTime && now > endTime;
            const hasStarted = now > startTime;
            const isEventNoEnd = task.type === "event" && !endTime;

            let timeText = "";
            let timeStyle = styles.questItem_span;
            const borderColor = task.type === "quest" ? "#64cfff" : "#c864ff";

            if (isExpired) {
              // (ถ้าหมดเวลาแล้ว แต่ยัง Active อยู่ = บัค, แต่เราจะซ่อนไว้ก่อน)
              // (ระบบ Fail Detector จะจัดการเปลี่ยน status)
              timeText = `(กำลังประมวลผล...)`;
            } else if (hasStarted && endTime) {
              timeText = getQuestCountdown(task.endTime, now);
              timeStyle = {
                ...styles.questItem_span,
                color: "#FFD700",
                fontWeight: "bold",
              };
            } else if (hasStarted && isEventNoEnd) {
              timeText = `(Event เริ่มแล้ว)`;
            } else {
              timeText = `เริ่ม: ${startTime.toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}`;
            }

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                style={{
                  ...styles.questItem, // (แก้)
                  borderLeftColor: borderColor,
                }}
              >
                <p style={styles.questItem_p}>{task.name}</p>
                <span style={timeStyle}>{timeText}</span>
              </div>
            );
          })
        ) : (
          <p style={styles.emptyText}>ไม่มี Task ในตอนนี้</p>
        )}
      </div>

      {/* Modals (เหมือนเดิม) */}
      {showConfirm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>ยืนยันการทำกิจกรรม</h3>
            </div>
            <p>
              คุณได้ทำกิจกรรม "{currentActivity?.name}" เสร็จสิ้นแล้วใช่หรือไม่?
            </p>
            <div style={styles.modalFooter}>
              <button onClick={cancelDone} style={styles.cancelButton}>
                <X size={18} /> ยกเลิก
              </button>
              <button onClick={executeDone} style={styles.confirmButton}>
                <Check size={18} /> ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
      {rewardInfo && (
        <RewardModal info={rewardInfo} onClose={closeRewardModal} />
      )}
      {isTaskModalOpen && (
        <TaskModal
          onClose={closeTaskModal}
          penalties={penalties || []}
          taskToEdit={taskToEdit}
        />
      )}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={openEditTaskModal}
          user={user}
        />
      )}
    </>
  );
}

// (Component 'TaskModal', 'TaskDetailModal', 'RewardModal' ... ทั้งหมดเหมือนเดิม)

// === TaskModal ===
function TaskModal({ onClose, penalties, taskToEdit }) {
  const isEditMode = !!taskToEdit;
  const [name, setName] = useState(taskToEdit?.name || "");
  const [detail, setDetail] = useState(taskToEdit?.detail || "");
  const [startTime, setStartTime] = useState(taskToEdit?.startTime || "");
  const [endTime, setEndTime] = useState(taskToEdit?.endTime || "");
  const [difficulty, setDifficulty] = useState(taskToEdit?.difficulty || "low");
  const [penaltyText, setPenaltyText] = useState(taskToEdit?.penalty || "");
  const [type, setType] = useState(taskToEdit?.type || "quest");
  const [error, setError] = useState(null);
  const handleRandomPenalty = () => {
    if (penalties.length === 0) {
      setPenaltyText("N/A");
      return;
    }
    const random = penalties[Math.floor(Math.random() * penalties.length)];
    setPenaltyText(random.name);
  };
  const handleSubmit = async () => {
    setError(null);
    if (!name || !startTime) {
      setError("กรุณากรอกชื่อ และ เวลาเริ่ม");
      return;
    }
    let finalEndTime = endTime;
    if (type === "event" && endTime === "") {
      finalEndTime = null;
    }
    if (type === "quest" && !endTime) {
      setError('"Quest" ต้องมีเวลาหมดเขต');
      return;
    }
    if (finalEndTime) {
      const start = new Date(startTime);
      const end = new Date(finalEndTime);
      if (start >= end) {
        setError("เวลาเริ่ม ต้องมาก่อน เวลาหมดเขต");
        return;
      }
    }
    const reward = type === "quest" ? calculateQuestReward(difficulty) : 0;
    let finalPenalty = type === "quest" ? penaltyText.trim() : "N/A";
    if (type === "quest" && finalPenalty === "") {
      const random =
        penalties.length > 0
          ? penalties[Math.floor(Math.random() * penalties.length)]
          : { name: "N/A" };
      finalPenalty = random.name;
    }
    const taskData = {
      name: name,
      detail: detail,
      startTime: startTime,
      endTime: finalEndTime,
      difficulty: type === "quest" ? difficulty : null,
      reward: reward,
      penalty: finalPenalty,
      status: taskToEdit?.status || "active",
      type: type,
    };
    try {
      if (isEditMode) {
        await db.tasks.update(taskToEdit.id, taskData);
      } else {
        await db.tasks.add(taskData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
      setError("เกิดข้อผิดพลาดในการบันทึก");
    }
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>{isEditMode ? "แก้ไข Task" : "สร้าง Task ใหม่"}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ประเภท</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={styles.select}
            >
              <option value="quest">Quest (มีรางวัล/บทลงโทษ)</option>
              <option value="event">Event (แจ้งเตือน)</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label>ชื่อ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>รายละเอียด (ไม่จำเป็น)</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              style={styles.textarea}
              rows={2}
            ></textarea>
          </div>
          <div style={styles.inputGroup}>
            <label>เวลาเริ่ม</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>เวลาหมดเขต {type === "event" && "(ไม่จำเป็น)"}</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={styles.input}
            />
          </div>
          {type === "quest" && (
            <>
              <div style={styles.inputGroup}>
                <label>ระดับความยาก (มีผลต่อรางวัล)</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={styles.select}
                >
                  <option value="low">ต่ำ</option>
                  <option value="medium">กลาง</option>
                  <option value="high">สูง</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label>บทลงโทษ (ถ้าพลาด)</label>
                <div style={styles.penaltyInputBox}>
                  <input
                    type="text"
                    value={penaltyText}
                    onChange={(e) => setPenaltyText(e.target.value)}
                    style={styles.input}
                    placeholder="(ปล่อยว่างเพื่อสุ่ม)"
                  />
                  <button
                    onClick={handleRandomPenalty}
                    style={styles.randomButton}
                  >
                    <Dice5 size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
          <button onClick={handleSubmit} style={styles.saveButton}>
            {isEditMode ? <Edit size={18} /> : <Plus size={18} />}
            {isEditMode ? "บันทึกการแก้ไข" : "สร้าง Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// === TaskDetailModal ===
function TaskDetailModal({ task, onClose, onEdit, user }) {
  const handleTaskAction = async (action) => {
    if (action === "done" && user) {
      const newMoney = user.money + task.reward;
      try {
        await db.userProfile.update(user.id, { money: newMoney });
        await db.tasks.delete(task.id);
        onClose();
      } catch (error) {
        console.error("Failed to complete quest:", error);
      }
    } else if (action === "fail") {
      try {
        await db.tasks.delete(task.id);
        onClose();
      } catch (error) {
        console.error("Failed to fail quest:", error);
      }
    } else if (action === "acknowledge") {
      try {
        await db.tasks.delete(task.id);
        onClose();
      } catch (error) {
        console.error("Failed to ack event:", error);
      }
    }
  };
  const isExpired = task.endTime && new Date() > new Date(task.endTime);
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={isExpired ? { color: "#ffaaaa" } : {}}>{task.name}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalDetailBody}>
          <p>{task.detail || "ไม่มีรายละเอียด"}</p>
          <hr style={styles.hr} />
          {task.type === "quest" && (
            <>
              <div style={styles.rewardInfoBox}>
                <Coins size={18} color="#FFD700" />
                <span>รางวัล:</span>
                <span style={{ color: "#FFD700" }}>
                  <strong>{task.reward} Coins</strong>
                </span>
                <span>(ความยาก: {task.difficulty})</span>
              </div>
              <div style={{ ...styles.rewardInfoBox, color: "#ffaaaa" }}>
                <ShieldAlert size={18} />
                <span>บทลงโทษ (ถ้าพลาด):</span>
                <span style={{ color: "#ffaaaa" }}>
                  <strong>{task.penalty}</strong>
                </span>
              </div>
            </>
          )}
          <div style={{ ...styles.rewardInfoBox, color: "#aaa" }}>
            <CalendarClock size={18} />
            <span>เวลาเริ่ม:</span>
            <span>{new Date(task.startTime).toLocaleString("th-TH")}</span>
          </div>
          {task.endTime && (
            <div
              style={{
                ...styles.rewardInfoBox,
                color: isExpired ? "#ffaaaa" : "#aaa",
              }}
            >
              <CalendarClock size={18} />
              <span>หมดเขต:</span>
              <span>{new Date(task.endTime).toLocaleString("th-TH")}</span>
            </div>
          )}
          {isExpired && task.type === "quest" && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} />
              <span>เควสนี้หมดเวลาแล้ว</span>
            </div>
          )}
        </div>
        <div style={styles.modalFooter}>
          {task.type === "quest" ? (
            <>
              <button onClick={() => onEdit(task)} style={styles.editButton}>
                <Edit size={18} /> แก้ไข
              </button>
              <div style={{ flexGrow: 1 }} />
              <button
                onClick={() => handleTaskAction("fail")}
                style={styles.cancelButton}
              >
                <X size={18} /> Fail
              </button>
              <button
                onClick={() => handleTaskAction("done")}
                style={styles.confirmButton}
                disabled={isExpired}
              >
                <Check size={18} /> Done
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onEdit(task)} style={styles.editButton}>
                <Edit size={18} /> แก้ไข
              </button>
              <div style={{ flexGrow: 1 }} />
              <button
                onClick={() => handleTaskAction("acknowledge")}
                style={styles.confirmButton}
              >
                <Check size={18} /> รับทราบ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// === RewardModal ===
function RewardModal({ info, onClose }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.modalHeader, ...styles.rewardHeader }}>
          <PartyPopper size={24} />
          <h3 style={{ margin: "0 0 0 10px" }}>Congratulations!</h3>
        </div>
        <div style={styles.rewardBody}>
          <p>คุณทำกิจกรรม "{info.activityName}" สำเร็จ!</p>
          <div style={styles.rewardInfoBox}>
            <span>Level Up:</span>
            <span>
              Lv. {info.oldLevel} &rarr; <strong>Lv. {info.newLevel}</strong>
            </span>
          </div>
          <div style={styles.rewardInfoBox}>
            <span>Reward:</span>
            <span style={{ color: "#FFD700" }}>
              <strong>+ {info.reward} Coins</strong>
            </span>
          </div>
        </div>
        <div style={{ ...styles.modalFooter, justifyContent: "center" }}>
          <button
            onClick={onClose}
            style={{ ...styles.confirmButton, width: "100%" }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// (CSS 'styles' object ทั้งหมดเหมือนเดิม)
const styles = {
  mainBox: {
    flexShrink: 0,
    border: "1px solid #444",
    borderRadius: "10px",
    margin: "15px 0",
    padding: "20px",
    backgroundColor: "#2a2a2a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },
  activityTitle: {
    margin: 0,
    fontSize: "2rem",
    color: "#64cfff",
    textAlign: "center",
  },
  activityLevel: {
    margin: 0,
    fontSize: "1.2rem",
    color: "#aaa",
  },
  activityTime: {
    margin: 0,
    fontSize: "1rem",
    color: "#888",
    marginBottom: "15px",
  },
  doneButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "80%",
    maxWidth: "250px",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#3a8b3a",
    color: "white",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "bold",
  },
  skipButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "80%",
    maxWidth: "250px",
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#646cff",
    color: "white",
    cursor: "pointer",
    fontSize: "1.1rem",
  },
  link: {
    color: "#64cfff",
    textDecoration: "none",
  },
  questSection: {
    flexGrow: 1,
    overflowY: "auto",
    paddingTop: "10px",
    borderTop: "1px solid #444",
  },
  questHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    padding: "0 5px",
  },
  questHeader_h4: {
    margin: 0,
  },
  questAddButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  questItem: {
    backgroundColor: "#333",
    padding: "10px 15px",
    borderRadius: "8px",
    marginBottom: "5px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
    cursor: "pointer",
    borderLeft: "4px solid #646cff",
  },
  questItemExpired: {
    backgroundColor: "#333",
    padding: "10px 15px",
    borderRadius: "8px",
    marginBottom: "5px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
    cursor: "pointer",
    borderLeft: "4px solid #ff3b30",
    opacity: 0.7,
  },
  questItem_p: {
    margin: 0,
    fontWeight: "bold",
  },
  questItem_span: {
    fontSize: "0.8rem",
    color: "#aaa",
    flexShrink: 0,
    marginLeft: "10px",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "10px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: "15px",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "20px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  modalFooter: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "20px",
  },
  confirmButton: {
    background: "#3a8b3a",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "1rem",
  },
  cancelButton: {
    background: "#c0392b",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "1rem",
  },
  rewardHeader: {
    justifyContent: "center",
    color: "#64ff64",
    borderBottom: "1px solid #3a8b3a",
  },
  rewardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px 0",
  },
  rewardInfoBox: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#333",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "1.1rem",
    gap: "10px",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #555",
    borderRadius: "5px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  penaltyInputBox: {
    display: "flex",
    gap: "5px",
  },
  randomButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "0 10px",
    cursor: "pointer",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#4d2a2a",
    color: "#ffaaaa",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "0.9rem",
    marginTop: "10px",
  },
  saveButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "1rem",
  },
  modalDetailBody: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #444",
    margin: "5px 0",
  },
  editButton: {
    background: "#555",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "1rem",
  },
};

export default Home;
