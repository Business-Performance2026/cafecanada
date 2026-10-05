# Café QR — منصة طلبات الكوفيهات عبر QR

منصة للكوفيهات في كندا: كل كوفي له صفحة قائمة خاصة برابط ورمز QR، العميل يمسح ويطلب ويتابع حالة طلبه مباشرة، وصاحب الكوفي يدير كل شيء من لوحة تحكم خاصة. الواجهة بالإنجليزية والفرنسية (يفتح إنجليزي افتراضياً)، ولوحة الأدمن بالإنجليزية والعربية.

## المميزات

- **العملاء (بدون تسجيل):** قائمة الكوفي بهويته (شعار، خلفية، لون)، تصنيفات وصور وخيارات (حجم/إضافات)، سلة وطلب، تتبع مباشر لحالة الطلب (استلام → تحضير → جاهز)
- **صاحب الكوفي:** لوحة تحكم — إدارة الطلبات مباشرة، بناء القائمة، رفع الشعار والخلفية، رابط + QR قابل للتحميل، إحصائيات
- **الأدمن:** إدارة كل الكوفيهات (تفعيل/إيقاف/حذف) — بواجهة عربية/إنجليزية

## التقنيات

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
Firebase: Authentication (Email/Password) + Firestore + Storage

## الإعداد (5 دقائق)

### 1. أنشئ مشروع Firebase

1. ادخل [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. من **Build → Authentication → Sign-in method** فعّل **Email/Password**
3. من **Build → Firestore Database** أنشئ قاعدة بيانات (وضع Production)
4. من **Build → Storage** فعّل التخزين
5. من **Project settings → Your apps** أضف Web app وانسخ بيانات الإعداد

### 2. أدخل بيانات الإعداد

```bash
cp .env.example .env
# عدّل .env وضع قيم مشروعك
```

### 3. انشر قواعد الأمان

- Firebase Console → **Firestore → Rules**: الصق محتوى `firestore.rules` واضغط Publish
- **Storage → Rules**: الصق محتوى `storage.rules` واضغط Publish

### 4. عيّن نفسك كأدمن

بعد ما تنشئ حسابك من صفحة الدخول:
- Firestore → collection `users` → مستند الـ UID الخاص بك → غيّر `role` إلى `"admin"`

### 5. شغّل المشروع

```bash
npm install
npm run dev      # تطوير على http://localhost:3000
npm run build    # بناء للنشر → مجلد dist/
```

## النشر

المشروع SPA ثابت — يشتغل على أي استضافة ملفات:

- **Firebase Hosting**: `npm install -g firebase-tools && firebase init hosting` (اختر `dist` و "configure as single-page app: Yes") ثم `firebase deploy`
- **Vercel / Netlify**: ارفع المستودع، build command: `npm run build`، output: `dist`، وأضف rewrite rule: `/* → /index.html`
- لا تنسَ إضافة متغيرات البيئة `VITE_FIREBASE_*` في إعدادات الاستضافة

## الرفع على GitHub

`.gitignore` جاهز — يستثني `.env` و `node_modules` و `dist` تلقائياً:

```bash
git init
git add .
git commit -m "Café QR platform"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## بنية البيانات (Firestore)

```
users/{uid}                    — { email, role: "user" | "admin" }
cafes/{id}                     — { ownerId, slug, nameEn, nameFr, descriptionEn/Fr, address, phone, logoUrl, bannerUrl, themeColor, isActive, createdAt }
categories/{id}                — { cafeId, nameEn, nameFr, sortOrder }
menuItems/{id}                 — { cafeId, categoryId, nameEn, nameFr, descriptionEn/Fr, priceCents, imageUrl, sizes[], extras[], isAvailable, sortOrder }
orders/{id}                    — { cafeId, orderNumber, customerName, notes, status, totalCents, createdAt }
orders/{id}/items/{itemId}     — { itemNameEn, itemNameFr, unitPriceCents, quantity, optionsText }
```

## ملاحظات

- الدفع الإلكتروني غير مفعّل حالياً (الدفع عند الاستلام) — جاهز للإضافة لاحقاً
- الأسعار بالدولار الكندي CAD
