import React, { useState } from "react";
import "./App.css";
import { fetchApiData, isValidUrl } from "./services/api";
import DataTable from "./components/DataTable";
import ApiEducation from "./components/ApiEducation";

function App() {
  // Update the URL to use a relative path when using the proxy setup
  const defaultUrl =
    "https://epid-odpc2.ddc.moph.go.th/haze-r2/api/patient-group-location?limit=50000";
  const [apiUrl, setApiUrl] = useState<string>(defaultUrl);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("my-cool-data");
  const [showProxyHelp, setShowProxyHelp] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("converter");

  const handleFetchData = async () => {
    if (!apiUrl) {
      setError("ใส่ URL API ด้วยค่ะคุณซิสสส~ 🥺👉👈");
      return;
    }

    if (!isValidUrl(apiUrl)) {
      setError("URL ไม่ถูกมาตรฐานนะเตง นี่ไม่ใช่ URL นะยูโน่วว 💅");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowProxyHelp(false);

    try {
      const result = await fetchApiData(apiUrl);
      setData(Array.isArray(result) ? result : [result]);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching data:", err);

      // Provide more specific error message based on the error
      if (err?.message?.includes("timeout") || err?.message?.includes("522")) {
        setError(
          "ทามเอาท์~~~ อาจเป็นเพราะเซิฟเวอร์ล่มหรือข้อมูลเยอะเกิ๊น เหนื่อยยย 😵‍💫"
        );
        setShowProxyHelp(true);
      } else if (
        err?.message?.includes("Network Error") ||
        err?.code === "ERR_NETWORK"
      ) {
        setError("เน็ตมีปัญหาหรือป่าว? เช็คเน็ตแล้วลองใหม่นะจ๊ะ 📶❌");
        setShowProxyHelp(true);
      } else if (
        err?.response?.status === 403 ||
        err?.response?.status === 401
      ) {
        setError("เข้าไม่ได้น้าา~ API นี้อาจต้องมีสิทธิ์เข้าถึงพิเศษ 🔐👀");
        setShowProxyHelp(true);
      } else {
        setError(
          `ดึงข้อมูลไม่ได้เลยอ่ะ: ${
            err.message || "ไม่รู้สาเหตุ แต่เจ๊ไม่โอเค 😭"
          }`
        );
        setShowProxyHelp(true);
      }

      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const useLocalProxy = () => {
    // Check if the local proxy is already being used
    if (apiUrl.includes("localhost:8080")) {
      return;
    }

    setApiUrl(`http://localhost:8080/${apiUrl}`);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          ✨ แปลงร่าง <span className="highlight-text">API</span> ✨
        </h1>
        <p>
          แปลงข้อมูลจาก API เป็นไฟล์ Excel, CSV แบบชิลๆ ไม่ต้องเขียนโค้ดเลยอ่ะ!
        </p>
      </header>

      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === "converter" ? "active" : ""}`}
          onClick={() => setActiveTab("converter")}
        >
          <span className="tab-icon">🔄</span> แปลงข้อมูล API
        </button>
        <button
          className={`tab-button ${activeTab === "education" ? "active" : ""}`}
          onClick={() => setActiveTab("education")}
        >
          <span className="tab-icon">🧠</span> เรียนรู้เรื่อง API
        </button>
      </div>

      <main className="App-main">
        {activeTab === "converter" && (
          <>
            <div className="input-section">
              <div className="input-group">
                <label htmlFor="api-url">URL API ที่อยากแปลง:</label>
                <input
                  type="text"
                  id="api-url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="ใส่ URL API ที่อยากแปลงตรงนี้เลย~"
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label htmlFor="filename">ชื่อไฟล์ที่จะดาวน์โหลด:</label>
                <input
                  type="text"
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="ตั้งชื่อไฟล์ให้เพื่อนจำได้ง่ายๆ"
                  className="input-field"
                />
              </div>
              <button
                className="fetch-button"
                onClick={handleFetchData}
                disabled={isLoading}
              >
                {isLoading ? "กำลังดึงข้อมูลจ้า... 🔄" : "ไปเลยคร้าบบบ! 🚀"}
              </button>
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
                {showProxyHelp && (
                  <div className="proxy-help">
                    <p>
                      <strong>ลองวิธีนี้ไหมคะซิส:</strong>
                    </p>
                    <ol>
                      <li>
                        รันโปรแกรม proxy ก่อนในเทอร์มินอลนะคะ:
                        <pre>npm run proxy</pre>
                      </li>
                      <li>
                        แล้วกดปุ่มนี้เพื่อใช้ proxy:
                        <button
                          className="proxy-button"
                          onClick={useLocalProxy}
                        >
                          ใช้ Local Proxy 🧙‍♀️
                        </button>
                      </li>
                      <li>
                        ถ้าข้อมูลเยอะเกิน ลองลดขนาดดู เช่น เปลี่ยนจาก
                        limit=50000 เป็น limit=1000 จะได้โหลดได้เร็วๆ
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {data.length > 0 && (
              <div className="data-table-container">
                <DataTable data={data} filename={filename} />
              </div>
            )}
          </>
        )}

        {activeTab === "education" && <ApiEducation />}
      </main>
      <footer className="App-footer">
        <p>
          สร้างด้วย ❤️ เพื่อให้ชีวิตน้องๆ นักวิเคราะห์ข้อมูลง่ายขึ้น |
          #แปลงเอพีไอไม่ง้อโปรแกรมเมอร์
        </p>
      </footer>
    </div>
  );
}

export default App;
