// 金华三大景点 AI 纹样生成 → 直接出图（混元文生图）
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const STYLE = '婺绣刺绣纹样风格，博物馆文物实拍质感，针脚细密，丝线纹理清晰，写实摄影效果，像真正的传统刺绣照片。禁止卡通、禁止插画、禁止二次元。';

// 金华三大景点 × 各 5 步 = 15 张
const ALL = [
  // ===== 双龙洞（A类建筑）=====
  { k:'sl0-input',   p:'金华双龙洞景点实拍：两个相连的天然石灰岩溶洞入口，洞口上方有"双龙洞"石刻匾额，周围青山环绕松柏茂密，洞外有清澈小溪。' },
  { k:'sl1-concept', p:'AI纹样生成概念图，左侧是用户输入"金华双龙洞"文字卡片，右侧是AI自动分类标签"A类·建筑景观"，下方是联网考据要点（①地处金华北山②海拔520米③徐霞客游记记载），整体是现代科技卡片风格叠在双龙洞实景底图上。' },
  { k:'sl2-ai',      p:STYLE+'主题：金华双龙洞。构图：中央绣两个龙头（代表双龙），下方溶洞洞口造型，周围青山松柏环绕。风格：传统文物风格，暗红土黄古旧色调，像博物馆老绣片。' },
  { k:'sl3-4style',  p:'四宫格对比：左上=卡通Q版双龙洞（圆润马卡龙色）、右上=传统文物风格（古旧暗红土黄）、左下=水墨写意（黑白灰留白）、右下=金线描边（深黑底金色轮廓）。四个格子并排展示四种风格的双龙洞婺绣。' },
  { k:'sl4-final',   p:STYLE+'最终金华双龙洞婺绣成品：中央双龙龙头栩栩如生，下方溶洞洞口造型，周围青山松柏，传统文物风格古旧色调，针脚细密逼真，左右对称构图，博物馆级实拍效果。' },

  // ===== 诸葛八卦村（A类建筑）=====
  { k:'zg0-input',   p:'兰溪诸葛八卦村景点实拍：古村落从空中俯瞰是八卦太极图布局，白墙黛瓦马头墙，村中心是钟池太极图，四周小巷放射状排列。' },
  { k:'zg1-ai',      p:STYLE+'主题：兰溪诸葛八卦村。构图：鸟瞰视角的八卦太极图村落，中央钟池阴阳鱼，周围白墙黛瓦马头墙放射排列。风格：传统文物风格。' },
  { k:'zg2-detail',  p:STYLE+'金华诸葛八卦村局部特写：白墙黛瓦马头墙特写，墙面有水墨画装饰，木窗格精致，黑瓦翘檐，门口有石鼓和红灯笼，典型徽派建筑元素。' },
  { k:'zg3-taiji',   p:STYLE+'金华诸葛八卦村核心纹样：钟池太极图特写，阴阳鱼清晰，周围环绕八卦乾坎艮震巽离坤兑八个卦符号，整体圆形构图，传统道教文化风格，古旧色调。' },

  // ===== 金华佛手（B类农产品）=====
  { k:'fs0-input',   p:'金华佛手柑（佛手）实物特写：黄色成熟佛手果，形状像张开的手指，表面有油亮光泽，放在木质托盘上，旁边有绿叶和花朵。' },
  { k:'fs1-concept', p:'AI纹样生成概念图，左侧是用户输入"金华佛手"，右侧是分类标签"B类·农产品"，下方是联网考据要点（①金华特产②又名九爪木③每年10-11月成熟④可入药可观赏），卡片风格叠在佛手底图上。' },
  { k:'fs2-ai',      p:STYLE+'主题：金华佛手。构图：左右对称，两只佛手柑居中，周围点缀绿叶、小花和祥云纹，底部有山石。风格：传统文物风格，金黄/墨绿/赭石色调。' },
  { k:'fs3-detail',  p:STYLE+'金华佛手婺绣细节特写：佛手果的"手指"尖端精细刺绣，每根手指用不同深浅的金黄色丝线表现立体感，油亮光泽感，周围搭配绿叶脉络清晰可见。' },
  { k:'fs4-final',   p:STYLE+'最终金华佛手婺绣成品：对称构图两只金黄佛手居中，周围绿叶小花祥云点缀，底部山石，传统文物古旧色调，针脚细密逼真，博物馆级实拍。' },
];

function hunyuanText(prompt, outPath, strength) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({
      model: 'hy-image-v3.5-preview',
      messages: [{ role:'user', content:[{ type:'text', text:prompt }] }],
      strength: strength || 0.92, guidance_scale: 8.5
    });
    const req = https.request({
      hostname:'tokenhub.tencentmaas.com', path:'/v1/wand/hunyuan-image/v35-generation',
      method:'POST', headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+API_KEY,'Content-Length':Buffer.byteLength(post) },
      timeout:180000
    }, res => {
      let txt=''; res.on('data',d=>txt+=d.toString()); res.on('end',()=>{
        try { const d=JSON.parse(txt); const url=d?.choices?.[0]?.delta?.image?.url;
          if(!url){reject(new Error('无图:'+txt.substring(0,200)));return;}
          download(url,outPath).then(resolve).catch(reject);
        } catch(e){reject(new Error('解析:'+txt.substring(0,100)));}
      });
    });
    req.on('error',reject); req.on('timeout',()=>req.destroy(new Error('超时')));
    req.write(post); req.end();
  });
}
function download(url,out){return new Promise((res,rej)=>{
  https.get(url,r=>{if(r.statusCode>=300&&r.statusCode<400){download(r.headers.location,out).then(res).catch(rej);return;}
    const f=fs.createWriteStream(out); r.pipe(f); f.on('finish',()=>f.close(()=>{console.log('  ✓',path.basename(out),'-',(fs.statSync(out).size/1024).toFixed(0)+'KB');res();}));
  }).on('error',rej);
});}

(async()=>{
  for(let i=0;i<ALL.length;i++){
    const s=ALL[i]; const out=path.join(OUT, s.k+'.jpg');
    if(fs.existsSync(out)&&fs.statSync(out).size>50000){console.log('  ⏭',s.k);continue;}
    console.log(`\n[${i+1}/${ALL.length}] ${s.k}`);
    try{await hunyuanText(s.p,out);}catch(e){console.error('  ✗',e.message);}
    await new Promise(r=>setTimeout(r,1500));
  }
  console.log('\n=== 金华景点 AI 纹样生成全部完成 ===');
})();
