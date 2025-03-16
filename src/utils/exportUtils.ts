import * as XLSX from "xlsx";
import * as Papa from "papaparse";
import FileSaver from "file-saver";

/**
 * Pre-processes data before flattening to handle special API response structures
 * @param data The data to pre-process
 * @returns Processed data ready for flattening
 */
const preprocessData = (data: any[]): any[] => {
  // If there's no data, return empty array
  if (!data || data.length === 0) return [];

  // Special handling for this specific API structure
  // Check if we have an object with 'data' property containing stringified JSON
  if (data.length === 1 && typeof data[0] === "object") {
    const firstItem = data[0];

    // Log the structure to help with debugging
    console.log("Data structure:", Object.keys(firstItem).join(", "));

    if (firstItem.data && typeof firstItem.data === "string") {
      try {
        // Try to parse the nested JSON string
        const parsed = JSON.parse(firstItem.data);
        if (Array.isArray(parsed)) {
          console.log(
            "Successfully extracted nested data array with",
            parsed.length,
            "items"
          );
          return parsed;
        }
      } catch (error) {
        console.error("Error parsing nested JSON data:", error);
      }
    } else if (firstItem.data && Array.isArray(firstItem.data)) {
      // If data is already an array, use it directly
      console.log(
        "Found nested data array with",
        firstItem.data.length,
        "items"
      );
      return firstItem.data;
    }

    // Add totalCount as a field to each item if it exists
    if (Array.isArray(data) && data.length > 0 && "totalCount" in firstItem) {
      console.log("Adding totalCount to each data item");
      return data.map((item) => ({
        ...item,
        totalCount: firstItem.totalCount,
      }));
    }
  }

  // Default case - return the original data
  return data;
};

/**
 * Flattens nested objects in an array for CSV/Excel export
 * @param data Array of objects to flatten
 * @returns Flattened array of objects
 */
const flattenData = (data: any[]): any[] => {
  // First preprocess the data to handle special API response structures
  const preprocessedData = preprocessData(data);

  if (!Array.isArray(preprocessedData) || preprocessedData.length === 0) {
    console.warn("No data to flatten after preprocessing");
    return [];
  }

  console.log("Flattening", preprocessedData.length, "items");

  return preprocessedData.map((item) => {
    const flattenedItem: Record<string, any> = {};

    // Process each field in the item
    const processItem = (obj: any, prefix = "") => {
      for (const key in obj) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
          flattenedItem[newKey] = "";
        } else if (typeof value === "object" && !Array.isArray(value)) {
          // Recursively process nested objects
          processItem(value, newKey);
        } else if (Array.isArray(value)) {
          // For arrays, convert to a more readable string format
          // or create separate columns for simple arrays
          if (value.length === 0) {
            flattenedItem[newKey] = "";
          } else if (typeof value[0] === "object") {
            // Complex arrays (of objects) get stringified with indentation
            flattenedItem[newKey] = JSON.stringify(value, null, 2);
          } else {
            // Simple arrays (of primitives) are joined with commas
            flattenedItem[newKey] = value.join(", ");
          }
        } else {
          // Primitive values
          flattenedItem[newKey] = value;
        }
      }
    };

    processItem(item);
    return flattenedItem;
  });
};

/**
 * Exports data to CSV format and triggers download
 * @param data Array of data to export
 * @param filename Name of the file to download
 */
