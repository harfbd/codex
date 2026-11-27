/* Twelve additional lessons. Builders are pure; drawings never access host files or networks. */
(() => {
  'use strict';
  const defs=window.ANIMATION_DEFS=window.ANIMATION_DEFS||[];
  const C={purple:'#7958bd',green:'#208d75',blue:'#2e7eb1',amber:'#b77b24',red:'#b84968',ink:'#293b60'};
  const clamp=t=>Math.max(0,Math.min(1,Number(t)||0));
  const option=(value,label)=>({value,label});
  const select=(key,label,value,options)=>({key,label,type:'select',default:value,options});
  const node=(id,x,y,w,title,subtitle='',fill='#edf2ff')=>({id,x,y,w,h:96,title,subtitle,fill});
  const row=(items,y=146)=>items.map((n,i)=>node(n[0],20+i*191,y,156,n[1],n[2]||'',n[3]));
  const four=(items,y=140)=>items.map((n,i)=>node(n[0],25+i*237,y,199,n[1],n[2]||'',n[3]));
  const step=(title,description,from,to,label='資料',extra={})=>({title,description,from,to,label,...extra});
  const phases=steps=>steps.map((s,phase)=>({...s,phase}));
  function travel(S,points,t,label,color){
    const lens=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
    let d=lens.reduce((a,b)=>a+b,0)*clamp(t);
    for(let i=0;i<lens.length;i++){if(d<=lens[i]||i===lens.length-1)return S.move(...points[i],...points[i+1],lens[i]?d/lens[i]:1,label,color);d-=lens[i];}
    return '';
  }
  function graph(S,s,t,nodes,links,caption='',background=''){
    const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
    const points=(from,to,lane=302)=>{const a=byId[from],b=byId[to],ay=a.y+a.h/2,by=b.y+b.h/2,right=b.x>a.x,x1=right?a.x+a.w:a.x,x2=right?b.x:b.x+b.w;
      const low=Math.min(x1,x2),high=Math.max(x1,x2),blocked=nodes.some(n=>n.id!==from&&n.id!==to&&n.x<high&&n.x+n.w>low&&ay>=n.y&&ay<=n.y+n.h);
      if(Math.abs(ay-by)<2&&!blocked)return [[x1,ay],[x2,by]];
      if(Math.abs(ay-by)>2&&high>low){const mid=(x1+x2)/2;return [[x1,ay],[mid,ay],[mid,by],[x2,by]];}
      return [[a.x+a.w/2,a.y+a.h+6],[a.x+a.w/2,lane],[b.x+b.w/2,lane],[b.x+b.w/2,b.y+b.h+6]];};
    let out=background;
    for(const [from,to] of links){const pts=points(from,to);out+=`<path d="${pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}" fill="none" stroke="#b6c5df" stroke-width="3"/>`;out+=S.arrow(...pts[pts.length-2],...pts[pts.length-1],'#9aaccc');}
    for(const n of nodes){out+=S.box(n.x,n.y,n.w,n.h,n.title,s.status?.[n.id]??n.subtitle,(s.active||[s.to]).includes(n.id),n.fill);}
    const a=byId[s.from],b=byId[s.to],color=s.color||C.purple;
    if(a&&b&&s.from!==s.to){const ids=[s.from,...(s.via||[]),s.to],pts=[];for(let i=0;i<ids.length-1;i++)pts.push(...points(ids[i],ids[i+1],s.lane||302).slice(i?1:0));out+=travel(S,pts,t,s.label,color);}
    else if(a){const angle=clamp(t)*Math.PI*2,x=a.x+a.w/2+Math.cos(angle)*(a.w/2+9),y=a.y+a.h/2+Math.sin(angle)*(a.h/2+9);out+=`<ellipse cx="${a.x+a.w/2}" cy="${a.y+a.h/2}" rx="${a.w/2+10}" ry="${a.h/2+10}" fill="none" stroke="${color}" stroke-width="${2+2*Math.sin(clamp(t)*Math.PI)}" stroke-dasharray="7 6"/><circle cx="${x}" cy="${y}" r="7" fill="${color}"/>`;out+=S.pill(Math.max(16,Math.min(790,a.x+a.w/2-75)),338,150,s.label,'#f3edff',color);}
    if(caption)out+=S.text(480,414,caption,24);
    return out;
  }

  defs.push({
    assetVersion:8,id:'digital-journey',lesson:1,title:'點一下，網頁如何出現',
    intro:'沿著瀏覽器、作業系統、網路與伺服器，追蹤一個日常操作。',
    prompt:'點擊發生在自己的電腦，哪一步需要遠端伺服器協助？',
    limit:'這是完整旅程的概覽；省略名稱解析、協定細節與實際時間，所有請求均為教學模擬。',
    controls:[select('task','網站上的操作','read',[option('read','開啟課程網頁'),option('image','查看網站圖片')])],
    build(v){const answer=v.task==='image',what=answer?'圖片要求':'頁面要求';return phases([
      step(answer?'按下查看圖片':'點開課程網站',answer?'瀏覽器收到查看網站圖片的操作，準備向網站取得圖片。':'瀏覽器收到開啟網站的操作，準備向網站取得頁面。','browser','browser','點擊',{answer}),
      step('請作業系統協助','瀏覽器使用作業系統提供的網路服務；OS 也協調記憶體與設備資源。','browser','os','網路要求',{answer}),
      step('資料經過網路',`${what}經過可用的網路連線，前往遠端網站伺服器。`,'os','network',what,{answer}),
      step('伺服器處理要求',answer?'網站伺服器依要求準備圖片資料。':'網站伺服器依要求準備課程頁面的資料。','network','server','網站要求',{answer}),
      step('回應沿網路返回','伺服器回傳的資料沿網路回到學生的電腦。','server','network','回應',{answer,color:C.green}),
      step('瀏覽器呈現結果',answer?'瀏覽器根據回應顯示網站圖片。':'瀏覽器根據回應呈現課程網頁，畫面由本機與遠端系統共同完成。','network','browser','結果',{answer,color:C.green,status:{browser:answer?'顯示圖片':'呈現課程頁面'}})
    ]);},
    draw(s,t,S){return graph(S,s,t,four([['browser','瀏覽器',s.answer?'查看網站圖片':'開啟課程網頁'],['os','作業系統','本機資源與服務','#efe5ff'],['network','網路','連接本機與遠端','#e2f3fb'],['server','網站伺服器','處理並回應','#e2f5eb']]),[['browser','os'],['os','network'],['network','server']],'一次點擊，跨越本機與遠端的合作');}
  });

  defs.push({
    assetVersion:8,id:'software-roles',lesson:3,title:'應用程式與 OS 的分工',
    intro:'選擇編輯或播放工作，觀察應用程式、OS 及硬體各負責什麼。',
    prompt:'編輯工具提供的功能，和 OS 管理資源的工作有何不同？',
    limit:'以一般桌面應用程式為例；服務與硬體細節經過簡化，不代表應用程式就是 OS。',
    controls:[select('task','應用工作','edit',[option('edit','編輯並儲存筆記'),option('music','播放一段音樂')])],
    build(v){const music=v.task==='music';return phases([
      step('應用程式提供功能',music?'音樂播放器提供選曲與播放功能，這是使用者要完成的工作。':'筆記程式提供編輯功能，這是使用者要完成的工作。','app','app',music?'播放':'編輯',{music}),
      step('向 OS 申請服務',music?'播放器向 OS 申請音訊輸出服務，而不是任意佔用所有設備。':'筆記程式請 OS 儲存資料，由系統服務處理檔案存取。','app','os','服務要求',{music}),
      step('OS 協調硬體資源',music?'OS 協調音訊設備與其他資源，讓播放器取得需要的服務。':'OS 協調檔案系統與儲存設備，安排這次寫入。','os','hardware','設備工作',{music}),
      step('硬體執行工作',music?'音訊設備依資料輸出聲音；應用功能、系統服務與設備各有角色。':'儲存設備完成本例的資料寫入，並回報處理狀態。','hardware','hardware',music?'輸出聲音':'寫入完成',{music,color:C.green}),
      step('系統回報狀態','OS 把服務的處理狀態交回應用程式，應用程式再更新自己的介面。','hardware','os','狀態',{music,color:C.green}),
      step('應用介面更新',music?'播放器顯示播放狀態。播放器是應用程式，管理資源的 OS 是系統軟體。':'筆記程式顯示儲存完成。筆記程式是應用程式，OS 屬於系統軟體。','os','app','更新介面',{music,color:C.green})
    ]);},
    draw(s,t,S){const nodes=[node('app',55,138,230,s.music?'音樂播放器':'筆記程式','提供應用功能'),node('os',365,138,230,'作業系統 OS','管理資源與服務','#efe5ff'),node('hardware',675,138,230,s.music?'音訊設備':'儲存設備','執行設備工作','#e2f5eb')];return graph(S,s,t,nodes,[['app','os'],['os','hardware']],'應用程式提出工作；OS 協調資源；硬體執行');}
  });

  defs.push({
    assetVersion:8,id:'gui-cli',lesson:10,title:'GUI 與 CLI 看同一個資料夾',
    intro:'切換點擊圖示與輸入指令，比較同一份模擬檔案清單。',
    prompt:'操作介面改變後，資料夾裡的檔案是否也一定跟著改變？',
    limit:'資料夾與指令都是固定的教學模型；不讀取、不列出，也不修改這台電腦的實際檔案。',
    controls:[select('interface','選擇操作介面','gui',[option('gui','GUI：點擊資料夾'),option('cli','CLI：輸入列出指令')])],
    build(v){const cli=v.interface==='cli';return phases([
      step('先固定相同資料','模擬的「課堂資料」資料夾中有筆記.txt、照片.png、報告.pdf，兩種介面共用同一份清單。','files','files','固定內容',{cli}),
      step(cli?'輸入列出指令':'點擊資料夾圖示',cli?'在模擬 CLI 輸入 ls 課堂資料，表達列出資料夾內容的要求。':'在模擬 GUI 點擊「課堂資料」圖示，表達開啟資料夾的要求。',cli?'cli':'gui',cli?'cli':'gui',cli?'ls':'點擊',{cli}),
      step('要求相同的檔案資料','這次要求只取得清單，不新增、刪除或修改任何檔案。',cli?'cli':'gui','files','讀取清單',{cli}),
      step('取得同一份清單','檔案資料來源相同，回傳的三個檔名也相同。','files',cli?'cli':'gui','三個檔名',{cli,color:C.green}),
      step(cli?'文字方式呈現':'圖示方式呈現',cli?'CLI 以文字列出三個檔名；介面形式與檔案內容是不同的概念。':'GUI 以圖示與檔名呈現三個檔案；操作方式改變不等於內容改變。',cli?'cli':'gui',cli?'cli':'gui','相同內容',{cli,color:C.green,status:{[cli?'cli':'gui']:'列出 3 個檔案'}}),
      step('比較操作與內容','切換介面再觀察：操作方式不同，這個模擬資料夾的三個檔案保持相同。','files','files','內容相同',{cli,color:C.green})
    ]);},
    draw(s,t,S){const n=[node('gui',35,95,250,'GUI 圖形介面',s.cli?'本次未選用':'點擊「課堂資料」'),node('files',355,95,250,'課堂資料','同一份模擬資料','#e2f5eb'),node('cli',675,95,250,'CLI 指令介面',s.cli?'ls 課堂資料':'本次未選用','#efe5ff')];let out=graph(S,s,t,n,[['gui','files'],['cli','files']],'介面不同，要求與資料可以相同');out+=S.pill(75,225,810,'筆記.txt　　照片.png　　報告.pdf','#fff8e9');return out;}
  });

  defs.push({
    assetVersion:8,id:'os-compatibility',lesson:13,title:'安裝前先核對相容條件',
    intro:'讓同一份軟體套件遇上不同 OS 或處理器架構，逐項核對條件。',
    prompt:'作業系統符合時，為什麼仍需要看處理器架構與套件說明？',
    limit:'虛構套件僅提供 Windows 11 x64 版本；本模型不使用模擬器或相容層，實際相容性以套件文件為準。',
    controls:[select('target','要安裝的環境','match',[option('match','Windows 11／x64'),option('os','Linux／x64'),option('arch','Windows 11／ARM64')])],
    build(v){const target=['match','os','arch'].includes(v.target)?v.target:'match',osOK=target!=='os',archOK=target!=='arch',ok=osOK&&archOK;return phases([
      step('先讀套件支援條件','這份虛構套件只提供 Windows 11 的 x64 版本，先查支援條件再決定。','package','package','讀取條件',{target,osOK,archOK,ok}),
      step('核對作業系統',osOK?'目標使用 Windows 11，符合這份套件列出的 OS 條件。':'目標使用 Linux，與這份 Windows 11 套件的 OS 條件不符。','package','os','核對 OS',{target,osOK,archOK,ok,color:osOK?C.green:C.red,status:{os:osOK?'OS 符合':'OS 不符'}}),
      step('再核對處理器架構',archOK?'目標是 x64，符合這份套件列出的處理器架構。':'目標是 ARM64，與本例套件的 x64 條件不同；本模型不提供轉譯。','package','cpu','核對架構',{target,osOK,archOK,ok,color:archOK?C.green:C.red,status:{cpu:archOK?'x64 符合':'ARM64 不符'}}),
      step('合併兩項檢查',ok?'本例 OS 與架構都符合，可以繼續依套件文件檢查其他安裝條件。':'至少一項條件不符，本例不直接執行此套件，應尋找支援目標環境的版本。','os','result',ok?'符合條件':'不符條件',{target,osOK,archOK,ok,color:ok?C.green:C.red,status:{result:ok?'可繼續安裝檢查':'尋找適用版本'}}),
      step('相容性依版本判斷','有些軟體提供多個平台版本，但不能只因名稱相同，就推定所有套件都能跨平台執行。','result','result','查閱文件',{target,osOK,archOK,ok,color:ok?C.green:C.amber})
    ]);},
    draw(s,t,S){return graph(S,s,t,four([['package','軟體套件','Windows 11 x64'],['os','目標 OS',s.target==='os'?'Linux':'Windows 11','#efe5ff'],['cpu','目標架構',s.target==='arch'?'ARM64':'x64','#fff2dc'],['result','核對結果',s.phase>=3?(s.ok?'條件符合':'條件不符'):'等待核對','#e2f5eb']]),[['package','os'],['package','cpu'],['os','result']],'本例不含相容層；依這一份套件的支援條件判斷');}
  });

  defs.push({
    assetVersion:8,id:'license-check',lesson:17,title:'使用軟體前先讀授權',
    intro:'比較開放原始碼與僅限自用的示範授權，判斷能否分享套件。',
    prompt:'開放原始碼授權允許分享時，仍需要履行哪些明確條件？',
    limit:'MIT 情境只示範保留著作權與授權聲明等條件；另一授權為虛構範例。實際權利義務須讀完整授權。',
    controls:[select('license','套件的授權','mit',[option('mit','MIT 開放原始碼授權'),option('personal','示範授權：僅限個人自用')]),select('reuse','計畫中的行為','share',[option('share','分享原始套件副本'),option('modify','修改後再分享套件')])],
    build(v){const mit=v.license!=='personal',modified=v.reuse==='modify';return phases([
      step('先辨認作品與行為',modified?'本例打算修改程式後再分享。取得檔案不等於自動取得所有使用權利。':'本例打算分享套件副本。取得檔案不等於自動取得所有使用權利。','work','work',modified?'修改再分享':'分享副本',{mit,modified}),
      step('找到適用的授權',mit?'本例套件採 MIT 授權，授權文字允許修改與散布等使用方式。':'本例的虛構授權僅允許個人自用，未提供重新散布的許可。','work','license','讀取授權',{mit,modified}),
      step('把行為對照許可',mit?'計畫的分享行為在本例許可範圍內，接著仍要確認並履行授權條件。':'計畫包含分享給他人，超出本例僅限自用的許可，先不要散布。','license','action',mit?'許可範圍內':'尚未獲許可',{mit,modified,color:mit?C.green:C.red,status:{action:mit?'分享獲許可':'先不分享'}}),
      step(mit?'保留必要聲明':'改用合適方案',mit?'分享副本或重要部分時，保留著作權與 MIT 授權聲明；修改不會消除這項條件。':'可另行取得權利人許可，或選用明確允許這種分享方式的替代套件。','action','credit',mit?'保留聲明':'取得許可',{mit,modified,color:mit?C.green:C.amber}),
      step('依授權條件行動',mit?'開放原始碼不等於沒有條件。依本例授權保留必要聲明後，才進行分享。':'在尚未取得適用許可前，不散布這份套件；尊重著作權與授權範圍。','credit','credit',mit?'履行條件':'尊重許可',{mit,modified,color:mit?C.green:C.amber})
    ]);},
    draw(s,t,S){return graph(S,s,t,four([['work','軟體作品',s.modified?'修改後的套件':'原始套件'],['license','授權文件',s.mit?'MIT 授權':'僅限自用','#efe5ff'],['action','計畫行為','分享給他人','#fff2dc'],['credit','履行條件',s.mit?'保留必要聲明':'先取得適用許可','#e2f5eb']]),[['work','license'],['license','action'],['action','credit']],'取得檔案後，仍須核對許可與授權條件');}
  });

  defs.push({
    assetVersion:8,id:'lan-wan',lesson:19,title:'同一個 LAN，還是遠端網路',
    intro:'切換校內與遠端目的地，觀察資料是否需要交給路由器。',
    prompt:'同一 LAN 的資料傳送，與跨網路傳送，各經過哪些設備？',
    limit:'Internet 是遠端情境的一例，不代表所有 WAN；省略 ARP、VLAN 與位址轉換，同 LAN 的設備在本例屬於相同子網路。',
    controls:[select('target','資料的目的地','remote',[option('remote','Internet 上的遠端伺服器'),option('local','相同 LAN 的同學電腦')])],
    build(v){const local=v.target==='local';return phases(local?[
      step('先比較目的地','這次目的地是相同 LAN、相同子網路的同學電腦。','laptop','laptop','同一 LAN',{local}),
      step('資料到交換器','本機把資料送到 LAN 中的交換器，本例兩台電腦都可正常連線。','laptop','switch','區網資料',{local}),
      step('在區網內交付','交換器把資料送往目的電腦，不需要先繞到 Internet。','switch','local','交付',{local,color:C.green}),
      step('目的電腦回覆','同學電腦的回覆經交換器，回到原本的電腦。','local','laptop','區網回覆',{local,color:C.green,via:['switch']}),
      step('比較區網與廣域網路','LAN 是局部網路，WAN 跨較大範圍；Internet 與 WWW 分別是全球互連網路及其上的網頁服務。','local','local','區網內完成',{local,color:C.green})
    ]:[
      step('先比較目的地','這次目的地位於遠端網路，並非本機所在的 LAN。','laptop','laptop','遠端目的地',{local}),
      step('先經過 LAN','本機先經交換器，把要跨網路傳送的資料交給預設閘道。','laptop','switch','IP 資料',{local}),
      step('交給路由器','路由器依目的 IP 選擇下一站，連接不同的網路。','switch','router','跨網路',{local}),
      step('前往遠端網路','資料再經其他網路與路由設備到達遠端伺服器，這裡合併呈現。','router','remote','遠端資料',{local}),
      step('回覆返回本機','遠端回覆也需要可用的回程路徑，再經 LAN 回到本機。','remote','laptop','回覆',{local,color:C.green,via:['router','switch']}),
      step('LAN、WAN 與 Internet','LAN 是局部網路；WAN 可跨較大範圍連接多個 LAN。Internet 是全球互連網路，WWW 是其上的網頁服務。','remote','remote','網路與應用',{local,color:C.green})
    ]);},
    draw(s,t,S){const n=[node('laptop',20,160,156,'本機電腦','位於校內LAN'),node('switch',220,160,156,'交換器','連接同一LAN'),node('local',450,45,180,'同學電腦','相同子網路'),node('router',450,270,180,'路由器','連接不同網路'),node('remote',750,270,180,'遠端伺服器','位於其他網路')];const bg='<rect x="5" y="12" width="650" height="366" rx="24" fill="#edf8f2" stroke="#7bb7a4" stroke-width="2" stroke-dasharray="8 6"/>'+S.text(180,51,'校內LAN與閘道',26,C.green);return graph(S,s,t,n,[['laptop','switch'],['switch','local'],['switch','router'],['router','remote']],'Internet 是網路的連接；WWW 是網頁應用服務',bg);}
  });

  defs.push({
    assetVersion:8,id:'url-request',lesson:27,title:'URL 的各段去了哪裡',
    intro:'拆開示範網址，追蹤主機名稱、路徑、查詢與片段識別。',
    prompt:'DNS 需要哪一段？HTTPS 要求傳送哪些段落？# 後面的片段去了哪裡？',
    limit:'learn.example 與 192.0.2.10 均為文件示例；省略快取、重導及詳細握手。本例是一般文件導覽，未執行頁面腳本。',
    controls:[select('unit','查詢參數 unit','1',[option('1','unit=1'),option('2','unit=2')]),select('fragment','頁面內的片段','intro',[option('intro','#intro'),option('practice','#practice')])],
    build(v){const unit=v.unit==='2'?'2':'1',fragment=v.fragment==='practice'?'practice':'intro',url=`https://learn.example/class/page.html?unit=${unit}#${fragment}`;return phases([
      step('讀取完整 URL','這個文件示例網址包含協定、主機名稱、路徑、查詢參數及片段識別。','browser','url','解析 URL',{unit,fragment,url}),
      step('分開各段的用途','https 指定安全網頁協定；learn.example 是主機名稱；後面還有路徑、查詢與片段。','url','url','辨認各段',{unit,fragment,url}),
      step('DNS 只查主機名稱','本例 DNS 查詢 learn.example，取得示範位址 192.0.2.10；不把路徑、查詢或片段交給 DNS。','url','dns','主機名稱',{unit,fragment,url}),
      step('建立 TLS 保護','連到伺服器後完成 TLS 握手及憑證驗證，再傳送本例的 HTTPS 要求。','browser','tls','TLS 握手',{unit,fragment,url}),
      step('傳送路徑與查詢',`HTTPS 要求包含 /class/page.html?unit=${unit}，不包含 #${fragment}。`,'tls','server','HTTPS 要求',{unit,fragment,url,color:C.blue}),
      step('伺服器回傳文件','伺服器依路徑及查詢參數處理要求，把文件透過受保護連線回傳。','server','browser','文件資料',{unit,fragment,url,color:C.green,via:['tls']}),
      step('瀏覽器處理片段',`瀏覽器保留 #${fragment}，在文件中尋找對應位置；片段不屬於本例送出的 HTTP 要求。`,'browser','browser',`#${fragment}`,{unit,fragment,url,color:C.green})
    ]);},
    draw(s,t,S){let out=graph(S,s,t,row([['browser','瀏覽器',s.phase>=6?'尋找 #'+s.fragment:'一般文件導覽'],['url','URL 各段','協定與資源線索'],['dns','DNS','只查主機名稱'],['tls','TLS','先握手與驗證'],['server','網站伺服器','文件要求與回應']]),[['browser','url'],['url','dns'],['browser','tls'],['tls','server']],'DNS 查名稱；HTTP 傳路徑與查詢；片段留在瀏覽器');out+=S.text(480,37,'https://learn.example',26)+S.text(480,73,`/class/page.html?unit=${s.unit}#${s.fragment}`,26);return out;}
  });

  defs.push({
    assetVersion:8,id:'concept-map-journey',lesson:31,title:'把系統與網路概念串起來',
    intro:'由本機資源一路連到遠端網站，觀察整條旅程在哪一層停下。',
    prompt:'名稱解析失敗時，為什麼不能直接斷定遠端網站的內容出了問題？',
    limit:'整合先前概念的簡化流程；使用文件示例網址，省略快取與詳細協定，DNS 失敗只表示本例未取得位址。',
    controls:[select('scenario','整合情境','normal',[option('normal','各階段正常'),option('dns','DNS 未取得位址')])],
    build(v){const dnsFail=v.scenario==='dns';const first=[
      step('從本機資源開始','瀏覽器執行時需要 CPU、RAM 與網路設備；OS 協調這些本機資源。','os','os','本機資源',{dnsFail}),
      step('名稱解析取得線索','本例向 DNS 查詢 learn.example，嘗試取得網站的 IP 位址。','os','dns','名稱查詢',{dnsFail}),
      step(dnsFail?'本例未取得 IP':'取得網站 IP',dnsFail?'DNS 未回覆可用位址，本例先停在名稱解析階段；不能據此評斷網站內容。':'DNS 回覆文件示例位址 192.0.2.10，後續才能依位址建立網站連線。','dns','dns',dnsFail?'未取得位址':'192.0.2.10',{dnsFail,color:dnsFail?C.red:C.green})
    ];return phases(dnsFail?[...first,step('按層次重新檢查','記錄名稱解析的觀察，再檢查設定或稍後重試；本例未繼續建立網站連線。','dns','browser','回報線索',{dnsFail,color:C.amber,status:{browser:'尚未取得網頁'}})]:[...first,
      step('把 IP 交回本機','DNS 將位址交回本機；DNS 不會代替瀏覽器把網站要求轉送給網站。','dns','os','IP 回覆',{dnsFail,color:C.green}),
      step('依 IP 經過路由','本機依取得的 IP 建立網站連線，封包經路由設備前往遠端網路。','os','router','目的 IP',{dnsFail}),
      step('向 HTTPS 網站要求文件','可用路徑與連線建立後，完成 TLS 保護，再向網站伺服器要求文件。','router','server','HTTPS 要求',{dnsFail,color:C.blue}),
      step('文件回到瀏覽器','伺服器回傳資料，瀏覽器使用本機資源解析並呈現頁面。','server','browser','文件回應',{dnsFail,color:C.green}),
      step('連結每個概念的角色','OS 管理本機資源，DNS 提供名稱線索，IP 與路由負責跨網路，HTTPS 承載網站要求。','browser','browser','整合概念',{dnsFail,color:C.green,status:{browser:'呈現頁面'}})
    ]);},
    draw(s,t,S){return graph(S,s,t,row([['os','OS','本機資源協調'],['dns','DNS',s.dnsFail&&s.phase>=2?'未取得位址':'名稱對應 IP'],['router','IP 與路由','依位址轉送'],['server','HTTPS 網站','受保護服務'],['browser','瀏覽器',s.dnsFail?'等待資料':'解析並呈現']]),[['os','dns'],['dns','os'],['os','router'],['router','server'],['server','browser']],'先分清每一層的角色，再把整條旅程連起來');}
  });

  defs.push({
    assetVersion:8,id:'classroom-route',lesson:32,title:'教室筆電的去程與回程',
    intro:'比較校內資源與遠端網站，沿著實際需要的設備追蹤要求和回覆。',
    prompt:'連到 AP 之後，什麼情境還需要路由器與 ISP 的對外路徑？',
    limit:'一台設備可兼具 AP 與路由器功能，圖中按功能分開；路徑是簡化示例，回程不保證永遠與去程相同。',
    controls:[select('destination','要開啟的資源','web',[option('web','Internet 上的課程網站'),option('local','同一 LAN 的教室伺服器')])],
    build(v){const local=v.destination==='local';return phases(local?[
      step('筆電要取得教室資料','本例目的伺服器與筆電位於相同 LAN、相同子網路，對外 Internet 不在這次路徑上。','laptop','laptop','校內資源',{local}),
      step('無線資料先到 AP','AP 提供無線接入，把筆電的資料接入教室 LAN。','laptop','ap','無線要求',{local}),
      step('LAN 內交付伺服器','本例省略交換器圖示；資料在 LAN 內交付教室伺服器，不經 ISP。','ap','server','區網要求',{local}),
      step('伺服器回應 AP','教室伺服器把資料透過 LAN 送回 AP。','server','ap','區網回應',{local,color:C.green}),
      step('AP 傳回筆電','AP 把回應以無線方式送到筆電；本例可在對外連線中斷時使用校內資源。','ap','laptop','無線回應',{local,color:C.green})
    ]:[
      step('筆電要取得網站資料','筆電已加入教室 Wi-Fi，這次要取得遠端課程網站的資料。','laptop','laptop','遠端網站',{local}),
      step('無線資料先到 AP','AP 提供無線接入，把筆電的資料接入教室 LAN。','laptop','ap','無線要求',{local}),
      step('交給路由器','目的地位於其他網路，本例的 LAN 把資料交給路由器轉送。','ap','router','跨網路要求',{local}),
      step('經 ISP 前往外部網路','ISP 提供對外連線；資料還可能經過其他網路與路由設備。','router','isp','對外資料',{local}),
      step('到達網站伺服器','本例把其餘路徑合併呈現，網站伺服器收到要求並準備回應。','isp','server','網站要求',{local}),
      step('回覆經可用路徑返回','伺服器回覆經可用的 Internet 路徑回到教室路由器，圖中使用相同節點示意。','server','router','回覆',{local,color:C.green,via:['isp']}),
      step('經 AP 回到筆電','回覆經教室 LAN 與 AP 送回筆電；加入 Wi-Fi 和取得 Internet 回應是兩件事。','router','laptop','網站資料',{local,color:C.green,via:['ap']})
    ]);},
    draw(s,t,S){const nodes=s.local?[node('laptop',40,146,230,'教室筆電','無線設備'),node('ap',365,146,230,'AP','接入同一LAN'),node('server',690,146,230,'教室伺服器','同LAN／同子網路')]:row([['laptop','教室筆電','無線設備'],['ap','AP','接入教室LAN'],['router','路由器','連接外部網路'],['isp','ISP','對外連線'],['server','網站伺服器','Internet服務']]);const bg=`<rect x="8" y="87" width="${s.local?944:574}" height="248" rx="24" fill="#edf8f2" stroke="#7bb7a4" stroke-width="2" stroke-dasharray="8 6"/>`+S.text(s.local?480:290,119,s.local?'這次伺服器在同一 LAN':'教室 LAN',26,C.green);return graph(S,s,t,nodes,s.local?[['laptop','ap'],['ap','server']]:[['laptop','ap'],['ap','router'],['router','isp'],['isp','server']],s.local?'校內資源的這次路徑不經 ISP':'無線接入、跨網路轉送、遠端服務各有角色',bg);}
  });

  defs.push({
    assetVersion:8,id:'https-trust',lesson:34,title:'HTTPS 保護了什麼',
    intro:'比較正常教學網站與仿冒情境：兩者都可能使用有效的 HTTPS。',
    prompt:'TLS 驗證的網站名稱，和網站內容是否可信，是同一個問題嗎？',
    limit:'兩個主機名稱均為文件示例，假設各自有可驗證的 TLS 憑證；不連線也不收集資料。',
    controls:[select('site','要觀察的網站','legit',[option('legit','原先要造訪的 learn.example'),option('phishing','仿冒情境 learn-support.example')])],
    build(v){const phishing=v.site==='phishing',host=phishing?'learn-support.example':'learn.example';return phases([
      step('先核對要造訪的名稱',`網址中的主機名稱是 ${host}；先核對它是否為原本要造訪的網站。`,'browser','browser','核對網址',{phishing,host}),
      step('TLS 驗證連線對象','本例的 TLS 驗證成功，表示連線對象通過該主機名稱的憑證驗證。','browser','tls','憑證驗證',{phishing,host}),
      step('加密傳送資料','HTTPS 使用 TLS 保護傳輸的機密性與完整性，降低途中竊看及竄改的風險。','tls','server','加密資料',{phishing,host,color:C.blue}),
      step('網站內容仍需判斷',phishing?'仿冒情境也能建立有效 HTTPS；本例頁面要求交出密碼，仍有詐騙風險。':'即使這是原先要造訪的名稱，TLS 也不保證每段內容、下載檔或說法都正確。','server','content','頁面內容',{phishing,host,color:phishing?C.red:C.amber}),
      step('把傳輸與內容分開評估',phishing?'先停止交出資料，另從已知來源核對網址與要求；HTTPS 不能替仿冒內容背書。':'另外核對來源、內容與要求的合理性；HTTPS 成功不能取代資訊查證。','content','browser','核對來源',{phishing,host,color:C.amber}),
      step('說出 HTTPS 的界線','TLS 保護傳輸並驗證所連主機的身分；它不證明頁面內容真實，也不保證網站沒有惡意。','tls','tls','保護有範圍',{phishing,host,color:C.green})
    ]);},
    draw(s,t,S){let out=graph(S,s,t,four([['browser','瀏覽器','先核對網址'],['tls','TLS 保護','名稱驗證與加密','#e2f3fb'],['server','網站伺服器','本例憑證可驗證'],['content','頁面內容',s.phishing?'仍可能是仿冒':'仍需查證','#fff2dc']]),[['browser','tls'],['tls','server'],['server','content']],'有效 HTTPS，不代表內容與要求都可信');return out+S.text(480,59,s.host,27,s.phishing?C.red:C.ink);}
  });

  defs.push({
    assetVersion:8,id:'review-transfer',lesson:35,title:'先預測，再用證據修正',
    intro:'面對網站問題，把 Wi-Fi、ping 與 HTTPS 的證據分開比較。',
    prompt:'哪項觀察支持你的解釋？還有哪種不同原因也可能產生類似現象？',
    limit:'這些是預設的模擬證據，不執行網路探測。假設網站名稱已解析，故障原因僅在本例條件內成立。',
    controls:[select('cause','選擇診斷案例','web',[option('web','Wi-Fi 已連上；網站服務故障'),option('uplink','Wi-Fi 已連上；對外路徑中斷'),option('icmp','ICMP 無回覆；HTTPS 正常')])],
    build(v){const cause=['web','uplink','icmp'].includes(v.cause)?v.cause:'web',ping=cause==='web',https=cause==='icmp',reason=cause==='web'?'本例是網站服務故障':cause==='uplink'?'本例是對外路徑中斷':'本例只有 ICMP 不回覆';return phases([
      step('先提出可檢查的預測','先預測「Wi-Fi 顯示已連線，網站應該就能開啟」，接著用不同層次的證據檢查。','prediction','prediction','提出預測',{cause,ping,https,reason}),
      step('觀察 Wi-Fi 接入','三個案例都已加入 AP 的 Wi-Fi。這只證明無線接入狀態，不保證 Internet 或網站可用。','prediction','wifi','Wi-Fi 證據',{cause,ping,https,reason,status:{wifi:'已加入 AP'}}),
      step('另外觀察 ping',ping?'本例指定目標回覆 ICMP Echo，可觀察到探測回應；這仍未測試 HTTPS 服務。':'本例沒有收到指定目標的 ICMP Echo 回覆；原因可能涉及路徑或 ICMP 回覆政策。','wifi','ping',ping?'有 ICMP 回覆':'無 ICMP 回覆',{cause,ping,https,reason,color:ping?C.green:C.amber,status:{ping:ping?'有回覆':'無回覆'}}),
      step('再觀察 HTTPS',https?'HTTPS 要求成功取得網頁。即使 ping 沒有回覆，網站服務仍可能可用。':'HTTPS 要求未取得本例網頁；需要把服務結果和 Wi-Fi、ICMP 證據分開判讀。','ping','https',https?'HTTPS 成功':'HTTPS 失敗',{cause,ping,https,reason,color:https?C.green:C.red,status:{https:https?'取得網頁':'未取得網頁'}}),
      step('把三項證據並列',`Wi-Fi 已接入；ping ${ping?'有':'無'}回覆；HTTPS ${https?'成功':'失敗'}。單一指標無法代表所有網路服務。`,'https','revision','比較證據',{cause,ping,https,reason,color:C.amber}),
      step('修正原來的解釋',`${reason}，這是預設案例，三項觀察不能唯一確診；應分別檢查路徑與網站服務。`,'revision','revision','修正解釋',{cause,ping,https,reason,color:C.green}),
      step('換情境檢查推論','換個案例再比較：Wi-Fi 接入不保證 Internet 可用；ping 與 HTTPS 的結果也不同。','revision','prediction','再次驗證',{cause,ping,https,reason,color:C.green})
    ]);},
    draw(s,t,S){return graph(S,s,t,row([['prediction','先預測','提出可檢查說法'],['wifi','Wi-Fi','已加入 AP'],['ping','ping',s.phase>=2?(s.ping?'ICMP 有回覆':'ICMP 無回覆'):'等待觀察'],['https','HTTPS',s.phase>=3?(s.https?'成功取得網頁':'未取得網頁'):'等待觀察'],['revision','比較並修正','根據多項證據']]),[['prediction','wifi'],['wifi','ping'],['ping','https'],['https','revision']],'分開觀察接入、探測與網站服務，才能提出有根據的解釋');}
  });

  defs.push({
    assetVersion:8,id:'learning-export',lesson:36,title:'學習紀錄如何留在自己手上',
    intro:'追蹤瀏覽器內的示範學習紀錄，如何變成可自行保存的 JSON 檔。',
    prompt:'本機紀錄、下載檔案與交給老師，是哪三個不同的動作？',
    limit:'動畫只示範資料流，不在此處下載或上傳。實際匯出請使用課程的匯出功能；目前不提供匯入還原。',
    controls:[select('record','示範紀錄','complete',[option('complete','已完成 3 個練習'),option('partial','已完成 1 個練習')])],
    build(v){const count=v.record==='partial'?1:3;return phases([
      step('紀錄先留在瀏覽器',`示範中完成 ${count} 個練習，紀錄保留在目前瀏覽器的本機儲存空間。`,'browser','record','本機紀錄',{count}),
      step('使用者主動選擇匯出','使用者按下課程的匯出功能，系統讀取目前紀錄；紀錄不會自動交給教師。','record','record','主動匯出',{count}),
      step('整理成 JSON 資料',`把完成 ${count} 個練習等紀錄整理為 JSON 文字，供使用者下載保存。`,'record','file','JSON 資料',{count}),
      step('瀏覽器下載檔案','瀏覽器依使用者的下載設定保存 JSON 檔案；下載並不等於已上傳或已繳交。','file','file','下載保存',{count,color:C.green}),
      step('學生自行複製檔案','學生確認下載檔後，自行複製到要保存或繳交的位置；需要另外完成交付動作。','file','student','自行複製',{count,color:C.green}),
      step('確認保存範圍','目前不提供匯入還原。本機紀錄與下載副本各有位置，清除瀏覽器資料前應確認已保存需要的檔案。','student','student','確認檔案',{count,color:C.green})
    ]);},
    draw(s,t,S){let out=graph(S,s,t,four([['browser','目前瀏覽器','本機儲存空間'],['record','學習紀錄',`完成 ${s.count} 個練習`],['file','JSON 檔案',s.phase>=3?'下載副本':'等待匯出','#fff2dc'],['student','學生自行保存','確認並複製檔案','#e2f5eb']]),[['browser','record'],['record','file'],['file','student']],'主動下載 → 自行複製；沒有自動上傳或匯入');out+=S.text(480,65,`示範資料：{"completed":${s.count}}`,25);return out;}
  });
})();
