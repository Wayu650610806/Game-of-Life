// src/pages/FinanceSummary.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// (Helper Function 'groupAndSumByTag' ... เหมือนเดิม)
const groupAndSumByTag = (transactions, tags) => {
  if (!transactions || !tags) return [];
  const tagMap = new Map();
  for (const tx of transactions) {
    const currentSum = tagMap.get(tx.tagId) || 0;
    tagMap.set(tx.tagId, currentSum + tx.amount);
  }
  const grouped = Array.from(tagMap.entries()).map(([tagId, total]) => {
    const tag = tags.find((t) => t.id === tagId);
    return {
      tagId: tagId,
      tagName: tag ? tag.name : "N/A",
      total: total,
    };
  });
  return grouped.sort((a, b) => b.total - a.total);
};

// === Main Component ===
function FinanceSummary() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // 1. ดึงข้อมูล
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const allTags = useLiveQuery(() => db.tags.toArray(), []);

  // 2. คำนวณ "ช่วงเวลา"
  const { firstDay, lastDay, monthName } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    last.setHours(23, 59, 59, 999);
    const name = first.toLocaleString("th-TH", {
      month: "long",
      year: "numeric",
    });
    return {
      firstDay: first.toISOString(),
      lastDay: last.toISOString(),
      monthName: name,
    };
  }, [currentDate]);

  // 3. ดึง "ธุรกรรม"
  const transactions = useLiveQuery(
    () =>
      db.transactions.where("timestamp").between(firstDay, lastDay).toArray(),
    [firstDay, lastDay]
  );

  // 4. คำนวณสรุปผล
  const summaryData = useMemo(() => {
    if (!transactions || !allTags) return null;

    // Income
    const incomeTxs = transactions.filter((t) => t.type === "income");
    const totalIncome = incomeTxs.reduce((sum, t) => sum + t.amount, 0);
    const activeIncome = groupAndSumByTag(
      incomeTxs.filter((t) => t.classification === "active"),
      allTags
    );
    const passiveIncome = groupAndSumByTag(
      incomeTxs.filter((t) => t.classification === "passive"),
      allTags
    );

    // Expense
    const expenseTxs = transactions.filter((t) => t.type === "expense");
    const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
    const fixedExpense = groupAndSumByTag(
      expenseTxs.filter((t) => t.classification === "fixed"),
      allTags
    );
    const variableExpense = groupAndSumByTag(
      expenseTxs.filter((t) => t.classification === "variable"),
      allTags
    );

    return {
      totalIncome,
      activeIncome,
      passiveIncome,
      totalExpense,
      fixedExpense,
      variableExpense,
    };
  }, [transactions, allTags]);

  // 5. คำนวณยอดรวมสินทรัพย์
  const totalAssets = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [accounts]);

  // 6. Handlers (เปลี่ยนเดือน)
  const prevMonth = () => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };
  const nextMonth = () => {
    const now = new Date();
    const next = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    if (next <= now) {
      setCurrentDate(next);
    }
  };

  if (!accounts || !summaryData) {
    return <div>กำลังประมวลผล...</div>;
  }

  const {
    totalIncome,
    activeIncome,
    passiveIncome,
    totalExpense,
    fixedExpense,
    variableExpense,
  } = summaryData;
  const netIncome = totalIncome - totalExpense;

  return (
    <div style={styles.page}>
      {/* --- Header --- */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>สรุปผลการเงิน</h2>
      </div>

      {/* --- Month Navigator --- */}
      <div style={styles.monthNav}>
        <button onClick={prevMonth} style={styles.navButton}>
          <ChevronLeft size={24} />
        </button>
        <h3 style={styles.monthName}>{monthName}</h3>
        <button onClick={nextMonth} style={styles.navButton}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* --- 1. Assets (Snapshot) --- */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>สินทรัพย์ (ณ ปัจจุบัน)</h3>
        {accounts.map((acc) => (
          <div key={acc.id} style={styles.tagItem}>
            <span style={styles.tagName}>{acc.name}</span>
            <strong style={styles.tagTotal}>
              {acc.balance.toLocaleString()}
            </strong>
          </div>
        ))}
        <div style={styles.totalRow}>
          <strong style={styles.tagName}>ยอดรวม:</strong>
          <strong style={styles.tagTotal}>
            {totalAssets.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* --- 2. Income / Outcome --- */}
      <div style={styles.grid2}>
        {/* 2a. INCOME (ซ้าย) */}
        <div style={styles.section}>
          {/* === START CHANGE: ลบ Total ออกจาก Header === */}
          <div style={styles.summaryHeaderGreen}>
            <TrendingUp size={20} />
            <h3 style={styles.sectionTitle}>Income</h3>
          </div>
          {/* === END CHANGE === */}

          <h4 style={styles.subTitle}>Active Income</h4>
          {activeIncome.length > 0 ? (
            activeIncome.map((tag) => (
              <div key={tag.tagId} style={styles.tagItem}>
                <span style={styles.tagName}>{tag.tagName}</span>
                <span style={styles.tagTotal}>
                  {tag.total.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>ไม่มี</p>
          )}

          <h4 style={styles.subTitle}>Passive Income</h4>
          {passiveIncome.length > 0 ? (
            passiveIncome.map((tag) => (
              <div key={tag.tagId} style={styles.tagItem}>
                <span style={styles.tagName}>{tag.tagName}</span>
                <span style={styles.tagTotal}>
                  {tag.total.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>ไม่มี</p>
          )}

          {/* === START CHANGE: เพิ่ม Total Row ที่นี่ === */}
          <div style={{ ...styles.totalRow, color: "#64ff64" }}>
            <strong style={styles.tagName}>รวม:</strong>
            <strong style={styles.tagTotal}>
              {totalIncome.toLocaleString()}
            </strong>
          </div>
          {/* === END CHANGE === */}
        </div>

        {/* 2b. OUTCOME (ขวา) */}
        <div style={styles.section}>
          {/* === START CHANGE: ลบ Total ออกจาก Header === */}
          <div style={styles.summaryHeaderRed}>
            <TrendingDown size={20} />
            <h3 style={styles.sectionTitle}>Outcome</h3>
          </div>
          {/* === END CHANGE === */}

          <h4 style={styles.subTitle}>รายจ่ายคงที่</h4>
          {fixedExpense.length > 0 ? (
            fixedExpense.map((tag) => (
              <div key={tag.tagId} style={styles.tagItem}>
                <span style={styles.tagName}>{tag.tagName}</span>
                <span style={styles.tagTotal}>
                  {tag.total.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>ไม่มี</p>
          )}

          <h4 style={styles.subTitle}>รายจ่ายไม่คงที่ </h4>
          {variableExpense.length > 0 ? (
            variableExpense.map((tag) => (
              <div key={tag.tagId} style={styles.tagItem}>
                <span style={styles.tagName}>{tag.tagName}</span>
                <span style={styles.tagTotal}>
                  {tag.total.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>ไม่มี</p>
          )}

          {/* === START CHANGE: เพิ่ม Total Row ที่นี่ === */}
          <div style={{ ...styles.totalRow, color: "#ffaaaa" }}>
            <strong style={styles.tagName}>รวม:</strong>
            <strong style={styles.tagTotal}>
              {totalExpense.toLocaleString()}
            </strong>
          </div>
          {/* === END CHANGE === */}
        </div>
      </div>

      {/* --- 3. Net Total --- */}
      <div
        style={{
          ...styles.totalRow,
          padding: "15px",
          backgroundColor: "#2a2a2a",
          borderRadius: "8px",
          color: netIncome >= 0 ? "#64ff64" : "#ffaaaa",
        }}
      >
        <strong style={styles.tagName}>Cashflow :</strong>
        <strong style={styles.tagTotal}>{netIncome.toLocaleString()}</strong>
      </div>
    </div>
  );
}

// === CSS Styles (อัปเดต) ===
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
  monthNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 10px",
    marginBottom: "15px",
  },
  monthName: {
    margin: 0,
    color: "#64cfff",
  },
  navButton: {
    background: "none",
    border: "none",
    color: "white",
    cursor: "pointer",
    padding: "5px",
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem",
    wordBreak: "break-word",
    flexShrink: 1,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 5px 0 5px",
    fontSize: "1.1rem",
    color: "#64ff64",
    borderTop: "1px solid #444",
    marginTop: "10px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  // (อัปเดต) Header สรุป
  summaryHeaderGreen: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#64ff64",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "10px",
  },
  summaryHeaderRed: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#ffaaaa",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
    marginBottom: "10px",
  },
  // (ลบ) summaryTotal (ไม่ใช้แล้ว)

  subTitle: {
    margin: "10px 0 5px 0",
    fontSize: "0.9rem",
    color: "#aaa",
  },

  tagItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    padding: "5px 0",
    gap: "10px",
  },
  tagName: {
    flexGrow: 1,
    wordBreak: "break-word",
    minWidth: 0,
  },
  tagTotal: {
    flexShrink: 0,
    textAlign: "right",
  },

  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "10px",
    fontSize: "0.9rem",
  },
};

export default FinanceSummary;