export const exportToCSV = (data: any[], filename: string): void => {
  try {
    const flattenedData = flattenData(data);

    if (flattenedData.length === 0) {
      console.error("No data to export after flattening");
      return;
    }

    // Log column headers to help with debugging
    console.log("CSV columns:", Object.keys(flattenedData[0]).join(", "));
    console.log(
      "First row sample:",
      JSON.stringify(flattenedData[0]).substr(0, 100) + "..."
    );

    // Ensure consistent configuration for CSV generation
    const csv = Papa.unparse(flattenedData, {
      delimiter: ",", // Explicitly set delimiter to comma
      header: true, // Include header row
      newline: "\r\n", // Use Windows-style line breaks for better Excel compatibility
      quotes: true, // Force quotes around all fields for better compatibility
      escapeFormulae: true, // Protect against CSV injection
    });

    // Add BOM (Byte Order Mark) for better UTF-8 detection in Excel
    const BOM = "\ufeff";
    const csvWithBOM = BOM + csv;

    // Create the blob with the correct content type
    const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });

    // Save the file
    FileSaver.saveAs(blob, `${filename}.csv`);

    console.log(
      "CSV export successful with fields:",
      Object.keys(flattenedData[0]).join(", ")
    );
  } catch (error) {
    console.error("Error exporting to CSV:", error);
  }
};

/**
 * Exports data to TSV (Tab-Separated Values) format and triggers download
 * This format is often better recognized by spreadsheet software
 * @param data Array of data to export
 * @param filename Name of the file to download
 */
export const exportToTSV = (data: any[], filename: string): void => {
  try {
    const flattenedData = flattenData(data);

    if (flattenedData.length === 0) {
      console.error("No data to export after flattening");
      return;
    }

    // Generate TSV with tabs as separators
    const tsv = Papa.unparse(flattenedData, {
      delimiter: "\t", // Tab delimiter
      header: true,
      newline: "\r\n",
      quotes: false, // No quotes needed for TSV
      escapeFormulae: true,
    });

    // Add BOM for UTF-8 detection
    const BOM = "\ufeff";
    const tsvWithBOM = BOM + tsv;

    // Create the blob with the correct content type
    const blob = new Blob([tsvWithBOM], {
      type: "text/tab-separated-values;charset=utf-8;",
    });

    // Save the file
    FileSaver.saveAs(blob, `${filename}.tsv`);

    console.log("TSV export successful");
  } catch (error) {
    console.error("Error exporting to TSV:", error);
  }
};

/**
 * Exports data to Excel format and triggers download
 * @param data Array of data to export
 * @param filename Name of the file to download
 */
export const exportToExcel = (data: any[], filename: string): void => {
  try {
    const flattenedData = flattenData(data);

    if (flattenedData.length === 0) {
      console.error("No data to export after flattening");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);

    // Auto-size columns (approximate)
    const maxWidths: Record<string, number> = {};

    // Get all keys
    const keys = flattenedData.length > 0 ? Object.keys(flattenedData[0]) : [];

    // Set column widths based on content
    keys.forEach((key) => {
      maxWidths[key] = Math.max(
        key.length,
        ...flattenedData.map((row) => {
          const val = row[key];
          return String(val !== null && val !== undefined ? val : "").length;
        })
      );
    });

    // Set column widths (capped at 100 characters)
    const columnWidths: XLSX.ColInfo[] = keys.map((key, index) => ({
      wch: Math.min(maxWidths[key], 100),
    }));

    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    FileSaver.saveAs(blob, `${filename}.xlsx`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
  }
};

/**
 * Exports data to JSON format and triggers download
 * @param data Array of data to export
 * @param filename Name of the file to download
 */
export const exportToJSON = (data: any[], filename: string): void => {
  try {
    // For JSON, we want to preserve the original structure if it's the special API format
    if (data.length === 1 && data[0].data && typeof data[0].data === "string") {
      try {
        const parsed = JSON.parse(data[0].data);
        if (Array.isArray(parsed)) {
          // Export the parsed array as JSON
          const json = JSON.stringify(parsed, null, 2);
          const blob = new Blob([json], { type: "application/json" });
          FileSaver.saveAs(blob, `${filename}.json`);
          return;
        }
      } catch (error) {
        console.error("Error parsing nested JSON data for JSON export:", error);
      }
    }

    // Default case - export original data
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    FileSaver.saveAs(blob, `${filename}.json`);
  } catch (error) {
    console.error("Error exporting to JSON:", error);
  }
};
