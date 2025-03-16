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
  // Set initial apiUrl state to use this example URL
  const [apiUrl, setApiUrl] = useState<string>(
    "https://epid-odpc2.ddc.moph.go.th/haze-r2/api/patient-group-location?limit=50000"
  );
  const [filename, setFilename] = useState<string>("my-cool-data");
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showProxyHelp, setShowProxyHelp] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("converter");
  const [usingLocalProxy, setUsingLocalProxy] = useState<boolean>(isProd); // Auto enable proxy in production
  const [usingThaiProxy, setUsingThaiProxy] = useState<boolean>(false);

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
  }, [apiUrl]); // Only include apiUrl since proxyPrefix is a constant

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
      // Clean and validate the URL first
      let urlToFetch = cleanUrlFromProxies(apiUrl);

      console.log("Cleaned URL for fetching:", urlToFetch);

      // Pass a flag to indicate Thai proxy use if selected
      const options = {
        useThaiProxy: usingThaiProxy,
      };

      const result = await fetchApiData(urlToFetch, options);
      setData(Array.isArray(result) ? result : [result]);
      setError(null);

      // Reset Thai proxy flag after successful fetch
      setUsingThaiProxy(false);
    } catch (err: any) {
      console.error("Error fetching data:", err);

      // Add a special case for Thai proxy errors
      if (err.message?.includes("Thai proxy")) {
        setError(
          `ขออภัย ไม่สามารถเชื่อมต่อผ่าน Thai Proxy ได้: ${err.message}`
        );
      } else if (err.message?.includes("HTML")) {
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

      // Reset Thai proxy flag after failed fetch
      setUsingThaiProxy(false);
    } finally {
      setIsLoading(false);
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

    // Fix specific path patterns we know about
    if (cleanUrl.includes("/haze-r2") && !cleanUrl.includes("/haze-r2/")) {
      cleanUrl = cleanUrl.replace("/haze-r2", "/haze-r2/");
    }

    console.log("Final cleaned URL:", cleanUrl);

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

  const useThaiProxy = () => {
    setUsingThaiProxy(true);
    console.log("Set to use Thai proxy for the next request");
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
              <div className="flex flex-col md:flex-row gap-2 mt-4">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="API URL ที่ต้องการดึงข้อมูล"
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                <button
                  onClick={handleFetchData}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-shrink-0"
                >
                  {isLoading ? "กำลังดึงข้อมูล..." : "ดึงข้อมูล"}
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={useLocalProxy}
                  disabled={usingLocalProxy}
                  className={`text-sm py-1 px-2 rounded ${
                    usingLocalProxy
                      ? "bg-green-200 text-green-800"
                      : "bg-blue-200 text-blue-800 hover:bg-blue-300"
                  }`}
                >
                  {usingLocalProxy
                    ? "✓ ใช้ Built-in Proxy อยู่"
                    : "ใช้ Built-in Proxy 🧙‍♀️"}
                </button>

                <button
                  onClick={useThaiProxy}
                  disabled={usingThaiProxy}
                  className={`text-sm py-1 px-2 rounded ${
                    usingThaiProxy
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                  }`}
                  title="ใช้ระบบ Thai Proxy แบบหลายชั้น - จะลองใช้ Proxy จากหลายแหล่งโดยอัตโนมัติเพื่อเข้าถึง API ของไทย หากแหล่งหนึ่งล้มเหลว จะลองแหล่งถัดไป"
                >
                  {usingThaiProxy
                    ? "✓ กำลังใช้ Thai Proxy"
                    : "ใช้ระบบ Thai Multi-Proxy 🇹🇭"}
                </button>
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
