/**
 * 老绣片数字修复
 *
 * 原则：在原图像素上就地修复，不改动构图与形状。
 *   1) 破损检测：低饱和暗斑（污渍）+ 高亮白斑（破洞/撕裂）
 *   2) 修补填充：由外向内逐层用邻近完好像素填充掩膜区
 *   3) 色彩补齐：亮度分位拉伸 + 饱和度提升，还原褪色
 *   4) 线条强化：轻度反锐化，让纹样边缘更清晰
 */
import { loadImageToCanvas } from './embroidery'

/** 把画布满意的结果导出为临时文件 */
function toTempFile(canvas) {
	// #ifdef H5
	// H5 端 uni.canvasToTempFilePath 依赖 canvasId，直接原生导出更可靠
	try {
		const dataUrl = canvas.toDataURL('image/png')
		if (dataUrl) return Promise.resolve(dataUrl)
	} catch (e) {
		console.warn('[restore] canvas.toDataURL 失败，改走 uni API', e)
	}
	// #endif
	return new Promise((resolve) => {
		uni.canvasToTempFilePath({
			canvas,
			canvasId: 'fixCanvas',
			success: (res) => resolve(res.tempFilePath),
			fail: () => resolve('')
		})
	})
}

/** 亮度积分图，用于 O(1) 求局部均值 */
function buildIntegral(lum, w, h) {
	const iw = w + 1
	const ii = new Float64Array(iw * (h + 1))
	for (let y = 0; y < h; y++) {
		let row = 0
		for (let x = 0; x < w; x++) {
			row += lum[y * w + x]
			ii[(y + 1) * iw + (x + 1)] = ii[y * iw + (x + 1)] + row
		}
	}
	return { ii, iw }
}

function meanAt(integ, w, h, x, y, r) {
	const { ii, iw } = integ
	const x0 = Math.max(0, x - r)
	const x1 = Math.min(w - 1, x + r)
	const y0 = Math.max(0, y - r)
	const y1 = Math.min(h - 1, y + r)
	const area = (x1 - x0 + 1) * (y1 - y0 + 1)
	const s = ii[(y1 + 1) * iw + (x1 + 1)] - ii[y0 * iw + (x1 + 1)]
		- ii[(y1 + 1) * iw + x0] + ii[y0 * iw + x0]
	return s / area
}

