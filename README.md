# تطبيق قائمة الكوفيات (Multi-tenant)

## الملفات
- `firebase-config.js` — إعدادات Firebase (لازم تعبي بياناتك الحقيقية)
- `menu.html` — الصفحة العامة اللي يشوفها الزبون (`menu.html?shop=UID`)
- `login.html` — دخول أصحاب الكوفيات
- `dashboard.html` — لوحة تحكم صاحب الكوفي (إضافة/تعديل/حذف أصناف + رفع صور)
- `styles.css` — التصميم المشترك لكل الصفحات

## خطوات الإعداد

### 1. أنشئ مشروع Firebase
console.firebase.google.com → Add project

### 2. فعّل الخدمات
- **Authentication** → Sign-in method → فعّل Email/Password
- **Firestore Database** → Create database → Start in production mode
- **Storage** → Get started

### 3. عبّي `firebase-config.js`
من Project Settings → General → Your apps → Web app، انسخ القيم الحقيقية.

### 4. طبّق قواعد الأمان

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shops/{shopId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == shopId;
      match /menu/{itemId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == shopId;
      }
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /shops/{shopId}/{allImages=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == shopId;
    }
  }
}
```

### 5. أضف كوفي جديد (تكررها لكل عميل)
1. Authentication → Users → Add user (إيميل + باسورد) → انسخ الـ **UID**
2. Firestore → Start collection `shops` → Document ID = **نفس الـ UID بالضبط**
3. جوا الـ document، ضيف حقل `info` (map) فيه:
   ```
   name: "قهوة الروضة"
   logo: "" (رابط صورة، اختياري)
   primaryColor: "#8B5A2B"
   location: "مسقط"
   subscriptionStatus: "active"
   ```

### 6. جرب
- لوحة التحكم: `dashboard.html` (سجل دخول بإيميل الكوفي)
- القائمة العامة: `menu.html?shop=UID_تبع_الكوفي`
- ولد QR كود من أي موقع مجاني (مثل qr-code-generator.com) يشاور على رابط `menu.html?shop=...`

## النشر على GitHub Pages
1. ارفع الملفات لمستودع GitHub
2. Settings → Pages → اختر الفرع (branch) الرئيسي
3. راح يعطيك رابط زي: `https://username.github.io/repo-name/menu.html?shop=UID`
