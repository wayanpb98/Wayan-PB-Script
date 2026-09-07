function sortTableByDateDescending() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getRange("D:H");
  range.sort({ column: 4, ascending: false });
}

function gasEstSale() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Read input values from B3:B6
  const [date, category, amountRaw] = sheet.getRange("B3:B6").getValues().flat();
  const amount = Number(amountRaw);

  // Read existing output values from D2:G
  const lastRow = sheet.getLastRow();
  const outputRange = sheet.getRange("D2:G" + lastRow);
  const outputValues = outputRange.getValues();

  // Get last estimation from top row (G2), default to 0
  const lastEst = outputValues.length > 0 && outputValues[0][3] !== "" ? Number(outputValues[0][3]) : 0;
  const newEst = lastEst - amount;

  // Shift existing output data down by one row if needed
  if (outputValues.length > 0) {
    sheet.getRange(3, 4, outputValues.length, 4).setValues(outputValues);
  }

  // Write new entry to D2:G2
  sheet.getRange("D2:G2").setValues([[date, category, amount, newEst]]);
}

function gasEstRefill() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Read input values from B14:B17
  const [date, category, amountRaw] = sheet.getRange("B14:B17").getValues().flat();
  const amount = Number(amountRaw);

  // Read existing output values from D2:G
  const lastRow = sheet.getLastRow();
  const outputValues = sheet.getRange("D2:G" + lastRow).getValues();

  // Shift existing output data down by one row if needed
  if (outputValues.length > 0) {
    sheet.getRange(3, 4, outputValues.length, 4).setValues(outputValues);
  }

  // Write new refill entry to D2:G2
  sheet.getRange("D2:G2").setValues([[date, category, amount, amount]]);
}

function submitTransaction() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Read form inputs from B2:B6
  const [date, description, debitAccount, creditAccount, amountRaw] = sheet.getRange("B2:B6").getValues().flat();
  const amount = Number(amountRaw);

  // Determine existing transaction count (excluding header)
  const lastRow = sheet.getLastRow();
  const transactionCount = lastRow > 1 ? lastRow - 1 : 0;

  // Shift existing transactions down by 2 rows if any
  if (transactionCount > 0) {
    const sourceRange = sheet.getRange(2, 4, transactionCount, 5); // D2:H
    sourceRange.copyTo(sheet.getRange(4, 4), { contentsOnly: true });
  }

  // Prepare new debit and credit rows
  const debitRow = [date, description, debitAccount, amount, ""];
  const creditRow = [date, description, creditAccount, "", amount];

  // Write new transaction at rows 2 and 3
  sheet.getRange(2, 4, 2, 5).setValues([debitRow, creditRow]);

  // Bi-Fast Check
  biFastCheck();  

  // Clear form inputs
  sheet.getRange("B2:B6").clearContent();

  // Sort Table Dates
  sortTableByDateDescending();  

  // Go to Balance Sheet & Record the Latest Input
  updateBalanceTable()
}

function updateBalanceTable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("BALANCE");
  
  // 1. Ensure the sheet exists to avoid errors
  if (!sheet) {
    Logger.log("Sheet 'BALANCE' not found.");
    return;
  }

  // 2. Shift the table AA:AB one row down
  // Note: This moves the existing data starting from row 1 downwards
  const rangeToShift = sheet.getRange("AA1:AB" + sheet.getLastRow());
  rangeToShift.moveTo(sheet.getRange("AA2"));

  // 3. Write the current date to AA1
  const today = new Date();
  sheet.getRange("AA1").setValue(today);

  // 4. Copy the value of I5 to AB1
  const sourceValue = sheet.getRange("I5").getValue();
  sheet.getRange("AB1").setValue(sourceValue);
  const range = sheet.getRange("AB:AB");
  range.setNumberFormat("#.##0,00");
}

