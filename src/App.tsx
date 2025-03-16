import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { fetchApiData, isValidUrl } from "./services/api";
import DataTable from "./components/DataTable";
import ApiEducation from "./components/ApiEducation";

// Determine if we're in production (Vercel) or development
const isProd = window.location.hostname !== "localhost";
const proxyPrefix = isProd ? "/api/" : "http://localhost:8080/";

function App() {
  // Reference to track initial proxy application
  const initialProxyApplied = useRef(false);

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
  const [usingLocalProxy, setUsingLocalProxy] = useState<boolean>(isProd); // Auto enable proxy in production

  // Effect to automatically add proxy in production
  useEffect(() => {
    // Only run once on component mount
    if (
      !initialProxyApplied.current &&
      isProd &&
      !apiUrl.includes(proxyPrefix)
    ) {
      initialProxyApplied.current = true; // Mark as applied

      // Apply proxy prefix automatically in production
      const cleanedUrl = cleanUrlFromProxies(apiUrl);
      const proxyUrl = `${proxyPrefix}${cleanedUrl}`;
      console.log("Auto-applying proxy in production:", proxyUrl);
      setApiUrl(proxyUrl);
    }
  }, [apiUrl, proxyPrefix]); // Include dependencies but use ref to prevent loops

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
      // Ensure we're using our proxy in production
      let urlToFetch = apiUrl;

      // If we're in production and the URL doesn't have our proxy prefix
      if (isProd && !urlToFetch.includes(proxyPrefix)) {
        // Clean the URL from other proxy prefixes first
        urlToFetch = cleanUrlFromProxies(urlToFetch);
        // Add our proxy prefix
        urlToFetch = `${proxyPrefix}${urlToFetch}`;
        console.log("Using proxy URL in production:", urlToFetch);
      }

      const result = await fetchApiData(urlToFetch);
      setData(Array.isArray(result) ? result : [result]);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching data:", err);

      // Provide more specific error message based on the error
      if (err.message?.includes("HTML")) {
        setError(
          "ข้อมูลจาก API ไม่ถูกต้อง เพราะได้รับ HTML แทนที่จะเป็น JSON ลองใช้ URL API อื่นดูนะ 🧐"
        );
        setShowProxyHelp(true);
      } else if (err.message?.includes("CORS")) {
        setError(
          "มีปัญหาเรื่อง CORS ลองใช้ปุ่ม 'ใช้ Built-in Proxy 🧙‍♀️' ด้านล่างแล้วลองดึงข้อมูลอีกครั้ง"
        );
        setShowProxyHelp(true);
      } else if (err.message?.includes("Network Error")) {
        setError(
          "เกิดปัญหาเชื่อมต่อกับ API ลองใช้ Built-in Proxy หรือลองใช้ API อื่นดูนะ"
        );
        setShowProxyHelp(true);
      } else {
        setError(`เกิดข้อผิดพลาด: ${err.message || "ไม่ทราบสาเหตุ"} 😵`);
      }
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset proxy status when user changes URL
    if (e.target.value !== apiUrl) {
      setUsingLocalProxy(isProd); // In production, keep proxy enabled

      // If in production and changing URL, ensure any new URL gets proxy prefix
      if (isProd) {
        // Don't add prefix here, it will be added when fetching
        setApiUrl(e.target.value);
      } else {
        setApiUrl(e.target.value);
      }
    }
  };

  const cleanUrlFromProxies = (url: string): string => {
    // Get URL without existing proxy prefixes if any
    let cleanUrl = url;
    const proxyPatterns = [
      "http://localhost:8080/",
      "/api/",
      "https://corsproxy.io/?",
      "https://cors-anywhere.herokuapp.com/",
      "https://api.allorigins.win/raw?url=",
      "https://proxy.cors.sh/",
    ];

    for (const pattern of proxyPatterns) {
      if (cleanUrl.includes(pattern)) {
        cleanUrl = cleanUrl.replace(pattern, "");
        if (pattern.includes("url=")) {
          // Handle URL parameter style proxies
          cleanUrl = decodeURIComponent(cleanUrl);
        }
        break;
      }
    }

    // Make sure the URL has a proper protocol
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      console.error("URL missing protocol after cleaning:", cleanUrl);
      // Default to https if no protocol
      cleanUrl = "https://" + cleanUrl;
    }

    // Fix malformed protocol (https:/ instead of https://)
    if (cleanUrl.match(/^https?:\/[^/]/)) {
      cleanUrl = cleanUrl.replace(/^(https?):\/([^/])/, "$1://$2");
    }

    // Ensure the URL is properly formed
    try {
      new URL(cleanUrl);
    } catch (error) {
      console.error("Invalid URL after cleaning:", cleanUrl, error);
    }

    return cleanUrl;
  };

  const useLocalProxy = () => {
    try {
      // If already using the proxy, don't modify
      if (apiUrl.includes(`${proxyPrefix}`)) {
        return;
      }

      // Clean the URL first
      let cleanUrl = cleanUrlFromProxies(apiUrl);

      // Construct new URL with proxy
      const newUrl = `${proxyPrefix}${cleanUrl}`;
      console.log("Constructed proxy URL:", newUrl);

      setApiUrl(newUrl);
      setUsingLocalProxy(true);
    } catch (error) {
      console.error("Error setting up proxy URL:", error);
      setError("เกิดข้อผิดพลาดในการตั้งค่า Proxy URL โปรดลองอีกครั้ง");
    }
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
                  onChange={handleInputChange}
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
                        {usingLocalProxy ? (
                          <span>
                            กำลังใช้ CORS Proxy อยู่แล้ว แต่ยังไม่สำเร็จ ลองใช้
                            API URL อื่นดูนะคะ
                          </span>
                        ) : (
                          <>
                            {isProd ? (
                              <span>
                                กดปุ่มด้านล่างเพื่อใช้ CORS Proxy
                                ที่ติดตั้งมาพร้อมกับเว็บไซต์:
                              </span>
                            ) : (
                              <>
                                รันโปรแกรม proxy ก่อนในเทอร์มินอลนะคะ:
                                <pre>npm run proxy</pre>
                              </>
                            )}
                          </>
                        )}
                      </li>
                      <li>
                        กดปุ่มนี้เพื่อใช้ Proxy:
                        <button
                          className="proxy-button"
                          onClick={useLocalProxy}
                        >
                          ใช้ {isProd ? "Built-in" : "Local"} Proxy 🧙‍♀️
                        </button>
                      </li>
                      <li>
                        ถ้าข้อมูลเยอะเกิน ลองลดขนาดดู เช่น เปลี่ยนจาก
                        limit=50000 เป็น limit=1000 จะได้โหลดได้เร็วๆ
                      </li>
                      <li>
                        ลองดู API ตัวอย่างได้ในแท็บ{" "}
                        <strong>"เรียนรู้เรื่อง API"</strong> ด้านบนนะ
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
