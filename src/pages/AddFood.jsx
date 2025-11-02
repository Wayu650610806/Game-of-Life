// src/pages/AddFood.jsx
import React, { useState, useEffect } from "react";
// === START CHANGE: Import เพิ่ม ===
import { Link, useNavigate, useParams } from "react-router-dom";
import { X, Save, Carrot, Apple, Trash2 } from "lucide-react"; // (เพิ่ม Trash2)
// === END CHANGE ===
import { db } from "../db";
import { VEGETABLE_COLOR_CATEGORIES } from "../utils/healthUtils";

// === Main Component ===
function AddFood() {
  const navigate = useNavigate();
  // === START CHANGE: Logic ตรวจสอบ ID ===
  const { foodId } = useParams();
  const isCreating = !foodId;
  // === END CHANGE ===

  const [foodType, setFoodType] = useState("normal"); // 'normal' | 'vegetable'
  const [formData, setFormData] = useState({
    name: "",
    unit: "g", // g, ml, pcs
    caloriesPerUnit: "",
    proteinPerUnit: "",
    fatPerUnit: "",
    carbsPerUnit: "",
    colorCategory: "green", // default for veg
  });
  // === START CHANGE: State สำหรับ Modal ลบ ===
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // === END CHANGE ===

  // === START CHANGE: Effect สำหรับโหลดข้อมูล (ถ้าเป็นการแก้ไข) ===
  useEffect(() => {
    if (!isCreating) {
      const loadFoodData = async () => {
        try {
          const idToLoad = Number(foodId);
          const food = await db.foodLibrary.get(idToLoad);
          if (food) {
            setFoodType(food.type);
            setFormData({
              name: food.name,
              unit: food.unit || "g",
              caloriesPerUnit: food.caloriesPerUnit || "",
              proteinPerUnit: food.proteinPerUnit || "",
              fatPerUnit: food.fatPerUnit || "",
              carbsPerUnit: food.carbsPerUnit || "",
              colorCategory: food.colorCategory || "green",
            });
          } else {
            console.error("Food not found");
            navigate("/log-food"); // ถ้าหาไม่เจอ ให้กลับ
          }
        } catch (e) {
          console.error("Failed to load food:", e);
        }
      };
      loadFoodData();
    }
  }, [isCreating, foodId, navigate]);
  // === END CHANGE ===

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // === START CHANGE: อัปเดต handleSave ===
  const handleSave = async () => {
    const {
      name,
      unit,
      caloriesPerUnit,
      proteinPerUnit,
      fatPerUnit,
      carbsPerUnit,
      colorCategory,
    } = formData;

    if (!name) {
      alert("กรุณากรอกชื่ออาหาร");
      return;
    }

    try {
      let dataToSave;
      if (foodType === "normal") {
        dataToSave = {
          name,
          type: "normal",
          unit,
          caloriesPerUnit: parseFloat(caloriesPerUnit) || 0,
          proteinPerUnit: parseFloat(proteinPerUnit) || 0,
          fatPerUnit: parseFloat(fatPerUnit) || 0,
          carbsPerUnit: parseFloat(carbsPerUnit) || 0,
          colorCategory: null,
        };
      } else {
        // 'vegetable'
        dataToSave = {
          name,
          type: "vegetable",
          unit: null,
          caloriesPerUnit: 0,
          proteinPerUnit: 0,
          fatPerUnit: 0,
          carbsPerUnit: 0,
          colorCategory: colorCategory,
        };
      }

      if (isCreating) {
        await db.foodLibrary.add(dataToSave);
      } else {
        // (อัปเดต)
        await db.foodLibrary.update(Number(foodId), dataToSave);
      }

      navigate("/log-food"); // กลับไปหน้าคลังอาหาร
    } catch (e) {
      console.error("Failed to save food:", e);
      alert("เกิดข้อผิดพลาดในการบันทึกอาหาร");
    }
  };
  // === END CHANGE ===

  // === START CHANGE: Handlers สำหรับการลบ ===
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (isCreating) return; // ไม่ควรเกิดขึ้น
    try {
      await db.foodLibrary.delete(Number(foodId));
      setIsDeleteModalOpen(false);
      navigate("/log-food");
    } catch (e) {
      console.error("Failed to delete food:", e);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };
  // === END CHANGE ===

  // === Render (อัปเดต) ===
  return (
    <div style={styles.page}>
      {/* --- Header --- */}
      <div style={styles.header}>
        {/* === START CHANGE: เปลี่ยน Title === */}
        <h2 style={styles.title}>
          {isCreating ? "สร้างอาหารใหม่" : "แก้ไขอาหาร"}
        </h2>
        {/* === END CHANGE === */}
        <Link to="/log-food" style={styles.iconButton}>
          <X size={20} />
        </Link>
      </div>

      {/* --- Form Container --- */}
      <div style={styles.formContainer}>
        {/* --- Food Type Toggle --- */}
        <div style={styles.toggleContainer}>
          <button
            style={
              foodType === "normal"
                ? { ...styles.toggleButton, ...styles.toggleActive }
                : styles.toggleButton
            }
            onClick={() => setFoodType("normal")}
            disabled={!isCreating} // (ห้ามเปลี่ยนประเภทตอนแก้ไข)
          >
            <Apple size={16} />
            <span>อาหารทั่วไป</span>
          </button>
          <button
            style={
              foodType === "vegetable"
                ? { ...styles.toggleButton, ...styles.toggleActive }
                : styles.toggleButton
            }
            onClick={() => setFoodType("vegetable")}
            disabled={!isCreating} // (ห้ามเปลี่ยนประเภทตอนแก้ไข)
          >
            <Carrot size={16} />
            <span>ผัก/ผลไม้</span>
          </button>
        </div>

        {/* --- Name Input --- */}
        <div style={styles.inputGroup}>
          <label>ชื่ออาหาร</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="เช่น อกไก่, ไข่ต้ม, บรอกโคลี"
          />
        </div>

        {/* --- Form Fields based on Type (เหมือนเดิม) --- */}
        {foodType === "normal" ? (
          <>
            <div style={styles.inputGroup}>
              <label>หน่วย (Unit)</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="g">กรัม (g)</option>
                <option value="ml">มิลลิลิตร (ml)</option>
                <option value="pcs">ชิ้น (pcs)</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label>แคลอรี (Kcal) / 1 {formData.unit}</label>
              <input
                type="number"
                name="caloriesPerUnit"
                value={formData.caloriesPerUnit}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="0"
              />
            </div>
            <div style={styles.grid3}>
              <div style={styles.inputGroup}>
                <label>โปรตีน (g)</label>
                <input
                  type="number"
                  name="proteinPerUnit"
                  value={formData.proteinPerUnit}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
              <div style={styles.inputGroup}>
                <label>ไขมัน (g)</label>
                <input
                  type="number"
                  name="fatPerUnit"
                  value={formData.fatPerUnit}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="0"
                />
              </div>
            </div>
          </>
        ) : (
          // --- Vegetable Form ---
          <div style={styles.inputGroup}>
            <label>หมวดสี</label>
            <select
              name="colorCategory"
              value={formData.colorCategory}
              onChange={handleInputChange}
              style={styles.select}
            >
              {Object.entries(VEGETABLE_COLOR_CATEGORIES)
                .filter(([key]) => key !== "free")
                .map(([key, { name, color }]) => (
                  <option key={key} value={key} style={{ color: color }}>
                    {name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* --- Save Button --- */}
        <button onClick={handleSave} style={styles.saveButton}>
          <Save size={18} />
          <span>{isCreating ? "บันทึกอาหาร" : "บันทึกการแก้ไข"}</span>
        </button>

        {/* === START CHANGE: เพิ่มปุ่ม Delete (ถ้าเป็นการแก้ไข) === */}
        {!isCreating && (
          <button onClick={handleDeleteClick} style={styles.deleteButton}>
            <Trash2 size={18} />
            <span>ลบอาหารนี้</span>
          </button>
        )}
        {/* === END CHANGE === */}
      </div>

      {/* === START CHANGE: Modal ยืนยันการลบ === */}
      {isDeleteModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>ยืนยันการลบ</h3>
            <p style={styles.deleteText}>
              คุณต้องการลบ "{formData.name}" ออกจากคลังอาหารใช่หรือไม่?
              (การกระทำนี้ไม่สามารถย้อนกลับได้)
            </p>
            <div style={styles.formButtons}>
              <button
                onClick={handleCloseDeleteModal}
                style={styles.cancelButton}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                style={styles.deleteConfirmButton}
              >
                <Trash2 size={18} /> ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
      {/* === END CHANGE === */}
    </div>
  );
}

// === CSS Styles (อัปเดต) ===
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
  iconButton: {
    color: "white",
    textDecoration: "none",
  },
  formContainer: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  toggleContainer: {
    display: "flex",
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    padding: "4px",
  },
  toggleButton: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "#aaa",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
  },
  toggleActive: {
    backgroundColor: "#333",
    color: "white",
    fontWeight: "bold",
  },
  "toggleButton:disabled": {
    // (เพิ่ม)
    color: "#777",
    cursor: "not-allowed",
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
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
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
  // === START CHANGE: CSS สำหรับปุ่มลบ และ Modal ===
  deleteButton: {
    background: "none",
    color: "#e74c3c",
    border: "1px solid #e74c3c",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontSize: "1rem",
    marginTop: "5px",
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
  deleteText: {
    color: "#ccc",
    textAlign: "center",
    fontSize: "0.9rem",
    margin: 0,
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
  deleteConfirmButton: {
    background: "#e74c3c",
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
  // === END CHANGE ===
};

export default AddFood;
