// 古子城 4 张：实景 → 考据卡 → AI 初稿 → 婺绣成品
const https = require('https');
const fs = require('fs');
const path = require('path');
const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const LOCK = '禁止卡通风/插画感/3D渲染/霓虹光效/十字绣网格/均匀点阵/程序化针脚/机器打版稿。';

const STEPS = [
  // 1) 古子城实景参考（用户输入阶段）
  { k:'gzc-ref', p:'真实手机旅游照片：金华古子城，白天晴朗，保宁门古城楼正前方，城墙用青灰色条石砌成，城楼三层歇山顶黑瓦翘檐，城楼门洞行人进出，城墙两侧有古街和红灯笼，中等画质非完美构图，背景有零星游客。' },
  // 2) AI 自动分类 + 联网考据卡片（A类·建筑景观）
  { k:'gzc-kp',  p:LOCK + '现代科技卡片拼贴风格：左侧半透明大卡片显示"用户输入：古子城"，右侧小卡片显示"AI自动分类：A类·建筑景观"，下方堆叠3-4张联网考据要点卡片（①地处金华婺城区②始建于唐代③保宁门始建于北宋④太平天国侍王府在东侧），底图是淡化的古子城实景照片，整体PPT信息卡片风格叠在实景底图上。' },
  // 3) 混元 AI 初稿（有参考图路径）
  { k:'gzc-draft', p:LOCK + '文生图概念图示：左侧有"有参考图--混元hy-image-v3.5-preview 图生图"标签，右侧有"无参考图--cogview-3-flash 纯文生图"标签，两条路径箭头汇聚到中央的古子城楼图片，底图淡化展示算法框图风格。' },
  // 4) 最终婺绣成品（刺绣风格）
  { k:'gzc-final', p:'金华古子城保宁门婺绣刺绣老绣片，博物馆实拍质感。主体：保宁门古城楼正面，三层歇山顶黑瓦翘檐，朱红立柱，门洞有青石板路，城墙两侧红灯笼。构图：主体居中对称，下方城墙台基延伸。针脚细节：城楼墙体平针绣水平走向，瓦片交错短针沿瓦面铺展，翘檐飞角切线方向锁针绣，红灯笼结子绣点缀流苏。色调：暗红/墨黑/土黄/藏青古旧自然褪色，米色粗纺绣布基底有真实经纬纹理。画面干净平铺，无相框无玻璃高光。' },
];

function hunyuanText(prompt, outPath) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({ model: 'hy-image-v3.5-preview',
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      strength: 0.92, guidance_scale: 9.0 });
    const req = https.request({ hostname: 'tokenhub.tencentmaas.com',
      path: '/v1/wand/hunyuan-image/v35-generation', method: 'POST', timeout: 180000,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': Buffer.byteLength(post) } }, res => {
      let txt = ''; res.on('data', d => txt += d.toString()); res.on('end', () => {
        try { const d = JSON.parse(txt); const url = d.choices[0].delta.image.url;
          if (!url) { reject(new Error('no image')); return; }
          https.get(url, r => { if (r.statusCode>=300&&r.statusCode<400){return;}
            const f = fs.createWriteStream(outPath); r.pipe(f);
            f.on('finish',()=>{f.close();resolve();}); });
        } catch(e){reject(new Error('parse fail'));}
      });
    });
    req.on('error', reject); req.on('timeout', () => req.destroy(new Error('timeout')));
    req.write(post); req.end();
  });
}

(async () => {
  for (const s of STEPS) {
    const out = path.join(OUT, s.k + '.jpg');
    console.log('→', s.k);
    try { await hunyuanText(s.p, out); console.log('  ✓', (fs.statSync(out).size/1024).toFixed(0)+'KB'); }
    catch (e) { console.error('  ✗', e.message); }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\ndone');
})();
