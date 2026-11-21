'use strict';
/**
 * wy-ai · AI 云函数
 *
 * action = 'genPattern'     ：文字描述 + 风格模板 → 智谱 CogView 文生图 → 返回图片 URL
 * action = 'metalPattern'   ：照片 → glm-4v 识别纹样 → 记忆金属浮雕效果图 → 返回图片 URL
 * action = 'restorePattern' ：老绣片照片 → 腾讯混元生图（参考图）→ 保留构图补全破损 → 返回图片 URL
 *
 * 部署前请填写下方两个 API Key，然后 HBuilderX 右键本云函数目录 → 上传部署。
 */

const ZHIPU_API_KEY = '1af38a2bc00948549f05df5121af7254.hGMMae26nq2UzV7J'; // ← 在这里填入你的智谱 API Key

// 腾讯混元生图（TokenHub）API Key：用于图像编辑，保留原图构图做纹样补全
// 申请：https://console.cloud.tencent.com/tokenhub/apikey → 创建 API Key
// 并先在「在线推理 → 视觉模型」开启 hy-image-v3.5-preview 的后付费
const HUNYUAN_API_KEY = 'sk-O6VOrmnzk575ILtT7BokiV9bIYH9yubwyhiKLrC5uHHR9Qdf';
const HUNYUAN_MODEL = 'hy-image-v3.5-preview';

const API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const HUNYUAN_BASE = 'https://tokenhub.tencentmaas.com/v1/wand/hunyuan-image';

// 四种风格模板（【.0】0内替换为用户描述）
// 公共要求：老刺绣文物实物照片质感，不要DIY/十字绣程序化针法
const STYLE_HEAD = '根据主题【%s】生成婺绣纹样，';
const STYLE_TAIL = '写实摄影质感，如同博物馆里老刺绣文物的实拍照片，针脚细密精致，细小的丝线针迹、清晰的布料肌理，纹样流畅连续，画面干净，适合纹样提取和文创加工。';
const STYLE_BAN = '禁止插画化、禁止二次元动漫画风。不要套用刺绣DIY、十字绣、数字刺绣绣制程序里的针法样式，不生成网格、点状针阵、规整短针单元。禁止十字绣网格、禁止均匀点阵针法、禁止程序化DIY刺绣针脚、禁止整齐重复短线段针迹；不要机器刺绣程序稿、不要刺绣打版稿效果；不生硬排列针点，不把纹样拆成标准化绣制单元。不要文字和水印，不要3D渲染，不要杂乱背景。';
const STYLE_TPL = {
	cartoon: STYLE_HEAD + '整张画面必须是Q版卡通风格：造型圆润胖乎乎，线条简化柔和，大色块平涂感，粉嫩马卡龙配色（浅粉、淡蓝、奶黄、薄荷绿），整体可爱童趣、软萌治愈，只保留一点刺绣布料质感，绝不能做成写实或水墨。' + STYLE_TAIL + STYLE_BAN,
	real: STYLE_HEAD + '整张画面必须是传统文物风格：参考古代婺绣文物实物，纹样工整对称，配色是自然褪色的古旧色调（暗红、土黄、墨绿、藏青），整体偏暗偏旧，像博物馆里拍的老绣片，还原古法刺绣原貌，绝不能鲜艳明亮。' + STYLE_TAIL + STYLE_BAN,
	ink: STYLE_HEAD + '整张画面必须是水墨写意风格：只用黑白灰墨色，坚决不用彩色，大面积留白（留白占画面一半以上），墨色浓淡晕染有层次，用细丝线模拟水墨笔触的干湿浓淡，素雅宣纸底，意境空灵，绝不能出现艳丽颜色。' + STYLE_TAIL + STYLE_BAN,
	gold: STYLE_HEAD + '整张画面必须是金线描边风格：深黑色绸缎布料做背景，纹样的所有轮廓都用金色绣线勾勒，金色是画面绝对主色调，纹样内部用暗色丝线填充，整体华贵庄重、金碧辉煌，绝不能是浅色背景或彩色纹样。' + STYLE_TAIL + STYLE_BAN
};

// 风格参考图库：非预设的 AI 生图时，按分类挑一张馆藏刺绣图作为"风格参考"
// 只参考针脚纹理、色彩层次、布料肌理、装裱边框，主体内容/构图由文字决定
const _CDN = 'https://mp-2695f125-feac-43bb-bd3e-ad20b4c6951c.cdn.bspapp.com/juyixi/';
const STYLE_REF_LIB = {
	// A 类（地点/建筑/景观）：统一用"兰溪地下长河"——溶洞/山水/小桥架桥/竹林的综合景观，
	// 建筑/景观类生图最常遇到的元素在这张里都有
	A: [_CDN + '024b17304278cdea593312f388dc3abd.jpg'],
	// B 类（农产品/物品/器物）：用"浦江板凳龙"——节庆器物+人物组合
	B: [_CDN + 'pattern-bandenglong.jpg'],
	// C 类（抽象文化/动物/花卉）：也用"板凳龙"——龙是典型 C 类题材
	C: [_CDN + 'pattern-bandenglong.jpg']
};

