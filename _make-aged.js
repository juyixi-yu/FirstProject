// 只出图：完好八咏楼 → 老绣色破损版（混元图像编辑，base64 直传）
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const ASSETS = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-restore-flow/assets';
const OUT = path.join(ASSETS, 'bazhonglou-aged.jpg');

// 1) 读原图 → base64 data URL（绕过所有图床）
const raw = fs.readFileSync(path.join(ASSETS, 'bazhonglou-original.jpg'));
const dataUrl = 'data:image/jpeg;base64,' + raw.toString('base64');
console.log('原图 base64 长度:', dataUrl.length, '字符');

// 2) 调混元图像编辑：款式 100% 锁死，只做老化
const LOCK = '【结构锁定】参考图是锁定对象，主体（八咏楼三重檐+朱红立柱+黑瓦翘檐+金字匾额+左庭院青松假山）、布局、构图、特征必须100%保留，禁止任何变更。';

const prompt = LOCK + '只做老化处理，把完好的婺绣八咏楼变成有岁月痕迹的老绣片：'
  + '① 整体变暗、降低饱和度 35%，朱红立柱褪色变暗红，黑瓦翘檐失去青灰鲜艳感，金字匾额失去光泽；'
  + '② 左庭院青松假山区域叠加 3-4 块不规则暗褐色霉斑（像受潮发霉的老旧痕迹）；'
  + '③ 中央建筑二楼屋檐和立柱处制造 2-3 处亮白色破洞（丝线缺失露出米色绣布底）；'
  + '④ 整体对比度降低，让画面更暗淡更旧。完好区域除了变暗变旧之外不要改动。';

const post = JSON.stringify({
  model: 'hy-image-v3.5-preview',
  messages: [{ role: 'user', content: [
    { type: 'text', text: LOCK },
    { type: 'image_url', image_url: { url: dataUrl } },
    { type: 'text', text: prompt }
  ]}],
  strength: 0.85,
  guidance_scale: 8.5
});

const req = https.request({
  hostname: 'tokenhub.tencentmaas.com',
  path: '/v1/wand/hunyuan-image/v35-generation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Length': Buffer.byteLength(post)
  },
  timeout: 180000
}, (res) => {
  let txt = '';
  res.on('data', d => txt += d.toString());
  res.on('end', () => {
    try {
      const d = JSON.parse(txt);
      const url = d?.choices?.[0]?.delta?.image?.url;
      if (!url) { console.error('混元返回无图:', txt.substring(0, 300)); return; }
      download(url, OUT);
    } catch(e) { console.error('解析失败:', txt.substring(0, 200)); }
  });
});
req.on('error', e => console.error('请求失败:', e.message));
req.on('timeout', () => req.destroy(new Error('超时')));
req.write(post); req.end();

function download(url, out) {
  https.get(url, r => {
    if (r.statusCode >= 300 && r.statusCode < 400) { download(r.headers.location, out); return; }
    const f = fs.createWriteStream(out);
    r.pipe(f); f.on('finish', () => {
      f.close();
      const st = fs.statSync(out);
      console.log('\n✓ 老绣色破损版已生成:', out);
      console.log('  文件大小:', (st.size/1024).toFixed(0), 'KB');
    });
  });
}
