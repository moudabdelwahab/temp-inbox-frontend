# Temp Inbox Frontend

نظام احترافي لاستقبال الإيميلات المؤقتة باستخدام Gmail Plus Addressing و Supabase

## 📋 نظرة عامة

**Temp Inbox** هو تطبيق ويب يسمح للمستخدمين بالحصول على عناوين بريد إلكترونية مؤقتة فوريًا دون الحاجة إلى إنشاء حساب. يتم توليد عنوان بريد فريد لكل جلسة باستخدام Gmail Plus Addressing (`user+RANDOM_ID@gmail.com`)، ويتم عرض الإيميلات الواردة في الوقت الفعلي.

## 🏗️ المعمارية

### Frontend (هذا المشروع)
- **HTML/CSS/JavaScript** فقط (بدون frameworks)
- واجهة مستخدم احترافية وسريعة الاستجابة
- إدارة الجلسات محليًا (localStorage)
- Polling و Real-time Subscriptions مع Supabase

### Backend (خارج النطاق)
- **Gmail API**: جلب الإيميلات من البريد الإلكتروني
- **Supabase**: تخزين الإيميلات وتوفير واجهة برمجية

## 📁 هيكل المشروع

```
temp-inbox-frontend/
├── index.html              # الصفحة الرئيسية
├── css/
│   └── styles.css         # أنماط CSS الاحترافية
├── js/
│   ├── config.js          # الإعدادات والثوابت
│   ├── utils.js           # دوال مساعدة
│   ├── supabase-client.js # عميل Supabase
│   ├── session-manager.js # إدارة الجلسات
│   ├── email-manager.js   # إدارة الإيميلات
│   ├── ui-manager.js      # إدارة الواجهة الأمامية
│   └── app.js             # التطبيق الرئيسي
└── README.md              # هذا الملف
```

## 🚀 البدء السريع

### المتطلبات
- متصفح حديث (Chrome, Firefox, Safari, Edge)
- اتصال بالإنترنت
- مفاتيح Supabase (URL و API Key)

### التثبيت

1. **استنساخ المشروع**
```bash
git clone https://github.com/your-username/temp-inbox-frontend.git
cd temp-inbox-frontend
```

2. **تكوين Supabase**
   - انسخ `config.js` وقم بتحديث متغيرات البيئة:
   ```javascript
   SUPABASE_URL: 'https://your-project.supabase.co'
   SUPABASE_KEY: 'your-anon-key'
   ```

3. **تشغيل التطبيق**
   - افتح `index.html` في المتصفح مباشرة أو استخدم خادم محلي:
   ```bash
   python -m http.server 8000
   # أو
   npx http-server
   ```

4. **الوصول للتطبيق**
   - افتح `http://localhost:8000` في المتصفح

## 🎯 الميزات

### ✅ إدارة الجلسات
- توليد معرّف جلسة فريد (UUID) تلقائيًا
- تخزين الجلسة في localStorage مع انتهاء الصلاحية
- توليد عنوان بريد فريد لكل جلسة

### 📧 إدارة الإيميلات
- جلب الإيميلات من Supabase
- عرض قائمة الإيميلات مع المعلومات الأساسية
- عرض محتوى الإيميل الكامل (HTML أو نص)
- تحديث فوري عند وصول إيميلات جديدة

### 🔄 التحديثات الفورية
- **Real-time Subscriptions**: الاشتراك في تحديثات Supabase الفورية
- **Polling**: جلب الإيميلات كل 5-10 ثوان كـ fallback
- **Adaptive Polling**: إيقاف الاستقصاء بعد فترة بدون تحديثات

### 🛡️ الأمان
- **Sanitization**: تنظيف محتوى HTML باستخدام DOMPurify
- منع هجمات XSS
- عدم استخدام `dangerouslySetInnerHTML`

### 📱 التصميم المستجيب
- دعم كامل للأجهزة المحمولة
- تصميم احترافي وحديث
- واجهة سهلة الاستخدام

## 🔧 التكوين

### ملف `config.js`
```javascript
const CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_KEY: 'your-anon-key',
    GMAIL_BASE_EMAIL: 'user@gmail.com',
    POLLING_INTERVAL: 5000,        // 5 ثوان
    SESSION_STORAGE_KEY: 'temp_inbox_session_id',
    SESSION_EXPIRY_HOURS: 24,
    TOAST_DURATION: 3000,
    EMAILS_TABLE: 'emails',
    MAX_EMAILS_DISPLAY: 50
};
```

