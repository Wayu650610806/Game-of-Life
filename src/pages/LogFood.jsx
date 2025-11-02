// src/pages/LogFood.jsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, calculateLevel } from "../db";
import {
  getAge,
  getActivityMultiplier,
  calculateReward,
  VEGETABLE_COLOR_CATEGORIES,
  getTodayVegetableGoal,
} from "../utils/healthUtils";
import {
  Plus,
  ArrowLeft,
  Carrot,
  Apple,
  Search,
  CheckCircle,
  Gift,
} from "lucide-react";

// === Helper Functions ===
const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA");
};

// === Sub-Component: Food Item (เหมือนเดิม) ===
const FoodItem = ({ food, onClick }) => {
  let details = "";
  let icon = null;

  if (food.type === "vegetable") {
    const colorInfo = VEGETABLE_COLOR_CATEGORIES[food.colorCategory] || {};
    details = `ผัก/ผลไม้ (สี${colorInfo.name || "ไม่ระบุ"})`;
    icon = (
      <div
        style={{
          ...styles.itemIcon,
          backgroundColor: colorInfo.color || "#ccc",
        }}
      >
        <Carrot size={18} color="#000" />
      </div>
    );
  } else {
    // 'normal'
    details = `${food.caloriesPerUnit} Kcal / 1 ${food.unit}`;
    icon = (
      <div style={{ ...styles.itemIcon, backgroundColor: "#e74c3c" }}>
        <Apple size={18} color="white" />
      </div>
    );
  }

  return (
    <div style={styles.foodItem} onClick={onClick}>
      {icon}
      <div style={styles.itemInfo}>
        <span style={styles.itemName}>{food.name}</span>
        <span style={styles.itemDetails}>{details}</span>
      </div>
    </div>
  );
};

