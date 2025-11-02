// src/pages/Health.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, calculateLevel } from "../db";
import { Link } from "react-router-dom";
import {
  Plus,
  Droplet,
  Zap,
  Edit,
  Save,
  X,
  Dumbbell,
  Target,
  CheckCircle,
  Gift, // (Import ไอคอนรางวัล)
} from "lucide-react";
import {
  getTodayVegetableGoal,
  VEGETABLE_COLOR_CATEGORIES,
  getAge,
  getActivityMultiplier,
  calculateReward,
} from "../utils/healthUtils";

// === Helper Functions ===
const activityLevelMap = {
  1: "ไม่ออกกำลังกายเลย",
  2: "1-3 ครั้ง/สัปดาห์",
  3: "3-5 ครั้ง/สัปดาห์",
  4: "6-7 ครั้ง/สัปดาห์",
  5: "วันละ 2 ครั้ง",
};
const goalMap = {
  lose_weight: "ลดน้ำหนัก",
  gain_muscle: "เพิ่มกล้ามเนื้อ",
  body_recomp: "เพิ่มกล้ามลดไขมัน",
  maintain: "รักษารูปร่าง",
};
const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA");
};
const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return { text: "น้ำหนักน้อย / ผอม", color: "#64cfff" };
  if (bmi < 23) return { text: "ปกติ (สมส่วน)", color: "#64ff64" };
  if (bmi < 25) return { text: "น้ำหนักเกิน (ท้วม)", color: "#FFD700" };
  if (bmi < 30) return { text: "โรคอ้วน ระดับ 1", color: "#ff9500" };
  return { text: "โรคอ้วน ระดับ 2 (อันตราย)", color: "#ff3b30" };
};

// (Component 'MacroBar' ... เหมือนเดิม)
const MacroBar = ({ label, unit, current, target, targetMin, targetMax }) => {
  const targetDisplay = targetMax
    ? `${targetMin} - ${targetMax}`
    : target.toLocaleString();
  let percentage = 0;
  if (target > 0) {
    percentage = (current / target) * 100;
  } else if (targetMax > 0) {
    percentage = (current / targetMax) * 100;
  }
  const minPercentage = targetMax ? (targetMin / targetMax) * 100 : 0;
  return (
    <div style={styles.macroBarContainer}>
      <div style={styles.macroHeader}>
        <span>
          {label} ({unit})
        </span>
        <span>
          {current.toLocaleString()} / {targetDisplay}
        </span>
      </div>
      <div style={styles.hpBarOuter}>
        <div
          style={{
            ...styles.hpBarInner,
            width: `${percentage}%`,
            backgroundColor:
              targetMin && current >= targetMin ? "#64ff64" : "#64cfff",
          }}
        ></div>
        {targetMin && (
          <div
            style={{
              ...styles.hpMinLine,
              left: `${minPercentage}%`,
            }}
          ></div>
        )}
      </div>
    </div>
  );
};

// (Component: 'HealthStats' ... เหมือนเดิม)
const HealthStats = ({ title, weight, height, birthday, activityLevel }) => {
  const age = getAge(birthday);

  const { bmi, bmr, tdee, bmiCategory } = useMemo(() => {
    if (!weight || !height || !birthday || !activityLevel) {
      return {
        bmi: 0,
        bmr: 0,
        tdee: 0,
        bmiCategory: { text: "N/A", color: "#aaa" },
      };
    }
    const w = Number(weight);
    const h = Number(height);
    const a = getAge(birthday);

    const heightInM = h / 100;
    const bmiVal = w / (heightInM * heightInM);
    const bmrVal = 10 * w + 6.25 * h - 5 * a + 5;
    const tdeeVal = bmrVal * getActivityMultiplier(activityLevel);

    return {
      bmi: bmiVal.toFixed(2),
      bmr: bmrVal.toFixed(0),
      tdee: tdeeVal.toFixed(0),
      bmiCategory: getBmiCategory(bmiVal),
    };
  }, [weight, height, birthday, activityLevel]);

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.grid2}>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>BMR</span>
          <span style={styles.statValue}>{bmr}</span>
        </div>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>TDEE</span>
          <span style={styles.statValue}>{tdee}</span>
        </div>
      </div>
      <div style={styles.bmiBox}>
        <span style={styles.statLabel}>BMI</span>
        <span style={styles.statValue}>{bmi}</span>
        <span style={{ ...styles.bmiCategory, color: bmiCategory.color }}>
          {bmiCategory.text}
        </span>
      </div>
    </div>
  );
};

