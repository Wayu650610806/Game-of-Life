// src/pages/Shop.jsx
import React, { useState, useEffect } from "react"; // <-- 1. IMPORT useEffect
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
// === 2. IMPORT ไอคอนใหม่ ===
import {
  Plus,
  X,
  Coins,
  ShoppingCart,
  Gem,
  ShieldAlert,
  Edit,
  Trash2,
} from "lucide-react";

// ... (Helper Functions 'calculatePrice', 'getRankName', 'getRankColor' เหมือนเดิม)
const calculatePrice = (rank) => {
  const BASE_DAILY_EARNING = 1000;
  switch (String(rank)) {
    case "1":
      return BASE_DAILY_EARNING * 1;
    case "2":
      return BASE_DAILY_EARNING * 7;
    case "3":
      return BASE_DAILY_EARNING * 30;
    case "4":
      return BASE_DAILY_EARNING * 180;
    case "5":
      return BASE_DAILY_EARNING * 365;
    default:
      return 999999;
  }
};
const getRankName = (rank) => {
  switch (String(rank)) {
    case "1":
      return "Common";
    case "2":
      return "Uncommon";
    case "3":
      return "Rare";
    case "4":
      return "Epic";
    case "5":
      return "Legendary";
    default:
      return "N/A";
  }
};
const getRankColor = (rank) => {
  switch (String(rank)) {
    case "1":
      return "#aaa";
    case "2":
      return "#64ff64";
    case "3":
      return "#64cfff";
    case "4":
      return "#c864ff";
    case "5":
      return "#ffd700";
    default:
      return "#aaa";
  }
};

// === Main Component ===
function Shop() {
  const [currentTab, setCurrentTab] = useState("items");
  const [confirmBuy, setConfirmBuy] = useState(null);

  // === 3. START CHANGE: อัปเดต State การจัดการ Modal ===
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null); // (null หรือ item object)
  // === END CHANGE ===

  // ดึงข้อมูล
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const shopItems = useLiveQuery(() => db.shopItems.toArray(), []);

  // (ฟังก์ชัน 'handleBuyItem' เหมือนเดิม)
  const handleBuyItem = async (item) => {
    if (!user || user.money < item.price) {
      alert("มีเงินไม่พอ!");
      return;
    }
    try {
      await db.userProfile.update(user.id, {
        money: user.money - item.price,
      });
      await db.shopItems.delete(item.id);
      alert(`ซื้อ ${item.name} สำเร็จ!`);
      setConfirmBuy(null);
    } catch (error) {
      console.error("Failed to buy item:", error);
      alert("เกิดข้อผิดพลาดในการซื้อ");
    }
  };

  // === 4. (ใหม่) ฟังก์ชันลบไอเทม ===
  const handleDeleteItem = async (id, name) => {
    if (
      window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}" ออกจากร้านค้า?`)
    ) {
      try {
        await db.shopItems.delete(id);
      } catch (error) {
        console.error("Failed to delete item:", error);
        alert("เกิดข้อผิดพลาดในการลบ");
      }
    }
  };

  // === 5. (ใหม่) ฟังก์ชันเปิด Modal แก้ไข ===
  const handleOpenEditModal = (item) => {
    setItemToEdit(item); // ส่ง item ไป
    setIsAddModalOpen(true); // เปิด Modal เดียวกัน
  };

  // === 6. (ใหม่) ฟังก์ชันเปิด Modal เพิ่ม ===
  const handleOpenAddModal = () => {
    setItemToEdit(null); // ไม่ส่ง item (โหมด Add)
    setIsAddModalOpen(true); // เปิด Modal
  };

  // === 7. (ใหม่) ฟังก์ชันปิด Modal ===
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setItemToEdit(null); // ล้างค่า
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>ร้านค้า</h2>
        {/* 8. อัปเดตปุ่ม "เพิ่มของ" */}
        <button onClick={handleOpenAddModal} style={styles.addButton}>
          <Plus size={20} />
          <span>เพิ่มของ</span>
        </button>
      </div>

      {/* --- Tabs (เหมือนเดิม) --- */}
      <div style={styles.tabs}>
        <button
          style={currentTab === "items" ? styles.tabActive : styles.tab}
          onClick={() => setCurrentTab("items")}
        >
          <ShoppingCart size={16} /> ไอเทม
        </button>
        <button
          style={currentTab === "dreams" ? styles.tabActive : styles.tab}
          onClick={() => setCurrentTab("dreams")}
        >
          <Gem size={16} /> ร้านค้าความฝัน
        </button>
      </div>

      {/* --- Content (อัปเดต Card) --- */}
      <div style={styles.content}>
        {currentTab === "items" && (
          <div style={styles.itemGrid}>
            {shopItems && shopItems.length > 0 ? (
              shopItems.map((item) => (
                <div key={item.id} style={styles.itemCard}>
                  <img
                    src={item.imageUrl || "https://via.placeholder.com/150"}
                    alt={item.name}
                    style={styles.itemImage}
                  />
                  <div style={styles.itemInfo}>
                    <h4 style={styles.itemName}>{item.name}</h4>
                    <p
                      style={{
                        ...styles.itemRank,
                        color: getRankColor(item.rank),
                        borderColor: getRankColor(item.rank),
                      }}
                    >
                      {getRankName(item.rank)}
                    </p>
                    <p style={styles.itemDetail}>{item.detail}</p>

                    {/* --- 9. (ใหม่) แถบปุ่ม Admin --- */}
                    <div style={styles.adminBar}>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        style={styles.editButton}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* --- แถบปุ่มซื้อ (เหมือนเดิม) --- */}
                    <div style={styles.itemFooter}>
                      <span style={styles.itemPrice}>
                        <Coins size={16} color="#FFD700" />
                        {item.price.toLocaleString()}
                      </span>
                      <button
                        style={styles.buyButton}
                        onClick={() => setConfirmBuy(item)}
                        disabled={user && user.money < item.price}
                      >
                        ซื้อ
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.emptyText}>
                ยังไม่มีไอเทมในร้านค้า (กด + เพื่อเพิ่ม)
              </p>
            )}
          </div>
        )}

        {currentTab === "dreams" && (
          <div style={styles.emptyText}>
            <p>
              <strong>ร้านค้าความฝัน (Dream Shop)</strong>
            </p>
            <p>ส่วนนี้ยังอยู่ระหว่างการพัฒนาครับ</p>
          </div>
        )}
      </div>

      {/* --- 10. (อัปเดต) Modals --- */}
      {isAddModalOpen && (
        <AddShopItemModal
          onClose={handleCloseModal}
          itemToEdit={itemToEdit} // ส่ง item (หรือ null) ไป
        />
      )}

      {confirmBuy && (
        <ConfirmBuyModal
          item={confirmBuy}
          user={user}
          onClose={() => setConfirmBuy(null)}
          onConfirm={handleBuyItem}
        />
      )}
    </div>
  );
}