## 📊 جدول Supabase

```sql
CREATE TABLE emails (
    id UUID PRIMARY KEY,
    session_id TEXT NOT NULL,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    received_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_emails_session_id ON emails(session_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
```

## 🎨 الواجهة الأمامية

### الأقسام الرئيسية

1. **Header**
   - اسم التطبيق والوصف
   - تصميم احترافي مع gradient

2. **Email Box**
   - عرض عنوان البريد المؤقت
   - أزرار نسخ وتحديث
   - معلومات الجلسة

3. **Inbox List**
   - قائمة الإيميلات المستقبلة
   - عرض المرسل والموضوع والوقت
   - تحديد الإيميل لعرض المحتوى

4. **Email Viewer**
   - عرض محتوى الإيميل الكامل
   - معلومات البريد (من، إلى، الموضوع، الوقت)
   - عرض HTML آمن أو نص عادي

## 🔌 واجهات برمجية

### SessionManager
```javascript
sessionManager.getSessionId()      // الحصول على معرّف الجلسة
sessionManager.getEmail()          // الحصول على عنوان البريد
sessionManager.regenerate()        // توليد جلسة جديدة
sessionManager.getInfo()           // الحصول على معلومات الجلسة
```

### EmailManager
```javascript
emailManager.fetchEmails(callback) // جلب الإيميلات
emailManager.selectEmail(id)       // تحديد إيميل
emailManager.getSelectedEmail()    // الحصول على الإيميل المحدد
emailManager.cleanup()             // تنظيف الموارد
```

### UIManager
```javascript
uiManager.updateEmailDisplay()     // تحديث عرض البريد
uiManager.updateEmailsList(emails) // تحديث قائمة الإيميلات
uiManager.showToast(message, type) // عرض إشعار
uiManager.displayEmailContent()    // عرض محتوى الإيميل
```

## 🐛 استكشاف الأخطاء

### فتح وحدة التحكم
اضغط `F12` أو `Ctrl+Shift+I` لفتح أدوات المطور

### الوصول إلى التطبيق
```javascript
// في وحدة التحكم
TempInboxApp.getStatus()           // حالة التطبيق
TempInboxApp.getEmails()           // قائمة الإيميلات
TempInboxApp.getSession()          // معلومات الجلسة
TempInboxApp.refreshInbox()        // تحديث صندوق الوارد
```

## 📝 ملاحظات مهمة

### ⚠️ الأمان
- **لا تشارك مفاتيح Supabase العامة** في الإنتاج
- استخدم متغيرات البيئة لتخزين المفاتيح
- قم بتقييد صلاحيات Supabase للقراءة فقط

### 🔄 التحديثات الفورية
- يعتمد التطبيق على Polling كـ fallback
- Real-time Subscriptions اختيارية
- يتكيف الاستقصاء تلقائيًا مع عدم وجود تحديثات جديدة

### 💾 التخزين المحلي
- تُخزن معرّفات الجلسة في localStorage
- تنتهي صلاحية الجلسات بعد 24 ساعة
- يمكن حذف الجلسة يدويًا من localStorage

## 🚀 النشر

### على Vercel
```bash
npm install -g vercel
vercel
```

### على GitHub Pages
```bash
git push origin main
# ثم قم بتفعيل GitHub Pages من الإعدادات
```

### على خادم مخصص
```bash
# انسخ جميع الملفات إلى خادمك
scp -r temp-inbox-frontend/* user@server:/var/www/html/
```

## 📚 المراجع

- [Supabase Documentation](https://supabase.com/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [MDN Web Docs](https://developer.mozilla.org/)

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License

## 👨‍💻 المساهمة

نرحب بالمساهمات! يرجى:
1. Fork المشروع
2. إنشاء فرع للميزة الجديدة
3. Commit التغييرات
4. Push إلى الفرع
5. فتح Pull Request

## 📞 التواصل

للأسئلة والاقتراحات، يرجى فتح Issue أو التواصل عبر البريد الإلكتروني.

---

**ملاحظة**: هذا المشروع يتطلب backend منفصل للتعامل مع Gmail API و Supabase. تأكد من أن الـ backend مُعد وجاهز قبل استخدام التطبيق.
