'use strict';

const db = uniCloud.database();
const COLL = 'wy-content';
// 提审期开关：集合 isDisplay，权限为只读，仅云函数可读
const FLAG_COLL = 'isDisplay';
const FLAG_ID = '6ad464af21821b23be1b79ce';
// 体验课可预约时段：集合 wy-book-slot
const SLOT_COLL = 'wy-book-slot';

/**
 * 绣韵焕兴 · 内容接口
 * 通过 action 区分调用，统一返回 { code, msg, data }
 *   code: 0 成功 / 1 参数错误 / 404 内容不存在 / 500 服务异常
 *
 * 入参：
 *   { action: 'getPage', key: 'index' }   取单个页面内容
 *   { action: 'getAll' }                  取全部页面内容（合并为 { key: data } 对象）
 *   { action: 'getFlag' }                 取提审期开关：isDisplay=1 → 隐藏 AI 相关内容
 *   { action: 'getSlots' }                取体验课可预约时段（按 sort 升序）
 */
exports.main = async (event) => {
	const { action = 'getPage', key } = event || {};

	try {
		if (action === 'getFlag') {
			const res = await db.collection(FLAG_COLL).doc(FLAG_ID).get();
			const doc = (res.data && res.data[0]) || null;
			// isDisplay === 1 → 隐藏 AI 相关内容；为 0 或取不到时按不隐藏处理
			const aiHidden = !!(doc && Number(doc.isDisplay) === 1);
			return { code: 0, msg: 'ok', data: { aiHidden } };
		}

		if (action === 'getSlots') {
			const res = await db.collection(SLOT_COLL).orderBy('sort', 'asc').limit(100).get();
			const slots = (res.data || []).map((doc) => doc.time).filter((t) => !!t);
			return { code: 0, msg: 'ok', data: { slots } };
		}

		if (action === 'getPage') {
			if (!key) {
				return { code: 1, msg: 'missing key', data: null };
			}
			const res = await db.collection(COLL).where({ key }).limit(1).get();
			const doc = res.data && res.data[0];
			if (!doc) {
				return { code: 404, msg: 'content not found', data: null };
			}
			return { code: 0, msg: 'ok', version: doc.version, data: doc.data };
		}

		if (action === 'getAll') {
			const res = await db.collection(COLL).limit(100).get();
			const map = {};
			(res.data || []).forEach((doc) => {
				map[doc.key] = doc.data;
			});
			return { code: 0, msg: 'ok', data: map };
		}

		return { code: 1, msg: 'unknown action: ' + action, data: null };
	} catch (e) {
		return { code: 500, msg: e.message || 'server error', data: null };
	}
};
