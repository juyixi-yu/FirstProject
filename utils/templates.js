/**
 * 个性 DIY · 模板库
 *
 * 设计要点：
 * 1) 模板用「归一化几何图形」（0~1 坐标）描述，不依赖任何图片资源 → 加载无网络、无解码开销
 * 2) 渲染时由 buildTemplateStitches 转成针脚记录 { x, y, angle, type, color, length, width, seed }
 *    与手工落针的结构完全相同，因此 diy 页面用同一套 drawOneStitch 渲染 → 视觉零差异
 * 3) 新增素材只需往 TEMPLATE_LIB 里追加一条，或调用 registerTemplate / registerCategory
 */

const TAU = Math.PI * 2

/* ============ 基础工具 ============ */

// 与 diy 页面同源的稳定伪随机（同一 seed 重绘结果一致）
function rng(seed) {
	let s = Math.floor(seed || 1) % 2147483647
	if (s <= 0) s += 2147483646
	return () => {
		s = (s * 16807) % 2147483647
		return (s - 1) / 2147483646
	}
}

// 生成椭圆（可旋转）边界点
function ell(cx, cy, rx, ry, rot, a0, a1, n) {
	const out = []
	const cr = Math.cos(rot || 0)
	const sr = Math.sin(rot || 0)
	const start = a0 === undefined ? 0 : a0
	const end = a1 === undefined ? TAU : a1
	const cnt = n || 44
	for (let i = 0; i <= cnt; i++) {
		const a = start + (end - start) * (i / cnt)
		const x = Math.cos(a) * rx
		const y = Math.sin(a) * ry
		out.push([cx + x * cr - y * sr, cy + x * sr + y * cr])
	}
	return out
}

// 取图形边界折线
function boundaryOf(s) {
	if (s.t === 'e') return ell(s.cx, s.cy, s.rx, s.ry, s.rot, 0, TAU, s.n || 44)
	if (s.t === 'p') return s.pts.concat([s.pts[0]])
	if (s.t === 'l') return s.pts
	if (s.t === 'a') return ell(s.cx, s.cy, s.rx, s.ry || s.rx, 0, s.a0, s.a1, s.n || 28)
	return []
}

// 横向扫描线填充（刺绣缎面的排针方向）
function fillPoly(poly, rowGap, step, emit) {
	let minY = Infinity
	let maxY = -Infinity
	poly.forEach((p) => {
		if (p[1] < minY) minY = p[1]
		if (p[1] > maxY) maxY = p[1]
	})
	for (let y = minY + rowGap * 0.5; y <= maxY; y += rowGap) {
		const xs = []
		for (let i = 0; i < poly.length - 1; i++) {
			const a = poly[i]
			const b = poly[i + 1]
			const y1 = a[1]
			const y2 = b[1]
			if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
				const t = (y - y1) / (y2 - y1)
				xs.push(a[0] + (b[0] - a[0]) * t)
			}
		}
		if (xs.length < 2) continue
		xs.sort((m, n) => m - n)
		for (let i = 0; i + 1 < xs.length; i += 2) {
			const x0 = xs[i]
			const x1 = xs[i + 1]
			if (x1 - x0 < step * 0.45) continue
			for (let x = x0 + step * 0.5; x < x1; x += step) emit(x, y, 0)
		}
	}
}

// 沿折线排针（针向始终跟随路径切线）
function strokePoly(pts, step, closed, emit) {
	const list = closed ? pts.concat([pts[0]]) : pts
	for (let i = 0; i < list.length - 1; i++) {
		const a = list[i]
		const b = list[i + 1]
		const dx = b[0] - a[0]
		const dy = b[1] - a[1]
		const len = Math.sqrt(dx * dx + dy * dy)
		if (len < 0.002) continue
		const ang = (Math.atan2(dy, dx) * 180) / Math.PI
		const n = Math.max(1, Math.round(len / step))
		for (let k = 0; k < n; k++) {
			const t = (k + 0.5) / n
			emit(a[0] + dx * t, a[1] + dy * t, ang)
		}
	}
}

