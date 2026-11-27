/* Browser narration for the animation player. Speech begins only when speak() is called. */
(() => {
  'use strict';
  const KEY='system-network-animation-voice-v1';
  const MAX_CHARS=180;
  const abbreviations={CPU:'中央處理器',OS:'作業系統',RAM:'隨機存取記憶體',DNS:'網域名稱系統',GUI:'圖形使用者介面',CLI:'命令列介面',RAID:'磁碟陣列',TCP:'T C P',UDP:'U D P',IP:'I P',MAC:'M A C',TLS:'T L S',HTTPS:'H T T P S',HTTP:'H T T P',SSD:'S S D',HDD:'H D D',USB:'U S B',ICMP:'I C M P',RTT:'R T T',TTL:'T T L',URL:'U R L',JSON:'J S O N'};
  function spokenText(value){
    const protectedText=[];
    let text=String(value).replace(/https?:\/\/[^\s\u3000，。；！？、（）「」【】]+|[A-Za-z]:\\[^\s，。；！？、（）「」【】]+|[?#][A-Za-z0-9_~.%=&+\/-]+/g,match=>`\uE000${protectedText.push(match)-1}\uE001`);
    // Boundaries exclude paths, host names and parameter syntax. In particular, MB is not expanded:
    // some lessons use it as a fictional MAC label rather than a storage unit.
    text=text.replace(/(^|[^A-Za-z0-9_./\\?=&%#-])(RAID\s*[0156]|HTTPS|HTTP|CPU|RAM|DNS|GUI|CLI|RAID|TCP|UDP|MAC|TLS|SSD|HDD|USB|ICMP|RTT|TTL|URL|JSON|OS|IP)(?=$|[^A-Za-z0-9_./\\?=&%#-])/g,(_,before,token)=>before+(/^RAID\s*\d$/.test(token)?'磁碟陣列'+token.match(/\d/)[0]:abbreviations[token]));
    return text.replace(/\uE000(\d+)\uE001/g,(_,i)=>protectedText[Number(i)]);
  }
  function chunks(text){
    const out=[];let buffer='';
    const sentences=text.match(/[^。！？!?；;\n]+[。！？!?；;\n]*|[。！？!?；;\n]+/g)||[text];
    for(const sentence of sentences){
      const letters=Array.from(sentence);
      if(Array.from(buffer).length+letters.length<=MAX_CHARS){buffer+=sentence;continue;}
      if(buffer.trim())out.push(buffer.trim());buffer='';
      while(letters.length>MAX_CHARS)out.push(letters.splice(0,MAX_CHARS).join(''));
      buffer=letters.join('');
    }
    if(buffer.trim())out.push(buffer.trim());
    return out;
  }
  window.createAnimationVoice=({onState}={})=>{
    const synth=window.speechSynthesis;
    const supported=Boolean(synth&&typeof synth.speak==='function'&&typeof synth.cancel==='function'&&typeof window.SpeechSynthesisUtterance==='function');
    let enabled=true;try{enabled=localStorage.getItem(KEY)!=='false';}catch{}
    let voices=[],generation=0,busy=false,current=null,timer=0,disposed=false;
    const invoke=(fn,...args)=>{if(typeof fn==='function'){try{fn(...args);}catch{}}};
    const baseState=()=>!supported?'unsupported':enabled?'idle':'off';
    const emit=(state,text='',message='')=>invoke(onState,{state,text,message});
    const clearTimer=()=>{if(timer)window.clearTimeout(timer);timer=0;};
    function refreshVoices(){try{voices=supported?(synth.getVoices?.()||[]):[];}catch{voices=[];}}
    function chosenVoice(){
      const lang=v=>String(v.lang||'').replace(/_/g,'-').toLowerCase();
      return voices.find(v=>lang(v)==='zh-tw')||voices.find(v=>/^zh-(cn|sg)$/.test(lang(v)))||voices.find(v=>/^zh(?:-|$)/.test(lang(v)))||null;
    }
    function cancelCurrent(){generation++;clearTimer();busy=false;current=null;if(supported){try{synth.cancel();}catch{}}}
    function stop(message=''){cancelCurrent();emit(baseState(),'',message);}
    function speak(parts,options={}){
      if(disposed)return false;
      cancelCurrent();
      if(!supported){emit('unsupported','','此瀏覽器無法播放語音，可閱讀畫面上的講解。');return false;}
      if(!enabled){emit('off','','語音講解已關閉。');return false;}
      const source=(Array.isArray(parts)?parts:[parts]).map(v=>String(v??'').trim()).filter(Boolean);
      const queue=source.flatMap((text,index)=>chunks(spokenText(text)).map(chunk=>({text,index,chunk})));
      if(!queue.length){emit('idle','','目前沒有可播放的講解。');return false;}
      const token=++generation,begun=new Set();let position=0;
      busy=true;refreshVoices();
      const valid=()=>token===generation&&!disposed&&enabled;
      function fail(error){
        if(!valid())return;
        cancelCurrent();emit('error','','語音暫時無法播放，請按「重聽講解」再試；也可閱讀畫面講解。');invoke(options.onError,error);
      }
      function next(){
        if(!valid())return;
        clearTimer();
        if(position===queue.length){busy=false;current=null;emit('idle','','這段講解已完成。');if(valid())invoke(options.onEnd);return;}
        const entry=queue[position++];
        let utterance;try{utterance=new window.SpeechSynthesisUtterance(entry.chunk);}catch(error){fail(error);return;}
        current=utterance;
        const voice=chosenVoice();utterance.lang=voice?.lang||'zh-TW';if(voice)utterance.voice=voice;
        utterance.rate=.95;utterance.pitch=1;utterance.volume=1;
        emit('speaking',entry.text,'語音講解準備中…');
        utterance.onstart=()=>{
          if(!valid()||current!==utterance)return;
          clearTimer();emit('speaking',entry.text,'正在講解');
          if(!begun.has(entry.index)){begun.add(entry.index);invoke(options.onPart,entry.text,entry.index);}
          if(valid()&&current===utterance)timer=window.setTimeout(()=>fail({error:'speech-timeout'}),Math.max(30000,Array.from(entry.chunk).length*600+15000));
        };
        utterance.onend=()=>{if(!valid()||current!==utterance)return;clearTimer();current=null;next();};
        utterance.onerror=event=>{if(valid()&&current===utterance)fail(event);};
        // A failed autoplay or unavailable system voice must never leave the player waiting forever.
        timer=window.setTimeout(()=>fail({error:'speech-start-timeout'}),10000);
        try{if(valid())synth.speak(utterance);}catch(error){fail(error);}
      }
      next();return busy;
    }
    function setEnabled(value){
      enabled=Boolean(value);try{localStorage.setItem(KEY,String(enabled));}catch{}
      stop(enabled?'播放動畫時會自動講解。':'語音講解已關閉，動畫仍可播放。');return enabled;
    }
    refreshVoices();if(supported&&typeof synth.addEventListener==='function')synth.addEventListener('voiceschanged',refreshVoices);
    emit(baseState(),'',supported?(enabled?'播放動畫時會自動講解。':'語音講解已關閉。'):'此瀏覽器無法播放語音，可閱讀畫面上的講解。');
    return{get supported(){return supported;},get enabled(){return enabled;},get busy(){return busy;},speak,stop,setEnabled,dispose(){if(disposed)return;stop();disposed=true;if(supported&&typeof synth.removeEventListener==='function')synth.removeEventListener('voiceschanged',refreshVoices);}};
  };
})();