// 主题专属参考图：命中主题词时直接用这几张做图生图，优先级高于联网实景搜图
const THEME_REF_LIB = [
	{
		keys: ['双龙洞', '双龙', '金华双龙'],
		imgs: [
			_CDN + '3bb3e923696a85d9062c977ecc16d75d.jpg', // 洞口瀑布 + 「雙龍洞」题刻
			_CDN + '1f8b4cc3eabd1d291b575c65bee712a5.jpg'  // 钟乳石洞口 + 卧船入洞
		]
	}
];

/** 按主题文字匹配专属参考图，返回图片地址数组；未命中返回 null */
function themeRefFor(text) {
	const t = String(text || '');
	for (let i = 0; i < THEME_REF_LIB.length; i++) {
		const item = THEME_REF_LIB[i];
		for (let k = 0; k < item.keys.length; k++) {
			if (t.indexOf(item.keys[k]) >= 0) return item.imgs;
		}
	}
	return null;
}

/** 调腾讯混元生图（TokenHub）
 * @param {string} prompt
 * @param {string} [imageUrl] 参考图：传则图生图，不传则纯文生图
 * @param {number} [strength] 0-1：有参考图时生效，越高越保留参考图；风格参考场景建议 0.3-0.5
 */
async function hunyuanImage(prompt, imageUrl, strength) {
	const content = [{ type: 'text', text: prompt }];
	if (imageUrl) content.push({ type: 'image_url', image_url: { url: imageUrl } });
	const data = {
		model: HUNYUAN_MODEL,
		messages: [{ role: 'user', content: content }]
	};
	if (imageUrl && typeof strength === 'number') data.strength = strength;
	const res = await uniCloud.httpclient.request(HUNYUAN_BASE + '/v35-generation', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + HUNYUAN_API_KEY
		},
		dataType: 'json',
		timeout: 180000,
		data: data
	});
	const d = res && res.data;
	const img = d && d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.image;
	if (!img || !img.url) {
		const err = (d && d.error && d.error.message) || (d && d.message) || '';
		throw new Error('混元生图返回异常: ' + (err || ('HTTP ' + ((res && res.status) || '未知'))));
	}
	return toCloudUrl(img.url);
}

/** 图像编辑（保留原图构图） */
async function editImage(imageUrl, prompt, strength) {
	return hunyuanImage(prompt, imageUrl, strength);
}

/** 调智谱 CogView 文生图，返回图片 URL */
async function textToImage(prompt) {
	const res = await uniCloud.httpclient.request(API_BASE + '/images/generations', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + ZHIPU_API_KEY
		},
		dataType: 'json',
		timeout: 90000,
		data: { model: 'cogview-3-flash', prompt: prompt, size: '1024x1024' }
	});
	const url = res && res.data && res.data.data && res.data.data[0] && res.data.data[0].url;
	if (!url) throw new Error('文生图返回异常: ' + JSON.stringify((res && res.data) || (res && res.status)));
	return toCloudUrl(url);
}

/** 调 glm-4v-flash 识别图片内容，返回文字描述 */
async function imageToText(imageUrl) {
	const res = await uniCloud.httpclient.request(API_BASE + '/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + ZHIPU_API_KEY
		},
		dataType: 'json',
		timeout: 60000,
		data: {
			model: 'glm-4v-flash',
			messages: [{
				role: 'user',
				content: [
					{ type: 'image_url', image_url: { url: imageUrl } },
					{
						type: 'text',
						text: '这是一张刺绣绣片（或织物）照片。请只用一句话客观描述其中的纹样：主体图案是什么、有哪些配色、构图布局如何。不要描述破损、污渍、褶皱、背景和光影，不要客套话，不超过60个字。'
					}
				]
			}],
			temperature: 0.3
		}
	});
	const txt = res && res.data && res.data.choices && res.data.choices[0] &&
		res.data.choices[0].message && res.data.choices[0].message.content;
	if (!txt) throw new Error('图像识别返回异常: ' + JSON.stringify((res && res.data) || (res && res.status)));
	return String(txt).trim();
}

