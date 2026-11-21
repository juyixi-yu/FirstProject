// 单景点诸葛八卦村 4 张 + 压缩
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';
const ANTI_AI = '禁止卡通风/二次元/插画感/3D渲染/霓虹光效/均匀点阵/十字绣网格/程序化针脚。必须像博物馆实拍老绣片。';
const REAL = '真实婺绣老绣片：布料经纬纹理、丝线多股叠压有细微色差、针脚有手工痕迹不完全规整、古旧岁月感、博物馆冷白光、画面干净。';

const STEPS = [
  { k:'zg-ref',    p:'真实手机旅游照片：兰溪诸葛八卦村鸟瞰，村落呈八卦太极图布局，中央钟池太极阴阳鱼，白墙黛瓦马头墙，中等画质非完美构图，背景有零星游客。' },
  { k:'zg-draft',   p:`${ANTI_AI}${REAL}婺绣老绣片，主题：诸葛八卦村。核心元素：太极阴阳鱼、白墙黛瓦、马头墙、八卦符号。色调：暗红土黄墨绿藏青古旧自然褪色。博物馆实拍质感。` },
  { k:'zg-final',   p:`${ANTI_AI}${REAL}最终诸葛八卦村婺绣成品。构图完整对称，太极阴阳鱼居中，周围八卦符号和马头墙环绕，针脚细密但有手工痕迹，古旧色调，博物馆展柜里的实拍照片。` },
];

function hunyuanText(prompt, outPath) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({
      model:'hy-image-v3.5-preview',
      messages:[{ role:'user', content:[{ type:'text', text:prompt }] }],
      strength:0.93, guidance_scale:9.0
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
    const f=fs.createWriteStream(out); r.pipe(f); f.on('finish',()=>f.close(()=>res()));
  }).on('error',rej);
});}

(async()=>{
  for(let i=0;i<STEPS.length;i++){
    const s=STEPS[i]; const out=path.join(OUT, s.k+'.jpg');
    if(fs.existsSync(out)&&fs.statSync(out).size>50000){console.log('  ⏭',s.k);continue;}
    console.log(`\n[${i+1}/${STEPS.length}] ${s.k}`);
    try{await hunyuanText(s.p,out); console.log('  ✓ 生成');}catch(e){console.error('  ✗',e.message);}
    await new Promise(r=>setTimeout(r,2000));
  }
  console.log('\n=== 全部生成完毕 ===');
})();
