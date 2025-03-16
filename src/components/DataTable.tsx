import React, { useMemo } from "react";
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToTSV,
} from "../utils/exportUtils";

interface DataTableProps {
  data: any[];
  filename: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, filename }) => {
  // Extract column headers from the first item in the data array
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      Header: key,
      accessor: key,
    }));
  }, [data]);

  // Check if data contains complex structures (nested objects or arrays)
  const hasComplexData = useMemo(() => {
    if (data.length === 0) return false;

    for (const item of data) {
      for (const key in item) {
        const value = item[key];
        if (
          (typeof value === "object" && value !== null) ||
          Array.isArray(value)
        ) {
          return true;
        }
      }
    }
    return false;
  }, [data]);

  // Display a message if there's no data
  if (data.length === 0) {
    return <p>ไม่พบข้อมูลเลยอ่ะ 😢</p>;
  }

  const handleExport = (format: "csv" | "excel" | "json" | "tsv") => {
    switch (format) {
      case "csv":
        exportToCSV(data, filename);
        break;
      case "tsv":
        exportToTSV(data, filename);
        break;
      case "excel":
        exportToExcel(data, filename);
        break;
      case "json":
        exportToJSON(data, filename);
        break;
      default:
        break;
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h3>✅ ดึงข้อมูลสำเร็จแล้ว! ({data.length} รายการ)</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onClick={() => handleExport("csv")}
          >
            📥 CSV จ้า
          </button>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2c5282",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onClick={() => handleExport("tsv")}
          >
            📥 TSV ก็ได้
          </button>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#38a169",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onClick={() => handleExport("excel")}
          >
            📊 Excel เลยดิ!
          </button>
          <button
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#805ad5",
              color: "white",
              border: "none",
              borderRadius: "0.75rem",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
            onClick={() => handleExport("json")}
          >
            👩‍💻 JSON (สายเทคแต่ไม่เขียนโค้ด)
          </button>
        </div>
      </div>

      {hasComplexData && (
        <div
          style={{
            backgroundColor: "#fffde7",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "1rem",
            borderLeft: "4px solid #f9a825",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: "500" }}>
            <strong>📌 เฮ้! ข้อมูลมีโครงสร้างซับซ้อนนะ</strong>{" "}
            แต่เราปรับแล้วให้ใช้ใน Excel ได้:
          </p>
          <ul
            style={{
              marginTop: "0.5rem",
              marginBottom: 0,
              fontSize: "0.875rem",
            }}
          >
            <li>
              ข้อมูล Object ซ้อนกัน เราแปลงเป็นรูปแบบจุด (เช่น{" "}
              <code>address.city</code>)
            </li>
            <li>Array ธรรมดาเราเชื่อมด้วย , (คอมม่า)</li>
            <li>Array ที่ซับซ้อนจะเก็บเป็น JSON แต่ยังอ่านได้</li>
            <li>อยากได้โครงสร้างแบบเต็มๆ ใช้ไฟล์ JSON (ไว้ส่งให้วิศวกร 😉)</li>
            <li>
              <strong>แนะนำน้องๆ:</strong> ถ้าเปิด CSV แล้วข้อมูลเพี้ยน
              ลองดาวน์โหลด TSV แทน
            </li>
          </ul>
        </div>
      )}

      <div
        style={{
          overflowX: "auto",
          backgroundColor: "#fff",
          padding: "1rem",
          borderRadius: "1rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <p
          style={{
            marginBottom: "0.8rem",
            fontSize: "0.95rem",
            color: "#2d3748",
          }}
        >
          👀 ดูตัวอย่างข้อมูล 10 รายการแรก:
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem",
                    borderBottom: "2px solid #4299e1",
                    backgroundColor: "#ebf8ff",
                    fontWeight: "600",
                  }}
                >
                  {column.Header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? "#f7fafc" : "white",
                }}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      padding: "0.5rem",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {typeof row[column.accessor] === "object"
                      ? JSON.stringify(row[column.accessor])
                      : String(row[column.accessor] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 10 && (
        <p
          style={{
            marginTop: "0.7rem",
            fontSize: "0.875rem",
            color: "#718096",
            textAlign: "center",
          }}
        >
          แสดง 10 รายการจาก {data.length} รายการทั้งหมด |
          กดปุ่มด้านบนเพื่อดาวน์โหลดข้อมูลทั้งหมด 💪
        </p>
      )}
    </div>
  );
};

export default DataTable;