/** 联网深度考据：glm-z1-flash（推理链 + web_search），先自动识别主题类型再走对应考据模板 */
async function deepResearch(theme) {
	const res = await uniCloud.httpclient.request(API_BASE + '/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + ZHIPU_API_KEY
		},
		dataType: 'json',
		timeout: 90000,
		data: {
			model: 'glm-z1-flash',
			tools: [{ type: 'web_search', web_search: { enable: true, search_engine: 'search_std' } }],
			messages: [
				{
					role: 'system',
					content: '你是非遗婺绣纹样考据专家，必须严格遵循以下分类流程：'
						+ '【同名歧义处理】若联网搜索出现同名/类似地标分属不同城市（如"双龙洞"不止一处、"东方广场"遍布全国），'
						+ '以用户输入中的城市前缀、或用户输入最完整/最具体的那一项为准，彻底排除同名异地的干扰。'
						+ '【第一步 · 自动分类】先判断主题属于哪一类：'
						+ 'A类（地点/建筑/景观类）：含城市名、景点名、建筑名、山川湖海、历史遗迹等；'
						+ 'B类（农产品/物品/器物类）：含农作物、土特产、器物、日用品、工艺品、食品等可触摸的具体物品；'
						+ 'C类（抽象文化/动物/花卉类）：含生肖、神兽、传说动物、花卉、抽象文化符号等。'
						+ '【第二步 · 强制联网搜索】'
						+ '- A类必须调用搜索工具，定位所属城市/行政区，获取真实景点、地理特征、建筑形制、文化标识等客观资料；'
						+ '- B类必须调用搜索工具，获取该物品的真实产地、品类、规格参数、形态特征、文化寓意、使用场景等权威数据，禁止凭空编造；'
						+ '- C类必须调用搜索工具，获取该符号/动物/花卉的文化寓意、传统纹样形态、常见配色、在婺绣中的应用历史等。'
						+ '【第三步 · 输出格式】无论哪一类，输出都严格分两部分：'
						+ '第一部分是考据简报（150字以内），以【分类：A/B/C】开头，然后按类型填字段：'
						+ 'A类字段：地点归属、文化寓意、核心视觉元素（具体到形态）、推荐配色、刺绣构图；'
					+ 'A类特别注意：若景观是"形似某物的自然造物"（如钟乳石形似龙、山峰形似人物），'
					+ '画面描述必须写明真实材质与形态（如"洞口两簇形似龙首的青黄色钟乳石"），'
					+ '禁止只写象征物名称（如只写"双龙"），防止生图模型画出具象雕塑；'
					+ '所有文字类人文元素（摩崖石刻、碑文、匾额、楹联、题字）一律不得写入画面描述，'
					+ '只可概括为"石壁风化刻痕肌理"，禁止出现任何可识别的汉字内容；'
						+ 'B类字段：真实名称/产地、形态特征/规格参数（必须来自搜索结果）、文化寓意、推荐配色、刺绣构图；'
						+ 'C类字段：文化寓意、传统纹样形态、常见配色、刺绣构图。'
						+ '然后单独起一行，以【画面描述】开头，输出一段120字以内的连续画面描述，'
						+ '把上述真实元素组织成一幅具体可画的刺绣场景，写清每个元素的形态、位置、比例关系与标志性细节。'
						+ '【红线】所有内容必须来自联网搜索的权威资料，禁止仅凭模型自有知识或字面意思臆造；'
						+ '禁止编造参数、产地、形制；禁止出现考据要点之外的虚构元素。'
						+ '只输出考据结论本身，不要输出思考过程，不要客套话。'
				},
				{
					role: 'user',
					content: '主题：' + theme + '。请先自动分类，再强制联网搜索真实资料，按规定格式输出。'
				}
			],
			temperature: 0.5,
			max_tokens: 4096
		}
	});
	const msg = res && res.data && res.data.choices && res.data.choices[0] &&
		res.data.choices[0].message;
	// 推理模型：思考过程在 reasoning_content，最终答案在 content
	let txt = msg && msg.content;
	if (!txt) throw new Error('深度考据返回异常');
	txt = String(txt).trim();
	// 剔除可能混入答案的思考链片段（<think>...</think>）
	txt = txt.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
	if (!txt) throw new Error('深度考据返回为空');
	return txt;
}

/** glm-4v-flash 严格校验：候选图是否拍的就是「该景点本身」（不是同类景观，更不能是无关图）
 *  hints = 联网考据得出的标志性视觉元素，用于比对特征 */
