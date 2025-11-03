// src/pages/Shop.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  HelpCircle,
} from "lucide-react";

// === 1. (คืนชีพ) สูตรคำนวณราคาเดิม ===
const calculatePrice = (rank) => {
  const x = Math.floor(Math.random() * (5100 - 3100 + 1)) + 3100;
  switch (String(rank)) {
    case "1":
      return 7 * x;
    case "2":
      return 30 * x;
    case "3":
      return 180 * x;
    case "4":
      return 365 * x;
    case "5":
      return 730 * x;
    default:
      return 9999999;
  }
};
// === END ===

// (Helper Function 'getRankName', 'getRankColor' ... เหมือนเดิม)
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

// === (ใหม่) Helper Function: คำนวณ Rank ของ Dream ===
const getDreamRank = (targetDate) => {
  if (!targetDate) return 1;
  const now = new Date();
  const target = new Date(targetDate);
  const diffInMs = target.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays <= 7) return 1;
  if (diffInDays <= 30) return 2;
  if (diffInDays <= 182) return 3;
  if (diffInDays <= 365) return 4;
  return 5;
};

// === Main Component ===
function Shop() {
  const [currentTab, setCurrentTab] = useState("items");
  const [confirmingItem, setConfirmingItem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // --- (อัปเดต) ดึงข้อมูล ---
  const user = useLiveQuery(() => db.userProfile.toCollection().first());
  const shopItems = useLiveQuery(() => db.shopItems.toArray(), []);
  const incompleteDreams = useLiveQuery(
    () => db.dreams.where("status").equals("incomplete").toArray(),
    []
  );

  // === (ใหม่) ดึงข้อมูลงบประมาณ "รางวัล" (สำหรับ Info Box) ===
  const rewardsBudget = useLiveQuery(
    () => db.budgets.where("name").equals("rewards").first(),
    []
  );
  // === END CHANGE ===

  // (Memo: สร้าง "Dream Shop")
  const dreamShopItems = useMemo(() => {
    if (!incompleteDreams) return [];
    return incompleteDreams.map((dream) => {
      const rank = getDreamRank(dream.targetDate);
      const price = calculatePrice(rank);
      return {
        ...dream,
        rank: rank,
        price: price,
      };
    });
  }, [incompleteDreams]);

  // (ฟังก์ชัน 'handleBuyItem' ... เหมือนเดิม)
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
      setConfirmingItem(null);
    } catch (error) {
      console.error("Failed to buy item:", error);
      alert("เกิดข้อผิดพลาดในการซื้อ");
    }
  };

  // (ฟังก์ชัน: ซื้อ Dream ... เหมือนเดิม)
  const handleBuyDream = async (dream) => {
    if (!user || user.money < dream.price) {
      alert("มีเงินไม่พอ!");
      return;
    }
    if (
      !window.confirm(
        `การซื้อ Dream นี้จะถือว่า "สำเร็จ" ทันที\nคุณต้องการซื้อ "${dream.name}" หรือไม่?`
      )
    ) {
      return;
    }
    try {
      await db.userProfile.update(user.id, {
        money: user.money - dream.price,
      });
      await db.dreams.update(dream.id, { status: "complete" });
      alert(`ยินดีด้วย! คุณบรรลุความฝัน "${dream.name}" แล้ว!`);
      setConfirmingItem(null);
    } catch (error) {
      console.error("Failed to buy dream:", error);
      alert("เกิดข้อผิดพลาดในการซื้อ");
    }
  };

  // (ฟังก์ชัน 'handleDeleteItem' ... เหมือนเดิม)
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

  // (ฟังก์ชัน Modal ... เหมือนเดิม)
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
        {currentTab === "items" && (
          <button onClick={handleOpenAddModal} style={styles.addButton}>
            <Plus size={20} />
            <span>เพิ่มของ</span>
          </button>
        )}
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
                        onClick={() =>
                          setConfirmingItem({ type: "item", data: item })
                        }
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
          <div style={styles.itemGrid}>
            {dreamShopItems && dreamShopItems.length > 0 ? (
              dreamShopItems.map((item) => (
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
                    <p style={styles.itemDetail}>
                      {item.targetDate
                        ? `เป้าหมาย: ${new Date(
                            item.targetDate
                          ).toLocaleDateString("th-TH")}`
                        : "ไม่มีเป้าหมายเวลา"}
                    </p>
                    <div style={styles.itemFooter}>
                      <span style={styles.itemPrice}>
                        <Coins size={16} color="#FFD700" />
                        {item.price.toLocaleString()}
                      </span>
                      <button
                        style={styles.buyButton}
                        onClick={() =>
                          setConfirmingItem({ type: "dream", data: item })
                        }
                        disabled={user && user.money < item.price}
                      >
                        บรรลุ
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.emptyText}>
                คุณไม่มีความฝันที่ยังไม่สำเร็จใน Dream List
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- (อัปเดต) Modals --- */}
      {isAddModalOpen && (
        <AddShopItemModal
          onClose={handleCloseModal}
          itemToEdit={itemToEdit}
          rewardsBudget={rewardsBudget} // (ส่งงบประมาณไป)
        />
      )}

      {confirmingItem && (
        <ConfirmBuyModal
          item={confirmingItem.data}
          user={user}
          onClose={() => setConfirmingItem(null)}
          onConfirm={
            confirmingItem.type === "dream" ? handleBuyDream : handleBuyItem
          }
        />
      )}
    </div>
  );
}

