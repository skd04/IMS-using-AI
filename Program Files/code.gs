// ==========================================
// PAPER ADDA - GOOGLE APPS SCRIPT BACKEND
// ==========================================

// Apnar Ashol Sheet Er ID Ekhane Dewa Holo
const SPREADSHEET_ID = '14ARVMJZ8D7CZBm7eWRRp-CzgZDM8v3CmKbob7uC_Krc';

// Web App serve korar jonno
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Paper Adda Management')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// Backend theke shob data fetch korar jonno
function getAppData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 1. Stock Data fetch kora
    const stockSheet = ss.getSheetByName('Stock');
    if (!stockSheet) throw new Error("'Stock' sheet khuje pawa jayni!");
    const stockData = stockSheet.getDataRange().getValues();
    const stockList = [];
    
    if (stockData.length > 1) {
      for (let i = 1; i < stockData.length; i++) {
        let pId = stockData[i][0];
        // Empty ba deleted (ghost) row strict check
        if(pId && String(pId).trim() !== '') {
          stockList.push({
            productId: String(stockData[i][0]).trim(),
            category: stockData[i][2],
            name: stockData[i][3],
            costPrice: stockData[i][4],
            sellingPrice: stockData[i][5],
            unit: stockData[i][6],
            currentStock: stockData[i][7] // 8th column(H) theke asbe (index 7)
          });
        }
      }
    }

    // Active products er ID store korchi jate deleted stock er kono data count na hoy
    const validProductIds = new Set();
    stockList.forEach(s => validProductIds.add(s.productId));

    // 2. Purchases Data fetch kora
    const purchaseSheet = ss.getSheetByName('Purchases');
    if (!purchaseSheet) throw new Error("'Purchases' sheet khuje pawa jayni!");
    const purchaseData = purchaseSheet.getDataRange().getValues();
    const allPurchases = [];
    
    if (purchaseData.length > 1) {
      for (let i = 1; i < purchaseData.length; i++) {
        let entryId = purchaseData[i][0];
        // Empty ba deleted row gulo ignore korbe
        if(!entryId || String(entryId).trim() === '') continue;
        
        let productId = String(purchaseData[i][2]).trim();
        // Jodi stock a product na thake, tahole ei purchase ta completely ignore korbe
        if(!validProductIds.has(productId)) continue;
        
        let pDate = new Date(purchaseData[i][1]);
        if(isNaN(pDate)) continue;
        
        allPurchases.push({
          entryId: String(purchaseData[i][0]).trim(),
          date: Utilities.formatDate(pDate, Session.getScriptTimeZone(), "dd-MMM-yyyy"),
          rawDate: Utilities.formatDate(pDate, Session.getScriptTimeZone(), "yyyy-MM-dd"),
          productId: productId,
          name: purchaseData[i][3],
          qty: parseFloat(purchaseData[i][4]) || 0,
          unit: purchaseData[i][5],
          costPrice: parseFloat(purchaseData[i][6]) || 0,
          amount: parseFloat(purchaseData[i][7]) || 0
        });
      }
    }
    
    // 3. Sales Data fetch kora
    const salesSheet = ss.getSheetByName('Sales');
    if (!salesSheet) throw new Error("'Sales' sheet khuje pawa jayni!");
    const salesData = salesSheet.getDataRange().getValues();
    const recentSales = [];
    const allSales = [];
    
    let totalLifetimeSales = 0;
    let todaySales = 0;
    const todayStr = new Date().toDateString();

    if (salesData.length > 1) {
      for (let i = salesData.length - 1; i >= 1; i--) {
        let saleId = salesData[i][0];
        // Empty row ignore kora hocche
        if(!saleId || String(saleId).trim() === '') continue;
        
        let saleProdId = String(salesData[i][2]).trim();
        // Jodi stock a product na thake, tahole ei sale tao ignore korbe
        if(!validProductIds.has(saleProdId)) continue;
        
        let amount = parseFloat(salesData[i][8]) || 0;
        let saleDate = new Date(salesData[i][1]);
        if(isNaN(saleDate)) continue;

        let rawD = Utilities.formatDate(saleDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        let displayD = Utilities.formatDate(saleDate, Session.getScriptTimeZone(), "dd-MMM-yyyy");
        
        allSales.push({
          saleId: String(salesData[i][0]).trim(),
          date: displayD,
          rawDate: rawD,
          productId: saleProdId,
          category: salesData[i][3],
          name: salesData[i][4],
          qty: parseFloat(salesData[i][5]) || 0,
          unit: salesData[i][6],
          price: parseFloat(salesData[i][7]) || 0,
          amount: amount,
          customer: salesData[i][9] || 'Walk-in'
        });
        
        totalLifetimeSales += amount;
        if (saleDate.toDateString() === todayStr) {
          todaySales += amount;
        }

        if (recentSales.length < 50) {
          recentSales.push({
            saleId: String(salesData[i][0]).trim(),
            date: Utilities.formatDate(saleDate, Session.getScriptTimeZone(), "dd-MMM-yyyy HH:mm"),
            rawDate: rawD, 
            productId: saleProdId,
            category: salesData[i][3],
            name: salesData[i][4],
            qty: salesData[i][5],
            unit: salesData[i][6],
            price: parseFloat(salesData[i][7]) || 0,
            amount: amount,
            customer: salesData[i][9] || 'Walk-in',
            customerPhone: salesData[i][10] || '' 
          });
        }
      }
    }
    
    let totalLifetimePurchases = 0;
    for (let p of allPurchases) {
       totalLifetimePurchases += p.amount;
    }
    let calculatedNetProfit = totalLifetimeSales - totalLifetimePurchases;
    
    return {
      stockList: stockList,
      recentSales: recentSales,
      allSales: allSales,
      allPurchases: allPurchases,
      dashboard: {
        todaySales: todaySales,
        totalSales: totalLifetimeSales,
        netProfit: calculatedNetProfit
      }
    };
  } catch(error) {
    throw new Error(error.message);
  }
}

