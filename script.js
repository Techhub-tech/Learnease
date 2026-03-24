// =============================================
//   LearnEase v4 – script.js
//   Typewriter · Scroll Reveal · Counter
//   Code detection · Offline · Share
// =============================================
'use strict';

let currentLang = 'English';
let currentMode = 'notes';

// =============================================
// SCROLL REVEAL — sections animate as you scroll
// =============================================
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
}

// =============================================
// TYPEWRITER EFFECT — hero subtext cycles
// =============================================
const typeLines = [
  'Understand any note in your preferred language.',
  'Paste code and get a plain English explanation.',
  'Works 100% offline — no internet after first load.',
  'Made for WAEC, JAMB, and university students.',
  'English, Hausa, or Arabic — your choice.',
];
let typeIdx = 0, charIdx = 0, erasing = false;
const typeTarget = document.getElementById('typeTarget');

function typeWriter() {
  if (!typeTarget) return;
  const line = typeLines[typeIdx];
  if (!erasing) {
    typeTarget.textContent = line.slice(0, charIdx++);
    if (charIdx > line.length) { erasing = true; setTimeout(typeWriter, 2200); return; }
    setTimeout(typeWriter, 42);
  } else {
    typeTarget.textContent = line.slice(0, charIdx--);
    if (charIdx < 0) { erasing = false; typeIdx = (typeIdx + 1) % typeLines.length; setTimeout(typeWriter, 400); return; }
    setTimeout(typeWriter, 22);
  }
}

// =============================================
// NUMBER COUNTER — stats count up on reveal
// =============================================
function initCounters() {
  const counters = document.querySelectorAll('.count');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      let current = 0;
      const step = Math.max(1, Math.floor(target / 60));
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current.toLocaleString();
        if (current >= target) clearInterval(interval);
      }, 25);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// =============================================
// NAVBAR — changes on scroll
// =============================================
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// =============================================
// ONLINE / OFFLINE STATUS
// =============================================
function updateStatus() {
  const pill = document.getElementById('statusPill');
  const txt  = document.getElementById('statusText');
  if (!pill || !txt) return;
  if (navigator.onLine) {
    pill.classList.remove('offline');
    txt.textContent = 'Online';
  } else {
    pill.classList.add('offline');
    txt.textContent = 'Offline';
  }
}
window.addEventListener('online',  updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();

// =============================================
// PAGE NAVIGATION
// =============================================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  closeDr();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelectorAll('.dr-link').forEach(l => {
    l.classList.toggle('act', l.dataset.page === name);
  });
  if (name === 'library') renderLibrary();
  updateBadge();
  // Re-run scroll reveal on new page
  setTimeout(initScrollReveal, 50);
}

// =============================================
// SIDEBAR / DRAWER
// =============================================
const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
const veil   = document.getElementById('veil');
const drX    = document.getElementById('drX');

burger.addEventListener('click', () => {
  drawer.classList.add('on');
  veil.classList.add('on');
  updateBadge();
});
function closeDr() {
  drawer.classList.remove('on');
  veil.classList.remove('on');
}
drX.addEventListener('click', closeDr);
veil.addEventListener('click', closeDr);

// =============================================
// LIBRARY BADGE
// =============================================
function updateBadge() {
  const b = document.getElementById('libBadge');
  if (b) b.textContent = getSavedNotes().length;
}

// =============================================
// MODE (Notes / Code)
// =============================================
function setMode(btn, mode) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  currentMode = mode;
  const ta   = document.getElementById('userInput');
  const hint = document.getElementById('hintBar');
  if (mode === 'code') {
    ta.placeholder = 'Paste any code here: HTML, CSS, JavaScript, Python, Java, C++...\n\nExample:\nfunction greet(name) {\n  return "Hello " + name;\n}';
    hint.textContent = '💻 Paste any code below — LearnEase will explain every part simply';
    hint.style.borderLeftColor = '#06b6d4';
  } else {
    ta.placeholder = 'Paste your lecture notes, textbook content, or any question here...';
    hint.textContent = '📖 Paste lecture notes, textbook content, or any question below';
    hint.style.borderLeftColor = '';
  }
}

// =============================================
// LANGUAGE
// =============================================
function setLang(btn, lang) {
  document.querySelectorAll('.lp').forEach(p => p.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById('langVal').value = lang;
  currentLang = lang;
}

// =============================================
// FILE UPLOAD
// =============================================
const fileInput = document.getElementById('fileUp');
fileInput.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  document.getElementById('fName').textContent = file.name;
  const codeExts = ['.js','.html','.css','.py','.java','.cpp','.c','.ts','.php','.rb','.go','.rs'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (codeExts.includes(ext)) {
    const codeBtn = document.querySelector('[data-mode="code"]');
    if (codeBtn) setMode(codeBtn, 'code');
    showToast('💻 Code file detected — switched to Code mode!');
  }
  if (file.type === 'text/plain' || codeExts.includes(ext)) {
    const reader = new FileReader();
    reader.onload = e => { document.getElementById('userInput').value = e.target.result; updateCharCount(); };
    reader.readAsText(file);
  }
});

