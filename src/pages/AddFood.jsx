// src/pages/AddFood.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Save, Carrot, Apple } from "lucide-react";
import { db } from "../db";
import { VEGETABLE_COLOR_CATEGORIES } from "../utils/healthUtils";

// === Main Component ===
function AddFood() {
  const navigate = useNavigate();
  const [foodType, setFoodType] = useState("normal"); // 'normal' | 'vegetable'
  const [formData, setFormData] = useState({
    name: "",
    unit: "g", // (g, ml, pcs)
    caloriesPerUnit: "",
    proteinPerUnit: "",
    fatPerUnit: "",
    carbsPerUnit: "",
    colorCategory: "green", // (Default for vegetable)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // 1. ตรวจสอบข้อมูล
    if (!formData.name.trim()) {
      alert("กรุณากรอกชื่ออาหาร");
      return;
    }

    // 2. เตรียมข้อมูลที่จะบันทึก
    let foodData = {
      name: formData.name.trim(),
      type: foodType,
    };

    if (foodType === "normal") {
      if (!formData.unit) {
        alert("กรุณาเลือกหน่วย");
        return;
      }
      foodData = {
        ...foodData,
        unit: formData.unit,
        caloriesPerUnit: Number(formData.caloriesPerUnit) || 0,
        proteinPerUnit: Number(formData.proteinPerUnit) || 0,
        fatPerUnit: Number(formData.fatPerUnit) || 0,
        carbsPerUnit: Number(formData.carbsPerUnit) || 0,
        colorCategory: null,
      };
    } else {
      // (ผัก/ผลไม้)
      foodData = {
        ...foodData,
        unit: "ชิ้น/ส่วน", // (หน่วย default สำหรับผัก)
        caloriesPerUnit: 0,
        proteinPerUnit: 0,
        fatPerUnit: 0,
        carbsPerUnit: 0,
        colorCategory: formData.colorCategory,
      };
    }

    // 3. บันทึกลง DB
    try {
      await db.foodLibrary.add(foodData);
      console.log("Food added:", foodData);
      navigate("/log-food"); // กลับไปหน้าคลังอาหาร
    } catch (e) {
      console.error("Failed to save food:", e);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  // === Render ===
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>สร้างอาหารใหม่</h2>
        <Link to="/log-food" style={styles.cancelButton}>
          <X size={20} />
        </Link>
      </div>

      {/* === Toggle Type === */}
      <div style={styles.toggleContainer}>
        <button
          style={
            foodType === "normal"
              ? styles.toggleButtonActive
              : styles.toggleButton
          }
          onClick={() => setFoodType("normal")}
        >
          <Apple size={18} />
          <span>อาหารทั่วไป</span>
        </button>
        <button
          style={
            foodType === "vegetable"
              ? styles.toggleButtonActive
              : styles.toggleButton
          }
          onClick={() => setFoodType("vegetable")}
        >
          <Carrot size={18} />
          <span>ผัก / ผลไม้</span>
        </button>
      </div>

      {/* === Form Fields === */}
      <div style={styles.formContainer}>
        {/* --- 1. ชื่อ (แสดงตลอด) --- */}
        <div style={styles.inputGroup}>
          <label>ชื่ออาหาร</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={styles.input}
            placeholder="เช่น อกไก่, ข้าวกล้อง, บรอกโคลี"
          />
        </div>

        {/* --- 2. ฟอร์มอาหารทั่วไป --- */}
        {foodType === "normal" && (
          <>
            <div style={styles.inputGroup}>
              <label>หน่วย (ต่อ 1 หน่วย)</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="g">กรัม (g)</option>
                <option value="ml">มิลลิลิตร (ml)</option>
                <option value="pcs">ชิ้น/ฟอง/ลูก (pcs)</option>
              </select>
            </div>
            <div style={styles.grid2}>
              <div style={styles.inputGroup}>
                <label>แคลอรี (Kcal)</label>
                <input
                  type="number"
                  name="caloriesPerUnit"
                  value={formData.caloriesPerUnit}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>โปรตีน (g)</label>
                <input
                  type="number"
                  name="proteinPerUnit"
                  value={formData.proteinPerUnit}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
            </div>
            <div style={styles.grid2}>
              <div style={styles.inputGroup}>
                <label>ไขมัน (g)</label>
                <input
                  type="number"
                  name="fatPerUnit"
                  value={formData.fatPerUnit}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>คาร์บ (g)</label>
                <input
                  type="number"
                  name="carbsPerUnit"
                  value={formData.carbsPerUnit}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
            </div>
          </>
        )}

        {/* --- 3. ฟอร์มผัก/ผลไม้ --- */}
        {foodType === "vegetable" && (
          <div style={styles.inputGroup}>
            <label>เลือกหมวดสี</label>
            <div style={styles.colorGrid}>
              {Object.keys(VEGETABLE_COLOR_CATEGORIES)
                .filter((key) => key !== "free") // ไม่ให้เลือก "Free" ตอนสร้าง
                .map((key) => {
                  const item = VEGETABLE_COLOR_CATEGORIES[key];
                  return (
                    <button
                      key={key}
                      style={{
                        ...styles.colorButton,
                        backgroundColor: item.color,
                        // (ไฮไลท์สีที่เลือก)
                        border:
                          formData.colorCategory === key
                            ? "3px solid #64cfff"
                            : "3px solid transparent",
                      }}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          colorCategory: key,
                        }))
                      }
                    >
                      <span style={styles.colorButtonText}>{item.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* --- 4. ปุ่มบันทึก --- */}
        <button onClick={handleSave} style={styles.saveButton}>
          <Save size={18} /> บันทึก
        </button>
      </div>
    </div>
  );
}

// === CSS Styles ===
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
  cancelButton: {
    color: "white",
    textDecoration: "none",
  },
  // (ใหม่) Toggle
  toggleContainer: {
    display: "flex",
    width: "100%",
    backgroundColor: "#333",
    borderRadius: "8px",
    marginBottom: "15px",
    overflow: "hidden",
    border: "1px solid #555",
  },
  toggleButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "transparent",
    color: "#aaa",
    fontSize: "0.9rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  toggleButtonActive: {
    flex: 1,
    padding: "12px",
    border: "none",
    background: "#646cff",
    color: "white",
    fontSize: "0.9rem",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  // (ใหม่) Form
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
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  saveButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "1rem",
    marginTop: "10px",
  },
  // (ใหม่) Color Picker
  colorGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
  },
  colorButton: {
    width: "100%",
    height: "60px",
    borderRadius: "8px",
    border: "3px solid transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px",
    boxSizing: "border-box",
    transition: "border 0.2s",
  },
  colorButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: "0.9rem",
    textShadow: "0px 0px 3px rgba(255,255,255,0.7)",
  },
};

export default AddFood;
