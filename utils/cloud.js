/**
 * 绣韵焕兴 · 云端内容访问层
 *
 * 1) CDN_BASE：uniCloud 云存储「访问域名」。上传图片后把域名填到这里。
 *    例如：export const CDN_BASE = 'https://env-xxxxx.bspapp.com'
 *    未填写时自动回退到本地 /static/imgs/，便于未部署时预览。
 *    IMG_VER：CDN 对同一 URL 有 30 天缓存，覆盖同名图后旧图仍会被命中；
 *    带上 ?v=版本号可形成新缓存键、回源取新内容。换图后改这个值即可全局生效。
 * 2) getPage：调用云函数 wy-content 获取页面内容。
 *    注意：页面内容存在云端数据库（集合 wy-content）里，需要在 HBuilderX 里
 *    执行过一次「初始化云数据库」，把 database/db_init.json 灌进去后才会生效。
 *    控制台会打印数据来源，便于确认走的到底是云数据库还是本地兜底文案。
 * 3) getHideAI：取提审期开关（集合 isDisplay，isDisplay=1 时隐藏 AI 相关内容）。
 *    因为该集合权限为只读、客户端读不到，必须经云函数读取；结果在会话内缓存一次。
 * 4) getSlots：取体验课可预约时段（集合 wy-book-slot，按 sort 升序）。
 */

export const CDN_BASE = 'https://mp-2695f125-feac-43bb-bd3e-ad20b4c6951c.cdn.bspapp.com';

// 云存储中图片所在目录：整目录上传到 tu/ 后，所有裸文件名统一走此前缀
const CDN_DIR = 'juyixi/';

// CDN 对同一 URL 有 30 天缓存（Cache-Control: max-age=2592000），覆盖同名文件后旧图仍会被命中。
// 带上 ?v= 会形成新的缓存键、回源取新内容。换新图后把这里改成任意新值即可全局生效。
const IMG_VER = '20261019b';

const LOCAL_BASE = '/static/imgs/';

/** 把图片文件名解析为可访问地址
 *  - 完整 URL（http/https/cloud/data）→ 原样返回
 *  - /static/xxx 开头 → 本地包内真实路径（保证 tabBar 和封面等走本地稳定加载）
 *  - 裸文件名（diy-cover-full.jpg）→ 拼 CDN juyixi/ 前缀
 *  - 带子目录（videos/xxx.mp4）→ 拼 CDN 根目录
 */
export function img(name) {
	if (!name) return '';
	if (/^(https?:|cloud:|data:)/i.test(name)) return name;
	const str = String(name);
	// /static/xxx → 本地真实路径（不进 CDN，保证包内稳定加载）
	if (str.indexOf('/static/') === 0) return str;
	const file = str.replace(/^\/+/, '');
	if (CDN_BASE) {
		const base = CDN_BASE.replace(/\/+$/, '');
		// 带子目录的值（如 videos/xxx.mp4）直接拼在 CDN 根下
		const url = file.indexOf('/') === -1 ? base + '/' + CDN_DIR + file : base + '/' + file;
		return IMG_VER ? url + '?v=' + IMG_VER : url;
	}
	return LOCAL_BASE + file;
}

/** 取单个页面内容；成功返回 data 对象，失败返回 null（由页面用本地默认值兜底） */
export function getPage(key) {
	return new Promise((resolve) => {
		if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {
			console.warn('[wy-content] uniCloud 不可用（云空间未关联），' + key + ' 暂用本地默认文案');
			resolve(null);
			return;
		}
		uniCloud.callFunction({
			name: 'wy-content',
			data: { action: 'getPage', key },
			success: (res) => {
				const r = (res && res.result) || {};
				if (r.code === 0) {
					console.log('[wy-content] ' + key + ' ← 来自云数据库');
				} else {
					console.warn('[wy-content] ' + key + ' 云端无数据（code=' + r.code + '），请先初始化云数据库；当前显示本地默认文案');
				}
				resolve(r.code === 0 ? r.data : null);
			},
			fail: (err) => {
				console.error('[wy-content] ' + key + ' 云函数调用失败，请确认 wy-content 已上传部署、云空间已关联', err);
				resolve(null);
			}
		});
	});
}

// 开关在会话内只取一次（微信小程序逻辑层为单一 JS 运行时，模块级缓存可跨页面复用）
let hideAICache = null;
/** 取「是否隐藏 AI 内容」：isDisplay=1 → true；读取失败按 false（不隐藏）处理 */
export function getHideAI() {
	if (hideAICache !== null) return Promise.resolve(hideAICache);
	return new Promise((resolve) => {
		const done = (hide) => {
			hideAICache = hide;
			resolve(hide);
		};
		if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {
			console.warn('[isDisplay] uniCloud 不可用，AI 内容按不隐藏处理');
			done(false);
			return;
		}
		uniCloud.callFunction({
			name: 'wy-content',
			data: { action: 'getFlag' },
			success: (res) => {
				const r = (res && res.result) || {};
				const hide = !!(r.code === 0 && r.data && r.data.aiHidden);
				console.log('[isDisplay] isDisplay=1 隐藏 AI 内容: ' + (hide ? '是' : '否'));
				done(hide);
			},
			fail: (err) => {
				console.error('[isDisplay] 开关读取失败，AI 内容按不隐藏处理', err);
				done(false);
			}
		});
	});
}

/** 取体验课可预约时段（集合 wy-book-slot）；读取失败按空数组处理 */
export function getSlots() {
	return new Promise((resolve) => {
		if (typeof uniCloud === 'undefined' || !uniCloud.callFunction) {
			console.warn('[wy-book-slot] uniCloud 不可用，体验时段为空');
			resolve([]);
			return;
		}
		uniCloud.callFunction({
			name: 'wy-content',
			data: { action: 'getSlots' },
			success: (res) => {
				const r = (res && res.result) || {};
				const slots = (r.code === 0 && r.data && r.data.slots) || [];
				if (r.code === 0) {
					console.log('[wy-book-slot] 体验时段 ' + slots.length + ' 个 ← 来自云数据库');
				} else {
					console.warn('[wy-book-slot] 体验时段读取失败（code=' + r.code + '），请先创建集合并导入数据');
				}
				resolve(slots);
			},
			fail: (err) => {
				console.error('[wy-book-slot] 云函数调用失败，请确认 wy-content 已上传部署', err);
				resolve([]);
			}
		});
	});
}