/* ============ 分类 ============ */

export const TEMPLATE_CATS = [
	{ key: 'all', name: '全部' },
	{ key: 'fruit', name: '果蔬' },
	{ key: 'arch', name: '建筑' },
	{ key: 'flower', name: '花卉' },
	{ key: 'animal', name: '动物' },
	{ key: 'motif', name: '祥纹' }
]

/* ============ 模板素材 ============ */

export const TEMPLATE_LIB = [
	// ===== 果蔬 =====
	{
		id: 'apple',
		name: '苹果',
		cat: 'fruit',
		icon: '🍎',
		palette: ['#C8102E', '#3B7A57', '#7A4A22', '#F2A0AE'],
		shapes: [
			{ t: 'e', cx: 0.5, cy: 0.60, rx: 0.25, ry: 0.22, c: 0 },
			{ t: 'a', cx: 0.40, cy: 0.55, rx: 0.08, ry: 0.12, a0: Math.PI * 0.85, a1: Math.PI * 1.55, c: 3 },
			{ t: 'p', pts: [[0.485, 0.40], [0.478, 0.26], [0.512, 0.255], [0.52, 0.40]], c: 2 },
			{ t: 'e', cx: 0.66, cy: 0.32, rx: 0.095, ry: 0.045, rot: -0.55, c: 1 }
		]
	},
	{
		id: 'pumpkin',
		name: '南瓜',
		cat: 'fruit',
		icon: '🎃',
		palette: ['#D97706', '#F2B441', '#3B7A57', '#7A4A22'],
		shapes: [
			{ t: 'e', cx: 0.5, cy: 0.60, rx: 0.31, ry: 0.235, c: 0 },
			{ t: 'e', cx: 0.38, cy: 0.60, rx: 0.115, ry: 0.235, c: 1, fill: false },
			{ t: 'e', cx: 0.5, cy: 0.60, rx: 0.115, ry: 0.235, c: 1, fill: false },
			{ t: 'e', cx: 0.62, cy: 0.60, rx: 0.115, ry: 0.235, c: 1, fill: false },
			{ t: 'p', pts: [[0.478, 0.38], [0.47, 0.26], [0.522, 0.255], [0.528, 0.38]], c: 3 }
		]
	},
	{
		id: 'carrot',
		name: '胡萝卜',
		cat: 'fruit',
		icon: '🥕',
		palette: ['#E86A17', '#3B7A57', '#F2A0AE'],
		shapes: [
			{ t: 'p', pts: [[0.41, 0.38], [0.59, 0.38], [0.5, 0.82]], c: 0 },
			{ t: 'e', cx: 0.42, cy: 0.27, rx: 0.035, ry: 0.10, rot: -0.28, c: 1 },
			{ t: 'e', cx: 0.5, cy: 0.24, rx: 0.035, ry: 0.11, rot: 0, c: 1 },
			{ t: 'e', cx: 0.58, cy: 0.27, rx: 0.035, ry: 0.10, rot: 0.28, c: 1 },
			{ t: 'l', pts: [[0.45, 0.46], [0.55, 0.46]], c: 2 }
		]
	},
	{
		id: 'grape',
		name: '葡萄',
		cat: 'fruit',
		icon: '🍇',
		palette: ['#6B3FA0', '#5B2F8A', '#3B7A57', '#7A4A22'],
		shapes: [
			{ t: 'e', cx: 0.44, cy: 0.40, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.5, cy: 0.40, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.56, cy: 0.40, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.41, cy: 0.49, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.47, cy: 0.49, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.53, cy: 0.49, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.59, cy: 0.49, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.44, cy: 0.58, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.5, cy: 0.58, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.56, cy: 0.58, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.47, cy: 0.67, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'e', cx: 0.53, cy: 0.67, rx: 0.062, ry: 0.062, c: 0 },
			{ t: 'l', pts: [[0.5, 0.36], [0.5, 0.26]], c: 3 },
			{ t: 'e', cx: 0.61, cy: 0.30, rx: 0.085, ry: 0.042, rot: -0.5, c: 2 }
		]
	},
	{
		id: 'strawberry',
		name: '草莓',
		cat: 'fruit',
		icon: '🍓',
		palette: ['#C8102E', '#3B7A57', '#D4AF37'],
		shapes: [
			{ t: 'p', pts: [[0.5, 0.30], [0.63, 0.36], [0.68, 0.50], [0.63, 0.66], [0.5, 0.80], [0.37, 0.66], [0.32, 0.50], [0.37, 0.36]], c: 0 },
			{ t: 'p', pts: [[0.5, 0.26], [0.62, 0.30], [0.57, 0.35], [0.5, 0.32], [0.43, 0.35], [0.38, 0.30]], c: 1 },
			{ t: 'l', pts: [[0.5, 0.26], [0.5, 0.21]], c: 1 }
		]
	},

	// ===== 建筑 =====
	{
		id: 'pagoda',
		name: '古塔',
		cat: 'arch',
		icon: '🏯',
		palette: ['#8A5A12', '#C08A1E', '#7A4A22', '#E8C872'],
		shapes: [
			{ t: 'p', pts: [[0.5, 0.13], [0.515, 0.25], [0.485, 0.25]], c: 1 },
			{ t: 'p', pts: [[0.5, 0.25], [0.63, 0.34], [0.37, 0.34]], c: 1 },
			{ t: 'p', pts: [[0.43, 0.34], [0.57, 0.34], [0.57, 0.45], [0.43, 0.45]], c: 0 },
			{ t: 'p', pts: [[0.5, 0.45], [0.68, 0.55], [0.32, 0.55]], c: 1 },
			{ t: 'p', pts: [[0.41, 0.55], [0.59, 0.55], [0.59, 0.67], [0.41, 0.67]], c: 0 },
			{ t: 'p', pts: [[0.5, 0.67], [0.73, 0.77], [0.27, 0.77]], c: 1 },
			{ t: 'p', pts: [[0.39, 0.77], [0.61, 0.77], [0.61, 0.88], [0.39, 0.88]], c: 0 },
			{ t: 'p', pts: [[0.27, 0.88], [0.73, 0.88], [0.73, 0.93], [0.27, 0.93]], c: 2 }
		]
	},
	{
		id: 'paifang',
		name: '牌坊',
		cat: 'arch',
		icon: '⛩️',
		palette: ['#8A5A12', '#C08A1E', '#C8102E', '#7A4A22'],
		shapes: [
			{ t: 'p', pts: [[0.5, 0.16], [0.84, 0.32], [0.16, 0.32]], c: 1 },
			{ t: 'l', pts: [[0.16, 0.32], [0.115, 0.26]], c: 2 },
			{ t: 'l', pts: [[0.84, 0.32], [0.885, 0.26]], c: 2 },
			{ t: 'p', pts: [[0.24, 0.32], [0.76, 0.32], [0.76, 0.41], [0.24, 0.41]], c: 0 },
			{ t: 'p', pts: [[0.42, 0.33], [0.58, 0.33], [0.58, 0.40], [0.42, 0.40]], c: 1, fill: false },
			{ t: 'p', pts: [[0.30, 0.41], [0.37, 0.41], [0.37, 0.90], [0.30, 0.90]], c: 0 },
			{ t: 'p', pts: [[0.63, 0.41], [0.70, 0.41], [0.70, 0.90], [0.63, 0.90]], c: 0 },
			{ t: 'p', pts: [[0.27, 0.90], [0.40, 0.90], [0.40, 0.94], [0.27, 0.94]], c: 2 },
			{ t: 'p', pts: [[0.60, 0.90], [0.73, 0.90], [0.73, 0.94], [0.60, 0.94]], c: 2 }
		]
	},
	{
		id: 'matou',
		name: '马头墙',
		cat: 'arch',
		icon: '🏠',
		palette: ['#E9EFF7', '#4B6E8A', '#2E2620', '#C08A1E'],
		shapes: [
			{ t: 'p', pts: [[0.27, 0.47], [0.73, 0.47], [0.73, 0.90], [0.27, 0.90]], c: 0, ec: '#3C5A78' },
			{
				t: 'p',
				pts: [[0.27, 0.47], [0.27, 0.38], [0.35, 0.38], [0.35, 0.30], [0.44, 0.30],
					[0.44, 0.24], [0.56, 0.24], [0.56, 0.30], [0.65, 0.30], [0.65, 0.38],
					[0.73, 0.38], [0.73, 0.47]],
				c: 1
			},
			{ t: 'p', pts: [[0.45, 0.90], [0.55, 0.90], [0.55, 0.72], [0.45, 0.72]], c: 2 },
			{ t: 'p', pts: [[0.33, 0.62], [0.40, 0.62], [0.40, 0.70], [0.33, 0.70]], c: 2, fill: false },
			{ t: 'p', pts: [[0.60, 0.62], [0.67, 0.62], [0.67, 0.70], [0.60, 0.70]], c: 2, fill: false }
		]
	},
	{
		id: 'bridge',
		name: '拱桥',
		cat: 'arch',
		icon: '🌉',
		palette: ['#8A8F98', '#C08A1E', '#4B6E8A'],
		shapes: [
			{ t: 'a', cx: 0.5, cy: 0.78, rx: 0.38, ry: 0.30, a0: Math.PI, a1: TAU, c: 0 },
			{ t: 'a', cx: 0.5, cy: 0.78, rx: 0.34, ry: 0.255, a0: Math.PI, a1: TAU, c: 1 },
			{ t: 'a', cx: 0.5, cy: 0.76, rx: 0.30, ry: 0.20, a0: Math.PI, a1: TAU, c: 0 },
			{ t: 'p', pts: [[0.10, 0.74], [0.17, 0.74], [0.17, 0.90], [0.10, 0.90]], c: 2 },
			{ t: 'p', pts: [[0.83, 0.74], [0.90, 0.74], [0.90, 0.90], [0.83, 0.90]], c: 2 },
			{ t: 'l', pts: [[0.17, 0.86], [0.31, 0.83], [0.45, 0.86], [0.59, 0.83], [0.73, 0.86]], c: 2 },
			{ t: 'l', pts: [[0.22, 0.94], [0.36, 0.91], [0.5, 0.94], [0.64, 0.91], [0.78, 0.94]], c: 2 }
		]
	},
	{
		id: 'pavilion',
		name: '凉亭',
		cat: 'arch',
		icon: '⛺',
		palette: ['#8A5A12', '#C08A1E', '#C8102E', '#7A4A22'],
		shapes: [
			{ t: 'p', pts: [[0.5, 0.20], [0.78, 0.36], [0.22, 0.36]], c: 1 },
			{ t: 'p', pts: [[0.22, 0.36], [0.78, 0.36], [0.78, 0.40], [0.22, 0.40]], c: 3 },
			{ t: 'p', pts: [[0.30, 0.40], [0.34, 0.40], [0.34, 0.74], [0.30, 0.74]], c: 0 },
			{ t: 'p', pts: [[0.46, 0.40], [0.50, 0.40], [0.50, 0.74], [0.46, 0.74]], c: 0 },
			{ t: 'p', pts: [[0.55, 0.40], [0.59, 0.40], [0.59, 0.74], [0.55, 0.74]], c: 0 },
			{ t: 'p', pts: [[0.66, 0.40], [0.70, 0.40], [0.70, 0.74], [0.66, 0.74]], c: 0 },
			{ t: 'l', pts: [[0.28, 0.62], [0.72, 0.62]], c: 2 },
			{ t: 'p', pts: [[0.24, 0.74], [0.76, 0.74], [0.76, 0.80], [0.24, 0.80]], c: 3 }
		]
	},

	// ===== 花卉 =====
	{
		id: 'plum',
		name: '梅花',
		cat: 'flower',
		icon: '🌸',
		palette: ['#C8102E', '#E8C872', '#7A4A22'],
		shapes: [
			{ t: 'l', pts: [[0.16, 0.86], [0.32, 0.68], [0.5, 0.56], [0.7, 0.42], [0.86, 0.30]], c: 2 },
			{ t: 'e', cx: 0.5, cy: 0.445, rx: 0.08, ry: 0.06, rot: -1.571, c: 0 },
			{ t: 'e', cx: 0.609, cy: 0.525, rx: 0.08, ry: 0.06, rot: -0.314, c: 0 },
			{ t: 'e', cx: 0.568, cy: 0.653, rx: 0.08, ry: 0.06, rot: 0.942, c: 0 },
			{ t: 'e', cx: 0.432, cy: 0.653, rx: 0.08, ry: 0.06, rot: 2.199, c: 0 },
			{ t: 'e', cx: 0.391, cy: 0.525, rx: 0.08, ry: 0.06, rot: 3.456, c: 0 },
			{ t: 'e', cx: 0.5, cy: 0.56, rx: 0.042, ry: 0.042, c: 1 }
		]
	},
	{
		id: 'peony',
		name: '牡丹',
		cat: 'flower',
		icon: '🌺',
		palette: ['#D6336C', '#F2A0AE', '#E8C872', '#3B7A57'],
		shapes: [
			{ t: 'e', cx: 0.5, cy: 0.39, rx: 0.105, ry: 0.075, rot: -1.571, c: 0 },
			{ t: 'e', cx: 0.639, cy: 0.47, rx: 0.105, ry: 0.075, rot: -0.524, c: 0 },
			{ t: 'e', cx: 0.639, cy: 0.63, rx: 0.105, ry: 0.075, rot: 0.524, c: 0 },
			{ t: 'e', cx: 0.5, cy: 0.71, rx: 0.105, ry: 0.075, rot: 1.571, c: 0 },
			{ t: 'e', cx: 0.361, cy: 0.63, rx: 0.105, ry: 0.075, rot: 2.618, c: 0 },
			{ t: 'e', cx: 0.361, cy: 0.47, rx: 0.105, ry: 0.075, rot: 3.665, c: 0 },
			{ t: 'e', cx: 0.5, cy: 0.465, rx: 0.06, ry: 0.045, rot: -1.571, c: 1 },
			{ t: 'e', cx: 0.585, cy: 0.55, rx: 0.06, ry: 0.045, rot: 0, c: 1 },
			{ t: 'e', cx: 0.5, cy: 0.635, rx: 0.06, ry: 0.045, rot: 1.571, c: 1 },
			{ t: 'e', cx: 0.415, cy: 0.55, rx: 0.06, ry: 0.045, rot: 3.142, c: 1 },
			{ t: 'e', cx: 0.5, cy: 0.55, rx: 0.038, ry: 0.038, c: 2 }
		]
	},
	{
		id: 'lotus',
		name: '荷花',
		cat: 'flower',
		icon: '🪷',
		palette: ['#E88B9D', '#F6C6D2', '#3B7A57'],
		shapes: [
			{ t: 'e', cx: 0.5, cy: 0.40, rx: 0.058, ry: 0.14, rot: 0, c: 0 },
			{ t: 'e', cx: 0.40, cy: 0.44, rx: 0.055, ry: 0.125, rot: -0.42, c: 0 },
			{ t: 'e', cx: 0.60, cy: 0.44, rx: 0.055, ry: 0.125, rot: 0.42, c: 0 },
			{ t: 'e', cx: 0.30, cy: 0.53, rx: 0.05, ry: 0.11, rot: -0.85, c: 0 },
			{ t: 'e', cx: 0.70, cy: 0.53, rx: 0.05, ry: 0.11, rot: 0.85, c: 0 },
			{ t: 'e', cx: 0.5, cy: 0.57, rx: 0.045, ry: 0.035, c: 2 },
			{ t: 'l', pts: [[0.20, 0.76], [0.35, 0.72], [0.5, 0.76], [0.65, 0.72], [0.80, 0.76]], c: 2 }
		]
	},

	// ===== 动物 =====
	{
		id: 'butterfly',
		name: '蝴蝶',
		cat: 'animal',
		icon: '🦋',
		palette: ['#6B3FA0', '#C08A1E', '#2E2620', '#F2A0AE'],
		shapes: [
			{ t: 'e', cx: 0.33, cy: 0.42, rx: 0.16, ry: 0.115, rot: -0.42, c: 0 },
			{ t: 'e', cx: 0.67, cy: 0.42, rx: 0.16, ry: 0.115, rot: 0.42, c: 0 },
			{ t: 'e', cx: 0.37, cy: 0.65, rx: 0.115, ry: 0.085, rot: 0.30, c: 1 },
			{ t: 'e', cx: 0.63, cy: 0.65, rx: 0.115, ry: 0.085, rot: -0.30, c: 1 },
			{ t: 'e', cx: 0.5, cy: 0.55, rx: 0.032, ry: 0.16, c: 2 },
			{ t: 'l', pts: [[0.5, 0.40], [0.44, 0.30]], c: 2 },
			{ t: 'l', pts: [[0.5, 0.40], [0.56, 0.30]], c: 2 },
			{ t: 'e', cx: 0.33, cy: 0.42, rx: 0.05, ry: 0.035, rot: -0.42, c: 3 },
			{ t: 'e', cx: 0.67, cy: 0.42, rx: 0.05, ry: 0.035, rot: 0.42, c: 3 }
		]
	},
	{
		id: 'fish',
		name: '锦鲤',
		cat: 'animal',
		icon: '🐟',
		palette: ['#E86A17', '#C8102E', '#2E2620', '#E8C872'],
		shapes: [
			{ t: 'e', cx: 0.52, cy: 0.50, rx: 0.24, ry: 0.13, c: 0 },
			{ t: 'p', pts: [[0.78, 0.42], [0.90, 0.32], [0.88, 0.50], [0.90, 0.68], [0.78, 0.58]], c: 1 },
			{ t: 'e', cx: 0.34, cy: 0.50, rx: 0.045, ry: 0.045, c: 2 },
			{ t: 'a', cx: 0.52, cy: 0.50, rx: 0.11, ry: 0.065, a0: Math.PI * 0.65, a1: Math.PI * 1.35, c: 3 },
			{ t: 'l', pts: [[0.28, 0.42], [0.34, 0.38]], c: 1 },
			{ t: 'l', pts: [[0.28, 0.58], [0.34, 0.62]], c: 1 },
			{ t: 'e', cx: 0.62, cy: 0.44, rx: 0.04, ry: 0.03, c: 3 },
			{ t: 'e', cx: 0.62, cy: 0.56, rx: 0.04, ry: 0.03, c: 3 }
		]
	},

	// ===== 祥纹 =====
	{
		id: 'cloud',
		name: '祥云',
		cat: 'motif',
		icon: '☁️',
		palette: ['#2A4A7F', '#4B6E8A', '#E8C872'],
		shapes: [
			{ t: 'e', cx: 0.5, cy: 0.46, rx: 0.20, ry: 0.11, c: 0 },
			{ t: 'e', cx: 0.33, cy: 0.53, rx: 0.115, ry: 0.085, c: 0 },
			{ t: 'e', cx: 0.67, cy: 0.53, rx: 0.115, ry: 0.085, c: 0 },
			{ t: 'a', cx: 0.5, cy: 0.46, rx: 0.13, ry: 0.06, a0: Math.PI, a1: TAU, c: 2 },
			{ t: 'l', pts: [[0.20, 0.62], [0.80, 0.62]], c: 1 }
		]
	},
	{
		id: 'lantern',
		name: '灯笼',
		cat: 'motif',
		icon: '🏮',
		palette: ['#C8102E', '#C08A1E', '#D4AF37'],
		shapes: [
			{ t: 'e', cx: 0.5, cy: 0.50, rx: 0.20, ry: 0.22, c: 0 },
			{ t: 'p', pts: [[0.36, 0.28], [0.64, 0.28], [0.64, 0.32], [0.36, 0.32]], c: 1 },
			{ t: 'p', pts: [[0.36, 0.68], [0.64, 0.68], [0.64, 0.72], [0.36, 0.72]], c: 1 },
			{ t: 'l', pts: [[0.5, 0.72], [0.5, 0.84]], c: 1 },
			{ t: 'l', pts: [[0.46, 0.84], [0.54, 0.84]], c: 2 }
		]
	}
]