async function verifyPlacePhoto(imageUrl, theme, hints) {
	try {
		const check = '主题景点「' + theme + '」。' + (hints ? '该景点的标志性视觉元素：' + hints + '。' : '')
			+ '判断这张照片拍的是否就是该景点本身：必须能看出与该景点标志性特征一致的实景（山体/洞体/建筑形制/水面/题刻位置等）。'
			+ '同类但不同地点、无法确认是同一景点、二次元插画、效果图、城市夜景、其他城市风光、似乎无关的图片，一律判为"否"。'
			+ '只回答一个字：是 或 否。';
		const res = await uniCloud.httpclient.request(API_BASE + '/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + ZHIPU_API_KEY
			},
			dataType: 'json',
			timeout: 30000,
			data: {
				model: 'glm-4v-flash',
				messages: [{
					role: 'user',
					content: [
						{ type: 'image_url', image_url: { url: imageUrl } },
						{ type: 'text', text: check }
					]
				}],
				temperature: 0.1,
				max_tokens: 8
			}
		});
		const txt = res && res.data && res.data.choices && res.data.choices[0] &&
			res.data.choices[0].message && res.data.choices[0].message.content;
		return !!txt && String(txt).indexOf('是') !== -1;
	} catch (e) {
		console.warn('[wy-ai] 候选图校验失败', e);
		return false;
	}
}

/** 联网搜索地点实景照片：必应中国站图片搜索（维基百科在大陆被墙，阿里云函数访问不到，已弃用）
 *  只筛照片类结果 → 取前 8 条候选 → 逐个转存云存储（防防盗链）→ glm-4v 严格校验"是该景点本身"
 *  hints 为考据得出的标志性视觉元素，全部候选均不合格则返回空串（调用方回退纯文生图） */
async function searchPlacePhoto(theme, hints) {
	try {
		const u = 'https://cn.bing.com/images/search?q=' + encodeURIComponent(theme)
			+ '&qft=+filterui:photo-photo&first=1';
		const r = await uniCloud.httpclient.request(u, {
			headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
			timeout: 15000
		});
		const html = (r && r.data) ? String(r.data) : '';
		// 必应图片结果在 m="{json}" 属性里，murl 为原图地址
		const re = /m="(\{[^"]*?murl[^"]*?\})"/g;
		const candidates = [];
		let m;
		while ((m = re.exec(html)) && candidates.length < 8) {
			try {
				const j = JSON.parse(m[1].replace(/&quot;/g, '"'));
				const url = j.murl || '';
				// 排除视频封面、无效图源
				if (!url || /qpic\.cn|_hz\.jpg|youtube|bilibili|logo/i.test(url)) continue;
				candidates.push(url);
			} catch (e) { /* 单条解析失败，继续下一条 */ }
		}
		// 逐个校验，第一张确认是该景点本身的图胜出
		for (const url of candidates) {
			const cloudUrl = await toCloudUrl(url);
			if (cloudUrl === url) continue; // 下载失败（防盗链），跳过
			if (await verifyPlacePhoto(cloudUrl, theme, hints)) {
				console.log('[wy-ai] 实景图校验通过:', url);
				return cloudUrl;
			}
			console.warn('[wy-ai] 实景图非该景点，弃用:', url);
		}
	} catch (e) {
		console.warn('[wy-ai] 必应实景图搜索失败', e);
	}
	return '';
}

/** 取云存储文件的临时可访问 URL */
async function tempUrl(fileID) {
	const r = await uniCloud.getTempFileURL({ fileList: [fileID] });
	const item = r && r.fileList && r.fileList[0];
	if (!item || !item.tempFileURL) throw new Error('获取图片临时地址失败');
	return item.tempFileURL;
}

/**
 * AI 厂商返回的图片转存到云存储后再返回。
 * H5 端用 uni.downloadFile 拉第三方图片会被浏览器跨域拦截，厂商侧无法配置 CORS；
 * 转存到云存储后，配合 uniCloud 控制台的跨域配置即可正常下载、绘入 canvas。
 */
async function toCloudUrl(url) {
	try {
		// 必须声明 arraybuffer：默认按文本返回，二进制图片会被当字符串解码，转存后图片损坏无法解码
		const res = await uniCloud.httpclient.request(url, {
			method: 'GET',
			responseType: 'arraybuffer',
			timeout: 30000
		});
		if (!res || res.status !== 200) return url;
		const raw = res.data;
		const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(new Uint8Array(raw));
		// 校验魔术字节，避免把错误响应体（HTML/JSON）当成图片转存
		const isJpg = buf[0] === 0xff && buf[1] === 0xd8;
		const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
		const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
			&& buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
		if (!buf.length || (!isJpg && !isPng && !isWebp)) return url;
		const ext = isPng ? '.png' : (isWebp ? '.webp' : '.jpg');
		const up = await uniCloud.uploadFile({
			fileContent: buf,
			cloudPath: 'wy-ai/out-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext
		});
		return await tempUrl(up.fileID);
	} catch (e) {
		console.warn('[wy-ai] 生成图转存云存储失败，改用原始地址', e);
		return url;
	}
}