function biFastCheck() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JURNAL"); // adjust sheet name if needed

  const b7 = sheet.getRange("B7").getValue();

  if (b7 === true) {
    // Fill out the O cells
    const b2 = sheet.getRange("B2").getValue();
    sheet.getRange("O2").setValue(b2);
    sheet.getRange("O3").setValue("Biaya Bi-Fast");
    sheet.getRange("O4").setValue("Biaya Transfer Bank");
    sheet.getRange("O5").setValue("Bank BRI");
    sheet.getRange("O6").setValue(2500);

    // Flip B7 to false
    sheet.getRange("B7").setValue(false);

    // Execute submitBiFast
    submitBiFast();
  } else {
    // Do nothing
    return;
  }  
}

function submitAllTransaction() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Loop starts at row 51
  let row = 51;

  while (true) {
    const description = sheet.getRange(`A${row}`).getValue();
    const amount = sheet.getRange(`B${row}`).getValue();

    // Stop if description cell is empty
    if (!description) break;

    // Inject into form fields
    sheet.getRange("B41").setValue(description); // Description
    sheet.getRange("B44").setValue(amount);      // Amount

    // Copy form fields to submission area
    const valuesToMove = sheet.getRange("B40:B44").getValues();
    sheet.getRange("B2:B6").setValues(valuesToMove);

    // Submit the transaction
    submitTransaction();

    // Clear B41, and B44 after submission
    sheet.getRange("B41").clearContent();
    sheet.getRange("B44").clearContent();

    // Clear processed row
    sheet.getRange(`A${row}:B${row}`).clearContent();

    row++;
  }
}

function submitGasPurchase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JURNAL");
  const pengisian = ss.getSheetByName("PENGISIAN GAS");

  // Copy B14:B18 → B2:B6
  const entry = sheet.getRange("B14:B18").getValues();
  sheet.getRange("B2:B6").setValues(entry);

  // Submit the journal entry
  submitTransaction();

  // Values from JURNAL
  const valB14 = sheet.getRange("B14").getValue();  // Date/time
  const valB18 = sheet.getRange("B18").getValue();  // Number
  const valB19 = sheet.getRange("B19").getValue();  // Value for S2
  const cogsprice = pengisian.getRange("P27").getValue(); // Value for COGS

  // Clear B14 (after reading its value)
  sheet.getRange("B14").clearContent();

  // --- Bottom-up shift of R:U starting at row 2 ---
  const startRow = 2;
  const startCol = 18; // R
  const numCols = 6;   // R..U

  const lastRow = pengisian.getLastRow();
  const ruValues = pengisian.getRange(startRow, startCol, Math.max(lastRow - startRow + 1, 1), numCols).getValues();

  let height = 0;
  for (let i = 0; i < ruValues.length; i++) {
    const hasData = ruValues[i].some(v => v !== "" && v !== null);
    if (!hasData) break;
    height++;
  }

  if (height > 0) {
    const bottomRow = startRow + height - 1;
    for (let r = bottomRow; r >= startRow; r--) {
      const src = pengisian.getRange(r, startCol, 1, numCols);
      const dst = pengisian.getRange(r + 1, startCol, 1, numCols);
      src.copyTo(dst, { contentsOnly: false });
    }
  }

  // Clear the now-vacant R2:U2 before writing new values
  pengisian.getRange("R2:U2").clearContent();

  // --- Write new values ---
  const nextDay = new Date(valB14);
  nextDay.setDate(nextDay.getDate() + 1); // add one day while keeping time
  pengisian.getRange("R2").setValue(nextDay);
  pengisian.getRange("S2").setValue(valB19);

  const roundedVal = Math.round(Number(valB18) / cogsprice);
  pengisian.getRange("T2").setValue(roundedVal);

  // Ensure U2 is empty
  pengisian.getRange("U2").clearContent();

  // Move to PENGISIAN GAS sheet
  ss.setActiveSheet(pengisian);
}

