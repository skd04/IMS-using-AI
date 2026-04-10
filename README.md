# 📦 Paper Adda Management System (OS)

A lightweight, serverless Inventory & Sales Management Web App built for small businesses.  
It uses Google Apps Script as backend and Google Sheets as database, making it completely free and easy to manage.

---

## 🚀 Live Demo
🎥 Demo Video: (Add your video link here)

---

## ✨ Features

### 📊 Dashboard
- Lifetime, Yearly, and Custom Sales vs Purchases
- Net Profit tracking
- Low stock alerts
- Interactive charts (Chart.js)

### 🛒 Billing & Sales
- Fast billing system with smart product search
- One-click WhatsApp receipt sharing

### 📥 Purchase & Restock
- Add new products or restock existing ones
- Automatic average cost calculation

### 📦 Stock Management
- View, edit, delete products
- Supports units: PCS, KGS, PKT, GUZ, BOX

### 🔄 Transactions
- Manage recent sales and purchases
- Auto stock adjustment on edit/delete

### 📑 Reports & Export
- Filter by Financial Year or Custom Dates
- Export to:
  - PDF (jsPDF)
  - Excel/XLSX (SheetJS)

---

## 🛠️ Tech Stack

Frontend: HTML5, Tailwind CSS, Vanilla JavaScript  
Backend: Google Apps Script  
Database: Google Sheets  

Libraries:
- Tailwind CSS  
- Chart.js + Chartjs-plugin-datalabels  
- jsPDF + jsPDF-AutoTable  
- SheetJS  
- FontAwesome  

---

## 📁 Project Structure

```
Paper Adda OS
│
├── code.gs
├── index.html
├── output.png
```

---

## ⚙️ Setup & Installation

### 1. Google Sheets Setup
- Create a new Google Sheet
- Add sheets:
  - Stock
  - Purchases
  - Sales
  - InOut (optional)
- Copy Spreadsheet ID

---

### 2. Google Apps Script Setup
- Go to Extensions → Apps Script
- Create files:
  - code.gs
  - index.html
- Paste your code
- Update:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

---

### 3. Deploy Web App
- Click Deploy → New Deployment
- Select Web App
- Execute as: Me
- Access: Anyone (or restricted)
- Authorize and deploy
- Copy Web App URL

---

## 📊 Output Preview
Check output.png

---

## 🎯 Use Case
- Small shop owners  
- Retail businesses  
- Free inventory management system  
- Simple billing + stock + reporting  

---

## 📝 License
Free to use and modify

---

## ❤️ Author
Built for practical business use using Google Apps Script
