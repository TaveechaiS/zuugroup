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
  "sidebar.group.main": { th: "หลัก", en: "Main" },
  "sidebar.group.docs": { th: "เอกสาร", en: "Documents" },
  "sidebar.group.master": { th: "ข้อมูลหลัก", en: "Master Data" },
  "sidebar.group.org": { th: "องค์กร", en: "Organization" },
  "sidebar.group.system": { th: "ระบบ", en: "System" },
  "sidebar.group.pending": { th: "รออนุมัติ", en: "Pending" },
  "sidebar.group.create": { th: "สร้างเอกสาร", en: "Create" },
  "sidebar.group.team": { th: "ทีม", en: "Team" },
  "sidebar.group.all_data": { th: "ข้อมูลทั้งหมด", en: "All Data" },

  // Sidebar — nav items
  "sidebar.dashboard": { th: "แดชบอร์ด", en: "Dashboard" },
  "sidebar.reports": { th: "รายงาน", en: "Reports" },
  "sidebar.reports_team": { th: "รายงานทีม", en: "Team Reports" },
  "sidebar.customer_requests": { th: "คำขอเพิ่มลูกค้า", en: "Customer Requests" },
  "sidebar.orders": { th: "คำสั่งซื้อ", en: "Orders" },
  "sidebar.orders_pending": { th: "คำสั่งซื้อรอตรวจสอบ", en: "Orders Pending Review" },
  "sidebar.quotations_pending": { th: "ใบเสนอราคารออนุมัติ", en: "Quotations Pending" },
  "sidebar.manage_customers": { th: "จัดการลูกค้า", en: "Manage Customers" },
  "sidebar.manage_products": { th: "จัดการสินค้า", en: "Manage Products" },
  "sidebar.manage_users": { th: "จัดการผู้ใช้", en: "Manage Users" },
  "sidebar.manage_teams": { th: "จัดการทีม", en: "Manage Teams" },
  "sidebar.zones": { th: "เขตการขาย", en: "Sales Zones" },
  "sidebar.activity_logs": { th: "บันทึกการใช้งาน", en: "Activity Logs" },
  "sidebar.create_quotation": { th: "สร้างใบเสนอราคา", en: "Create Quotation" },
  "sidebar.create_order": { th: "สร้างคำสั่งซื้อ", en: "Create Order" },
  "sidebar.request_customer": { th: "ขอเพิ่มลูกค้า", en: "Request New Customer" },
  "sidebar.my_documents": { th: "เอกสารของฉัน", en: "My Documents" },
  "sidebar.team_documents": { th: "เอกสารทีม", en: "Team Documents" },
  "sidebar.info_customers": { th: "ข้อมูลลูกค้า", en: "Customers" },
  "sidebar.info_products": { th: "ข้อมูลสินค้า", en: "Products" },
  "sidebar.team_members": { th: "สมาชิกทีม", en: "Team Members" },
  "sidebar.all_customers": { th: "ลูกค้าทั้งหมด", en: "All Customers" },
  "sidebar.all_products": { th: "สินค้าทั้งหมด", en: "All Products" },
  "sidebar.all_users": { th: "ผู้ใช้ทั้งหมด", en: "All Users" },
  "sidebar.all_teams": { th: "ทีมทั้งหมด", en: "All Teams" },

  // Roles
  "role.admin": { th: "ผู้ดูแลระบบ", en: "Administrator" },
  "role.manager": { th: "ผู้จัดการทีม", en: "Team Manager" },
  "role.sales": { th: "พนักงานขาย", en: "Sales" },
  "role.cfo": { th: "ผู้บริหาร", en: "Executive" },

  // Sidebar — misc
  "sidebar.close_menu": { th: "ปิดเมนู", en: "Close menu" },
  "sidebar.new_count": { th: "ใหม่", en: "new" },

  // TopBar
  "topbar.notifications":        { th: "การแจ้งเตือน",          en: "Notifications" },
  "topbar.mark_all_read":        { th: "อ่านทั้งหมด",           en: "Mark all read" },
  "topbar.no_notifications":     { th: "ไม่มีการแจ้งเตือน",     en: "No notifications" },
  "topbar.click_to_view":        { th: "กดเพื่อดู →",           en: "Click to view →" },
  "topbar.change_language":      { th: "เปลี่ยนภาษา",           en: "Change language" },
  "topbar.user_menu":            { th: "เมนูผู้ใช้",            en: "User menu" },
  "topbar.team":                 { th: "ทีม",                   en: "Team" },
  "topbar.logout":               { th: "ออกจากระบบ",            en: "Log out" },
  "topbar.expand_menu":          { th: "ขยายเมนู",              en: "Expand menu" },
  "topbar.collapse_menu":        { th: "ย่อเมนู",               en: "Collapse menu" },
  "topbar.open_menu":            { th: "เปิดเมนู",              en: "Open menu" },

  // Common table / list controls
  "common.search":               { th: "ค้นหา...",              en: "Search..." },
  "common.search_customers":     { th: "ค้นหาลูกค้า...",        en: "Search customers..." },
  "common.search_products":      { th: "ค้นหาสินค้า...",        en: "Search products..." },
  "common.records":              { th: "รายการ",                en: "records" },
  "common.actions":              { th: "จัดการ",                en: "Actions" },
  "common.view_details":         { th: "ดูรายละเอียด",          en: "View" },
  "common.no_data":              { th: "ไม่พบข้อมูล",           en: "No data" },
  "common.close":                { th: "ปิด",                   en: "Close" },
  "common.cancel":               { th: "ยกเลิก",                en: "Cancel" },
  "common.save":                 { th: "บันทึก",                en: "Save" },
  "common.saving":               { th: "บันทึก...",             en: "Saving..." },
  "common.saving_dots":          { th: "กำลังบันทึก…",           en: "Saving…" },
  "common.edit":                 { th: "แก้ไข",                 en: "Edit" },
  "common.delete":               { th: "ลบ",                    en: "Delete" },
  "common.add":                  { th: "เพิ่ม",                 en: "Add" },
  "common.confirm":              { th: "ยืนยัน",                en: "Confirm" },
  "common.optional":             { th: "-- ไม่ระบุ --",         en: "-- Optional --" },
  "common.required_mark":        { th: "*",                     en: "*" },
  "common.showing":              { th: "แสดง",                  en: "Showing" },
  "common.of":                   { th: "จาก",                   en: "of" },
  "common.all_categories":       { th: "หมวดหมู่ทั้งหมด",       en: "All categories" },

  // Customers table
  "customers.col.company":       { th: "ชื่อบริษัท",            en: "Company" },
  "customers.col.contact":       { th: "ผู้ติดต่อ",             en: "Contact" },
  "customers.col.phone":         { th: "เบอร์",                 en: "Phone" },
  "customers.col.address":       { th: "ที่อยู่",               en: "Address" },
  "customers.detail.added_at":   { th: "เพิ่มเมื่อ",            en: "Added on" },
  "customers.detail.address":    { th: "ที่อยู่",               en: "Address" },
  "customers.detail.contact":    { th: "ผู้ติดต่อ",             en: "Contact" },
  "customers.detail.phone":      { th: "เบอร์โทร",              en: "Phone" },
  "customers.detail.email":      { th: "อีเมล",                 en: "Email" },
  "customers.detail.drug_lic":   { th: "เลขอนุญาตขายยา",        en: "Drug License No." },
  "customers.detail.docs":       { th: "เอกสารและรูปภาพ",       en: "Documents & Images" },
  "customers.detail.img_location":  { th: "รูปสถานที่",         en: "Location Photo" },
  "customers.detail.img_drug":      { th: "ใบอนุญาตขายยา",      en: "Drug License" },
  "customers.detail.img_hospital":  { th: "ใบอนุญาตสถานพยาบาล", en: "Hospital License" },

  // Customer form
  "cf.company_info":             { th: "ข้อมูลบริษัท",          en: "Company Info" },
  "cf.tax_license_info":         { th: "ข้อมูลภาษีและใบอนุญาต",  en: "Tax & License Info" },
  "cf.images_docs":              { th: "รูปภาพและเอกสาร",       en: "Images & Documents" },
  "cf.upload_hint":              { th: "อัพโหลดรูปจากเครื่อง (ไม่เกิน 2MB ต่อรูป)", en: "Upload from device (max 2MB each)" },
  "cf.customer_code":            { th: "รหัสลูกค้า",            en: "Customer Code" },
  "cf.auto_gen_hint":            { th: "ปล่อยว่างเพื่อ auto-gen", en: "Leave empty to auto-generate" },
  "cf.zone":                     { th: "เขตการขาย",             en: "Sales Zone" },
  "cf.company_name":             { th: "ชื่อบริษัท",            en: "Company Name" },
  "cf.address":                  { th: "ที่อยู่",               en: "Address" },
  "cf.contact_name":             { th: "ชื่อผู้ติดต่อ",         en: "Contact Name" },
  "cf.phone":                    { th: "เบอร์โทรศัพท์",         en: "Phone" },
  "cf.email":                    { th: "อีเมล",                 en: "Email" },
  "cf.has_tax_id":               { th: "มีเลขผู้เสียภาษีหรือไม่?", en: "Has Tax ID?" },
  "cf.has":                      { th: "มี",                    en: "Yes" },
  "cf.no":                       { th: "ไม่มี",                 en: "No" },
  "cf.tax_id":                   { th: "เลขประจำตัวผู้เสียภาษี", en: "Tax ID Number" },
  "cf.drug_license_no":          { th: "เลขที่อนุญาตขายยา",      en: "Drug License No." },
  "cf.upload":                   { th: "อัพโหลดรูป",             en: "Upload image" },
  "cf.file_too_big":             { th: "ไฟล์ใหญ่เกิน 2MB",       en: "File exceeds 2MB" },
  "cf.save_failed":              { th: "บันทึกไม่สำเร็จ",        en: "Save failed" },
  "cf.request_failed":           { th: "ส่งคำขอไม่สำเร็จ",      en: "Request failed" },
  "cf.send_request":             { th: "ส่งคำขอ",               en: "Send request" },
  "cf.created_ok":               { th: "เพิ่มลูกค้าเรียบร้อย",   en: "Customer added" },
  "cf.updated_ok":                { th: "แก้ไขเรียบร้อย",       en: "Updated" },
  "cf.requested_ok":             { th: "ส่งคำขอเรียบร้อย รอผู้ดูแลตรวจสอบ", en: "Request sent, awaiting admin review" },
  "cf.img_location":             { th: "รูปสถานที่",            en: "Location Photo" },
  "cf.img_drug":                 { th: "ใบอนุญาตขายยา",         en: "Drug License" },
  "cf.img_hospital":             { th: "ใบอนุญาตสถานพยาบาล",    en: "Hospital License" },
  "cf.placeholder_tax":          { th: "เช่น 0105560001234",     en: "e.g. 0105560001234" },

  // Products table
  "products.col.code":           { th: "รหัส",                  en: "Code" },
  "products.col.name":           { th: "ชื่อสินค้า",            en: "Product Name" },
  "products.col.category":       { th: "หมวดหมู่",              en: "Category" },
  "products.col.stock":          { th: "คงเหลือ",               en: "Stock" },
  "products.col.price":          { th: "ราคา/หน่วย",            en: "Unit Price" },
  "products.col.unit":           { th: "หน่วย",                 en: "Unit" },
  "products.col.status":         { th: "สถานะ",                 en: "Status" },
  "products.status.available":   { th: "พร้อมขาย",              en: "Available" },
  "products.status.unavailable": { th: "ไม่พร้อมขาย",           en: "Unavailable" },
  "products.no_image":           { th: "ไม่มีรูปสินค้า",        en: "No product image" },
  "products.no_category":        { th: "ไม่ระบุหมวด",           en: "Uncategorized" },
  "products.stock_left":         { th: "คงเหลือในสต๊อก",        en: "Stock Remaining" },
  "products.sale_price_per":     { th: "ราคาขายต่อหน่วย",       en: "Sale Price / Unit" },
  "products.unit_label":         { th: "หน่วย",                 en: "unit" },
  "products.low_stock":          { th: "⚠ ใกล้หมด",             en: "⚠ Low stock" },
  "products.out_of_stock":       { th: "หมดสต๊อก",              en: "Out of stock" },
  "products.lot_dates":          { th: "ข้อมูลล็อต / วันที่",   en: "Lot / Dates" },
  "products.lot_no":             { th: "เลขล็อต",               en: "Lot No." },
  "products.mfg_date":           { th: "วันผลิต",               en: "Mfg. Date" },
  "products.exp_date":           { th: "วันหมดอายุ",            en: "Exp. Date" },
  "products.updated_at":         { th: "อัปเดตล่าสุด",          en: "Last updated" },

  // Zones
  "zones.title":                 { th: "เขตการขาย",             en: "Sales Zones" },
  "zones.add":                   { th: "เพิ่มเขต",              en: "Add Zone" },
  "zones.add_new":               { th: "เพิ่มเขตการขายใหม่",    en: "Add New Zone" },
  "zones.edit":                  { th: "แก้ไขเขตการขาย",        en: "Edit Sales Zone" },
  "zones.col.code":              { th: "รหัส",                  en: "Code" },
  "zones.col.name":              { th: "ชื่อเขต",               en: "Zone Name" },
  "zones.col.province":          { th: "จังหวัด",               en: "Province" },
  "zones.col.region":            { th: "ภาค",                   en: "Region" },
  "zones.empty":                 { th: "ยังไม่มีเขตการขาย — กด \"เพิ่มเขต\" เพื่อสร้าง", en: "No sales zones — click \"Add Zone\" to create" },
  "zones.field.code":            { th: "รหัสเขต",               en: "Zone Code" },
  "zones.field.name":            { th: "ชื่อเขต",               en: "Zone Name" },
  "zones.field.province":        { th: "จังหวัด",               en: "Province" },
  "zones.field.region":          { th: "ภาค",                   en: "Region" },
  "zones.field.description":     { th: "คำอธิบาย",              en: "Description" },
  "zones.placeholder.code":      { th: "เช่น BKK, CNX, S-01",   en: "e.g. BKK, CNX, S-01" },
  "zones.placeholder.name":      { th: "เช่น กรุงเทพและปริมณฑล", en: "e.g. Bangkok & Perimeter" },
  "zones.placeholder.province":  { th: "เช่น กรุงเทพมหานคร",    en: "e.g. Bangkok" },
  "zones.confirm_delete":        { th: "ลบเขตการขาย \"{code} - {name}\"?", en: "Delete sales zone \"{code} - {name}\"?" },
  "zones.region.central":        { th: "ภาคกลาง",               en: "Central" },
  "zones.region.north":          { th: "ภาคเหนือ",              en: "Northern" },
  "zones.region.south":          { th: "ภาคใต้",                en: "Southern" },
  "zones.region.east":           { th: "ภาคตะวันออก",           en: "Eastern" },
  "zones.region.northeast":      { th: "ภาคตะวันออกเฉียงเหนือ", en: "Northeastern" },
  "zones.region.west":           { th: "ภาคตะวันตก",            en: "Western" },

  // Common
  "common.loading":              { th: "กำลังโหลด...",          en: "Loading..." },
  "common.view_all":             { th: "ดูทั้งหมด",             en: "View all" },
  "common.no_data_generic":      { th: "ยังไม่มีข้อมูล",         en: "No data" },

  // Dashboard — titles
  "dashboard.title":             { th: "แดชบอร์ด",              en: "Dashboard" },
  "dashboard.title_admin":       { th: "แดชบอร์ด - ผู้ดูแลระบบ", en: "Dashboard - Administrator" },
  "dashboard.title_manager":     { th: "แดชบอร์ด - ผู้จัดการทีม", en: "Dashboard - Team Manager" },
  "dashboard.title_cfo":         { th: "แดชบอร์ด - ผู้บริหาร",    en: "Dashboard - Executive" },
  "dashboard.no_team":           { th: "คุณยังไม่ได้ถูกมอบหมายให้อยู่ในทีมใด กรุณาติดต่อผู้ดูแลระบบ", en: "You haven't been assigned to a team. Please contact your administrator." },

  // Dashboard — stat cards
  "dashboard.stat.total_users":     { th: "ผู้ใช้ทั้งหมด",      en: "Total Users" },
  "dashboard.stat.customers":       { th: "ลูกค้า",             en: "Customers" },
  "dashboard.stat.products":        { th: "สินค้า",             en: "Products" },
  "dashboard.stat.total_teams":     { th: "ทีมทั้งหมด",         en: "Total Teams" },
  "dashboard.stat.total_orders":    { th: "คำสั่งซื้อทั้งหมด",   en: "Total Orders" },
  "dashboard.stat.pending":         { th: "รอดำเนินการ",         en: "Pending" },
  "dashboard.stat.customer_reqs":   { th: "คำขอเพิ่มลูกค้า",     en: "Customer Requests" },
  "dashboard.stat.low_stock":       { th: "สินค้าใกล้หมด",       en: "Low Stock" },
  "dashboard.stat.total_quotations":{ th: "ใบเสนอราคาทั้งหมด",   en: "Total Quotations" },
  "dashboard.stat.pending_approval":{ th: "รออนุมัติ",           en: "Pending Approval" },
  "dashboard.stat.pending_review":  { th: "รอตรวจสอบ",           en: "Pending Review" },
  "dashboard.stat.rejected":        { th: "ถูกปฏิเสธ",           en: "Rejected" },
  "dashboard.stat.team_sales":      { th: "ยอดขายทีม",           en: "Team Sales" },
  "dashboard.stat.total_sales":     { th: "ยอดขายรวม",           en: "Total Sales" },
  "dashboard.stat.orders":          { th: "คำสั่งซื้อ",         en: "Orders" },
  "dashboard.stat.quotations":      { th: "ใบเสนอราคา",         en: "Quotations" },
  "dashboard.stat.customer_count":  { th: "จำนวนลูกค้า",         en: "Customer Count" },

  // Dashboard — chart titles + tooltips
  "dashboard.chart.monthly_revenue":  { th: "ยอดขายรายเดือน (6 เดือนล่าสุด)",   en: "Monthly Revenue (Last 6 Months)" },
  "dashboard.chart.monthly_orders":   { th: "จำนวนคำสั่งซื้อรายเดือน",          en: "Monthly Order Count" },
  "dashboard.chart.order_status":     { th: "สถานะคำสั่งซื้อ",                 en: "Order Status" },
  "dashboard.chart.team_sales":       { th: "ยอดขายของทีม (6 เดือนล่าสุด)",     en: "Team Sales (Last 6 Months)" },
  "dashboard.chart.quotation_status": { th: "สถานะใบเสนอราคา",                 en: "Quotation Status" },
  "dashboard.chart.tooltip_sales":    { th: "ยอดขาย",                         en: "Sales" },
  "dashboard.chart.tooltip_orders":   { th: "คำสั่งซื้อ",                     en: "Orders" },

  // Dashboard — sections
  "dashboard.section.recent_orders":     { th: "คำสั่งซื้อล่าสุด",       en: "Recent Orders" },
  "dashboard.section.low_stock":         { th: "สินค้าใกล้หมด",          en: "Low Stock Products" },
  "dashboard.section.top_products":      { th: "สินค้าขายดี Top 5",      en: "Top 5 Products" },
  "dashboard.section.top_customers":     { th: "ลูกค้าที่ซื้อสูงสุด Top 5", en: "Top 5 Customers" },
  "dashboard.section.team_performance":  { th: "ผลงานแต่ละทีม",          en: "Team Performance" },
  "dashboard.team_hint":                 { th: "ดูรายงานละเอียดในหน้ารายงาน", en: "See details in Reports" },

  // Dashboard — empty states
  "dashboard.empty.no_orders":      { th: "ยังไม่มีคำสั่งซื้อ",   en: "No orders yet" },
  "dashboard.empty.all_in_stock":   { th: "สินค้าทุกชิ้นมีพอ",    en: "All products in stock" },
  "dashboard.empty.no_sales":       { th: "ยังไม่มียอดขาย",       en: "No sales yet" },
  "dashboard.empty.no_quotations":  { th: "ยังไม่มีใบเสนอราคา",   en: "No quotations yet" },

  // Dashboard — stock indicators
  "dashboard.stock.out":            { th: "หมด",                 en: "Out" },
  "dashboard.stock.left":           { th: "เหลือ",               en: "Left" },

  // Order/Quotation statuses
  "status.draft":            { th: "ร่าง",         en: "Draft" },
  "status.pending_review":   { th: "รอตรวจสอบ",   en: "Pending Review" },
  "status.processing":       { th: "ดำเนินการ",   en: "Processing" },
  "status.completed":        { th: "เสร็จสิ้น",   en: "Completed" },
  "status.rejected":         { th: "ไม่ผ่าน",     en: "Rejected" },
  "status.pending":          { th: "รออนุมัติ",   en: "Pending" },
  "status.approved":         { th: "อนุมัติ",     en: "Approved" },
  "status.cancelled":        { th: "ยกเลิก",      en: "Cancelled" },

  // Months (short)
  "month.jan": { th: "ม.ค.", en: "Jan" },
  "month.feb": { th: "ก.พ.", en: "Feb" },
  "month.mar": { th: "มี.ค.", en: "Mar" },
  "month.apr": { th: "เม.ย.", en: "Apr" },
  "month.may": { th: "พ.ค.", en: "May" },
  "month.jun": { th: "มิ.ย.", en: "Jun" },
  "month.jul": { th: "ก.ค.", en: "Jul" },
  "month.aug": { th: "ส.ค.", en: "Aug" },
  "month.sep": { th: "ก.ย.", en: "Sep" },
  "month.oct": { th: "ต.ค.", en: "Oct" },
  "month.nov": { th: "พ.ย.", en: "Nov" },
  "month.dec": { th: "ธ.ค.", en: "Dec" },
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
    } catch { }
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