// =======================================================
// === (อัปเดต) Component ย่อย: Modal เพิ่ม/แก้ไข ไอเทม ===
// =======================================================
function AddShopItemModal({ onClose, itemToEdit, rewardsBudget }) {
  const isEditMode = !!itemToEdit;
  const [name, setName] = useState(itemToEdit?.name || "");
  const [detail, setDetail] = useState(itemToEdit?.detail || "");
  const [rank, setRank] = useState(itemToEdit?.rank.toString() || "1");
  const [imageUrl, setImageUrl] = useState(itemToEdit?.imageUrl || "");
  const [error, setError] = useState(null);

  // === (ใหม่) คำนวณ "คำแนะนำ" (จากงบการเงิน) ===
  const recommendation = useMemo(() => {
    const budgetTotal = rewardsBudget?.totalAmount || 0;
    return {
      1: `0 - ${Math.floor(budgetTotal * 0.5).toLocaleString()}`,
      2: `${Math.floor(budgetTotal * 0.5).toLocaleString()} - ${Math.floor(
        budgetTotal * 1.0
      ).toLocaleString()}`,
      3: `${Math.floor(budgetTotal * 1.0).toLocaleString()} - ${Math.floor(
        budgetTotal * 6.0
      ).toLocaleString()}`,
      4: `${Math.floor(budgetTotal * 6.0).toLocaleString()} - ${Math.floor(
        budgetTotal * 12.0
      ).toLocaleString()}`,
      5: `> ${Math.floor(budgetTotal * 12.0).toLocaleString()}`,
    };
  }, [rewardsBudget]);
  // === END CHANGE ===

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

    // (Logic 'calculatePrice' กลับไปเป็นเหมือนเดิม)
    let finalPrice;
    if (isEditMode) {
      if (rank !== itemToEdit.rank.toString()) {
        finalPrice = calculatePrice(rank);
      } else {
        finalPrice = itemToEdit.price;
      }
    } else {
      finalPrice = calculatePrice(rank);
    }

    const newItemData = {
      name,
      detail,
      rank: parseInt(rank, 10),
      price: finalPrice,
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
          {/* === (ใหม่) กล่องคำแนะนำ === */}
          <div style={styles.infoBox}>
            <HelpCircle size={18} color="#64cfff" />
            <div style={styles.infoText}>
              <span>
                คำแนะนำ (จากงบ 'รางวัล' ฿
                {rewardsBudget?.totalAmount.toLocaleString() || 0})
              </span>
              <span style={styles.recommendationText}>
                R1: ฿{recommendation["1"]} | R2: ฿{recommendation["2"]} | R3: ฿
                {recommendation["3"]} | R4: ฿{recommendation["4"]} | R5: ฿
                {recommendation["5"]}
              </span>
            </div>
          </div>

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
            <label>ระดับ (Rank) - (ราคา Coins จะถูกสุ่ม)</label>
            <select
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              style={styles.select}
            >
              <option value="1">1 - Common</option>
              <option value="2">2 - Uncommon</option>
              <option value="3">3 - Rare</option>
              <option value="4">4 - Epic</option>
              <option value="5">5 - Legendary</option>
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
          <button onClick={handleSubmit} style={styles.saveButton}>
            {isEditMode ? <Edit size={18} /> : <Plus size={18} />}
            {isEditMode ? "บันทึกการแก้ไข" : "เพิ่มไอเทม"}
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'ConfirmBuyModal' ... อัปเดต)
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
            {user?.money.toLocaleString() || 0}
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

// === CSS Styles (อัปเดต) ===
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

  // (CSS สำหรับ Info Box ... กลับมาแล้ว)
  infoBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    backgroundColor: "#333",
    padding: "10px",
    borderRadius: "5px",
    borderLeft: "4px solid #64cfff",
  },
  infoText: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
    color: "#aaa",
  },
  recommendationText: {
    fontSize: "0.8rem",
    color: "#ccc",
    fontStyle: "italic",
    lineHeight: 1.4,
    marginTop: "4px",
  },
};

export default Shop;
