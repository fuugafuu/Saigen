(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;

  const CONFIG = Object.freeze({
    width: 960,
    height: 540,
    fixedDt: 1 / 60,
    maxFrame: 1 / 12,
    maxHp: 92,
    soulRadius: 10,
    dodgeDuration: 8.2,
    arena: Object.freeze({ x: 250, y: 168, w: 460, h: 248 })
  });

  const State = Object.freeze({
    TITLE: 'TITLE', INTRO: 'INTRO', COMMAND: 'COMMAND', SUBMENU: 'SUBMENU',
    TIMING: 'TIMING', DODGE: 'DODGE', RESOLVE: 'RESOLVE', ROUND: 'ROUND',
    END: 'END', PAUSED: 'PAUSED'
  });

  const I18N = {
    ja: {
      subtitle: 'TWO SOULS. ONE RHYTHM.', tagline: '読む。避ける。リズムを崩す。',
      localVersus: 'ローカル対戦', localVersusSub: '同じ端末で2人対戦', training: 'トレーニング', trainingSub: '弾幕回避を練習',
      settings: '設定', settingsSub: '言語・演出・音量', stableCore: '固定60Hz / 安定化コア', keyboardHint: 'PC: WASD / 矢印キー　スマホ: 画面操作',
      ready: 'READY', active: 'ACTIVE', attacking: 'ATTACK', dodging: 'DODGE', deterministic: 'DETERMINISTIC',
      rotateTip: '横向きにすると遊びやすくなります', paused: 'PAUSED', pauseHint: '再開するには「再開」を押してください', resume: '再開', quit: 'タイトルへ戻る',
      fight: 'FIGHT', act: 'ACT', item: 'ITEM', mercy: 'MERCY', confirm: '決定', pause: '一時停止',
      language: '言語', screenShake: '画面シェイク', scanlines: 'スキャンライン', reducedMotion: 'アニメーションを減らす', soundVolume: '効果音', touchSize: 'タッチ操作サイズ',
      stabilityNote: 'ゲーム判定は固定60Hz。演出が遅れても勝敗判定はズレません。',
      choose: '行動を選べ。', intro: 'P1 と P2 の同期完了。先攻は P1。', trainingIntro: 'トレーニング開始。弾幕のルールを覚えよう。',
      fightReady: '中央で止めるほど、次の弾幕が強くなる。', perfect: 'PERFECT。攻撃のリズムが完全に噛み合った。', good: 'GOOD。十分な圧力だ。', weak: '少し外した。それでも攻撃は続く。',
      dodge: 'P{def} は回避。青は止まる、橙は動き続ける。P{atk} は左右ボタンで弾幕を曲げられる。',
      actRead: '軌道を読む。次の弾幕の進行方向が見える。', actFocus: '集中。RS が上昇した。', actPressure: '圧力をかけた。相手のバトルボックスが狭くなる。', actFeint: 'フェイント。次のタイミングバーが不規則になる。',
      itemPatch: 'PATCH を使用。HP を 18 回復。', itemTonic: 'TONIC を使用。RS を 24 回復。', itemWard: 'WARD を使用。次の2回の被弾を軽減。', itemEmpty: 'そのアイテムは残っていない。',
      mercyNotReady: 'まだ SPARE できない。相手の MY を高める必要がある。', mercySpare: 'SPARE。戦わずに決着した。', mercyTruce: '停戦を提案。互いの MY が上昇した。',
      winner: 'P{p} WIN', winnerKo: 'P{p} が相手のリズムを打ち砕いた。', rematch: '決定ボタンで再戦',
      wave: 'WAVE {n}', round: 'ROUND {n}', turn: 'P{p} TURN',
      submenuAct: 'ACT を選択', submenuItem: 'ITEM を選択', submenuMercy: 'MERCY を選択', back: '戻る',
      read: 'READ', focus: 'FOCUS', pressure: 'PRESSURE', feint: 'FEINT', patch: 'PATCH +18 HP', tonic: 'TONIC +24 RS', ward: 'WARD / GUARD', spare: 'SPARE', truce: 'OFFER TRUCE',
      phaseTiming: '決定で止める', phaseChoose: '行動選択', phasePaused: '停止中',
      touchDefend: 'P{p} DEFEND', touchAttack: 'P{p} ATTACK'
    },
    en: {
      subtitle: 'TWO SOULS. ONE RHYTHM.', tagline: 'READ. DODGE. BREAK THEIR RHYTHM.',
      localVersus: 'LOCAL VERSUS', localVersusSub: '2 players / same device', training: 'TRAINING', trainingSub: 'Practice bullet dodging',
      settings: 'SETTINGS', settingsSub: 'Language, effects, audio', stableCore: 'FIXED 60HZ / STABILITY CORE', keyboardHint: 'PC: WASD / ARROWS　MOBILE: TOUCH CONTROLS',
      ready: 'READY', active: 'ACTIVE', attacking: 'ATTACK', dodging: 'DODGE', deterministic: 'DETERMINISTIC',
      rotateTip: 'Landscape is recommended', paused: 'PAUSED', pauseHint: 'Press resume to continue', resume: 'RESUME', quit: 'QUIT TO TITLE',
      fight: 'FIGHT', act: 'ACT', item: 'ITEM', mercy: 'MERCY', confirm: 'CONFIRM', pause: 'PAUSE',
      language: 'LANGUAGE', screenShake: 'SCREEN SHAKE', scanlines: 'SCANLINES', reducedMotion: 'REDUCED MOTION', soundVolume: 'SFX VOLUME', touchSize: 'TOUCH CONTROL SIZE',
      stabilityNote: 'Gameplay uses a fixed 60Hz simulation. Visual slowdown never changes battle results.',
      choose: 'Choose your action.', intro: 'P1 and P2 synchronized. P1 moves first.', trainingIntro: 'Training started. Learn the projectile rules.',
      fightReady: 'Stop near center. Better timing strengthens the next barrage.', perfect: 'PERFECT. The attack locks into rhythm.', good: 'GOOD. Enough pressure to matter.', weak: 'Off-center. The attack still continues.',
      dodge: 'P{def}: dodge. BLUE = stay still. ORANGE = keep moving. P{atk}: bend the barrage with MOD.',
      actRead: 'READ. The next projectile directions become visible.', actFocus: 'FOCUS. Resolve increased.', actPressure: 'PRESSURE. The opponent arena will shrink.', actFeint: 'FEINT. The next timing bar becomes unstable.',
      itemPatch: 'PATCH used. Restored 18 HP.', itemTonic: 'TONIC used. Restored 24 RS.', itemWard: 'WARD used. The next two hits are reduced.', itemEmpty: 'No uses remain.',
      mercyNotReady: 'SPARE is not ready. Raise the opponent MY first.', mercySpare: 'SPARE. The battle ends without a knockout.', mercyTruce: 'Truce offered. Both MY meters increased.',
      winner: 'P{p} WIN', winnerKo: 'P{p} shattered the opposing rhythm.', rematch: 'Press confirm to rematch',
      wave: 'WAVE {n}', round: 'ROUND {n}', turn: 'P{p} TURN',
      submenuAct: 'Choose ACT', submenuItem: 'Choose ITEM', submenuMercy: 'Choose MERCY', back: 'BACK',
      read: 'READ', focus: 'FOCUS', pressure: 'PRESSURE', feint: 'FEINT', patch: 'PATCH +18 HP', tonic: 'TONIC +24 RS', ward: 'WARD / GUARD', spare: 'SPARE', truce: 'OFFER TRUCE',
      phaseTiming: 'CONFIRM TO STOP', phaseChoose: 'CHOOSE', phasePaused: 'PAUSED',
      touchDefend: 'P{p} DEFEND', touchAttack: 'P{p} ATTACK'
    }
  };

  class RNG {
    constructor(seed = 0x12345678) { this.s = seed >>> 0 || 1; }
    next() { let x = this.s; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.s = x >>> 0; return this.s / 4294967296; }
    range(a, b) { return a + (b - a) * this.next(); }
  }

  class Input {
    constructor() {
      this.down = new Set(); this.pressed = new Set(); this.released = new Set();
      this.touch = { x: 0, y: 0, confirm: false, modL: false, modR: false };
      this.touchPressed = { confirm: false, modL: false, modR: false };
      window.addEventListener('keydown', e => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
        if (!this.down.has(e.code)) this.pressed.add(e.code);
        this.down.add(e.code);
      }, { passive: false });
      window.addEventListener('keyup', e => { this.down.delete(e.code); this.released.add(e.code); });
    }
    has(code) { return this.down.has(code); }
    tap(code) { return this.pressed.has(code); }
    touchTap(key) { return !!this.touchPressed[key]; }
    setTouchButton(key, on) {
      if (on && !this.touch[key]) this.touchPressed[key] = true;
      this.touch[key] = on;
    }
    clearFrame() { this.pressed.clear(); this.released.clear(); this.touchPressed.confirm = this.touchPressed.modL = this.touchPressed.modR = false; }
    clearAll() {
      this.down.clear(); this.pressed.clear(); this.released.clear();
      this.touch.x = this.touch.y = 0; this.touch.confirm = this.touch.modL = this.touch.modR = false;
      this.touchPressed.confirm = this.touchPressed.modL = this.touchPressed.modR = false;
    }
  }

  class AudioBank {
    constructor() { this.ctx = null; this.volume = .65; }
    wake() {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (_) {}
    }
    tone(freq = 440, dur = .04, type = 'square', gain = .035, slide = 0, offset = 0) {
      if (!this.ctx || this.volume <= 0) return;
      const t = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(Math.max(.0001, gain * this.volume), t);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(g); g.connect(this.ctx.destination); osc.start(t); osc.stop(t + dur + .01);
    }
    move() { this.tone(180,.025,'square',.022,55); }
    confirm() { this.tone(520,.045,'square',.04,140); }
    hit() { this.tone(92,.1,'sawtooth',.05,-38); }
    miss() { this.tone(180,.06,'square',.02,-70); }
    tick() { this.tone(760,.018,'square',.013); }
    win() { [392,523,659,784].forEach((f,i)=>this.tone(f,.17,'square',.04,35,i*.095)); }
  }

  class ParticleSystem {
    constructor() { this.items = []; }
    burst(x,y,color,count=12,speed=90) {
      for (let i=0;i<count;i++) {
        const a=Math.random()*TAU,s=.25*speed+Math.random()*speed;
        this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.4,max:.7,color,size:2+Math.random()*4});
      }
    }
    update(dt) { for(const p of this.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98;} this.items=this.items.filter(p=>p.life>0); }
    draw(ctx) { ctx.save(); for(const p of this.items){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.ceil(p.size),Math.ceil(p.size));} ctx.restore(); }
  }

  class Projectile {
    constructor(x,y,vx,vy,r=7,color='#fff',type='normal',rule='white') { Object.assign(this,{x,y,vx,vy,r,color,type,rule,dead:false,age:0}); }
    update(dt){this.age+=dt;this.x+=this.vx*dt;this.y+=this.vy*dt;}
    draw(ctx){
      ctx.save();ctx.fillStyle=this.color;ctx.shadowBlur=5;ctx.shadowColor=this.color;
      if(this.type==='diamond'){ctx.translate(this.x,this.y);ctx.rotate(Math.PI/4);ctx.fillRect(-this.r,-this.r,this.r*2,this.r*2);}
      else if(this.type==='bone'){ctx.fillRect(this.x-this.r*.45,this.y-this.r*1.6,this.r*.9,this.r*3.2);ctx.fillRect(this.x-this.r,this.y-this.r*1.8,this.r*2,this.r*.65);ctx.fillRect(this.x-this.r,this.y+this.r*1.15,this.r*2,this.r*.65);}
      else {ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,TAU);ctx.fill();}
      ctx.restore();
    }
  }

  class PatternEngine {
    constructor(game){this.game=game;this.rng=new RNG();this.timer=0;this.step=0;this.name='CROSSFIRE';this.mod=0;this.modDecay=0;}
    reset(seed,name){this.rng=new RNG(seed);this.timer=0;this.step=0;this.name=name;this.mod=0;this.modDecay=0;this.game.projectiles.length=0;}
    pulse(dir){this.mod=clamp(this.mod+dir,-2,2);this.modDecay=.38;this.game.spawnRingFx=.22;}
    update(dt){
      this.timer+=dt;if(this.modDecay>0){this.modDecay-=dt;if(this.modDecay<=0)this.mod*=.25;}
      const g=this.game,a=g.arena,boost=1+g.timingScore*.24;
      if(this.name==='CROSSFIRE'){
        const rate=.45/boost;
        while(this.timer>rate){this.timer-=rate;const left=this.rng.next()>.5,y=this.rng.range(a.y+18,a.y+a.h-18),s=(182+this.rng.range(0,76))*boost;const rule=this.step%7===0?'blue':this.step%5===0?'orange':'white';const color=rule==='blue'?'#37dcff':rule==='orange'?'#ff8a00':'#fff';g.projectiles.push(new Projectile(left?a.x-16:a.x+a.w+16,y,left?s:-s,this.mod*20,7,color,this.step%3===0?'diamond':'normal',rule));this.step++;}
      } else if(this.name==='ORBIT'){
        const rate=.56/boost;
        while(this.timer>rate){this.timer-=rate;const side=this.step%4;let x,y,vx,vy;const s=(150+this.rng.range(0,50))*boost;if(side===0){x=a.x-12;y=this.rng.range(a.y,a.y+a.h);vx=s;vy=0}else if(side===1){x=a.x+a.w+12;y=this.rng.range(a.y,a.y+a.h);vx=-s;vy=0}else if(side===2){x=this.rng.range(a.x,a.x+a.w);y=a.y-12;vx=0;vy=s}else{x=this.rng.range(a.x,a.x+a.w);y=a.y+a.h+12;vx=0;vy=-s}const rule=this.step%4===0?'orange':this.step%4===2?'blue':'white';const color=rule==='orange'?'#ff8a00':rule==='blue'?'#37dcff':'#fff';g.projectiles.push(new Projectile(x,y,vx+(side>1?this.mod*17:0),vy+(side<2?this.mod*17:0),7,color,'normal',rule));this.step++;}
      } else if(this.name==='LANES'){
        const rate=.7/boost;
        while(this.timer>rate){this.timer-=rate;const gap=Math.floor(this.rng.range(0,5));for(let lane=0;lane<5;lane++){if(lane===gap)continue;const x=a.x+46+lane*((a.w-92)/4),rule=lane%3===0?'orange':lane%3===1?'blue':'white',color=rule==='orange'?'#ff8a00':rule==='blue'?'#37dcff':'#fff';g.projectiles.push(new Projectile(x,a.y-20,this.mod*18,192*boost,8,color,'bone',rule));}this.step++;}
      } else if(this.name==='RING'){
        const rate=.84/boost;
        while(this.timer>rate){this.timer-=rate;const cx=a.x+a.w/2,cy=a.y+a.h/2,count=10;for(let i=0;i<count;i++){const ang=(i/count)*TAU+(this.step*.23),s=115*boost,rule=(i+this.step)%6===0?'blue':(i+this.step)%6===3?'orange':'white',color=rule==='blue'?'#37dcff':rule==='orange'?'#ff8a00':'#fff';g.projectiles.push(new Projectile(cx+Math.cos(ang)*18,cy+Math.sin(ang)*18,Math.cos(ang)*s+this.mod*12,Math.sin(ang)*s,6,color,'diamond',rule));}this.step++;}
      }
    }
  }

  class SoulDuel {
    constructor(){
      this.canvas=$('#gameCanvas');this.ctx=this.canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;
      this.input=new Input();this.audio=new AudioBank();this.particles=new ParticleSystem();this.pattern=new PatternEngine(this);
      this.settings=this.loadSettings();this.lang=this.settings.lang||'ja';
      this.state=State.TITLE;this.pausedFrom=null;this.stateToken=0;this.scheduled=[];this.acc=0;this.last=performance.now();this.visualTime=0;this.stateTime=0;
      this.round=1;this.turn=1;this.commandIndex=0;this.subIndex=0;this.submenuType=null;this.training=false;this.endWinner=0;
      this.arena={...CONFIG.arena};this.soul={x:480,y:292,vx:0,vy:0,color:'#ff2845'};this.projectiles=[];this.timingX=0;this.timingDir=1;this.timingScore=0;this.dodgeLeft=0;this.invuln=0;this.spawnRingFx=0;this.feintPending=false;
      this.typeTarget='';this.typeShown='';this.typeTimer=0;this.currentMessage='';
      this.players={1:this.makePlayer(1,'CRIMSON','#ff2845'),2:this.makePlayer(2,'AZURE','#37dcff')};
      this.commands=['fight','act','item','mercy'];
      this.installSubmenuSheet();this.bindUI();this.applySettings();this.applyLanguage();this.setDialogue(this.t('choose'));this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
    }

    t(key, vars={}){let out=(I18N[this.lang]&&I18N[this.lang][key])||I18N.en[key]||key;for(const [k,v] of Object.entries(vars))out=out.replaceAll(`{${k}}`,String(v));return out;}
    makePlayer(id,name,color){return{id,name,color,hp:CONFIG.maxHp,displayHp:CONFIG.maxHp,ghostHp:CONFIG.maxHp,resolve:0,mercy:0,items:{patch:2,tonic:1,ward:1},guard:0,focus:0,read:0,pressure:0,score:0};}
    loadSettings(){try{return Object.assign({lang:'ja',shake:true,scan:true,reduced:false,volume:.65,touchSize:1},JSON.parse(localStorage.getItem('soulDuelSettings')||'{}'));}catch(_){return{lang:'ja',shake:true,scan:true,reduced:false,volume:.65,touchSize:1};}}
    saveSettings(){try{localStorage.setItem('soulDuelSettings',JSON.stringify(this.settings));}catch(_){}}
    applySettings(){
      $('#shakeToggle').checked=!!this.settings.shake;$('#scanlineToggle').checked=!!this.settings.scan;$('#motionToggle').checked=!!this.settings.reduced;$('#volumeRange').value=Math.round(this.settings.volume*100);$('#touchSizeRange').value=Math.round(this.settings.touchSize*100);$('#languageSelect').value=this.lang;
      $('#scanlines').classList.toggle('off',!this.settings.scan);document.body.classList.toggle('reduce-motion',!!this.settings.reduced);document.documentElement.style.setProperty('--touch-scale',this.settings.touchSize);this.audio.volume=this.settings.volume;
    }
    applyLanguage(){
      if(!I18N[this.lang]){this.lang='ja';this.settings.lang='ja';this.saveSettings();}
      document.documentElement.lang=this.lang;
      const dict=I18N[this.lang];
      $$('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(dict[key])el.textContent=dict[key];});
      this.refreshSubmenu();this.updateHud();
      if(this.state===State.TITLE)this.setDialogue(this.t('choose'));
    }

    installSubmenuSheet(){
      const sheet=document.createElement('div');sheet.id='submenuSheet';sheet.className='submenu-sheet';sheet.setAttribute('aria-hidden','true');sheet.innerHTML='<div class="submenu-title"></div><div class="submenu-options"></div>';$('#stageCard').appendChild(sheet);
      const style=document.createElement('style');style.textContent=`
        .submenu-sheet{position:absolute;left:50%;bottom:16px;transform:translateX(-50%) translateY(12px);z-index:8;width:min(620px,88%);border:3px solid #fff;background:#040404;padding:12px;opacity:0;pointer-events:none;transition:opacity .12s,transform .12s}.submenu-sheet.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}.submenu-title{font-size:12px;color:#8e8e8e;margin-bottom:9px}.submenu-options{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.submenu-options button{min-height:44px;border:2px solid #555;background:#080808;color:#ddd;text-align:left;padding:8px 10px;cursor:pointer}.submenu-options button.selected{border-color:#ffe72e;color:#ffe72e}.submenu-options small{display:block;color:#666;margin-top:3px}@media(max-width:560px){.submenu-sheet{bottom:7px;padding:8px;width:94%;border-width:2px}.submenu-options{gap:4px}.submenu-options button{min-height:36px;padding:6px;font-size:11px}.submenu-title{font-size:10px;margin-bottom:5px}}`;
      document.head.appendChild(style);
    }

    bindUI(){
      $$('[data-action]').forEach(btn=>btn.addEventListener('click',()=>{this.audio.wake();const a=btn.dataset.action;if(a==='local')this.startBattle(false);else if(a==='training')this.startBattle(true);else if(a==='settings')this.openSettings();}));
      $('#closeSettings').addEventListener('click',()=>this.closeSettings());
      $('#settingsModal').addEventListener('pointerdown',e=>{if(e.target===$('#settingsModal'))this.closeSettings();});
      $('#resumeBtn').addEventListener('click',()=>this.resume());$('#quitBtn').addEventListener('click',()=>this.quitToTitle());$('#pauseBtn').addEventListener('click',()=>this.togglePause());
      $('#shakeToggle').addEventListener('change',e=>{this.settings.shake=e.target.checked;this.saveSettings();});
      $('#scanlineToggle').addEventListener('change',e=>{this.settings.scan=e.target.checked;$('#scanlines').classList.toggle('off',!e.target.checked);this.saveSettings();});
      $('#motionToggle').addEventListener('change',e=>{this.settings.reduced=e.target.checked;document.body.classList.toggle('reduce-motion',e.target.checked);this.saveSettings();});
      $('#volumeRange').addEventListener('input',e=>{this.settings.volume=+e.target.value/100;this.audio.volume=this.settings.volume;this.saveSettings();});
      $('#touchSizeRange').addEventListener('input',e=>{this.settings.touchSize=+e.target.value/100;document.documentElement.style.setProperty('--touch-scale',this.settings.touchSize);this.saveSettings();});
      $('#languageSelect').addEventListener('change',e=>{this.lang=e.target.value;this.settings.lang=this.lang;this.saveSettings();this.applyLanguage();});
      $$('.command').forEach((b,i)=>b.addEventListener('click',()=>{this.audio.wake();if(this.state===State.COMMAND){this.commandIndex=i;this.updateCommandUI();this.confirmCommand();}}));
      this.bindTouchControls();
      window.addEventListener('blur',()=>this.autoPause());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.autoPause();});
      window.addEventListener('orientationchange',()=>this.releaseTouch());window.addEventListener('resize',()=>this.releaseTouch());
      window.addEventListener('contextmenu',e=>{if(e.target.closest('.touch-zone,#gameCanvas'))e.preventDefault();});
    }

    bindTouchControls(){
      const stick=$('#moveStick'),knob=$('#stickKnob');let stickPointer=null;
      const updateStick=e=>{const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.34,len=Math.hypot(dx,dy)||1,n=Math.min(1,max/len),px=dx*n,py=dy*n;this.input.touch.x=clamp(dx/max,-1,1);this.input.touch.y=clamp(dy/max,-1,1);knob.style.transform=`translate(calc(-50% + ${px}px),calc(-50% + ${py}px))`;};
      stick.addEventListener('pointerdown',e=>{this.audio.wake();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);e.preventDefault();});
      stick.addEventListener('pointermove',e=>{if(e.pointerId===stickPointer)updateStick(e);});
      const endStick=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;this.input.touch.x=this.input.touch.y=0;knob.style.transform='translate(-50%,-50%)';};stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);stick.addEventListener('lostpointercapture',()=>{stickPointer=null;this.input.touch.x=this.input.touch.y=0;knob.style.transform='translate(-50%,-50%)';});
      this.bindTouchButton($('#touchConfirm'),'confirm');this.bindTouchButton($('#touchModL'),'modL');this.bindTouchButton($('#touchModR'),'modR');
    }
    bindTouchButton(el,key){
      const release=()=>{this.input.setTouchButton(key,false);el.classList.remove('pressed');};
      el.addEventListener('pointerdown',e=>{this.audio.wake();el.setPointerCapture(e.pointerId);this.input.setTouchButton(key,true);el.classList.add('pressed');e.preventDefault();});
      el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
    }
    releaseTouch(){this.input.touch.x=this.input.touch.y=0;this.input.setTouchButton('confirm',false);this.input.setTouchButton('modL',false);this.input.setTouchButton('modR',false);$('#stickKnob').style.transform='translate(-50%,-50%)';$$('.pressed').forEach(x=>x.classList.remove('pressed'));}

    openSettings(){this.audio.wake();$('#settingsModal').classList.add('show');$('#settingsModal').setAttribute('aria-hidden','false');}
    closeSettings(){$('#settingsModal').classList.remove('show');$('#settingsModal').setAttribute('aria-hidden','true');}
    switchScreen(id){$$('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');}

    resetBattle(){
      this.players={1:this.makePlayer(1,'CRIMSON','#ff2845'),2:this.makePlayer(2,'AZURE','#37dcff')};this.round=1;this.turn=1;this.commandIndex=0;this.subIndex=0;this.submenuType=null;this.endWinner=0;this.arena={...CONFIG.arena};this.projectiles=[];this.particles.items=[];this.scheduled=[];this.stateToken++;this.timingScore=0;this.invuln=0;this.feintPending=false;this.releaseTouch();
    }
    startBattle(training=false){this.closeSettings();this.training=training;this.resetBattle();this.switchScreen('#battleScreen');this.enter(State.INTRO);this.setDialogue(training?this.t('trainingIntro'):this.t('intro'));this.banner(training?this.t('wave',{n:1}):this.t('round',{n:1}));this.schedule(.8,()=>this.enter(State.COMMAND));}
    quitToTitle(){this.releaseTouch();this.hideSubmenu();this.scheduled=[];this.projectiles=[];this.state=State.TITLE;this.switchScreen('#titleScreen');$('#pauseLayer').classList.remove('show');this.pausedFrom=null;this.setDialogue(this.t('choose'));}

    controlsFor(id){return id===1?{left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',confirm:'KeyF',modL:'KeyQ',modR:'KeyE'}:{left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',confirm:'Enter',modL:'Comma',modR:'Period'};}
    active(){return this.players[this.turn];} defender(){return this.players[this.turn===1?2:1];}
    enter(state){this.state=state;this.stateTime=0;this.stateToken++;this.scheduled=[];if(state!==State.SUBMENU)this.hideSubmenu();if(state===State.COMMAND){this.commandIndex=0;this.updateCommandUI();this.setDialogue(this.t('choose'));}if(state===State.TIMING){this.timingX=0;this.timingDir=1;this.setDialogue(this.t('fightReady'));}if(state===State.DODGE)this.beginDodge();if(state===State.RESOLVE)this.schedule(.34,()=>this.resolveTurn());this.updateHud();}
    schedule(seconds,fn){this.scheduled.push({left:seconds,fn,token:this.stateToken});}
    runScheduler(dt){for(const job of this.scheduled)job.left-=dt;const ready=this.scheduled.filter(j=>j.left<=0&&j.token===this.stateToken);this.scheduled=this.scheduled.filter(j=>j.left>0&&j.token===this.stateToken);for(const job of ready)job.fn();}

    autoPause(){if(this.state!==State.TITLE&&this.state!==State.END&&this.state!==State.PAUSED)this.pause();}
    togglePause(){if(this.state===State.PAUSED)this.resume();else if(this.state!==State.TITLE)this.pause();}
    pause(){if(this.state===State.PAUSED||this.state===State.TITLE)return;this.pausedFrom=this.state;this.state=State.PAUSED;this.input.clearAll();this.releaseTouch();$('#pauseLayer').classList.add('show');$('#pauseLayer').setAttribute('aria-hidden','false');this.updateHud();}
    resume(){if(this.state!==State.PAUSED)return;this.state=this.pausedFrom||State.COMMAND;this.pausedFrom=null;this.last=performance.now();this.acc=0;$('#pauseLayer').classList.remove('show');$('#pauseLayer').setAttribute('aria-hidden','true');this.updateHud();}

    update(dt){
      if(this.state===State.PAUSED){this.input.clearFrame();return;}
      this.stateTime+=dt;this.visualTime+=dt;this.runScheduler(dt);this.particles.update(dt);if(this.invuln>0)this.invuln-=dt;if(this.spawnRingFx>0)this.spawnRingFx-=dt;
      for(const id of [1,2]){const p=this.players[id];p.displayHp=lerp(p.displayHp,p.hp,1-Math.pow(.001,dt));p.ghostHp=lerp(p.ghostHp,p.hp,1-Math.pow(.08,dt));}
      this.updateTyping(dt);
      if(this.input.tap('Escape'))this.togglePause();
      if(this.state===State.COMMAND)this.updateCommand();else if(this.state===State.SUBMENU)this.updateSubmenuKeyboard();else if(this.state===State.TIMING)this.updateTiming(dt);else if(this.state===State.DODGE)this.updateDodge(dt);else if(this.state===State.END)this.updateEnd();
      this.updateHud();this.input.clearFrame();
    }

    setDialogue(text){this.currentMessage=text;this.typeTarget=text;this.typeShown='';this.typeTimer=0;$('#dialogueText').textContent='';}
    updateTyping(dt){if(this.typeShown.length>=this.typeTarget.length)return;this.typeTimer+=dt;const interval=this.settings.reduced?.006:.018;while(this.typeTimer>=interval&&this.typeShown.length<this.typeTarget.length){this.typeTimer-=interval;this.typeShown=this.typeTarget.slice(0,this.typeShown.length+1);$('#dialogueText').textContent=this.typeShown;if(this.typeShown.length%3===0)this.audio.tick();}}
    banner(text){const el=$('#roundBanner');el.querySelector('span').textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}

    updateCommand(){
      const c=this.controlsFor(this.turn);let moved=0;if(this.input.tap(c.left))moved=-1;if(this.input.tap(c.right))moved=1;if(moved){this.commandIndex=(this.commandIndex+moved+4)%4;this.audio.move();this.updateCommandUI();}
      if(this.input.tap(c.confirm)||this.input.touchTap('confirm'))this.confirmCommand();
    }
    updateCommandUI(){$$('.command').forEach((b,i)=>b.classList.toggle('selected',i===this.commandIndex));}
    confirmCommand(){this.audio.confirm();const cmd=this.commands[this.commandIndex];if(cmd==='fight')this.enter(State.TIMING);else{this.timingScore=.45;this.openSubmenu(cmd);}}

    submenuEntries(type){
      if(type==='act')return[{id:'read',label:this.t('read')},{id:'focus',label:this.t('focus')},{id:'pressure',label:this.t('pressure')},{id:'feint',label:this.t('feint')},{id:'back',label:this.t('back')}];
      if(type==='item'){const p=this.active();return[{id:'patch',label:`${this.t('patch')} ×${p.items.patch}`},{id:'tonic',label:`${this.t('tonic')} ×${p.items.tonic}`},{id:'ward',label:`${this.t('ward')} ×${p.items.ward}`},{id:'back',label:this.t('back')}];}
      return[{id:'spare',label:this.t('spare')},{id:'truce',label:this.t('truce')},{id:'back',label:this.t('back')}];
    }
    openSubmenu(type){this.state=State.SUBMENU;this.stateTime=0;this.stateToken++;this.scheduled=[];this.submenuType=type;this.subIndex=0;this.refreshSubmenu();const titleKey=type==='act'?'submenuAct':type==='item'?'submenuItem':'submenuMercy';this.setDialogue(this.t(titleKey));}
    refreshSubmenu(){if(!$('#submenuSheet'))return;const sheet=$('#submenuSheet'),entries=this.submenuType?this.submenuEntries(this.submenuType):[];$('.submenu-title',sheet).textContent=this.submenuType?this.t(this.submenuType==='act'?'submenuAct':this.submenuType==='item'?'submenuItem':'submenuMercy'):'';const box=$('.submenu-options',sheet);box.innerHTML='';entries.forEach((e,i)=>{const b=document.createElement('button');b.type='button';b.dataset.sub=i;b.textContent=e.label;b.classList.toggle('selected',i===this.subIndex);b.addEventListener('click',()=>{this.subIndex=i;this.chooseSubmenu();});box.appendChild(b);});if(this.state===State.SUBMENU){sheet.classList.add('show');sheet.setAttribute('aria-hidden','false');}}
    hideSubmenu(){const s=$('#submenuSheet');if(s){s.classList.remove('show');s.setAttribute('aria-hidden','true');}}
    updateSubmenuKeyboard(){
      const c=this.controlsFor(this.turn),entries=this.submenuEntries(this.submenuType);let moved=0;if(this.input.tap(c.up)||this.input.tap(c.left))moved=-1;if(this.input.tap(c.down)||this.input.tap(c.right))moved=1;if(moved){this.subIndex=(this.subIndex+moved+entries.length)%entries.length;this.audio.move();this.refreshSubmenu();}
      if(this.input.tap(c.confirm)||this.input.touchTap('confirm'))this.chooseSubmenu();
    }
    chooseSubmenu(){
      const entry=this.submenuEntries(this.submenuType)[this.subIndex];if(!entry)return;if(entry.id==='back'){this.enter(State.COMMAND);return;}this.audio.confirm();
      if(this.submenuType==='act')this.resolveAct(entry.id);else if(this.submenuType==='item')this.resolveItem(entry.id);else this.resolveMercy(entry.id);
    }
    resolveAct(id){const a=this.active(),d=this.defender();if(id==='read'){a.read=2;this.setDialogue(this.t('actRead'));}if(id==='focus'){a.resolve=clamp(a.resolve+24,0,100);a.focus=2;this.setDialogue(this.t('actFocus'));}if(id==='pressure'){d.pressure=2;this.setDialogue(this.t('actPressure'));}if(id==='feint'){this.feintPending=true;this.setDialogue(this.t('actFeint'));}this.hideSubmenu();this.state=State.RESOLVE;this.stateTime=0;this.stateToken++;this.scheduled=[];this.schedule(.62,()=>this.enter(State.DODGE));}
    resolveItem(id){const a=this.active();if(a.items[id]<=0){this.setDialogue(this.t('itemEmpty'));this.audio.miss();this.refreshSubmenu();return;}a.items[id]--;if(id==='patch'){a.hp=clamp(a.hp+18,0,CONFIG.maxHp);this.setDialogue(this.t('itemPatch'));}if(id==='tonic'){a.resolve=clamp(a.resolve+24,0,100);this.setDialogue(this.t('itemTonic'));}if(id==='ward'){a.guard+=2;this.setDialogue(this.t('itemWard'));}this.hideSubmenu();this.state=State.RESOLVE;this.stateTime=0;this.stateToken++;this.scheduled=[];this.schedule(.55,()=>this.enter(State.DODGE));}
    resolveMercy(id){const a=this.active(),d=this.defender();if(id==='spare'){if(d.mercy>=100){this.endWinner=a.id;this.setDialogue(this.t('mercySpare'));this.hideSubmenu();this.enter(State.END);this.audio.win();return;}this.setDialogue(this.t('mercyNotReady'));this.audio.miss();this.refreshSubmenu();return;}a.mercy=clamp(a.mercy+8,0,100);d.mercy=clamp(d.mercy+22,0,100);this.setDialogue(this.t('mercyTruce'));this.hideSubmenu();this.state=State.RESOLVE;this.stateTime=0;this.stateToken++;this.scheduled=[];this.schedule(.65,()=>this.enter(State.DODGE));}

    updateTiming(dt){
      const speed=this.feintPending?1.65+Math.sin(this.visualTime*7)*.32:1.45;this.timingX+=this.timingDir*dt*speed;if(this.timingX>=1){this.timingX=1;this.timingDir=-1;}if(this.timingX<=0){this.timingX=0;this.timingDir=1;}
      const c=this.controlsFor(this.turn);if(this.input.tap(c.confirm)||this.input.touchTap('confirm')){this.timingScore=1-Math.abs(this.timingX-.5)*2;this.timingScore=clamp(this.timingScore,0,1);this.active().resolve=clamp(this.active().resolve+Math.round(this.timingScore*18),0,100);this.setDialogue(this.t(this.timingScore>.88?'perfect':this.timingScore>.56?'good':'weak'));this.audio.confirm();this.feintPending=false;this.schedule(.45,()=>{if(this.state===State.TIMING)this.enter(State.DODGE);});}
    }

    beginDodge(){
      const d=this.defender();this.dodgeLeft=CONFIG.dodgeDuration+(this.timingScore>.88?.65:0);const shrink=d.pressure>0?34:0;this.arena={x:CONFIG.arena.x+shrink,y:CONFIG.arena.y+shrink*.42,w:CONFIG.arena.w-shrink*2,h:CONFIG.arena.h-shrink*.84};this.soul.x=this.arena.x+this.arena.w/2;this.soul.y=this.arena.y+this.arena.h/2;this.soul.vx=this.soul.vy=0;this.soul.color=d.color;const seed=((this.round*73856093)^(this.turn*19349663)^Math.floor(this.timingScore*1000))>>>0;const names=['CROSSFIRE','ORBIT','LANES','RING'];this.pattern.reset(seed,names[(this.round+this.turn)%names.length]);this.setDialogue(this.t('dodge',{def:d.id,atk:this.turn}));this.updateTouchLabels();
    }
    updateDodge(dt){
      const d=this.defender(),dc=this.controlsFor(d.id),ac=this.controlsFor(this.turn);this.dodgeLeft-=dt;const accel=850,max=235,drag=Math.pow(.0009,dt);let ix=this.input.touch.x,iy=this.input.touch.y;if(this.input.has(dc.left))ix-=1;if(this.input.has(dc.right))ix+=1;if(this.input.has(dc.up))iy-=1;if(this.input.has(dc.down))iy+=1;const mag=Math.hypot(ix,iy);if(mag>1){ix/=mag;iy/=mag;}this.soul.vx+=ix*accel*dt;this.soul.vy+=iy*accel*dt;this.soul.vx*=drag;this.soul.vy*=drag;const sp=Math.hypot(this.soul.vx,this.soul.vy);if(sp>max){this.soul.vx=this.soul.vx/sp*max;this.soul.vy=this.soul.vy/sp*max;}this.soul.x+=this.soul.vx*dt;this.soul.y+=this.soul.vy*dt;const r=CONFIG.soulRadius;this.soul.x=clamp(this.soul.x,this.arena.x+r,this.arena.x+this.arena.w-r);this.soul.y=clamp(this.soul.y,this.arena.y+r,this.arena.y+this.arena.h-r);
      if(this.input.tap(ac.modL)||this.input.touchTap('modL')){this.pattern.pulse(-1);this.audio.move();}if(this.input.tap(ac.modR)||this.input.touchTap('modR')){this.pattern.pulse(1);this.audio.move();}
      this.pattern.update(dt);for(const p of this.projectiles)p.update(dt);this.projectiles=this.projectiles.filter(p=>!p.dead&&p.x>this.arena.x-100&&p.x<this.arena.x+this.arena.w+100&&p.y>this.arena.y-100&&p.y<this.arena.y+this.arena.h+100);
      if(this.invuln<=0){for(const p of this.projectiles){const dx=p.x-this.soul.x,dy=p.y-this.soul.y,rr=p.r+r*.72;if(dx*dx+dy*dy<rr*rr){const moving=Math.hypot(this.soul.vx,this.soul.vy)>35;const harmful=p.rule==='white'||(p.rule==='blue'&&moving)||(p.rule==='orange'&&!moving);p.dead=true;if(harmful){this.damageDefender(7+Math.round(this.timingScore*5));break;}else{this.particles.burst(p.x,p.y,p.color,5,48);this.audio.miss();}}}}
      if(d.hp<=0){this.endWinner=this.turn;this.setDialogue(this.t('winnerKo',{p:this.turn}));this.enter(State.END);this.audio.win();return;}if(this.dodgeLeft<=0)this.enter(State.RESOLVE);
    }
    damageDefender(amount){const d=this.defender();if(d.guard>0){amount=Math.ceil(amount*.48);d.guard--;}d.hp=clamp(d.hp-amount,0,CONFIG.maxHp);d.resolve=clamp(d.resolve+9,0,100);d.mercy=clamp(d.mercy+11,0,100);this.invuln=.42;this.particles.burst(this.soul.x,this.soul.y,d.color,18,145);this.audio.hit();this.flashImpact();}
    flashImpact(){const f=$('#impactFlash');f.classList.remove('hit');void f.offsetWidth;f.classList.add('hit');if(this.settings.shake&&!this.settings.reduced){const s=$('#stageCard');s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake');}}
    resolveTurn(){const a=this.active(),d=this.defender();a.score+=Math.round(this.timingScore*100)+(d.hp>0?10:0);if(a.focus>0)a.focus--;if(a.read>0)a.read--;if(d.pressure>0)d.pressure--;this.projectiles=[];this.arena={...CONFIG.arena};if(this.training){this.round++;this.turn=1;this.banner(this.t('wave',{n:this.round}));this.enter(State.COMMAND);}else{this.turn=this.turn===1?2:1;if(this.turn===1)this.round++;this.banner(this.turn===1?this.t('round',{n:this.round}):this.t('turn',{p:this.turn}));this.enter(State.COMMAND);}this.updateTouchLabels();}
    updateEnd(){const c1=this.controlsFor(1),c2=this.controlsFor(2);if(this.input.tap(c1.confirm)||this.input.tap(c2.confirm)||this.input.touchTap('confirm'))this.startBattle(this.training);}

    updateTouchLabels(){const def=this.defender()?.id||2;$('#defenderTouchLabel').textContent=this.t('touchDefend',{p:def});$('#attackerTouchLabel').textContent=this.t('touchAttack',{p:this.turn});}
    updateHud(){
      for(const id of [1,2]){const p=this.players[id];$(`#p${id}HpFill`).style.width=`${p.displayHp/CONFIG.maxHp*100}%`;$(`#p${id}HpGhost`).style.width=`${p.ghostHp/CONFIG.maxHp*100}%`;$(`#p${id}HpText`).textContent=`${Math.round(p.displayHp)}/${CONFIG.maxHp}`;$(`#p${id}ResolveFill`).style.width=`${p.resolve}%`;$(`#p${id}ResolveText`).textContent=`${Math.round(p.resolve)}%`;$(`#p${id}MercyFill`).style.width=`${p.mercy}%`;$(`#p${id}MercyText`).textContent=`${Math.round(p.mercy)}%`;const chip=$(`.p${id}-card .state-chip`);chip.textContent=this.state===State.DODGE?(id===this.defender().id?this.t('dodging'):this.t('attacking')):(this.turn===id?this.t('active'):this.t('ready'));$(`.p${id}-card`).classList.toggle('active-turn',this.turn===id&&![State.END,State.TITLE].includes(this.state));}
      $('#roundLabel').textContent=this.t('round',{n:this.round});$('#turnLabel').textContent=this.state===State.END?this.t('winner',{p:this.endWinner}):this.t('turn',{p:this.turn});$('#phaseHint').textContent=this.state===State.DODGE?`${Math.max(0,this.dodgeLeft).toFixed(1)}s`:this.state===State.TIMING?this.t('phaseTiming'):this.state===State.COMMAND?this.t('phaseChoose'):this.state===State.PAUSED?this.t('phasePaused'):'';this.updateTouchLabels();
    }

    draw(){const c=this.ctx;c.fillStyle='#000';c.fillRect(0,0,CONFIG.width,CONFIG.height);this.drawBackdrop(c);this.drawFighters(c);this.drawArena(c);if(this.state===State.TIMING)this.drawTiming(c);if(this.state===State.END)this.drawEnd(c);this.particles.draw(c);}
    drawBackdrop(c){
      c.save();c.globalAlpha=.22;c.strokeStyle='#181818';c.lineWidth=1;const horizon=122;for(let x=-260;x<1220;x+=80){c.beginPath();c.moveTo(480,horizon);c.lineTo(x,540);c.stroke();}for(let y=horizon;y<540;y+=45){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}c.restore();
      c.save();c.globalAlpha=.13;c.fillStyle='#fff';for(let i=0;i<36;i++){const x=(i*83+(this.visualTime*9)%960)%960,y=28+(i*47)%100;c.fillRect(x,y,1,1);}c.restore();
    }
    drawFighters(c){const bob=Math.sin(this.visualTime*2.5)*3;this.drawAvatar(c,235,112+bob,this.players[1],false);this.drawAvatar(c,725,112-bob,this.players[2],true);c.save();c.textAlign='center';c.font='700 15px monospace';c.fillStyle=this.turn===1?'#ff2845':'#555';c.fillText('CRIMSON',235,42);c.fillStyle=this.turn===2?'#37dcff':'#555';c.fillText('AZURE',725,42);c.restore();}
    drawAvatar(c,x,y,p,mirror){c.save();c.translate(x,y);if(mirror)c.scale(-1,1);const pulse=1+Math.sin(this.visualTime*3+p.id)*.025;c.scale(pulse,pulse);c.shadowBlur=20;c.shadowColor=p.color;c.strokeStyle='#f8f8f8';c.lineWidth=4;c.fillStyle='#050505';c.beginPath();c.arc(0,-36,22,0,TAU);c.fill();c.stroke();c.beginPath();c.moveTo(-25,-15);c.lineTo(-39,31);c.lineTo(-13,52);c.lineTo(0,31);c.lineTo(13,52);c.lineTo(39,31);c.lineTo(25,-15);c.closePath();c.fill();c.stroke();c.shadowBlur=0;c.fillStyle=p.color;c.fillRect(-7,-42,5,5);c.fillRect(7,-42,5,5);c.strokeStyle=p.color;c.lineWidth=3;c.beginPath();c.moveTo(-10,-25);c.lineTo(0,-19);c.lineTo(10,-25);c.stroke();c.restore();}
    drawArena(c){const a=this.arena;c.save();c.strokeStyle='#fff';c.lineWidth=4;c.strokeRect(Math.round(a.x),Math.round(a.y),Math.round(a.w),Math.round(a.h));if(this.spawnRingFx>0){c.globalAlpha=this.spawnRingFx/.22;c.strokeStyle=this.active().color;c.lineWidth=2;c.strokeRect(a.x-8,a.y-8,a.w+16,a.h+16);}if(this.state===State.DODGE){for(const p of this.projectiles)p.draw(c);this.drawSoul(c,this.soul.x,this.soul.y,this.soul.color);if(this.active().read>0){c.globalAlpha=.22;c.strokeStyle=this.active().color;for(const p of this.projectiles){c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+p.vx*.28,p.y+p.vy*.28);c.stroke();}}}else this.drawCenterSigil(c,a.x+a.w/2,a.y+a.h/2);c.restore();}
    drawCenterSigil(c,x,y){c.save();c.translate(x,y);c.rotate(this.visualTime*.12);c.strokeStyle='#1e1e1e';c.lineWidth=2;for(let i=0;i<3;i++){c.rotate(Math.PI/3);c.strokeRect(-30-i*10,-30-i*10,60+i*20,60+i*20);}c.rotate(-this.visualTime*.12);c.fillStyle='#3b3b3b';c.font='14px monospace';c.textAlign='center';c.fillText(this.state===State.COMMAND?'CHOOSE':this.state===State.SUBMENU?'SELECT':this.state===State.INTRO?'SYNC':'READY',0,5);c.restore();}
    drawSoul(c,x,y,color){c.save();c.translate(Math.round(x),Math.round(y));const s=1+Math.sin(this.visualTime*8)*.04;c.scale(s,s);c.globalAlpha=this.invuln>0&&Math.floor(this.visualTime*20)%2===0?.34:1;c.fillStyle=color;c.shadowBlur=14;c.shadowColor=color;c.beginPath();c.moveTo(0,11);c.bezierCurveTo(-4,5,-14,-2,-14,-9);c.bezierCurveTo(-14,-17,-4,-19,0,-12);c.bezierCurveTo(4,-19,14,-17,14,-9);c.bezierCurveTo(14,-2,4,5,0,11);c.fill();c.restore();}
    drawTiming(c){const a=this.arena,x=a.x+36,y=a.y+a.h/2-24,w=a.w-72,h=48;c.save();c.fillStyle='#070707';c.fillRect(x,y,w,h);c.strokeStyle='#fff';c.lineWidth=3;c.strokeRect(x,y,w,h);const grad=c.createLinearGradient(x,0,x+w,0);grad.addColorStop(0,'#711500');grad.addColorStop(.36,'#ff7b13');grad.addColorStop(.48,'#ffe72e');grad.addColorStop(.5,'#fff');grad.addColorStop(.52,'#ffe72e');grad.addColorStop(.64,'#ff7b13');grad.addColorStop(1,'#711500');c.fillStyle=grad;c.fillRect(x+8,y+12,w-16,h-24);const mx=x+this.timingX*w;c.fillStyle='#ff2845';c.fillRect(mx-3,y-10,6,h+20);c.fillStyle='#fff';c.font='12px monospace';c.textAlign='center';c.fillText(this.lang==='ja'?'中央ほど強い':'CENTER = STRONGER',a.x+a.w/2,y-20);c.restore();}
    drawEnd(c){c.save();c.fillStyle='rgba(0,0,0,.62)';c.fillRect(0,0,960,540);c.textAlign='center';c.font='40px "Press Start 2P",monospace';c.fillStyle=this.players[this.endWinner]?.color||'#fff';c.fillText(this.t('winner',{p:this.endWinner}),480,248);c.font='18px monospace';c.fillStyle='#fff';c.fillText(this.t('rematch'),480,294);c.restore();}

    loop(now){let frame=(now-this.last)/1000;this.last=now;frame=Math.min(Math.max(0,frame),CONFIG.maxFrame);if(this.state!==State.PAUSED){this.acc+=frame;let guard=0;while(this.acc>=CONFIG.fixedDt&&guard<8){this.update(CONFIG.fixedDt);this.acc-=CONFIG.fixedDt;guard++;}if(guard>=8)this.acc=0;}this.draw();requestAnimationFrame(this.loop);}
  }

  window.SOUL_DUEL = new SoulDuel();
})();