// =======================================================
// === (อัปเดต) Component ย่อย: Modal เพิ่ม/แก้ไข ไอเทม ===
// =======================================================
function AddShopItemModal({ onClose, itemToEdit }) {
  // 1. ตรวจสอบโหมด
  const isEditMode = !!itemToEdit; // (true ถ้ามี item, false ถ้าไม่มี)

  // 2. ตั้งค่า State เริ่มต้น (ถ้ามี itemToEdit ให้ใช้ค่าเก่า)
  const [name, setName] = useState(itemToEdit?.name || "");
  const [detail, setDetail] = useState(itemToEdit?.detail || "");
  const [rank, setRank] = useState(itemToEdit?.rank.toString() || "1"); // (ต้องเป็น string)
  const [imageUrl, setImageUrl] = useState(itemToEdit?.imageUrl || "");
  const [error, setError] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImageUrl(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name || !rank) {
      setError("กรุณากรอกชื่อและเลือกระดับ");
      return;
    }

    // 3. คำนวณราคา (เหมือนเดิม)
    const price = calculatePrice(rank);

    // 4. สร้าง object ข้อมูล
    const newItemData = {
      name,
      detail,
      rank: parseInt(rank, 10),
      price,
      imageUrl,
    };

    try {
      // 5. (อัปเดต) ตรวจสอบโหมด
      if (isEditMode) {
        // โหมดแก้ไข: อัปเดตข้อมูล
        await db.shopItems.update(itemToEdit.id, newItemData);
      } else {
        // โหมดเพิ่ม: เพิ่มข้อมูล
        await db.shopItems.add(newItemData);
      }
      onClose(); // ปิด Modal
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          {/* 6. (อัปเดต) เปลี่ยนชื่อ Modal ตามโหมด */}
          <h3>{isEditMode ? "แก้ไขไอเทม" : "เพิ่มไอเทมใหม่"}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อไอเทม</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>รายละเอียด</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              style={styles.textarea}
              rows={2}
            ></textarea>
          </div>
          <div style={styles.inputGroup}>
            <label>ระดับ (Rank)</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              style={styles.select}
            >
              <option value="1">1 - Common (ราคา 1 วัน)</option>
              <option value="2">2 - Uncommon (ราคา 7 วัน)</option>
              <option value="3">3 - Rare (ราคา 30 วัน)</option>
              <option value="4">4 - Epic (ราคา 6 เดือน)</option>
              <option value="5">5 - Legendary (ราคา 1 ปี)</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label>อัปโหลดรูปภาพ</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.input}
            />
          </div>
          {imageUrl && (
            <img src={imageUrl} alt="Preview" style={styles.imagePreview} />
          )}
          {error && (
            <div style={styles.errorBox}>
              <ShieldAlert size={18} />
              <span>{error}</span>
            </div>
          )}
          {/* 7. (อัปเดต) เปลี่ยนปุ่มตามโหมด */}
          <button onClick={handleSubmit} style={styles.saveButton}>
            {isEditMode ? <Edit size={18} /> : <Plus size={18} />}
            {isEditMode ? "บันทึกการแก้ไข" : "เพิ่มไอเทม"}
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'ConfirmBuyModal' เหมือนเดิม)
function ConfirmBuyModal({ item, user, onClose, onConfirm }) {
  const hasEnoughMoney = user && user.money >= item.price;
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>ยืนยันการซื้อ</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <p>
          คุณต้องการซื้อ "{item.name}" ในราคา{" "}
          <strong>{item.price.toLocaleString()}</strong> Coins ใช่หรือไม่?
        </p>
        <div style={styles.rewardInfoBox}>
          <span>เงินของคุณ:</span>
          <span style={{ color: "#FFD700" }}>
            {user.money.toLocaleString()}
          </span>
        </div>
        {!hasEnoughMoney && (
          <div style={styles.errorBox}>
            <ShieldAlert size={18} />
            <span>คุณมีเงินไม่เพียงพอ</span>
          </div>
        )}
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelButton}>
            ยกเลิก
          </button>
          <button
            onClick={() => onConfirm(item)}
            style={styles.confirmButton}
            disabled={!hasEnoughMoney}
          >
            <ShoppingCart size={18} /> ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

