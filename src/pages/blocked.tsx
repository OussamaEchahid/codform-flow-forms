import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * صفحة الحظر للمستخدمين المحظورين من متجر Shopify
 */
export default function BlockedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const { reason, shop, ip } = router.query;

  useEffect(() => {
    // العد التنازلي للإغلاق
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="blocked-page">
      <div className="container">
        <div className="icon">🛡️</div>
        <h1>تم حظر الوصول</h1>
        <div className="subtitle">Access to Store Blocked</div>
        
        <div className="message">
          <p>عذراً، لا يمكنك الوصول إلى المتجر من عنوان IP الخاص بك.</p>
          <p>Sorry, you cannot access the store from your current IP address.</p>
        </div>

        {reason && (
          <div className="reason">
            <strong>سبب الحظر / Reason:</strong><br>
            {reason}
          </div>
        )}

        {shop && (
          <div className="shop-info">
            <strong>المتجر المحمي / Protected Store:</strong><br>
            {shop}
          </div>
        )}

        {ip && (
          <div className="ip-info">
            <strong>عنوان IP / IP Address:</strong><br>
            {ip}
          </div>
        )}

        <div className="protection-info">
          <h3>🔒 حماية متقدمة ضد البريد العشوائي</h3>
          <p>هذا المتجر محمي بنظام متقدم ضد:</p>
          <ul>
            <li>البريد العشوائي والرسائل المزعجة</li>
            <li>الأنشطة المشبوهة والاحتيالية</li>
            <li>الهجمات الإلكترونية والبوتات</li>
            <li>المحاولات الضارة للوصول</li>
          </ul>
        </div>

        <div className="contact-info">
          <h3>📞 تحتاج مساعدة؟</h3>
          <p>إذا كنت تعتقد أن هذا خطأ، يمكنك:</p>
          <ul>
            <li>الاتصال بإدارة المتجر</li>
            <li>إرسال بريد إلكتروني للدعم الفني</li>
            <li>المحاولة من شبكة إنترنت أخرى</li>
          </ul>
        </div>

        <div className="countdown-info">
          <p>سيتم إغلاق هذه النافذة تلقائياً خلال <strong>{countdown}</strong> ثانية</p>
          <p>This window will close automatically in <strong>{countdown}</strong> seconds</p>
        </div>

        <button 
          onClick={() => window.close()} 
          className="close-button"
        >
          إغلاق / Close
        </button>
      </div>

      <style jsx>{`
        .blocked-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: white;
          padding: 2rem;
        }

        .container {
          max-width: 700px;
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          padding: 3rem;
          backdrop-filter: blur(15px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .icon {
          font-size: 6rem;
          margin-bottom: 1.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
          color: #ff6b6b;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .subtitle {
          font-size: 1.3rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          font-weight: 300;
        }

        .message {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .reason, .shop-info, .ip-info {
          background: rgba(255, 255, 255, 0.2);
          padding: 1.5rem;
          border-radius: 15px;
          margin: 1.5rem 0;
          border-left: 4px solid #ff6b6b;
          text-align: left;
        }

        .protection-info, .contact-info {
          background: rgba(255, 255, 255, 0.15);
          padding: 2rem;
          border-radius: 15px;
          margin: 2rem 0;
          text-align: left;
        }

        .protection-info h3, .contact-info h3 {
          color: #4CAF50;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }

        .protection-info ul, .contact-info ul {
          list-style: none;
          padding: 0;
        }

        .protection-info li, .contact-info li {
          padding: 0.5rem 0;
          padding-right: 1.5rem;
          position: relative;
        }

        .protection-info li:before {
          content: "🔒";
          position: absolute;
          right: 0;
        }

        .contact-info li:before {
          content: "✅";
          position: absolute;
          right: 0;
        }

        .countdown-info {
          background: rgba(76, 175, 80, 0.3);
          padding: 1.5rem;
          border-radius: 15px;
          margin: 2rem 0;
          border-left: 4px solid #4CAF50;
        }

        .close-button {
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 2rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .close-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }

        @media (max-width: 768px) {
          .container {
            padding: 2rem;
            margin: 1rem;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .icon {
            font-size: 4rem;
          }
        }
      `}</style>
    </div>
  );
}