// Helper function: Robust data append jate kono crash na hoy ba loader atke na jay
function appendDataToSheet(sheet, rowData) {
  try {
    const maxRows = sheet.getMaxRows();
    const lastRow = sheet.getLastRow();
    let targetRow = lastRow + 1;
    
    if (lastRow > 0) {
      const colA = sheet.getRange(1, 1, lastRow, 1).getValues();
      for (let i = 0; i < colA.length; i++) {
        if (!colA[i][0] || String(colA[i][0]).trim() === "") {
          targetRow = i + 1; // Exact theke faka row khujbe
          break;
        }
      }
    } else {
      targetRow = 2; // Jodi sheet purapuri faka hoy tobe row 2 theke start korbe
    }
    
    // Jodi faka row khujte khujte sheet er limit periye jay tobe automatic row insert korbe
    if (targetRow > maxRows) {
      sheet.insertRowsAfter(maxRows, 1);
    }
    
    sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } catch(err) {
    throw new Error("Append Failed: " + err.message);
  }
}

// Notun sale process korar jonno
function processSale(saleData) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const salesSheet = ss.getSheetByName('Sales');
    const stockSheet = ss.getSheetByName('Stock');
    
    const stockRows = stockSheet.getDataRange().getValues();
    let currentAvailable = 0;
    let rowToUpdate = -1;
    
    for(let i=1; i<stockRows.length; i++){
      if(String(stockRows[i][0]).trim() === String(saleData.productId).trim()){
        currentAvailable = parseFloat(stockRows[i][7]) || 0;
        rowToUpdate = i + 1;
        break;
      }
    }
    
    if(currentAvailable < parseFloat(saleData.qty)){
      throw new Error(`Insufficient stock! Shudhumatro ${currentAvailable} ${saleData.unit} available ache.`);
    }

    const saleId = generateId(salesSheet, 'S', 0);
    const dateObj = new Date();
    const totalAmount = parseFloat(saleData.qty) * parseFloat(saleData.price);
    
    appendDataToSheet(salesSheet, [
      saleId,
      dateObj,
      saleData.productId,
      saleData.category,
      saleData.name,
      parseFloat(saleData.qty),
      saleData.unit,
      parseFloat(saleData.price),
      totalAmount,
      saleData.customerName,
      saleData.customerPhone
    ]);

    if(rowToUpdate > -1) {
      let newStock = currentAvailable - parseFloat(saleData.qty);
      stockSheet.getRange(rowToUpdate, 8).setValue(newStock);
    }
    
    return { success: true, saleId: saleId, date: Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "dd-MMM-yyyy") };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Notun purchase process korar jonno