// === Main Component ===
function LogFood() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState("");
  const [rewardModal, setRewardModal] = useState({ isOpen: false, amount: 0 });

  // (ดึง User และคำนวณ Targets ... เหมือนเดิม)
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const foodLibrary = useLiveQuery(() => db.foodLibrary.toArray(), []);
  const targets = useMemo(() => {
    if (!user || !user.weight) {
      return {
        cals: 0,
        protMin: 0,
        protMax: 0,
        fatMin: 0,
        fatMax: 0,
        carbs: 0,
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

    return {
      cals: Math.round(targetCals),
      protMin,
      protMax,
      fatMin,
      fatMax,
      carbs,
    };
  }, [user]);

  const filteredFood = useMemo(() => {
    if (!foodLibrary) return [];
    if (!searchQuery.trim()) return foodLibrary;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return foodLibrary.filter((food) =>
      food.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [foodLibrary, searchQuery]);

  const todayVegGoal = getTodayVegetableGoal();
  const todayKey = getTodayDateString();

  // === Handlers ===
  const handleFoodClick = (food) => {
    setSelectedFood(food);
    if (food.unit === "g") {
      setAmount("100");
    } else {
      setAmount("1");
    }
  };

  const handleCloseModal = () => {
    setSelectedFood(null);
    setAmount("");
  };

  const handleCloseRewardModal = () => {
    setRewardModal({ isOpen: false, amount: 0 });
    navigate("/health");
  };

  // === START CHANGE: อัปเดต handleLogFood (แก้บัค) ===
  const handleLogFood = async () => {
    if (!selectedFood || !user) return;
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert("กรุณากรอกปริมาณให้ถูกต้อง");
      return;
    }

    const cals = (selectedFood.caloriesPerUnit || 0) * amountNum;
    const prot = (selectedFood.proteinPerUnit || 0) * amountNum;
    const fat = (selectedFood.fatPerUnit || 0) * amountNum;
    const carbs = (selectedFood.carbsPerUnit || 0) * amountNum;

    let isVegGoalMetByThis = false;
    if (selectedFood.type === "vegetable") {
      if (
        todayVegGoal.key === "free" ||
        selectedFood.colorCategory === todayVegGoal.key
      ) {
        isVegGoalMetByThis = true;
      }
    }

    try {
      let currentDoc = await db.dailyMacros.get(todayKey); // (ใช้ let)
      const currentUser = await db.userProfile.get(user.id);

      if (!currentUser) {
        // (เช็คแค่ User)
        console.error("User not found. Cannot log food.");
        alert("เกิดข้อผิดพลาด: ไม่พบข้อมูลผู้ใช้");
        return;
      }

      // (ถ้า Doc ไม่มี ให้สร้างเดี๋ยวนี้เลย)
      if (!currentDoc) {
        console.log("Creating dailyMacro doc from handleLogFood...");
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

      // 4. Calculate new totals
      const newTotalCals = (currentDoc.consumedCalories || 0) + cals;
      const newTotalProt = (currentDoc.consumedProtein || 0) + prot;
      const newTotalFat = (currentDoc.consumedFat || 0) + fat;
      const newTotalCarbs = (currentDoc.consumedCarbs || 0) + carbs;

      const newVegGoalStatus =
        currentDoc.vegetableGoalMet === 1 ? 1 : isVegGoalMetByThis ? 1 : 0;

      // 5. Check for Rewards
      let totalRewardToGive = 0;
      const newRewardsMet = currentDoc.rewardsMet || {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        vegetable: 0,
      };

      if (
        newTotalCals >= targets.cals &&
        (newRewardsMet.calories === 0 || newRewardsMet.calories === undefined)
      ) {
        const reward = calculateReward();
        totalRewardToGive += reward;
        newRewardsMet.calories = 1;
        console.log(`CALORIES GOAL MET! +${reward} Money`);
      }
      if (
        newTotalProt >= targets.protMin &&
        (newRewardsMet.protein === 0 || newRewardsMet.protein === undefined)
      ) {
        const reward = calculateReward();
        totalRewardToGive += reward;
        newRewardsMet.protein = 1;
        console.log(`PROTEIN GOAL MET! +${reward} Money`);
      }
      if (
        newTotalFat >= targets.fatMin &&
        (newRewardsMet.fat === 0 || newRewardsMet.fat === undefined)
      ) {
        const reward = calculateReward();
        totalRewardToGive += reward;
        newRewardsMet.fat = 1;
        console.log(`FAT GOAL MET! +${reward} Money`);
      }
      if (
        newTotalCarbs >= targets.carbs &&
        (newRewardsMet.carbs === 0 || newRewardsMet.carbs === undefined)
      ) {
        const reward = calculateReward();
        totalRewardToGive += reward;
        newRewardsMet.carbs = 1;
        console.log(`CARBS GOAL MET! +${reward} Money`);
      }
      if (
        newVegGoalStatus === 1 &&
        (newRewardsMet.vegetable === 0 || newRewardsMet.vegetable === undefined)
      ) {
        const reward = calculateReward();
        totalRewardToGive += reward;
        newRewardsMet.vegetable = 1;
        console.log(`VEGETABLE GOAL MET! +${reward} Money`);
      }

      // 6. Update User Money
      if (totalRewardToGive > 0) {
        await db.userProfile.update(user.id, {
          money: (currentUser.money || 0) + totalRewardToGive,
        });
      }

      // 7. Update DailyMacros
      await db.dailyMacros.update(todayKey, {
        consumedCalories: newTotalCals,
        consumedProtein: newTotalProt,
        consumedFat: newTotalFat,
        consumedCarbs: newTotalCarbs,
        vegetableGoalMet: newVegGoalStatus,
        rewardsMet: newRewardsMet,
      });

      // 8. Show reward modal or navigate
      handleCloseModal();

      if (totalRewardToGive > 0) {
        setRewardModal({ isOpen: true, amount: totalRewardToGive });
      } else {
        navigate("/health");
      }
    } catch (e) {
      console.error("Failed to log food:", e);
      alert("เกิดข้อผิดพลาดในการบันทึกอาหาร");
    }
  };
  // === END CHANGE ===

  // === Render (เหมือนเดิม) ===
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <Link to="/health" style={styles.backButton}>
          <ArrowLeft size={20} />
        </Link>
        <h2 style={styles.title}>คลังอาหาร</h2>
        <Link to="/add-food" style={styles.addButton}>
          <Plus size={20} />
          <span>เพิ่ม</span>
        </Link>
      </div>

      {/* --- Search Bar --- */}
      <div style={styles.searchBarContainer}>
        <Search size={18} color="#888" style={styles.searchIcon} />
        <input
          type="text"
          placeholder="ค้นหาอาหาร..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* --- Food List --- */}
      <div style={styles.foodListContainer}>
        {filteredFood.length === 0 && (
          <p style={styles.emptyText}>
            {foodLibrary?.length === 0
              ? "ยังไม่มีอาหารในคลัง"
              : "ไม่พบอาหารที่ค้นหา"}
          </p>
        )}
        {filteredFood.map((food) => (
          <FoodItem
            key={food.id}
            food={food}
            onClick={() => handleFoodClick(food)}
          />
        ))}
      </div>

      {/* --- Log Food Modal --- */}
      {selectedFood && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>บันทึก {selectedFood.name}</h3>
            <div style={styles.inputGroup}>
              <label>กรอกปริมาณ (หน่วย: {selectedFood.unit})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
                placeholder={selectedFood.unit === "g" ? "100" : "1"}
                autoFocus
              />
            </div>
            <div style={styles.formButtons}>
              <button onClick={handleCloseModal} style={styles.cancelButton}>
                ยกเลิก
              </button>
              <button onClick={handleLogFood} style={styles.saveButton}>
                <CheckCircle size={18} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* (Modal รางวัล) */}
      {rewardModal.isOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <div style={{ ...styles.itemIcon, ...styles.rewardIcon }}>
              <Gift size={32} color="white" />
            </div>
            <h3 style={styles.modalTitle}>ยินดีด้วย!</h3>
            <p style={styles.rewardText}>
              คุณบรรลุเป้าหมายโภชนาการ
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
    textAlign: "center",
  },
  backButton: {
    color: "white",
    textDecoration: "none",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "#646cff",
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    fontSize: "0.9rem",
    border: "none",
  },
  // (Search Bar)
  searchBarContainer: {
    position: "relative",
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "12px 12px 12px 40px",
    border: "1px solid #555",
    borderRadius: "8px",
    backgroundColor: "#333",
    color: "white",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  // (Food List)
  foodListContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: "20px",
  },
  foodItem: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    backgroundColor: "#2a2a2a",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "1px solid #444",
  },
  itemIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemInfo: {
    display: "flex",
    flexDirection: "column",
  },
  itemName: {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "white",
  },
  itemDetails: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
  // (Modal)
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
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
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
  // (CSS Modal รางวัล)
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

export default LogFood;
