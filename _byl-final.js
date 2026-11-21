// 八咏楼婺绣 final（文生图，直接出）
const https = require('https');
const fs = require('fs');
const path = require('path');
const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';

const PROMPT = '金华八咏楼婺绣刺绣老绣片，博物馆实拍质感。'
  + '主体：三重檐歇山顶楼阁，朱红立柱，黑色瓦面翘檐，正中有"八咏楼"金字匾额，左侧青松假山庭院。'
  + '构图：左右对称，主体居中，下方有石砌台基。'
  + '针脚细节：建筑墙体平针绣水平走向，瓦片交错短针沿瓦面铺展，翘檐飞角切线方向锁针绣，金字匾额盘金绣勾边填金箔，青松枝干结子绣、松针散套绣，假山石脉乱针绣。'
  + '色调：朱红/墨黑/土黄/藏青古旧自然褪色，米色粗纺绣布基底有真实经纬纹理。'
  + '画面干净平铺，无相框无玻璃高光，就是绣布上的实拍照片。'
  + '禁止卡通风/插画感/3D渲染/十字绣网格/均匀点阵/程序化针脚/机器打版稿。';

function hunyuanText(prompt, outPath) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({ model: 'hy-image-v3.5-preview',
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      strength: 0.95, guidance_scale: 9.0 });
    const req = https.request({ hostname: 'tokenhub.tencentmaas.com',
      path: '/v1/wand/hunyuan-image/v35-generation', method: 'POST', timeout: 180000,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': Buffer.byteLength(post) } }, res => {
      let txt = ''; res.on('data', d => txt += d.toString()); res.on('end', () => {
        try { const d = JSON.parse(txt); const url = d.choices[0].delta.image.url;
          if (!url) { reject(new Error('no image')); return; }
          https.get(url, r => { if (r.statusCode>=300&&r.statusCode<400){return;}
            const f = fs.createWriteStream(outPath); r.pipe(f); f.on('finish',()=>{f.close();resolve();}); });
        } catch(e){reject(new Error('parse fail'));}
      });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(post); req.end();
  });
}

(async () => {
  const out = path.join(OUT, 'bayonglou-final.jpg');
  console.log('→ bayonglou-final');
  try { await hunyuanText(PROMPT, out); console.log('  ✓'); }
  catch (e) { console.error('  ✗', e.message); }
})();