export async function restoreOldPiece(canvas, src, maxSize = 480) {
	const loaded = await loadImageToCanvas(canvas, src, maxSize)
	if (!loaded) return ''
	const { ctx, w, h, imgData } = loaded
	const data = imgData.data
	const n = w * h

	// ---------- 1. 预统计亮度 / 饱和度 ----------
	const lum = new Float32Array(n)
	const sat = new Float32Array(n)
	for (let i = 0, p = 0; i < n; i++, p += 4) {
		const r = data[p], g = data[p + 1], b = data[p + 2]
		const mx = r > g ? (r > b ? r : b) : (g > b ? g : b)
		const mn = r < g ? (r < b ? r : b) : (g < b ? g : b)
		lum[i] = 0.299 * r + 0.587 * g + 0.114 * b
		sat[i] = mx === 0 ? 0 : (mx - mn) / mx
	}
	const integ = buildIntegral(lum, w, h)

	// ---------- 2. 破损掩膜 ----------
	const mask = new Uint8Array(n)
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = y * w + x
			const L = lum[i]
			const m = meanAt(integ, w, h, x, y, 3)
			// 暗污渍：明显比周围暗，且几乎没有色彩（污垢、霉斑）
			if (sat[i] < 0.26 && L < m * 0.62) mask[i] = 1
			// 破洞/白斑：亮度过高的成片区域
			else if (L > 232 && L > m + 42) mask[i] = 1
		}
	}
	// 去掉孤立噪点，只保留成片的破损，避免误伤正常纹理
	let maskTotal = 0
	for (let i = 0; i < n; i++) if (mask[i]) maskTotal++
	// 保护：若判定面积过大（照片本身偏暗/偏白），收紧条件，只修最明显的破损
	if (maskTotal > n * 0.45) {
		for (let i = 0; i < n; i++) {
			if (!mask[i]) continue
			if (!(sat[i] < 0.18 && lum[i] < 70)) mask[i] = 0
		}
	}
	const clean = new Uint8Array(mask)
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x
			if (!mask[i]) continue
			let c = 0
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (mask[(y + dy) * w + (x + dx)]) c++
				}
			}
			if (c <= 3) clean[i] = 0
		}
	}

	// ---------- 3. 由外向内逐层修补（只遍历破损像素，BFS 逐层推进） ----------
	// state: 0=待修 1=完好/已修 2=已入队
	const state = new Uint8Array(n)
	const damaged = []
	for (let i = 0; i < n; i++) {
		if (clean[i]) damaged.push(i)
		else state[i] = 1
	}
	const totalDamaged = damaged.length
	let remain = totalDamaged

	if (totalDamaged > 0 && totalDamaged < n - 4) {
		let queue = []
		for (let k = 0; k < damaged.length; k++) {
			const i = damaged[k]
			const x = i % w, y = (i - x) / w
			let edge = false
			if (x > 0 && state[i - 1] === 1) edge = true
			if (!edge && x < w - 1 && state[i + 1] === 1) edge = true
			if (!edge && y > 0 && state[i - w] === 1) edge = true
			if (!edge && y < h - 1 && state[i + w] === 1) edge = true
			if (edge) {
				state[i] = 2
				queue.push(i)
			}
		}
		while (queue.length) {
			// 整层先填充（同一层互不污染）
			for (let k = 0; k < queue.length; k++) {
				const i = queue[k]
				const x = i % w, y = (i - x) / w
				let sr = 0, sg = 0, sb = 0, c = 0
				for (let dy = -1; dy <= 1; dy++) {
					const yy = y + dy
					if (yy < 0 || yy >= h) continue
					for (let dx = -1; dx <= 1; dx++) {
						const xx = x + dx
						if (xx < 0 || xx >= w || (!dx && !dy)) continue
						const j = yy * w + xx
						if (state[j] !== 1) continue
						const p = j * 4
						sr += data[p]; sg += data[p + 1]; sb += data[p + 2]
						c++
					}
				}
				if (c > 0) {
					const p = i * 4
					data[p] = sr / c; data[p + 1] = sg / c; data[p + 2] = sb / c; data[p + 3] = 255
					state[i] = 1
					remain--
				}
			}
			// 再把这层的邻居加入下一层
			const next = []
			for (let k = 0; k < queue.length; k++) {
				const i = queue[k]
				const x = i % w, y = (i - x) / w
				for (let dy = -1; dy <= 1; dy++) {
					const yy = y + dy
					if (yy < 0 || yy >= h) continue
					for (let dx = -1; dx <= 1; dx++) {
						const xx = x + dx
						if (xx < 0 || xx >= w) continue
						const j = yy * w + xx
						if (state[j] !== 0) continue
						state[j] = 2
						next.push(j)
					}
				}
			}
			queue = next
		}
	}
	// 仍无法填的孤立/大块破洞：用整体平均色兜底
	if (remain > 0) {
		let ar = 0, ag = 0, ab = 0, ac = 0
		for (let i = 0; i < n; i++) {
			if (state[i] !== 1) continue
			const p = i * 4
			ar += data[p]; ag += data[p + 1]; ab += data[p + 2]; ac++
		}
		if (ac) {
			const mr = ar / ac, mg = ag / ac, mb = ab / ac
			for (let i = 0; i < n; i++) {
				if (state[i] === 1) continue
				const p = i * 4
				data[p] = mr; data[p + 1] = mg; data[p + 2] = mb; data[p + 3] = 255
			}
		}
	}

	// ---------- 4. 色彩补齐（分位拉伸 + 提饱和） ----------
	const hist = new Uint32Array(256)
	for (let i = 0; i < n; i++) {
		let v = lum[i] | 0
		if (v < 0) v = 0
		if (v > 255) v = 255
		hist[v]++
	}
	let p2 = 0, p98 = 255, acc = 0
	const lo = n * 0.02, hi = n * 0.98
	for (let v = 0; v < 256; v++) {
		acc += hist[v]
		if (acc >= lo) { p2 = v; break }
	}
	acc = 0
	for (let v = 0; v < 256; v++) {
		acc += hist[v]
		if (acc >= hi) { p98 = v; break }
	}
	if (p98 - p2 < 30) { p2 = 0; p98 = 255 }
	const lut = new Float32Array(256)
	for (let v = 0; v < 256; v++) {
		let t = (v - p2) / (p98 - p2)
		t = t < 0 ? 0 : (t > 1 ? 1 : t)
		lut[v] = t * 255
	}
	const SAT_K = 1.30
	for (let p = 0; p < data.length; p += 4) {
		let r = lut[data[p] | 0]
		let g = lut[data[p + 1] | 0]
		let b = lut[data[p + 2] | 0]
		const c = (r + g + b) / 3
		r = c + (r - c) * SAT_K
		g = c + (g - c) * SAT_K
		b = c + (b - c) * SAT_K
		data[p] = r < 0 ? 0 : (r > 255 ? 255 : r)
		data[p + 1] = g < 0 ? 0 : (g > 255 ? 255 : g)
		data[p + 2] = b < 0 ? 0 : (b > 255 ? 255 : b)
	}

	// ---------- 5. 线条强化（轻度反锐化） ----------
	const srcCopy = new Uint8ClampedArray(data)
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const p = (y * w + x) * 4
			for (let ch = 0; ch < 3; ch++) {
				let sum = 0
				for (let dy = -1; dy <= 1; dy++) {
					for (let dx = -1; dx <= 1; dx++) {
						sum += srcCopy[((y + dy) * w + (x + dx)) * 4 + ch]
					}
				}
				const blur = sum / 9
				const v = srcCopy[p + ch] + (srcCopy[p + ch] - blur) * 0.45
				data[p + ch] = v < 0 ? 0 : (v > 255 ? 255 : v)
			}
		}
	}

	ctx.putImageData(imgData, 0, 0)
	return toTempFile(canvas)
}