// === 11. (อัปเดต) CSS Styles ===
const styles = {
  // (CSS ส่วนใหญ่เหมือนเดิม)
  page: { padding: "10px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "15px",
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
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid #444",
    marginBottom: "10px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "none",
    color: "#888",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "0.9rem",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    background: "none",
    border: "none",
    color: "white",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "0.9rem",
    borderBottom: "2px solid #646cff",
    fontWeight: "bold",
  },
  content: {
    padding: "5px",
  },
  itemGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "10px",
  },
  itemCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
  },
  itemImage: {
    width: "100%",
    height: "100px",
    objectFit: "cover",
    backgroundColor: "#333",
  },
  itemInfo: {
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  itemName: {
    margin: "0 0 5px 0",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  itemRank: {
    margin: "0 0 5px 0",
    fontSize: "0.8rem",
    fontWeight: "bold",
    border: "1px solid",
    borderRadius: "4px",
    padding: "2px 4px",
    width: "fit-content",
  },
  itemDetail: {
    margin: "0 0 10px 0",
    fontSize: "0.8rem",
    color: "#aaa",
    flexGrow: 1,
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #444",
    paddingTop: "10px",
  },
  itemPrice: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "0.9rem",
    fontWeight: "bold",
  },
  buyButton: {
    background: "#3a8b3a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "5px 10px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "20px",
  },

  // === (ใหม่) CSS สำหรับปุ่ม Admin ===
  adminBar: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "5px",
    padding: "5px 10px 0 10px",
  },
  editButton: {
    background: "none",
    border: "1px solid #64cfff",
    color: "#64cfff",
    borderRadius: "5px",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
  },
  deleteButton: {
    background: "none",
    border: "1px solid #ffaaaa",
    color: "#ffaaaa",
    borderRadius: "5px",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
  },

  // (Modal Styles)
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
  imagePreview: {
    width: "100%",
    maxHeight: "150px",
    objectFit: "cover",
    borderRadius: "5px",
    marginTop: "5px",
    border: "1px solid #444",
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
    marginTop: "5px",
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
};

export default Shop;
