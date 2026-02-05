# Security & Maintenance Guide (ระบบความปลอดภัยและดูแลรักษา)

## 1. SSL / HTTPS Setup
เพื่อให้เว็บไซต์มีความปลอดภัยสูงสุดและได้รับความน่าเชื่อถือ (รูปกุญแจสีเขียวบน Browser) จำเป็นต้องติดตั้ง SSL Certificate

### สำหรับการนำขึ้นโฮสติ้งจริง (Production):
1.  **Cloudflare (แนะนำ)**: สมัครใช้งาน Cloudflare ฟรี และเปลี่ยน Nameservers ของโดเมนมาที่ Cloudflare จากนั้นเปิดโหมด "Always Use HTTPS" ในเมนู SSL/TLS > Edge Certificates
2.  **Hosting Provider**: แจ้งผู้ให้บริการ Hosting เพื่อขอเปิดใช้งาน Let's Encrypt SSL (ส่วนใหญ่ฟรี)

### การตรวจสอบในโค้ด (Forced HTTPS):
หากต้องการบังคับให้เปลี่ยน HTTP เป็น HTTPS อัตโนมัติ สามารถเพิ่ม Script นี้ที่ส่วนบนสุดของ `head` ในทุกหน้า:
```javascript
if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    location.replace(`https://${location.hostname}${location.pathname}${location.search}`);
}
```

## 2. Backup & Restore (การสำรองข้อมูล)
ข้อมูลทั้งหมดของระบบ (สินค้า, ออเดอร์, สมาชิก) ถูกเก็บไว้ใน Browser Storage (LocalStorage) ของเครื่อง Admin

### วิธีการสำรองข้อมูล:
1.  เข้าสู่ระบบ **Admin Dashboard**
2.  ไปที่เมนู **ตั้งค่า (Settings)** -> แถบด้านล่างสุด
3.  กดปุ่ม **"ดาวน์โหลดข้อมูล (Backup)"**
4.  ไฟล์ `.json` จะถูกดาวน์โหลดลงเครื่อง เก็บไฟล์นี้ไว้ในที่ปลอดภัย (เช่น Google Drive)

### วิธีการกู้คืนข้อมูล:
1.  กดปุ่ม **"กู้คืนข้อมูล (Restore)"**
2.  เลือกไฟล์ `.json` ที่เคย Backup ไว้
3.  ระบบจะรีเฟรชและนำข้อมูลเดิมกลับมาทั้งหมด

## 3. Spam & Bot Protection (ป้องกันสแปม)
ระบบมีการป้องกันด้วยเทคนิค **Honeypot** ในหน้า Login และแบบฟอร์มสำคัญ
-   **Honeypot**: ช่องกรอกข้อมูลที่ซ่อนไว้ด้วย CSS (User มองไม่เห็น แต่ Bot มองเห็น) หากมีการกรอกข้อมูลในช่องนี้ ระบบจะถือว่าเป็น Bot และปฏิเสธคำขอทันที

## 4. Role-Based Access Control (สิทธิ์การใช้งาน)
-   **Admin (ผู้จัดการ)**: จัดการได้ทุกอย่าง (เพิ่ม/ลบ สินค้า, จัดการพนักงาน)
-   **Staff (พนักงาน)**:
    -   ดูรายการสั่งซื้อ, อัปเดตสถานะจัดส่งได้
    -   แก้ไขสต็อกสินค้าได้
    -   **ไม่สามารถ** ลบสินค้าออกจากระบบ
    -   **ไม่สามารถ** ลบผู้ใช้งาน Admin คนอื่น
    -   **ไม่สามารถ** เข้าถึงเมนูการเงิน (Financial Stats) และการตั้งค่าระบบ (Settings)
