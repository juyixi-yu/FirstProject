// 关键修正：用图像编辑模式（传参考图），锁死构图，只转风格
const https = require('https');
const fs = require('fs');
const path = require('path');
const API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const OUT = 'd:/Users/HBuilderProjects/婺韵新生/embroidery-gen-flow/assets';

// 读已有的诸葛八卦村参考图（base64 data URL 绕过图床）
const refPath = path.join(OUT, 'zg-ref.jpg');
const refDataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(refPath).toString('base64');
console.log('参考图 base64 长度:', refDataUrl.length);

// 结构锁定头（三令五申）
const LOCK = '【结构锁定 · 必须严格执行】这是图像编辑而非重新创作，参考图是锁定对象：\n'
  + '1. 主体内容1:1对应：参考图里所有元素（建筑/太极图/马头墙/街巷/草木）必须完整保留，一个都不能少也不能新增；\n'
  + '2. 结构布局绝对不变：各元素之间的左右位置/上下层次/远近关系/构图重心必须与参考图完全一致；\n'
  + '3. 关键特征零偏差：每个主体的颜色/形状/大小/姿态必须严格保留；\n'
  + '4. 比例关系严格维持：元素间大小比例原封不动；\n'
  + '5. 红线：禁止把风格转换理解为重新画一张类似的图，禁止任何主体变更/元素替换/布局错位/特征偏差。';

const STYLE_PROMPT = LOCK
  + '\n\n只做以下处理：把参考图里的诸葛八卦村实景照片，转换成婺绣老绣片风格——保留所有构图和元素不变，只改视觉表现形式：\n'
  + '① 布料基底：米色粗纺布，有真实经纬纹理；\n'
  + '② 主体：用丝线针脚重绘每一个元素，针脚细密可见多股叠压有细微色差；\n'
  + '③ 色调：保持参考图的颜色关系（白墙/黛瓦/青石板/绿水），但整体降低饱和度15%变古旧；\n'
  + '④ 质感：像博物馆冷白光展柜里实拍的真实婺绣老绣片，画面干净没有多余背景。\n'
  + '禁止卡通风/插画感/十字绣网格/程序化针脚/霓虹光效。';

function hunyuanEdit(dataUrl, prompt, outPath) {
  return new Promise((resolve, reject) => {
    const post = JSON.stringify({
      model: 'hy-image-v3.5-preview',
      messages: [{ role: 'user', content: [
        { type: 'text', text: LOCK },
        { type: 'image_url', image_url: { url: dataUrl } },
        { type: 'text', text: prompt }
      ]}],
      strength: 0.88,   // 图像编辑保留原图力度（0.65默认→0.88强保留）
      guidance_scale: 9.0  // prompt 约束力
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
          if (!url) { reject(new Error('no image: ' + txt.substring(0, 200))); return; }
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
  // 只重新生成 final（draft 也可以顺便用同样逻辑）
  const tasks = [
    ['zg-final.jpg', STYLE_PROMPT],
  ];
  for (const [fn, p] of tasks) {
    const out = path.join(OUT, fn);
    console.log('→', fn, ' （图像编辑模式，锁构图）');
    try {
      await hunyuanEdit(refDataUrl, p, out);
      console.log('  ✓ 生成');
    } catch (e) { console.error('  ✗', e.message); }
    await new Promise(r => setTimeout(r, 2000));
  }

  // 压缩输出
  console.log('\n压缩中...');
  const final = path.join(OUT, 'zg-final.jpg');
  const dst = 'd:/Users/HBuilderProjects/婺韵新生/zg-final.jpg';
  const size = fs.statSync(final).size;
  console.log('原图大小:', (size/1024/1024).toFixed(2), 'MB');
  console.log('done');
})();