/**
 * Ensure we have a proper Date object from a sheet value.
 * Handles true Date, serial number, and dd/MM/yyyy HH:mm:ss strings.
 */
function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime()); // clone
  }
  if (typeof value === "number") {
    // Convert Google Sheets serial to JS Date
    // Serial 0 = 1899-12-30 in Sheets. Convert days → ms.
    const ms = (value - 25569) * 86400 * 1000; // 25569 = days between 1899-12-30 and 1970-01-01
    return new Date(ms);
  }
  if (typeof value === "string") {
    // Parse dd/MM/yyyy HH:mm:ss (e.g., 25/11/2025 9:12:39)
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (m) {
      const [_, dd, MM, yyyy, hh, mm, ss] = m;
      return new Date(
        Number(yyyy),
        Number(MM) - 1,
        Number(dd),
        Number(hh),
        Number(mm),
        Number(ss)
      );
    }
    // Fallback to native parser
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  // If all else fails, return current date to avoid 1970
  return new Date();
}


function submitBiFast() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("JURNAL");

  // Copy O2:O6 → B2:B6
  const entry = sheet.getRange("O2:O6").getValues();
  sheet.getRange("B2:B6").setValues(entry);

  // Submit the journal entry
  submitTransaction();

  // Clear O2
  sheet.getRange("O2").clearContent();
}

function submitCoffee() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("JURNAL");

  // Copy O14:O18 → B2:B6
  const entry = sheet.getRange("O14:O18").getValues();
  sheet.getRange("B2:B6").setValues(entry);

  // Submit the journal entry
  submitTransaction();

  // Clear O14 & O18
  sheet.getRange("O14").clearContent();
  sheet.getRange("O18").clearContent();

}

function submitExtraFuel() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("JURNAL");

  // Copy O26:O30 → B2:B6
  const entry = sheet.getRange("O26:O30").getValues();
  sheet.getRange("B2:B6").setValues(entry);

  // Submit the journal entry
  submitTransaction();

  // Copy O38:O42 → B2:B6
  const entry2 = sheet.getRange("O38:O42").getValues();
  sheet.getRange("B2:B6").setValues(entry2);

  // Submit the journal entry
  submitTransaction();

  // Clear 030
  sheet.getRange("O30").clearContent();

}

function submitCashSplit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("CASH FLOW");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Switch to JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // First entry: H7:H11 → B2:B6
  const firstEntry = sourceSheet.getRange("H7:H11").getValues();
  targetSheet.getRange("B2:B6").setValues(firstEntry);
  submitTransaction();

  // Second entry: M7:M11 → B2:B6
  const secondEntry = sourceSheet.getRange("M7:M11").getValues();
  targetSheet.getRange("B2:B6").setValues(secondEntry);
  submitTransaction();

  // Clear Date and Money
  sourceSheet.getRange("H7").clearContent();
  sourceSheet.getRange("H11").clearContent();
  sourceSheet.getRange("M7").clearContent();
  sourceSheet.getRange("M11").clearContent();

  // Return to CASH FLOW sheet
  ss.setActiveSheet(sourceSheet);
}

function submitCashDeposit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("CASH FLOW");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Copy H14:H18 → B2:B6
  const depositEntry = sourceSheet.getRange("H14:H18").getValues();
  targetSheet.getRange("B2:B6").setValues(depositEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();

  // Clear Date and Money
  sourceSheet.getRange("H14").clearContent();
  sourceSheet.getRange("H18").clearContent();

  // Return to CASH FLOW sheet
  ss.setActiveSheet(sourceSheet);
}

function submitCashReturn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("CASH FLOW");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Copy H21:H25 → B2:B6
  const depositEntry = sourceSheet.getRange("H21:H25").getValues();
  targetSheet.getRange("B2:B6").setValues(depositEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();
  
  // Clear Date and Money
  sourceSheet.getRange("H21").clearContent();
  sourceSheet.getRange("H25").clearContent();

  // Return to CASH FLOW sheet
  ss.setActiveSheet(sourceSheet);  
}

