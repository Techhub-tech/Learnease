// =============================================
//   LearnEase v3 – script.js
//   Offline-first · Code detection · No server
// =============================================

'use strict';

// --- State ---
let currentLang = 'English';
let currentMode = 'notes'; // 'notes' | 'code'

// =============================================
// ONLINE / OFFLINE INDICATOR
// =============================================
function updateOnlineStatus() {
  const dot = document.getElementById('onlineDot');
  if (!dot) return;
  if (navigator.onLine) {
    dot.classList.remove('offline');
    dot.title = 'Online';
  } else {
    dot.classList.add('offline');
    dot.title = 'Offline – All features still work!';
  }
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// =============================================
// PAGE NAVIGATION
// =============================================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if (target) target.classList.add('active');
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Update sidebar active link
  document.querySelectorAll('.sb-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === name);
  });
  if (name === 'library') renderLibrary();
  updateLibBadge();
}

// =============================================
// SIDEBAR
// =============================================
const hamburger  = document.getElementById('hamburger');
const sidebar    = document.getElementById('sidebar');
const overlay    = document.getElementById('overlay');
const sbCloseBtn = document.getElementById('sbClose');

hamburger.addEventListener('click', () => {
  sidebar.classList.add('open');
  overlay.classList.add('active');
  updateLibBadge();
});

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}
sbCloseBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// =============================================
// LIBRARY BADGE COUNT
// =============================================
function updateLibBadge() {
  const badge = document.getElementById('libBadge');
  if (badge) badge.textContent = getSavedNotes().length;
}

// =============================================
// MODE TABS (Notes vs Code)
// =============================================
function setMode(btn, mode) {
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentMode = mode;

  const ta = document.getElementById('userInput');
  const notesHint = document.getElementById('notesHint');
  const codeHint  = document.getElementById('codeHint');

  if (mode === 'code') {
    ta.placeholder = 'Paste any code here: HTML, CSS, JavaScript, Python, Java, C++...\n\nExample:\nfunction greet(name) {\n  return "Hello " + name;\n}';
    notesHint.style.display = 'none';
    codeHint.style.display  = 'block';
  } else {
    ta.placeholder = 'Paste your lecture notes, textbook content, or any question here...';
    notesHint.style.display = 'block';
    codeHint.style.display  = 'none';
  }
}

// =============================================
// LANGUAGE PILLS
// =============================================
function setLang(btn, lang) {
  document.querySelectorAll('.lpill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('langVal').value = lang;
  currentLang = lang;
}

// =============================================
// FILE UPLOAD
// =============================================
document.getElementById('fileUpload').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  document.getElementById('fileName').textContent = file.name;

  // Auto-switch to code mode for code files
  const codeExts = ['.js','.html','.css','.py','.java','.cpp','.c','.ts','.php','.rb','.go','.rs','.swift'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (codeExts.includes(ext)) {
    const codeTab = document.querySelector('[data-mode="code"]');
    if (codeTab) setMode(codeTab, 'code');
    showToast('💻 Code file detected — switched to Code mode!');
  }

  // Read text files and fill textarea
  if (file.type === 'text/plain' || codeExts.includes(ext)) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('userInput').value = e.target.result;
    };
    reader.readAsText(file);
  }
});

// =============================================
// SCROLL TO INPUT
// =============================================
function scrollToInput() {
  document.getElementById('userInput').scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => document.getElementById('userInput').focus(), 400);
}

