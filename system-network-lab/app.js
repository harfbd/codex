(() => {
  'use strict';
  const KEY = 'system-network-lab-canva-v4';
  const fresh = () => ({ completed: [], visited: [], quizzes: {}, note: '', large: false, last: 1 });
  let storageOK = true;
  let state;
  try { state = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); }
  catch { state = fresh(); storageOK = false; }
  if (!Array.isArray(state.completed)) state.completed = [];
  if (!Array.isArray(state.visited)) state.visited = [];
  if (!state.quizzes || typeof state.quizzes !== 'object') state.quizzes = {};
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (x = '') => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => String(n).padStart(2, '0');
  const lessons = window.LESSONS;
  const units = window.UNITS;
  const animationCount = window.AnimationLab?.list.length || 0;
  if (!lessons || lessons.length !== 36) {
    $('#main').innerHTML = '<h1>課程資料尚未完整載入</h1><p>請重新整理網頁，或確認 index.html、lessons.js、app.js 放在同一個資料夾。</p>';
    return;
  }
  let current = 1;
  let cleanup = () => {};
  let toastTimer;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { storageOK = false; }
  }
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3000);
  }
  function icon(name) {
    const paths = {
      cpu:'M7 7h10v10H7z M10 10h4v4h-4z M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4',
      monitor:'M3 4h18v13H3z M8 21h8m-4-4v4',
      layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5M2 16l10 5 10-5',
      folder:'M2 6h8l2 3h10v12H2z M2 6V3h7l3 3',
      shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',
      network:'M9 2h6v5H9z M2 17h6v5H2z M16 17h6v5h-6z M12 7v5M5 17v-5h14v5',
      wifi:'M2 8c6-6 14-6 20 0M5 12c4-4 10-4 14 0M8 16c2-2 6-2 8 0 M12 20h.01',
      globe:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20',
      cloud:'M6 19a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11z',
      settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
      code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
      database:'M3 6c0-5 18-5 18 0s-18 5-18 0v12c0 5 18 5 18 0V6M3 12c0 5 18 5 18 0',
      user:'M8 6a4 4 0 1 0 8 0 4 4 0 0 0-8 0M3 22v-3c0-8 18-8 18 0v3',
    };
    return `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.layers}"/></svg>`;
  }
  const lab = (title, content, label = '互動實驗室') => `<section class="lab"><div class="lab-heading"><h2>${title}</h2><span class="lab-label">${label}</span></div>${content}</section>`;
  const feedback = () => '<div id="activity-feedback" class="feedback" role="status" aria-live="polite"></div>';
  function say(text, kind = '') {
    const el = $('#activity-feedback');
    if (el) { el.className = `feedback ${kind}`; el.textContent = text; }
  }
  function goto(id) {
    const safe = Math.min(36, Math.max(1, Number(id) || 1));
    if (current === safe && location.hash === `#/lesson/${safe}`) render();
    else location.hash = `/lesson/${safe}`;
  }
  function progress() {
    const done = [...new Set(state.completed)].filter(n => n >= 1 && n <= 36).length;
    $('#progress-label').textContent = `${done} / 36`;
    $('#progress-bar').style.width = `${done / 36 * 100}%`;
    $('#mark-done').textContent = state.completed.includes(current) ? '✓ 本頁已學習' : '標記本頁已學習';
    $('#mark-done').setAttribute('aria-pressed', String(state.completed.includes(current)));
    $('#unit-nav').innerHTML = units.map((u, i) => `<a class="unit-link ${lessons[current-1].unit === i ? 'active' : ''}" href="#/lesson/${i*6+1}" ${lessons[current-1].unit === i ? 'aria-current="step"' : ''}><span class="unit-num">${num(i+1)}</span><span><span class="unit-title">${esc(u.title)}</span><span class="unit-pages">${num(i*6+1)}–${num(i*6+6)} 頁</span></span></a>`).join('');
  }
  function complete(id = current) {
    if (!state.completed.includes(id)) state.completed.push(id);
    save(); progress();
  }
  function render() {
    cleanup(); cleanup = () => {};
    window.AnimationLab?.close();
    current = Math.min(36, Math.max(1, Number((location.hash.match(/^#\/lesson\/(\d+)(?:\/core|\/sim\/[a-z0-9-]+)?$/) || [])[1]) || 1));
    const lesson = lessons[current - 1];
    state.last = current;
    if (!state.visited.includes(current)) state.visited.push(current);
    save();
    document.title = `${num(current)} ${lesson.title}｜系統與網路探索站`;
    $('#crumb').textContent = units[lesson.unit].title;
    $('#page-count').innerHTML = `${num(current)} <span>/ 36</span>`;
    $('#prev').disabled = current === 1;
    $('#next').disabled = current === 36;
    $('#next').textContent = current === 1 ? '開始探索' : current === 35 ? '查看學習成果' : current === 36 ? '探索完成' : '下一頁';
    $('#footer-hint').textContent = current === 1 ? '先看懂，再動手，最後挑戰自己' : `${units[lesson.unit].title} · 第 ${current - lesson.unit*6} / 6 頁`;
    document.body.classList.toggle('large-font', !!state.large);
    $('#font-toggle').setAttribute('aria-pressed', String(!!state.large));
    const intro = `<div class="lesson-intro"><button class="guide-buddy" id="guide-hint" aria-label="查看本頁任務提示"><img src="assets/knowledge-v3/guide-robot.png" alt="" width="120" height="120"><span>任務提示</span></button><p class="eyebrow">${esc(lesson.kicker)}</p><h1>${esc(lesson.title)}</h1><p>${esc(lesson.lead)}</p>${window.CORE_MODULES?.[current]?'<button class="small-button" id="jump-core">前往本頁核心與操作</button>':''}</div>`;
    const knowledge = `<div class="knowledge">${lesson.points.map(p => `<article><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></article>`).join('')}</div>`;
    const takeaway = `<aside class="takeaway"><strong>帶走一個觀念</strong><p>${esc(lesson.takeaway)}</p></aside><p class="model-note">概念圖與操作為教學簡化模型。</p>`;
    const animation = window.AnimationLab?.renderLaunchers(current) || '';
    let content;
    if (lesson.mode === 'welcome') content = welcome(lesson, animation);
    else if (lesson.mode === 'quiz') content = intro + illustration(lesson) + `<div class="quiz-wide">${quiz(lesson)}</div>` + `<div style="margin-top:24px">${knowledge}</div>` + animation + takeaway;
    else if (lesson.mode === 'review') content = intro + animation + illustration(lesson) + review() + takeaway;
    else if (lesson.mode === 'finish') content = intro + animation + illustration(lesson) + finish() + takeaway;
    else content = intro + animation + illustration(lesson) + (window.renderCore?.(current)||'') + `<div class="learning-layout">${activity(lesson)}${knowledge}</div>` + takeaway;
    $('#main').innerHTML = content;
    progress();
    bindActivity(lesson);
    window.bindCore?.(current);
    if($('#jump-core'))$('#jump-core').onclick=()=>$('#core-'+current)?.scrollIntoView({block:'start',behavior:'smooth'});
    const guide=$('#guide-hint');if(guide)guide.onclick=()=>info('小導遊的任務提示',`<p>${esc(taskHint(lesson))}</p><p class="small-print">機器人與資料角色是幫助理解的教學比喻。實際運作由程式、硬體與通訊協定完成。</p>`);
    $$('[data-open-illustration]').forEach(b=>b.onclick=()=>openIllustration(lesson));
    $$('[data-goto]', $('#main')).forEach(el => el.addEventListener('click', () => goto(el.dataset.goto)));
    window.scrollTo({ top: 0, behavior: 'instant' });
    if(location.hash.endsWith('/core'))$('#core-'+current)?.scrollIntoView({block:'start'});
    const animationId=location.hash.match(/\/sim\/([a-z0-9-]+)$/)?.[1];if(animationId)window.AnimationLab?.open(animationId,true);
  }
  function welcome(lesson, animation) {
    return `<div class="meta-line"><span class="tag">國中資訊科技</span><span class="tag purple">36 頁互動學習</span><span class="tag orange">從看懂到動手</span></div><section class="hero"><div><p class="eyebrow">READY FOR A DIGITAL ADVENTURE?</p><h1>電腦的秘密，<br>一起<em>動手解鎖！</em></h1><p>點開一個程式、連上一個網站，背後發生了什麼？<br>跟著概念圖與小實驗，一起認識作業系統與網路。</p><button class="primary" data-goto="2">啟動第一個探索</button><div class="hero-mini"><span><strong>36</strong>個學習頁面</span><span><strong>6</strong>個探索單元</span><span><strong>20</strong>題概念檢核</span><span><strong>${animationCount}</strong>個立體動畫</span></div></div><img class="hero-art" src="assets/knowledge-v3/guide-robot.png" alt="揮手邀請學生探索的機器人小導遊"></section>${animation}<section class="animation-home-link"><div><h2>讓看不見的原理，動起來！</h2><p>36個立體GIF搭配中文語音，先看懂流程，再切換互動模擬逐步觀察、改變條件。</p></div><button class="primary" data-open-animation-library>挑選動畫實驗</button></section>${illustration(lesson)}<div class="section-heading"><h2>選一個任務，開始冒險！</h2><span>點選單元，自由開始</span></div><div class="path-grid">${units.map((u,i)=>`<button class="path-card" data-goto="${i*6+1}"><small>UNIT ${num(i+1)} · ${num(i*6+1)}–${num(i*6+6)}</small><span class="card-icon" aria-hidden="true">${icon(['layers','cpu','monitor','network','globe','shield'][i])}</span><h3>${esc(u.title)}</h3><p>${esc(u.subtitle)}</p></button>`).join('')}</div><p class="small-print" style="margin-top:20px">${storageOK?'進度會儲存在此瀏覽器；作答不會上傳。':'瀏覽器目前無法保留進度，請在離開前到第 36 頁下載學習紀錄。'} 可自由跳頁，操作都在網頁內模擬。</p>`;
  }
  function taskHint(l) {
    const coreHints={2:'點選五大單元，找出CPU包含的兩個單元，再想想觸控螢幕為什麼有兩種角色。',8:'先用A、B、C觀察快取命中，再比較先存檔與未存檔就斷電的結果。',15:'切換文件、影像運算與多分頁情境，比較CPU、GPU與RAM用量。數值是示例，請說明分工理由。',16:'選RAID0、1或5，再點選磁碟模擬故障。比較陣列可用性與能否找回誤刪舊檔。',25:'逐層按封裝，再按接收端解封裝，對照TCP/IP四層與OSI七層。',26:'比較A、CNAME與PTR紀錄；兩個名稱查到同一IP，是否就能證明有別名？',30:'把向外請求、相符回應與未允許的新連入分開，看看具狀態追蹤的防火牆如何判斷。',33:'先試ipconfig，再用ping、tracert與nslookup找不同線索。留意RTT、TTL及DNS伺服器與目標IP的差別。'};
    if(coreHints[l.id])return coreHints[l.id];
    const hints={explore:'先看知識圖，猜猜每個角色負責什麼，再點選下方概念節點檢查你的想法。',sequence:'先找第一步，再逐一點選或拖曳步驟。排好後按檢查；想調整時，點選已放入的卡片。',build:'從教室電腦開始，想想資料先經過哪個設備，才會抵達遠方網站。',quiz:'先自己判斷每題，再送出看解析。答錯的題目會出現在複習建議裡，可以回看再試。',scheduler:'一次執行一個時間片，觀察A、B、C如何輪流前進。這裡模擬的是一個核心。',memory:'比較兩種情況：編輯後直接斷電，以及先儲存再斷電。看看RAM和SSD分別留下什麼。',files:'先找資訊科技資料夾，再開啟網路筆記，觀察畫面上方的完整路徑。',terminal:'試試用圖形按鈕，再輸入list或open note.txt。兩種介面能完成相同操作。',permission:'錄音筆需要什麼？只開啟這個任務所需的權限，再檢查設定。',packet:'留意封包的序號。傳送路徑可能不同，收到後仍要按規則處理與重組。',dns:'一步一步看：查名稱、得到IP，再向網站請求資料。DNS不負責傳送整個網頁。',url:'點選網址的三個部分，分辨通訊方式、主機名稱與資源路徑。',bandwidth:'把傳輸速率與延遲分別拉到兩端，看看大檔案傳完時間和來回等待有何不同。',concept:'點選圖中的概念，回到相關課程。試著向同學說明裝置內部與網路如何配合。',trouble:'先看影響範圍，再選擇下一個合理檢查步驟。一次現象不能直接證明唯一原因。',review:'先查看最近一次答錯的概念，再寫下你現在的理解。重做測驗後，建議會更新。',finish:'看看已學習頁數與測驗結果；需要保留時下載紀錄。到最後一頁不代表每個概念都已熟悉。'};
    return hints[l.mode]||'先看圖、做預測，再動手操作。你可以自由選頁，也能回頭複習。';
  }
  function illustration(l) {
    const file=`assets/knowledge-v3/lesson-${num(l.id)}.png`;
    const routeNote=[32,36].includes(l.id)?'圖為路徑示例；實際封包的往返路徑未必相同。 ':l.id===23?'MAC交付的圖示以乙太網路與Wi-Fi等區域連線為例。 ':'';
    const description=l.id===1?'應用程式透過作業系統使用CPU、RAM與儲存裝置；不同裝置經由網路交換資料。':l.takeaway;
    return `<figure class="knowledge-illustration"><div class="illustration-heading"><div><p class="eyebrow">看圖學概念</p><h2>${esc(l.title)}</h2></div><button class="small-button" id="open-illustration" data-open-illustration aria-label="放大第 ${l.id} 頁知識圖">放大圖解</button></div><button class="illustration-preview" type="button" aria-label="放大第 ${l.id} 頁知識圖" data-open-illustration><img src="${file}" width="1536" height="1024" alt="${esc(description)}" decoding="async"></button><figcaption><strong>圖解重點</strong><p>${esc(routeNote+description)}</p><span class="metaphor-note">機器人、精靈與場景為教學比喻；請搭配下方文字與操作理解。</span></figcaption></figure>`;
  }
  function openIllustration(l) {
    const file=`assets/knowledge-v3/lesson-${num(l.id)}.png`;
    $('#illustration-title').textContent=l.title;
    $('#large-illustration').src=file;
    $('#large-illustration').alt=l.takeaway;
    $('#large-illustration').style.width='100%';
    $('#original-illustration').href=file;
    $('#illustration-description').textContent=l.takeaway;
    $$('[data-image-zoom]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.imageZoom==='1')));
    $('#illustration-dialog').showModal();
    $('.illustration-scroll').scrollTo(0,0);
  }
  function activity(l) {
    const content = {
      explore: () => explore(l),
      sequence: () => sequence(l),
      build: () => sequence(l),
      scheduler, memory, files, terminal, permission, packet, dns, url, bandwidth, concept, trouble,
    };
    return (content[l.mode] || (() => explore(l)))();
  }
  function explore(l) {
    const nodes = l.config.nodes || [];
    const stack = l.id === 4;
    const topology = false;
    return lab(l.id === 4 ? '點開電腦的四個層次' : l.id === 21 ? '認識網路設備的分工' : '點一點，探索概念', `<p class="instruction">點選圖中的每個節點，查看它的角色與生活例子。</p><div class="${stack?'stack':topology?'network-topology':'node-grid'}">${nodes.map((n,i)=>`${i&&topology?'<span class="wire" aria-hidden="true"></span>':''}<button class="node" data-node="${i}" aria-pressed="false"><span class="node-icon">${icon(n.icon)}</span><span>${esc(n.label)}</span></button>${stack&&i<nodes.length-1?'<span class="flow-connector" aria-hidden="true"></span>':''}`).join('')}</div><div class="detail-box" id="node-detail" aria-live="polite"><strong>你想先認識哪一個？</strong><p>選擇一個節點，看看它如何參與你的數位生活。</p></div>`);
  }
  function sequence(l) {
    return lab(l.mode === 'build' ? '把網路連線接起來' : '把步驟排成正確順序', `<p class="instruction">點選卡片，或把卡片拖入下方排序區。點選已放入的步驟可移回待選區。</p><div class="sequence-pool" id="sequence-pool"></div><p class="small-print">你的順序</p><div class="sequence-slots" id="sequence-slots" aria-label="排序區"></div><div class="control-row"><button class="primary" id="check-sequence">檢查順序</button><button class="small-button" id="reset-sequence">重新排列</button></div>${feedback()}`);
  }
  function scheduler() {
    return lab('單核心 CPU 的時間分配', `<p class="instruction">按一次「執行一個時間片」，觀察三項工作如何輪流前進。</p><div class="task-bars">${['A 音樂','B 文件','C 瀏覽器'].map((v,i)=>`<div class="task-row"><span>${v}</span><div class="task-track"><div class="task-fill" id="task-${i}" style="width:0%"></div></div></div>`).join('')}</div><div class="timeline" id="cpu-timeline" aria-label="CPU 執行順序"></div><div class="control-row"><button class="primary" id="cpu-step">執行一個時間片</button><button class="small-button" id="cpu-reset">重設</button></div><p class="small-print">示意條件：1 個核心、3 項工作各需要 4 個時間片，採輪流排程。真實系統還會考慮優先權與等待輸入輸出。</p>${feedback()}`);
  }
  function memory() {
    return lab('RAM 工作桌與儲存書櫃', `<p class="instruction">試試「開啟→編輯→儲存」，再與「編輯後直接斷電」比較。</p><div class="memory-cols"><div class="memory-device"><h3>RAM 工作桌</h3><div class="memory-meter"><div id="ram-fill" style="width:20%"></div></div><div id="ram-chips" class="memory-chips"></div></div><div class="memory-device storage"><h3>SSD 儲存書櫃</h3><div id="disk-chips" class="memory-chips"></div></div></div><div class="control-row"><button class="small-button" id="mem-open">開啟作品</button><button class="small-button" id="mem-edit">編輯作品</button><button class="small-button" id="mem-save">儲存作品</button><button class="small-button" id="mem-power">模擬斷電</button></div><p class="small-print">這是未開啟自動儲存的示意；RAM 容量條不代表實際檔案大小。</p>${feedback()}`);
  }
  function files() {
    return lab('找到你的檔案', `<p class="instruction">任務：找到「資訊科技」資料夾裡的「網路筆記.txt」，觀察完整路徑。</p><div class="file-path" id="file-path">學習資料／</div><div class="file-layout"><div id="file-tree"><button class="file-folder" data-folder="root">▣ 學習資料</button><button class="file-folder" data-folder="it">　▣ 資訊科技</button><button class="file-folder" data-folder="art">　▣ 美術</button></div><div class="file-result" id="file-list">請選擇左方資料夾。</div></div>${feedback()}`);
  }
  function terminal() {
    return lab('同一個任務，兩種操作介面', `<p class="instruction">試著用按鈕或輸入指令開啟同一份檔案。這是教學用模擬終端機。</p><div class="control-row"><button class="small-button" id="gui-list">▣ 列出檔案（GUI）</button><button class="small-button" id="gui-open">▤ 開啟筆記（GUI）</button></div><div class="terminal"><p>LAB / 教學模擬 CLI</p><div id="terminal-log" class="terminal-log" role="status">可輸入 list 或 open note.txt</div><form id="terminal-form" class="terminal-form"><label for="terminal-input">&gt;</label><input id="terminal-input" autocomplete="off" spellcheck="false" aria-label="模擬指令" placeholder="例如：list"><button class="small-button" type="submit">執行</button></form></div><p class="small-print">此處指令為本網頁自訂，不會操作你的電腦。GUI 與 CLI 都能向系統表達操作要求。</p>${feedback()}`);
  }
  function permission() {
    return lab('權限要給多少才剛好？', `<p class="instruction">情境：你要使用「錄音筆」錄音。只開啟完成任務需要的權限。</p><div class="permissions"><span>麥克風</span><button class="switch" aria-label="麥克風權限" aria-pressed="false" data-permission="mic">未允許</button><span>相機</span><button class="switch" aria-label="相機權限" aria-pressed="false" data-permission="cam">未允許</button><span>位置</span><button class="switch" aria-label="位置權限" aria-pressed="false" data-permission="loc">未允許</button></div><div class="control-row"><button class="primary" id="permission-check">檢查我的設定</button></div><p class="small-print">所有開關都是模擬，不會要求你的真實麥克風、相機或位置權限。</p>${feedback()}`);
  }
  function packet() {
    return lab('一則訊息的封包旅程', `<p class="instruction">先播放傳送，再點封包卡片，按照 1、2、3 的順序重組訊息。</p><div class="packet-scene" id="packet-scene"><svg class="packet-svg" viewBox="0 0 600 240" role="img" aria-label="傳送端經兩條可能路徑到接收端的封包示意圖"><path d="M75 120L235 72H375L525 120M75 120L235 174H375L525 120" fill="none" stroke="#56738d" stroke-width="3"/><rect x="20" y="87" width="85" height="66" rx="9" fill="#2c5349" stroke="#8ceac6"/><rect x="495" y="87" width="85" height="66" rx="9" fill="#42345e" stroke="#bca7fa"/><text x="32" y="126">傳送端</text><text x="506" y="126">接收端</text><circle cx="235" cy="72" r="15" fill="#3c596e"/><circle cx="375" cy="72" r="15" fill="#3c596e"/><circle cx="235" cy="174" r="15" fill="#3c596e"/><circle cx="375" cy="174" r="15" fill="#3c596e"/><rect class="packet p1" x="66" y="106" width="18" height="14" rx="3"/><rect class="packet p2" x="66" y="122" width="18" height="14" rx="3"/><rect class="packet p3" x="66" y="113" width="18" height="14" rx="3"/></svg></div><div class="packet-captions"><span>傳送端</span><span>接收端</span></div><div class="control-row"><button class="primary" id="packet-send">播放封包傳送</button><button class="small-button" id="packet-reset">重新組合</button></div><div id="packet-pool" class="control-row"></div><div class="detail-box" id="packet-message" aria-live="polite">等待你重組訊息。</div><p class="small-print">圖中顯示兩條可能路徑；本次播放示範其中一條。實際封包路徑、抵達順序與重傳方式會依網路及協定而異。</p>${feedback()}`);
  }
  function dns() {
    return lab('DNS 名稱查詢小劇場', `<p class="instruction">連續點選「下一步」，追蹤瀏覽器如何尋找網站的 IP 位址。</p><div class="file-path">網址：https://learn.example/lesson</div><div class="steps-track">${['取出網域名稱：learn.example','向 DNS 查詢這個名稱的 IP 位址','收到示意位址：192.0.2.10','使用該 IP 建立連線，請求網頁'].map((s,i)=>`<div class="trace-step" id="dns-${i}"><strong>${num(i+1)}　${s}</strong></div>`).join('')}</div><div class="control-row"><button class="primary" id="dns-step">下一步</button><button class="small-button" id="dns-reset">重播</button></div><p class="small-print">.example 與 192.0.2.10 為文件示意用名稱和位址。真實 DNS 可能先使用快取，這裡省略解析階層與其他記錄。</p>${feedback()}`);
  }
  function url() {
    return lab('拆開一個網址', `<p class="instruction">點選網址的不同部分，理解瀏覽器收到哪些線索。</p><div class="url-bar"><button class="url-part" data-url="0">https://</button><button class="url-part" data-url="1">learn.example</button><button class="url-part" data-url="2">/courses/os.html</button></div><div class="detail-box" id="url-detail" aria-live="polite">點選上方的通訊協定、網域名稱或路徑。</div><div class="steps-track"><div class="trace-step active"><strong>基本旅程</strong>解析名稱 → 建立連線 → 請求資源 → 顯示網頁</div></div>${feedback()}`);
  }
  function bandwidth() {
    return lab('頻寬大，就一定反應快嗎？', `<p class="instruction">拖曳兩個滑桿，分別改變理想傳輸速率與往返延遲，觀察不同指標。</p><div class="range-group"><label for="bandwidth-range">理想傳輸速率 <output id="bandwidth-out">100 Mbps</output></label><input id="bandwidth-range" type="range" min="10" max="200" step="10" value="100"></div><div class="range-group"><label for="latency-range">往返延遲（RTT）<output id="latency-out">40 ms</output></label><input id="latency-range" type="range" min="10" max="300" step="10" value="40"></div><div class="metric-grid"><div class="metric"><strong id="download-time">0.80 秒</strong><span>10 MB 檔案的理想傳輸時間</span></div><div class="metric"><strong id="response-time">40 ms</strong><span>一次往返的等待時間</span></div></div><p class="small-print" style="margin-top:18px">採十進位：1 MB = 1,000,000 Bytes，1 Byte = 8 bits；10 MB × 8 ÷ Mbps。理想傳輸時間未計連線、延遲與協定開銷；真實速率也受多人共享與設備影響。</p>${feedback()}`);
  }
  function concept() {
    return lab('一張圖，串起整趟旅程', `<p class="instruction">點選任一概念，回到對應的學習頁。試著用自己的話說出連結。</p><div class="concept-hub">你的數位世界</div><div class="concept-branches"><section class="concept-branch"><h3>裝置內部：OS 協調資源</h3><button data-goto="4">使用者、應用程式、OS、硬體</button><button data-goto="7">CPU 分配時間執行工作</button><button data-goto="8">RAM 處理中，SSD 長期存</button><button data-goto="9">檔案系統組織資料</button><button data-goto="2">五大單元與儲存程式</button><button data-goto="15">CPU、GPU與工作管理員</button><button data-goto="16">RAID、備份與可靠性</button></section><section class="concept-branch"><h3>裝置之間：網路交換資料</h3><button data-goto="21">AP、交換器與路由器</button><button data-goto="22">資料拆成封包傳送</button><button data-goto="26">DNS 將名稱解析為 IP</button><button data-goto="30">HTTPS、防火牆與安全習慣</button><button data-goto="25">OSI、TCP/IP與封裝</button><button data-goto="33">ipconfig、ping與診斷指令</button></section></div><div class="detail-box" style="margin-top:16px"><strong>跨過兩邊的橋梁</strong>你開啟瀏覽器時，OS 協調 CPU、RAM 與網路裝置；瀏覽器使用網路協定，向遠端伺服器取得網頁。</div>`,'可點選概念圖');
  }
  function trouble() {
    return lab('網路偵探：先找哪一條線索？', `<p class="instruction">依情境選擇合理的下一步。一次改一件事，才知道原因在哪裡。</p><div id="trouble-scene"></div>${feedback()}<div class="control-row"><button class="small-button" id="trouble-reset">從第一個情境開始</button></div>`);
  }
  function quiz(l) {
    const stored = state.quizzes[l.id];
    return lab(l.id === 34 ? '整合挑戰 · 8 題' : '概念檢核 · 3 題', `<p class="instruction">選好每題答案後送出。每題都有解析，可重做，也能回到相關頁複習。</p><form id="quiz-form">${l.config.questions.map((q,i)=>`<fieldset class="quiz-question"><legend>${i+1}. ${esc(q.q)}</legend>${window.questionVisual?.(l.id,i,false)||''}<div class="options">${q.options.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}" ${stored?.selected?.[i]===j?'checked':''}><span>${esc(o)}</span></label>`).join('')}</div><div class="question-feedback" id="q-feedback-${i}"></div></fieldset>`).join('')}<div class="quiz-toolbar"><button type="submit" class="primary">送出答案與看解析</button><button type="button" class="secondary" id="quiz-clear">清空選項重做</button><span class="quiz-score" id="quiz-score" aria-live="polite"></span></div><div id="quiz-alert" class="feedback" role="status" aria-live="polite"></div></form>`,'即時解析');
  }
  function review() {
    const submitted = Object.keys(state.quizzes).filter(id => lessons[Number(id)-1]?.mode === 'quiz');
    const wrong = [];
    submitted.forEach(id => {
      const l = lessons[Number(id)-1];
      l.config.questions.forEach((q,i) => {
        if (state.quizzes[id].selected?.[i] !== q.answer) wrong.push({q, lesson: l});
      });
    });
    return `<div class="meta-line"><span class="tag">已作答 ${submitted.length} / 5 組測驗</span><span class="tag purple">最近一次作答待複習 ${wrong.length} 題</span></div><div class="review-grid">${!submitted.length?'<div class="detail-box"><strong>先完成一組測驗，這裡就會出現你的複習建議。</strong>可以從第 6 頁開始，不必一次完成所有題目。</div>':!wrong.length?'<div class="detail-box"><strong>已作答的題目全部答對。</strong>還沒作答的測驗不計入；也可以挑一個概念，用自己的話解釋給同學聽。</div>':wrong.map(({q,lesson})=>`<div class="review-row"><div><strong>${esc(q.q)}</strong><p>第 ${lesson.id} 頁檢核：${esc(q.explanation)}</p></div><button class="small-button" data-goto="${q.review}">前往第 ${q.review} 頁複習</button></div>`).join('')}</div><div class="control-row">${[6,12,18,24,34].map(n=>`<button class="small-button" data-goto="${n}">${state.quizzes[n]?'重做':'開始'}第 ${n} 頁測驗</button>`).join('')}</div><label for="learning-note"><strong>留給未來自己的學習筆記</strong></label><textarea id="learning-note" class="notes-input" placeholder="我原本以為……，現在我知道……">${esc(state.note || '')}</textarea><p class="small-print">筆記儲存在這個瀏覽器，會一起放進可下載的學習紀錄。</p>`;
  }
  function finish() {
    const final = state.quizzes[34];
    const answered = Object.values(state.quizzes).reduce((n,q)=>n+(q.selected?.length || 0),0);
    return `<div class="finish-art"><span class="finish-symbol" aria-hidden="true">◈</span></div><div class="finish-stats"><div><strong>${state.completed.length} / 36</strong><span>已標記學習頁數</span></div><div><strong>${answered} / 20</strong><span>已作答題數</span></div><div><strong>${final ? final.correct+' / 8' : '尚未作答'}</strong><span>整合挑戰最近成績</span></div></div><div class="detail-box"><strong>${state.completed.length===36 && final?.correct===8?'探索任務完成！':'你的探索可以繼續。'}</strong>抵達最後一頁不代表每個概念都已熟悉。回到複習頁查看作答，或挑一個觀念，向同學解釋它的原理。</div><div class="control-row"><button class="primary" id="export-record">下載學習紀錄</button><button class="secondary" data-goto="35">查看複習建議</button><button class="small-button" id="finish-map">打開課程地圖</button></div><p class="small-print">${storageOK?'進度僅存在此瀏覽器，換裝置或清除瀏覽器資料就不會保留。':'目前無法保留瀏覽器進度，請下載紀錄。'} 下載檔包含完成頁面、作答、解析與筆記，不含姓名。</p><button class="text-button" id="reset-progress" style="color:var(--orange);margin-top:18px">清除本機學習紀錄</button>`;
  }
  function bindActivity(l) {
    if (l.mode === 'explore') {
      $$('[data-node]').forEach(b => b.addEventListener('click',()=>{
        const n = l.config.nodes[Number(b.dataset.node)];
        $$('[data-node]').forEach(e=>{e.classList.toggle('selected',e===b);e.setAttribute('aria-pressed',String(e===b));});
        $('#node-detail').innerHTML=`<strong>${esc(n.label)}</strong><p>${esc(n.text)}</p>`;
      }));
    }
    if (['sequence','build'].includes(l.mode)) bindSequence(l);
    if (l.mode === 'scheduler') bindScheduler();
    if (l.mode === 'memory') bindMemory();
    if (l.mode === 'files') bindFiles();
    if (l.mode === 'terminal') bindTerminal();
    if (l.mode === 'permission') bindPermission();
    if (l.mode === 'packet') bindPacket();
    if (l.mode === 'dns') bindDns();
    if (l.mode === 'url') bindUrl();
    if (l.mode === 'bandwidth') bindBandwidth();
    if (l.mode === 'trouble') bindTrouble();
    if (l.mode === 'quiz') bindQuiz(l);
    if (l.mode === 'review') $('#learning-note').addEventListener('input',e=>{state.note=e.target.value;save();});
    if (l.mode === 'finish') {
      $('#finish-map').addEventListener('click',openMap);
      $('#export-record').addEventListener('click',exportRecord);
      $('#reset-progress').addEventListener('click',()=>{
        info('清除本機學習紀錄', '<p>這會移除此瀏覽器內的完成頁數、測驗答案與筆記。需要保留時，請先下載學習紀錄。</p><div class="control-row"><button class="secondary" id="cancel-reset">保留紀錄</button><button class="primary" id="confirm-reset">確認清除</button></div>');
        $('#cancel-reset').onclick=()=>$('#info-dialog').close();
        $('#confirm-reset').onclick=()=>{state=fresh();window.resetCorePractice?.();window.AnimationLab?.resetRecord();save();$('#info-dialog').close();goto(1);toast('已清除本機學習紀錄');};
      });
    }
  }
  function bindSequence(l) {
    const steps=l.config.steps || [];
    let chosen=[];
    const order=steps.map((_,i)=>i).reverse();
    function focusCard(){const next=$('[data-step]')||$('[data-remove]');if(next)next.focus({preventScroll:true});}
    function add(i){if(!chosen.includes(i)){chosen.push(i);draw();say('');focusCard();}}
    function draw(){
      $('#sequence-pool').innerHTML=order.filter(i=>!chosen.includes(i)).map(i=>`<button class="sequence-item" draggable="true" data-step="${i}"><span aria-hidden="true">⠿</span>${esc(steps[i].title)}</button>`).join('') || '<p class="small-print">卡片已全部放入排序區。</p>';
      $('#sequence-slots').innerHTML=steps.map((_,i)=>chosen[i]===undefined?`<div class="seq-slot"><b>${i+1}</b> 等待放入步驟</div>`:`<button class="seq-slot filled" data-remove="${i}"><b>${i+1}</b>${esc(steps[chosen[i]].title)}<span class="small-print">（移回）</span></button>`).join('');
      $$('[data-step]').forEach(b=>{b.onclick=()=>add(Number(b.dataset.step));b.ondragstart=e=>{e.dataTransfer.setData('text/plain',b.dataset.step);e.dataTransfer.effectAllowed='move';};});
      $$('[data-remove]').forEach(b=>b.onclick=()=>{chosen.splice(Number(b.dataset.remove),1);draw();say('');focusCard();});
    }
    const slots=$('#sequence-slots');
    slots.ondragover=e=>e.preventDefault();
    slots.ondrop=e=>{e.preventDefault();const value=e.dataTransfer.getData('text/plain');if(/^\d+$/.test(value)&&Number(value)<steps.length)add(Number(value));};
    $('#check-sequence').onclick=()=>{
      if(chosen.length<steps.length){say('還有卡片未放入，先完成整個順序再檢查。','bad');return;}
      const good=chosen.every((v,i)=>v===i);
      if(good)say('順序正確！'+steps.map(s=>s.text).join(' '),'good');
      else {const i=chosen.findIndex((v,j)=>v!==j);say(`從第 ${i+1} 步再想一想：${steps[i].text} 點選卡片移回後可以重排。`,'bad');}
    };
    $('#reset-sequence').onclick=()=>{chosen=[];draw();say('順序已重設，可以再試一次。');};draw();
  }
  function bindScheduler(){
    let ticks=0;
    const counts=[0,0,0];
    $('#cpu-step').onclick=()=>{
      if(ticks>=12)return;
      const task=ticks%3;counts[task]++;ticks++;
      $('#cpu-timeline').insertAdjacentHTML('beforeend',`<span class="time-cell ${['','b','c'][task]}">${['A','B','C'][task]}</span>`);
      counts.forEach((n,i)=>$('#task-'+i).style.width=`${n/4*100}%`);
      say(ticks===12?'三項工作都完成了。這個模型中，每項工作輪流取得 CPU 時間，並非三項工作在同一個核心上同時執行。':`第 ${ticks} 個時間片交給 ${['A 音樂','B 文件','C 瀏覽器'][task]}；切換工作不代表其他工作已結束。`,ticks===12?'good':'');
      $('#cpu-step').disabled=ticks===12;
    };
    $('#cpu-reset').onclick=()=>{ticks=0;counts.fill(0);$('#cpu-timeline').innerHTML='';counts.forEach((_,i)=>$('#task-'+i).style.width='0%');$('#cpu-step').disabled=false;say('已重設，從 A 工作開始輪流。');};
  }
  function bindMemory(){
    let power=true,opened=false,diskVersion=1,ramVersion=1;
    function draw(){
      $('#ram-fill').style.width=power?(opened?'75%':'20%'):'0%';
      $('#ram-chips').innerHTML=power?`<div class="memory-chip">作業系統使用中</div>${opened?`<div class="memory-chip">作品 v${ramVersion}${ramVersion!==diskVersion?' · 尚未儲存':''}</div>`:''}`:'<p class="small-print">電源關閉，RAM 內容消失。</p>';
      $('#disk-chips').innerHTML=`<div class="memory-chip">作業系統檔案</div><div class="memory-chip">作品 v${diskVersion} · 已儲存</div>`;
      $('#mem-open').disabled=!power||opened;$('#mem-edit').disabled=!power||!opened;$('#mem-save').disabled=!power||!opened;$('#mem-power').textContent=power?'模擬斷電':'重新開機';
    }
    $('#mem-open').onclick=()=>{opened=true;ramVersion=diskVersion;draw();say('把已儲存的作品載入 RAM，CPU 才能處理目前工作中的資料。');};
    $('#mem-edit').onclick=()=>{ramVersion++;draw();say(`你正在編輯 v${ramVersion}，SSD 仍是 v${diskVersion}。需要儲存才能保留這次變更。`);};
    $('#mem-save').onclick=()=>{diskVersion=ramVersion;draw();say('已將作品寫入 SSD，斷電後仍可保留這個版本。','good');};
    $('#mem-power').onclick=()=>{const lost=power&&opened&&ramVersion!==diskVersion;power=!power;opened=false;ramVersion=diskVersion;draw();say(power?'重新啟動後，可以再次開啟 SSD 裡已儲存的作品。':lost?`斷電後 RAM 內容消失，未儲存的修改遺失；SSD 保留 v${diskVersion}。`:'斷電後 RAM 清空，但 SSD 仍保留已儲存的檔案。',lost?'bad':'');};draw();
  }
  function bindFiles(){
    const folders={root:{path:'學習資料／',files:['資訊科技（資料夾）','美術（資料夾）']},it:{path:'學習資料／資訊科技／',files:['網路筆記.txt','作業系統簡報.pptx']},art:{path:'學習資料／美術／',files:['海報.png']}};
    $$('[data-folder]').forEach(b=>b.onclick=()=>{
      const f=folders[b.dataset.folder];$('#file-path').textContent=f.path;
      $$('[data-folder]').forEach(x=>x.classList.toggle('active',x===b));
      $('#file-list').innerHTML=f.files.map(name=>`<button class="file-folder" data-file="${esc(name)}" style="color:#d1e3f4">${esc(name)}</button>`).join('');
      $$('[data-file]').forEach(btn=>btn.onclick=()=>{const name=btn.dataset.file;if(name.includes('資料夾')){$('[data-folder="'+(name.startsWith('資訊')?'it':'art')+'"]').click();return;}$('#file-path').textContent=f.path+name;say(name==='網路筆記.txt'?'找到了！路徑指出資料夾層次，副檔名 .txt 則提示它通常是純文字檔。':'這是 '+name+'，再看看任務要找的檔案。',name==='網路筆記.txt'?'good':'');});
    });
  }
  function bindTerminal(){
    const run=cmd=>{const c=cmd.trim().toLowerCase();if(c==='list'){$('#terminal-log').textContent='note.txt\nphoto.png';say('GUI 的列出檔案與 CLI 的 list，在這個模型中取得相同結果。','good');}else if(c==='open note.txt'){$('#terminal-log').textContent='note.txt：作業系統是協調硬體與軟體的管理者。';say('你透過不同介面，開啟了同一份資料。','good');}else{$('#terminal-log').textContent='無法辨識指令。試試 list 或 open note.txt。';say('指令必須符合規則；可以參照上方範例再試一次。','bad');}};
    $('#gui-list').onclick=()=>run('list');$('#gui-open').onclick=()=>run('open note.txt');
    $('#terminal-form').onsubmit=e=>{e.preventDefault();run($('#terminal-input').value);};
  }
  function bindPermission(){
    const permissions={mic:false,cam:false,loc:false};
    $$('[data-permission]').forEach(b=>b.onclick=()=>{const key=b.dataset.permission;permissions[key]=!permissions[key];b.setAttribute('aria-pressed',String(permissions[key]));b.textContent=permissions[key]?'已允許':'未允許';say('');});
    $('#permission-check').onclick=()=>{const good=permissions.mic&&!permissions.cam&&!permissions.loc;say(good?'設定合理！錄音需要麥克風；這個情境不需要相機與位置。只給任務所需權限，使用後也能撤回。':!permissions.mic?'目前無法錄音：還需要允許麥克風。請同時想想其他權限是否有必要。':'錄音不需要相機與位置。試著關閉這些多餘權限。',good?'good':'bad');};
  }
  function bindPacket(){
    let chosen=[],timer;
    const words=['一起','探索','網路！'];
    function draw(){
      $('#packet-pool').innerHTML=[2,0,1].filter(i=>!chosen.includes(i)).map(i=>`<button class="small-button" data-packet="${i}">封包 ${i+1}：${words[i]}</button>`).join('');
      $('#packet-message').textContent=chosen.length?chosen.map(i=>words[i]).join(''):'等待你重組訊息。';
      $$('[data-packet]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.packet);if(i!==chosen.length){say('先看序號：接收端需要按正確順序重組資料。這張卡片先留著。','bad');return;}chosen.push(i);draw();const next=$('[data-packet]')||$('#packet-reset');next.focus({preventScroll:true});say(chosen.length===3?'重組完成：一起探索網路！封包的順序資訊協助還原完整訊息。':'收到一個正確的片段，繼續重組。',chosen.length===3?'good':'');});
    }
    $('#packet-send').onclick=()=>{clearTimeout(timer);const scene=$('#packet-scene');scene.classList.remove('running');void scene.offsetWidth;scene.classList.add('running');say('訊息被拆成封包，經路由設備逐站轉送。');timer=setTimeout(()=>say('封包抵達！請利用序號重組訊息。'),3800);};
    $('#packet-reset').onclick=()=>{clearTimeout(timer);$('#packet-scene').classList.remove('running');chosen=[];draw();$('#packet-pool button').focus({preventScroll:true});say('已清空重組區，再試一次。');};
    cleanup=()=>clearTimeout(timer);draw();
  }
  function bindDns(){
    let step=0;
    const explanations=['瀏覽器取出 learn.example；/lesson 是路徑，不交給 DNS 轉換。','DNS 的工作是查詢名稱對應的位址，不是搜尋網頁內容。','這個簡化範例收到一個 IPv4 位址。真實查詢也可能得到多個位址或 IPv6 位址。','知道 IP 後，還要連線並依協定請求資源，才會取得網頁。'];
    $('#dns-step').onclick=()=>{if(step>=4)return;$('#dns-'+step).classList.add('active');say(explanations[step],step===3?'good':'');step++;$('#dns-step').disabled=step===4;};
    $('#dns-reset').onclick=()=>{step=0;$$('.trace-step').forEach(x=>x.classList.remove('active'));$('#dns-step').disabled=false;say('從網域名稱重新開始。');};
  }
  function bindUrl(){
    const details=[['https:// · 通訊協定','使用 HTTPS 與網站通訊，透過 TLS 保護傳輸與驗證伺服器身分。仍須判斷網站內容是否可信。'],['learn.example · 網域名稱','人容易記憶的名稱；DNS 通常用它查詢對應 IP。此為教學示意網域。'],['/courses/os.html · 資源路徑','指出伺服器上的目標資源。路徑由網站解讀，不一定對應實體資料夾。']];
    $$('[data-url]').forEach(b=>b.onclick=()=>{const d=details[Number(b.dataset.url)];$$('[data-url]').forEach(x=>x.classList.toggle('selected',x===b));$('#url-detail').innerHTML=`<strong>${esc(d[0])}</strong><p>${esc(d[1])}</p>`;});
  }
  function bindBandwidth(){
    function update(){const rate=Number($('#bandwidth-range').value),latency=Number($('#latency-range').value);$('#bandwidth-out').textContent=rate+' Mbps';$('#latency-out').textContent=latency+' ms';$('#download-time').textContent=(80/rate).toFixed(2)+' 秒';$('#response-time').textContent=latency+' ms';say(rate>=150&&latency>=150?'你設定了高傳輸速率與高延遲：大檔案可較快傳完，但即時互動仍可能感到等待。':'理想傳輸速率影響大檔案傳完所需時間；往返延遲影響來回等候。兩個指標並不相同。');}
    $('#bandwidth-range').oninput=update;$('#latency-range').oninput=update;
  }
  function bindTrouble(){
    const scenes=[
      {q:'情境 1：筆電顯示「Wi-Fi 未連線」，所有網站都打不開。',options:['先確認 Wi-Fi 開關與正確的網路名稱','立刻重新安裝瀏覽器','把所有檔案刪除'],answer:0,text:'先檢查離你最近的連線。確認 Wi-Fi 開關、訊號與正確的 SSID，再逐步向外檢查。'},
      {q:'情境 2：已連上 Wi-Fi，但多位同學也都無法開啟任何網站。',options:['一定是你的 RAM 壞了','詢問老師確認 AP 後端或對外網路狀態','重複輸入帳號密碼到陌生頁面'],answer:1,text:'Wi-Fi 連線只證明你連上無線基地台。後端路由器或對外線路仍可能有問題，由老師或管理人員進一步檢查。'},
      {q:'情境 3：其他網站正常，只有一個網站無法開啟。',options:['立即斷定整個網際網路壞了','先核對網址、稍後再試，必要時回報該站異常','停用所有安全更新'],answer:1,text:'先縮小範圍：單一網站異常可能與網址、站台伺服器、DNS 或路徑有關，不能直接判定是某一個原因。'},
    ];
    let i=0;
    function draw(){const s=scenes[i];$('#trouble-scene').innerHTML=`<h3>${s.q}</h3>${s.options.map((o,j)=>`<button class="trouble-choice" data-trouble="${j}">${esc(o)}</button>`).join('')}<div id="trouble-next"></div>`;$$('[data-trouble]').forEach(b=>b.onclick=()=>{const good=Number(b.dataset.trouble)===s.answer;say(good?s.text:'這個做法無法合理縮小問題，請再找一個更直接、影響較小的檢查步驟。',good?'good':'bad');if(good){$('#trouble-next').innerHTML=i<2?'<button class="primary" id="next-case">下一個情境</button>':'<p class="small-print">三個情境都完成了。先確認現象，再逐步縮小範圍。</p>';if(i<2)$('#next-case').onclick=()=>{i++;draw();say('');};}});}
    $('#trouble-reset').onclick=()=>{i=0;draw();say('');};draw();
  }
  function bindQuiz(l){
    const form=$('#quiz-form');
    const display=(selected,correct)=>{
      l.config.questions.forEach((q,i)=>{const good=selected[i]===q.answer;$('#q-feedback-'+i).innerHTML=`<div class="feedback ${good?'good':'bad'}"><strong>${good?'✓ 答對了':'再想一想'}</strong>　${esc(q.explanation)} ${!good?`<a href="#/lesson/${q.review}">回到第 ${q.review} 頁複習</a>`:''}</div>`;});
      $('#quiz-score').textContent=`最近成績 ${correct} / ${l.config.questions.length}`;
    };
    const stored=state.quizzes[l.id];if(stored)display(stored.selected,stored.correct);
    form.addEventListener('change',()=>{$$('.question-feedback').forEach(e=>e.innerHTML='');$('#quiz-score').textContent='答案已調整，請重新送出';$('#quiz-alert').textContent='';});
    form.onsubmit=e=>{
      e.preventDefault();const data=new FormData(form),selected=[];
      for(let i=0;i<l.config.questions.length;i++){
        if(!data.has('q'+i)){$('#quiz-alert').textContent=`第 ${i+1} 題還沒選答案，完成後再送出。`;form.querySelector(`[name="q${i}"]`).focus();return;}
        selected.push(Number(data.get('q'+i)));
      }
      const correct=selected.filter((a,i)=>a===l.config.questions[i].answer).length;
      const previous=state.quizzes[l.id];state.quizzes[l.id]={selected,correct,total:selected.length,attempts:(previous?.attempts||0)+1,firstCorrect:previous?.firstCorrect??correct,updatedAt:new Date().toISOString()};
      complete();display(selected,correct);$('#quiz-alert').textContent=`已記錄這次作答：${correct} 題答對、${selected.length-correct} 題可再複習。每題解析顯示在選項下方。`;
    };
    $('#quiz-clear').onclick=()=>{form.reset();$$('input[type=radio]',form).forEach(x=>x.checked=false);$$('.question-feedback').forEach(x=>x.innerHTML='');$('#quiz-score').textContent='';$('#quiz-alert').textContent='已清空選項；重新送出後才會更新紀錄。';};
  }
  function openMap(){
    $('#course-grid').innerHTML=units.map((u,i)=>`<section class="map-unit"><h3>${num(i+1)}　${esc(u.title)}</h3>${lessons.filter(l=>l.unit===i).map(l=>`<button class="map-page ${l.id===current?'current':''}" data-page="${l.id}" ${l.id===current?'aria-current="page"':''}><small>${num(l.id)}</small><span>${esc(l.title)}</span>${state.completed.includes(l.id)?'<span class="check" aria-label="已學習">✓</span>':''}</button>`).join('')}</section>`).join('');
    $$('[data-page]').forEach(b=>b.onclick=()=>{$('#course-dialog').close();goto(b.dataset.page);});$('#course-dialog').showModal();
  }
  function info(title,html){$('#info-title').textContent=title;$('#info-body').innerHTML=html;$('#info-dialog').showModal();}
  function exportRecord(){
    const record={course:'系統與網路探索站',version:8,revision:'每頁立體GIF與語音講解版',animations:window.AnimationLab?.getRecord()||[],corePractice:window.getCorePractice?.()||[],exportedAt:new Date().toISOString(),completedPages:state.completed.map(id=>({id,title:lessons[id-1].title})),visitedPages:state.visited,quizzes:Object.entries(state.quizzes).map(([id,q])=>({...q,page:Number(id),title:lessons[Number(id)-1].title,questions:lessons[Number(id)-1].config.questions.map((item,i)=>({question:item.q,selected:item.options[q.selected[i]],correctAnswer:item.options[item.answer],correct:q.selected[i]===item.answer,explanation:item.explanation,reviewPage:item.review}))})),note:state.note,notice:'完成頁數為學生自行標記；成績為最近一次作答，可重做。未填個人身分，不代表正式能力認證。'};
    const serialized=JSON.stringify(record,null,2);
    const objectURL=URL.createObjectURL(new Blob([serialized],{type:'application/json;charset=utf-8'}));
    info('學習紀錄已準備好', `<p>請點選下方連結儲存 JSON 檔案。若瀏覽器沒有開始下載，也可以展開文字內容，複製後自行保存。</p><p><a class="primary download-link" href="${objectURL}" download="系統與網路探索站_學習紀錄.json">下載 JSON 學習紀錄</a></p><details><summary>展開完整紀錄文字</summary><label for="record-text" class="small-print">完整 JSON（可選取複製）</label><textarea id="record-text" class="notes-input" readonly rows="10">${esc(serialized)}</textarea></details>`);
    $('#info-dialog').addEventListener('close',()=>URL.revokeObjectURL(objectURL),{once:true});
  }
  $('.skip').onclick=e=>{e.preventDefault();$('#main').focus();$('#main').scrollIntoView({block:'start'});};
  $$('[data-image-zoom]').forEach(b=>b.onclick=()=>{const zoom=Number(b.dataset.imageZoom);$('#large-illustration').style.width=(zoom*100)+'%';$$('[data-image-zoom]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
  $('#prev').onclick=()=>goto(current-1);$('#next').onclick=()=>goto(current+1);
  $('#mark-done').onclick=()=>{if(state.completed.includes(current)){state.completed=state.completed.filter(n=>n!==current);save();progress();toast('已取消本頁學習標記');}else{complete();toast('★ 已記下這一站的學習進度！');}if(lessons[current-1].mode==='finish')render();};
  $('#font-toggle').onclick=()=>{state.large=!state.large;document.body.classList.toggle('large-font',state.large);$('#font-toggle').setAttribute('aria-pressed',String(state.large));save();};
  $('#open-map').onclick=openMap;$('#mobile-map').onclick=openMap;
  $$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  $('#help-button').onclick=()=>info('依你的步調探索','<ul><li>左側單元與「全部 36 頁」可自由跳頁，底部按鈕逐頁前進。</li><li>每一頁提供一個動畫實驗按鈕，按一下即播放並自動中文講解。可關閉語音或重聽；逐步互動會等當步講解結束再前進，也可暫停、單步、重播及更改情境。每頁有一張知識圖，可點選放大到200%或300%；互動概念圖節點另有說明。排序可拖曳，也可點選完成。</li><li>鍵盤 Tab 移到控制項，Enter 或空白鍵操作；左右方向鍵換頁。</li><li>按「放大字體」可加大內文；瀏覽器也可使用 200% 縮放。</li><li>學習標記與測驗成績分開記錄；作答可重做，複習頁依最近答案提供建議。</li><li>進度只保留在這個瀏覽器。第 36 頁可下載學習紀錄。</li></ul>');
  $('#teaching-button').onclick=()=>info('教學與使用說明','<p>課程共有36頁，包含文字講解、知識圖、操作模型與概念練習。可依單元順序學習，也能從目錄自由選頁。</p><p>圖片中的機器人與場景用來幫助理解；操作皆在網頁中模擬，不會更改裝置設定或測量真實網路。</p><p>學習進度、答案與筆記保留在目前瀏覽器，第36頁可匯出紀錄。建議安排6–8節課，保留預測、操作與討論時間。</p><p><a href="course-plan.html" target="_blank" rel="noopener">教師課程安排</a> · <a href="knowledge-atlas.html" target="_blank" rel="noopener">知識圖總覽</a></p>');
  document.addEventListener('keydown',e=>{if($$('dialog').some(d=>d.open)||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName))return;if(e.key==='ArrowRight'&&current<36){e.preventDefault();goto(current+1);}if(e.key==='ArrowLeft'&&current>1){e.preventDefault();goto(current-1);}});
  window.addEventListener('hashchange',()=>{render();$('#main').focus({preventScroll:true});});
  render();
})();
