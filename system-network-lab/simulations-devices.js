/* Original device, resource and local-network teaching animations. */
(() => {
  'use strict';
  window.ANIMATION_DEFS = window.ANIMATION_DEFS || [];
  const select=(key,label,def,choices)=>({key,label,type:'select',default:def,options:choices.map(([value,label])=>({value,label}))});
  const clamp=t=>Math.max(0,Math.min(1,Number(t)||0));
  const phase=(t,n,i)=>clamp(t*n-i);
  const step=(stage,title,description,extra={})=>({stage,title,description,...extra});
  const box=(S,x,y,w,h,a,b='',active=false,fill)=>S.box(x,y,w,h,a,b,active,fill);
  const route=(S,points,t,label,color)=>{const i=Math.min(points.length-2,Math.floor(clamp(t)*(points.length-1)));const q=clamp(t)*(points.length-1)-i;return S.move(...points[i],...points[i+1],q,label,color);};
  const caption=(S,s,color='#546582')=>S.text(480,420,s,24,color);
  const cross=(x,y)=>`<path d="M${x-12} ${y-12}l24 24m-24 0 24-24" fill="none" stroke="#c24c71" stroke-width="6" stroke-linecap="round"/>`;
  const hostRect=(x,y,w,h,label,S)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="#f2edff" stroke="#b2a0d5" stroke-width="2"/>${S.text(x+w/2,y+34,label,26)}`;

  window.ANIMATION_DEFS.push({
    id:'permission-gate',lesson:11,title:'權限申請，先看任務需要',
    intro:'讓程式提出權限要求，觀察同意與拒絕後的差別。',
    prompt:'拒絕權限後，任務是否一定不能完成？請比較兩個情境。',
    limit:'只示範使用者同意與任務需求的關係；網頁不會要求真實裝置權限。',
    controls:[select('task','程式任務','recorder',[['recorder','錄音筆要求麥克風'],['torch','手電筒要求通訊錄']]),select('decision','使用者選擇','deny',[['deny','拒絕'],['allow','同意']])],
    build(v){const need=v.task!=='torch',allow=v.decision==='allow';return [
      step(0,'辨認任務',need?'錄音筆需要取得聲音輸入。':'這個手電筒情境不需要讀取通訊錄。',{need,allow}),
      step(1,'程式提出要求',need?'程式經由作業系統申請麥克風存取。':'程式申請讀取通訊錄；先想這是否與照明任務有關。',{need,allow}),
      step(2,'使用者作出決定',allow?'使用者選擇同意，系統可依權限規則授權。':'使用者選擇拒絕，這項存取不會獲得允許。',{need,allow}),
      step(3,allow?'授權後的存取':'存取在權限關卡停止',allow?(need?'錄音筆可以在本模型中取得麥克風聲音。':'通訊錄存取可能被授權，但它不是照明任務必需的資料。'):(need?'沒有麥克風權限，錄音功能無法在本模型中取得聲音。':'拒絕通訊錄存取，仍可完成這個不依賴通訊錄的照明任務。'),{need,allow}),
      step(4,'回到最小必要權限',need?(allow?'只授予錄音任務需要的麥克風存取，仍要確認程式可信。':'若要錄音，可先確認程式用途與可信來源，再決定是否調整必要權限。'):'拒絕與功能無關的資料存取，可以減少不必要的暴露。',{need,allow})
    ];},
    draw(s,t,S){const target=s.need?'麥克風':'通訊錄';let out=box(S,45,145,220,110,s.need?'錄音筆':'手電筒','應用程式',s.stage===0)+box(S,365,130,240,140,'作業系統','權限關卡',s.stage===2)+box(S,710,145,205,110,target,'受保護的存取',s.stage>=3&&s.allow);
      out+=S.arrow(265,200,365,200)+S.arrow(605,200,710,200,s.stage>=3?(s.allow?'#329b83':'#be6680'):'#8ca0c7');
      out+=S.pill(355,315,250,s.stage<2?'等待使用者決定':s.allow?'使用者：同意':'使用者：拒絕',s.stage>=2?'#fff0ca':'#edf2ff');
      if(s.stage===1)out+=S.move(270,190,360,190,t,'申請');
      if(s.stage===2)out+=S.move(480,315,480,270,t,s.allow?'同意':'拒絕','#ba8240');
      if(s.stage===3)out+=s.allow?S.move(610,190,705,190,t,'存取','#329b83'):S.move(610,190,650,190,t,'停止','#bd577a')+cross(672,200);
      if(s.stage===4)out+=S.move(470,110,160,110,t,s.need&&s.allow?'聲音':'結果','#657bb7');
      return out+caption(S,s.need?'任務需要聲音輸入':'照明任務與通訊錄資料無關');
    }
  });

  window.ANIMATION_DEFS.push({
    id:'driver-print',lesson:14,title:'一份文件如何送到印表機？',
    intro:'跟著列印工作，觀察 OS、驅動程式與設備如何合作。',
    prompt:'沒有合適驅動時，工作停在哪個環節？這是否能證明印表機已損壞？',
    limit:'這是簡化的列印路徑；真實列印也會受電源、連線、佇列與設定影響。',
    controls:[select('driver','驅動狀態','ready',[['ready','有合適驅動'],['missing','沒有合適驅動']])],
    build(v){const ready=v.driver!=='missing';return [
      step(0,'準備文件','應用程式產生要列印的文件內容。',{ready}),step(1,'送進系統佇列','應用程式把列印需求交給作業系統。',{ready}),step(2,'交給對應驅動',ready?'系統找到支援這個設備與 OS 的驅動程式。':'本模型沒有合適驅動，無法完成對應的設備溝通。',{ready}),step(3,ready?'轉成設備可用的工作':'工作暫停等待處理',ready?'驅動與系統把需求轉成設備能處理的工作。':'工作沒有成功送到設備；還需檢查正確型號、OS 與可信的支援來源。',{ready}),step(4,ready?'印出結果':'根據線索繼續排查',ready?'印表機依收到的工作輸出文件。':'缺少驅動是本次設定的原因，不代表所有列印失敗都由驅動造成。',{ready})
    ];},
    draw(s,t,S){const xs=[25,260,495,730],titles=['應用程式','作業系統','驅動程式','印表機'];let out='';xs.forEach((x,i)=>out+=box(S,x,135,205,105,titles[i],i===1?'列印佇列':i===2?(s.ready?'支援此設備':'尚未就緒'):'',s.stage===i));for(let i=0;i<3;i++)out+=S.arrow(xs[i]+205,188,xs[i+1],188,i===2&&!s.ready?'#c16a83':'#8ca0c7');
      if(s.stage===1)out+=S.move(125,95,360,95,t,'文件');
      if(s.stage===2)out+=S.move(360,95,595,95,t,'工作');
      if(s.stage===3)out+=s.ready?S.move(595,95,830,95,t,'列印','#329b83'):S.move(605,255,605,285,t,'等待','#bd577a')+cross(710,188);
      out+=`<rect x="760" y="275" width="145" height="112" rx="10" fill="#fff" stroke="#a0b3d7" stroke-width="2"/>`;
      if(s.stage===4&&s.ready){for(let i=0;i<4;i++)out+=`<path d="M780 ${300+i*20}h${105*clamp(t*4-i)}" stroke="#6654a9" stroke-width="5" stroke-linecap="round"/>`;}
      return out+caption(S,s.ready?'各層合作，文件成為可列印的工作':'本例停在驅動環節，先看線索再判斷');
    }
  });

  window.ANIMATION_DEFS.push({
    id:'cpu-gpu',lesson:15,title:'CPU 與 GPU 的任務分工',
    intro:'切換工作內容，看複雜控制與大量相似運算如何分配。',
    prompt:'為什麼大量相似像素可以分成多份？有先後依賴的工作又有何不同？',
    limit:'工作格與動畫節奏只表示分工，不代表真實核心數、速度、耗時或固定效能倍數；CPU 也能多核心並行。',
    controls:[select('work','工作類型','pixels',[['pixels','大量相似的像素工作'],['control','有先後依賴的控制工作']])],
    build(v){const parallel=v.work!=='control';return [step(0,'辨認工作',parallel?'許多像素可依同一規則分別計算。':'後面的決策依賴前一步結果，不能任意全部同時執行。',{parallel}),step(1,'CPU 組織工作','CPU 處理程式邏輯、控制與任務安排。',{parallel}),step(2,parallel?'安排可平行的部分':'依順序處理決策',parallel?'程式把適合的相似運算交給 GPU 協作。':'這個例子由 CPU 依先後關係推進，GPU 不會因此自動加速全部步驟。',{parallel}),step(3,'執行工作',parallel?'GPU 上的多個工作格一起處理可獨立的像素。':'只有前一步完成後，下一個控制步驟才可進行。',{parallel}),step(4,'整合結果','程式將結果交回後續工作；實際分工取決於演算法、硬體與程式支援。',{parallel})];},
    draw(s,t,S){let out=hostRect(30,30,900,350,'共同完成一項工作',S)+box(S,70,110,260,150,'CPU','通用運算與複雜控制',s.stage===1||!s.parallel&&s.stage>=2)+box(S,465,85,410,220,'','',s.parallel&&s.stage>=2)+S.text(670,121,'GPU',28)+S.text(670,157,'大量相似運算',24);
      out+=S.arrow(335,175,460,175)+S.arrow(460,215,335,215,'#60a493');
      const done=s.parallel?(s.stage===4?12:s.stage===3?Math.floor(t*12):0):0;
      for(let i=0;i<12;i++){const x=490+(i%6)*60,y=180+Math.floor(i/6)*60;out+=`<rect x="${x}" y="${y}" width="44" height="42" rx="7" fill="${i<done?'#a2decb':'#e2def5'}" stroke="#9cadd0" stroke-width="2"/>`;}
      if(s.stage===1)out+=S.move(205,70,205,105,t,'任務');
      if(s.stage===2)out+=s.parallel?S.move(340,160,455,160,t,'分工'):S.move(105,295,290,295,t,'控制');
      if(s.stage===3){out+=s.parallel?S.move(490,335,855,335,t,'像素','#329b83'):S.move(105,295,290,295,t,'下一步');}
      if(s.stage===4)out+=S.move(s.parallel?660:200,350,480,385,t,'結果','#329b83');
      return out+caption(S,s.parallel?'相似工作可分開計算，CPU 仍負責協調':'先後依賴會限制能同時處理的部分');
    }
  });

  const rowsFor=set=>{
    const groups=set==='B'?[[7,2,1],[3,5,6],[4,1,0],[2,6,5]]:[[5,3,6],[1,4,7],[2,7,1],[6,2,3]];
    return groups.map((data,r)=>{const p=3-r,parity=data.reduce((a,b)=>a^b,0);let d=0;return Array.from({length:4},(_,disk)=>disk===p?{label:`P${r+1}`,value:parity,parity:true}:{label:`D${r*3+(++d)}`,value:data[d-1],parity:false});});
  };
  const drawArray=(S,rows,cellState,headerState=()=>'',activeRow=-1)=>{
    let out='';for(let disk=0;disk<4;disk++){
      const x=145+disk*180,head=headerState(disk);out+=`<rect x="${x-8}" y="42" width="166" height="285" rx="20" fill="${head==='failed'?'#ffe4eb':'#e7edf9'}" stroke="${head==='failed'?'#c76d88':'#9badd4'}" stroke-width="2"/>`;
      out+=S.text(x+75,78,head==='replace'?`替換磁碟${disk+1}`:`磁碟 ${disk+1}`,24);
      for(let r=0;r<4;r++){const c=rows[r][disk],state=cellState(r,disk),y=100+r*51;const fill=state==='lost'?'#f6c8d4':state==='empty'?'#f7f9ff':c.parity?'#ffedaa':'#d2e4ff';out+=`<rect x="${x}" y="${y}" width="150" height="41" rx="8" fill="${fill}" stroke="${r===activeRow?'#7358b8':'#a6b7d5'}" stroke-width="${r===activeRow?3:1.5}"/>`;out+=S.text(x+75,y+29,state==='empty'?'等待':state==='lost'?'缺失':`${c.label}=${c.value}`,24);}
    }return out;
  };

  window.ANIMATION_DEFS.push({
    id:'raid-write',lesson:16,title:'RAID 5：資料與同位檢查怎麼分散？',
    intro:'四顆磁碟共同寫入資料，觀察每個條帶的同位檢查位置。',
    prompt:'為什麼黃色 P 不應永遠只放在同一顆磁碟？',
    limit:'RAID 5 至少需要三顆磁碟，本例採四顆。以整個新資料條帶的寫入示意，略去既有資料更新與控制器快取；RAID 不是備份。',
    controls:[select('data','資料組合','A',[['A','資料組合 A'],['B','資料組合 B']])],
    build(v){const rows=rowsFor(v.data);const steps=[step(0,'準備四顆磁碟','每個資料條帶包含三個資料區塊 D 與一個同位檢查區塊 P。',{rows,row:-1})];for(let r=0;r<4;r++){const data=rows[r].filter(c=>!c.parity).map(c=>c.value),p=rows[r].find(c=>c.parity).value;steps.push(step(r+1,`寫入資料條帶 ${r+1}`,`${data.join(' ⊕ ')} = ${p}；這裡的 ⊕ 是逐位元 XOR。同位檢查位置會輪流分散。`,{rows,row:r}));}steps.push(step(5,'四個條帶已寫入','資料與同位檢查共同分布在四顆磁碟中；這不會自動保留誤刪前的所有版本。',{rows,row:4}));return steps;},
    draw(s,t,S){let out=drawArray(S,s.rows,(r,d)=>r<s.row||s.stage===5?'written':r===s.row&&t>=(d+1)/4?'written':'empty',()=>'',s.row);out+=box(S,20,335,120,62,'寫入','',s.stage>0&&s.stage<5);
      if(s.row>=0&&s.row<4){for(let d=0;d<4;d++){const q=t*4-d;if(q>=0&&q<=1)out+=S.move(140,365,220+d*180,120+s.row*51,q,s.rows[s.row][d].label,s.rows[s.row][d].parity?'#bd9344':'#6e72bb');}const data=s.rows[s.row].filter(c=>!c.parity).map(c=>c.value),p=s.rows[s.row].find(c=>c.parity).value;out+=S.text(535,370,`${data.join(' ⊕ ')} = ${p}`,28);}
      return out+caption(S,'D 是資料；P 是同位檢查，分散於各顆磁碟');
    }
  });

  window.ANIMATION_DEFS.push({
    id:'raid-rebuild',lesson:16,title:'RAID 5：一顆磁碟故障後的重建',
    intro:'用同一資料條帶的其餘區塊，計算可恢復的缺失值。',
    prompt:'比較一顆與兩顆磁碟故障：單一同位檢查能提供多少已知線索？',
    limit:'以可識別的磁碟故障和四顆磁碟示範。未模擬重建期間再次故障等複雜風險；獨立備份仍然必要。',
    controls:[select('failure','故障情境','disk2',[['disk2','磁碟 2 故障'],['disk4','磁碟 4 故障'],['double','磁碟 2、4 都故障']])],
    build(v){const rows=rowsFor('A'),lost=v.failure==='double'?[1,3]:v.failure==='disk4'?[3]:[1],single=lost.length===1;const a=[step(0,'正常陣列','每個條帶的資料與同位檢查已分散寫入。',{rows,lost,single,row:-1}),step(1,'發現磁碟故障',single?'一顆磁碟故障，陣列可在降級狀態繼續運作；應安排替換與重建。':'兩顆磁碟故障，已超過 RAID 5 的單碟故障保護能力。',{rows,lost,single,row:-1})];if(single){for(let r=0;r<4;r++){const known=rows[r].filter((_,i)=>i!==lost[0]).map(c=>c.value),answer=known.reduce((x,y)=>x^y,0);a.push(step(r+2,`重建資料條帶 ${r+1}`,`讀取其餘三個區塊：${known.join(' ⊕ ')} = ${answer}，可恢復本條帶的缺失區塊。`,{rows,lost,single,row:r,known,answer}));}a.push(step(6,'寫回替換磁碟','本模型的缺失區塊已重建。恢復容錯不代表已取得誤刪前的歷史備份。',{rows,lost,single,row:4}));}else{a.push(step(2,'同一條帶缺少兩個值','只剩一組同位檢查關係，無法唯一決定這兩個未知區塊。',{rows,lost,single,row:0}),step(3,'不能完成唯一重建','本模型不能用 RAID 5 的單一同位檢查恢復兩顆故障磁碟的全部資料。',{rows,lost,single,row:0}),step(4,'尋找可用的獨立備份','應依備份與復原計畫處理，不能把 RAID 同位檢查當成完整舊版副本。',{rows,lost,single,row:0}));}return a;},
    draw(s,t,S){const state=(r,d)=>!s.lost.includes(d)||s.stage===0?'written':s.single&&(r<s.row||s.stage===6||r===s.row&&t>.92)?'written':'lost';let out=drawArray(S,s.rows,state,d=>s.lost.includes(d)&&s.stage>0?(s.single&&s.stage>=2?'replace':'failed'):'',s.row);
      if(s.single&&s.row>=0&&s.row<4){const d=s.lost[0],target=[220+d*180,120+s.row*51];if(t<.5){s.rows[s.row].forEach((c,i)=>{if(i!==d)out+=S.move(220+i*180,120+s.row*51,480,355,t*2,c.label,'#6e72bb');});}else out+=S.move(480,355,...target,(t-.5)*2,`${s.answer}`,'#329b83');out+=S.text(480,380,`${s.known.join(' ⊕ ')} = ${s.answer}`,28);}
      else if(s.stage===1)out+=S.move(480,355,480,335,t,'故障','#bf567c');
      else if(!s.single&&s.stage>=2){out+=S.move(480,355,600,355,t,'未知','#bf567c')+S.text(430,380,'兩個未知，線索不足',28,'#9f3f61');}
      return out+caption(S,s.single?'同一條帶的其餘區塊可恢復一個缺失值':'兩顆故障超過 RAID 5 的保護範圍');
    }
  });

  window.ANIMATION_DEFS.push({
    id:'wifi-internet',lesson:20,title:'連上 Wi-Fi，就能到網站嗎？',
    intro:'讓資料跨過無線接入、家用網路與 ISP，找出中斷在哪一段。',
    prompt:'哪個情境有 Wi-Fi 連線，卻沒有可用的對外路徑？',
    limit:'以已知伺服器位址的請求示範，略去名稱解析及更多中間設備；不測量真實訊號或網路。',
    controls:[select('link','連線情境','online',[['online','Wi-Fi 與對外連線正常'],['upstream','Wi-Fi 正常，對外中斷'],['wifi-off','Wi-Fi 尚未連接']])],
    build(v){const wifi=v.link!=='wifi-off',online=v.link==='online';return [step(0,'檢查不同區段','手機、AP、路由功能與 ISP 分別負責路徑的一部分。',{wifi,online}),step(1,'先加入附近網路',wifi?'手機已加入 AP 提供的無線網路。':'手機尚未加入 AP，先處理無線接入問題。',{wifi,online}),step(2,'資料到達本地路由功能',wifi?'本地 Wi-Fi 正常，請求可通往家中路由功能。':'請求無法越過未建立的無線連線。',{wifi,online}),step(3,'檢查對外路徑',online?'請求經 ISP 通往遠端伺服器。':wifi?'Wi-Fi 雖正常，但對外連線中斷，請求未到達伺服器。':'尚未完成無線接入，不能由此判斷 ISP 或網站狀況。',{wifi,online}),step(4,online?'伺服器回應':'根據區段找線索',online?'回應沿本例可用路徑回到裝置。':'這個現象只指出本模型設定的中斷位置，實際排查還需其他線索。',{wifi,online}),step(5,'整理觀察',online?'無線接入與對外路徑都正常，這次請求取得回應。':wifi?'有 Wi-Fi 連線，不代表每一段對外通訊都正常。':'先建立 Wi-Fi 連線，再逐段檢查其他環節。',{wifi,online})];},
    draw(s,t,S){const xs=[10,205,400,595,790],titles=['手機','AP','路由功能','ISP','伺服器'];let out='';xs.forEach((x,i)=>out+=box(S,x,180,160,100,titles[i],i===1?(s.wifi?'已加入':'未連接'):i===3?(s.online?'對外可用':'待檢查'):'',s.stage===i));for(let i=0;i<4;i++)out+=S.arrow(xs[i]+160,230,xs[i+1],230,(!s.wifi&&i===0||s.wifi&&!s.online&&i===2)?'#bd6680':'#8ca0c7');
      if(s.stage===1)out+=S.move(90,145,s.wifi?285:175,145,t,s.wifi?'加入':'未連');
      if(s.stage===2)out+=s.wifi?route(S,[[90,145],[285,145],[480,145]],t,'請求'):S.move(90,145,175,145,t,'停止','#bd577a');
      if(s.stage===3)out+=s.online?route(S,[[480,145],[675,145],[870,145]],t,'請求'):S.move(s.wifi?480:90,145,s.wifi?565:175,145,t,'停止','#bd577a');
      if(s.stage===4&&s.online){out+=route(S,[[870,325],[675,325],[480,325],[285,325],[90,325]],t,'回應','#329b83');for(let i=4;i>0;i--)out+=S.arrow(xs[i],325,xs[i-1]+160,325,'#60a493');}
      if(s.stage>=2&&!s.wifi)out+=cross(186,230);if(s.stage>=3&&s.wifi&&!s.online)out+=cross(576,230);
      return out+caption(S,'Wi-Fi 接入只是旅程的一段');
    }
  });

  window.ANIMATION_DEFS.push({
    id:'switch-learning',lesson:21,title:'交換器如何學習與轉送？',
    intro:'觀察來源 MAC 如何進入表格，以及未知目的地的資料如何處理。',
    prompt:'目的 MAC 尚未在表中時，交換器會把訊框也送回收到它的那個連接埠嗎？',
    limit:'無迴圈、同一 VLAN 的簡化乙太網路。MAC_A 等是位址代號，省略完整位址、老化與安全功能；未知單播會泛洪至其他適用連接埠。',
    controls:[select('destination','目的 MAC 狀態','known',[['known','已知 MAC_B 在連接埠 2'],['unknown','尚未學到 MAC_B']])],
    build(v){const known=v.destination!=='unknown';return [step(0,'準備 A 傳給 B',known?'表格已經有 MAC_B → 連接埠 2。':'表格尚未記錄 MAC_B 所在的連接埠。',{known}),step(1,'訊框進入連接埠 1','交換器收到 A 傳來的乙太網路訊框。',{known}),step(2,'先學習來源','依來源 MAC_A 與進入的連接埠，學到 MAC_A → 1。',{known}),step(3,'查詢目的 MAC','查表尋找 MAC_B，而不是依來源 MAC 決定目的出口。',{known}),step(4,known?'只往已知連接埠轉送':'目的未知，向其他適用連接埠泛洪',known?'訊框轉送至 B 所在的連接埠 2。':'訊框由連接埠 2、3 轉送，不送回本次進入的連接埠 1；只有 B 是本例目的裝置。',{known}),step(5,'B 的回覆進入連接埠 2','交換器從回覆的來源學到 MAC_B → 2。',{known}),step(6,'依已知 MAC_A 回覆','因為已學到 MAC_A → 1，回覆可只送往 A 的連接埠。',{known})];},
    draw(s,t,S){let out=box(S,40,105,180,100,'裝置 A','MAC_A',s.stage<=1)+box(S,360,160,210,110,'交換器','同一個 LAN',s.stage>=2&&s.stage<=4)+box(S,720,50,180,100,'裝置 B','MAC_B',s.stage>=4)+box(S,720,285,180,100,'裝置 C','MAC_C',s.stage===4&&!s.known);
      out+=S.arrow(220,155,360,210)+S.arrow(570,195,720,100)+S.arrow(570,240,720,335)+S.text(315,190,'埠1',22)+S.text(620,145,'埠2',22)+S.text(620,305,'埠3',22);
      out+=`<rect x="35" y="280" width="290" height="145" rx="16" fill="#fff" stroke="#a7b8d7" stroke-width="2"/>`+S.text(180,313,'學到的 MAC 表',24)+S.text(180,355,s.stage>=2?'MAC_A → 1':'MAC_A：未知',24)+S.text(180,395,s.known||s.stage>=5?'MAC_B → 2':'MAC_B：未知',24);
      if(s.stage===1)out+=S.move(225,150,355,205,t,'A給B');
      if(s.stage===2)out+=S.move(355,230,300,285,t,'學來源','#b78a42');
      if(s.stage===3)out+=S.move(435,280,300,330,t,'查目的','#6b79b6');
      if(s.stage===4){out+=S.move(575,190,715,95,t,'給B');if(!s.known)out+=S.move(575,245,715,340,t,'副本','#9b8bb8')+S.text(760,420,'C：目的不符',24,'#9f586c');}
      if(s.stage===5)out+=S.move(715,100,575,195,t,'B回覆','#329b83');
      if(s.stage===6)out+=S.move(355,210,225,155,t,'回A','#329b83');return out;
    }
  });

  window.ANIMATION_DEFS.push({
    id:'router-next-hop',lesson:21,title:'路由器如何選下一站？',
    intro:'切換目的 IP，觀察查路由資訊後的轉送方向。',
    prompt:'是哪個欄位使本例的下一站不同？下一站是否就等於整段旅程？',
    limit:'以兩個文件用 IPv4 網段示範下一站選擇；略去 NAT、動態路由與更多中間節點，不代表地圖最短路徑。',
    controls:[select('target','目的主機','X',[['X','203.0.113.20（網路 X）'],['Y','198.51.100.25（網路 Y）']])],
    build(v){const target=v.target==='Y'?'Y':'X',ip=target==='X'?'203.0.113.20':'198.51.100.25';return [step(0,'讀取目的地',`本次 IP 封包要前往 ${ip}。`,{target,ip}),step(1,'封包送到路由器','本地裝置把跨網路的封包交給可用的預設閘道。',{target,ip}),step(2,'查看目的 IP','路由器依目的 IP 與路由資訊判斷，而不是依文件顏色或字型。',{target,ip}),step(3,'尋找符合的路由',target==='X'?'本例目的 IP 符合 203.0.113.0/24 的路由。':'本例目的 IP 符合 198.51.100.0/24 的路由。',{target,ip}),step(4,'轉送到下一站',`封包被送往通往網路 ${target} 的下一站。`,{target,ip}),step(5,'下一段旅程繼續','其他路由器仍可能繼續轉送；一台路由器通常只需選好下一站。',{target,ip})];},
    draw(s,t,S){let out=box(S,35,150,190,105,'本地裝置','192.0.2.50',s.stage<=1)+box(S,345,150,230,110,'路由器','依目的 IP 查路由',s.stage===2||s.stage===3)+box(S,740,40,190,105,'下一站 X','通往網路 X',s.stage>=4&&s.target==='X')+box(S,740,280,190,105,'下一站 Y','通往網路 Y',s.stage>=4&&s.target==='Y');
      out+=S.arrow(225,200,345,200)+S.arrow(575,182,740,92,s.stage>=3&&s.target==='X'?'#329b83':'#a9b4cf')+S.arrow(575,230,740,330,s.stage>=3&&s.target==='Y'?'#329b83':'#a9b4cf');
      out+=S.text(400,45,`目的 IP：${s.ip}`,26)+`<rect x="60" y="295" width="545" height="132" rx="16" fill="#fff" stroke="#a9b8d8" stroke-width="2"/>`+S.text(330,325,'本例路由資訊',24);
      const fx=s.stage>=3&&s.target==='X',fy=s.stage>=3&&s.target==='Y';out+=S.text(330,365,'203.0.113.0/24  →  下一站 X',24,fx?'#23836d':'#52617c')+S.text(330,405,'198.51.100.0/24 → 下一站 Y',24,fy?'#23836d':'#52617c');
      if(s.stage===1)out+=S.move(230,190,340,190,t,'封包');
      if(s.stage===2)out+=S.move(460,275,460,295,t,'目的IP','#b78a42');
      if(s.stage===3)out+=S.move(605,350,635,350,t,'下一站','#329b83');
      if(s.stage===4)out+=S.move(580,s.target==='X'?180:230,735,s.target==='X'?92:330,t,'封包','#329b83');
      if(s.stage===5)out+=S.move(835,s.target==='X'?150:390,925,s.target==='X'?150:390,t,'續傳','#329b83');return out;
    }
  });
})();
