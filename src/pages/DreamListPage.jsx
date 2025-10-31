// src/pages/DreamListPage.jsx
import React, { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useNavigate } from "react-router-dom"; // <-- 1. IMPORT useNavigate
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Search,
  Square,
  ArrowLeft,
} from "lucide-react"; // <-- 2. IMPORT ArrowLeft

// ... (Helper Function 'getCountdown' เหมือนเดิม)
const getCountdown = (targetDate) => {
  if (!targetDate) return "ไม่ได้ตั้งเวลา";
  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `เลยกำหนดมา ${-diffDays} วัน`;
  } else if (diffDays === 0) {
    return "วันนี้!";
  } else {
    return `เหลือ ${diffDays} วัน`;
  }
};

// === Main Component ===
function DreamListPage() {
  const navigate = useNavigate(); // <-- 3. ประกาศใช้ navigate
  const allDreams = useLiveQuery(() => db.dreams.toArray(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("incomplete");
  const [searchTerm, setSearchTerm] = useState("");

  // ... (useMemo และ handler functions เหมือนเดิม)
  const { completedDreams, incompleteDreams, filteredDreams } = useMemo(() => {
    const dreams = allDreams || [];
    const completed = dreams.filter((d) => d.status === "complete");
    const incomplete = dreams.filter((d) => d.status === "incomplete");
    const listToFilter = currentTab === "incomplete" ? incomplete : completed;

    const filtered = listToFilter.filter((dream) =>
      dream.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      completedDreams: completed,
      incompleteDreams: incomplete,
      filteredDreams: filtered,
    };
  }, [allDreams, currentTab, searchTerm]);

  const handleMarkComplete = async (id) => {
    await db.dreams.update(id, { status: "complete" });
  };
  const handleMarkIncomplete = async (id) => {
    await db.dreams.update(id, { status: "incomplete" });
  };
  const handleDeleteDream = async (id) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Dream นี้?")) {
      await db.dreams.delete(id);
    }
  };

  return (
    <div style={styles.page}>
      {/* === 4. START CHANGE: เพิ่ม Header ใหม่ที่มีปุ่มกลับ === */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>
          Dream List ({completedDreams.length}/{allDreams?.length || 0})
        </h2>
        <button onClick={() => setIsModalOpen(true)} style={styles.addButton}>
          <Plus size={20} />
        </button>
      </div>
      {/* === END CHANGE === */}

      {/* --- ส่วนที่เหลือของ JSX (Tabs, Search, List) เหมือนเดิม --- */}
      <div style={styles.tabs}>
        <button
          style={currentTab === "incomplete" ? styles.tabActive : styles.tab}
          onClick={() => setCurrentTab("incomplete")}
        >
          ยังไม่สำเร็จ ({incompleteDreams.length})
        </button>
        <button
          style={currentTab === "complete" ? styles.tabActive : styles.tab}
          onClick={() => setCurrentTab("complete")}
        >
          สำเร็จแล้ว ({completedDreams.length})
        </button>
      </div>
      <div style={styles.searchBar}>
        <Search size={18} color="#888" />
        <input
          type="text"
          placeholder="ค้นหา..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      <div style={styles.dreamList}>
        {filteredDreams.length > 0 ? (
          filteredDreams.map((dream) => (
            <div key={dream.id} style={styles.dreamItem}>
              <button
                onClick={() =>
                  currentTab === "incomplete"
                    ? handleMarkComplete(dream.id)
                    : handleMarkIncomplete(dream.id)
                }
                style={styles.dreamCheckbox}
              >
                {currentTab === "incomplete" ? (
                  <Square size={20} />
                ) : (
                  <CheckSquare size={20} color="#64ff64" />
                )}
              </button>
              {dream.imageUrl && (
                <img
                  src={dream.imageUrl}
                  alt={dream.name}
                  style={styles.dreamImage}
                />
              )}
              <div style={styles.dreamDetails}>
                <span style={styles.dreamName}>{dream.name}</span>
                <span style={styles.dreamCountdown}>
                  {currentTab === "incomplete"
                    ? getCountdown(dream.targetDate)
                    : "สำเร็จแล้ว"}
                </span>
              </div>
              <button
                onClick={() => handleDeleteDream(dream.id)}
                style={styles.deleteButton}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>ไม่พบรายการ...</p>
        )}
      </div>

      {isModalOpen && <AddDreamModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

// ... (Component 'AddDreamModal' เหมือนเดิม)
function AddDreamModal({ onClose }) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return alert("กรุณากรอกชื่อเป้าหมาย");
    await db.dreams.add({
      name,
      imageUrl,
      targetDate,
      status: "incomplete",
    });
    onClose();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageUrl("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h3>เพิ่มเป้าหมายใหม่</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อเป้าหมาย (จำเป็น)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label>อัปโหลดรูปภาพ (ไม่จำเป็น)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.input}
            />
          </div>
          {imageUrl && (
            <div>
              <label>ตัวอย่าง:</label>
              <img src={imageUrl} alt="Preview" style={styles.imagePreview} />
            </div>
          )}
          <div style={styles.inputGroup}>
            <label>วันที่เป้าหมาย (ไม่จำเป็น)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.saveButton}>
            <Plus size={18} /> เพิ่ม
          </button>
        </form>
      </div>
    </div>
  );
}

// === 5. CSS Styles Object (เพิ่ม/แก้ไข) ===
const styles = {
  page: { padding: "10px" },
  // CSS ใหม่สำหรับ Header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    marginBottom: "15px",
    borderBottom: "1px solid #444",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: "8px",
    cursor: "pointer",
  },
  title: {
    margin: 0,
    fontSize: "1.2rem",
    textAlign: "center",
    flexGrow: 1,
  },
  addButton: {
    background: "#646cff",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },
  tabs: {
    display: "flex",
    gap: "10px",
    borderBottom: "1px solid #444",
    marginBottom: "10px",
  },
  tab: {
    background: "none",
    border: "none",
    color: "#888",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "0.9rem",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    background: "none",
    border: "none",
    color: "white",
    padding: "10px 15px",
    cursor: "pointer",
    fontSize: "0.9rem",
    borderBottom: "2px solid #646cff",
    fontWeight: "bold",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: "5px",
    padding: "0 10px",
    marginBottom: "10px",
  },
  searchInput: {
    background: "none",
    border: "none",
    color: "white",
    padding: "10px",
    flexGrow: 1,
    outline: "none",
    fontSize: "1rem",
  },
  dreamList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "calc(100dvh - 250px)",
    overflowY: "auto",
  },
  dreamItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#333",
    padding: "10px",
    borderRadius: "5px",
  },
  dreamCheckbox: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
  },
  dreamImage: {
    width: "40px",
    height: "40px",
    borderRadius: "5px",
    objectFit: "cover",
  },
  dreamDetails: { flexGrow: 1, display: "flex", flexDirection: "column" },
  dreamName: { fontSize: "1rem", fontWeight: "bold" },
  dreamCountdown: { fontSize: "0.8rem", color: "#aaa" },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#ffaaaa",
    cursor: "pointer",
    padding: 0,
  },
  emptyText: { color: "#888", textAlign: "center", padding: "10px" },
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
    marginBottom: "20px",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "white",
    padding: 0,
    cursor: "pointer",
  },
  modalForm: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
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
  imagePreview: {
    width: "100%",
    maxHeight: "200px",
    objectFit: "cover",
    borderRadius: "5px",
    marginTop: "10px",
    border: "1px solid #444",
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
    gap: "5px",
  },
};

export default DreamListPage;