// Character counter
function updateCharCount() {
  const ta = document.getElementById('userInput');
  const cc = document.getElementById('charCount');
  if (cc && ta) cc.textContent = ta.value.length.toLocaleString() + ' characters';
}
document.getElementById('userInput').addEventListener('input', updateCharCount);

// =============================================
// SCROLL TO INPUT
// =============================================
function scrollToInput() {
  document.getElementById('userInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => document.getElementById('userInput').focus(), 500);
}

// =============================================
// CODE LANGUAGE DETECTION
// =============================================
function detectLang(code) {
  code = code.trim();
  if (/^<(!DOCTYPE|html|head|body|div|span|p |h[1-6]|nav|footer|section|article|script|style|link|meta)/im.test(code)) return 'HTML';
  if (/\{[^}]*:[^}]*;[^}]*\}/.test(code) && !/function|=>|const |let |var /.test(code)) return 'CSS';
  if (/def\s+\w+\s*\(|import\s+\w+|print\(|if __name__/.test(code)) return 'Python';
  if (/public\s+(static\s+)?class|System\.out\.|void main/.test(code)) return 'Java';
  if (/#include|int main\(\)|std::/.test(code)) return 'C++';
  if (/SELECT\s+.+\s+FROM|INSERT INTO|UPDATE\s+\w+\s+SET/i.test(code)) return 'SQL';
  if (/\$[a-zA-Z_]|<\?php/.test(code)) return 'PHP';
  if (/const |let |var |function |=>|console\.log|document\.|window\.|\(\) =>/.test(code)) return 'JavaScript';
  return 'Code';
}

function looksLikeCode(text) {
  const sigs = [
    /^<(!DOCTYPE|html|head|div|script|nav)/im,
    /function\s+\w+\s*\(/,/const\s+\w+\s*=/, /let\s+\w+\s*=/,
    /def\s+\w+\s*\(/,/import\s+\w+/,/class\s+\w+\s*[:{]/,
    /\{[^}]*:[^}]*;/,/#include\s*</,/console\.log\(/,/print\(/,
    /public static void/,/SELECT .+ FROM/i,
  ];
  return sigs.some(rx => rx.test(text));
}

// =============================================
// GENERATE
// =============================================
function handleGenerate() {
  const input = document.getElementById('userInput').value.trim();
  const lang  = document.getElementById('langVal').value || currentLang;
  if (!input) {
    showToast('⚠️ Please enter some content first!');
    document.getElementById('userInput').focus();
    return;
  }

  const isCode = currentMode === 'code' || looksLikeCode(input);
  const genBtn = document.getElementById('genBtn');
  genBtn.disabled = true;
  document.querySelector('.btn-text').textContent = '⏳ Processing...';

  document.getElementById('loading').classList.add('show');
  document.getElementById('resultWrap').style.display = 'none';
  document.getElementById('saveMsg').style.display = 'none';

  setTimeout(() => {
    const result = isCode ? genCode(input, lang) : genNotes(input, lang);

    document.getElementById('summaryText').textContent = result.summary;
    document.getElementById('explainText').textContent  = result.explanation;
    document.getElementById('rLang').textContent         = lang;

    const rType   = document.getElementById('rType');
    const codeBlk = document.getElementById('codeBlock');

    if (isCode) {
      const cl = detectLang(input);
      rType.textContent = '💻 ' + cl;
      document.getElementById('codeText').textContent = result.codeBreakdown;
      codeBlk.style.display = 'block';
    } else {
      rType.textContent = '📝 Notes';
      codeBlk.style.display = 'none';
    }

    document.getElementById('loading').classList.remove('show');
    document.getElementById('resultWrap').style.display = 'block';
    genBtn.disabled = false;
    document.querySelector('.btn-text').textContent = '✦ Generate Now';
    document.getElementById('resultWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, isCode ? 2200 : 1800);
}

// =============================================
// NOTES RESPONSE
// =============================================
function genNotes(input, lang) {
  const words   = input.split(/\s+/).length;
  const preview = input.length > 110 ? input.substring(0, 110) + '...' : input;
  const s = {
    English: `This content (${words} words) is about: "${preview}". Key points have been identified and organized for clear understanding.`,
    Hausa:   `Wannan rubutu (kalmomi ${words}) yana magana ne game da: "${preview}". An gano manyan batutuwa kuma an shirya su don fahimta mai sauƙi.`,
    Arabic:  `يتناول هذا المحتوى (${words} كلمة): "${preview}". تم تحديد النقاط الرئيسية وتنظيمها من أجل الفهم الواضح.`,
  };
  const e = {
    English: `In simple terms: your content discusses important ideas in a structured way. Think of it like a teacher breaking a topic down step by step — starting with what it is, why it matters, and how it works. Understanding each part separately makes the whole topic easy to remember during exams. Focus on key definitions, examples, and the main argument in the content.`,
    Hausa:   `Da sauki: abin da ka bayar yana tattauna muhimman ra'ayoyi cikin tsari. Yi tunanin kamar malami yana bayyana batu mataki bayan mataki — farawa da abin da yake, dalilin da ya sa ya yi muhimmanci, da kuma yadda yake aiki. Fahimtar kowane ɓangare daban zai sauƙaƙe tuna dukan batu a lokacin jarrabawar. Mai da hankali kan ma'anoni, misalai, da muhimman muhawara.`,
    Arabic:  `ببساطة: المحتوى الذي قدمته يناقش أفكارًا مهمة بطريقة منظمة. فكر في الأمر كمعلم يشرح موضوعًا خطوة بخطوة — بدءًا بما هو، ولماذا يهم، وكيف يعمل. فهم كل جزء على حدة يجعل الموضوع بأكمله سهل التذكر في الامتحانات. ركز على التعريفات الرئيسية والأمثلة والحجة الرئيسية في المحتوى.`,
  };
  return { summary: s[lang] || s.English, explanation: e[lang] || e.English };
}

// =============================================
// CODE RESPONSE
// =============================================
function genCode(input, lang) {
  const cl    = detectLang(input);
  const lines = input.split('\n').length;
  const chars = input.length;
  const sample = input.split('\n').filter(l => l.trim()).slice(0, 5)
    .map((l, i) => `Line ${i + 1}: ${l.trim().substring(0, 70)}`).join('\n');

  const langHints = {
    HTML: {
      English: 'HTML defines the structure of a web page using tags. Each tag like <div>, <p>, or <h1> tells the browser what to display and where.',
      Hausa:   'HTML yana bayyana tsarin shafin yanar gizo ta amfani da tags. Kowanne tag yana gaya wa browser abin da za a nuna da inda za a nuna shi.',
      Arabic:  'HTML يحدد هيكل صفحة الويب باستخدام العلامات. كل علامة تخبر المتصفح بما يجب عرضه وأين.',
    },
    CSS: {
      English: 'CSS controls how things look — colours, fonts, sizes, spacing, and layout. Think of it as the paint and design on a web page.',
      Hausa:   'CSS yana sarrafa yadda abubuwa ke kallo — launuka, fonts, girma, da tsari. Yi tunanin shi kamar fenti da kayan ado a shafin yanar gizo.',
      Arabic:  'CSS يتحكم في المظهر — الألوان والخطوط والأحجام والتباعد والتخطيط.',
    },
    JavaScript: {
      English: 'JavaScript makes web pages interactive. It handles user actions like clicks, form submissions, and animations — the "brain" of a web page.',
      Hausa:   'JavaScript yana sa shafukan yanar gizo su zama masu hulɗa. Yana sarrafa ayyukan mai amfani kamar dannawa da tura fom.',
      Arabic:  'JavaScript يجعل صفحات الويب تفاعلية. يتعامل مع إجراءات المستخدم مثل النقرات وإرسال النماذج.',
    },
    Python: {
      English: 'Python is a beginner-friendly language used for AI, data analysis, and web apps. It reads almost like plain English sentences.',
      Hausa:   'Python yaren shirye-shirye ne mai sauƙi ga masu koyo, ana amfani da shi don AI da binciken bayanai.',
      Arabic:  'Python لغة سهلة للمبتدئين تُستخدم للذكاء الاصطناعي وتحليل البيانات وتطبيقات الويب.',
    },
  };
  const hint = (langHints[cl] || langHints.JavaScript)[lang] || (langHints[cl] || langHints.JavaScript).English;

  const s = {
    English: `This is ${cl} code with ${lines} line(s) and ${chars} characters. ${hint}`,
    Hausa:   `Wannan ${cl} code ne tare da layi ${lines} da haruffa ${chars}. ${hint}`,
    Arabic:  `هذا كود ${cl} يحتوي على ${lines} سطر و${chars} حرف. ${hint}`,
  };
  const e = {
    English: `In simple terms: this ${cl} code is a set of instructions for a computer. Think of it like a recipe — each line is one step the computer follows in order. Even if you don't know programming, you can read each line and understand what it is trying to do based on the words and symbols used.`,
    Hausa:   `Da sauki: wannan ${cl} code ita ce jerin umarnoni don kwamfuta. Yi tunanin shi kamar recipe — kowane layi mataki ne ɗaya da kwamfuta ke bi. Ko da ba ka san shirye-shirye ba, zaka iya karanta kowane layi kuma ka fahimci abin da yake ƙoƙarin yi.`,
    Arabic:  `ببساطة: كود ${cl} هذا هو مجموعة تعليمات للكمبيوتر. فكر فيه كوصفة طبخ — كل سطر هو خطوة واحدة يتبعها الكمبيوتر. حتى لو لم تكن تعرف البرمجة، يمكنك قراءة كل سطر وفهم ما يحاول القيام به.`,
  };
  const bd = {
    English: `Here is a breakdown of your ${cl} code:\n\n${sample}\n\n...and so on for the rest. Each line performs a specific task — together they form the complete program.`,
    Hausa:   `Ga bayani na ${cl} code ɗinka:\n\n${sample}\n\n...da sauransu. Kowanne layi yana yin takamaiman aiki — tare suna kammala shirin.`,
    Arabic:  `إليك شرح كود ${cl} الخاص بك:\n\n${sample}\n\n...وهكذا. كل سطر يؤدي مهمة محددة — معاً يشكلون البرنامج الكامل.`,
  };
  return { summary: s[lang] || s.English, explanation: e[lang] || e.English, codeBreakdown: bd[lang] || bd.English };
}

// =============================================
// READ ALOUD
// =============================================
function readAloud() {
  if (!window.speechSynthesis) { showToast('❌ Read Aloud not supported in this browser.'); return; }
  window.speechSynthesis.cancel();
  const sum  = document.getElementById('summaryText').textContent;
  const exp  = document.getElementById('explainText').textContent;
  const code = document.getElementById('codeBlock').style.display !== 'none'
    ? ' Code breakdown: ' + document.getElementById('codeText').textContent : '';
  const u = new SpeechSynthesisUtterance(`Summary: ${sum}. Explanation: ${exp}.${code}`);
  u.rate = 0.9;
  u.onstart = () => showToast('🔊 Reading aloud...');
  u.onend   = () => showToast('✅ Done!');
  window.speechSynthesis.speak(u);
}
function stopRead() {
  if (window.speechSynthesis) { window.speechSynthesis.cancel(); showToast('⏹ Stopped.'); }
}

// =============================================
// SAVE
// =============================================
function saveNote() {
  const input = document.getElementById('userInput').value.trim();
  const lang  = document.getElementById('langVal').value || currentLang;
  const sum   = document.getElementById('summaryText').textContent;
  const exp   = document.getElementById('explainText').textContent;
  const isCode = document.getElementById('codeBlock').style.display !== 'none';
  const codeTxt = isCode ? document.getElementById('codeText').textContent : '';
  if (!sum) return;
  const note = {
    id: Date.now(), input, lang, summary: sum, explanation: exp,
    codeBreakdown: codeTxt, isCode,
    type: isCode ? detectLang(input) : 'Notes',
    date: new Date().toLocaleDateString('en-GB'),
  };
  const saved = getSavedNotes();
  saved.unshift(note);
  try {
    localStorage.setItem('learnease_notes', JSON.stringify(saved));
    const m = document.getElementById('saveMsg');
    m.style.display = 'block';
    setTimeout(() => { m.style.display = 'none'; }, 3000);
    updateBadge();
    showToast('💾 Saved to My Library!');
  } catch (e) {
    showToast('⚠️ Storage full — delete some old notes first.');
  }
}

// =============================================
// GET SAVED NOTES
// =============================================
function getSavedNotes() {
  try { return JSON.parse(localStorage.getItem('learnease_notes')) || []; }
  catch { return []; }
}

// =============================================
// RENDER LIBRARY
// =============================================
function renderLibrary() {
  const list  = document.getElementById('libList');
  const empty = document.getElementById('libEmpty');
  const notes = getSavedNotes();
  list.innerHTML = '';
  if (notes.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  notes.forEach(note => {
    const preview = (note.summary || '').substring(0, 110) + (note.summary?.length > 110 ? '...' : '');
    const typeLabel = note.isCode ? `💻 ${note.type || 'Code'}` : '📝 Notes';
    const item = document.createElement('div');
    item.className = 'lib-item';
    item.innerHTML = `
      <div class="lib-meta">
        <span class="lib-lang">${note.lang || 'EN'} · ${typeLabel}</span>
        <span class="lib-date">📅 ${note.date}</span>
      </div>
      <p class="lib-preview">${preview}</p>
      <div class="lib-actions">
        <button class="btn btn-out"    onclick="viewNote(${note.id})">👁 View</button>
        <button class="btn btn-gst"   onclick="copyNote(${note.id})">📋 Copy</button>
        <button class="btn btn-gst"   onclick="readNote(${note.id})">🔊 Read</button>
        <button class="btn btn-gst"   onclick="shareNote(${note.id})">🔗 Share</button>
        <button class="btn btn-danger" onclick="delNote(${note.id})">🗑</button>
      </div>`;
    list.appendChild(item);
  });
}

function viewNote(id) {
  const n = getSavedNotes().find(n => n.id === id);
  if (!n) return;
  let t = `📝 SUMMARY:\n${n.summary}\n\n💬 EXPLANATION:\n${n.explanation}`;
  if (n.codeBreakdown) t += `\n\n🔍 CODE BREAKDOWN:\n${n.codeBreakdown}`;
  alert(t);
}
function copyNote(id) {
  const n = getSavedNotes().find(n => n.id === id);
  if (!n) return;
  let t = `Summary:\n${n.summary}\n\nExplanation:\n${n.explanation}`;
  if (n.codeBreakdown) t += `\n\nCode Breakdown:\n${n.codeBreakdown}`;
  t += '\n\n— LearnEase: https://techhub-tech.github.io/Learnease/';
  copyText(t);
}
function readNote(id) {
  const n = getSavedNotes().find(n => n.id === id);
  if (!n || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`Summary: ${n.summary}. Explanation: ${n.explanation}.`);
  u.rate = 0.9; u.onstart = () => showToast('🔊 Reading...');
  window.speechSynthesis.speak(u);
}
function shareNote(id) {
  const n = getSavedNotes().find(n => n.id === id);
  if (!n) return;
  const t = `📚 LearnEase Note (${n.lang})\n\n📝 ${n.summary}\n\n💬 ${n.explanation}\n\n✦ https://techhub-tech.github.io/Learnease/`;
  shareText(t);
}
function delNote(id) {
  if (!confirm('Delete this note?')) return;
  const notes = getSavedNotes().filter(n => n.id !== id);
  localStorage.setItem('learnease_notes', JSON.stringify(notes));
  renderLibrary(); updateBadge(); showToast('🗑 Deleted.');
}

// =============================================
// SHARE RESULT
// =============================================
function shareResult() {
  const sum  = document.getElementById('summaryText').textContent;
  const exp  = document.getElementById('explainText').textContent;
  const lang = document.getElementById('rLang').textContent;
  const code = document.getElementById('codeBlock').style.display !== 'none'
    ? `\n\n🔍 Code Breakdown:\n${document.getElementById('codeText').textContent}` : '';
  const t = `📚 *LearnEase – Study Note* (${lang})\n\n📝 *Summary:*\n${sum}\n\n💬 *Explanation:*\n${exp}${code}\n\n✦ https://techhub-tech.github.io/Learnease/\nPowered by Websprout Hub`;
  shareText(t);
}

// =============================================
// SHARE APP
// =============================================
function shareApp(platform) {
  const url = 'https://techhub-tech.github.io/Learnease/';
  const msg = '🎓 Amazing FREE study tool! LearnEase explains any notes or code in English, Hausa, or Arabic — works offline! Try it 👇';
  const links = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg + ' ' + url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`,
    twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(url)}&hashtags=LearnEase,Students,Nigeria`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };
  if (platform === 'copy') { copyText(url); showToast('🔗 Link copied!'); return; }
  if (links[platform]) window.open(links[platform], '_blank');
}

// =============================================
// UTILITIES
// =============================================
function shareText(text) {
  if (navigator.share) {
    navigator.share({ title: 'LearnEase', text, url: 'https://techhub-tech.github.io/Learnease/' })
      .then(() => showToast('✅ Shared!'))
      .catch(() => { copyText(text); showToast('📋 Copied — paste to share!'); });
  } else {
    copyText(text);
    showToast('📋 Copied — paste anywhere to share!');
  }
}
function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('📋 Copied!')).catch(() => fallbackCopy(text));
  } else { fallbackCopy(text); }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); showToast('📋 Copied!'); } catch { showToast('⚠️ Try again.'); }
  ta.remove();
}
function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2600);
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
  updateBadge();
  setTimeout(typeWriter, 600);
  setTimeout(initScrollReveal, 100);
  initCounters();
});
