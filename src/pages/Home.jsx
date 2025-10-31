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
} from "lucide-react";

// === Helper Functions (อัปเดต) ===

/** สร้าง Key ที่ไม่ซ้ำกันสำหรับ item */
const getItemKey = (item) => `${item.startTime}-${item.activityId}`;

/** คำวณตัวคูณเงินรางวัล */
const getRewardMultiplier = (activityLevel) => {
  const baseMin = 10;
  const baseMax = 15;
  const levelCap = 100;
  const currentLevel = Math.min(activityLevel, levelCap);
  const minReward = Math.floor(
    baseMin + (baseMax - baseMin) * (currentLevel / levelCap)
  );
  return Math.floor(Math.random() * (baseMax - minReward + 1)) + minReward;
};

/** แปลง "HH:mm" เป็นจำนวนนาที */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

/** ดึง "วันนี้" เป็น YYYY-MM-DD */
const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA");
};

/** ดึง Set (completed/failed) จาก localStorage */
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

/** บันทึก Set (completed/failed) ลง localStorage */
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

/** คำนวณรางวัล Quest */
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

// === START CHANGE: (ใหม่) ฟังก์ชันนับถอยหลัง Quest ===
/**
 * คำนวณเวลานับถอยหลัง
 * @param {string} endTimeISO - เวลาหมดเขต (ISO String)
 * @param {Date} now - เวลาปัจจุบัน (Date object)
 * @returns {string} - "เหลือ 02:30:15"
 */
