// 金华三大景点 × 真实婺绣风格 → 12 张去 AI 味的文物实拍
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// 极端负面约束：把所有 AI 味压掉，只保留真实老绣片质感
const ANTI_AI = '【禁忌】绝对禁止卡通风、禁止二次元、禁止插画感、禁止3D渲染、禁止霓虹光效、禁止鲜艳塑料感、禁止均匀点阵针阵、禁止程序化DIY针脚、禁止十字绣网格、禁止机器绣制打版稿效果、禁止把纹样拆成标准化绣制单元、禁止任何现代设计元素。';
const REAL_EMB = '必须像博物馆里实拍的婺绣老绣片照片：布料基底有真实经纬纹理、丝线是多股叠压有细微色差、针脚方向有手工痕迹不完全规整、整体色调古旧有岁月感、光线是博物馆展台的冷白光不发黄、画面干净无杂乱背景。';

const SPOTS = [
  {
    tag:'zg', name:'诸葛八卦村',
    // 诸葛八卦村真实特征：白墙黛瓦马头墙、钟池太极图、徽派
    scene:'兰溪诸葛八卦村，鸟瞰视角，村落呈八卦太极图布局，中央钟池是太极阴阳鱼，四周小巷放射状排列，白墙黛瓦马头墙，典型徽派古村落，有800年历史',
    elems:'太极阴阳鱼、白墙黛瓦、马头墙、钟池、八卦符号、石板小巷',
  },
  {
    tag:'dy', name:'东阳木雕',
    scene:'东阳木雕特写，镂空雕花的牛腿和雀替，樟木材质，深浮雕和镂空雕结合，题材是三国故事和花鸟，传统建筑装饰构件',
    elems:'牛腿木雕、雀替、镂空雕花、樟木深浮雕、三国人物、花鸟纹样',
  },
  {
    tag:'ft', name:'佛堂古镇',
    scene:'义乌佛堂古镇，古街马头墙林立，古码头倒影在义乌江上，有双林铁塔、云黄山寺、老街的木店招牌和红灯笼，千年古镇风貌',
    elems:'马头墙、古码头、义乌江倒影、双林铁塔、红灯笼、木招牌',
  },
];

// 每景点 4 张：input(实景参考) → draft(AI初稿) → style(风格对比) → final(成品)
const ALL = [];
for (const s of SPOTS) {
  ALL.push({ k:s.tag+'-ref', p:`【真实照片】${s.scene}，手机实拍旅游照片，非AI，自然光，中等画质，有游客在背景里，不是完美构图。` });
  ALL.push({ k:s.tag+'-draft', p:`${ANTI_AI}${REAL_EMB}婺绣老绣片，主题：${s.name}。核心元素：${s.elems}。构图：${s.scene}。色调：暗红土黄墨绿藏青的古旧自然褪色。像博物馆里拍的真实婺绣文物，有布料纹理和丝线多股叠压。` });
  ALL.push({ k:s.tag+'-4style', p:`四宫格婺绣风格对比，主题都是${s.name}，从左上到右下分别是：①传统文物风格（暗红土黄古旧色）②水墨写意（黑白灰大面积留白）③金线描边（深黑底金色轮廓）④卡通Q版马卡龙色。四个都是婺绣质感不是插画，并排展示。${ANTI_AI}` });
  ALL.push({ k:s.tag+'-final', p:`${ANTI_AI}${REAL_EMB}最终${s.name}婺绣成品。核心元素：${s.elems}。构图完整对称，针脚细密但有手工痕迹不完全规整，丝线多股叠压有细微色差，布料基底有真实经纬纹理，整体古旧有岁月感，色调暗红土黄墨绿藏青，像刚从博物馆展柜拿出来的老绣片实拍照片。` });
}

function hunyuanText(prompt, outPath) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({
      model:'hy-image-v3.5-preview',
      messages:[{ role:'user', content:[{ type:'text', text:prompt }] }],
      strength:0.95, guidance_scale:9.0
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
    await new Promise(r=>setTimeout(r,2000));
  }
  console.log('\n=== 金华三大景点 × 4步 全部生成完毕 ===');
})();
