# WinkWink Teachable Machine Demo

หน้าเว็บนี้ใช้โมเดล Teachable Machine Image จาก:

https://teachablemachine.withgoogle.com/models/gjm22PuJo/

## วิธีใช้งาน

1. เปิด local server ในโฟลเดอร์นี้

   ```powershell
   node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();http.createServer((req,res)=>{const file=path.join(root,req.url==='/'?'index.html':decodeURIComponent(req.url));fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});res.end(data);});}).listen(8000,()=>console.log('http://localhost:8000'));"
   ```

2. เปิด `http://localhost:8000`
3. กด `เริ่มสแกน`
4. อนุญาตให้ browser ใช้กล้อง

ผลลัพธ์จะแสดง class ที่มั่นใจที่สุด พร้อมเปอร์เซ็นต์ของทุก class ในโมเดล

## โค้ดจาก Teachable Machine Export

โค้ดตัวอย่างที่ได้จากโมเดลถูกบันทึกไว้ในโฟลเดอร์:

`นี่โมเดลจ้าาาา/index.html`

ถ้าต้องการใช้เวอร์ชันนี้ ให้วางไฟล์โมเดลที่ export มาไว้ใน:

`นี่โมเดลจ้าาาา/my_model/`

โดยในโฟลเดอร์นั้นควรมี `model.json`, `metadata.json`, และไฟล์ weights `.bin`