function submitCashLoss() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("CASH FLOW");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Copy H28:H32 → B2:B6
  const depositEntry = sourceSheet.getRange("H28:H32").getValues();
  targetSheet.getRange("B2:B6").setValues(depositEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();
  
  // Clear Date and Money
  sourceSheet.getRange("H28").clearContent();
  sourceSheet.getRange("H32").clearContent();
  
  // Return to CASH FLOW sheet
  ss.setActiveSheet(sourceSheet);  
}

function submitCashFound() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("CASH FLOW");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Copy H35:H39 → B2:B6
  const depositEntry = sourceSheet.getRange("H35:H39").getValues();
  targetSheet.getRange("B2:B6").setValues(depositEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();
  
  // Return to CASH FLOW sheet
  ss.setActiveSheet(sourceSheet);

  // Clear Date and Money
  sourceSheet.getRange("H35").clearContent();
  sourceSheet.getRange("H39").clearContent();
}

function submitCashExchange() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("CASH FLOW");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Copy H42:H46 → B2:B6
  const depositEntry = sourceSheet.getRange("H42:H46").getValues();
  targetSheet.getRange("B2:B6").setValues(depositEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();
  
  // Return to CASH FLOW sheet
  ss.setActiveSheet(sourceSheet);

  // Clear Date and Money
  sourceSheet.getRange("H42").clearContent();
  sourceSheet.getRange("H46").clearContent();
}

function submitEmpSalary() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("JURNAL");

  // Copy B27:B31 → B2:B6
  const entry = sheet.getRange("B27:B31").getValues();
  sheet.getRange("B2:B6").setValues(entry);

  // Submit the journal entry
  submitTransaction();
  
  // Clear B27
  sheet.getRange("B27").clearContent();
}

function submitGasRefillAuto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gasSheet = ss.getSheetByName("PENGISIAN GAS");
  const jurnalSheet = ss.getSheetByName("JURNAL");

  // Define both input blocks
  const values = gasSheet.getRange("P2:P6").getValues();

  // Switch to JURNAL sheet once
  ss.setActiveSheet(jurnalSheet);

  // Loop through each input block and submit
  jurnalSheet.getRange("B2:B6").setValues(values);
  submitTransaction();

  // Gas Stock Correction
  const finalBlock = gasSheet.getRange("P20:P24").getValues();
  jurnalSheet.getRange("B2:B6").setValues(finalBlock);
  submitTransaction();

  // Return to PENGISIAN GAS sheet
  ss.setActiveSheet(gasSheet);
}

function submitGasRefill() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pengisian Gas");

  // Collect inputs from B1:B10
  const inputs = sheet.getRange("B1:B10").getValues().flat();
  const newRow = [inputs]; // Wrap for setValues

  // Get existing data from D2:M
  const lastRow = sheet.getLastRow();
  const dataCount = lastRow > 1 ? lastRow - 1 : 0;

  if (dataCount > 0) {
    const existingData = sheet.getRange(2, 4, dataCount, 10).getValues();
    sheet.getRange(3, 4, dataCount, 10).setValues(existingData);
  }

  // Write new entry to D2:M2
  sheet.getRange(2, 4, 1, 10).setValues(newRow);

  // Clear input cells (excluding formula-driven ones)
  sheet.getRangeList(["B1", "B2", "B4", "B6"]).clearContent();

  // Trigger journal automation
  submitGasRefillAuto();
}

