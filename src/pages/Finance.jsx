// src/pages/Finance.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  X,
  Wallet,
  Landmark,
  BarChart2,
  CheckCircle2,
  Circle,
  Gift,
  TrendingUp,
  BookOpen,
  Star,
  PiggyBank,
  ArrowDown,
  ArrowUp,
  Settings,
  Trash2,
  Edit,
  Info,
} from "lucide-react";

// (Helper Functions ... ทั้งหมดเหมือนเดิม)
const BUDGET_CATEGORIES = [
  { key: "giving", name: "การให้", icon: <Gift size={20} /> },
  { key: "investing", name: "การลงทุน", icon: <TrendingUp size={20} /> },
  { key: "education", name: "การศึกษา", icon: <BookOpen size={20} /> },
  { key: "rewards", name: "รางวัล", icon: <Star size={20} /> },
  { key: "saving", name: "การออม", icon: <PiggyBank size={20} /> },
];
const getTodayDateString = () => {
  return new Date().toLocaleDateString("en-CA");
};
const getBudgetIcon = (key) => {
  const cat = BUDGET_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.icon : <Wallet size={20} />;
};
const getBudgetName = (key) => {
  const cat = BUDGET_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.name : key;
};

// === Main Component ===
function Finance() {
  const navigate = useNavigate();

  // 1. ดึงข้อมูล (เหมือนเดิม)
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const liabilities = useLiveQuery(
    () => db.liabilities.where("status").equals("outstanding").toArray(),
    []
  );
  const receivables = useLiveQuery(
    () => db.receivables.where("status").equals("pending").toArray(),
    []
  );
  const budgets = useLiveQuery(() => db.budgets.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const tags = useLiveQuery(() => db.tags.toArray(), []);
  const todayTransactions = useLiveQuery(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return db.transactions
      .where("timestamp")
      .aboveOrEqual(startOfDay.toISOString())
      .toArray();
  }, []);

  // 2. ดึงข้อมูล "เดือนที่แล้ว" และ "เดือนนี้" (เหมือนเดิม)
  const { lastMonthFirstDay, lastMonthLastDay, currentMonthFirstDay } =
    useMemo(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstLastMonth = new Date(year, month - 1, 1);
      const lastLastMonth = new Date(year, month, 0);
      lastLastMonth.setHours(23, 59, 59, 999);
      const firstCurrentMonth = new Date(year, month, 1);

      return {
        lastMonthFirstDay: firstLastMonth.toISOString(),
        lastMonthLastDay: lastLastMonth.toISOString(),
        currentMonthFirstDay: firstCurrentMonth.toISOString(),
      };
    }, []);

  // (เหมือนเดิม) ยอด Fixed เดือนที่แล้ว (สำหรับ Auto-Estimate)
  const lastMonthFixedTotal = useLiveQuery(
    async () => {
      const txs = await db.transactions
        .where("timestamp")
        .between(lastMonthFirstDay, lastMonthLastDay)
        .filter((t) => t.type === "expense" && t.classification === "fixed")
        .toArray();
      if (!txs || txs.length === 0) return null;
      return txs.reduce((sum, t) => sum + t.amount, 0);
    },
    [lastMonthFirstDay, lastMonthLastDay],
    null
  );

  // (เหมือนเดิม) ยอด Fixed ที่จ่ายไปแล้ว "เดือนนี้" (สำหรับ Auto-Paid)
  const paidFixedThisMonth_Auto = useLiveQuery(
    async () => {
      const txs = await db.transactions
        .where("timestamp")
        .aboveOrEqual(currentMonthFirstDay)
        .filter((t) => t.type === "expense" && t.classification === "fixed")
        .toArray();
      if (!txs || txs.length === 0) return 0;
      return txs.reduce((sum, t) => sum + t.amount, 0);
    },
    [currentMonthFirstDay],
    null
  );

  // === 3. (เหมือนเดิม) States ===
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [isAddingLiability, setIsAddingLiability] = useState(false);
  const [isAddingReceivable, setIsAddingReceivable] = useState(false);
  const [dueToEdit, setDueToEdit] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [isManagingBudgets, setIsManagingBudgets] = useState(false);
  const [budgetLogModal, setBudgetLogModal] = useState(null);
  const [budgetAddModal, setBudgetAddModal] = useState(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(null);
  const [isFixedExpenseModalOpen, setIsFixedExpenseModalOpen] = useState(false);

  // 4. useEffect (Budgets Initialization - เหมือนเดิม)
  useEffect(() => {
    // ... (เหมือนเดิม)
    const initializeBudgets = async () => {
      if (budgets && budgets.length === 0) {
        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
        const defaultBudgets = BUDGET_CATEGORIES.map((cat) => ({
          name: cat.key,
          currentAmount: 0,
          totalAmount: 0,
          lastReset: startOfMonth,
          icon: cat.key,
        }));
        await db.budgets.bulkAdd(defaultBudgets);
      }
    };
    initializeBudgets();
  }, [budgets]);

  // 5. useEffect (Budgets Rollover - เหมือนเดิม)
  useEffect(() => {
    // ... (เหมือนเดิม)
    const checkAndRolloverBudgets = async () => {
      if (!budgets || budgets.length === 0) return;
      const now = new Date();
      const currentMonthYear = `${now.getFullYear()}-${now.getMonth()}`;
      const firstBudget = budgets[0];
      if (!firstBudget.lastReset) return;
      const lastResetDate = new Date(firstBudget.lastReset);
      const lastResetMonthYear = `${lastResetDate.getFullYear()}-${lastResetDate.getMonth()}`;
      if (currentMonthYear === lastResetMonthYear) return;

      console.log("Rollover budgets for new month:", currentMonthYear);
      const newStartOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const updates = [];
      for (const budget of budgets) {
        const remaining = budget.totalAmount - budget.currentAmount;
        updates.push({
          key: budget.id,
          changes: {
            currentAmount: 0,
            totalAmount: Math.max(0, remaining),
            lastReset: newStartOfMonth,
          },
        });
      }
      await db.budgets.bulkUpdate(updates);
    };
    checkAndRolloverBudgets();
  }, [budgets]);

  // 6. useEffect (Settings Initialization - เหมือนเดิม)
  useEffect(() => {
    // ... (เหมือนเดิม)
    const initializeSettings = async () => {
      if (!settings) return;
      const today = getTodayDateString();

      const mode = settings.find((s) => s.key === "fixedExpenseMode");
      if (!mode) {
        await db.settings.put({ key: "fixedExpenseMode", value: "manual" });
      }
      const manualValue = settings.find((s) => s.key === "manualFixedExpense");
      if (!manualValue) {
        await db.settings.put({ key: "manualFixedExpense", value: 10000 });
      }

      const paidMode = settings.find((s) => s.key === "paidFixedMode");
      if (!paidMode) {
        await db.settings.put({ key: "paidFixedMode", value: "auto" });
      }
      const manualPaidValue = settings.find(
        (s) => s.key === "manualPaidFixedThisMonth"
      );
      if (!manualPaidValue) {
        await db.settings.put({ key: "manualPaidFixedThisMonth", value: 0 });
      }

      const lastReset = settings.find(
        (s) => s.key === "dailySpendableLastReset"
      );
      if (!lastReset || lastReset.value !== today) {
        console.log("Resetting Daily Spendable for:", today);
        await db.settings.put({ key: "dailySpendableUsed", value: 0 });
        await db.settings.put({ key: "dailySpendableLastReset", value: today });
      }
    };
    initializeSettings();
  }, [settings]);

  // 7. (อัปเดต) คำนวณยอดรวม (แยก หนี้สิน Fixed/Variable)
  const totalAssets = useMemo(
    () => (accounts ? accounts.reduce((sum, acc) => sum + acc.balance, 0) : 0),
    [accounts]
  );

  // (ใหม่) แยก Total Liabilities
  const { totalLiabilities, totalVariableLiabilities } = useMemo(() => {
    if (!liabilities)
      return { totalLiabilities: 0, totalVariableLiabilities: 0 };

    const total = liabilities.reduce((sum, item) => sum + item.amount, 0);
    const variableTotal = liabilities
      .filter((item) => item.classification === "variable") // กรองเฉพาะ
      .reduce((sum, item) => sum + item.amount, 0);

    return { totalLiabilities: total, totalVariableLiabilities: variableTotal };
  }, [liabilities]);

  const totalReceivables = useMemo(
    () =>
      receivables ? receivables.reduce((sum, item) => sum + item.amount, 0) : 0,
    [receivables]
  );
  const totalRemainingBudgets = useMemo(() => {
    if (!budgets) return 0;
    return budgets.reduce(
      (sum, b) => sum + (b.totalAmount - b.currentAmount),
      0
    );
  }, [budgets]);

  // 8. (เหมือนเดิม) คำนวณค่าใช้จ่ายคงที่

  // 8a. ยอด "ประมาณการ" Fixed ทั้งเดือน (จาก Manual หรือ Auto-last-month)
  const estimatedFixedExpense = useMemo(() => {
    if (!settings) return 0;
    const mode =
      settings.find((s) => s.key === "fixedExpenseMode")?.value || "manual";
    if (mode === "auto") {
      return lastMonthFixedTotal || 0;
    }
    return settings.find((s) => s.key === "manualFixedExpense")?.value || 0;
  }, [settings, lastMonthFixedTotal]);

  // 8b. ยอด Fixed ที่ "จ่ายไปแล้ว" เดือนนี้ (จาก Manual หรือ Auto-this-month)
  const paidFixedThisMonth = useMemo(() => {
    if (!settings || paidFixedThisMonth_Auto === null) return 0;
    const mode =
      settings.find((s) => s.key === "paidFixedMode")?.value || "auto";
    if (mode === "auto") {
      return paidFixedThisMonth_Auto;
    }
    return (
      settings.find((s) => s.key === "manualPaidFixedThisMonth")?.value || 0
    );
  }, [settings, paidFixedThisMonth_Auto]);

  // 9. (อัปเดต) คำนวณ Daily Spendable (สูตรใหม่)
  const dailySpendable = useMemo(() => {
    if (
      !settings ||
      !accounts ||
      !budgets ||
      !todayTransactions ||
      !liabilities ||
      !receivables ||
      paidFixedThisMonth_Auto === null
    )
      return { limit: 0, used: 0, remainingDays: 1 };

    // (เหมือนเดิม) ยอดใช้จ่ายผันแปรวันนี้
    const dailyUsed = todayTransactions
      .filter((t) => t.type === "expense" && t.classification === "variable")
      .reduce((sum, t) => sum + t.amount, 0);

    // --- (อัปเดต) คำนวณตามสูตรใหม่ ---

    // 1. (ใหม่) คำนวณเงินตั้งต้น (Net Assets) (ไม่รวม Fixed Liabilities)
    const netAssets = totalAssets + totalReceivables - totalVariableLiabilities;

    // 2. (เหมือนเดิม) คำนวณ Fixed ที่ "ยังเหลือต้องจ่าย"
    const remainingFixedToPay = Math.max(
      0,
      estimatedFixedExpense - paidFixedThisMonth
    );

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const remainingDays = Math.max(1, endOfMonth.getDate() - now.getDate() + 1);

    // 3. (อัปเดต) คำนวณเงินที่ "ใช้ได้จริง" (สำหรับ Variable)
    const availableToSpend =
      netAssets - totalRemainingBudgets - remainingFixedToPay;

    const dailyLimit = Math.max(0, availableToSpend / remainingDays);
    // --- สิ้นสุดการอัปเดต ---

    return {
      limit: Math.floor(dailyLimit),
      used: dailyUsed,
      remainingDays: remainingDays,
    };
  }, [
    totalAssets,
    // totalLiabilities, (ลบออก)
    totalVariableLiabilities, // (ใหม่)
    totalReceivables,
    totalRemainingBudgets,
    settings,
    todayTransactions,
    accounts,
    budgets,
    liabilities, // (ใหม่) เพิ่ม dependency
    estimatedFixedExpense,
    paidFixedThisMonth,
    paidFixedThisMonth_Auto,
  ]);

  // (Handler สำหรับลบ Account - เหมือนเดิม)
  const handleDeleteAccount = async (id, name) => {
    // ... (เหมือนเดิม)
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}"?`)) {
      await db.accounts.delete(id);
    }
  };

  // (Handlers สำหรับ "ลบ" และ "เปิดหน้าแก้ไข" หนี้สิน/ค้างรับ - เหมือนเดิม)
  const handleDeleteDue = async (type, id, name) => {
    // ... (เหมือนเดิม)
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}"?`)) {
      try {
        if (type === "liability") {
          await db.liabilities.delete(id);
        } else {
          await db.receivables.delete(id);
        }
      } catch (e) {
        console.error(`Failed to delete ${type}:`, e);
      }
    }
  };

  const handleOpenEditDue = (type, item) => {
    // ... (เหมือนเดิม)
    setDueToEdit({ type, item });
  };

  // (อัปเดต) ถ้ายังโหลดไม่เสร็จ
  if (
    !accounts ||
    !liabilities ||
    !receivables ||
    !budgets ||
    !settings ||
    !tags ||
    lastMonthFixedTotal === undefined ||
    paidFixedThisMonth_Auto === null
  ) {
    return <div>กำลังโหลดข้อมูลการเงิน...</div>;
  }

  // (หน้าจอ First Time Setup - เหมือนเดิม)
  if (accounts.length === 0 && !isAddingAccount) {
    // ... (เหมือนเดิม)
    return (
      <div style={styles.firstTimeSetup}>
        <h3>ตั้งค่าบัญชีการเงิน</h3>
        <p>คุณยังไม่มีบัญชี (เช่น เงินสด, ธนาคาร) กรุณาเพิ่มบัญชีแรกของคุณ</p>
        <button
          onClick={() => setIsAddingAccount(true)}
          style={styles.saveButton}
        >
          <Plus size={18} />
          เพิ่มบัญชี
        </button>
        {isAddingAccount && (
          <AddAccountModal onClose={() => setIsAddingAccount(false)} />
        )}
      </div>
    );
  }

  // (หน้าหลัก JSX)
  return (
    <div style={styles.page}>
      <div style={styles.scrollArea}>
        {/* --- 1. สรุปสินทรัพย์ (Accounts) (เหมือนเดิม) --- */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>สินทรัพย์ (Accounts)</h3>
            <button
              onClick={() => setIsAddingAccount(true)}
              style={styles.iconButton}
            >
              <Plus size={18} />
            </button>
          </div>
          {accounts.map((acc) => (
            <div key={acc.id} style={styles.accountItem}>
              <div style={styles.accountInfo}>
                {acc.name.includes("เงินสด") ? (
                  <Wallet size={20} />
                ) : (
                  <Landmark size={20} />
                )}
                <span>{acc.name}</span>
              </div>
              <div style={styles.accountBalance}>
                <span>{acc.balance.toLocaleString()}</span>
                <button
                  onClick={() => setAccountToEdit(acc)}
                  style={styles.deleteButton}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteAccount(acc.id, acc.name)}
                  style={styles.deleteButton}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          <div style={styles.totalRow}>
            <strong>ยอดรวมสินทรัพย์:</strong>
            <strong>{totalAssets.toLocaleString()}</strong>
          </div>

          {/* Daily Spendable (เหมือนเดิม) */}
          <div style={styles.dailySpendBox}>
            <div style={styles.dailySpendHeader}>
              <span>ค่าใช้จ่ายต่อวัน (Variable)</span>
              <button
                onClick={() => setIsFixedExpenseModalOpen(true)}
                style={styles.infoButton}
              >
                <Info size={16} />
              </button>
            </div>
            <div style={styles.hpBarOuter}>
              <div
                style={{
                  ...styles.hpBarInner,
                  width: `${
                    (dailySpendable.used / (dailySpendable.limit + 0.0001)) *
                    100
                  }%`,
                  backgroundColor: "#ffaaaa",
                }}
              ></div>
            </div>
            <span style={styles.hpText}>
              {dailySpendable.used.toLocaleString()} /{" "}
              {dailySpendable.limit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* --- 2. งบประมาณ (Budgets) (เหมือนเดิม) --- */}
        <div style={styles.section}>
          {/* ... (โค้ดส่วน Budgets เหมือนเดิม) ... */}
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>งบประมาณ (Budgets)</h3>
            <button
              onClick={() => setIsManagingBudgets(true)}
              style={styles.iconButton}
            >
              <Settings size={18} />
            </button>
          </div>
          <div style={styles.budgetGrid}>
            {budgets.map((budget) => {
              const current = budget.currentAmount;
              const total = budget.totalAmount;
              const percentage = total === 0 ? 0 : (current / total) * 100;
              return (
                <div key={budget.id} style={styles.budgetBox}>
                  <div style={styles.budgetHeader}>
                    {getBudgetIcon(budget.name) || <Wallet size={20} />}
                    <span>{getBudgetName(budget.name)}</span>
                  </div>
                  <div style={styles.hpBarOuter}>
                    <div
                      style={{ ...styles.hpBarInner, width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span style={styles.hpText}>
                    {current.toLocaleString()} / {total.toLocaleString()}
                  </span>
                  <div style={styles.budgetActions}>
                    <button
                      onClick={() => setBudgetLogModal(budget)}
                      style={styles.budgetButtonRed}
                    >
                      - ใช้
                    </button>
                    <button
                      onClick={() => setBudgetAddModal(budget)}
                      style={styles.budgetButtonGreen}
                    >
                      + เพิ่ม
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 3. ค้างรับ / หนี้สิน (อัปเดต) --- */}
        <div style={styles.grid2}>
          {/* ค้างรับ (ซ้าย - เหมือนเดิม) */}
          <div style={styles.section}>
            {/* ... (โค้ดค้างรับ เหมือนเดิม) ... */}
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>ค้างรับ</h3>
              <button
                onClick={() => setIsAddingReceivable(true)}
                style={styles.iconButton}
              >
                <Plus size={18} />
              </button>
            </div>
            <div style={styles.dueList}>
              {receivables.length > 0 ? (
                receivables.map((item) => (
                  <div key={item.id} style={styles.dueItem}>
                    <div style={styles.dueInfo}>
                      <span>{item.name}</span>
                      <strong>{item.amount.toLocaleString()}</strong>
                    </div>
                    <div style={styles.dueActions}>
                      <button
                        onClick={() => handleOpenEditDue("receivable", item)}
                        style={styles.iconButtonSmall}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteDue("receivable", item.id, item.name)
                        }
                        style={styles.deleteButtonSmall}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setPaymentModal({ type: "receive", item })
                        }
                        style={styles.payButtonGreen}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>ไม่มีค้างรับ</p>
              )}
            </div>
            <div style={styles.totalRowSmall}>
              <strong>รวมค้างรับ:</strong>
              <strong>{totalReceivables.toLocaleString()}</strong>
            </div>
          </div>

          {/* หนี้สิน (ขวา - อัปเดต) */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>หนี้สิน</h3>
              <button
                onClick={() => setIsAddingLiability(true)}
                style={styles.iconButton}
              >
                <Plus size={18} />
              </button>
            </div>
            <div style={styles.dueList}>
              {liabilities.length > 0 ? (
                liabilities.map((item) => (
                  <div key={item.id} style={styles.dueItem}>
                    <div style={styles.dueInfo}>
                      <span>{item.name}</span>
                      <strong style={{ color: "#ffaaaa" }}>
                        {item.amount.toLocaleString()}
                      </strong>
                    </div>
                    <div style={styles.dueActions}>
                      <button
                        onClick={() => handleOpenEditDue("liability", item)}
                        style={styles.iconButtonSmall}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteDue("liability", item.id, item.name)
                        }
                        style={styles.deleteButtonSmall}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => setPaymentModal({ type: "pay", item })}
                        style={styles.payButtonRed}
                      >
                        <Circle size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>ไม่มีหนี้สิน</p>
              )}
            </div>
            <div style={styles.totalRowSmall}>
              <strong>รวมหนี้สิน:</strong>
              {/* (อัปเดต) ใช้ totalLiabilities (ตัวเต็ม) สำหรับการแสดงผล */}
              <strong style={{ color: "#ffaaaa" }}>
                {totalLiabilities.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* --- 4. ปุ่มสรุปผล (เหมือนเดิม) --- */}
        <Link to="/finance-summary" style={styles.summaryButton}>
          <BarChart2 size={18} />
          ดูสรุปผลประจำเดือน
        </Link>
      </div>{" "}
      {/* จบ Scroll Area */}
      {/* 5. Sticky Footer (เหมือนเดิม) */}
      <div style={styles.stickyFooter}>
        {/* ... (เหมือนเดิม) ... */}
        <button
          onClick={() => setIsTxModalOpen("income")}
          style={styles.txButtonGreen}
        >
          <ArrowDown size={20} /> รายรับ
        </button>
        <button
          onClick={() => setIsTxModalOpen("expense")}
          style={styles.txButtonRed}
        >
          <ArrowUp size={20} /> รายจ่าย
        </button>
      </div>
      {/* --- Modals (อัปเดต Props) --- */}
      {isAddingAccount && (
        <AddAccountModal onClose={() => setIsAddingAccount(false)} />
      )}
      {accountToEdit && (
        <EditAccountModal
          account={accountToEdit}
          onClose={() => setAccountToEdit(null)}
        />
      )}
      {isAddingLiability && (
        <AddDueModal
          type="liability"
          onClose={() => setIsAddingLiability(false)}
          tags={tags}
          onNavigateToTags={() => navigate("/tag-manager")}
        />
      )}
      {isAddingReceivable && (
        <AddDueModal
          type="receivable"
          onClose={() => setIsAddingReceivable(false)}
          tags={tags}
          onNavigateToTags={() => navigate("/tag-manager")}
        />
      )}
      {dueToEdit && (
        <AddDueModal
          type={dueToEdit.type}
          itemToEdit={dueToEdit.item}
          onClose={() => setDueToEdit(null)}
          tags={tags}
          onNavigateToTags={() => navigate("/tag-manager")}
        />
      )}
      {/* (อัปเดต) ส่ง Props (estimatedFixedExpense, paidFixedThisMonth) ไป PaymentModal */}
      {paymentModal && (
        <PaymentModal
          info={paymentModal}
          accounts={accounts}
          budgets={budgets}
          onClose={() => setPaymentModal(null)}
          estimatedFixedExpense={estimatedFixedExpense}
          paidFixedThisMonth={paidFixedThisMonth}
        />
      )}
      {isManagingBudgets && (
        <BudgetManagerModal
          budgets={budgets}
          onClose={() => setIsManagingBudgets(false)}
        />
      )}
      {budgetLogModal && (
        <BudgetLogModal
          budget={budgetLogModal}
          accounts={accounts}
          onClose={() => setBudgetLogModal(null)}
        />
      )}
      {budgetAddModal && (
        <BudgetAddModal
          budget={budgetAddModal}
          onClose={() => setBudgetAddModal(null)}
        />
      )}
      {/* (อัปเดต) ส่ง Props (totalVariableLiabilities) ไป TransactionModal */}
      {isTxModalOpen && (
        <TransactionModal
          type={isTxModalOpen}
          accounts={accounts}
          tags={tags}
          budgets={budgets}
          onClose={() => setIsTxModalOpen(null)}
          onNavigateToTags={() => navigate("/tag-manager")}
          dailySpendable={dailySpendable}
          totalAssets={totalAssets}
          totalReceivables={totalReceivables}
          totalVariableLiabilities={totalVariableLiabilities} // (อัปเดต)
          totalRemainingBudgets={totalRemainingBudgets}
          estimatedFixedExpense={estimatedFixedExpense} // (เปลี่ยนชื่อ prop)
          paidFixedThisMonth={paidFixedThisMonth}
        />
      )}
      {isFixedExpenseModalOpen && (
        <FixedExpenseModal
          settings={settings}
          onClose={() => setIsFixedExpenseModalOpen(false)}
          lastMonthFixedTotal={lastMonthFixedTotal}
          paidFixedThisMonth_Auto={paidFixedThisMonth_Auto}
        />
      )}
    </div>
  );
}

// =======================================================
// === (อัปเดต) Component: Modal ธุรกรรม (รายรับ/จ่าย) ===
// =======================================================
function TransactionModal({
  type,
  accounts,
  tags,
  budgets,
  onClose,
  onNavigateToTags,
  dailySpendable,
  totalAssets,
  totalReceivables,
  totalVariableLiabilities, // (อัปเดต)
  totalRemainingBudgets,
  estimatedFixedExpense, // (อัปเดต)
  paidFixedThisMonth,
}) {
  const isExpense = type === "expense";
  const title = isExpense ? "บันทึกรายจ่าย" : "บันทึกรายรับ";

  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [classification, setClassification] = useState(
    isExpense ? "variable" : "active"
  );
  const [tagId, setTagId] = useState("");
  const [distributeIncome, setDistributeIncome] = useState(true);

  const relevantTags = useMemo(() => {
    return tags.filter((t) => t.type === type);
  }, [tags, type]);

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      alert("จำนวนเงินต้องมากกว่า 0");
      return;
    }
    if (!accountId) {
      alert("กรุณาเลือกบัญชี");
      return;
    }
    if (!tagId) {
      alert("กรุณาเลือกแท็ก");
      return;
    }

    // (ใหม่) Alert System (Fixed Expense Overpayment)
    if (isExpense && classification === "fixed") {
      if (paidFixedThisMonth + numAmount > estimatedFixedExpense) {
        if (
          !window.confirm(
            `⚠️ แจ้งเตือน: รายจ่ายคงที่นี้ (${numAmount.toLocaleString()}) จะทำให้ยอดใช้จ่ายคงที่เกินงบประมาณที่ตั้งไว้!\n\n` +
              `งบประมาณ: ${estimatedFixedExpense.toLocaleString()}\n` +
              `จ่ายแล้ว: ${paidFixedThisMonth.toLocaleString()}\n` +
              `ใหม่ (รวม): ${(
                paidFixedThisMonth + numAmount
              ).toLocaleString()}\n\n` +
              `กรุณาไปที่ 'ตั้งค่า' (ปุ่ม ℹ️) เพื่อเพิ่มงบประมาณรายจ่ายคงที่ก่อนดำเนินการต่อ\n\n` +
              `คุณต้องการดำเนินการต่อหรือไม่? (ไม่แนะนำ)`
          )
        ) {
          return; // Stop execution
        }
      }
    }

    // (อัปเดต) Alert System (Variable Expense - ใช้สูตรใหม่)
    if (isExpense && classification === "variable") {
      const newDailyUsed = dailySpendable.used + numAmount;
      if (newDailyUsed > dailySpendable.limit) {
        const tomorrowRemainingDays = Math.max(
          1,
          dailySpendable.remainingDays - 1
        );

        // (อัปเดต) คำนวณ NetAssets ใหม่
        const newNetAssets =
          totalAssets - numAmount + totalReceivables - totalVariableLiabilities;

        const remainingFixedToPay = Math.max(
          0,
          estimatedFixedExpense - paidFixedThisMonth
        );

        const newAvailableToSpend =
          newNetAssets - totalRemainingBudgets - remainingFixedToPay;

        const tomorrowLimit = Math.max(
          0,
          newAvailableToSpend / tomorrowRemainingDays
        );

        if (
          !window.confirm(
            `⚠️ แจ้งเตือน: การใช้จ่ายนี้ (${numAmount.toLocaleString()}) จะทำให้ยอดใช้จ่ายวันนี้เกินกำหนด!\n\n` +
              `(ถ้าคุณจ่าย: งบใช้จ่ายของวันพรุ่งนี้จะเหลือประมาณ: ${Math.floor(
                tomorrowLimit
              ).toLocaleString()} / วัน)\n\n` +
              `คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ?`
          )
        ) {
          return;
        }
      }
    }

    try {
      // ... (Logic การหักเงิน/เพิ่มเงิน/เพิ่ม transaction/แบ่งงบ - เหมือนเดิม) ...
      const account = await db.accounts.get(Number(accountId));

      if (isExpense) {
        if (account.balance < numAmount) {
          alert("เงินในบัญชีไม่พอ!");
          return;
        }
        await db.accounts.update(account.id, {
          balance: account.balance - numAmount,
        });
      } else {
        await db.accounts.update(account.id, {
          balance: account.balance + numAmount,
        });
        if (distributeIncome) {
          const distributionAmount = numAmount * 0.1;
          const defaultBudgetKeys = [
            "giving",
            "investing",
            "education",
            "rewards",
            "saving",
          ];
          const budgetsToUpdate = budgets.filter((b) =>
            defaultBudgetKeys.includes(b.name)
          );
          const updates = budgetsToUpdate.map((budget) => ({
            key: budget.id,
            changes: { totalAmount: budget.totalAmount + distributionAmount },
          }));
          if (updates.length > 0) {
            await db.budgets.bulkUpdate(updates);
          }
        }
      }

      await db.transactions.add({
        timestamp: new Date().toISOString(),
        type: type,
        amount: numAmount,
        accountId: Number(accountId),
        tagId: Number(tagId),
        classification: classification,
      });

      if (isExpense && classification === "variable") {
        const currentDailyUsed =
          (await db.settings.get("dailySpendableUsed"))?.value || 0;
        await db.settings.put({
          key: "dailySpendableUsed",
          value: currentDailyUsed + numAmount,
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>จำนวนเงิน</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>{isExpense ? "หักจากบัญชี" : "เพิ่มเข้าบัญชี"}</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={styles.select}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (คงเหลือ: {acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label>ประเภท (Type)</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              style={styles.select}
            >
              {isExpense ? (
                <>
                  <option value="variable">
                    รายจ่ายไม่คงที่ (ค่าอาหาร+อื่นๆ)
                  </option>
                  <option value="fixed">รายจ่ายคงที่</option>
                </>
              ) : (
                <>
                  <option value="active">Active Income</option>
                  <option value="passive">Passive Income</option>
                </>
              )}
            </select>
          </div>

          {!isExpense && (
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="distributeIncome"
                checked={distributeIncome}
                onChange={(e) => setDistributeIncome(e.target.checked)}
              />
              <label htmlFor="distributeIncome" style={styles.checkboxLabel}>
                แบ่ง 10% (x5) เข้าเพดานงบประมาณ
              </label>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label>แท็ก (Tag)</label>
            <div style={styles.budgetInputBox}>
              <select
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                style={styles.select}
              >
                <option value="" disabled>
                  -- เลือกแท็ก --
                </option>
                {relevantTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <button onClick={onNavigateToTags} style={styles.editButton}>
                <Edit size={18} />
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            style={isExpense ? styles.txButtonRed : styles.txButtonGreen}
          >
            {isExpense ? "บันทึกรายจ่าย" : "บันทึกรายรับ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================================================
// === Component: Modal ตั้งค่า Fixed Expense (เหมือนเดิม) ===
// =======================================================
function FixedExpenseModal({
  settings,
  onClose,
  lastMonthFixedTotal,
  paidFixedThisMonth_Auto,
}) {
  // ... (โค้ดเหมือนเดิม)
  const [estimateMode, setEstimateMode] = useState(
    settings.find((s) => s.key === "fixedExpenseMode")?.value || "manual"
  );
  const [estimateAmount, setEstimateAmount] = useState(
    settings.find((s) => s.key === "manualFixedExpense")?.value || 10000
  );
  const [paidMode, setPaidMode] = useState(
    settings.find((s) => s.key === "paidFixedMode")?.value || "auto"
  );
  const [paidAmount, setPaidAmount] = useState(
    settings.find((s) => s.key === "manualPaidFixedThisMonth")?.value || 0
  );
  const hasLastMonthData = lastMonthFixedTotal !== null;

  const handleSave = async () => {
    if (estimateMode === "auto" && !hasLastMonthData) {
      alert(
        "ไม่สามารถเลือกโหมดอัตโนมัติ (สำหรับยอดประมาณการ) ได้ เพราะยังไม่มีข้อมูลของเดือนที่แล้ว"
      );
      return;
    }
    try {
      await db.settings.put({ key: "fixedExpenseMode", value: estimateMode });
      await db.settings.put({
        key: "manualFixedExpense",
        value: Number(estimateAmount),
      });
      await db.settings.put({ key: "paidFixedMode", value: paidMode });
      await db.settings.put({
        key: "manualPaidFixedThisMonth",
        value: Number(paidAmount),
      });
      onClose();
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>ตั้งค่ารายจ่ายคงที่ (สำหรับคำนวณ)</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
              1. ยอดประมาณการ (ทั้งเดือน)
            </label>
            <p style={styles.helpText}>
              ตั้งค่าว่าคุณ "คาดว่า" จะมีรายจ่ายคงที่ทั้งเดือนเท่าไหร่
            </p>
            <select
              value={estimateMode}
              onChange={(e) => setEstimateMode(e.target.value)}
              style={styles.select}
            >
              <option value="manual">กำหนดเอง</option>
              <option value="auto" disabled={!hasLastMonthData}>
                อัตโนมัติ
                {hasLastMonthData
                  ? ` (จากเดือนที่แล้ว: ${lastMonthFixedTotal.toLocaleString()})`
                  : " (ยังไม่มีข้อมูลเดือนที่แล้ว)"}
              </option>
            </select>
          </div>
          {estimateMode === "manual" && (
            <div style={styles.inputGroup}>
              <label>จำนวนเงิน (ประมาณการ/เดือน)</label>
              <input
                type="number"
                value={estimateAmount}
                onChange={(e) => setEstimateAmount(e.target.value)}
                style={styles.input}
              />
            </div>
          )}
          <hr style={styles.hr} />
          <div style={styles.inputGroup}>
            <label style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
              2. ยอดที่จ่ายไปแล้ว (เดือนนี้)
            </label>
            <p style={styles.helpText}>
              ตั้งค่าว่า "ตอนนี้" คุณจ่ายรายจ่ายคงที่ไปแล้วเท่าไหร่
            </p>
            <select
              value={paidMode}
              onChange={(e) => setPaidMode(e.target.value)}
              style={styles.select}
            >
              <option value="auto">
                อัตโนมัติ (จากระบบ:{" "}
                {(paidFixedThisMonth_Auto || 0).toLocaleString()})
              </option>
              <option value="manual">กำหนดเอง (แก้ไข)</option>
            </select>
          </div>
          {paidMode === "manual" && (
            <div style={styles.inputGroup}>
              <label>จำนวนเงิน (ที่จ่ายไปแล้ว)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={styles.input}
              />
            </div>
          )}
          <button onClick={handleSave} style={styles.saveButton}>
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// === Component: 'BudgetManagerModal' (เหมือนเดิม) ===
// ===================================================================
function BudgetManagerModal({ budgets, onClose }) {
  // ... (เหมือนเดิม)
  const [newName, setNewName] = useState("");
  const [editingBudget, setEditingBudget] = useState(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    try {
      await db.budgets.add({
        name: newName,
        currentAmount: 0,
        totalAmount: 0,
        lastReset: startOfMonth,
        icon: null,
      });
      setNewName("");
    } catch (e) {
      if (e.name === "ConstraintError") alert("มีชื่อนี้อยู่แล้ว");
    }
  };

  const handleDelete = async (id, name) => {
    if (BUDGET_CATEGORIES.some((c) => c.key === name)) {
      alert(`ไม่สามารถลบหมวดหมู่ "${getBudgetName(name)}" ได้`);
      return;
    }
    if (window.confirm(`ลบงบประมาณ "${name}"?`)) {
      await db.budgets.delete(id);
    }
  };

  return (
    <>
      <div style={styles.modalOverlay}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3>จัดการงบประมาณ</h3>
            <button onClick={onClose} style={styles.closeButton}>
              <X size={24} />
            </button>
          </div>
          <div style={styles.inputGroup} className="modalForm">
            <label>เพิ่มงบประมาณใหม่</label>
            <div style={styles.budgetInputBox}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={styles.input}
                placeholder="เช่น 'ท่องเที่ยว'"
              />
              <button onClick={handleAdd} style={styles.saveButton}>
                <Plus size={18} />
              </button>
            </div>
          </div>
          <hr style={styles.hr} />
          <div style={styles.budgetManagerList}>
            {budgets.map((b) => (
              <div key={b.id} style={styles.budgetItem}>
                <span>{getBudgetName(b.name)}</span>
                <div style={styles.budgetAdminButtons}>
                  <button
                    onClick={() => {
                      setEditingBudget(b);
                    }}
                    style={styles.iconButton}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.name)}
                    style={styles.deleteButton}
                    disabled={BUDGET_CATEGORIES.some((c) => c.key === b.name)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingBudget && (
        <EditBudgetModal
          budget={editingBudget}
          onClose={() => setEditingBudget(null)}
        />
      )}
    </>
  );
}

// ==============================================================
// === Component: 'EditBudgetModal' (เหมือนเดิม) ===
// ==============================================================
function EditBudgetModal({ budget, onClose }) {
  // ... (เหมือนเดิม)
  const isDefault = useMemo(
    () => BUDGET_CATEGORIES.some((c) => c.key === budget.name),
    [budget.name]
  );

  const [name, setName] = useState(budget.name);
  const [totalAmount, setTotalAmount] = useState(budget.totalAmount);
  const [currentAmount, setCurrentAmount] = useState(budget.currentAmount);

  const handleSave = async () => {
    const numTotal = Number(totalAmount);
    const numCurrent = Number(currentAmount);

    if (numTotal < 0 || numCurrent < 0) {
      alert("ยอดเงินห้ามติดลบ");
      return;
    }
    if (numCurrent > numTotal) {
      alert("ยอดใช้ (Current) ต้องไม่มากกว่ายอดเพดาน (Total)");
      return;
    }
    if (!isDefault && !name.trim()) {
      alert("กรุณาใส่ชื่อ");
      return;
    }

    try {
      const updates = {
        totalAmount: numTotal,
        currentAmount: numCurrent,
      };

      if (!isDefault) {
        updates.name = name;
      }

      await db.budgets.update(budget.id, updates);
      onClose();
    } catch (e) {
      if (e.name === "ConstraintError") alert("มีชื่อนี้อยู่แล้ว");
      console.error("Failed to update budget:", e);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>แก้ไขงบประมาณ</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อ</label>
            <input
              type="text"
              value={isDefault ? getBudgetName(name) : name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              disabled={isDefault}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>เพดานงบ (Total Amount)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>ใช้ไปแล้ว (Current Amount)</label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              style={styles.input}
            />
          </div>
          <button onClick={handleSave} style={styles.saveButton}>
            <CheckCircle2 size={18} /> บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'BudgetLogModal' - เหมือนเดิม)
function BudgetLogModal({ budget, accounts, onClose }) {
  // ... (เหมือนเดิม)
  const title = `ใช้เงินงบ: ${getBudgetName(budget.name)}`;
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      alert("จำนวนเงินต้องมากกว่า 0");
      return;
    }
    if (!accountId) {
      alert("กรุณาเลือกบัญชี");
      return;
    }
    const account = accounts.find((a) => a.id === Number(accountId));
    if (account.balance < numAmount) {
      alert("เงินในบัญชีไม่พอ!");
      return;
    }
    if (budget.currentAmount + numAmount > budget.totalAmount) {
      alert("ใช้งบประมาณเกินกำหนด! (กรุณา 'เพิ่ม' งบก่อน)");
      return;
    }
    try {
      await db.accounts.update(account.id, {
        balance: account.balance - numAmount,
      });
      await db.budgets.update(budget.id, {
        currentAmount: budget.currentAmount + numAmount,
      });
      onClose();
    } catch (error) {
      console.error("Failed to use budget:", error);
    }
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>จำนวนเงินที่ใช้</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>หักจากบัญชี</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={styles.select}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (คงเหลือ: {acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleSubmit} style={styles.txButtonRed}>
            <ArrowUp size={18} /> ยืนยันการใช้
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'BudgetAddModal' - เหมือนเดิม)
function BudgetAddModal({ budget, onClose }) {
  // ... (เหมือนเดิม)
  const title = `เพิ่มเพดานงบ: ${getBudgetName(budget.name)}`;
  const [amount, setAmount] = useState(0);
  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      alert("จำนวนเงินต้องมากกว่า 0");
      return;
    }
    try {
      await db.budgets.update(budget.id, {
        totalAmount: budget.totalAmount + numAmount,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add to budget:", error);
    }
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <p>นี่คือการเพิ่ม "เพดาน" งบประมาณ (ไม่ได้หักเงินจริง)</p>
          <div style={styles.inputGroup}>
            <label>จำนวนเงินที่จะเพิ่ม</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
          </div>
          <button onClick={handleSubmit} style={styles.txButtonGreen}>
            <Plus size={18} /> เพิ่มเพดาน
          </button>
        </div>
      </div>
    </div>
  );
}

// (Component 'AddAccountModal' - เหมือนเดิม)
function AddAccountModal({ onClose }) {
  // ... (เหมือนเดิม)
  const [name, setName] = useState("");
  const [balance, setBalance] = useState(0);
  const handleSubmit = async () => {
    if (!name || balance < 0) {
      alert("กรุณากรอกชื่อ และยอดเงิน (ห้ามติดลบ)");
      return;
    }
    try {
      await db.accounts.add({ name: name, balance: Number(balance) });
      onClose();
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>เพิ่มบัญชีใหม่</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อบัญชี (เช่น "เงินสด", "ธนาคาร KBank")</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>ยอดเงินเริ่มต้น</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              style={styles.input}
            />
          </div>
          <button onClick={handleSubmit} style={styles.saveButton}>
            <Plus size={18} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// === Component: 'EditAccountModal' (เหมือนเดิม) ===
// ==============================================================
function EditAccountModal({ account, onClose }) {
  // ... (เหมือนเดิม)
  const [name, setName] = useState(account.name);
  const [balance, setBalance] = useState(account.balance);

  const handleSubmit = async () => {
    if (!name || balance < 0) {
      alert("กรุณากรอกชื่อ และยอดเงิน (ห้ามติดลบ)");
      return;
    }
    try {
      await db.accounts.update(account.id, {
        name: name,
        balance: Number(balance),
      });
      onClose();
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>แก้ไขบัญชี</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อบัญชี</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>ยอดเงินคงเหลือ</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              style={styles.input}
            />
          </div>
          <button onClick={handleSubmit} style={styles.saveButton}>
            <CheckCircle2 size={18} /> บันทึกการแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================
// === Component: 'AddDueModal' (เหมือนเดิม) ===
// ==============================================================
function AddDueModal({
  type,
  onClose,
  tags,
  onNavigateToTags,
  itemToEdit = null,
}) {
  // ... (เหมือนเดิม)
  const isLiability = type === "liability";
  const isEditMode = itemToEdit !== null;

  const title = isEditMode
    ? isLiability
      ? "แก้ไขหนี้สิน"
      : "แก้ไขค้างรับ"
    : isLiability
    ? "เพิ่มหนี้สิน"
    : "เพิ่มค้างรับ";

  const [name, setName] = useState(itemToEdit?.name || "");
  const [amount, setAmount] = useState(itemToEdit?.amount || 0);
  const [tagId, setTagId] = useState(itemToEdit?.tagId || "");
  const [classification, setClassification] = useState(
    itemToEdit?.classification || (isLiability ? "fixed" : "active")
  );

  const relevantTags = useMemo(() => {
    const tagType = isLiability ? "expense" : "income";
    return tags.filter((t) => t.type === tagType);
  }, [tags, isLiability]);

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!name || numAmount <= 0) {
      alert("กรุณากรอกชื่อ และยอดเงิน (ต้องมากกว่า 0)");
      return;
    }
    if (!tagId) {
      alert("กรุณาเลือกแท็ก");
      return;
    }

    const data = {
      name: name,
      amount: numAmount,
      tagId: Number(tagId),
      classification: classification,
      status: isLiability ? "outstanding" : "pending",
    };

    try {
      if (isEditMode) {
        if (isLiability) {
          await db.liabilities.update(itemToEdit.id, data);
        } else {
          await db.receivables.update(itemToEdit.id, data);
        }
      } else {
        if (isLiability) {
          await db.liabilities.add(data);
        } else {
          await db.receivables.add(data);
        }
      }
      onClose();
    } catch (error) {
      console.error(
        `Failed to ${isEditMode ? "update" : "add"} ${type}:`,
        error
      );
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <div style={styles.inputGroup}>
            <label>ชื่อ (เช่น "กู้ยืม A", "B ยืมเงิน")</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label>จำนวนเงิน</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>ประเภท (Type)</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              style={styles.select}
            >
              {isLiability ? (
                <>
                  <option value="fixed">รายจ่ายคงที่</option>
                  <option value="variable">รายจ่ายไม่คงที่</option>
                </>
              ) : (
                <>
                  <option value="active">Active Income</option>
                  <option value="passive">Passive Income</option>
                </>
              )}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label>แท็ก (Tag)</label>
            <div style={styles.budgetInputBox}>
              <select
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                style={styles.select}
              >
                <option value="" disabled>
                  -- เลือกแท็ก --
                </option>
                {relevantTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <button onClick={onNavigateToTags} style={styles.editButton}>
                <Edit size={18} />
              </button>
            </div>
          </div>

          <button onClick={handleSubmit} style={styles.saveButton}>
            {isEditMode ? <CheckCircle2 size={18} /> : <Plus size={18} />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// =======================================================
// === (อัปเดต) Component: 'PaymentModal' (จ่าย/รับ) ===
// =======================================================
function PaymentModal({
  info,
  accounts,
  budgets,
  onClose,
  estimatedFixedExpense,
  paidFixedThisMonth, // (เพิ่ม Props)
}) {
  const { type, item } = info;
  const isPaying = type === "pay";
  const title = isPaying ? `จ่ายหนี้: ${item.name}` : `รับเงิน: ${item.name}`;

  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [distributeIncome, setDistributeIncome] = useState(true);

  const handleSubmit = async () => {
    if (!accountId) {
      alert("กรุณาเลือกบัญชีที่จะใช้");
      return;
    }

    const tagId = item.tagId;
    if (!tagId) {
      alert(
        "เกิดข้อผิดพลาด: ไม่พบ Tag ID ในรายการนี้ (กรุณาลองลบและเพิ่มใหม่)"
      );
      return;
    }

    const classification = item.classification;
    if (!classification) {
      alert("เกิดข้อผิดพลาด: ไม่พบ Classification (กรุณาลองลบและเพิ่มใหม่)");
      return;
    }

    try {
      const account = await db.accounts.get(Number(accountId));
      if (!account) throw new Error("Account not found");

      if (isPaying) {
        // (ใหม่) Alert System (Fixed Expense Overpayment)
        if (classification === "fixed") {
          if (paidFixedThisMonth + item.amount > estimatedFixedExpense) {
            if (
              !window.confirm(
                `⚠️ แจ้งเตือน: การชำระหนี้คงที่นี้ (${item.amount.toLocaleString()}) จะทำให้ยอดใช้จ่ายคงที่เกินงบประมาณที่ตั้งไว้!\n\n` +
                  `งบประมาณ: ${estimatedFixedExpense.toLocaleString()}\n` +
                  `จ่ายแล้ว: ${paidFixedThisMonth.toLocaleString()}\n` +
                  `ใหม่ (รวม): ${(
                    paidFixedThisMonth + item.amount
                  ).toLocaleString()}\n\n` +
                  `กรุณาไปที่ 'ตั้งค่า' (ปุ่ม ℹ️) เพื่อเพิ่มงบประมาณรายจ่ายคงที่ก่อนดำเนินการต่อ\n\n` +
                  `คุณต้องการดำเนินการต่อหรือไม่? (ไม่แนะนำ)`
              )
            ) {
              return; // Stop execution
            }
          }
        }

        // ... (Logic การหักเงิน - เหมือนเดิม) ...
        if (account.balance < item.amount) {
          alert("เงินในบัญชีไม่พอ!");
          return;
        }
        await db.accounts.update(account.id, {
          balance: account.balance - item.amount,
        });
        await db.liabilities.update(item.id, { status: "paid" });

        await db.transactions.add({
          timestamp: new Date().toISOString(),
          type: "expense",
          amount: item.amount,
          accountId: Number(accountId),
          tagId: tagId,
          classification: classification,
        });
      } else {
        // ... (Logic การรับเงิน - เหมือนเดิม) ...
        await db.accounts.update(account.id, {
          balance: account.balance + item.amount,
        });
        await db.receivables.update(item.id, { status: "received" });

        await db.transactions.add({
          timestamp: new Date().toISOString(),
          type: "income",
          amount: item.amount,
          accountId: Number(accountId),
          tagId: tagId,
          classification: classification,
        });

        if (distributeIncome) {
          const distributionAmount = item.amount * 0.1;
          const defaultBudgetKeys = [
            "giving",
            "investing",
            "education",
            "rewards",
            "saving",
          ];
          const budgetsToUpdate = budgets.filter((b) =>
            defaultBudgetKeys.includes(b.name)
          );
          const updates = budgetsToUpdate.map((budget) => ({
            key: budget.id,
            changes: { totalAmount: budget.totalAmount + distributionAmount },
          }));
          if (updates.length > 0) {
            await db.budgets.bulkUpdate(updates);
          }
        }
      }

      onClose();
    } catch (error) {
      console.error(`Failed to ${type}:`, error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        {/* ... (JSX ของ Modal - เหมือนเดิม) ... */}
        <div style={styles.modalHeader}>
          <h3>{title}</h3>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalForm}>
          <p
            style={{
              textAlign: "center",
              fontSize: "1.5rem",
              margin: "10px 0",
            }}
          >
            จำนวน:{" "}
            <strong style={{ color: isPaying ? "#ffaaaa" : "#64ff64" }}>
              {item.amount.toLocaleString()}
            </strong>
          </p>
          <div style={styles.inputGroup}>
            <label>
              {isPaying ? "เลือกบัญชีที่จะใช้จ่าย" : "เลือกบัญชีที่จะรับเงิน"}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              style={styles.select}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (คงเหลือ: {acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {!isPaying && (
            <div style={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="distributeIncome"
                checked={distributeIncome}
                onChange={(e) => setDistributeIncome(e.target.checked)}
              />
              <label htmlFor="distributeIncome" style={styles.checkboxLabel}>
                แบ่ง 10% (x5) เข้าเพดานงบประมาณ
              </label>
            </div>
          )}

          <button
            onClick={handleSubmit}
            style={isPaying ? styles.txButtonRed : styles.txButtonGreen}
          >
            {isPaying ? "ยืนยันการจ่าย" : "ยืนยันการรับเงิน"}
          </button>
        </div>
      </div>
    </div>
  );
}

// === CSS Styles (เหมือนเดิม) ===
const styles = {
  // ... (CSS ทั้งหมดเหมือนเดิม)
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  scrollArea: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "10px",
    paddingBottom: "90px",
  },
  stickyFooter: {
    flexShrink: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    padding: "10px",
    backgroundColor: "#1a1a1a",
    borderTop: "1px solid #444",
  },
  firstTimeSetup: {
    padding: "30px 15px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
  },
  section: {
    backgroundColor: "#2a2a2a",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.2rem",
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "#64cfff",
    cursor: "pointer",
    padding: "5px",
  },
  accountItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 5px",
    borderBottom: "1px solid #333",
  },
  accountInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  accountBalance: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "1.1rem",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    padding: "5px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 5px 0 5px",
    fontSize: "1.1rem",
    color: "#64ff64",
  },
  dailySpendBox: {
    marginTop: "15px",
    paddingTop: "10px",
    borderTop: "1px solid #444",
  },
  dailySpendHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
    color: "#aaa",
    marginBottom: "5px",
  },
  infoButton: {
    background: "none",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    padding: 0,
    display: "flex",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  emptyText: {
    color: "#888",
    textAlign: "center",
    padding: "10px",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  txButtonGreen: {
    background: "#3a8b3a",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "8px",
    fontSize: "1.1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  txButtonRed: {
    background: "#c0392b",
    color: "white",
    border: "none",
    padding: "15px",
    borderRadius: "8px",
    fontSize: "1.1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  summaryButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px",
    background: "#646cff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    textDecoration: "none",
    marginTop: "15px",
    boxSizing: "border-box",
  },
  dueList: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    flexGrow: 1,
  },
  dueItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    backgroundColor: "#333",
    borderRadius: "5px",
  },
  dueInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
    gap: "2px",
    maxWidth: "50%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  dueActions: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexShrink: 0,
  },
  iconButtonSmall: {
    background: "none",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    padding: "5px",
  },
  deleteButtonSmall: {
    background: "none",
    border: "none",
    color: "#aaa",
    cursor: "pointer",
    padding: "5px",
  },
  payButtonGreen: {
    background: "#3a8b3a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
  },
  payButtonRed: {
    background: "#8b3a3a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "8px",
    cursor: "pointer",
    display: "flex",
  },
  totalRowSmall: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 5px 0 5px",
    fontSize: "0.9rem",
    borderTop: "1px solid #444",
    marginTop: "10px",
  },
  budgetGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  budgetBox: {
    backgroundColor: "#333",
    borderRadius: "8px",
    padding: "10px",
  },
  budgetHeader: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  hpBarOuter: {
    width: "100%",
    height: "10px",
    backgroundColor: "#1a1a1a",
    borderRadius: "5px",
    marginTop: "8px",
    overflow: "hidden",
  },
  hpBarInner: {
    height: "100%",
    backgroundColor: "#64cfff",
    borderRadius: "5px",
    transition: "width 0.3s",
  },
  hpText: {
    fontSize: "0.8rem",
    color: "#aaa",
    textAlign: "center",
    display: "block",
    marginTop: "2px",
  },
  budgetActions: {
    display: "flex",
    gap: "5px",
    marginTop: "8px",
  },
  budgetButtonRed: {
    background: "#8b3a3a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "5px",
    flex: 1,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  budgetButtonGreen: {
    background: "#3a8b3a",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "5px",
    flex: 1,
    fontSize: "0.8rem",
    cursor: "pointer",
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
    zIndex: 201,
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
  helpText: {
    fontSize: "0.9rem",
    color: "#aaa",
    margin: "-10px 0 0 0",
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
  "input:disabled": {
    backgroundColor: "#444",
    color: "#999",
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
  budgetManagerList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
  },
  budgetItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#333",
    borderRadius: "5px",
  },
  budgetInputBox: {
    display: "flex",
    gap: "5px",
    flexGrow: 1,
  },
  budgetAdminButtons: {
    display: "flex",
    gap: "8px",
  },
  hr: {
    border: "none",
    borderTop: "1px solid #444",
    margin: "15px 0",
  },
  editButton: {
    background: "none",
    border: "1px solid #888",
    color: "#888",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "5px",
    display: "flex",
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
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "-5px",
    marginBottom: "5px",
  },
  checkboxLabel: {
    fontSize: "0.9rem",
    color: "#aaa",
  },
};

export default Finance;