function processPurchase(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const purchasesSheet = ss.getSheetByName('Purchases');
    const stockSheet = ss.getSheetByName('Stock');
    
    let productId = data.productId;
    const dateObj = new Date();
    const totalPurchaseAmount = parseFloat(data.qty) * parseFloat(data.costPrice);
    
    if (data.isNewProduct) {
      productId = generateId(stockSheet, 'P', 0);
      appendDataToSheet(stockSheet, [
        productId,
        dateObj,
        data.category,
        data.name,
        parseFloat(data.costPrice),
        parseFloat(data.sellingPrice),
        data.unit,
        parseFloat(data.qty),
      ]);
    } else {
      const stockRows = stockSheet.getDataRange().getValues();
      for(let i=1; i<stockRows.length; i++){
        if(String(stockRows[i][0]).trim() === String(productId).trim()){
           stockSheet.getRange(i+1, 5).setValue(parseFloat(data.costPrice));
           stockSheet.getRange(i+1, 6).setValue(parseFloat(data.sellingPrice));
           
           let currentStock = parseFloat(stockRows[i][7]) || 0; 
           stockSheet.getRange(i+1, 8).setValue(currentStock + parseFloat(data.qty));
           break;
        }
      }
    }

    const entryId = generateId(purchasesSheet, 'E', 0);
    
    appendDataToSheet(purchasesSheet, [
      entryId,
      dateObj,
      productId,
      data.name,
      parseFloat(data.qty),
      data.unit,
      parseFloat(data.costPrice),
      totalPurchaseAmount
    ]);
    
    return { success: true, entryId: entryId };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Stock edit korar jonno
function updateStockItem(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const stockSheet = ss.getSheetByName('Stock');
    const salesSheet = ss.getSheetByName('Sales');
    const purchasesSheet = ss.getSheetByName('Purchases');
    const rows = stockSheet.getDataRange().getValues();
    let updated = false;

    for(let i=1; i<rows.length; i++) {
      if(String(rows[i][0]).trim() === String(data.productId).trim()) {
        const rowNum = i + 1;
        const timestamp = new Date(); 

        stockSheet.getRange(rowNum, 2).setValue(timestamp);
        stockSheet.getRange(rowNum, 3).setValue(data.category);
        stockSheet.getRange(rowNum, 4).setValue(data.name);
        stockSheet.getRange(rowNum, 5).setValue(parseFloat(data.costPrice));
        stockSheet.getRange(rowNum, 6).setValue(parseFloat(data.sellingPrice));
        stockSheet.getRange(rowNum, 7).setValue(data.unit);
        stockSheet.getRange(rowNum, 8).setValue(parseFloat(data.currentStock));

        updated = true;
        break;
      }
    }
    
    if (!updated) throw new Error("Product khuje pawa jayni!");

    // Cascade update unit in Sales Sheet (Unit is in column 7 / G)
    if (salesSheet) {
      const salesRows = salesSheet.getDataRange().getValues();
      for(let i=1; i<salesRows.length; i++) {
        if(String(salesRows[i][2]).trim() === String(data.productId).trim()) {
          salesSheet.getRange(i+1, 7).setValue(data.unit);
        }
      }
    }

    // Cascade update unit in Purchases Sheet (Unit is in column 6 / F)
    if (purchasesSheet) {
      const purRows = purchasesSheet.getDataRange().getValues();
      for(let i=1; i<purRows.length; i++) {
        if(String(purRows[i][2]).trim() === String(data.productId).trim()) {
          purchasesSheet.getRange(i+1, 6).setValue(data.unit);
        }
      }
    }

    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
}

// NEW: Notun Stock Item Add korar jonno (0 stock diye)
function addNewStockItem(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const stockSheet = ss.getSheetByName('Stock');
    const productId = generateId(stockSheet, 'P', 0);
    const dateObj = new Date();
    
    appendDataToSheet(stockSheet, [
      productId,
      dateObj,
      data.category,
      data.name,
      parseFloat(data.costPrice) || 0,
      parseFloat(data.sellingPrice) || 0,
      data.unit,
      0 // Notun add korle initial stock 0 hobe
    ]);
    
    return { success: true, productId: productId };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Stock Delete korar jonno (Updated to cascade delete sales & purchases strictly)
function deleteStockItem(productId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const stockSheet = ss.getSheetByName('Stock');
    const salesSheet = ss.getSheetByName('Sales');
    const purchasesSheet = ss.getSheetByName('Purchases');
    
    const targetId = String(productId).trim();

    // 1. Delete from Stock Sheet
    const stockRows = stockSheet.getDataRange().getValues();
    let deleted = false;
    for(let i = stockRows.length - 1; i >= 1; i--) {
      if(String(stockRows[i][0]).trim() === targetId) {
        stockSheet.deleteRow(i + 1);
        deleted = true;
      }
    }
    
    if (!deleted) throw new Error("Product khuje pawa jayni!");

    // 2. Cascade Delete: Delete related Sales
    if (salesSheet) {
      const salesRows = salesSheet.getDataRange().getValues();
      for(let i = salesRows.length - 1; i >= 1; i--) {
        if(String(salesRows[i][2]).trim() === targetId) { 
          salesSheet.deleteRow(i + 1);
        }
      }
    }

    // 3. Cascade Delete: Delete related Purchases
    if (purchasesSheet) {
      const purRows = purchasesSheet.getDataRange().getValues();
      for(let i = purRows.length - 1; i >= 1; i--) {
        if(String(purRows[i][2]).trim() === targetId) {
          purchasesSheet.deleteRow(i + 1);
        }
      }
    }

    return { success: true };
  } catch(error) {
    throw new Error(error.message);
  }
}

function generateId(sheet, prefix, idColumnIndex) {
  const data = sheet.getDataRange().getValues();
  let maxId = 0;
  
  for (let i = 1; i < data.length; i++) {
    let currentVal = data[i][idColumnIndex];
    if (currentVal && typeof currentVal === 'string') {
      let cleanVal = currentVal.trim();
      if(cleanVal.startsWith(prefix)) {
        let num = parseInt(cleanVal.substring(prefix.length), 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    }
  }
  
  maxId++;
  return prefix + maxId.toString().padStart(3, '0');
}

// Sale Edit korar jonno
function updateSaleItem(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const salesSheet = ss.getSheetByName('Sales');
    const stockSheet = ss.getSheetByName('Stock');
    const rows = salesSheet.getDataRange().getValues();

    for(let i=1; i<rows.length; i++) {
      if(String(rows[i][0]).trim() === String(data.saleId).trim()) {
        const rowNum = i + 1;
        const oldQty = parseFloat(rows[i][5]) || 0; 
        const newQty = parseFloat(data.qty);
        const productId = String(rows[i][2]).trim();
        
        salesSheet.getRange(rowNum, 6).setValue(newQty);
        salesSheet.getRange(rowNum, 8).setValue(parseFloat(data.price));
        salesSheet.getRange(rowNum, 9).setValue(newQty * parseFloat(data.price));
        salesSheet.getRange(rowNum, 10).setValue(data.customerName);
        salesSheet.getRange(rowNum, 11).setValue(data.customerPhone);
        
        const stockRows = stockSheet.getDataRange().getValues();
        for(let j=1; j<stockRows.length; j++){
           if(String(stockRows[j][0]).trim() === productId){
             let currentStock = parseFloat(stockRows[j][7]) || 0;
             let stockAdjustment = oldQty - newQty; 
             stockSheet.getRange(j+1, 8).setValue(currentStock + stockAdjustment);
             break;
           }
        }
        return { success: true };
      }
    }
    throw new Error("Sale khuje pawa jayni!");
  } catch (error) {
    throw new Error(error.message);
  }
}

// Sale Delete korar jonno
function deleteSaleItem(saleId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const salesSheet = ss.getSheetByName('Sales');
    const stockSheet = ss.getSheetByName('Stock');
    const rows = salesSheet.getDataRange().getValues();

    for(let i=1; i<rows.length; i++) {
      if(String(rows[i][0]).trim() === String(saleId).trim()) {
        const qtyToRestore = parseFloat(rows[i][5]) || 0;
        const productId = String(rows[i][2]).trim();
        
        salesSheet.deleteRow(i + 1);
        
        const stockRows = stockSheet.getDataRange().getValues();
        for(let j=1; j<stockRows.length; j++){
           if(String(stockRows[j][0]).trim() === productId){
             let currentStock = parseFloat(stockRows[j][7]) || 0;
             stockSheet.getRange(j+1, 8).setValue(currentStock + qtyToRestore);
             break;
           }
        }
        return { success: true };
      }
    }
    throw new Error("Sale khuje pawa jayni!");
  } catch (error) {
    throw new Error(error.message);
  }
}

// Purchase Edit korar jonno
function updatePurchaseItem(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const purchasesSheet = ss.getSheetByName('Purchases');
    const stockSheet = ss.getSheetByName('Stock');
    const rows = purchasesSheet.getDataRange().getValues();

    for(let i=1; i<rows.length; i++) {
      if(String(rows[i][0]).trim() === String(data.entryId).trim()) {
        const rowNum = i + 1;
        const oldQty = parseFloat(rows[i][4]) || 0;
        const newQty = parseFloat(data.qty);
        const productId = String(rows[i][2]).trim();
        
        purchasesSheet.getRange(rowNum, 5).setValue(newQty);
        purchasesSheet.getRange(rowNum, 7).setValue(parseFloat(data.costPrice));
        purchasesSheet.getRange(rowNum, 8).setValue(newQty * parseFloat(data.costPrice));
        
        const stockRows = stockSheet.getDataRange().getValues();
        for(let j=1; j<stockRows.length; j++){
           if(String(stockRows[j][0]).trim() === productId){
             let currentStock = parseFloat(stockRows[j][7]) || 0;
             let stockAdjustment = newQty - oldQty; 
             let newStock = currentStock + stockAdjustment;
             if(newStock < 0) newStock = 0; 
             stockSheet.getRange(j+1, 8).setValue(newStock);
             break;
           }
        }
        return { success: true };
      }
    }
    throw new Error("Purchase khuje pawa jayni!");
  } catch (error) {
    throw new Error(error.message);
  }
}

// Purchase Delete korar jonno
function deletePurchaseItem(entryId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const purchasesSheet = ss.getSheetByName('Purchases');
    const stockSheet = ss.getSheetByName('Stock');
    const rows = purchasesSheet.getDataRange().getValues();

    for(let i=1; i<rows.length; i++) {
      if(String(rows[i][0]).trim() === String(entryId).trim()) {
        const qtyToDeduct = parseFloat(rows[i][4]) || 0; 
        const productId = String(rows[i][2]).trim();
        
        purchasesSheet.deleteRow(i + 1);
        
        const stockRows = stockSheet.getDataRange().getValues();
        for(let j=1; j<stockRows.length; j++){
           if(String(stockRows[j][0]).trim() === productId){
             let currentStock = parseFloat(stockRows[j][7]) || 0;
             let newStock = currentStock - qtyToDeduct;
             if(newStock < 0) newStock = 0; 
             stockSheet.getRange(j+1, 8).setValue(newStock); 
             break;
           }
        }
        return { success: true };
      }
    }
    throw new Error("Purchase khuje pawa jayni!");
  } catch (error) {
    throw new Error(error.message);
  }
}