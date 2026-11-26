/* Original, neutral question scenes. They restate each situation without marking an answer. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const palette = ['#e9eeff', '#e0f5f4', '#fff0e5', '#f0e7fc'];
  const stroke = '#7184bd';
  const shortLabels = {'作業系統':'OS','繪圖程式':'繪圖','RAM ／ SSD':'RAM / SSD','DNS 伺服器':'DNS','lab.example':'主機','learn.example':'名稱','換成另一種單位':'換算','現成影像功能':'影像功能','Internet':'網際網路','one.example':'名稱 A','two.example':'名稱 B','2023 年 4 月・桌面 OS':'2023/04'};
  const text = (x, y, value, size = 32, weight = 650, anchor = 'middle') => {
    let label=shortLabels[String(value)]||String(value);
    label=label.replace(/^磁碟 (\d+)$/,'碟 $1').replace(/^第 (\d+) 站$/,'$1站');
    if(label.length>10)return '';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${Math.max(28,size)}" font-weight="${weight}" fill="#29365e">${esc(label)}</text>`;
  };
  const line = (x1, y1, x2, y2, arrow = false) => `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 7"/>${arrow ? `<path d="M${x2-(x2>=x1?8:-8)} ${y2-6} L${x2} ${y2} L${x2-(x2>=x1?8:-8)} ${y2+6}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>` : ''}`;
  const ask = (x = 280, y = 88) => `<circle cx="${x}" cy="${y}" r="25" fill="#fff" stroke="#9c82d1" stroke-width="3"/>${text(x,y+10,'?',32,800)}`;
  function icon(type, x, y, scale = 1.5) {
    const shapes = {
      monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8m-4-5v5M6 7h7m-7 4h12"/>',
      app: '<rect x="2" y="2" width="20" height="20" rx="4"/><path d="M2 8h20M6 5h.01M10 5h.01M7 13h10m-10 4h6"/>',
      cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
      ram: '<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M6 9h3v5H6zm9 0h3v5h-3zM5 18v3m4-3v3m6-3v3m4-3v3"/>',
      drive: '<rect x="3" y="2" width="18" height="20" rx="3"/><path d="M3 16h18M7 19h.01M11 19h.01"/><circle cx="12" cy="9" r="4"/>',
      file: '<path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8m-8 4h8"/>',
      folder: '<path d="M2 7h8l2 3h10v11H2zM2 7V4h7l3 3"/>',
      phone: '<rect x="6" y="1" width="12" height="22" rx="3"/><path d="M10 4h4m-2 16h.01"/>',
      wifi: '<path d="M2 8c6-6 14-6 20 0M6 12c4-4 8-4 12 0m-8 4c1-1 3-1 4 0"/><circle cx="12" cy="21" r="1"/>',
      network: '<rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="17" width="6" height="6" rx="1"/><rect x="17" y="17" width="6" height="6" rx="1"/><path d="M12 7v5M4 17v-5h16v5"/>',
      router: '<rect x="2" y="11" width="20" height="10" rx="3"/><path d="M6 11V3m12 8V3M6 16h.01m4 0h.01m4 0h4"/>',
      globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c-6 6-6 14 0 20 6-6 6-14 0-20"/>',
      mail: '<rect x="1" y="4" width="22" height="16" rx="3"/><path d="m2 6 10 8L22 6"/>',
      shield: '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z"/><path d="M12 7v6m0 4h.01"/>',
      power: '<path d="M12 1v10M6 4a10 10 0 1 0 12 0"/>',
      book: '<path d="M12 5c-3-3-7-3-10-2v17c3-1 7-1 10 2 3-3 7-3 10-2V3c-3-1-7-1-10 2zM12 5v17M5 7h4m-4 4h4m6-4h4m-4 4h4"/>',
      tools: '<path d="m14 6 4-4a6 6 0 0 0-8 8L2 18a3 3 0 0 0 4 4l8-8a6 6 0 0 0 8-8l-4 4z"/>',
      pixels: '<path d="M2 2h6v6H2zm7 0h6v6H9zm7 0h6v6h-6zM2 9h6v6H2zm7 0h6v6H9zm7 0h6v6h-6zM2 16h6v6H2zm7 0h6v6H9zm7 0h6v6h-6z"/>',
      gpu: '<rect x="1" y="5" width="22" height="14" rx="2"/><circle cx="8" cy="12" r="4"/><circle cx="17" cy="12" r="3"/><path d="M5 19v3m4-3v3m4-3v3"/>',
      clock: '<circle cx="12" cy="12" r="10"/><path d="M12 5v7l5 3"/>',
      flash: '<path d="m14 1-9 13h6l-1 9 9-13h-6z"/>',
      contact: '<rect x="3" y="2" width="19" height="20" rx="2"/><path d="M1 6h4M1 12h4M1 18h4M9 18c0-4 9-4 9 0"/><circle cx="13.5" cy="8" r="3"/>',
      speaker: '<path d="M2 8h5l6-5v18l-6-5H2zM17 7c4 3 4 7 0 10m3-13c6 5 6 11 0 16"/>',
      lock: '<rect x="4" y="10" width="16" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
      search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',
      gate: '<path d="M2 22V5h20v17M2 5l10-4 10 4M7 8v14m5-14v14m5-14v14"/>'
    };
    return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#526ca7" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${shapes[type] || shapes.app}</g>`;
  }
  function card(x, label, type = 'app', options = {}) {
    const {y=20,w=156,h=128,sub='',color=0}=options;
    return `<rect x="${x}" y="${y+4}" width="${w}" height="${h}" rx="18" fill="#d4dcf2"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${palette[color%palette.length]}" stroke="#a7b9e8" stroke-width="2"/>${icon(type,x+w/2-26,y+15,2.15)}${text(x+w/2,y+106,label,32)}`;
  }
  const token = (x,y,label,color=0,w=76) => `<rect x="${x}" y="${y}" width="${w}" height="44" rx="10" fill="${palette[color%palette.length]}" stroke="#9aaedd" stroke-width="2"/>${text(x+w/2,y+31,label,28)}`;
  const twoCards = (a,b) => card(20,a[0],a[1],{w:196,sub:a[2]||''})+line(226,84,334,84)+ask()+card(344,b[0],b[1],{w:196,sub:b[2]||'',color:3});
  const SCENES = {
    hardware: () => [['瀏覽器','app'],['作業系統','app'],['CPU','cpu'],['繪圖程式','pixels']].map(([l,t],i)=>card(9+i*140,l,t,{w:122,color:i})).join(''),
    memorySharing: () => token(18,15,'程式 A',0,100)+token(18,70,'程式 B',1,100)+token(18,125,'程式 C',2,100)+line(130,33,225,83)+line(130,88,225,83)+line(130,143,225,83)+ask(253,83)+line(281,83,361,83)+card(380,'RAM','ram',{w:160,sub:'如何安排使用？',color:3}),
    boot: () => [['桌面','monitor'],['韌體','cpu'],['電源','power'],['作業系統','app']].map(([l,t],i)=>card(9+i*140,l,t,{w:122,color:i,sub:i===1?'啟動順序？':''})).join(''),
    savedClose: () => card(12,'報告已儲存','file',{w:160})+ask(203,84)+card(240,'RAM','ram',{w:145,color:1})+card(400,'SSD','drive',{w:145,color:3}),
    scheduling: () => card(20,'單一核心','cpu',{w:180,sub:'多個工作要使用'})+token(250,22,'A',0)+token(340,22,'B',1)+token(430,22,'C',2)+line(290,71,290,105)+line(380,71,380,105)+line(470,71,470,105)+text(380,135,'輪流執行，這是什麼？',20),
    permission: () => twoCards(['手電筒程式','flash','提出存取要求'],['通訊錄','contact','要怎麼決定？']),
    compute: () => card(15,'影像像素','pixels',{w:154,sub:'大量相似工作'})+line(180,84,232,84)+ask(262,84)+card(310,'CPU','cpu',{w:110,color:1})+card(436,'GPU','gpu',{w:110,color:3}),
    raidBackup: () => [0,1,2,3].map(i=>card(13+i*114,`磁碟 ${i+1}`,'drive',{w:99,h:120,color:i,y:18})).join('')+ask(510,82)+text(233,170,'RAID 5 與備份，如何判斷？',20),
    license: () => card(16,'軟體套件','app',{w:166,sub:'免費取得'})+line(193,84,244,84)+ask(274,84)+card(336,'修改與分享','file',{w:208,sub:'有哪些使用條件？',color:3}),
    wifiWebsite: () => card(18,'手機','phone',{w:164,sub:'已連上 Wi-Fi'})+icon('wifi',205,36)+ask(282,106)+line(310,84,365,84)+card(382,'外部網站','globe',{w:160,sub:'網頁未開啟',color:3}),
    networks: () => card(16,'網路 A','network',{w:162})+line(190,84,250,84)+ask(280,84)+line(310,84,370,84)+card(382,'網路 B','network',{w:162,color:3})+text(280,155,'由哪個角色連起來？',20),
    packets: () => card(16,'傳送端','monitor',{w:150})+line(180,84,365,84)+token(196,24,'封包 1',0,100)+token(298,24,'封包 2',1,100)+token(247,116,'封包 3',2,100)+ask(278,84)+card(398,'接收端','monitor',{w:146,color:3}),
    osRole: () => card(16,'日常操作','app',{w:168,sub:'開程式、存檔…'})+line(194,84,251,84)+ask(280,84)+line(310,84,365,84)+card(382,'作業系統','app',{w:162,sub:'主要負責什麼？',color:3}),
    ramSsd: () => twoCards(['RAM','ram','執行中的內容'],['SSD','drive','已寫入的檔案']),
    neutralLayers: () => [0,1,2,3].map(i=>`<rect x="150" y="${8+i*41}" width="260" height="34" rx="10" fill="${palette[i]}" stroke="#a6b7e0" stroke-width="2"/>${text(280,35+i*41,['應用','傳輸','網際網路','網路存取'][i],28)}`).join('')+ask(80,90)+icon('network',455,64,2),
    layers: () => token(15,33,'TCP',0,122)+token(15,105,'UDP',1,122)+line(150,51,242,84)+line(150,123,242,84)+ask(271,84)+[0,1,2,3].map(i=>`<rect x="345" y="${9+i*39}" width="198" height="32" rx="9" fill="${palette[i]}" stroke="#a6b7e0" stroke-width="2"/>`).join('')+text(444,95,'第幾層？',20),
    routing: () => token(16,64,'封包',0,96)+line(124,82,181,82)+card(196,'路由器','router',{w:166,sub:'根據什麼選路？'})+line(375,82,462,30)+line(375,82,462,84)+line(375,82,462,138)+ask(501,30)+ask(501,84)+ask(501,138),
    dns: () => card(16,'learn.example','app',{w:196,sub:'瀏覽器中的名稱'})+line(224,84,325,84)+ask(276,84)+card(344,'DNS','network',{w:200,sub:'它負責哪項工作？',color:3}),
    lookup: () => twoCards(['DNS 伺服器','network','192.0.2.53'],['lab.example','globe','203.0.113.20']),
    units: () => twoCards(['傳輸速率','network','80 Mbps'],['換成另一種單位','file','？ MB/s']),
    firewall: () => card(12,'內部裝置','monitor',{w:146})+line(171,50,218,50,true)+line(218,125,171,125,true)+icon('gate',246,46,2.2)+text(272,150,'防火牆',20)+line(328,50,386,50,true)+line(386,125,328,125,true)+card(402,'遠端網站','globe',{w:146,color:3})+text(278,31,'請求與回應，依什麼判斷？',20),
    touch: () => card(182,'觸控螢幕','phone',{w:196,sub:'想一想它的功能'})+`<path d="M356 95c15-17 22-25 27-20 5 4 0 11-5 17 20-3 31 5 26 18l-15 29-21-2-22-22c-10-10-1-19 10-12" fill="#ffe0c9" stroke="#9a78a7" stroke-width="2"/>`+ask(111,88)+ask(459,88),
    library: () => twoCards(['應用程式','app','想處理一張圖片'],['現成影像功能','tools','從哪裡取得？']),
    beep: () => card(15,'開機檢查','monitor',{w:160,sub:'發出三聲嗶聲'})+icon('speaker',214,35,1.9)+text(279,109,'嗶・嗶・嗶',20)+ask(280,151)+card(386,'診斷線索','search',{w:160,sub:'能直接下結論？',color:3}),
    multicore: () => twoCards(['2 個核心','cpu','原本的處理器'],['4 個核心','cpu','執行速度會如何？']),
    cache: () => token(17,66,'資料 A',0,106)+line(135,84,199,84)+[0,1,2].map(i=>card(218+i*110,['L1','L2','RAM'][i],i===2?'ram':'cpu',{w:98,h:122,y:20,sub:'？',color:i})).join(''),
    datedChart: () => card(20,'2023/04','book',{w:196})+line(226,84,334,84)+ask()+card(344,'桌面 OS','monitor',{w:196,color:3}),
    deletedRaid: () => [0,1,2,3].map(i=>card(12+i*114,`磁碟 ${i+1}`,'drive',{w:99,h:118,y:12,color:i})).join('')+icon('file',489,32)+ask(508,109)+text(233,163,'RAID 5：誤刪後能找回舊版嗎？',20),
    classroom: () => `<rect x="18" y="15" width="524" height="144" rx="22" fill="#f0f3ff" stroke="#a9b9e4" stroke-width="2"/>${text(280,43,'教室內的網路',22)}${icon('monitor',78,75,1.8)}${icon('phone',435,75,1.8)}${icon('router',253,85,1.6)}${line(133,101,239,101)}${icon('wifi',349,70,1.5)}${text(160,145,'網路線',18,500)}${text(399,145,'Wi-Fi',18,500)}`,
    mobileAccess: () => card(17,'手機','phone',{w:160,sub:'使用行動數據'})+line(190,84,246,84)+ask(280,84)+line(313,84,370,84)+card(385,'Internet','globe',{w:160,sub:'第一段連到哪裡？',color:3}),
    combinedDevice: () => `<rect x="163" y="64" width="234" height="71" rx="20" fill="#e3edf9" stroke="#7184bd" stroke-width="3"/><path d="M187 64V23m186 41V23" stroke="#7184bd" stroke-width="5" stroke-linecap="round"/>${[0,1,2,3].map(i=>`<rect x="${219+i*37}" y="91" width="24" height="20" rx="3" fill="#fff" stroke="#7184bd" stroke-width="2"/>`).join('')}${icon('wifi',263,15,1.4)}${text(280,164,'一台設備：Wi-Fi 與多個網路孔',20)}${ask(81,90)}${ask(480,90)}`,
    sharedLink: () => icon('monitor',19,25,1.5)+icon('phone',19,113,1.5)+line(73,46,168,84)+line(73,135,168,84)+line(175,84,453,84)+[0,1,2,3].map(i=>token(184+i*66,65,i%2?'B':'A',i%2?1:3,52)).join('')+icon('network',478,65,1.7)+text(311,139,'兩筆通訊共用同一條鏈路',20),
    gatewayDns: () => twoCards(['預設閘道','router','一種網路角色'],['DNS 伺服器','network','另一種網路角色']),
    sameIp: () => token(14,22,'one.example',0,190)+token(14,119,'two.example',3,190)+line(216,40,310,85)+line(216,137,310,85)+card(334,'同一 IP','globe',{w:210,sub:'203.0.113.20'})+ask(278,86),
    indicators: () => twoCards(['指標 A','network','100 Mbps'],['指標 B','clock','20 ms']),
    trace: () => token(12,67,'起點',0,80)+line(102,85,167,85)+token(178,67,'第 1 站',1,100)+line(288,85,327,85)+token(337,67,'*',3,60)+line(407,85,450,85)+token(461,67,'終點',2,88)+text(286,36,'tracert 的一段示例',22)+text(284,154,'中間未回覆，最後仍有回應',20)
  };
  const formal = {
    6:[['hardware','硬體與軟體出現在同一台電腦中。'],['memorySharing','三個程式都想使用 RAM，需要安排使用。'],['boot','電源、韌體、OS 與桌面，啟動時如何排序？']],
    12:[['savedClose','報告已經儲存，接著關閉應用程式視窗。'],['scheduling','多個工作輪流使用同一個 CPU 核心。'],['permission','手電筒程式提出讀取通訊錄的要求。']],
    18:[['compute','大量影像像素要運算，CPU 與 GPU 如何分工？'],['raidBackup','四顆磁碟組成 RAID 5，還需要考慮哪些資料保護？'],['license','軟體免費取得，接著想修改或分享。']],
    24:[['wifiWebsite','手機已連上 Wi-Fi，但外部網頁沒有開啟。'],['networks','兩個不同網路需要互相通訊。'],['packets','一筆資料分成多個封包，從傳送端前往接收端。']],
    34:[['osRole','使用者進行開程式、存檔等日常操作。'],['ramSsd','比較 RAM 與 SSD 的用途和關機後的情況。'],['layers','TCP 與 UDP 在四層模型中屬於哪一層？'],['routing','路由器面對多個方向，需要選擇下一站。'],['dns','瀏覽器中的網站名稱，與 DNS 有什麼關係？'],['lookup','查詢結果中出現 DNS 伺服器與所查主機兩個位址。'],['units','把 80 Mbps 換成 MB/s，空格應填多少？'],['firewall','連線請求與回應經過防火牆，應如何判斷？']]
  };
  const coreScenes = {
    2:['touch','一台正在操作的觸控螢幕，請判斷它的功能角色。'],
    3:['library','應用程式需要取得現成的影像處理功能。'],
    5:['beep','電腦在開機時發出三聲嗶聲，這提供什麼線索？'],
    7:['multicore','核心數增加後，同一個程式的速度會如何改變？'],
    8:['cache','處理器尋找資料 A，在 L1 沒有找到。'],
    13:['datedChart','圖表標示 2023 年 4 月與桌面 OS 範圍，應如何解讀？'],
    15:['compute','大量相似像素需要處理，思考 CPU 與 GPU 的分工。'],
    16:['deletedRaid','四顆磁碟組成 RAID 5，檔案誤刪後能否找回舊版？'],
    19:['classroom','教室中的裝置分別透過網路線與 Wi-Fi 連接。'],
    20:['mobileAccess','手機正在使用行動數據，第一段無線接取連向哪裡？'],
    21:['combinedDevice','同一台設備提供 Wi-Fi 和多個網路孔。'],
    22:['sharedLink','A、B 兩筆通訊的資料交錯通過同一條鏈路。'],
    23:['gatewayDns','預設閘道與 DNS 伺服器，兩種角色的功能是否相同？'],
    25:['neutralLayers','比較不同協定的工作，判斷傳輸層常見哪一組。'],
    26:['sameIp','兩個不同名稱都查到 203.0.113.20，還能推論什麼？'],
    29:['indicators','比較 100 Mbps 與 20 ms，兩個數字衡量什麼？'],
    30:['firewall','請求與回應往返穿越防火牆，如何依政策判斷？'],
    33:['trace','中間一站顯示星號，但最後目的地仍回應。']
  };
  window.questionVisual = (lessonId,questionIndex,core=false) => {
    const lesson=Number(lessonId),index=Number(questionIndex);
    const entry=core?(index===0?coreScenes[lesson]:null):formal[lesson]?.[index];
    if(!entry || !SCENES[entry[0]])return '';
    const [scene,description]=entry;
    const titleId=`question-visual-${core?'core':'quiz'}-${lesson}-${index}`;
    return `<figure class="question-visual"><svg class="question-visual-svg" viewBox="0 0 560 180" width="560" height="180" role="img" aria-labelledby="${titleId}" xmlns="http://www.w3.org/2000/svg"><title id="${titleId}">${esc(description)}</title><g font-family="system-ui,-apple-system,'PingFang TC','Microsoft JhengHei',sans-serif">${SCENES[scene]()}</g></svg><figcaption class="question-visual-caption"><strong>情境圖示</strong><span>${esc(description)}</span></figcaption></figure>`;
  };
})();