exports.main = async (event) => {
	const { action, text, style, fileID } = event || {};
	if (!ZHIPU_API_KEY) return { code: 401, msg: '云函数未配置智谱 API Key，请在 wy-ai/index.js 中填入后重新上传' };

	try {
		if (action === 'genPattern') {
			// fileID / imageBase64 = 图生图（用户上传照片）；都没有 = 文生图
			const tpl = STYLE_TPL[style] || STYLE_TPL.real;
			let fid = fileID;
			// base64 传图（避开小程序 uploadFile 域名白名单）：云端转存云存储
			if (!fid && event.imageBase64) {
				const up = await uniCloud.uploadFile({
					fileContent: Buffer.from(event.imageBase64, 'base64'),
					cloudPath: 'wy-upload/style-' + Date.now() + '.jpg'
				});
				fid = up.fileID;
			}
			let prompt, url;
			// refImageUrl / refImageUrls = 预设馆藏底稿（CDN 公网地址）直传，跳过 base64：
			// 底稿多为 3-5MB，转 base64 会超出小程序调用体积限制；手机端也不下载（受域名限制），
			// 由云端逐张探测候选地址，用第一张能取到的
			const cands = [];
			if (event.refImageUrl) cands.push(String(event.refImageUrl).trim());
			if (Array.isArray(event.refImageUrls)) event.refImageUrls.forEach((u) => cands.push(String(u).trim()));
			let refUrl = '';
			if (event.refImageUrl || event.refImageUrls) {
				// 用 HEAD 探测（底稿单张 3-5MB，GET 下载二进制既慢又容易被超时误判为不可用）
				for (const u of cands) {
					if (!/^https?:/i.test(u)) continue;
					try {
						const probe = await uniCloud.httpclient.request(u, { method: 'HEAD', dataType: 'text', timeout: 15000 });
						if (probe && probe.status === 200) { refUrl = u; break }
						console.warn('[wy-ai] 预设底稿不可用 HTTP ' + (probe && probe.status) + ': ' + u);
					} catch (e) {
						console.warn('[wy-ai] 预设底稿探测失败: ' + u, e && e.message);
					}
				}
			}
			if (!refUrl && (event.refImageUrl || event.refImageUrls)) {
				return { code: 404, msg: '预设底稿不可用，请确认云存储 juyixi 目录下有对应图片' };
			}
			if (refUrl) {
				if (!/^https?:/i.test(refUrl)) return { code: 400, msg: '参考图地址不合法' };
				// 主题专属短路：命中"双龙洞"等时直接返回用户上传的原图，不调 AI
				const themeImgs = themeRefFor(text || '');
				if (themeImgs && themeImgs.length) {
					console.log('[wy-ai] genPattern 命中主题专属图库（refImageUrl 路径），直接返回原图:', themeImgs.join(' , '));
					return { code: 0, data: { prompt: '', brief: '', refPhoto: themeImgs[1] || '',
						url: themeImgs[0], researchFailed: false, researchError: '',
						category: '', photoSearchSkipped: '' } };
				}
				const subject = (text && String(text).trim()) ? String(text).trim() : '参考图中的主体';
				prompt = '严格保留参考图中主体的造型、姿态与构图，把它转化为选定风格的婺绣刺绣纹样：' + tpl.replace('%s', subject);
				url = HUNYUAN_API_KEY ? await hunyuanImage(prompt, refUrl, 0.90) : await textToImage(prompt);
			} else if (fid) {
				const imgUrl = await tempUrl(fid);
				const subject = (text && String(text).trim()) ? String(text).trim() : '参考图中的主体';
				// 严格锁定参考图主体与构图，只转换风格
				prompt = '严格保留参考图中主体的造型、姿态与构图，把它转化为选定风格的婺绣刺绣纹样：' + tpl.replace('%s', subject);
				url = HUNYUAN_API_KEY ? await hunyuanImage(prompt, imgUrl, 0.90) : await textToImage(prompt);
				try { await uniCloud.deleteFile({ fileList: [fid] }); } catch (e) {}
			} else {
				if (!text || !String(text).trim()) return { code: 400, msg: '缺少描述文字' };
				const desc = String(text).trim();
				// 主题专属图库：命中"双龙洞"等主题时直接返回用户上传的原图，不调 AI、不联网
				const themeImgs = themeRefFor(desc);
				if (themeImgs && themeImgs.length) {
					console.log('[wy-ai] genPattern 命中主题专属图库，直接返回原图:', themeImgs.join(' , '));
					return { code: 0, data: { prompt: '', brief: '', refPhoto: themeImgs[1] || '',
						url: themeImgs[0], researchFailed: false, researchError: '',
						category: '', photoSearchSkipped: '' } };
				}
				// 深度考据：联网搜索主题文化背景，提炼设计要点注入提示词
				let brief = '';
				let researchFailed = false;
				let researchError = '';
				if (event.deepSearch) {
					try {
						brief = await deepResearch(desc);
						console.log('[wy-ai] genPattern 考据要点:', brief);
					} catch (e) {
						researchFailed = true;
						researchError = String((e && e.message) || e);
						console.warn('[wy-ai] 深度考据失败，降级为直接生图', e);
					}
				}
				// 拆分考据输出：简报用于前端展示，画面描述用于指导生图
				let scene = '';
				let category = '';
				if (brief) {
					const parts = brief.split('【画面描述】');
					if (parts.length > 1) {
						scene = parts[1].trim();
						brief = parts[0].trim();
					}
					// 从简报里提取分类标签（A/B/C），用于生图层选择不同策略
					const catMatch = brief.match(/分类[：:]\s*([ABC])/);
					if (catMatch) category = catMatch[1];
					// A类生图净化：考据中"形似龙"的钟乳石表述（龙头/龙身/双龙蟠顶）会让生图模型画出具象龙雕塑，
					// 送生图前统一替换为石材描述（仅A类景观启用；C类龙纹样等正当需求不受影响；
					// 简报 brief 保持原文用于前端展示）
					if (category === 'A' && scene) {
						scene = scene
							.replace(/双龙蟠顶|双龙盘绕|双龙缠绕|双龙/g, '两簇垂悬钟乳石')
							.replace(/青龙/g, '青灰色钟乳石')
							.replace(/黄龙/g, '黄褐色钟乳石')
							.replace(/蟠龙/g, '盘旋的钟乳石')
							.replace(/龙身/g, '石身')
							.replace(/龙首|龙头/g, '形似兽首的钟乳石')
							.replace(/龙鳞/g, '层叠石纹')
							.replace(/龙柱/g, '石柱')
							.replace(/龙形/g, '蜿蜒条形');
					}
				}
				// 描述前置（模型对句首权重最高，保证主体不跑偏）
				// 有画面描述时以画面描述为生图主体（连续场景描述远比条目清单更能锁定画面）
				const subject = scene ? (desc + '。' + scene)
					: (brief ? (desc + '。考据要点：' + brief) : desc);
				prompt = subject + '，' + tpl.replace('%s', desc);
				// 文字硬禁令：考据简报里的人文元素（摩崖石刻/碑文/匾额）会诱导模型画出汉字，必须显性禁止
				prompt += '画面中绝对禁止出现任何文字元素：无汉字、无碑文刻字、无摩崖题字、无匾额楹联、无印章落款、无水印。'
					+ '石壁只保留自然风化纹理与刻痕肌理，不形成任何可识别的字形。';
				if (brief) {
					// 按分类追加不同的防臆造约束
					if (category === 'B') {
						// 物品/农产品类：重点防止瞎编参数、形态
						prompt += '画面中所有元素必须严格来自联网考据要点中的真实产地、形态特征与规格参数，'
							+ '禁止凭空编造该物品的外观、大小、数量、附属物；禁止添加考据要点之外的虚构器物、背景人物或符号。';
					} else if (category === 'A') {
						// 地点/建筑类：重点防止按字面拆解（如"双龙洞"≠画双龙雕塑）
						prompt += '画面中所有元素必须严格来自联网考据要点，禁止凭主题字面意思拆解臆造具象符号：'
							+ '主题中的任何一个字都不代表可以凭空画出对应物象（如带"龙"字不等于画龙形雕塑、'
							+ '带"塔"字不等于虚构塔楼），只能绘制考据要点中经搜索证实的真实景观元素，'
							+ '禁止出现考据要点之外的虚构建筑、雕塑、人物与符号。';
					} else {
						// C类（抽象文化/动物/花卉）：默认约束
						prompt += '画面中所有元素必须严格来自联网考据要点，禁止凭空臆造，只能绘制经搜索证实的传统纹样形态与文化符号。';
					}
				}
				// 终极方案：仅 A 类（地点/建筑/景观）走实景图参考图方案，B/C 类跳过（通用图库搜不到有意义的对应图）
				let refPhoto = '';
				let photoSearchSkipped = '';
				if (HUNYUAN_API_KEY && event.deepSearch && !researchFailed) {
					if (category === 'A') {
						try {
							// searchPlacePhoto：必应搜图 → 转存云存储 → glm-4v 校验"是该景点本身"
							// hints 用考据画面描述（含标志性元素），校验照片特征是否与景点一致
							refPhoto = await searchPlacePhoto(desc, scene || brief);
							if (!refPhoto) photoSearchSkipped = '未找到能确认为该景点本身的实景照片，已回退为纯文生图';
						} catch (e) {
							photoSearchSkipped = String((e && e.message) || e);
							console.warn('[wy-ai] 实景照片搜索失败', e);
						}
					} else if (brief) {
						photoSearchSkipped = '主题分类为 ' + (category || '未识别') + '，非地点/建筑类，跳过实景图';
					}
				}
				if (refPhoto) {
					console.log('[wy-ai] genPattern 实景参考图:', refPhoto);
					// 照片优先：内容元素全部以实景照片为准，文字描述只定风格；
					// 避免考据文字里的隐喻词（如"龙"）压过照片内容，画出具象雕塑
					const refPrompt = '严格保留参考照片中真实景观的主体造型、布局与构图，仅把表现形式转化为选定风格的婺绣刺绣纹样：'
						+ tpl.replace('%s', desc)
						+ '画面中的一切内容元素以参考照片为准，照片里没有的元素一律不得添加；'
						+ '禁止凭空加入龙、神兽、人物、雕塑、文字题刻；'
						+ '若文字描述与参考照片冲突，一切以照片为准。'
						+ '画面中绝对禁止出现任何文字元素：无汉字、无碑文刻字、无匾额楹联、无水印。';
					url = await hunyuanImage(refPrompt, refPhoto, 0.92);
				} else {
					// 纯文生图：也加一张馆藏刺绣风格参考图，保证输出质感统一
					let styleRef = '';
					let styleRefSkipped = '';
					if (HUNYUAN_API_KEY) {
						try {
							const lib = STYLE_REF_LIB[category] || STYLE_REF_LIB.A;
							const rawUrl = lib[Math.floor(Math.random() * lib.length)];
							// 混元需直接可访问的 URL，CDN 可能防盗链 → 先下载转存云存储
							const r = await uniCloud.httpclient.request(rawUrl, {
								method: 'GET', responseType: 'arraybuffer', timeout: 15000
							});
							if (r && r.status === 200 && r.data && r.data.length) {
								const up = await uniCloud.uploadFile({
									fileContent: Buffer.isBuffer(r.data) ? r.data : Buffer.from(new Uint8Array(r.data)),
									cloudPath: 'wy-ai/style-ref-' + Date.now() + '.jpg'
								});
								styleRef = await tempUrl(up.fileID);
								console.log('[wy-ai] genPattern 风格参考图:', rawUrl, '→', styleRef);
							} else {
								styleRefSkipped = '风格参考图下载失败，降级纯文生图';
							}
						} catch (e) {
							styleRefSkipped = String((e && e.message) || e);
							console.warn('[wy-ai] 风格参考图加载失败，降级纯文生图', e);
						}
					}
					if (styleRef) {
						// 明确告诉模型：参考图只做风格参考，内容/构图由文字决定
						const styleNote = '。以下参考图仅用于参考刺绣的针脚纹理、丝线色彩层次、布料肌理、装裱边框样式与整体刺绣质感——'
							+ '主体内容、构图布局、元素形态全部由前面的文字描述决定，**严禁照抄参考图的构图和主体**。';
						url = await hunyuanImage(prompt + styleNote, styleRef, 0.4);
					} else {
						url = HUNYUAN_API_KEY ? await hunyuanImage(prompt) : await textToImage(prompt);
					}
				}
				console.log('[wy-ai] genPattern 提示词:', prompt);
				return { code: 0, data: { prompt: prompt, brief: brief, refPhoto: refPhoto, url: url,
					researchFailed: researchFailed, researchError: researchError,
					category: category, photoSearchSkipped: photoSearchSkipped } };
			}
			return { code: 0, data: { prompt: prompt, url: url } };
		}

		if (action === 'restorePattern') {
			let fid = fileID;
			if (!fid && event.imageBase64) {
				const up = await uniCloud.uploadFile({
					fileContent: Buffer.from(event.imageBase64, 'base64'),
					cloudPath: 'wy-upload/restore-' + Date.now() + '.jpg'
				});
				fid = up.fileID;
			}
			if (!fid) return { code: 400, msg: '缺少待修复图片' };
			const src = await tempUrl(fid);

			// 图像编辑：在原图基础上补全破损、还原色彩，构图与纹样位置保持不变
			if (HUNYUAN_API_KEY) {
				const prompt = '古刺绣文物数字化修复。分析现存纹样的排布规律、单元样式、对称关系，'
					+ '推理补齐空洞、残缺、磨损位置丢失的花纹；完好区域完全保留，不做修改。'
					+ '保留原始布料肌理、刺绣针脚、岁月斑驳褪色痕迹，不美化、不新增不属于该文物的纹样，'
					+ '不强行改成鲜艳色彩，只补全结构缺损，不只是调色提亮。'
					+ '禁止改动完好花纹，禁止凭空创造陌生纹样，禁止大幅度换色、饱和拉高，'
					+ '禁止磨皮去除老化斑驳质感，禁止重绘整张图，禁止把古绣改成现代插画风格。'
					+ '不要改变画面构图与比例，不要出现任何文字。';
				const url = await editImage(src, prompt, 0.94);
				console.log('[wy-ai] restorePattern 使用腾讯混元图像编辑');
				try { await uniCloud.deleteFile({ fileList: [fid] }); } catch (e) { /* 忽略 */ }
				return { code: 0, data: { prompt: prompt, url: url } };
			}

			// 未配置混元 Key 时的降级方案：识别纹样后重绘（构图会变化）
			let desc = '';
			try {
				desc = await imageToText(src);
			} catch (e) {
				console.warn('[wy-ai] 图像识别失败，改用通用修复提示词', e);
			}
			if (!desc) desc = '传统婺绣花鸟缠枝纹样';

			const prompt = desc + '，非遗婺绣纹样，修复完整、线条清晰、历史色彩还原，传统刺绣针法，绣线肌理，白底绣布，纯图形纹样，不要任何中文字、不要文字，适合刺绣底稿';
			const url = await textToImage(prompt);
			console.log('[wy-ai] restorePattern 识别:', desc);

			// 清理上传的原图
			try { await uniCloud.deleteFile({ fileList: [fid] }); } catch (e) { /* 忽略 */ }

			return { code: 0, data: { prompt: prompt, desc: desc, url: url } };
		}

		if (action === 'metalPattern') {
			let fid = fileID;
			if (!fid && event.imageBase64) {
				const up = await uniCloud.uploadFile({
					fileContent: Buffer.from(event.imageBase64, 'base64'),
					cloudPath: 'wy-upload/metal-' + Date.now() + '.jpg'
				});
				fid = up.fileID;
			}
			if (!fid) return { code: 400, msg: '缺少照片' };
			const src = await tempUrl(fid);

			// 混元参考图：文物纹样矢量化提取，保留原图纹样造型，输出单线雕刻稿
			if (HUNYUAN_API_KEY) {
				const prompt = '文物纹样矢量化提取。从这张老绣片/传统纹样文物图里，精准剥离纹样轮廓，'
					+ '严格沿用原图的花卉、枝叶造型、结构比例，不随意改动纹样形态；'
					+ '清除布料底色、污渍、破损杂点，生成干净、连续、适合雕刻的单线矢量图案（黑色线稿、纯白背景），'
					+ '保留原图纹样的传统韵味，不要额外新增装饰，不扭曲原有纹样造型。'
					+ '禁止随意变形、改花型，禁止增加原图没有的花叶，禁止卡通化、插画化，禁止丢失原有纹样细节，'
					+ '不要出现任何文字。';
				const url = await editImage(src, prompt, 0.94);
				console.log('[wy-ai] metalPattern 使用腾讯混元矢量化提取');
				try { await uniCloud.deleteFile({ fileList: [fid] }); } catch (e) { /* 忽略 */ }
				return { code: 0, data: { prompt: prompt, url: url } };
			}

			// 未配置混元 Key 时的降级方案：识别纹样后文生图重绘
			let desc = '';
			try {
				desc = await imageToText(src);
			} catch (e) {
				console.warn('[wy-ai] 图像识别失败，改用通用金属纹样提示词', e);
			}
			if (!desc) desc = '传统婺绣缠枝牡丹纹样';

			const prompt = desc + '，非遗婺绣纹样，提取为清晰完整的纹样线条，记忆金属浮雕饰片效果，立体浮雕质感，哑光古铜金表面，边缘锐利，单色金属光泽，纯图形纹样，不要任何中文字、不要文字，纯白背景';
			const url = await textToImage(prompt);
			console.log('[wy-ai] metalPattern 识别:', desc);

			// 清理上传的原图
			try { await uniCloud.deleteFile({ fileList: [fid] }); } catch (e) { /* 忽略 */ }

			return { code: 0, data: { prompt: prompt, desc: desc, url: url } };
		}

		return { code: 400, msg: 'unknown action' };
	} catch (e) {
		console.error('[wy-ai] 执行失败', e);
		return { code: 500, msg: String((e && e.message) || e) };
	}
};