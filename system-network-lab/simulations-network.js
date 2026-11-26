/* Original teaching models. All addresses are documentation examples. */
(() => {
  'use strict';
  const defs = window.ANIMATION_DEFS = window.ANIMATION_DEFS || [];
  const C={blue:'#3b85c5',purple:'#7b5dc4',green:'#278c73',red:'#ba5475',amber:'#aa7b20',line:'#94a7c8'};
  const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
  const choose=(key,label,def,options)=>({key,label,type:'select',default:def,options:options.map(([value,label])=>({value,label}))});
  const range=(key,label,def,min,max,step,unit)=>({key,label,type:'range',default:def,min,max,step,unit});
  const route=(S,points,color=C.line)=>points.slice(1).map((p,i)=>S.arrow(...points[i],...p,color)).join('');
  const travel=(S,points,t,label,color=C.purple)=>{const n=points.length-1,q=clamp(t)*n,i=Math.min(n-1,Math.floor(q)),f=q>=n?1:q-i;return S.move(...points[i],...points[i+1],f,label,color);};
  const rect=(x,y,w,h,fill,stroke=C.line,rx=14)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  const title=(S,value)=>S.text(480,34,value,28);
  const rowCells=(S,items,x,y,w=64,gap=12,color='#edf2ff')=>items.map((v,i)=>S.pill(x+i*(w+gap),y,w,String(v),color)).join('');

  defs.push({
    id:'packet-reassembly',lesson:22,title:'封包失序與可靠重組',
    intro:'看資料分段後交錯抵達，再比較失序與遺失重傳。',
    prompt:'若只收到1、3、4，能否立刻交付完整訊息？哪個機制要處理缺少的資料？',
    limit:'以TCP可靠交付作簡化模型，數字表示片段順序；實際TCP使用位元組序號，這裡省略確認與計時細節。IP本身不保證重傳或依序交付。',
    controls:[choose('delivery','傳送情境','reorder',[['reorder','封包失序抵達'],['loss','片段2遺失後重傳']])],
    build(v){
      const loss=v.delivery==='loss',order=loss?[1,3,4]:[3,1,4,2];let received=[];
      const steps=[{title:'把資料切成四段',description:'在這個可靠傳輸模型中，片段有順序資訊，接收端知道如何安排資料。',phase:'prepare',before:[],after:[]}];
      order.forEach(id=>{const before=received.slice();received.push(id);steps.push({title:`片段${id}正在傳送`,description:`本次先送達片段${id}。接收端先保存收到的片段；到達順序不必等於原始順序。`,phase:'send',packet:id,before,after:received.slice()});});
      if(loss){steps.push({title:'發現缺少片段2',description:'目前有1、3、4。可靠傳輸機制仍需處理缺口，不能把不完整資料當成完整訊息交付。',phase:'missing',before:received.slice(),after:received.slice()});steps.push({title:'重傳缺少的片段',description:'這裡簡化表示由可靠傳輸機制重傳片段2；不是IP自己保證補回。',phase:'send',packet:2,before:received.slice(),after:[...received,2]});received.push(2);}
      steps.push({title:'依序交付完整資料',description:'四段資料均已取得，依序組成1、2、3、4，再交給應用程式。',phase:'assemble',before:received.slice(),after:[1,2,3,4]});return steps;
    },
    draw(s,t,S){
      const upper=[[220,210],[350,110],[550,110],[740,210]],lower=[[220,230],[350,310],[550,310],[740,230]];
      let out=title(S,'TCP簡化模型：片段可以失序，交付仍依序')+S.box(30,165,190,115,'傳送端','四段資料',s.phase==='prepare')+S.box(740,165,190,115,'接收端','暫存與排序',s.phase==='assemble');
      out+=route(S,upper)+route(S,lower)+S.pill(280,64,150,'路徑示例 A')+S.pill(530,330,150,'路徑示例 B');
      const shown=s.phase==='send'&&t<.9?s.before:s.after;
      out+=S.text(140,325,'原始順序',24)+rowCells(S,[1,2,3,4],28,344,46,7)+S.text(825,325,'已收到',24)+rowCells(S,shown,680,344,46,7,'#e0f5ed');
      if(s.phase==='send')out+=travel(S,s.packet%2?upper:lower,t,String(s.packet),C.purple);
      else if(s.phase==='prepare')out+=S.move(80,130,150,165,t,'資料',C.blue);
      else if(s.phase==='missing')out+=S.move(770,150,880,150,t,'缺2',C.red)+S.text(480,230,'等待缺少的資料',28,C.red);
      else out+=S.move(825,280,825,314,t,'交付',C.green)+S.text(480,230,'1、2、3、4',30,C.green);
      return out+S.text(480,421,s.phase==='assemble'?'完整後再交給應用程式':'不同片段可能走不同路徑；本圖僅為示例',24);
    }
  });

  defs.push({
    id:'ip-mac-hops',lesson:23,title:'跨網路時，IP與MAC如何配合？',
    intro:'追蹤同一份IP資料，觀察兩段區域連線上的MAC交付對象。',
    prompt:'跨過路由器後，哪些位址在本例保持相同？哪些是下一段連線的新資訊？',
    limit:'以兩段乙太網路、已完成必要位址解析且不做NAT或隧道為例。MA、MR1、MR2、MB、MC是示意MAC標籤，不是真實位址。',
    controls:[choose('destination','目的地','remote',[['remote','遠端網路的B'],['local','同一網路的C']])],
    build(v){const remote=v.destination!=='local';return remote?[
      {title:'比較目的IP與本機子網路',description:'B的IP為203.0.113.20，位於另一個網路，本機將資料交給預設閘道。',phase:'inspect',mac:'尚未建立本跳訊框'},
      {title:'建立第一段訊框',description:'IP的目的仍是B；第一段乙太網路的目的MAC，則是路由器左側介面MR1。',phase:'frame1',mac:'MA 送往 MR1'},
      {title:'第一段交付到路由器',description:'訊框將IP封包帶到路由器。交換器在同一LAN內轉送時，不會把它變成遠端主機的MAC。',phase:'hop1',mac:'MA 送往 MR1'},
      {title:'路由器處理下一段交付',description:'路由器處理收到的訊框，依IP與路由資訊選下一站，再建立下一段的乙太網路訊框。',phase:'route',mac:'準備 MR2 送往 MB'},
      {title:'第二段交付到B',description:'這一段使用路由器右側介面MR2作來源MAC、B的MB作目的MAC；本例IP來源與目的保持不變。',phase:'hop2',mac:'MR2 送往 MB'},
      {title:'B收到IP資料',description:'B依相應協定繼續處理。MAC服務目前這一段連線，IP支援跨網路的定址與轉送。',phase:'arrive',mac:'MR2 送往 MB'}
    ]:[
      {title:'目的地在同一子網路',description:'C的IP為192.0.2.20，與A在本例的同一子網路，這次不需經過右方路由器。',phase:'inspect',mac:'同LAN交付'},
      {title:'建立區域訊框',description:'本例已知道C的MAC為MC。訊框來源為MA、目的為MC，IP目的則是192.0.2.20。',phase:'localframe',mac:'MA 送往 MC'},
      {title:'在LAN內送到C',description:'資料沿區域網路交付給C，不是先繞到外部網站再回來。',phase:'localhop',mac:'MA 送往 MC'},
      {title:'C接收資料',description:'同一LAN內的MAC交付完成。是否跨路由器，取決於IP與路由判斷。',phase:'localdone',mac:'MA 送往 MC'}
    ];},
    draw(s,t,S,v){const remote=v.destination!=='local',dest=remote?'203.0.113.20':'192.0.2.20';let out=title(S,'IP來源 192.0.2.10　目的 '+dest)+S.pill(35,63,280,'LAN A 192.0.2.0/24')+S.pill(635,63,290,'LAN B 203.0.113.0/24');
      out+=S.box(30,150,190,115,'主機 A','MAC：MA',s.phase==='inspect')+S.box(350,150,260,130,'路由器','左MR1　右MR2',s.phase==='route')+S.box(740,150,190,115,'主機 B','MAC：MB',s.phase==='arrive');
      out+=S.box(30,320,190,85,'同網路 C','MAC：MC',s.phase==='localdone','#e1f6ef');
      out+=S.arrow(220,205,350,205,remote?C.blue:C.line)+S.arrow(610,205,740,205,remote?C.blue:C.line)+S.arrow(125,265,125,320,remote?C.line:C.green);
      out+=S.text(480,325,'本跳MAC：'+s.mac,26,C.purple)+S.text(575,368,'IP在本例不做NAT',24)+S.text(575,406,remote?'仍送往203.0.113.20':'直接送往同LAN的C',24);
      if(['frame1','hop1'].includes(s.phase))out+=S.move(220,205,350,205,t,'IP包',C.blue);
      else if(s.phase==='route')out+=S.move(385,208,575,208,t,'IP包',C.purple);
      else if(['hop2','arrive'].includes(s.phase))out+=S.move(610,205,740,205,t,'IP包',C.green);
      else if(['localframe','localhop','localdone'].includes(s.phase))out+=S.move(125,265,125,320,t,'IP包',C.green);
      else out+=S.move(58,120,188,120,t,'目的IP',C.purple);
      return out;
    }
  });

  defs.push({
    id:'encapsulation',lesson:25,title:'資料逐層封裝，再逐層交付',
    intro:'選TCP或UDP，觀察應用資料如何裝進IP封包與乙太網路訊框。',
    prompt:'接收端解封裝時，處理的方向與傳送端有何不同？FCS屬於哪一個資料單位？',
    limit:'本模型採TCP/IP四層與乙太網路；不是每種網路都用相同格式，也不是每一層都有尾端欄位。實際可靠性與順序處理另依所用協定。',
    controls:[choose('transport','傳輸協定','TCP',[['TCP','TCP區段'],['UDP','UDP資料報']])],
    build(v){const proto=v.transport==='UDP'?'UDP':'TCP',pdu=proto==='TCP'?'TCP區段':'UDP資料報';return [
      {title:'應用程式準備資料',description:'應用層產生要傳送的資料，這時尚未加入下方各層的控制資訊。',phase:'app',level:0,proto,pdu,envelope:['應用資料']},
      {title:'傳輸層加入控制資訊',description:`本次選用${proto}。傳輸層形成${pdu}，攜帶本層需要的控制資訊。`,phase:'send',level:1,proto,pdu,envelope:[proto+'標頭','資料']},
      {title:'IP支援跨網路傳送',description:'網際網路層加入IP標頭，包括來源與目的IP，形成IP封包。',phase:'send',level:2,proto,pdu,envelope:['IP標頭',proto,'資料']},
      {title:'建立乙太網路訊框',description:'網路存取層加入乙太網路標頭及FCS等欄位，準備在這一段連線傳送。',phase:'send',level:3,proto,pdu,envelope:['乙太標頭','IP',proto,'資料','FCS']},
      {title:'以訊號通過連線',description:'訊框的位元透過媒介上的電氣、光或無線訊號表示；圖中的包裹只是比喻。',phase:'wire',level:3,proto,pdu,envelope:['乙太標頭','IP',proto,'資料','FCS']},
      {title:'接收端處理訊框',description:'接收端依乙太網路規則處理訊框及錯誤檢查，再把IP封包交給網際網路層。',phase:'receive',level:2,proto,pdu,envelope:['IP標頭',proto,'資料']},
      {title:'處理IP控制資訊',description:`網際網路層處理IP標頭，將${pdu}交給相應的傳輸層。`,phase:'receive',level:1,proto,pdu,envelope:[proto+'標頭','資料']},
      {title:'交付應用資料',description:`傳輸層依${proto}規則處理後，將應用資料向上交付；不是再次加入發送端標頭。`,phase:'receive',level:0,proto,pdu,envelope:['應用資料']}
    ];},
    draw(s,t,S){let out=title(S,'傳送端封裝　　　　　　　接收端解封裝');const labels=['應用資料',s.pdu,'IP封包','乙太網路訊框'];
      for(let i=0;i<4;i++){const y=65+i*72;out+=S.box(35,y,355,54,labels[i],'',(s.phase==='app'||s.phase==='send')&&s.level===i)+S.box(570,y,355,54,labels[i],'',s.phase==='receive'&&s.level===i,'#e7f6f2');if(i<3)out+=S.arrow(212,y+54,212,y+72)+S.arrow(748,y+72,748,y+54);}
      out+=S.arrow(390,308,570,308,C.blue)+S.text(480,276,'連線',24);
      if(s.phase==='send')out+=S.move(212,65+(s.level-1)*72+54,212,65+s.level*72,t,s.proto,C.purple);
      else if(s.phase==='receive')out+=S.move(748,65+(s.level+1)*72,748,65+s.level*72+54,t,'交付',C.green);
      else if(s.phase==='wire')out+=S.move(390,308,570,308,t,'位元',C.blue);
      else out+=S.move(110,45,315,45,t,'資料',C.purple);
      const w=Math.min(158,760/s.envelope.length),start=(960-s.envelope.length*w)/2;out+=s.envelope.map((x,i)=>S.pill(start+i*w,381,w-8,x,i===s.envelope.length-1&&x==='FCS'?'#fff0ce':'#e7e9ff')).join('');return out;
    }
  });

  defs.push({
    id:'dns-cache',lesson:26,title:'DNS：先找快取，再查名稱',
    intro:'比較快取命中與未命中，分清DNS回答IP和網站回傳網頁。',
    prompt:'得到IP後，為什麼瀏覽器還需要另外向網站傳送請求？',
    limit:'learn.example與192.0.2.10為文件示例。模型省略DNS階層、解析器快取與其他紀錄，假設可取得有效A紀錄；DNS不負責傳送完整網頁。',
    controls:[choose('cache','快取狀況','miss',[['miss','本機快取未命中'],['hit','本機已有有效紀錄']])],
    build(v){const hit=v.cache==='hit',steps=[{title:'取出網站主機名稱',description:'瀏覽器從網址中取出learn.example；網址後面的路徑不交給DNS解析。',phase:'name',cached:hit},{title:hit?'本機快取命中':'本機快取未命中',description:hit?'本機已有尚可使用的紀錄，可以先取得192.0.2.10。':'本機沒有可用紀錄，需要向DNS解析服務提出查詢。',phase:'cache',cached:hit}];
      if(!hit)steps.push({title:'向解析服務查詢',description:'查詢傳送的是名稱與查詢類型，這裡要查A紀錄。',phase:'query',cached:false},{title:'解析服務取得名稱紀錄',description:'此例簡化為解析服務向名稱紀錄服務取得對應IP，省略中間的階層步驟。',phase:'lookup',cached:false},{title:'IP回到解析服務',description:'紀錄回覆learn.example對應192.0.2.10，並不是把整個網頁送回來。',phase:'dnsreply',cached:false},{title:'把IP交回瀏覽器',description:'瀏覽器取得IP，本例也把可使用的名稱紀錄放入本機示例快取。',phase:'ipback',cached:true});
      steps.push({title:'向網站另發請求',description:'現在才使用取得的IP，向網站請求頁面資源。DNS和網站服務的角色不同。',phase:'webrequest',cached:true},{title:'網站回傳網頁資料',description:'網站服務回傳頁面內容，瀏覽器再依內容呈現畫面。',phase:'webreply',cached:true});return steps;
    },
    draw(s,t,S){let out=title(S,'名稱：learn.example　IP：192.0.2.10')+S.box(35,145,205,105,'瀏覽器','learn.example',s.phase==='name')+S.box(365,65,235,110,'DNS解析服務','查詢名稱紀錄',['query','ipback'].includes(s.phase))+S.box(700,65,225,110,'名稱紀錄服務','A紀錄',['lookup','dnsreply'].includes(s.phase))+S.box(700,290,225,110,'網站伺服器','回傳頁面',['webrequest','webreply'].includes(s.phase),'#e0f3ef');
      out+=S.box(35,305,240,95,'本機示例快取',s.cached?'192.0.2.10':'尚無可用紀錄',s.phase==='cache',s.cached?'#e0f3ef':'#f3f0fb');
      const routes={query:[[240,180],[365,120]],lookup:[[600,120],[700,120]],dnsreply:[[700,145],[600,145]],ipback:[[365,145],[240,215]],webrequest:[[240,225],[700,340]],webreply:[[700,370],[240,245]],cache:s.cached?[[150,305],[150,250]]:[[150,250],[150,305]],name:[[65,115],[220,115]]};
      out+=S.arrow(240,180,365,120)+S.arrow(600,120,700,120)+S.arrow(700,145,600,145)+S.arrow(365,145,240,215)+S.arrow(240,225,700,340,C.blue)+S.arrow(700,370,240,245,C.green)+S.arrow(150,250,150,305,C.line);
      if(s.phase==='cache'&&s.cached)out+=S.arrow(150,305,150,250,C.green);
      const labels={query:'查名稱',lookup:'查紀錄',dnsreply:'IP',ipback:'IP',webrequest:'請求',webreply:'網頁',cache:s.cached?'IP':'未命中',name:'名稱'};
      out+=travel(S,routes[s.phase],t,labels[s.phase],s.phase==='webreply'?C.green:s.phase==='webrequest'?C.blue:C.purple);return out;
    }
  });

  defs.push({
    id:'cloud-sync',lesson:28,title:'同步刪除與獨立版本備份',
    intro:'看本機與同步資料夾一起改變，再比較有沒有獨立舊版可還原。',
    prompt:'若誤刪也跟著同步，哪個位置還可能保留先前的版本？找回v1是否等於找回所有v2修改？',
    limit:'本情境假設同步本身不保留可恢復舊版；真實服務的版本、回收筒與保留期限依設定而異。獨立備份也需要確認可用與可還原。',
    controls:[choose('protection','資料保護方式','backup',[['backup','同步＋獨立v1備份'],['sync','只有同步，未留舊版']])],
    build(v){const backup=v.protection!=='sync';return [
      {title:'建立第一版文件',description:'本機先有v1文件，其他位置尚未複製。本例接著觀察各位置如何改變。',phase:'create',local:'v1',cloud:'尚未同步',backup:'尚未備份',hasBackup:backup},
      {title:'同步目前內容',description:'同步將目前v1內容帶到雲端同步資料夾；同步目的在讓資料保持一致。',phase:'sync1',local:'v1',cloud:'v1',backup:'尚未備份',hasBackup:backup},
      {title:backup?'另存獨立v1備份':'這次沒有獨立備份',description:backup?'在不同位置保留可恢復的v1副本，之後的同步變更不直接改寫它。':'本例只依賴同步資料夾，也沒有啟用可還原舊版的功能。',phase:'backup',local:'v1',cloud:'v1',backup:backup?'v1':'未保留',hasBackup:backup},
      {title:'修改後同步為v2',description:'本機修改成v2並同步，兩端目前內容更新；若獨立備份未再次執行，備份仍是v1。',phase:'edit',local:'v2',cloud:'v2',backup:backup?'v1':'未保留',hasBackup:backup},
      {title:'誤刪也跟著同步',description:'刪除由本機傳到同步資料夾。這就是為什麼不能只看「雲端有一份」就認定一定能找回。',phase:'delete',local:'已刪除',cloud:'已刪除',backup:backup?'v1':'未保留',hasBackup:backup},
      {title:backup?'從獨立備份還原v1':'此情境沒有可用舊版',description:backup?'可以還原已保留的v1；但尚未另存的v2修改不會自動回來。':'兩個同步位置都已刪除，本例也沒有舊版機制。這不代表所有同步服務都無法復原。',phase:'restore',local:backup?'還原v1':'已刪除',cloud:'已刪除',backup:backup?'v1':'未保留',hasBackup:backup}
    ];},
    draw(s,t,S){let out=title(S,'保持一致，與保留舊版，是兩個不同任務');out+=S.box(30,95,230,120,'本機文件',s.local,['create','restore'].includes(s.phase),s.local==='已刪除'?'#ffe5ec':'#e8edff')+S.box(365,95,230,120,'雲端同步',s.cloud,['sync1','edit','delete'].includes(s.phase),s.cloud==='已刪除'?'#ffe5ec':'#e5f4fc')+S.box(700,95,230,120,'獨立備份',s.backup,s.phase==='backup'&&s.hasBackup,s.hasBackup?'#e4f5ed':'#f0f1f7');
      out+=S.arrow(260,150,365,150,C.blue)+S.text(314,120,'同步',24)+S.arrow(595,150,700,150,C.line,true)+S.text(650,120,'另存',24);
      const info=s.phase==='restore'?(s.hasBackup?'可還原v1；不含未備份的v2修改':'本例沒有可用舊版'):s.phase==='delete'?'同步的刪除會改變兩端目前內容':'獨立備份保留的是指定時間的副本';out+=S.text(480,347,info,26,s.phase==='delete'?C.red:C.green);
      if(['sync1','edit','delete'].includes(s.phase))out+=S.move(260,150,365,150,t,s.phase==='delete'?'刪除':s.phase==='edit'?'v2':'v1',s.phase==='delete'?C.red:C.blue);
      else if(s.phase==='backup'&&s.hasBackup)out+=S.move(595,150,700,150,t,'v1',C.green);
      else if(s.phase==='restore'&&s.hasBackup){const p=[[815,215],[815,280],[145,280],[145,215]];out+=route(S,p,C.green)+travel(S,p,t,'v1',C.green);}
      else out+=S.move(60,265,240,265,t,s.phase==='backup'?'未備份':'文件',s.phase==='backup'?C.red:C.purple);
      return out+S.text(480,403,'同步功能與復原能力，應分別確認',24);
    }
  });

  defs.push({
    id:'bandwidth-delay',lesson:29,title:'頻寬與RTT：兩種不同的等待',
    intro:'調整Mbps與來回延遲，觀察理想傳輸時間和等待反應的差別。',
    prompt:'把Mbps加大後，RTT會跟著變小嗎？傳小訊息與下載大檔案，各容易受哪項指標影響？',
    limit:'固定10 MB＝80 Mb，採十進位。模型總時間只算一次RTT加理想資料傳輸時間，省略建立連線、處理、擁塞與其他開銷；動畫速度不是實測網速。',
    controls:[range('rate','理想傳輸速率',50,10,200,10,'Mbps'),range('rtt','來回延遲',40,10,300,10,'ms')],
    build(v){const rate=Math.max(10,Number(v.rate)||50),rtt=Math.max(10,Number(v.rtt)||40),transfer=80/rate,total=transfer+rtt/1000;return [
      {title:'讀取兩個不同的指標',description:`檔案固定10 MB（80 Mb）。本次理想速率${rate} Mbps，RTT為${rtt} ms。`,phase:'ready',rate,rtt,transfer,total},
      {title:'請求先往遠端走',description:'請求傳向伺服器。這裡把來回等待畫成去程與回程兩段，僅為對稱的簡化示例。',phase:'request',rate,rtt,transfer,total},
      {title:'等到回應開始抵達',description:`此模型先經過一次${rtt} ms的來回等待。增加傳輸速率，不會直接把這個RTT改小。`,phase:'response',rate,rtt,transfer,total},
      {title:'傳送檔案前半段',description:`理想資料傳輸時間＝80 Mb ÷ ${rate} Mbps＝${transfer.toFixed(2)}秒。動畫只幫助觀察比例。`,phase:'first',rate,rtt,transfer,total},
      {title:'繼續傳送後半段',description:'提高Mbps可縮短相同資料量的理想傳輸時間；RTT是另一項獨立設定。',phase:'second',rate,rtt,transfer,total},
      {title:'比較本模型的時間',description:`一次RTT加理想傳輸時間約${total.toFixed(3)}秒。真實下載還可能受到其他因素限制。`,phase:'done',rate,rtt,transfer,total}
    ];},
    draw(s,t,S){const progress=s.phase==='first'?t*.5:s.phase==='second'?.5+t*.5:s.phase==='done'?1:0;let out=title(S,'固定10 MB檔案：先等回應，再傳資料')+S.box(45,70,195,105,'使用者裝置','接收檔案',s.phase==='done')+S.box(720,70,195,105,'伺服器','提供檔案',false,'#e1f4f1');
      out+=S.arrow(240,111,720,111,C.purple)+S.arrow(720,153,240,153,C.green)+S.text(480,93,'去程',24)+S.text(480,188,'回程',24);
      if(s.phase==='request')out+=S.move(240,111,720,111,t,'請求',C.purple);
      else if(s.phase==='response')out+=S.move(720,153,240,153,t,'回應',C.green);
      else if(!['first','second','done'].includes(s.phase))out+=S.move(330,211,630,211,t,'10 MB',C.blue);
      out+=rect(100,221,760,43,'#edf1fb')+`<rect x="100" y="221" width="${760*clamp(progress)}" height="43" rx="14" fill="#9edccd"/>`+S.text(480,294,'已傳送 '+Math.round(progress*100)+'%',26);
      if(['first','second','done'].includes(s.phase))out+=S.move(820,242,140,242,t,'資料',C.blue);
      const xs=[25,340,655],vals=[s.transfer.toFixed(2)+'秒',s.rtt+' ms',s.total.toFixed(3)+'秒'],labs=['理想資料傳輸','來回延遲RTT','本模型合計'];for(let i=0;i<3;i++)out+=S.box(xs[i],322,280,92,vals[i],labs[i],false,i===1?'#f0e8ff':'#e7f4f5');return out;
    }
  });

  defs.push({
    id:'firewall-state',lesson:30,title:'防火牆：請求、回應與連線狀態',
    intro:'在指定規則下，分辨向外請求、相符回應及未允許的新連入。',
    prompt:'為什麼一樣是向內傳入，有的回應能通過，有的新連入會被阻擋？',
    limit:'示例政策只允許向外TCP 443與相符連線回應，並拒絕其他未獲允許的新連入；不是所有防火牆的通用設定。放行不保證內容可信，HTTPS也不全都限定TCP。',
    controls:[choose('traffic','要觀察的流量','request',[['request','由內向外發起連線'],['reply','既有連線的相符回應'],['new','未允許的新連入']])],
    build(v){if(v.traffic==='new')return [
      {title:'外部發起新的連入',description:'這是未預先允許的新連入；本例沒有可匹配的既有連線狀態。',phase:'incoming',state:false,newFlow:true},
      {title:'依政策檢查流量',description:'閘門檢查IP、協定、連接埠與連線狀態，沒有符合的允許條件。',phase:'check',state:false,newFlow:true},
      {title:'阻擋這筆新連入',description:'因為不符合本例政策而阻擋，不是因為所有向內流量一律不准。',phase:'block',state:false,newFlow:true},
      {title:'區分管理流量與判斷內容',description:'防火牆依規則管理連線；網站內容是否真實，仍需另外判斷。',phase:'blockedDone',state:false,newFlow:true}
    ];if(v.traffic==='reply')return [
      {title:'本例已有允許的連線',description:'假設先前已由內部發起並獲允許，防火牆保留相應連線狀態。',phase:'state',state:true},
      {title:'回應向內抵達閘門',description:'回應雖向內傳入，仍可能屬於先前允許的那筆連線。',phase:'incoming',state:true},
      {title:'檢查是否符合既有狀態',description:'這筆回應與本例允許的連線相符，因此可以通過。',phase:'match',state:true},
      {title:'把相符回應交給內部',description:'允許的相符回應進入內部裝置，完成本次示例。',phase:'replyPass',state:true}
    ];return [
      {title:'內部請求向外連線',description:'內部裝置要發起TCP 443連線，流量先抵達防火牆。',phase:'outgoing',state:false},
      {title:'依向外規則判斷',description:'本例政策允許這種向外連線，防火牆也會追蹤相關狀態。',phase:'allow',state:true},
      {title:'請求抵達遠端',description:'允許的請求向遠端繼續傳送。這不等於防火牆保證對方內容安全。',phase:'outPass',state:true},
      {title:'遠端回應回到閘門',description:'回應向內傳回，防火牆檢查是否與既有連線狀態相符。',phase:'incoming',state:true},
      {title:'相符回應獲准通過',description:'在本例政策與狀態相符的條件下，回應可以進入內部。',phase:'replyPass',state:true}
    ];},
    draw(s,t,S){let out=title(S,'示例政策：向外TCP 443及相符回應')+S.box(30,145,210,120,'內部裝置','提出連線需求',false)+S.box(385,125,190,160,'防火牆','規則＋狀態',['check','allow','match','block'].includes(s.phase),'#f0e8ff')+S.box(720,145,210,120,'遠端主機','請求與回應',false,'#e7f5f1');
      out+=S.arrow(240,185,385,185,C.blue)+S.arrow(575,185,720,185,C.blue)+S.arrow(720,235,575,235,C.green)+S.arrow(385,235,240,235,C.green)+S.box(300,335,360,78,'連線狀態',s.state?'已追蹤允許連線':'沒有相符連線',s.state,'#e8f3f5');
      if(s.phase==='outgoing')out+=S.move(240,185,385,185,t,'TCP443',C.blue);
      else if(['allow','outPass'].includes(s.phase))out+=S.move(575,185,720,185,t,'請求',C.blue);
      else if(s.phase==='incoming')out+=S.move(720,235,575,235,t,s.newFlow?'新連入':'回應',s.newFlow?C.red:C.green);
      else if(['match','replyPass','state'].includes(s.phase))out+=S.move(385,235,240,235,t,'回應',C.green);
      else{out+=S.move(720,235,590,235,t,'新連入',C.red)+S.text(642,306,'本例阻擋',26,C.red)+`<path d="M583 216v40" stroke="${C.red}" stroke-width="7" stroke-linecap="round"/>`;}
      return out;
    }
  });

  defs.push({
    id:'icmp-diagnostics',lesson:33,title:'ping沒有回覆，網站就一定壞了嗎？',
    intro:'先做ICMP探測，再另看HTTPS服務；比較有回應與ICMP被過濾的情境。',
    prompt:'如果ping逾時，但HTTPS仍可取得頁面，你能排除或確認哪些事情？TTL與毫秒相同嗎？',
    limit:'所有時間與TTL皆為示例，沒有實測網路。ICMP未回覆可能有多種原因；本動畫只設定其中一種原因為過濾ICMP，不能把它當成每次逾時的診斷結論。',
    controls:[choose('icmp','目的端的探測情境','reply',[['reply','ICMP回應可達'],['blocked','ICMP被過濾，HTTPS可用']])],
    build(v){const blocked=v.icmp==='blocked';return [
      {title:'準備不同服務的測試',description:'先對lab.example的示例IP 203.0.113.20進行ping，再獨立觀察HTTPS服務。',phase:'ready',blocked,ping:'尚未測試',web:'尚未測試'},
      {title:'傳送ICMP Echo Request',description:'ping常用ICMP回應請求；這種探測不是在傳送網頁正文。',phase:'echo',blocked,ping:'等待回覆',web:'尚未測試'},
      {title:blocked?'此例過濾了ICMP':'收到ICMP Echo Reply',description:blocked?'因本情境設定過濾ICMP而未收到回覆。僅看逾時，不足以判定所有服務都壞了。':'本次示例回應的RTT為12 ms，TTL為56；TTL不是56 ms。',phase:blocked?'timeout':'echoReply',blocked,ping:blocked?'逾時':'有回應',web:'尚未測試'},
      {title:'另外請求HTTPS網頁',description:'HTTPS是另一種應用服務測試；能否使用，不能只從ping的結果直接推定。',phase:'webRequest',blocked,ping:blocked?'逾時':'有回應',web:'等待頁面'},
      {title:'HTTPS回傳頁面',description:'在這兩種示例情境中，網站服務都仍可回傳頁面；ICMP過濾沒有同時阻擋這筆HTTPS流量。',phase:'webReply',blocked,ping:blocked?'逾時':'有回應',web:'頁面可達'},
      {title:'依不同線索逐步判斷',description:blocked?'本例顯示ping逾時與HTTPS成功可以同時發生，不能把單次探測當作所有服務狀態的證明。':'ping與HTTPS本次都成功；這仍只是特定時間、特定測試的結果。',phase:'done',blocked,ping:blocked?'逾時':'有回應',web:'頁面可達'}
    ];},
    draw(s,t,S){const p=[[265,200],[440,200],[695,200]];let out=title(S,'同一目的地，不同協定的線索')+S.box(35,140,230,120,'你的裝置','測試與瀏覽',s.phase==='ready')+S.box(400,155,160,90,'轉送路徑','示例',false,'#ecf1fa')+S.box(695,140,230,120,'目的主機','203.0.113.20',false,'#e1f4ef');
      out+=route(S,p,C.line)+S.arrow(695,230,560,230,C.green)+S.arrow(400,230,265,230,C.green);
      if(s.blocked)out+=`<path d="M652 153v104" stroke="${C.red}" stroke-width="5" stroke-dasharray="6 6"/>`+S.text(650,118,'只濾ICMP',24,C.red);
      if(s.phase==='echo')out+=travel(S,s.blocked?[[265,200],[440,200],[640,200]]:p,t,'ICMP',C.purple);
      else if(s.phase==='timeout')out+=S.move(610,200,640,200,t,'ICMP',C.red)+S.text(480,290,'未收到預期回應',24,C.red);
      else if(s.phase==='echoReply')out+=travel(S,[[695,230],[480,230],[265,230]],t,'ICMP',C.green)+S.text(480,290,'示例：12 ms　TTL=56',24);
      else if(s.phase==='webRequest')out+=travel(S,p,t,'HTTPS',C.blue);
      else if(['webReply','done'].includes(s.phase))out+=travel(S,[[695,230],[480,230],[265,230]],t,'網頁',C.green);
      else out+=S.move(100,95,220,95,t,'測試',C.purple);
      out+=S.box(80,325,350,85,'ping：'+s.ping,'ICMP探測',false,s.ping==='逾時'?'#ffebef':'#e9edff')+S.box(530,325,350,85,'HTTPS：'+s.web,'網站服務',false,'#e1f4ef');return out;
    }
  });
})();