function submitGasRefillLast() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PENGISIAN GAS");

  // Collect inputs from B21:B30
  const rawValues = sheet.getRange("B21:B30").getValues().flat();

  // Round timestamp in B21 to nearest second
  if (rawValues[0] instanceof Date) {
    rawValues[0] = new Date(Math.round(rawValues[0].getTime() / 1000) * 1000);
  }

  // Distribute Gas Refill
  distributeGasRefill();

  // Correct the Distribution
  distributeGasCorrection();

  const newRow = [rawValues];

  // Get existing data from D2:M
  const lastRow = sheet.getLastRow();
  const dataCount = lastRow > 1 ? lastRow - 1 : 0;

  if (dataCount > 0) {
    const existingData = sheet.getRange(2, 4, dataCount, 10).getValues();
    sheet.getRange(3, 4, dataCount, 10).setValues(existingData);
  }

  // Write new entry to D2:M2
  sheet.getRange(2, 4, 1, 10).setValues(newRow);

  // Trigger journal automation
  submitGasRefillAuto();  
}

function distributeGasRefill() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PENGISIAN GAS");

  // Inputs
  const rawB21 = sheet.getRange("B21").getValue(); // date or string
  const valB24 = Number(sheet.getRange("B24").getValue()); // amount

  if (isNaN(valB24) || valB24 <= 0) {
    return; // nothing to do
  }

  // Parse B21 to a proper Date object
  const b21Date = toDate(rawB21);
  if (!b21Date) {
    return; // invalid date
  }

  // Normalize to date-only string
  const tz = ss.getSpreadsheetTimeZone();
  const targetDateStr = Utilities.formatDate(b21Date, tz, "yyyy-MM-dd");

  // Scan column R (starting at row 2)
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const rRange = sheet.getRange(2, 18, lastRow - 1, 1).getValues(); // col R
  let matchRow = null;
  for (let i = 0; i < rRange.length; i++) {
    const rv = rRange[i][0];
    if (!rv) continue;
    const rDate = toDate(rv);
    if (!rDate) continue;
    const rDateStr = Utilities.formatDate(rDate, tz, "yyyy-MM-dd");
    if (rDateStr === targetDateStr) {
      matchRow = i + 2; // row index in sheet
      break;
    }
  }

  // If no matching date, find the last unfilled U row
  if (!matchRow) {
    for (let i = rRange.length - 1; i >= 0; i--) {
      const rv = rRange[i][0];
      if (!rv) continue; // skip blanks
      const row = i + 2;
      const uVal = toNumber(sheet.getRange(row, 21).getValue());
      const tVal = toNumber(sheet.getRange(row, 20).getValue());
      if (uVal < tVal) {
        matchRow = row;
        break;
      }
    }
    if (!matchRow) return; // nothing to fill
  }

  // Read T and U
  const tVal = toNumber(sheet.getRange(matchRow, 20).getValue());
  const uVal = toNumber(sheet.getRange(matchRow, 21).getValue());

  // Add amount to U at the chosen row
  const newU = uVal + valB24;
  sheet.getRange(matchRow, 21).setValue(newU);
}