/* ============ 渲染：模板 → 针脚记录 ============ */

/**
 * 把模板转成与手工落针完全一致的针脚记录
 * @param {Object} tpl 模板对象
 * @param {Object} opt { px 画布边长, gear {len,width} 针脚档位, stitchType 针法, seedBase 随机基准 }
 * @returns {Array} 针脚记录数组，结构同 diy 页面的 stitchRecords
 */
export function buildTemplateStitches(tpl, opt) {
	const o = opt || {}
	const px = o.px || 320
	const gear = o.gear || { len: 12, width: 3.6 }
	const type = o.stitchType || 'ping'
	const seedBase = o.seedBase || 104729

	const rowGap = Math.max(7, gear.len * 1.05)
	const fillStep = Math.max(5, gear.len * 0.80)
	const edgeStep = Math.max(3, gear.len * 0.60)

	const palette = (tpl && tpl.palette) || ['#C8102E']
	const shapes = (tpl && tpl.shapes) || []
	const out = []
	let seq = 0

	const makeEmit = (color) => (x, y, ang) => {
		seq += 1
		const seed = seedBase + seq * 7919
		const rnd = rng(seed)
		// 与手工 addStitch 相同的抖动公式，保证质感一致
		const rec = {
			x: Math.min(px - 3, Math.max(3, x)),
			y: Math.min(px - 3, Math.max(3, y)),
			angle: ang + (rnd() - 0.5) * 5,
			type,
			color,
			length: gear.len * (0.92 + rnd() * 0.16),
			width: gear.width * (0.86 + rnd() * 0.28),
			seed
		}
		out.push(rec)
	}

	shapes.forEach((s) => {
		const raw = boundaryOf(s)
		if (!raw || raw.length < 2) return
		// 归一化坐标 → 画布像素坐标（与 px 间距统一到同一坐标空间）
		const poly = raw.map((p) => [p[0] * px, p[1] * px])
		const color = s.color || palette[s.c || 0] || palette[0]
		// 内部缎面填充（仅闭合图形）
		if (s.fill !== false && (s.t === 'e' || s.t === 'p')) {
			fillPoly(poly, rowGap, fillStep, makeEmit(color))
		}
		// 轮廓走针（针向随切线，卡通轮廓更清晰）
		if (s.edge !== false) {
			strokePoly(poly, edgeStep, s.t !== 'a', makeEmit(s.ec || color))
		}
	})

	return out
}

/* ============ 扩展接口 ============ */

// 新增分类（已存在则忽略）
export function registerCategory(cat) {
	if (!cat || !cat.key || !cat.name) return false
	if (TEMPLATE_CATS.some((c) => c.key === cat.key)) return false
	TEMPLATE_CATS.push(cat)
	return true
}

// 新增模板素材（id 重复则忽略），后续接云端素材库时可直接循环调用
export function registerTemplate(tpl) {
	if (!tpl || !tpl.id || !tpl.name || !Array.isArray(tpl.shapes)) return false
	if (TEMPLATE_LIB.some((t) => t.id === tpl.id)) return false
	if (!tpl.cat) tpl.cat = 'motif'
	TEMPLATE_LIB.push(tpl)
	return true
}

// 按分类取模板
export function getTemplates(cat) {
	if (!cat || cat === 'all') return TEMPLATE_LIB.slice()
	return TEMPLATE_LIB.filter((t) => t.cat === cat)
}
