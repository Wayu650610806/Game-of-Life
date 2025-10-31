// src/pages/Shop.jsx
import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
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

// === 1. START CHANGE: อัปเดตสูตรคำนวณราคา ===
const calculatePrice = (rank) => {
  // โดย x = random(3100-5100)
  const x = Math.floor(Math.random() * (5100 - 3100 + 1)) + 3100;

  switch (
    String(rank) // ใช้ String() เพื่อความปลอดภัย
  ) {
    case "1":
      return 7 * x; // 7 วัน
    case "2":
      return 30 * x; // 30 วัน
    case "3":
      return 180 * x; // 6 เดือน (180 วัน)
    case "4":
      return 365 * x; // 1 ปี
    case "5":
      return 730 * x; // 2 ปี (730 วัน)
    default:
      return 9999999; // (เลขสำรอง)
  }
};
// === END CHANGE ===

// (Helper Function 'getRankName', 'getRankColor' เหมือนเดิม)
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

// === Main Component (เหมือนเดิม) ===
function Shop() {
  const [currentTab, setCurrentTab] = useState("items");
  const [confirmBuy, setConfirmBuy] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const shopItems = useLiveQuery(() => db.shopItems.toArray(), []);

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

  const handleOpenEditModal = (item) => {
    setItemToEdit(item);
    setIsAddModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setItemToEdit(null);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2>ร้านค้า</h2>
        <button onClick={handleOpenAddModal} style={styles.addButton}>
          <Plus size={20} />
          <span>เพิ่มของ</span>
        </button>
      </div>

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

      {isAddModalOpen && (
        <AddShopItemModal onClose={handleCloseModal} itemToEdit={itemToEdit} />
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
  const isEditMode = !!itemToEdit;
  const [name, setName] = useState(itemToEdit?.name || "");
  const [detail, setDetail] = useState(itemToEdit?.detail || "");
  const [rank, setRank] = useState(itemToEdit?.rank.toString() || "1");
  const [imageUrl, setImageUrl] = useState(itemToEdit?.imageUrl || "");
  const [error, setError] = useState(null);

  // === (ใหม่) State สำหรับราคาที่คำนวณแล้ว ===
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  // === (ใหม่) Effect สำหรับคำนวณราคาใหม่ เมื่อ Rank เปลี่ยน ===
  useEffect(() => {
    // โหมดแก้ไข: ใช้ราคาเดิม
    if (isEditMode) {
      setCalculatedPrice(itemToEdit.price);
    }
    // โหมดเพิ่ม: คำนวณใหม่
    else {
      setCalculatedPrice(calculatePrice(rank));
    }
    // (เราจะไม่คำนวณใหม่ทุกครั้งที่ rank เปลี่ยนในโหมด Edit)
  }, [rank, isEditMode, itemToEdit]);

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

    // === 2. START CHANGE: ใช้ราคาที่คำนวณไว้ ===
    // ถ้าเป็นโหมด Add, ให้คำนวณราคา "สด" ตอนกดบันทึก
    // ถ้าเป็นโหมด Edit, ให้ใช้ราคาเดิม (เว้นแต่ Rank จะเปลี่ยน)
    let finalPrice;
    if (isEditMode) {
      // ถ้า Rank เปลี่ยน, คำนวณใหม่
      if (rank !== itemToEdit.rank.toString()) {
        finalPrice = calculatePrice(rank);
      } else {
        // ถ้า Rank ไม่เปลี่ยน, ใช้ราคาเดิม
        finalPrice = itemToEdit.price;
      }
    } else {
      // โหมด Add, คำนวณใหม่
      finalPrice = calculatePrice(rank);
    }
    // === END CHANGE ===

    const newItemData = {
      name,
      detail,
      rank: parseInt(rank, 10),
      price: finalPrice, // <-- ใช้ราคาที่คำนวณ
      imageUrl,
    };

    try {
      if (isEditMode) {
        await db.shopItems.update(itemToEdit.id, newItemData);
      } else {
        await db.shopItems.add(newItemData);
      }
      onClose();
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
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

          {/* === 3. START CHANGE: อัปเดต Dropdown ให้แสดงราคา === */}
          <div style={styles.inputGroup}>
            <label>ระดับ (Rank)</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              style={styles.select}
            >
              <option value="1">1 - Common (7 วัน)</option>
              <option value="2">2 - Uncommon (30 วัน)</option>
              <option value="3">3 - Rare (6 เดือน)</option>
              <option value="4">4 - Epic (1 ปี)</option>
              <option value="5">5 - Legendary (2 ปี)</option>
            </select>
          </div>

          {/* (ใหม่) แสดงราคาที่คำนวณ */}
          <div style={styles.rewardInfoBox}>
            <span>ราคา (โดยประมาณ):</span>
            <span style={{ color: "#FFD700" }}>
              <strong>
                {/* ถ้าโหมด Add ให้คำนวณใหม่, ถ้า Edit ให้โชว์ของเดิม */}
                {isEditMode && rank === itemToEdit.rank.toString()
                  ? itemToEdit.price.toLocaleString()
                  : `~ ${(calculatePrice(rank) / 1000).toFixed(0)}k`}{" "}
                Coins
              </strong>
            </span>
          </div>
          {/* === END CHANGE === */}

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

// === CSS Styles (เหมือนเดิม) ===
const styles = {
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