// =============================================
// CODE LANGUAGE DETECTOR
// =============================================
function detectCodeLanguage(code) {
  code = code.trim();
  if (/^<(!DOCTYPE|html|head|body|div|span|p|h[1-6]|script|style|link|meta)/i.test(code)) return 'HTML';
  if (/\{[\s\S]*:[\s\S]*;/.test(code) && !/function|=>|const|let|var/.test(code)) return 'CSS';
  if (/def |import |print\(|#.*python|if __name__/.test(code)) return 'Python';
  if (/public (static|class)|System\.out|void main/.test(code)) return 'Java';
  if (/#include|int main\(\)|std::/.test(code)) return 'C++';
  if (/const |let |var |function |=>|console\.log|document\.|window\./.test(code)) return 'JavaScript';
  if (/\$[a-z_]/i.test(code) && /<\?php/.test(code)) return 'PHP';
  if (/SELECT|FROM|WHERE|INSERT|UPDATE|DELETE/i.test(code)) return 'SQL';
  return 'Code';
}

// =============================================
// DETECT IF INPUT IS CODE (auto-detect even in notes mode)
// =============================================
function looksLikeCode(text) {
  const codeSignals = [
    /^<(!DOCTYPE|html|head|div|script)/im,
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=/,
    /let\s+\w+\s*=/,
    /def\s+\w+\s*\(/,
    /import\s+\w+/,
    /class\s+\w+\s*[:{]/,
    /\{[\s\S]*?:[\s\S]*?;[\s\S]*?\}/,
    /#include\s*</,
    /console\.log\(/,
    /print\(/,
    /public static void/,
    /SELECT .+ FROM/i,
  ];
  return codeSignals.some(rx => rx.test(text));
}

// =============================================
// GENERATE — MAIN FUNCTION
// =============================================
function handleGenerate() {
  const input = document.getElementById('userInput').value.trim();
  const lang  = document.getElementById('langVal').value || currentLang;

  if (!input) {
    showToast('⚠️ Please enter some content first!');
    document.getElementById('userInput').focus();
    return;
  }

  // Auto-detect code even in notes mode
  const isCode = currentMode === 'code' || looksLikeCode(input);

  const genBtn = document.getElementById('genBtn');
  genBtn.disabled = true;
  genBtn.textContent = '⏳ Processing...';

  document.getElementById('loading').classList.add('show');
  document.getElementById('resultWrap').style.display = 'none';
  document.getElementById('saveMsg').style.display = 'none';

  // Simulate processing (in production you'd call an API here)
  const delay = isCode ? 2200 : 1800;

  setTimeout(() => {
    const result = isCode
      ? generateCodeResponse(input, lang)
      : generateNotesResponse(input, lang);

    // Fill results
    document.getElementById('summaryText').textContent     = result.summary;
    document.getElementById('explanationText').textContent = result.explanation;
    document.getElementById('resultLang').textContent      = lang;

    const typeBadge = document.getElementById('rtypeBadge');
    const codeBlock = document.getElementById('codeResultBlock');

    if (isCode) {
      typeBadge.textContent = '💻 ' + detectCodeLanguage(input);
      document.getElementById('codeExplainText').textContent = result.codeBreakdown;
      codeBlock.style.display = 'block';
    } else {
      typeBadge.textContent = '📝 Notes';
      codeBlock.style.display = 'none';
    }

    document.getElementById('loading').classList.remove('show');
    document.getElementById('resultWrap').style.display = 'block';

    genBtn.disabled = false;
    genBtn.textContent = '✦ Generate Now';

    document.getElementById('resultWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, delay);
}

// =============================================
// NOTES RESPONSE GENERATOR
// =============================================
function generateNotesResponse(input, lang) {
  const words = input.split(/\s+/).length;
  const preview = input.length > 120 ? input.substring(0, 120) + '...' : input;

  const summaries = {
    English: `This content (${words} words) covers: "${preview}". The key points have been identified and organized for clear understanding. This appears to be study material covering important academic concepts that need to be understood for exams or coursework.`,
    Hausa: `Wannan rubutu (kalmomi ${words}) yana magana ne game da: "${preview}". An gano manyan batutuwa kuma an shirya su don fahimta mai sauƙi. Wannan kayan karatu ne mai mahimmanci da ake bukata a fahimce shi don jarrabawar ko ayyukan makaranta.`,
    Arabic: `يتناول هذا المحتوى (${words} كلمة): "${preview}". تم تحديد النقاط الرئيسية وتنظيمها من أجل الفهم الواضح. يبدو هذا مادة دراسية تغطي مفاهيم أكاديمية مهمة تحتاج إلى الفهم في الامتحانات أو الواجبات الدراسية.`,
  };

  const explanations = {
    English: `In simple terms: the content you provided talks about important ideas. Think of it like a teacher breaking down a topic step by step — starting with what it is, why it matters, and how it connects to what you already know. By understanding each part separately, the whole topic becomes easy to remember during your exam. Focus on the core concepts, examples, and any definitions mentioned in the content.`,
    Hausa: `Da sauki: abin da ka bayar yana magana ne game da muhimman ra'ayoyi. Yi tunanin kamar malami yana bayyana batu mataki bayan mataki — farawa da abin da yake, dalilin da ya sa ya yi muhimmanci, da kuma yadda yake da alaƙa da abin da ka riga ka sani. Ta hanyar fahimtar kowane ɓangare daban, dukan batun zai zama sauƙi a tuna a lokacin jarrabawarka. Mai da hankali kan manyan ra'ayoyi, misalai, da ma'anoni da aka ambata a cikin abun ciki.`,
    Arabic: `ببساطة: المحتوى الذي قدمته يتحدث عن أفكار مهمة. فكر في الأمر كمعلم يشرح موضوعاً خطوة بخطوة — بدءاً بما هو، ولماذا يهم، وكيف يرتبط بما تعرفه بالفعل. من خلال فهم كل جزء على حدة، يصبح الموضوع بأكمله سهل التذكر أثناء امتحانك. ركز على المفاهيم الأساسية والأمثلة والتعريفات المذكورة في المحتوى.`,
  };

  return { summary: summaries[lang] || summaries.English, explanation: explanations[lang] || explanations.English };
}

// =============================================
// CODE RESPONSE GENERATOR
// =============================================
function generateCodeResponse(input, lang) {
  const codeLang = detectCodeLanguage(input);
  const lines = input.split('\n').length;
  const chars = input.length;

  const summaries = {
    English: `This is ${codeLang} code with ${lines} line(s) and ${chars} characters. The code appears to define logic, structure, or functionality for a program or web page. It has been analyzed and broken down below in plain language.`,
    Hausa: `Wannan ${codeLang} code ne tare da layi ${lines} da haruffa ${chars}. Code yana bayyana dabaru, tsari, ko aiki don shiri ko shafin yanar gizo. An bincika shi kuma an fassara shi ƙasa cikin harshe mai sauƙi.`,
    Arabic: `هذا كود ${codeLang} يحتوي على ${lines} سطر و${chars} حرف. يبدو أن الكود يعرّف منطقاً أو هيكلاً أو وظيفة لبرنامج أو صفحة ويب. تم تحليله وشرحه أدناه بلغة بسيطة.`,
  };

  const explanations = {
    English: `What this code does in simple terms: This ${codeLang} code is a set of instructions written for a computer. ${getCodeExplainHint(codeLang, input, 'English')} Each part works together to produce a result when the code is run. Even if you don't know programming, you can think of it like a recipe — each line is one step the computer follows in order.`,
    Hausa: `Abin da wannan code ke yi da sauki: Wannan ${codeLang} code ita ce jerin umarnoni da aka rubuta don kwamfuta. ${getCodeExplainHint(codeLang, input, 'Hausa')} Kowanne ɓangare yana aiki tare don samar da sakamakon lokacin da aka gudanar da code ɗin. Ko da ba ka san shirye-shirye ba, zaka iya tunanin shi kamar recipe — kowane layi mataki ne ɗaya da kwamfuta ke bi da tsari.`,
    Arabic: `ما يفعله هذا الكود ببساطة: هذا كود ${codeLang} هو مجموعة من التعليمات المكتوبة للكمبيوتر. ${getCodeExplainHint(codeLang, input, 'Arabic')} كل جزء يعمل معاً لإنتاج نتيجة عند تشغيل الكود. حتى لو لم تكن تعرف البرمجة، يمكنك التفكير فيه كوصفة طبخ — كل سطر هو خطوة واحدة يتبعها الكمبيوتر بالترتيب.`,
  };

  const breakdowns = {
    English: buildCodeBreakdown(input, codeLang, 'English'),
    Hausa:   buildCodeBreakdown(input, codeLang, 'Hausa'),
    Arabic:  buildCodeBreakdown(input, codeLang, 'Arabic'),
  };

  return {
    summary:       summaries[lang]    || summaries.English,
    explanation:   explanations[lang] || explanations.English,
    codeBreakdown: breakdowns[lang]   || breakdowns.English,
  };
}

function getCodeExplainHint(lang, input, outputLang) {
  const hints = {
    HTML: {
      English: 'HTML is the structure of a web page — like the skeleton of a building. Tags like <div>, <p>, <h1> tell the browser what to show and where.',
      Hausa:   'HTML shine tsarin shafin yanar gizo — kamar kasusuwan gini. Tags kamar <div>, <p>, <h1> suna gaya wa browser abin da za a nuna da inda za a nuna shi.',
      Arabic:  'HTML هو هيكل صفحة الويب — مثل هيكل المبنى. العلامات مثل <div>، <p>، <h1> تخبر المتصفح بما يجب عرضه وأين.',
    },
    CSS: {
      English: 'CSS is the styling of a web page — it controls colours, fonts, sizes, and layout. Think of it as the paint and decoration on a building.',
      Hausa:   'CSS shine kayan ado na shafin yanar gizo — yana sarrafa launi, fonts, girma, da tsari. Yi tunanin shi kamar fenti da kayan ado a gini.',
      Arabic:  'CSS هو تنسيق صفحة الويب — يتحكم في الألوان والخطوط والأحجام والتخطيط. فكر فيه كالطلاء والديكور في المبنى.',
    },
    JavaScript: {
      English: 'JavaScript makes web pages interactive — it handles clicks, form submissions, animations, and logic. It is the "brain" of a web page.',
      Hausa:   'JavaScript yana sa shafukan yanar gizo su zama masu hulɗa — yana sarrafa danna, tura fom, motsi, da dabaru. Shi ne "kwakwalwa" na shafin yanar gizo.',
      Arabic:  'JavaScript يجعل صفحات الويب تفاعلية — يتعامل مع النقرات وإرسال النماذج والرسوم المتحركة والمنطق. إنه "دماغ" صفحة الويب.',
    },
    Python: {
      English: 'Python is a beginner-friendly programming language used for data analysis, AI, websites, and automation. It reads almost like plain English.',
      Hausa:   'Python wani yaren shirye-shirye ne mai sauƙi ga masu koyo da ake amfani da shi don binciken bayanai, AI, gidajen yanar gizo, da atomatik. Yana karatu kusan kamar turanci na yau da kullun.',
      Arabic:  'Python هي لغة برمجة مناسبة للمبتدئين تُستخدم لتحليل البيانات والذكاء الاصطناعي والمواقع الإلكترونية والأتمتة. تُقرأ تقريباً مثل اللغة الإنجليزية العادية.',
    },
  };
  const h = hints[lang] || hints['JavaScript'];
  return (h && h[outputLang]) || h?.English || '';
}

function buildCodeBreakdown(input, codeLang, lang) {
  const lines = input.split('\n').filter(l => l.trim());
  const sample = lines.slice(0, 6).map((l, i) => `Line ${i + 1}: ${l.trim()}`).join('\n');

  const intros = {
    English: `Here is a line-by-line breakdown of the first part of your ${codeLang} code:\n\n${sample}\n\n...and so on for the rest. Each line tells the computer to do one specific thing — together they make the full program work.`,
    Hausa:   `Ga bayani layi bayan layi na farkon ${codeLang} code ɗinka:\n\n${sample}\n\n...da sauransu. Kowanne layi yana gaya wa kwamfuta yin wani takamaiman abu — tare suna sa cikakken shiri ya yi aiki.`,
    Arabic:  `إليك شرح سطراً بسطر للجزء الأول من كود ${codeLang} الخاص بك:\n\n${sample}\n\n...وهكذا بالنسبة للباقي. كل سطر يأمر الكمبيوتر بفعل شيء محدد — معاً يجعلون البرنامج الكامل يعمل.`,
  };
  return intros[lang] || intros.English;
}

// =============================================
// READ ALOUD
// =============================================
function readAloud() {
  if (!window.speechSynthesis) {
    showToast('❌ Read Aloud not supported in this browser.');
    return;
  }
  window.speechSynthesis.cancel();

  const summary     = document.getElementById('summaryText').textContent;
  const explanation = document.getElementById('explanationText').textContent;
  const codeBlock   = document.getElementById('codeResultBlock');
  let text = `Summary: ${summary}. Explanation: ${explanation}.`;
  if (codeBlock.style.display !== 'none') {
    text += ` Code breakdown: ${document.getElementById('codeExplainText').textContent}`;
  }

  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; u.pitch = 1;
  u.onstart = () => showToast('🔊 Reading aloud...');
  u.onend   = () => showToast('✅ Done!');
  window.speechSynthesis.speak(u);
}

function stopReading() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    showToast('⏹ Stopped.');
  }
}

// =============================================
// SAVE NOTE
// =============================================
function saveNote() {
  const input   = document.getElementById('userInput').value.trim();
  const lang    = document.getElementById('langVal').value || currentLang;
  const summary = document.getElementById('summaryText').textContent;
  const explain = document.getElementById('explanationText').textContent;
  const isCode  = document.getElementById('codeResultBlock').style.display !== 'none';
  const codeTxt = isCode ? document.getElementById('codeExplainText').textContent : '';

  if (!summary) return;

  const note = {
    id: Date.now(),
    input,
    lang,
    summary,
    explanation: explain,
    codeBreakdown: codeTxt,
    isCode,
    type: isCode ? detectCodeLanguage(input) : 'Notes',
    date: new Date().toLocaleDateString('en-GB'),
  };

  const saved = getSavedNotes();
  saved.unshift(note);
  try {
    localStorage.setItem('learnease_notes', JSON.stringify(saved));
    const msg = document.getElementById('saveMsg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3000);
    updateLibBadge();
    showToast('💾 Saved to My Library!');
  } catch (e) {
    showToast('⚠️ Storage full. Please delete some old notes.');
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

  if (notes.length === 0) {
    empty.style.display = 'block';
    return;
  }
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
        <button class="btn btn-outline"  onclick="viewLibNote(${note.id})">👁 View</button>
        <button class="btn btn-ghost"    onclick="copyLibNote(${note.id})">📋 Copy</button>
        <button class="btn btn-ghost"    onclick="readLibNote(${note.id})">🔊 Read</button>
        <button class="btn btn-ghost"    onclick="shareLibNote(${note.id})">🔗 Share</button>
        <button class="btn btn-danger"   onclick="deleteNote(${note.id})">🗑</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Library actions
function viewLibNote(id) {
  const note = getSavedNotes().find(n => n.id === id);
  if (!note) return;
  let text = `📝 SUMMARY:\n${note.summary}\n\n💬 EXPLANATION:\n${note.explanation}`;
  if (note.codeBreakdown) text += `\n\n🔍 CODE BREAKDOWN:\n${note.codeBreakdown}`;
  alert(text);
}

function copyLibNote(id) {
  const note = getSavedNotes().find(n => n.id === id);
  if (!note) return;
  let text = `Summary:\n${note.summary}\n\nExplanation:\n${note.explanation}`;
  if (note.codeBreakdown) text += `\n\nCode Breakdown:\n${note.codeBreakdown}`;
  text += `\n\n— LearnEase: https://learnease.websprouthub.com`;
  copyText(text);
}

function readLibNote(id) {
  const note = getSavedNotes().find(n => n.id === id);
  if (!note) return;
  if (!window.speechSynthesis) { showToast('❌ Not supported.'); return; }
  window.speechSynthesis.cancel();
  let text = `Summary: ${note.summary}. Explanation: ${note.explanation}.`;
  if (note.codeBreakdown) text += ` Code breakdown: ${note.codeBreakdown}`;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.onstart = () => showToast('🔊 Reading...');
  window.speechSynthesis.speak(u);
}

function shareLibNote(id) {
  const note = getSavedNotes().find(n => n.id === id);
  if (!note) return;
  const text = `📚 LearnEase Study Note (${note.lang})\n\n📝 ${note.summary}\n\n💬 ${note.explanation}\n\n✦ Learn at https://learnease.websprouthub.com\nPowered by Websprout Hub`;
  shareText(text);
}

function deleteNote(id) {
  if (!confirm('Delete this saved note?')) return;
  const notes = getSavedNotes().filter(n => n.id !== id);
  localStorage.setItem('learnease_notes', JSON.stringify(notes));
  renderLibrary();
  updateLibBadge();
  showToast('🗑 Deleted.');
}

// =============================================
// SHARE RESULT (current page)
// =============================================
function shareResult() {
  const summary = document.getElementById('summaryText').textContent;
  const explain = document.getElementById('explanationText').textContent;
  const lang    = document.getElementById('resultLang').textContent;
  const codeBlk = document.getElementById('codeResultBlock');
  let text = `📚 *LearnEase – Study Summary* (${lang})\n\n📝 *Summary:*\n${summary}\n\n💬 *Explanation:*\n${explain}`;
  if (codeBlk.style.display !== 'none') {
    text += `\n\n🔍 *Code Breakdown:*\n${document.getElementById('codeExplainText').textContent}`;
  }
  text += `\n\n✦ Learn Smarter at https://learnease.websprouthub.com\nPowered by Websprout Hub`;
  shareText(text);
}

// =============================================
// SHARE APP (community page)
// =============================================
function shareApp(platform) {
  const url = 'https://learnease.websprouthub.com';
  const msg = '🎓 I found this amazing FREE study tool! LearnEase explains any notes or code in English, Hausa, or Arabic — even offline! Try it 👇';

  const links = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg + ' ' + url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(msg)}`,
    twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(url)}&hashtags=LearnEase,Students,Nigeria`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  if (platform === 'copy') {
    copyText(url);
    showToast('🔗 Link copied!');
    return;
  }
  if (links[platform]) window.open(links[platform], '_blank');
}

// =============================================
// UTILITIES
// =============================================
function shareText(text) {
  if (navigator.share) {
    navigator.share({ title: 'LearnEase', text, url: 'https://learnease.websprouthub.com' })
      .then(() => showToast('✅ Shared!'))
      .catch(() => copyText(text));
  } else {
    copyText(text);
    showToast('📋 Copied — paste anywhere to share!');
  }
}

function copyText(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('📋 Copied to clipboard!'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); showToast('📋 Copied!'); }
  catch { showToast('⚠️ Could not copy. Try again.'); }
  ta.remove();
}

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 2600);
}

// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
  updateLibBadge();
});
