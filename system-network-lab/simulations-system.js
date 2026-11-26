/* Original system animations. Pure step builders and SVG drawing functions. */
(() => {
  'use strict';
  const defs = window.ANIMATION_DEFS = window.ANIMATION_DEFS || [];
  const C = {purple:'#7958bd',mint:'#2a9e86',orange:'#c98035',ink:'#293b60',soft:'#e9edfc',red:'#bc4e70'};
  const clamp = t => Math.max(0,Math.min(1,Number(t)||0));
  const option = (value,label) => ({value,label});
  const select = (key,label,value,options) => ({key,label,type:'select',default:value,options});
  const rect = (x,y,w,h,fill='#edf2ff',stroke='#a4b5df',dash='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${fill}" stroke="${stroke}" stroke-width="2.5" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  function wire(S,points,color='#9bafd1',dashed=false){
    const path=points.map((v,i)=>(i?'L':'M')+v[0]+' '+v[1]).join(' ');
    const n=points.length;
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" ${dashed?'stroke-dasharray="7 7"':''}/>`+S.arrow(...points[n-2],...points[n-1],color,dashed);
  }
  function travel(S,points,t,label='資料',color=C.purple){
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
    let left=lengths.reduce((a,b)=>a+b,0)*clamp(t);
    for(let i=0;i<lengths.length;i++){
      if(left<=lengths[i]||i===lengths.length-1)return S.move(...points[i],...points[i+1],lengths[i]?left/lengths[i]:1,label,color);
      left-=lengths[i];
    }
    return '';
  }
  const staged = (titles,descriptions,extra={}) => titles.map((title,phase)=>({title,description:descriptions[phase],phase,...extra}));

  defs.push({
    id:'units-journey',lesson:2,title:'五大單元的資料旅程',
    intro:'看輸入資料進入主機，由 CPU 與記憶單元合作處理，再輸出結果。',
    prompt:'控制單元和算術邏輯單元各做什麼？記憶單元在何時保存資料？',
    limit:'以簡化功能流程示範；資料與控制線路的實作方式會依系統而異。',
    controls:[select('task','這次的任務','add',[option('add','計算 4＋3'),option('compare','比較 9 是否大於 5')])],
    build(v){
      const compare=v.task==='compare',a=compare?9:4,b=compare?5:3,result=compare?'是':7;
      return staged(['輸入資料','記憶單元保存內容','控制單元解讀指令','安排運算工作','算術邏輯單元處理','保存運算結果','輸出結果'],[
        `輸入單元送入 ${a} 與 ${b}，本例先將資料放進主記憶體。`,
        '記憶單元保存執行所需的資料與指令，等待 CPU 使用。',
        `CPU 的控制單元解讀${compare?'比較':'加法'}指令，協調接下來的工作。`,
        '控制單元安排需要的資料與運算；控制單元與算術邏輯單元同屬 CPU。',
        compare?'算術邏輯單元比較 9 與 5，得到「9 大於 5」的結果。':'算術邏輯單元進行 4＋3，得到 7。',
        '結果可以再寫回記憶體，供後續程式使用。',
        `輸出單元呈現結果：${result}。主機外框中同時包含 CPU 與記憶單元。`
      ],{a,b,result,compare});
    },
    draw(st,t,S){
      const ph=st.phase,done=ph===6&&t>.75;
      const routes=[[[105,245],[105,340],[618,340],[618,270]],[[570,205],[660,205]],[[545,166],[510,166],[510,152],[478,152]],[[373,185],[373,221]],[[290,255],[455,255]],[[478,254],[525,254],[525,222],[545,222]],[[690,200],[760,200]]];
      let out=rect(220,20,500,350,'#e9f2ff','#8ca5d5')+S.text(470,53,'主機內部',26);
      out+=rect(245,78,255,235,'#efe4ff','#a68bcd','7 5')+S.text(373,109,'CPU',28);
      out+=wire(S,routes[0])+wire(S,routes[2],C.purple)+wire(S,routes[3],C.purple)+wire(S,routes[5],C.mint)+wire(S,routes[6],C.mint);
      out+=S.box(25,155,160,90,'輸入單元',`${st.a}、${st.b}`,ph===0);
      out+=S.box(268,120,210,75,'控制單元',ph===2?'解讀與協調':'',ph===2||ph===3,'#fcf8ff');
      out+=S.box(268,221,210,75,'算術邏輯單元',ph>=4?(st.compare?'9 ＞ 5':`4＋3＝${st.result}`):'',ph===4,'#fcf8ff');
      out+=S.box(545,130,145,140,'記憶單元',ph>=5?`結果：${st.result}`:ph>=1?`${st.a}、${st.b}`:'等待資料',ph===1||ph===5,'#dff5ec');
      out+=S.box(760,155,160,90,'輸出單元',done?String(st.result):'等待結果',ph===6,'#e2f5fa');
      if(ph===4)out+=`<circle cx="${285+175*clamp(t)}" cy="232" r="5" fill="${C.orange}"/>`;
      else if(ph===1)out+=S.move(575,310,660,310,t,'已存入',C.purple);
      else out+=travel(S,routes[ph],t,ph===2?'指令':ph>=5?'結果':'資料',ph>=5?C.mint:C.purple);
      out+=S.text(480,416,'CPU 內含控制與運算；主記憶體與 CPU 合作',24);
      return out;
    }
  });

  defs.push({
    id:'os-bridge',lesson:4,title:'應用程式如何請 OS 幫忙',
    intro:'從一個操作開始，追蹤需求如何經過系統服務到達設備。',
    prompt:'應用程式、OS 與硬體之間，各自負責哪一段？',
    limit:'系統服務與資料路徑為簡化示例，不表示所有 OS 都使用完全相同的內部步驟。',
    controls:[select('resource','想完成的工作','print',[option('print','列印一份報告'),option('save','儲存一份筆記')])],
    build(v){
      const printing=v.resource!=='save';
      return staged(['應用程式提出需求','OS 接收系統服務要求','檢查使用條件','交給適當的服務','設備執行工作','完成狀態回到 OS','應用程式更新畫面'],[
        printing?'文書程式提出列印需求，而不是直接任意控制印表機。':'編輯程式要求把目前內容儲存成檔案。',
        'OS 提供系統服務介面，協調應用程式使用資源。',
        '本例假設使用者有必要權限，OS 檢查需求並安排資源。',
        printing?'列印服務與合適的驅動程式，把需求轉成設備可處理的工作。':'檔案系統與儲存裝置服務處理檔名、位置及資料寫入。',
        printing?'印表機依收到的工作輸出紙本。':'本例以資料寫入完成為前提，儲存裝置保留檔案。',
        '設備與服務的處理狀態回到 OS，供系統與應用程式判斷。',
        printing?'應用程式可顯示列印工作的處理狀態。':'應用程式可顯示儲存完成；未完成的寫入仍需等待。'
      ],{printing});
    },
    draw(st,t,S){
      const service=st.printing?'列印服務／驅動':'檔案系統／裝置',device=st.printing?'印表機':'儲存裝置';
      const paths=[[[130,70],[130,130]],[[230,180],[350,180]],[[385,180],[520,180]],[[455,235],[455,285]],[[565,330],[815,330],[815,235]],[[730,180],[570,180]],[[350,180],[230,180]]];
      let out=S.text(130,47,'使用者操作',24)+wire(S,paths[1])+wire(S,paths[3])+wire(S,paths[4])+wire(S,paths[5],C.mint)+wire(S,paths[6],C.mint);
      out+=S.box(30,130,200,105,'應用程式',st.printing?'列印報告':'儲存筆記',st.phase===0||st.phase===6);
      out+=S.box(350,130,220,105,'作業系統 OS','協調資源與服務',st.phase===1||st.phase===2||st.phase===5,'#efe5ff');
      out+=S.box(345,285,220,90,service,'依工作選擇服務',st.phase===3,'#fff0df');
      out+=S.box(730,130,200,105,device,st.phase>=5?'已完成本例工作':'等待或處理中',st.phase===4,'#dff5ec');
      out+=travel(S,paths[st.phase],t,st.phase>=5?'狀態':'要求',st.phase>=5?C.mint:C.purple);
      out+=S.text(480,421,'OS 協調軟體需求與硬體資源',24);
      return out;
    }
  });

  defs.push({
    id:'boot-journey',lesson:5,title:'從電源到作業系統',
    intro:'選擇啟動情境，看韌體、載入程式和 OS 如何接棒。',
    prompt:'POST 發現問題時，為什麼不應直接推定已經進入 OS？',
    limit:'以個人電腦作示例。USB 情境指具備有效開機內容的裝置；診斷碼依型號而異。',
    controls:[select('boot','啟動情境','ssd',[option('ssd','正常：從 SSD 啟動'),option('usb','正常：從開機 USB 啟動'),option('fault','POST 偵測到硬體問題')])],
    build(v){
      const fault=v.boot==='fault',medium=v.boot==='usb'?'開機 USB':'SSD';
      if(fault)return [
        {phase:0,fault,medium,title:'按下電源',description:'電源供應系統與必要硬體開始運作。'},
        {phase:1,fault,medium,title:'韌體開始初始化',description:'BIOS／UEFI 韌體進行初步初始化與開機自我測試。'},
        {phase:2,fault,medium,title:'POST 出現問題線索',description:'此例偵測到硬體問題，顯示診斷提示；不能套用通用嗶聲表斷定零件。'},
        {phase:3,fault,medium,title:'先處理診斷提示',description:'此情境未繼續載入 OS。記錄訊息，依設備型號查閱診斷方式並請教師協助。'}
      ];
      return staged(['按下電源','韌體初始化與 POST','選擇可開機來源','開機載入程式接手','將 OS 所需內容載入 RAM','OS 啟動服務','進入操作環境'],[
        '供電後，處理器開始執行開機韌體。','BIOS／UEFI 韌體進行初步初始化與開機自我測試。',
        `依本例開機設定找到${medium}，確認有可啟動的內容。`,
        '開機載入程式負責接續載入與啟動作業系統。',
        '將啟動所需的 OS 內容放入 RAM，供處理器執行。',
        'OS 開始管理裝置與系統服務，本例必要服務均正常。',
        '個人電腦提供登入或桌面等操作環境，應用程式才可在其上工作。'
      ],{fault,medium});
    },
    draw(st,t,S){
      const p=st.phase,paths=st.fault?[
        [[55,80],[115,135]],[[190,180],[305,180]],[[395,235],[395,255],[140,255]],[[140,255],[140,270]]
      ]:[
        [[55,80],[115,135]],[[190,180],[305,180]],[[485,180],[540,180]],[[690,180],[745,180]],[[830,235],[830,315],[770,315]],[[590,315],[460,315]],[[280,315],[250,315]]
      ];
      let out=wire(S,[[190,180],[305,180]])+wire(S,[[485,180],[540,180]])+wire(S,[[690,180],[745,180]])+wire(S,[[830,235],[830,315],[770,315]])+wire(S,[[590,315],[460,315]])+wire(S,[[280,315],[250,315]],C.mint);
      if(st.fault)out+=wire(S,[[395,235],[395,255],[140,255],[140,270]],C.red);
      out+=S.box(40,135,150,100,'電源','開始供電',p===0);
      out+=S.box(305,135,180,100,'BIOS／UEFI','初始化與 POST',p===1||p===2,'#efe5ff');
      out+=S.box(540,135,150,100,'開機來源',st.fault?'未繼續讀取':st.medium,!st.fault&&p===2);
      out+=S.box(745,135,170,100,'開機載入',st.fault?'尚未執行':st.medium,!st.fault&&p===3);
      out+=S.box(590,270,180,90,'RAM 中的 OS',st.fault?'尚未載入':'啟動所需內容',!st.fault&&p===4,'#dff5ec');
      out+=S.box(280,270,180,90,'OS 服務','管理系統資源',!st.fault&&p===5,'#e2f5fa');
      out+=S.box(45,270,205,90,st.fault?'診斷提示':'操作環境',st.fault?'此例先停止啟動':p===6&&t>.7?'登入／桌面':'等待啟動',st.fault?p>=2:p===6,st.fault?'#ffe6ed':'#e6f5e4');
      out+=travel(S,paths[p],t,st.fault&&p>=2?'提示':p===4?'OS':'啟動',st.fault&&p>=2?C.red:C.purple);
      out+=S.text(610,72,st.fault?'本例：POST 偵測問題':`本例開機來源：${st.medium}`,24);
      return out;
    }
  });

  defs.push({
    id:'fetch-execute',lesson:7,title:'取指、解碼與執行',
    intro:'把一條簡化指令與它要使用的資料分開追蹤。',
    prompt:'指令和運算資料分別在什麼時候進入 CPU？哪個單元解讀指令？',
    limit:'使用自編教學指令與單一工作暫存器，省略部分暫存器、匯流排與時序細節。',
    controls:[select('operation','教學指令','ADD',[option('ADD','ADD [2]：加上位址 2 的資料'),option('SUB','SUB [2]：減去位址 2 的資料')])],
    build(v){
      const op=v.operation==='SUB'?'SUB':'ADD',initial=9,operand=4,result=op==='SUB'?5:13;
      return staged(['準備一條指令','從 RAM 取得指令','控制單元解碼','依指令要求讀取資料','運算資料進入 ALU','執行算術運算','保存運算結果'],[
        `本例工作暫存器原有 9；RAM 位址 0 放 ${op} [2]，位址 2 放資料 4。`,
        'CPU 取得的是指令內容，先放入保存目前指令的位置。',
        `控制單元解讀 ${op} [2]：操作是${op==='ADD'?'加法':'減法'}，運算資料要從記憶體位址 2 取得。`,
        '依解讀結果要求讀取位址 2；位址是尋找資料的線索，不是運算結果。',
        'RAM 提供資料 4，與工作暫存器中的 9 交給算術邏輯單元處理。',
        `算術邏輯單元執行 9 ${op==='ADD'?'＋':'－'} 4，得到 ${result}。`,
        `工作暫存器保存結果 ${result}，之後可供下一條指令使用。`
      ],{op,initial,operand,result});
    },
    draw(st,t,S){
      const p=st.phase;
      const paths=[[[740,145],[865,145]],[[680,158],[620,158],[620,350],[310,350],[310,305]],[[195,255],[195,225]],[[195,110],[195,80],[650,80],[650,230],[680,230]],[[680,275],[615,275],[615,160],[570,160]],[[355,122],[555,122]],[[455,225],[455,255]]];
      let out=rect(40,30,560,350,'#e9f2ff','#92a8d5')+S.text(320,65,'CPU',28);
      out+=wire(S,paths[1],C.purple)+wire(S,paths[2],C.purple)+wire(S,paths[3],C.orange,true)+wire(S,paths[4],C.orange)+wire(S,paths[6],C.mint);
      out+=S.box(80,110,230,100,'控制單元',p>=2?'解讀目前指令':'等待指令',p===2||p===3,'#efe5ff');
      out+=S.box(340,110,230,100,'算術邏輯單元',p>=5?`9 ${st.op==='ADD'?'＋':'－'} 4＝${st.result}`:'等待運算資料',p===4||p===5,'#fff0df');
      out+=S.box(80,270,230,70,'目前指令',p>=2?`${st.op} [2]`:p===1&&t>.7?`${st.op} [2]`:'尚未取得',p===1,'#f8f0ff');
      out+=S.box(340,270,230,70,'工作暫存器',p===6&&t>.7?String(st.result):'9',p===6,'#dff5ec');
      out+=rect(680,95,245,245,'#dff5ec','#8cb5a8')+S.text(803,132,'主記憶體 RAM',26);
      out+=S.text(700,183,`位址 0：${st.op} [2]`,24,C.purple,'start')+S.text(700,260,'位址 2：4',24,C.orange,'start');
      if(p===0||p===5)out+=`<circle cx="${paths[p][0][0]+(paths[p][1][0]-paths[p][0][0])*clamp(t)}" cy="${paths[p][0][1]}" r="5" fill="${p===0?C.purple:C.orange}"/>`;
      else out+=travel(S,paths[p],t,p<=2?'指令':p===3?'位址 2':p===4?'資料 4':'結果',p<=2?C.purple:p===3||p===4?C.orange:C.mint);
      out+=S.text(480,420,'紫色：指令　橘色：運算資料　綠色：結果',24);
      return out;
    }
  });

  defs.push({
    id:'time-slices',lesson:7,title:'時間片如何分給不同工作',
    intro:'讓三個單執行緒工作排隊，比較一個核心與兩個核心的安排。',
    prompt:'增加核心與調整時間片，分別改變了什麼？同一個單執行緒工作會同時佔兩個核心嗎？',
    limit:'採理想化輪流排程，工作 A／B／C 各需 4／3／2 個時間單位；省略切換與等待成本，不代表實際效能。',
    controls:[select('cores','CPU 核心數','1',[option('1','單一核心'),option('2','兩個核心')]),{key:'quantum',label:'每次最多使用的時間片',type:'range',default:1,min:1,max:3,step:1,unit:'個時間單位'}],
    build(v){
      const count=String(v.cores)==='2'?2:1,q=Math.max(1,Math.min(3,Math.round(Number(v.quantum)||1)));
      const work={A:4,B:3,C:2},remaining={...work},queue=['A','B','C'],active=Array(count).fill(null),used=Array(count).fill(0),steps=[];
      steps.push({phase:0,tick:0,title:'三個工作準備使用 CPU',description:`本例有 ${count} 個核心，A、B、C 都是單執行緒工作；每次最多連續使用 ${q} 個時間單位。`,before:{...remaining},after:{...remaining},running:[],history:[],queue:[...queue],count,q});
      const history=[];let tick=0;
      while(Object.values(remaining).some(n=>n>0)&&tick<20){
        for(let i=0;i<count;i++)if(!active[i]&&queue.length){active[i]=queue.shift();used[i]=0;}
        const running=[...active],before={...remaining};
        for(let i=0;i<count;i++)if(active[i]){remaining[active[i]]--;used[i]++;}
        tick++;history.push(running.filter(Boolean).join(''));
        for(let i=0;i<count;i++)if(active[i]&&(remaining[active[i]]===0||used[i]>=q)){if(remaining[active[i]]>0)queue.push(active[i]);active[i]=null;used[i]=0;}
        steps.push({phase:1,tick,title:`第 ${tick} 個時間單位`,description:`${running.filter(Boolean).join('、')} 取得執行機會；此例每個工作同一時間只在一個核心執行。${queue.length?'等待佇列：'+queue.join('、')+'。':'目前沒有排隊等待的工作。'}`,before,after:{...remaining},running,history:[...history],queue:[...queue],count,q});
      }
      steps.push({phase:2,tick,title:'三個工作都完成',description:`此理想模型使用 ${tick} 個時間單位完成 9 個工作量單位。實際速度還受程式能否並行、等待與切換成本等因素影響。`,before:{...remaining},after:{...remaining},running:[],history:[...history],queue:[],count,q});
      return steps;
    },
    draw(st,t,S){
      const color={A:'#7f66c9',B:'#299e91',C:'#cc8b43'},totals={A:4,B:3,C:2};
      let out=S.text(175,42,`${st.count} 個核心`,28)+S.text(635,42,'工作完成進度',28);
      for(let i=0;i<st.count;i++)out+=S.box(60,78+i*145,230,105,`核心 ${i+1}`,st.running[i]?`執行 ${st.running[i]}`:'等待工作',Boolean(st.running[i]),'#e9e3fb');
      if(st.count===1)out+=S.text(175,275,'單核心輪流執行',24);
      for(const [i,name] of ['A','B','C'].entries()){
        const y=86+i*85,before=totals[name]-st.before[name],after=totals[name]-st.after[name],progress=before+(after-before)*clamp(t);
        out+=S.text(365,y+33,`工作 ${name}`,24,C.ink,'start')+rect(490,y,390,48,'#e1e7f6','#b4c2e1');
        out+=`<rect x="490" y="${y}" width="${390*progress/totals[name]}" height="48" rx="16" fill="${color[name]}"/>`;
        out+=S.text(685,y+34,`${Math.round(progress*10)/10} / ${totals[name]}`,24,progress/totals[name]>.52?'#fff':C.ink);
      }
      for(let i=0;i<st.running.length;i++)if(st.running[i])out+=S.move(285,130+i*145,488,110+['A','B','C'].indexOf(st.running[i])*85,t,st.running[i],color[st.running[i]]);
      out+=S.text(35,350,'時間軸',24,C.ink,'start');
      st.history.forEach((label,i)=>{out+=S.pill(150+i*75,327,64,label,'#f2edff',C.ink);});
      out+=S.text(480,420,st.phase===2?'全部完成':`時間片上限：${st.q}　等待：${st.queue.join('、')||'無'}`,24);
      return out;
    }
  });

  defs.push({
    id:'cache-lookup',lesson:8,title:'快取命中與逐層查找',
    intro:'指定第一個找到資料 A 的位置，觀察查找與回傳走到哪一層。',
    prompt:'L1 未命中時代表什麼？為什麼不等於資料已經遺失？',
    limit:'L1、L2 通常整合於 CPU 內，圖中分開方便觀察查找層級；不量測真實延遲，也不模擬快取替換、填入與一致性策略。',
    controls:[select('hit','第一個找到 A 的位置','L2',[option('L1','L1 快取'),option('L2','L2 快取'),option('RAM','主記憶體 RAM')])],
    build(v){
      const hit=['L1','L2','RAM'].includes(v.hit)?v.hit:'L2',target=['L1','L2','RAM'].indexOf(hit)+1;
      const steps=[{title:'CPU 需要資料 A',description:'程式需要資料 A，CPU 先從較靠近核心的快取開始尋找。',phase:'request',node:0,target,hit}];
      for(let i=1;i<=target;i++){
        steps.push({title:`查找 ${['CPU','L1','L2','RAM'][i]}`,description:i===target?`在 ${hit} 找到需要的資料 A，這是本例第一個命中的位置。`:`在 ${['CPU','L1','L2','RAM'][i]} 沒有找到 A，繼續到下一層查找。`,phase:'lookup',node:i,target,hit});
      }
      steps.push({title:`${hit} 回傳資料 A`,description:'從找到資料的位置回傳所需內容；圖中綠色標記表示回傳。',phase:'return',node:target,target,hit});
      steps.push({title:'CPU 取得資料',description:'CPU 可繼續執行需要 A 的工作。快取未命中只表示該層沒有找到，不代表資料一定遺失。',phase:'done',node:0,target,hit});
      return steps;
    },
    draw(st,t,S){
      const xs=[30,255,480,730],ws=[150,150,150,200],names=['CPU','L1 快取','L2 快取','主記憶體 RAM'],centers=xs.map((x,i)=>x+ws[i]/2);
      let out='';for(let i=0;i<3;i++)out+=S.arrow(xs[i]+ws[i],210,xs[i+1],210);
      if(st.phase==='return'||st.phase==='done')out+=wire(S,[[centers[st.target],285],[centers[st.target],340],[centers[0],340],[centers[0],275]],C.mint);
      for(let i=0;i<4;i++){
        const visited=st.phase==='return'||st.phase==='done'?i>0&&i<=st.target:st.phase==='lookup'&&i>0&&i<=st.node;
        const subtitle=i===0?(st.phase==='done'?'取得 A':'需要 A'):visited?(i===st.target?'找到 A':'此層未命中'):'等待查找';
        out+=S.box(xs[i],150,ws[i],120,names[i],subtitle,st.node===i||st.phase==='return'&&i===st.target,i===3?'#dff5ec':'#eee8fb');
      }
      if(st.phase==='request')out+=S.move(centers[0]-35,110,centers[0]+35,110,t,'讀取 A',C.purple);
      if(st.phase==='lookup')out+=S.move(xs[st.node-1]+ws[st.node-1],210,xs[st.node],210,t,'查找 A',C.purple);
      if(st.phase==='return')out+=travel(S,[[centers[st.target],285],[centers[st.target],340],[centers[0],340],[centers[0],275]],t,'資料 A',C.mint);
      if(st.phase==='done')out+=S.move(centers[0]-40,310,centers[0]+40,310,t,'繼續',C.mint);
      out+=S.text(480,85,'先查快取；未命中再往下一層找',26)+S.text(480,419,'本例不以固定倍數表示真實速度',24);
      return out;
    }
  });

  defs.push({
    id:'save-power',lesson:8,title:'先儲存，再比較斷電結果',
    intro:'把原稿開進 RAM、編輯成新版，再決定是否寫回儲存裝置。',
    prompt:'哪一個動作讓新版在斷電後仍可重新開啟？',
    limit:'假設未啟用自動儲存；儲存情境以寫入完成為前提，省略快取與額外故障。',
    controls:[select('saved','斷電前的選擇','yes',[option('yes','先儲存完成，再斷電'),option('no','未儲存就斷電')])],
    build(v){
      const saved=v.saved!=='no';
      const steps=[
        {phase:'initial',title:'原稿在儲存裝置中',description:'SSD 已保留原稿；RAM 尚未載入這份文件。',disk:'原稿',ram:'尚未開啟',saved},
        {phase:'open',title:'開啟文件到 RAM',description:'把執行中要使用的文件內容載入 RAM，原稿仍保留在 SSD。',disk:'原稿',ram:'原稿',saved},
        {phase:'edit',title:'在 RAM 中修改內容',description:'編輯後，工作中的內容變成新版；尚未完成寫入時，SSD 仍是原稿。',disk:'原稿',ram:'新版',saved}
      ];
      if(saved)steps.push({phase:'save',title:'將新版寫入 SSD',description:'本例等待寫入完成，SSD 中的文件更新為新版。',disk:'新版',ram:'新版',saved});
      steps.push({phase:'power',title:'關閉電源',description:saved?'RAM 的工作內容不保留；已完成寫入的新版仍保留在 SSD。':'RAM 中未儲存的新版不保留；SSD 仍只有原稿。',disk:saved?'新版':'原稿',ram:'斷電後不保留',saved});
      steps.push({phase:'reopen',title:'重新開機並開啟文件',description:saved?'從 SSD 再載入新版；先前的修改已寫入，所以仍能取得。':'重新載入的仍是原稿；未儲存的修改不會自動出現在 SSD。',disk:saved?'新版':'原稿',ram:saved?'新版':'原稿',saved});
      return steps;
    },
    draw(st,t,S){
      const phase=st.phase,power=phase==='power';
      const disk=phase==='save'&&t<.75?'原稿':st.disk;
      const ram=phase==='open'&&t<.75?'載入中':phase==='edit'&&t<.75?'編輯中':phase==='reopen'&&t<.75?'重新載入':st.ram;
      let out=S.box(70,145,260,145,'SSD',disk,phase==='save'||phase==='initial','#e6e9fa')+S.box(610,145,280,145,'RAM',power?'斷電：內容不保留':ram,['open','edit','reopen'].includes(phase),power?'#e4e6ed':'#dff5ec');
      out+=S.box(360,25,240,78,'編輯程式',phase==='edit'?'修改文件':'文件工作情境',phase==='edit','#efe4ff');
      out+=S.arrow(330,190,610,190,C.purple)+S.arrow(610,255,330,255,C.mint);
      if(['open','reopen'].includes(phase))out+=S.move(330,190,610,190,t,'載入',C.purple);
      else if(phase==='save')out+=S.move(610,255,330,255,t,'存入',C.mint);
      else if(phase==='edit')out+=S.move(480,105,750,145,t,'修改',C.orange);
      else if(power)out+=S.move(750,135,750,315,t,'清空',C.red);
      else out+=S.move(120,330,290,330,t,'原稿',C.purple);
      out+=S.text(200,350,'長期保存已寫入內容',24)+S.text(750,350,'工作中的程式與資料',24);
      out+=S.text(480,420,st.saved?'情境：已儲存完成':'情境：未儲存，也未啟用自動儲存',24);
      return out;
    }
  });

  defs.push({
    id:'file-path',lesson:9,title:'沿著路徑找到檔案',
    intro:'看檔案系統逐層找到資料夾與目標檔案。',
    prompt:'同名檔案放在不同資料夾時，為什麼完整路徑仍然重要？',
    limit:'以簡化樹狀目錄示範；不同系統的磁碟、分隔符號與權限規則可能不同，不會操作真實檔案。',
    controls:[select('target','要開啟的檔案','notes',[option('notes','課堂／網路／筆記.txt'),option('report','作業／報告／報告.odt')])],
    build(v){
      const report=v.target==='report',parts=report?['學習資料','作業','報告','報告.odt']:['學習資料','課堂','網路','筆記.txt'];
      return parts.map((name,phase)=>({phase,report,parts,title:phase===3?'找到並開啟目標檔案':`進入「${name}」`,description:phase===0?'先從本例的「學習資料」起點開始尋找。':phase===3?`找到 ${parts.join('／')}。本例只展示路徑探索，不讀取真實檔案。`:`依路徑的下一段進入「${name}」資料夾，不能只憑最後的檔名判斷位置。`}));
    },
    draw(st,t,S){
      const y=st.report?285:70,otherY=st.report?70:285,selected=st.report?['作業','報告','報告.odt']:['課堂','網路','筆記.txt'],other=st.report?['課堂','網路','筆記.txt']:['作業','報告','報告.odt'];
      const positions=[[25,175,170,85],[250,y,170,80],[490,y,170,80],[730,y,200,80]];
      let out='';
      for(const yy of [70,285])out+=S.arrow(195,218,250,yy+40)+S.arrow(420,yy+40,490,yy+40)+S.arrow(660,yy+40,730,yy+40);
      out+=S.box(25,175,170,85,'學習資料','起點',st.phase===0,'#e4f2fb');
      selected.forEach((name,i)=>{out+=S.box([250,490,730][i],y,[170,170,200][i],80,name,i===2?'檔案':'資料夾',st.phase===i+1,'#e4f4ec');});
      other.forEach((name,i)=>{out+=S.box([250,490,730][i],otherY,[170,170,200][i],80,name,i===2?'檔案':'資料夾',false,'#f0f1f8');});
      if(st.phase===0)out+=S.move(65,135,155,135,t,'起點',C.purple);
      else {const a=positions[st.phase-1],b=positions[st.phase];out+=S.move(a[0]+a[2],a[1]+a[3]/2,b[0],b[1]+b[3]/2,t,st.phase===3?'檔案':'下一層',C.purple);}
      out+=S.text(480,420,'／'+st.parts.slice(0,st.phase+1).join('／'),24);
      return out;
    }
  });
})();
