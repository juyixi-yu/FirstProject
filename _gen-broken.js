// 用用户给的破损八咏楼 → 并发生成 7 张步骤图（base64 直传）
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const ASSETS = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-restore-flow/assets';
const USER_BROKEN = 'd:/微信记录/xwechat_files/wxid_k2g5zgzzrhyd22_ddf9/temp/RWTemp/2026-11/9e20f478899dc29eb19741386f9343c8/8644ee04425528017c96d6e4946f9966.jpg';
const USER_PERFECT = path.join(ASSETS, 'bazhonglou-original.jpg'); // 完好那张

// 先把破损原图复制到 assets
const BROKEN = path.join(ASSETS, 'broken-bazhonglou.jpg');
fs.copyFileSync(USER_BROKEN, BROKEN);
console.log('✓ 破损原图已复制');

// 破损图 base64
const brokenDataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(BROKEN).toString('base64');
const perfectDataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(USER_PERFECT).toString('base64');

const LOCK_BROKEN = '【结构锁定】参考图是锁定对象，主体（八咏楼三重檐+朱红立柱+黑瓦翘檐+金字匾额"八咏楼"+左庭院青松假山+破损破洞位置）必须100%保留，禁止任何变更。';
const LOCK_PERFECT = '【结构锁定】参考图是锁定对象，主体（八咏楼三重檐+朱红立柱+黑瓦翘檐+金字匾额"八咏楼"+左庭院青松假山）必须100%保留，禁止任何变更。';

// 7 步：step0 直接复制破损原图，其余 6 张并发混元生成
const TASKS = [
  { key: 'step0-before',  base: BROKEN, copy: true, prompt: null },
  { key: 'step1-mask',    base: 'broken',  prompt: LOCK_BROKEN + '破损检测：用亮红色半透明蒙版精准标记所有破损区域——右上角屋檐大破洞、中央立柱破损区、画面上的小破洞和霉斑。红色蒙版精确覆盖破损边界不外溢，完好的建筑主体青松假山保持原样。形成破损检测热力图效果。' },
  { key: 'step2-repair',  base: 'broken',  prompt: LOCK_BROKEN + '破损正在被周围完好丝线从边缘向中心逐步填补——呈现"半修复半破损"过渡态：靠近完好区域的一圈已经补上了针脚丝线纹理，破损中心还在等待填补中。针脚方向密度颜色与周围完好针脚自然衔接。完好区域不变。' },
  { key: 'step3-color',   base: 'broken',  prompt: LOCK_BROKEN + '破损已补全完成，正在色彩恢复：①整体亮度+15让暗部不再闷，②饱和度+35让朱红立柱恢复鲜艳红、黑瓦翘檐恢复青灰层次、金字匾额重新发亮，③对比度+12让建筑轮廓更分明。保留老绣片岁月质感不发亮刺目。' },
  { key: 'step4-sharp',   base: 'broken',  prompt: LOCK_BROKEN + '最终线条锐化增强：①反锐化遮罩让单根针脚边缘清晰锐利，②放大看得到丝线多股叠压纹理，③布料基底经纬纹理轻微增强可见。不要过度锐化出现白色光晕。' },
  { key: 'hero-before-after', base: 'broken', prompt: LOCK_BROKEN + '这是破损的八咏楼婺绣，输出其"修复完成后的博物馆级效果"：破损完全填补无痕迹、色彩自然鲜艳但保留岁月质感、针脚清晰可见丝股纹理、构图与原图完全一致。类似完好状态的八咏楼婺绣文物实拍。' },
  { key: 'pipeline-concept',  base: 'perfect', prompt: LOCK_PERFECT + '完好的八咏楼婺绣，保持原样不动清晰化输出，作为双链路修复架构概念图的底图展示。' },
];

function hunyuanEdit(dataUrl, lock, prompt, outPath, strength) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({
      model: 'hy-image-v3.5-preview',
      messages: [{ role: 'user', content: [
        { type: 'text', text: lock },
        { type: 'image_url', image_url: { url: dataUrl } },
        { type: 'text', text: prompt }
      ]}],
      strength: strength,
      guidance_scale: 8.5
    });
    const req = https.request({
      hostname: 'tokenhub.tencentmaas.com',
      path: '/v1/wand/hunyuan-image/v35-generation',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY, 'Content-Length': Buffer.byteLength(post) },
      timeout: 180000
    }, (res) => {
      let txt = '';
      res.on('data', d => txt += d.toString());
      res.on('end', () => {
        try {
          const d = JSON.parse(txt);
          const url = d?.choices?.[0]?.delta?.image?.url;
          if (!url) { reject(new Error('无图:' + txt.substring(0,200))); return; }
          download(url, outPath).then(resolve).catch(reject);
        } catch(e){ reject(new Error('解析:' + txt.substring(0,100))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('超时')));
    req.write(post); req.end();
  });
}
function download(url, out) {
  return new Promise((res, rej) => {
    https.get(url, r => {
      if (r.statusCode >= 300 && r.statusCode < 400) { download(r.headers.location, out).then(res).catch(rej); return; }
      const f = fs.createWriteStream(out);
      r.pipe(f); f.on('finish', () => f.close(() => {
        console.log('  ✓', path.basename(out), '-', (fs.statSync(out).size/1024).toFixed(0)+'KB'); res();
      }));
    }).on('error', rej);
  });
}

(async () => {
  // step0: 直接复制
  const step0out = path.join(ASSETS, 'step0-before.jpg');
  fs.copyFileSync(BROKEN, step0out);
  console.log('✓ step0-before (破损原图) 直接复制');

  // 其余 6 张并发混元生成
  const tasks = TASKS.filter(t => !t.copy).map(t => {
    const out = path.join(ASSETS, t.key + '.jpg');
    const dataUrl = t.base === 'broken' ? brokenDataUrl : perfectDataUrl;
    const lock = t.base === 'broken' ? LOCK_BROKEN : LOCK_PERFECT;
    return hunyuanEdit(dataUrl, lock, t.prompt, out, 0.88)
      .catch(e => console.error('  ✗', t.key, e.message));
  });
  console.log(`\n并发生成 ${tasks.length} 张混元图像...`);
  await Promise.all(tasks);
  console.log('\n=== 全部 7 张破损八咏楼步骤图生成完毕 ===');
})();