/** Convert to Date or null */
function toDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "number") {
    const ms = (value - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** Coerce to number, blanks/text -> 0 */
function toNumber(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}


function distributeGasCorrection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("PENGISIAN GAS");

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Read T and U columns from row 2 down
  const tValues = sheet.getRange(2, 20, lastRow - 1, 1).getValues(); // col T
  const uValues = sheet.getRange(2, 21, lastRow - 1, 1).getValues(); // col U

  let mismatchRow = null;
  for (let i = tValues.length - 1; i >= 0; i--) {
    const tVal = Number(tValues[i][0]) || 0;
    const uVal = Number(uValues[i][0]) || 0;
    if (tVal !== uVal) {
      mismatchRow = i + 2; // convert index to sheet row
      break;
    }
  }

  if (!mismatchRow) {
    // No mismatch found
    return;
  }

  const tVal = Number(sheet.getRange(mismatchRow, 20).getValue()) || 0;
  const uVal = Number(sheet.getRange(mismatchRow, 21).getValue()) || 0;
  const aboveRow = mismatchRow - 1;

  if (aboveRow < 2) {
    // No row above to transfer from
    return;
  }

  const aboveU = Number(sheet.getRange(aboveRow, 21).getValue()) || 0;
  const needed = tVal - uVal;

  if (needed <= 0) return; // already equal or overfilled

  const transfer = Math.min(aboveU, needed);

  // Apply transfer
  sheet.getRange(mismatchRow, 21).setValue(uVal + transfer);
  sheet.getRange(aboveRow, 21).setValue(aboveU - transfer);
}


/**
 * Convert a sheet value to a Date.
 * Returns a Date or null if parsing fails.
 */
function toDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === "number") {
    // Google Sheets serial date to JS Date (days -> ms)
    const ms = (value - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    // Try common formats: ISO, dd/MM/yyyy HH:mm:ss, MM/dd/yyyy, etc.
    // 1) Native parse for ISO-like strings
    const d1 = new Date(value);
    if (!isNaN(d1.getTime())) return d1;

    // 2) dd/MM/yyyy HH:mm:ss (e.g., 25/11/2025 13:04:46)
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (m) {
      const [_, dd, MM, yyyy, hh, mm, ss] = m;
      const d2 = new Date(Number(yyyy), Number(MM) - 1, Number(dd), Number(hh), Number(mm), Number(ss));
      return isNaN(d2.getTime()) ? null : d2;
    }

    // 3) yyyy-MM-dd HH:mm:ss
    const m2 = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (m2) {
      const [_, yyyy, MM, dd, hh, mm, ss] = m2;
      const d3 = new Date(Number(yyyy), Number(MM) - 1, Number(dd), Number(hh), Number(mm), Number(ss));
      return isNaN(d3.getTime()) ? null : d3;
    }
  }
  return null;
}

/**
 * Coerce a sheet value to a number, treating blanks/text as 0.
 */
function toNumber(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}


function submitGasSalesAuto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gasSheet = ss.getSheetByName("PENJUALAN GAS");
  const jurnalSheet = ss.getSheetByName("JURNAL");

  // Read both input blocks from S2:S6 and S9:S13 (Shifted from Q to S)
  const inputBlocks = [
    gasSheet.getRange("S2:S6").getValues(),
    gasSheet.getRange("S9:S13").getValues()
  ];

  // Switch to JURNAL sheet once
  ss.setActiveSheet(jurnalSheet);

  // Submit each block to B2:B6 and trigger transaction
  inputBlocks.forEach(values => {
    jurnalSheet.getRange("B2:B6").setValues(values);
    submitTransaction();
  });

  // Check S22 value (Shifted from Q22 to S22)
  const s22Value = gasSheet.getRange("S22").getValue();
  if (typeof s22Value === "number" && s22Value < 0) {
    const extraBlock = gasSheet.getRange("S16:S20").getValues(); // Shifted from Q16:Q20 to S16:S20
    jurnalSheet.getRange("B2:B6").setValues(extraBlock);
    submitTransaction();
  }

  // Return to PENJUALAN GAS sheet
  ss.setActiveSheet(gasSheet);
}

function submitGasSales() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PENJUALAN GAS");

  // Input-only fields
  const inputRefs = ["B1", "B2", "B3", "B7", "B9", "B11"];
  const inputValues = inputRefs.map(ref => sheet.getRange(ref).getValue());

  // Formula-based fields
  const formulaRefs = ["B4", "B5", "B6", "B8", "B10"];
  const formulaValues = formulaRefs.map(ref => sheet.getRange(ref).getValue());

  // Merge into final row for D2:N2
  const finalRow = [
    ...inputValues.slice(0, 3),     // B1–B3 → D–F
    ...formulaValues.slice(0, 3),   // B4–B6 → G–I
    inputValues[3],                 // B7 → J
    formulaValues[3],               // B8 → K
    inputValues[4],                 // B9 → L
    formulaValues[4],               // B10 → M
    inputValues[5]                  // B11 → N
  ];

  const newRow = [finalRow];

  // Shift existing data down if present
  const lastRow = sheet.getLastRow();
  const dataCount = lastRow > 1 ? lastRow - 1 : 0;

  if (dataCount > 0) {
    const existingData = sheet.getRange(2, 4, dataCount, 11).getValues();
    sheet.getRange(3, 4, dataCount, 11).setValues(existingData);
  }

  // Write new entry to D2:N2
  sheet.getRange(2, 4, 1, 11).setValues(newRow);

  // Clear input-only fields
  sheet.getRangeList(["B1", "B2", "B3", "B7", "B11"]).clearContent();

  // Trigger journal automation
  submitGasSalesAuto();
}

