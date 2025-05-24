let prayerData = {};  // سيحمل بيانات جميع المدن

// تحميل بيانات الصلاة لكل مدينة وإعداد القائمة
async function loadPrayerData() {
  const cities = [
    { name: "بغداد", file: "times_baghdad.json" },
    { name: "نجف",   file: "times_najaf.json"   }
  ];

  const select = document.getElementById('citySelect');
  for (const city of cities) {
    try {
      const res = await fetch(city.file);
      const data = await res.json();
      prayerData[city.name] = data;

      const opt = document.createElement('option');
      opt.value = city.name;
      opt.textContent = city.name;
      select.appendChild(opt);

    } catch (err) {
      console.error(`خطأ في تحميل بيانات ${city.name}:`, err);
    }
  }

  updatePrayerTimes();
  select.addEventListener('change', updatePrayerTimes);
}

// صيغة الوقت 24 → 12 مع ص/م عربي
function formatTime12(time24) {
  const [hh, mm] = time24.split(':').map(Number);
  const period = hh < 12 ? 'ص' : 'م';
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${mm.toString().padStart(2,'0')} ${period}`;
}

// مفتاح اليوم الحالي YYYY-MM-DD
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// أسماء الصلوات بالعربي
const prayerNames = {
  fajr:     'الفجر',
  sunrise:  'الشروق',
  dhuhr:    'الظهر',
  // asr:      'العصر',
  maghrib:  'المغرب',
  // isha:     'العشاء'
};

// عرض أوقات الصلاة والوقت المتبقي للصلاة القادمة
function updatePrayerTimes() {
  const city = document.getElementById('citySelect').value;
  const today = getTodayKey();
  const cityData = prayerData[city] || {};
  const todayTimes = cityData[today] || {};

  // نبنّي قائمة الصلوات بترتيبها
  const order = ['fajr','sunrise','dhuhr','maghrib',];
  let html = `<h3>🕌 أوقات الصلاة (${city})</h3>`;
  for (const key of order) {
    const t = todayTimes[key] || '--:--';
    html += `<p>${prayerNames[key]}: ${formatTime12(t)}</p>`;
  }

  // حساب الصلاة القادمة
  const now = new Date();
  let nextName = null, diffMs = null;
  for (const key of order) {
    if (!todayTimes[key]) continue;
    const [h,m] = todayTimes[key].split(':').map(Number);
    const prayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (prayTime > now) {
      nextName = prayerNames[key];
      diffMs = prayTime - now;
      break;
    }
  }
  // إذا انتهت الصلوات اليوم، نأخذ فجر الغد
  if (!nextName) {
    const tm = new Date(now);
    tm.setDate(tm.getDate() + 1);
    const tomorrowKey = `${tm.getFullYear()}-${String(tm.getMonth()+1).padStart(2,'0')}-${String(tm.getDate()).padStart(2,'0')}`;
    const ft = (prayerData[city][tomorrowKey] || {}).fajr;
    if (ft) {
      const [h,m] = ft.split(':').map(Number);
      const prayTime = new Date(tm.getFullYear(), tm.getMonth(), tm.getDate(), h, m);
      nextName = prayerNames.fajr;
      diffMs = prayTime - now;
    }
  }

  // نضيف فقرة الوقت المتبقي
  if (diffMs != null) {
    const totalMins = Math.floor(diffMs / 1000 / 60);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    html += `<p style="margin-top:1em; font-weight:bold;">
               الوقت المتبقي لـ ${nextName}: ${hrs} ساعة و ${mins} دقيقة
             </p>`;
  }

  document.getElementById("prayerTimes").innerHTML = html;
}

// دوال ثابتة بلا تغيير
function updateDate() {
  const d = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("dateDisplay").innerHTML = `
    📅 هجري: ${d.toLocaleDateString('ar-SA-u-ca-islamic', opts)}<br/>
    📆 ميلادي: ${d.toLocaleDateString('ar-EG', opts)}
  `;
}
// إظهار/إخفاء معرض الصفحات داخل المحتوى الرئيسي
function toggleWebLinks() {
  const box = document.getElementById("webLinks");
  box.style.display = box.style.display === "block" ? "none" : "block";
}

// فتح الصفحة داخل صفحة التطبيق الكاملة
function openPage(url) {
  // أخفِ المحتوى الرئيسي
  document.getElementById("appContent").style.display = "none";
  // جهّز iframe وأظهره
  const frame = document.getElementById("webFrame");
  frame.src = url;
  document.getElementById("pageView").style.display = "block";
}

// إغلاق صفحة العرض والعودة للرئيسية
function closePage() {
  // نظّف src حتى لا تستمر الصفحة في التحميل
  document.getElementById("webFrame").src = "";
  // أخفِ حاوية العرض
  document.getElementById("pageView").style.display = "none";
  // أعد إظهار المحتوى الرئيسي
  document.getElementById("appContent").style.display = "block";
}

const reminders = [
  "لا تنسَ دعاء الفرج 🍃",
  "صِل رحمك اليوم ✉️",
  "اجعل لك ورداً من القرآن 📖",
  "تفقد جارك ولو برسالة 💬",
  "صلِّ على محمد وآل محمد 💚"
];

function showReminder() {
  const random = reminders[Math.floor(Math.random() * reminders.length)];
  const box = document.getElementById("reminderBox");
  const text = document.getElementById("reminderText");
  text.textContent = random;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 30000); // تختفي بعد 30 ثانية
}

function closeReminder() {
  document.getElementById("reminderBox").style.display = "none";
}

// بدء التشغيل
window.onload = () => {
  updateDate();
  loadPrayerData();
  showReminder();
};
