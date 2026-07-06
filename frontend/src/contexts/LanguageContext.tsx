'use client';

import React, { createContext, useContext, useEffect, useState } from "react";

type Lang = "th" | "en";

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const translations: Record<string, { th: string; en: string }> = {
  "hello": { th: "สวัสดี", en: "Hello" },

  // Sidebar — group headers
  "sidebar.group.main":       { th: "หลัก",         en: "Main" },
  "sidebar.group.docs":       { th: "เอกสาร",       en: "Documents" },
  "sidebar.group.master":     { th: "ข้อมูลหลัก",   en: "Master Data" },
  "sidebar.group.org":        { th: "องค์กร",       en: "Organization" },
  "sidebar.group.system":     { th: "ระบบ",         en: "System" },
  "sidebar.group.pending":    { th: "รออนุมัติ",    en: "Pending" },
  "sidebar.group.create":     { th: "สร้างเอกสาร",  en: "Create" },
  "sidebar.group.team":       { th: "ทีม",          en: "Team" },
  "sidebar.group.all_data":   { th: "ข้อมูลทั้งหมด", en: "All Data" },

  // Sidebar — nav items
  "sidebar.dashboard":         { th: "แดชบอร์ด",              en: "Dashboard" },
  "sidebar.reports":           { th: "รายงาน",                en: "Reports" },
  "sidebar.reports_team":      { th: "รายงานทีม",             en: "Team Reports" },
  "sidebar.customer_requests": { th: "คำขอเพิ่มลูกค้า",       en: "Customer Requests" },
  "sidebar.orders":            { th: "คำสั่งซื้อ",            en: "Orders" },
  "sidebar.orders_pending":    { th: "คำสั่งซื้อรอตรวจสอบ",  en: "Orders Pending Review" },
  "sidebar.quotations_pending":{ th: "ใบเสนอราคารออนุมัติ",   en: "Quotations Pending" },
  "sidebar.manage_customers":  { th: "จัดการลูกค้า",          en: "Manage Customers" },
  "sidebar.manage_products":   { th: "จัดการสินค้า",          en: "Manage Products" },
  "sidebar.manage_users":      { th: "จัดการผู้ใช้",          en: "Manage Users" },
  "sidebar.manage_teams":      { th: "จัดการทีม",             en: "Manage Teams" },
  "sidebar.zones":             { th: "เขตการขาย",             en: "Sales Zones" },
  "sidebar.activity_logs":     { th: "บันทึกการใช้งาน",       en: "Activity Logs" },
  "sidebar.create_quotation":  { th: "สร้างใบเสนอราคา",       en: "Create Quotation" },
  "sidebar.create_order":      { th: "สร้างคำสั่งซื้อ",       en: "Create Order" },
  "sidebar.request_customer":  { th: "ขอเพิ่มลูกค้า",         en: "Request New Customer" },
  "sidebar.my_documents":      { th: "เอกสารของฉัน",          en: "My Documents" },
  "sidebar.team_documents":    { th: "เอกสารทีม",             en: "Team Documents" },
  "sidebar.info_customers":    { th: "ข้อมูลลูกค้า",          en: "Customers" },
  "sidebar.info_products":     { th: "ข้อมูลสินค้า",          en: "Products" },
  "sidebar.team_members":      { th: "สมาชิกทีม",             en: "Team Members" },
  "sidebar.all_customers":     { th: "ลูกค้าทั้งหมด",         en: "All Customers" },
  "sidebar.all_products":      { th: "สินค้าทั้งหมด",         en: "All Products" },
  "sidebar.all_users":         { th: "ผู้ใช้ทั้งหมด",         en: "All Users" },
  "sidebar.all_teams":         { th: "ทีมทั้งหมด",            en: "All Teams" },

  // Roles
  "role.admin":   { th: "ผู้ดูแลระบบ",  en: "Administrator" },
  "role.manager": { th: "ผู้จัดการทีม", en: "Team Manager" },
  "role.sales":   { th: "พนักงานขาย",   en: "Sales" },
  "role.cfo":     { th: "ผู้บริหาร",    en: "Executive" },

  // Sidebar — misc
  "sidebar.close_menu": { th: "ปิดเมนู", en: "Close menu" },
  "sidebar.new_count":  { th: "ใหม่",   en: "new" },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Always start with "th" so the server-rendered HTML and the initial client
  // render are identical (no hydration mismatch). After hydration we read
  // localStorage and switch to the user's saved language.
  const [lang, setLang] = useState<Lang>("th");

  useEffect(() => {
    // Read the saved language once, after the component mounts on the client.
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved && saved !== lang) {
      setLang(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
   }, [lang]);

  const t = (key: string) => {
    const entry = translations[key];
    if (entry) return lang === "th" ? entry.th : entry.en;
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export default LanguageContext;