function submitGasSalesLast() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PENJUALAN GAS");

// 1. Grab the values from the B column (B21:B31)
  const sourceB = sheet.getRange("B21:B31");
  const targetRow = sheet.getRange("D2:N2");

// 2. Map them to your D-N structure
const bValues = sourceB.getValues();
  const rowData = [[
    bValues[0][0], bValues[1][0], bValues[2][0], // B21-23 -> D-F
    bValues[3][0], bValues[4][0], bValues[5][0], // B24-26 -> G-I
    bValues[6][0], bValues[7][0], bValues[8][0], // B27-29 -> J-L
    bValues[9][0], bValues[10][0]                // B30-31 -> M-N
  ]];

// 3. Determine how much data is currently in the D:N table
  const tableData = sheet.getRange("D2:D").getValues().filter(String);
  const rowCount = tableData.length;
  
// 4. Shift ONLY the table D2:N down (Preserving ALL formatting)
  if (rowCount > 0) {
    const tableRange = sheet.getRange(2, 4, rowCount, 11); // Range D2:N[Last]
    // Move everything down to start at row 3
    tableRange.moveTo(sheet.getRange(3, 4));
  }

// 5. PASTE values to D2:N2
// We use setValues for the data, but if you want to copy formatting 
// from a "Template" row (e.g., Row 3), we do this:
targetRow.setValues(rowData);

// 6. SYNC FORMATTING: Copy format from the row that just moved down (Row 3)
// back to the new top row (Row 2) so they match perfectly.
if (rowCount > 0) {
  sheet.getRange("D3:N3").copyTo(targetRow, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
}

// Trigger journal automation
submitGasSalesAuto();

}

function closeIncomeStatement() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName("BALANCE");
  const targetSheet = ss.getSheetByName("JURNAL");

  // Copy Y2:Y6 → B2:B6
  const incomeSummaryEntry = sourceSheet.getRange("Y2:Y6").getValues();
  targetSheet.getRange("B2:B6").setValues(incomeSummaryEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();

    // Switch to the BALANCE sheet
  ss.setActiveSheet(sourceSheet);

  // Copy Y14:Y18 → B2:B6
  const sharesSummaryEntry = sourceSheet.getRange("Y14:Y18").getValues();
  targetSheet.getRange("B2:B6").setValues(sharesSummaryEntry);

  // Switch to the JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Submit the journal entry
  submitTransaction();
}

function submitTaxes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getActiveSheet();
  const targetSheet = ss.getSheetByName("JURNAL");

  if (!targetSheet) {
    throw new Error("Sheet named 'JURNAL' not found.");
  }

  // Step 1: Copy H40:H44 to JURNAL!B2:B6
  const taxData = sourceSheet.getRange("H40:H44").getValues();
  targetSheet.getRange("B2:B6").setValues(taxData);

  // Step 2: Switch to JURNAL sheet
  ss.setActiveSheet(targetSheet);

  // Step 3: Execute submitTransaction() on JURNAL
  submitTransaction();

  // Step 4: Return to source sheet and clear H44
  ss.setActiveSheet(sourceSheet);
  sourceSheet.getRange("H44").clearContent();
}


