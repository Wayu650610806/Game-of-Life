// src/pages/ExercisePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function ExercisePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>หน้าออกกำลังกาย</h2>
      </div>

      <div style={styles.content}>
        <p style={styles.emptyText}>(ส่วนนี้ยังอยู่ระหว่างการพัฒนาครับ)</p>
      </div>
    </div>
  );
}

// === CSS Styles ===
const styles = {
  page: { padding: "10px", height: "100%", overflowY: "auto" },
  header: {
    display: "flex",
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
    marginRight: "10px",
    cursor: "pointer",
    display: "flex",
  },
  title: {
    margin: 0,
    fontSize: "1.2rem",
  },
  content: {
    padding: "10px",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "20px",
  },
};

export default ExercisePage;
