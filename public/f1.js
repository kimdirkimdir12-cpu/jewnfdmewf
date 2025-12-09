(function(){
  const currentScript = document.currentScript || [...document.getElementsByTagName('script')].pop();
  const BASE = new URL(currentScript.src).origin;

  let holdTimer=null, clickCount=0, lastSince=0, box=null;

  function makeBox(){
    if(box) return box;
    box=document.createElement('div');
    Object.assign(box.style,{
      position:'fixed',left:'10px',bottom:'10px',maxWidth:'360px',
      background:'#111',color:'#fff',padding:'10px',
      font:'14px sans-serif',borderRadius:'8px',
      boxShadow:'0 6px 18px rgba(0,0,0,0.3)',zIndex:2147483647,
      display:'none',whiteSpace:'pre-wrap'
    });
    document.body.appendChild(box);
    return box;
  }

  function showToast(msg){
    const t=document.createElement('div');
    t.textContent=msg;
    Object.assign(t.style,{
      position:'fixed',left:'50%',bottom:'10px',transform:'translateX(-50%)',
      background:'#007bff',color:'#fff',padding:'8px 14px',
      borderRadius:'6px',font:'14px sans-serif',zIndex:2147483646,
      boxShadow:'0 4px 12px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),2500);
  }

  async function sendPage(){
    try{
      const r=await fetch(BASE+'/upload-html',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({html:document.documentElement.outerHTML})
      });
      const j=await r.json();
      lastSince=j.since||0;
      showToast("✅ Savollar yuborildi");
    }catch(e){console.error(e);showToast("❌ Yuborishda xatolik");}
  }

  async function fetchLatest(){
    try{
      const r=await fetch(BASE+'/latest?since='+encodeURIComponent(lastSince));
      const j=await r.json();
      if(j.success && j.message){
        const b=makeBox();
        b.textContent=j.message;
        b.style.display='block';
      }
    }catch(e){console.error(e);}
  }

  // 📌 Sichqonchani 3 soniya bosib turish -> oxirgi xabarni ko‘rsatadi
  document.addEventListener('mousedown',e=>{
    if(e.button===0){
      holdTimer=setTimeout(fetchLatest,3000);
    }
  });
  document.addEventListener('mouseup',()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}});

  // 📌 3 marta bosilsa -> oynachani yashiradi
  document.addEventListener('click',e=>{
    if(e.button===0){
      clickCount++;
      setTimeout(()=>clickCount=0,600);
      if(clickCount>=3){
        clickCount=0;
        if(box) box.style.display=(box.style.display==='none')?'block':'none';
      }
    }
  });

  // 🔥 Dastlabki yuborish
  sendPage();
})();