const getQuestCountdown = (endTimeISO, now) => {
  const endTime = new Date(endTimeISO);
  const diff = endTime - now; // (milliseconds)

  // ถ้าหมดเวลาแล้ว (เผื่อไว้)
  if (diff <= 0) return "หมดเวลา";

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // PadStart(2, '0') เพื่อให้เป็นเลข 2 หลักเสมอ (เช่น 05)
  return `เหลือ ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
// === END CHANGE ===

// === Main Component ===
function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedItems, setCompletedItems] = useState(() =>
    getStoredTodaySet("completedItems")
  );
  const [failedItems, setFailedItems] = useState(() =>
    getStoredTodaySet("failedItems")
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const failedItemsRef = useRef(failedItems);
  useEffect(() => {
    failedItemsRef.current = failedItems;
  }, [failedItems]);

  const [overrideActivity, setOverrideActivity] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);

  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);

  // --- 1. ดึงข้อมูล DB ---
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const dailyRoutines = useLiveQuery(() => db.dailyRoutines.toArray(), []);
  const routineSets = useLiveQuery(() => db.routineSets.toArray(), []);
  const allActivities = useLiveQuery(() => db.activities.toArray(), []);
  const penalties = useLiveQuery(() => db.penalties.toArray(), []);
  const allQuests = useLiveQuery(() => db.quests.toArray(), []);

  const activeQuests = useMemo(() => {
    return allQuests ? allQuests.filter((q) => q.status === "active") : [];
  }, [allQuests]);

  // --- 2. Ticker (ตัวนับเวลา) ---
  useEffect(() => {
    // (Logic ส่วนนี้เหมือนเดิม)
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now); // (สำคัญ) อัปเดต currentTime ทุกวินาที

      const storedDate = JSON.parse(
        localStorage.getItem("completedItems") || "{}"
      ).date;
      if (storedDate && storedDate !== getTodayDateString()) {
        setCompletedItems(new Set());
        setFailedItems(new Set());
        storeTodaySet("completedItems", new Set());
        storeTodaySet("failedItems", new Set());
        setOverrideActivity(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 3. Core Logic (Routine) ---
  const scheduleData = useMemo(() => {
    // (Logic ส่วนนี้เหมือนเดิม)
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
    const currentItem = itemsWithMinutes.find(
      (item) =>
        nowInMinutes >= item.startMinutes &&
        nowInMinutes < item.endMinutes &&
        !completedItems.has(getItemKey(item)) &&
        !failedItems.has(getItemKey(item))
    );
    const nextItem = itemsWithMinutes.find(
      (item) =>
        item.startMinutes > nowInMinutes &&
        !completedItems.has(getItemKey(item)) &&
        !failedItems.has(getItemKey(item))
    );
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
  }, [
    currentTime,
    dailyRoutines,
    routineSets,
    allActivities,
    completedItems,
    failedItems,
  ]);

  // --- 4. Logic ตรวจจับ "Fail" (Routine) ---
  useEffect(() => {
    // (Logic ส่วนนี้เหมือนเดิม)
    if (
      !allActivities ||
      !penalties ||
      !scheduleData.todaySortedItems ||
      isProcessing
    ) {
      return;
    }
    const nowInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const items = scheduleData.todaySortedItems;
    const currentFailedItems = failedItemsRef.current;
    const itemsToFail = items.filter(
      (item) =>
        nowInMinutes >= item.endMinutes &&
        !completedItems.has(getItemKey(item)) &&
        !currentFailedItems.has(getItemKey(item))
    );
    if (itemsToFail.length > 0) {
      setIsProcessing(true);
      processFailures(itemsToFail);
    }
  }, [
    scheduleData.todaySortedItems,
    allActivities,
    penalties,
    completedItems,
    isProcessing,
    currentTime,
  ]);

  // --- 5. ฟังก์ชัน xử lý Fail (Routine) ---
  const processFailures = async (itemsToFail) => {
    // (Logic ส่วนนี้เหมือนเดิม)
    const newFailedKeys = new Set(failedItemsRef.current);
    for (const item of itemsToFail) {
      const itemKey = getItemKey(item);
      const activity = allActivities.find((a) => a.id === item.activityId);
      if (!activity) continue;
      const levelDrop = Math.ceil(activity.level / 3);
      const newLevel = Math.max(0, activity.level - levelDrop);
      const randomPenalty =
        penalties.length > 0
          ? penalties[Math.floor(Math.random() * penalties.length)]
          : { name: "N/A" };
      const message = `คุณพลาดกิจกรรม "${activity.name}"`;
      try {
        await db.activities.update(activity.id, { level: newLevel });
        await db.mailbox.add({
          timestamp: new Date().toISOString(),
          type: "fail-activity",
          isRead: 0,
          message: message,
          activityName: activity.name,
          levelDrop: levelDrop,
          penaltyName: randomPenalty.name,
          activityStartTime: item.startTime,
          activityEndTime: item.endTime,
        });
        newFailedKeys.add(itemKey);
      } catch (error) {
        console.error("Failed to process failure:", error);
      }
    }
    setFailedItems(newFailedKeys);
    storeTodaySet("failedItems", newFailedKeys);
    setIsProcessing(false);
  };

  // --- 6. Logic การแสดงผล (Routine) ---
  const currentActivity = overrideActivity || scheduleData.current;
  const isResting = !currentActivity;
  const nextActivity = overrideActivity ? null : scheduleData.next;

  // --- 7. Handlers (Routine) ---
  const executeDone = async () => {
    // (Logic ส่วนนี้เหมือนเดิม)
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
      const newCompletedSet = new Set(completedItems).add(
        getItemKey(currentActivity)
      );
      setCompletedItems(newCompletedSet);
      storeTodaySet("completedItems", newCompletedSet);
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

  // --- 8. JSX ---
  return (
    <>
      {/* ส่วนบน: เวลา (เหมือนเดิม) */}
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

      {/* ส่วนกลาง: กิจกรรม/พัก (เหมือนเดิม) */}
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

      {/* ส่วน Quest (อัปเดต) */}
      <div style={styles.questSection}>
        <div style={styles.questHeader}>
          <h4>📜 Quests</h4>
          <button
            onClick={() => setIsAddingQuest(true)}
            style={styles.questAddButton}
          >
            <Plus size={18} />
          </button>
        </div>

        {activeQuests.length > 0 ? (
          activeQuests.map((quest) => {
            // === START CHANGE: Logic ใหม่สำหรับแสดงผลเวลา Quest ===
            const now = currentTime; // (สำคัญ) ใช้ currentTime จาก state
            const startTime = new Date(quest.startTime);
            const endTime = new Date(quest.endTime);
            const isExpired = now > endTime;
            const hasStarted = now > startTime;

            let timeText = "";
            let timeStyle = styles.questItem_span; // Default

            if (isExpired) {
              timeText = `(หมดเวลาแล้ว)`;
              timeStyle = {
                ...styles.questItem_span,
                color: "#ffaaaa",
                fontWeight: "bold",
              };
            } else if (hasStarted) {
              // (ใหม่) เรียกใช้ Countdown
              timeText = getQuestCountdown(quest.endTime, now);
              timeStyle = {
                ...styles.questItem_span,
                color: "#FFD700",
                fontWeight: "bold",
              };
            } else {
              // (เหมือนเดิม)
              timeText = `เริ่ม: ${startTime.toLocaleString("th-TH", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}`;
            }
            // === END CHANGE ===

            return (
              <div
                key={quest.id}
                onClick={() => setSelectedQuest(quest)}
                style={isExpired ? styles.questItemExpired : styles.questItem}
              >
                <p style={styles.questItem_p}>{quest.name}</p>
                {/* === START CHANGE: ใช้ Style และ Text ใหม่ === */}
                <span style={timeStyle}>{timeText}</span>
                {/* === END CHANGE === */}
              </div>
            );
          })
        ) : (
          <p style={styles.emptyText}>ไม่มีเควสในตอนนี้</p>
        )}
      </div>

      {/* Modals ของ Routine (เหมือนเดิม) */}
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

      {/* Modals ใหม่สำหรับ Quest (อัปเดต) */}
      {isAddingQuest && (
        <AddQuestModal
          onClose={() => setIsAddingQuest(false)}
          penalties={penalties || []}
        />
      )}

      {selectedQuest && (
        <QuestDetailModal
          quest={selectedQuest}
          onClose={() => setSelectedQuest(null)}
          user={user}
        />
      )}
    </>
  );
}

// =======================================================
// === (อัปเดต) Component: Modal สร้าง Quest ===
// =======================================================
function AddQuestModal({ onClose, penalties }) {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [difficulty, setDifficulty] = useState("low");
  const [penaltyText, setPenaltyText] = useState("");
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
    if (!name || !startTime || !endTime) {
      setError("กรุณากรอกชื่อ, เวลาเริ่ม, และเวลาหมดเขต");
      return;
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      setError("เวลาเริ่ม ต้องมาก่อน เวลาหมดเขต");
      return;
    }
    const reward = calculateQuestReward(difficulty);

    let finalPenalty = penaltyText.trim();
    if (finalPenalty === "") {
      const random =
        penalties.length > 0
          ? penalties[Math.floor(Math.random() * penalties.length)]
          : { name: "N/A" };
      finalPenalty = random.name;
    }

    try {
      await db.quests.add({
        name: name,
        detail: detail,
        startTime: startTime,
        endTime: endTime,
        difficulty: difficulty,
        reward: reward,
        penalty: finalPenalty,
        status: "active",
      });
      onClose();
    } catch (error) {
      console.error("Failed to add quest:", error);
      setError("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>สร้างเควสใหม่</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* === Form UI (อัปเดต) === */}
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อเควส</label>
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
            <label>เวลาหมดเขต</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={styles.input}
            />
          </div>

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
              <button onClick={handleRandomPenalty} style={styles.randomButton}>
                <Dice5 size={18} />
              </button>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleSubmit} style={styles.saveButton}>
            <Plus size={18} /> สร้างเควส
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'QuestDetailModal' เหมือนเดิม)
function QuestDetailModal({ quest, onClose, user }) {
  const handleQuestDone = async () => {
    if (!user) return;
    const newMoney = user.money + quest.reward;
    try {
      await db.userProfile.update(user.id, { money: newMoney });
      await db.quests.delete(quest.id);
      onClose();
    } catch (error) {
      console.error("Failed to complete quest:", error);
    }
  };
  const handleQuestFail = async () => {
    try {
      await db.quests.delete(quest.id);
      onClose();
    } catch (error) {
      console.error("Failed to fail quest:", error);
    }
  };
  const isExpired = new Date() > new Date(quest.endTime);
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3 style={isExpired ? { color: "#ffaaaa" } : {}}>{quest.name}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalDetailBody}>
          <p>{quest.detail || "ไม่มีรายละเอียด"}</p>
          <hr style={styles.hr} />
          <div style={styles.rewardInfoBox}>
            <Coins size={18} color="#FFD700" />
            <span>รางวัล:</span>
            <span style={{ color: "#FFD700" }}>
              <strong>{quest.reward} Coins</strong>
            </span>
            <span>(ความยาก: {quest.difficulty})</span>
          </div>
          <div style={{ ...styles.rewardInfoBox, color: "#ffaaaa" }}>
            <ShieldAlert size={18} />
            <span>บทลงโทษ (ถ้าพลาด):</span>
            <span style={{ color: "#ffaaaa" }}>
              <strong>{quest.penalty}</strong>
            </span>
          </div>
          <div style={{ ...styles.rewardInfoBox, color: "#aaa" }}>
            <CalendarClock size={18} />
            <span>หมดเขต:</span>
            <span>{new Date(quest.endTime).toLocaleString("th-TH")}</span>
          </div>
          {isExpired && (
            <div style={styles.errorBox}>
              <AlertTriangle size={18} />
              <span>เควสนี้หมดเวลาแล้ว</span>
            </div>
          )}
        </div>
        <div style={styles.modalFooter}>
          <button onClick={handleQuestFail} style={styles.cancelButton}>
            <X size={18} /> Fail
          </button>
          <button
            onClick={handleQuestDone}
            style={styles.confirmButton}
            disabled={isExpired}
          >
            <Check size={18} /> Done
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'RewardModal' เหมือนเดิม)
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
};

export default Home;
