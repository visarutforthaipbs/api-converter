import React from "react";
import "../App.css";

// Import sample images for the tutorial
import openNetworkImg from "../assets/open-network-tab.png";
import findApiRequestImg from "../assets/find-api-requests.png";
import copyApiUrlImg from "../assets/copy-api-url.png";

const ApiEducation: React.FC = () => {
  return (
    <div className="api-education">
      <h2>
        🔍 API คืออะไรนะ?{" "}
        <span className="highlight-text">และหาได้ที่ไหน?</span>
      </h2>

      <div className="education-section">
        <div className="education-intro">
          <p className="funky-text">
            <span className="emoji-bullet">🌐</span> <strong>API คือ</strong>{" "}
            ประตูลับที่ทำให้เว็บต่างๆ คุยกันได้!
            เปรียบเสมือนบริกรในร้านอาหารที่ส่งข้อมูลไปมาระหว่างห้องครัว
            (เซิร์ฟเวอร์) กับลูกค้า (เว็บเบราว์เซอร์ของเรา) 🍽️
          </p>
        </div>

        <div className="step-section">
          <h3>⭐ วิธีค้นหา API สุดเจ๋งจากหน้าเว็บไซต์:</h3>

          <div className="api-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>เปิด Network Tab ใน Developer Tools</h4>
              <ul>
                <li>
                  กด <kbd>F12</kbd> หรือ <kbd>Ctrl+Shift+I</kbd> (Windows) หรือ{" "}
                  <kbd>⌘+Option+I</kbd> (Mac) 🖥️
                </li>
                <li>
                  คลิกที่แท็บ <strong>Network</strong> ด้านบน
                </li>
                <li>
                  ถ้ายังไม่เห็นข้อมูล ให้รีเฟรชหน้าเว็บด้วยการกด <kbd>F5</kbd>{" "}
                  หรือ <kbd>⌘+R</kbd>
                </li>
              </ul>
              <div className="img-placeholder">
                <img
                  alt="เปิด Network Tab"
                  src={openNetworkImg}
                  className="tutorial-img"
                />
                <p className="img-caption">
                  รูปตัวอย่าง: การเปิด Network Tab ใน Chrome DevTools
                </p>
              </div>
            </div>
          </div>

          <div className="api-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>ค้นหา API Request ที่น่าสนใจ</h4>
              <ul>
                <li>
                  ดูรายการ Request ทางซ้ายมือ มองหาไฟล์ที่มีนามสกุล{" "}
                  <code>.json</code> หรือ API endpoint ที่มีชื่อเช่น{" "}
                  <code>/api/</code>, <code>/data/</code> 🔍
                </li>
                <li>คลิกที่ Request เพื่อดูรายละเอียด</li>
                <li>
                  API Response มักจะเป็นข้อมูลที่มีรูปแบบ JSON (มีเครื่องหมาย{" "}
                  <code>{"{}"}</code> เยอะๆ)
                </li>
              </ul>
              <div className="img-placeholder">
                <img
                  alt="ค้นหา API Request"
                  src={findApiRequestImg}
                  className="tutorial-img"
                />
                <p className="img-caption">
                  รูปตัวอย่าง: API requests จะมักมีชื่อที่เกี่ยวข้องกับข้อมูล
                </p>
              </div>
            </div>
          </div>

          <div className="api-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>คัดลอก URL ของ API</h4>
              <ul>
                <li>
                  คลิกขวาที่ Request แล้วเลือก{" "}
                  <strong>"Copy" → "Copy URL"</strong> หรือ{" "}
                  <strong>"คัดลอก" → "คัดลอก URL"</strong> 📋
                </li>
                <li>วาง URL ลงในช่อง URL API ด้านบนของแอปเราเลย!</li>
                <li>
                  ถ้า API ต้องการการยืนยันตัวตน (เช่น token) อาจจะใช้งานไม่ได้นะ
                  ให้ลองหา API แบบเปิด (public API) แทน
                </li>
              </ul>
              <div className="img-placeholder">
                <img
                  alt="คัดลอก URL API"
                  src={copyApiUrlImg}
                  className="tutorial-img"
                />
                <p className="img-caption">
                  รูปตัวอย่าง: คลิกขวาเพื่อคัดลอก URL ของ API request
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="tips-section">
          <h3>✨ ทิปส์เด็ดๆ สำหรับมือใหม่:</h3>
          <ul className="funky-list">
            <li>
              <span className="emoji-bullet">🧠</span>{" "}
              <strong>เว็บข่าว/บทความ:</strong> มักมี API
              ที่ดึงข้อมูลบทความล่าสุด ลองดูใน Network Tab ขณะเลื่อนดูหน้าเว็บ
            </li>
            <li>
              <span className="emoji-bullet">🛍️</span>{" "}
              <strong>เว็บ e-commerce:</strong> ลองค้นหาสินค้า แล้วดู Network
              Tab จะเห็น API ที่ส่งข้อมูลสินค้ามา
            </li>
            <li>
              <span className="emoji-bullet">🎵</span>{" "}
              <strong>เว็บสตรีมมิ่ง:</strong> เว็บเพลง/หนัง มักมี API
              ที่ดึงข้อมูลคอนเทนต์ยอดนิยม/แนะนำ
            </li>
            <li>
              <span className="emoji-bullet">📊</span>{" "}
              <strong>เว็บข้อมูล/กราฟ:</strong> ลองกดดูกราฟต่างๆ แล้วจับ API
              ที่ส่งข้อมูลตัวเลขมาแสดงผล
            </li>
          </ul>
        </div>

        <div className="public-apis">
          <h3>🌟 แนะนำ API สาธารณะน่าลอง:</h3>
          <div className="api-examples">
            <div className="api-card">
              <h4>ข้อมูลโควิด-19 ประเทศไทย</h4>
              <code>
                https://covid19.ddc.moph.go.th/api/Cases/today-cases-all
              </code>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    "https://covid19.ddc.moph.go.th/api/Cases/today-cases-all"
                  )
                }
                className="copy-btn"
              >
                คัดลอก 📋
              </button>
            </div>

            <div className="api-card">
              <h4>ข้อมูลจังหวัดในไทย</h4>
              <code>
                https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json
              </code>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json"
                  )
                }
                className="copy-btn"
              >
                คัดลอก 📋
              </button>
            </div>

            <div className="api-card">
              <h4>ข้อมูลพยากรณ์อากาศ</h4>
              <code>
                https://data.tmd.go.th/nwpapi/v1/forecast/location/daily/at?lat=13.67&lon=100.54&fields=tc,rain
              </code>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    "https://data.tmd.go.th/nwpapi/v1/forecast/location/daily/at?lat=13.67&lon=100.54&fields=tc,rain"
                  )
                }
                className="copy-btn"
              >
                คัดลอก 📋
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiEducation;
