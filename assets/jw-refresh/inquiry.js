'use strict';
(() => {
  const career = new URLSearchParams(location.search).get('type') === 'career';
  const form = document.getElementById('inquiry-form');
  const status = document.getElementById('form-status');
  const submit = document.getElementById('submit-inquiry');
  const topic = document.getElementById('topic');
  const experience = document.getElementById('experience');
  const endpoint = 'https://script.google.com/macros/s/AKfycbzHXzLcaGfUgv3Su7ymafJaq7dS4dicBwidFBUujEr-2jt4rx0uqv_Aen2vSWa8896r/exec';
  const kind = career ? 'career' : 'consulting';
  const submitLabel = career ? '직무·교육 문의 남기기 →' : '컨설팅 문의 남기기 →';
  submit.textContent = submitLabel;
  if(career){
    document.getElementById('inquiry-eyebrow').textContent='CAREER INQUIRY';
    document.getElementById('inquiry-title').innerHTML='새로운 시작,<br>궁금한 것부터 물어보세요.';
    document.getElementById('inquiry-intro').textContent='실제 업무와 교육 과정, 위촉 조건과 보수 구조를 안내합니다. 신입과 타 업종 이직 희망자 모두 문의할 수 있습니다.';
    document.getElementById('consulting-info').hidden=true;
    document.getElementById('inquiry-price').hidden=true;
    document.getElementById('career-info').hidden=false;
    document.getElementById('topic-field').hidden=true;
    document.getElementById('career-field').hidden=false;
    document.getElementById('consulting-tab').removeAttribute('aria-current');
    document.getElementById('career-tab').setAttribute('aria-current','page');
    topic.disabled=true;topic.required=false;
    experience.disabled=false;experience.required=true;
  }
  function showStatus(title,message,isError=false){
    status.replaceChildren();
    const heading=document.createElement('h3');heading.textContent=title;
    const detail=document.createElement('p');detail.textContent=message;
    status.append(heading,detail);
    const p=document.createElement('p');const link=document.createElement('a');
    link.href='https://open.kakao.com/me/jwfinancial';link.target='_blank';link.rel='noopener noreferrer';
    link.textContent='카카오톡으로 문의·접수 확인 ↗';link.style.textDecoration='underline';p.append(link);status.append(p);
    status.hidden=false;status.classList.toggle('error',isError);status.focus();
  }
  let sent=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(sent || submit.disabled || !form.reportValidity())return;
    if(document.getElementById('website').value)return;
    const name=document.getElementById('name');
    name.setCustomValidity(name.value.trim()?'':'이름을 입력해 주세요.');
    const contact=document.getElementById('contact');
    const phone=contact.value.replace(/[^0-9]/g,'');
    contact.setCustomValidity(/^01[016789][0-9]{7,8}$/.test(phone)?'':'연락 가능한 휴대폰 번호를 확인해 주세요.');
    if(!form.reportValidity())return;
    submit.disabled=true;submit.textContent='문의 전송 중…';status.hidden=true;
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),15000);
    // Reuse the existing receiver's field names. Career requests are explicitly
    // labelled in the fields visible in its existing sheet and email templates.
    const payload={
      name:name.value.trim(),contact:contact.value.trim(),
      referral:career?'홈페이지 함께 일하기 문의':'홈페이지 간단한 컨설팅 문의',
      interest:career?'[리쿠르팅] 직무·교육·보수 안내':topic.value,
      job:career?experience.value:'',
      reason:document.getElementById('message').value.trim(),
      preinfo:'개인정보 수집·이용 동의: 문의 응대 목적 / '+new Date().toISOString(),
      request_id:globalThis.crypto?.randomUUID?.() || Date.now()+'_'+Math.random().toString(36).slice(2),
    };
    try{
      const response=await fetch(endpoint,{method:'POST',mode:'no-cors',body:JSON.stringify(payload),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(response.type!=='opaque' && !response.ok)throw new Error('Request failed');
      let confirmed=false;
      if(response.type!=='opaque'){
        const result=await response.json();
        if(result.result!=='success')throw new Error('Receiver rejected request');
        confirmed=true;
      }
      sent=true;
      if(confirmed){
        showStatus('문의가 접수되었습니다.','담당자가 내용을 확인한 뒤 연락드립니다.');
      }else{
        showStatus('문의 전송을 요청했습니다.','아직 접수 완료 여부는 확인되지 않았습니다. 카카오톡으로 접수 여부를 확인하실 수 있습니다.');
      }
      submit.textContent=confirmed?'문의 접수 완료':'전송 요청 완료';
      if(typeof window.gtag==='function')window.gtag('event',confirmed?'generate_lead':'inquiry_request_sent',{inquiry_type:kind});
    }catch(error){
      showStatus('접수 여부를 확인하지 못했습니다.','입력 내용은 그대로 남아 있습니다. 다시 시도하거나 카카오톡으로 문의해 주세요.',true);
      submit.disabled=false;submit.textContent=submitLabel;
    }finally{clearTimeout(timeout);}
  });
  form.addEventListener('input',event=>{if(typeof event.target.setCustomValidity==='function')event.target.setCustomValidity('');});
})();
