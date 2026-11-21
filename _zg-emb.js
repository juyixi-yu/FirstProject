// 诸葛八卦村 final → 纯刺绣风格（图像编辑锁构图）
const https = require('https');
const fs = require('fs');
const path = require('path');
const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';

const refPath = path.join(OUT, 'zg-ref.jpg');
const refDataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(refPath).toString('base64');

const LOCK = '【结构锁定】参考图是锁定对象，主体/布局/构图/元素必须100%保留，禁止任何变更。';

// 极端刺绣风格 prompt
const EMB_PROMPT = LOCK + '\n\n把参考图里的诸葛八卦村，逐针逐线地刺绣到米色粗纺绣布上。只改表现形式，构图和所有元素位置不动。\n'
  + '【必须做到】\n'
  + '1. 每一个像素都是丝线：能看清单根丝线的多股叠压纹理，不同颜色区域之间有清晰的针脚边界，针脚方向跟随元素形态走（比如屋顶的针脚沿瓦片铺展，太极图圆弧的针脚沿切线方向）；\n'
  + '2. 布料基底：米色粗纺棉麻，有真实经纬纹理，像实际绣布；\n'
  + '3. 针脚方向：不同区域用不同针法——建筑墙体是平针绣（水平方向）、瓦片是交错短针、太极图圆弧是切线方向的平针、马头墙翘檐用盘金绣描边、草木花卉是结子绣和锁针绣；\n'
  + '4. 色调：保持参考图白墙黛瓦青石板绿水的颜色关系，但整体降饱和变古旧，像洗过的老绣片；\n'
  + '5. 画面干净，不要相框/玻璃/高光反射，就是绣布平铺的实拍照片。\n'
  + '【严格禁止】卡通风/插画感/3D渲染/霓虹光效/十字绣网格/均匀点阵/程序化针阵/机器打版稿/文字水印/杂乱背景。';

function hunyuanEdit(dataUrl, prompt, outPath) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({
      model: 'hy-image-v3.5-preview',
      messages: [{ role: 'user', content: [
        { type: 'text', text: LOCK },
        { type: 'image_url', image_url: { url: dataUrl } },
        { type: 'text', text: prompt }
      ]}],
      strength: 0.90, guidance_scale: 9.5
    });
    const req = https.request({
      hostname: 'tokenhub.tencentmaas.com', path: '/v1/wand/hunyuan-image/v35-generation',
      method: 'POST', timeout: 180000,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': Buffer.byteLength(post) }
    }, res => {
      let txt = '';
      res.on('data', d => txt += d.toString());
      res.on('end', () => {
        try {
          const d = JSON.parse(txt);
          const url = d && d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.image && d.choices[0].delta.image.url;
          if (!url) { reject(new Error('no image')); return; }
          https.get(url, r => {
            if (r.statusCode >= 300 && r.statusCode < 400) { return; }
            const f = fs.createWriteStream(outPath);
            r.pipe(f); f.on('finish', () => f.close(() => resolve()));
          });
        } catch (e) { reject(new Error('parse fail')); }
      });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(post); req.end();
  });
}

(async () => {
  const out = path.join(OUT, 'zg-final.jpg');
  console.log('→ 诸葛八卦村 final（纯刺绣风格）');
  try {
    await hunyuanEdit(refDataUrl, EMB_PROMPT, out);
    console.log('  ✓ 已生成:', (fs.statSync(out).size/1024).toFixed(0)+'KB');
  } catch (e) { console.error('  ✗', e.message); }
})();
