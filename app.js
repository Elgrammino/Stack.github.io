import {STACK,SUITS,RANKS,label,name,calculate} from './logic.js';
const stage=document.getElementById('stage');
const saved=(()=>{try{return JSON.parse(localStorage.getItem('stack-state'))||{}}catch{return {}}})();
const validCard=card=>STACK.includes(card);
const customBottom=saved.customBottom===true;
const savedStep=typeof saved.customBottom==='boolean'&&['bottom','spectator','position','result'].includes(saved.step)?saved.step:'spectator';
const state={step:savedStep==='bottom'&&!customBottom?'spectator':savedStep,bottom:customBottom&&validCard(saved.bottom)?saved.bottom:'9D',spectator:validCard(saved.spectator)?saved.spectator:null,position:Number.isInteger(saved.position)&&saved.position>=1&&saved.position<=52?saved.position:null,entry:typeof saved.entry==='string'?saved.entry.slice(0,2):String(saved.position||''),draftBottom:saved.bottomSelectionMade===true&&validCard(saved.draftBottom)?saved.draftBottom:null,bottomSelectionMade:saved.bottomSelectionMade===true,customBottom,draftSpectator:validCard(saved.draftSpectator)?saved.draftSpectator:(validCard(saved.spectator)?saved.spectator:null),theme:saved.theme==='light'?'light':'dark',suit:null};
if(Number(state.entry)>52)state.entry='0';
if((state.step==='position'||state.step==='result')&&!state.spectator)state.step='spectator';
else if(state.step==='result'&&!state.position)state.step='position';
const lines='<div class="lines" aria-hidden="true">'+Array.from({length:52},()=>'<i></i>').join('')+'</div>';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const img=c=>`<img class="hero-card" src="cards/${c}.webp" width="701" height="1000" alt="${esc(name(c))}">`;
const cardsWord=n=>n%10===1&&n%100!==11?'карту':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'карты':'карт';
function persist(){try{localStorage.setItem('stack-state',JSON.stringify({...state,suit:undefined}))}catch{}}
function theme(){document.documentElement.dataset.theme=state.theme;document.querySelector('meta[name="theme-color"]').content=state.theme==='dark'?'#20262d':'#f0f3f6'}
function progress(){const step=state.step==='position'?2:state.step==='result'?3:1;return `<div class="progress" role="img" aria-label="Этап ${step} из 3">${[1,2,3].map(n=>`<i class="${n<=step?'active':''}"></i>`).join('')}</div>`}
function header(){return `<header>${state.step==='bottom'||(state.step==='spectator'&&!state.customBottom)?'<span aria-hidden="true"></span>':'<button class="nav" data-action="back">← Назад</button>'}<div class="brand-block"><h1 class="brand">A.C.A.A.N.</h1>${progress()}</div><button class="nav" data-action="theme" aria-label="Включить ${state.theme==='dark'?'светлую':'тёмную'} тему">${state.theme==='dark'?'Светлая':'Тёмная'}</button></header>`}
function modeToggle(){if(state.step!=='bottom'&&state.step!=='spectator')return '';return `<div class="mode-row"><button class="mode-toggle" type="button" role="switch" aria-checked="${state.customBottom}" data-action="custom-bottom"><span>Выбрать нижнюю карту</span><span class="switch-track" aria-hidden="true"><i></i></span></button></div>`}
function crumbs(){if(state.step==='bottom')return '';const spectator=state.step==='position'||state.step==='result';if(!state.customBottom&&!spectator)return '';return `<nav class="crumbs" aria-label="Выбранные карты">${state.customBottom?`<button class="crumb" data-action="edit-bottom" aria-label="Изменить нижнюю карту: ${esc(name(state.bottom))}"><span>Снизу</span><strong>${label(state.bottom)}</strong></button>`:''}${spectator?`${state.customBottom?'<span class="crumb-separator" aria-hidden="true">›</span>':''}<button class="crumb" data-action="edit-spectator" aria-label="Изменить карту зрителя: ${esc(name(state.spectator))}"><span>Зритель</span><strong>${label(state.spectator)}</strong></button>`:''}</nav>`}
function selector(kind){const bottom=kind==='bottom',selected=bottom?state.draftBottom:state.draftSpectator,activeSuit=state.suit||(selected?.at(-1))||('S');return `<section class="screen card-picker">${header()}<div class="content">${modeToggle()}${crumbs()}<h2 class="headline" data-screen-title tabindex="-1">${bottom?'Нижняя карта':'Карта зрителя'}</h2><div class="selection-preview" aria-live="polite">${selected?`<div class="card-crop"><img src="cards/${selected}.webp" alt="${esc(name(selected))}"></div>`:``}</div><p class="hint">Выбери масть и значение</p><div class="card-choices" aria-label="Выбор карты">${RANKS.map(r=>{const card=r+activeSuit;return `<button class="rank ${r==='K'?'last-rank':''}" data-card="${card}" aria-pressed="${card===selected}">${r}</button>`}).join('')}${['S','H','C','D'].map(s=>`<button class="suit ${s==='H'||s==='D'?'red':''}" data-suit="${s}" aria-label="${SUITS[s][1]}" aria-pressed="${s===activeSuit}">${SUITS[s][0]}</button>`).join('')}</div></div><div class="actions"><button class="primary" data-action="confirm-card" ${selected?'':'disabled'}>${selected?`Продолжить с ${label(selected)}`:'Продолжить'}</button></div></section>`}
function position(){return `<section class="screen position-screen">${header()}<div class="content">${modeToggle()}${crumbs()}<h2 class="headline" data-screen-title tabindex="-1">Позиция</h2><p class="hint position-hint">Позиция сверху, от 1 до 52</p><output class="position-display" id="position" aria-label="Выбранная позиция" aria-live="polite">${state.entry||'—'}</output><p class="error" id="error" role="alert"></p><div class="keypad" aria-label="Клавиатура позиции">${['1','2','3','4','5','6','7','8','9','clear','0','delete'].map(key=>`<button class="key" data-key="${key}" aria-label="${key==='clear'?'Очистить':key==='delete'?'Удалить последнюю цифру':key}">${key==='clear'?'Сброс':key==='delete'?'←':key}</button>`).join('')}</div></div><div class="actions"><button class="primary" data-action="calculate">Показать результат</button></div></section>`}
function result(reveal=false){const r=calculate(state.bottom,state.spectator,state.position),zero=r.cut===0;return `<section class="screen result">${header()}<div class="content result"><div class="request" data-screen-title tabindex="-1"><strong>${label(r.target)}</strong> на позиции <strong>${r.position}</strong></div>${zero?'<p class="result-status" data-screen-title tabindex="-1">Всё уже сделано</p>':'<span class="sr-only" data-screen-title tabindex="-1">Подсними</span>'}<div class="result-main ${zero?'zero':''}" ${reveal?'data-reveal':''}><div class="result-card">${img(zero?r.target:r.cutAfter)}${zero?'':`<span class="cut-count" aria-label="Подсними ${r.cut} ${cardsWord(r.cut)} сверху">${r.cut}</span>`}</div>${zero?'':`<div class="deck-guide"><div class="deck" role="img" aria-label="Примерная глубина: после ${r.cut} карт сверху" style="--depth:${r.cut/52*100}%">${lines}<div class="cut"><i class="beam"></i></div></div><strong>${r.cut} ${cardsWord(r.cut)}</strong></div>`}</div></div><div class="actions"><button class="primary" data-action="restart">Начать заново</button></div></section>`}
let renderedStep=null;
function render(revealResult=false){const active=document.activeElement,changed=renderedStep!==null&&renderedStep!==state.step;const focusSelector=active?.dataset?.suit?`[data-suit="${active.dataset.suit}"]`:active?.dataset?.card?`[data-card="${active.dataset.card}"]`:active?.dataset?.action==='theme'?'[data-action="theme"]':null;theme();persist();stage.innerHTML=state.step==='bottom'?selector('bottom'):state.step==='spectator'?selector('spectator'):state.step==='position'?position():result(revealResult);renderedStep=state.step;if(changed||focusSelector)requestAnimationFrame(()=>stage.querySelector(changed?'[data-screen-title]':focusSelector)?.focus({preventScroll:true}))}
function goBack(){state.step=state.step==='result'?'position':state.step==='position'?'spectator':'bottom';state.suit=null;render()}
function startNewTrick(){state.bottom='9D';state.spectator=null;state.position=null;state.entry='';state.draftBottom=null;state.bottomSelectionMade=false;state.draftSpectator=null;state.step=state.customBottom?'bottom':'spectator';state.suit=null}
stage.addEventListener('click',e=>{const button=e.target.closest('button');if(!button)return;if(button.dataset.suit){state.suit=button.dataset.suit;const draft=state.step==='bottom'?'draftBottom':'draftSpectator';if(state[draft])state[draft]=state[draft].slice(0,-1)+state.suit;render();return}if(button.dataset.card){if(state.step==='bottom'){state.draftBottom=button.dataset.card;state.bottomSelectionMade=true}else state.draftSpectator=button.dataset.card;render();return}if(button.dataset.key){const key=button.dataset.key;let error='';if(key==='clear')state.entry='';else if(key==='delete')state.entry=state.entry==='0'?'':state.entry.slice(0,-1);else{const next=(state.entry==='0'?'':state.entry)+key;if(Number(next)>52){state.entry='0';error=`Введи число от 1 до 52. ${next} не в диапазоне`}else if(next.length<=2)state.entry=next}document.getElementById('position').textContent=state.entry||'—';document.getElementById('error').textContent=error;persist();return}switch(button.dataset.action){case 'custom-bottom':state.customBottom=!state.customBottom;startNewTrick();render();break;case 'theme':state.theme=state.theme==='dark'?'light':'dark';render();break;case 'back':goBack();break;case 'edit-bottom':state.step='bottom';state.suit=null;render();break;case 'edit-spectator':state.step='spectator';state.suit=null;render();break;case 'confirm-card':if(state.step==='bottom'&&state.draftBottom){state.bottom=state.draftBottom;state.step='spectator'}else if(state.step==='spectator'&&state.draftSpectator){state.spectator=state.draftSpectator;state.step='position'}state.suit=null;render();break;case 'calculate':if(!/^(?:[1-9]|[1-4][0-9]|5[0-2])$/.test(state.entry)){document.getElementById('error').textContent='Введи число от 1 до 52';return}state.position=Number(state.entry);state.step='result';render(e.detail>0);break;case 'restart':startNewTrick();render();break}});
render();
if('serviceWorker'in navigator){
  let refreshing=false;
  let updateAccepted=false;
  const showUpdate=registration=>{
    if(!registration.waiting||!navigator.serviceWorker.controller||document.getElementById('update-notice'))return;
    const notice=document.createElement('aside');
    notice.id='update-notice';
    notice.className='update-notice';
    notice.setAttribute('role','status');
    notice.innerHTML='<span>Доступно обновление</span><button type="button">Обновить</button>';
    notice.querySelector('button').addEventListener('click',()=>{
      persist();
      updateAccepted=true;
      notice.querySelector('button').disabled=true;
      notice.querySelector('button').textContent='Обновляем…';
      registration.waiting?.postMessage({type:'SKIP_WAITING'});
    });
    document.body.append(notice);
  };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(updateAccepted&&!refreshing){refreshing=true;location.reload()}
  });
  navigator.serviceWorker.register('./sw.js').then(registration=>{
    showUpdate(registration);
    registration.addEventListener('updatefound',()=>{
      const worker=registration.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed')showUpdate(registration);
      });
    });
    registration.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)registration.update().catch(()=>{});
    });
  }).catch(()=>{});
}