// (Component 'VegetableGoal' ... เหมือนเดิม)
const VegetableGoal = ({ goal, completed }) => {
  const isFreeDay = goal.key === "free";
  const statusColor = completed ? "#64ff64" : "#aaa";
  const icon = completed ? (
    <CheckCircle size={24} color={statusColor} />
  ) : (
    <Target size={24} color={statusColor} />
  );

  return (
    <div style={styles.section}>
      <div style={styles.vegHeader}>
        {icon}
        <h3 style={{ ...styles.sectionTitle, color: statusColor }}>
          เป้าหมายผัก/ผลไม้วันนี้
        </h3>
      </div>
      <div style={styles.vegBody}>
        <span
          style={{
            ...styles.vegColorCircle,
            backgroundColor: goal.color,
            border: isFreeDay ? "2px dashed #fff" : "none",
          }}
        ></span>
        <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
          {goal.name}
        </span>
      </div>
      {isFreeDay && !completed && (
        <p style={styles.vegNote}>
          (วันนี้กินผัก/ผลไม้สีใดก็ได้ 1 อย่างเพื่อ 완수)
        </p>
      )}
    </div>
  );
};

// === Main Component ===
function Health() {
  // (Data Hooks ... เหมือนเดิม)
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const todayKey = getTodayDateString();
  const dailyMacros = useLiveQuery(
    () => db.dailyMacros.get(todayKey),
    [todayKey]
  );

  // (States ... เหมือนเดิม)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    height: "",
    activityLevel: "1",
    goal: "maintain",
  });
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [waterAmount, setWaterAmount] = useState("");
  const [rewardModal, setRewardModal] = useState({ isOpen: false, amount: 0 });

  // (useEffect Onboarding ... เหมือนเดิม)
  useEffect(() => {
    if (user === undefined) return;

    if (user === null || !user?.weight) {
      setIsEditing(true);
    }

    setFormData({
      weight: user?.weight || "",
      height: user?.height || "",
      activityLevel: user?.activityLevel || "1",
      goal: user?.goal || "maintain",
    });
  }, [user, isEditing]);

  // (useEffect createTodayDoc ... อัปเดต v.18)
  useEffect(() => {
    const createTodayDoc = async () => {
      if (user === undefined || dailyMacros === undefined) {
        return;
      }
      if (user === null || !user.weight) {
        return;
      }
      if (dailyMacros === null) {
        console.log("Creating dailyMacro doc for today...");
        try {
          const defaultRewards = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            water: 0,
            vegetable: 0,
          };
          await db.dailyMacros.add({
            date: todayKey,
            consumedCalories: 0,
            consumedProtein: 0,
            consumedFat: 0,
            consumedCarbs: 0,
            consumedWater: 0,
            vegetableGoalMet: 0,
            rewardsMet: defaultRewards,
          });
        } catch (e) {
          console.error("Failed to create today's macro doc:", e);
        }
      }
    };
    createTodayDoc();
  }, [dailyMacros, todayKey, user]);

  // (useMemo Targets ... เหมือนเดิม)
  const targets = useMemo(() => {
    if (!user || !user.weight) {
      return {
        cals: 0,
        protMin: 0,
        protMax: 0,
        fatMin: 0,
        fatMax: 0,
        carbs: 0,
        targetWaterMin: 0,
        targetWaterMax: 0,
      };
    }
    const { weight, height, birthday, goal, activityLevel } = user;
    const age = getAge(birthday);
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    const tdee = bmr * getActivityMultiplier(activityLevel);
    let targetCals = tdee;
    let protRange = [1.4, 1.8];
    let fatPercentRange = [0.25, 0.3];
    switch (goal) {
      case "lose_weight":
        targetCals = tdee - 500;
        protRange = [1.8, 2.2];
        fatPercentRange = [0.15, 0.2];
        break;
      case "gain_muscle":
        targetCals = tdee + 300;
        protRange = [1.6, 2.0];
        fatPercentRange = [0.2, 0.3];
        break;
      case "body_recomp":
        targetCals = tdee - 100;
        protRange = [2.0, 2.5];
        fatPercentRange = [0.2, 0.25];
        break;
      case "maintain":
      default:
        break;
    }
    const protMin = Math.round(protRange[0] * weight);
    const protMax = Math.round(protRange[1] * weight);
    const fatMinKcal = targetCals * fatPercentRange[0];
    const fatMaxKcal = targetCals * fatPercentRange[1];
    const fatMin = Math.round(fatMinKcal / 9);
    const fatMax = Math.round(fatMaxKcal / 9);
    const carbKcal = targetCals - protMin * 4 - fatMinKcal;
    const carbs = Math.round(carbKcal / 4);

    const targetWaterMin = 3000;
    const targetWaterMax = 4000;

    return {
      cals: Math.round(targetCals),
      protMin,
      protMax,
      fatMin,
      fatMax,
      carbs,
      targetWaterMin,
      targetWaterMax,
    };
  }, [user]);

  // (Handlers: Save/Cancel Form ... เหมือนเดิม)
  const handleSave = async () => {
    if (!formData.weight || !formData.height) {
      alert("กรุณากรอกน้ำหนักและส่วนสูง");
      return;
    }
    try {
      const currentUser = await db.userProfile.toCollection().first();
      await db.userProfile.update(currentUser.id, {
        ...currentUser,
        weight: Number(formData.weight),
        height: Number(formData.height),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      });
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save health data:", e);
    }
  };
  const handleCancel = () => {
    if (user === null || !user.weight) {
      alert("กรุณากรอกข้อมูลสุขภาพครั้งแรกก่อนครับ");
      return;
    }
    setIsEditing(false);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // (Handlers: Water Modal)
  const handleAddWaterClick = () => {
    setWaterAmount("250");
    setIsWaterModalOpen(true);
  };

  const handleCloseWaterModal = () => {
    setIsWaterModalOpen(false);
    setWaterAmount("");
  };

  const handleCloseRewardModal = () => {
    setRewardModal({ isOpen: false, amount: 0 });
    handleCloseWaterModal(); // ปิด Modal น้ำหลังจากรับทราบรางวัล
  };

  // === START CHANGE: อัปเดต handleSaveWater (แก้บัค) ===
  const handleSaveWater = async () => {
    const amountToAdd = parseInt(waterAmount, 10);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert("กรุณากรอกปริมาณน้ำเป็นตัวเลขที่ถูกต้อง (ml)");
      return;
    }

    try {
      let currentDoc = await db.dailyMacros.get(todayKey); // (ใช้ let)
      const currentUser = await db.userProfile.get(user.id);

      if (!currentUser) {
        // (เช็คแค่ User)
        console.error("User not found. Cannot save water.");
        alert("เกิดข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้");
        return;
      }

      // (ถ้า Doc ไม่มี ให้สร้างเดี๋ยวนี้เลย)
      if (!currentDoc) {
        console.log("Creating dailyMacro doc from handleSaveWater...");
        const defaultRewards = {
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
          water: 0,
          vegetable: 0,
        };
        currentDoc = {
          // (สร้าง object doc จำลอง)
          date: todayKey,
          consumedCalories: 0,
          consumedProtein: 0,
          consumedFat: 0,
          consumedCarbs: 0,
          consumedWater: 0,
          vegetableGoalMet: 0,
          rewardsMet: defaultRewards,
        };
        await db.dailyMacros.add(currentDoc); // (บันทึกลง DB)
      }

      const newTotalWater = (currentDoc.consumedWater || 0) + amountToAdd;
      const newRewardsMet = currentDoc.rewardsMet || { water: 0 };
      let totalRewardToGive = 0;

      if (
        newTotalWater >= targets.targetWaterMin &&
        (newRewardsMet.water === 0 || newRewardsMet.water === undefined) // (เช็คเผื่อ)
      ) {
        totalRewardToGive = calculateReward();
        newRewardsMet.water = 1;
        console.log(`WATER GOAL MET! +${totalRewardToGive} Money`);
      }

      if (totalRewardToGive > 0) {
        await db.userProfile.update(user.id, {
          money: (currentUser.money || 0) + totalRewardToGive,
        });
      }

      await db.dailyMacros.update(todayKey, {
        consumedWater: newTotalWater,
        rewardsMet: newRewardsMet,
      });

      if (totalRewardToGive > 0) {
        setRewardModal({ isOpen: true, amount: totalRewardToGive });
      } else {
        handleCloseWaterModal();
      }
    } catch (e) {
      console.error("Failed to add water:", e);
    }
  };
  // === END CHANGE ===

  // --- Render ---
  if (user === undefined) {
    return <div>กำลังโหลดข้อมูลผู้ใช้...</div>;
  }

  // (Render: หน้าตั้งค่า/แก้ไข ... เหมือนเดิม)
  if (isEditing || user === null || !user.weight) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {user && user.weight ? "แก้ไขเป้าหมาย" : "ตั้งค่าสุขภาพ (ครั้งแรก)"}
          </h2>
        </div>
        <HealthStats
          title="ข้อมูลคำนวณ (โดยประมาณ)"
          weight={formData.weight}
          height={formData.height}
          birthday={user?.birthday}
          activityLevel={formData.activityLevel}
        />
        <div style={styles.formContainer}>
          {/* ( ... โค้ด Form ... ) */}
          <div style={styles.grid2}>
            <div style={styles.inputGroup}>
              <label>น้ำหนัก (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                style={styles.input}
                placeholder="เช่น 70"
              />
            </div>
            <div style={styles.inputGroup}>
              <label>ส่วนสูง (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                style={styles.input}
                placeholder="เช่น 175"
              />
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label>ระดับการออกกำลังกาย</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="1">{activityLevelMap["1"]}</option>
              <option value="2">{activityLevelMap["2"]}</option>
              <option value="3">{activityLevelMap["3"]}</option>
              <option value="4">{activityLevelMap["4"]}</option>
              <option value="5">{activityLevelMap["5"]}</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label>เป้าหมาย</label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="lose_weight">{goalMap["lose_weight"]}</option>
              <option value="gain_muscle">{goalMap["gain_muscle"]}</option>
              <option value="body_recomp">{goalMap["body_recomp"]}</option>
              <option value="maintain">{goalMap["maintain"]}</option>
            </select>
          </div>
          <div style={styles.formButtons}>
            <button onClick={handleCancel} style={styles.cancelButton}>
              <X size={18} /> ยกเลิก
            </button>
            <button onClick={handleSave} style={styles.saveButton}>
              <Save size={18} /> บันทึก
            </button>
          </div>
        </div>
      </div>
    );
  }

  // (Render: หน้าหลัก)
  const consumed = dailyMacros || {
    consumedCalories: 0,
    consumedProtein: 0,
    consumedFat: 0,
    consumedCarbs: 0,
    consumedWater: 0,
    vegetableGoalMet: 0,
    rewardsMet: {},
  };

  const todayVegGoal = getTodayVegetableGoal();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>บันทึกโภชนาการ</h2>
        <button onClick={() => setIsEditing(true)} style={styles.editButton}>
          <Edit size={16} />
          <span>แก้ไขเป้าหมาย</span>
        </button>
      </div>

      {/* 1. Kcal */}
      <div style={styles.section}>
        <div style={styles.calorieHeader}>
          <Zap size={24} color="#FFD700" />
          <h3 style={styles.sectionTitle}>แคลอรี (Kcal)</h3>
        </div>
        <MacroBar
          label=""
          unit="kcal"
          current={consumed.consumedCalories}
          target={targets.cals}
        />
      </div>

      {/* 2. Macros */}
      <div style={styles.section}>
        <MacroBar
          label="โปรตีน"
          unit="g"
          current={consumed.consumedProtein}
          targetMin={targets.protMin}
          targetMax={targets.protMax}
        />
        <MacroBar
          label="ไขมัน"
          unit="g"
          current={consumed.consumedFat}
          targetMin={targets.fatMin}
          targetMax={targets.fatMax}
        />
        <MacroBar
          label="คาร์โบไฮเดรต"
          unit="g"
          current={consumed.consumedCarbs}
          target={targets.carbs}
        />
      </div>

      {/* 3. ผัก */}
      <VegetableGoal
        goal={todayVegGoal}
        completed={consumed.vegetableGoalMet === 1}
      />

      {/* 4. น้ำ */}
      <div style={styles.section}>
        <div style={styles.waterHeader}>
          <div style={styles.waterTitle}>
            <Droplet size={24} color="#64cfff" />
            <h3 style={styles.sectionTitle}>น้ำดื่ม (ml)</h3>
          </div>
          <button onClick={handleAddWaterClick} style={styles.addWaterButton}>
            <Plus size={16} /> <span>เพิ่ม</span>
          </button>
        </div>
        <MacroBar
          label=""
          unit="ml"
          current={consumed.consumedWater}
          targetMin={targets.targetWaterMin}
          targetMax={targets.targetWaterMax}
        />
      </div>

      {/* 5. ปุ่ม Action */}
      <div style={styles.actionGrid}>
        <Link to="/log-food" style={styles.actionButton}>
          <Plus size={18} />
          <span>บันทึกอาหาร</span>
        </Link>
      </div>

      {/* 6. ปุ่ม Exercise */}
      <Link to="/exercise" style={styles.exerciseButton}>
        <Dumbbell size={20} />
        <span>ไปหน้าออกกำลังกาย</span>
      </Link>

      {/* (Modal สำหรับกรอกน้ำ) */}
      {isWaterModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>บันทึกน้ำดื่ม</h3>
            <div style={styles.inputGroup}>
              <label>กรอกปริมาณน้ำที่ดื่ม (ml)</label>
              <input
                type="number"
                value={waterAmount}
                onChange={(e) => setWaterAmount(e.target.value)}
                style={styles.input}
                placeholder="เช่น 250"
                autoFocus
              />
            </div>
            <div style={styles.formButtons}>
              <button
                onClick={handleCloseWaterModal}
                style={styles.cancelButton}
              >
                ยกเลิก
              </button>
              <button onClick={handleSaveWater} style={styles.saveButton}>
                <Droplet size={18} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* (Modal รางวัล (สำหรับน้ำ)) */}
      {rewardModal.isOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <div style={{ ...styles.itemIcon, ...styles.rewardIcon }}>
              <Gift size={32} color="white" />
            </div>
            <h3 style={styles.modalTitle}>ยินดีด้วย!</h3>
            <p style={styles.rewardText}>
              คุณบรรลุเป้าหมายการดื่มน้ำ
              <br />
              ได้รับเงินรางวัล{" "}
              <span style={styles.rewardAmount}>
                {rewardModal.amount.toLocaleString()}
              </span>{" "}
              G
            </p>
            <button onClick={handleCloseRewardModal} style={styles.saveButton}>
              รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// === CSS Styles (เหมือนเดิม) ===
const styles = {
  page: { padding: "10px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    marginBottom: "15px",
    borderBottom: "1px solid #444",
  },
  title: {
    margin: 0,
    fontSize: "1.2rem",
  },
  editButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#333",
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    fontSize: "0.9rem",
    border: "1px solid #555",
    cursor: "pointer",
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
  },
  calorieHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem",
  },
  macroBarContainer: {
    marginBottom: "15px",
  },
  "macroBarContainer:last-child": {
    marginBottom: 0,
  },
  macroHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    color: "#aaa",
    marginBottom: "5px",
  },
  hpBarOuter: {
    width: "100%",
    height: "12px",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
    position: "relative",
    overflow: "hidden",
  },
  hpBarInner: {
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.3s",
  },
  hpMinLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "2px",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    background: "#333",
    color: "white",
    border: "1px solid #555",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    textDecoration: "none",
  },
  exerciseButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px",
    background: "#c0392b",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    textDecoration: "none",
    marginTop: "15px",
    boxSizing: "border-box",
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
    textDecoration: "none",
    flex: 1,
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
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
  formButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  cancelButton: {
    background: "#555",
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
    flex: 1,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  statBox: {
    backgroundColor: "#333",
    borderRadius: "8px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "0.8rem",
    color: "#aaa",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#64cfff",
    margin: "5px 0",
  },
  bmiBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "10px",
  },
  bmiCategory: {
    fontSize: "1rem",
    fontWeight: "bold",
    marginTop: "5px",
  },
  waterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  waterTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  addWaterButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#333",
    color: "#64cfff",
    border: "1px solid #555",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    padding: "20px",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "400px",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: "1.2rem",
    textAlign: "center",
  },
  vegHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "15px",
  },
  vegBody: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
  },
  vegColorCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    boxShadow: "0 0 5px rgba(0,0,0,0.5)",
  },
  vegNote: {
    fontSize: "0.8rem",
    color: "#aaa",
    textAlign: "center",
    margin: "10px 0 0 0",
  },
  // (CSS สำหรับ Modal รางวัล)
  itemIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rewardIcon: {
    width: "60px",
    height: "60px",
    backgroundColor: "#646cff",
    margin: "0 auto",
  },
  rewardText: {
    fontSize: "1rem",
    color: "#eee",
    textAlign: "center",
    lineHeight: 1.5,
    margin: 0,
  },
  rewardAmount: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
};

export default Health;
