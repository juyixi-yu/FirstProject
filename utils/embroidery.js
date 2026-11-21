/**
 * 婺绣风格化渲染工具
 * 将用户上传图片转化为带有刺绣针脚、绣线质感的婺绣底稿
 *
 * 四种风格：
 *  - cartoon  Q版卡通：圆润色块 + 整齐可爱针脚 + 粗描边
 *  - real     传统原版：色层分明 + 细密缎面针脚 + 层次
 *  - ink      水墨写意：疏密变化 + 长笔触 + 墨晕
 *  - gold     金线描边：清晰金线轮廓 + 内部稀疏
 *
 * 渲染主干：色块底图（先铺清楚边界）→ 结构场方向 → 稀疏缎面针脚 → 风格化处理
 */

// 婺绣传统色板
const WU_PALETTE = [
	[200, 16, 46], [232, 139, 157], [192, 138, 30], [232, 200, 114],
	[42, 74, 127], [59, 122, 87], [107, 63, 160], [46, 38, 32],
	[212, 175, 55], [139, 69, 19], [253, 241, 244], [255, 253, 247]
]

/** 加载图片到离屏画布 */
export function loadImageToCanvas(canvas, src, maxSize) {
	return new Promise((resolve) => {
		const ctx = canvas.getContext('2d')
		const img = canvas.createImage ? canvas.createImage() : (typeof Image !== 'undefined' ? new Image() : null)
		if (!img) return resolve(null)
		img.onload = () => {
			try {
				let w = img.width
				let h = img.height
				const scale = Math.min(1, maxSize / Math.max(w, h))
				w = Math.round(w * scale)
				h = Math.round(h * scale)
				canvas.width = w
				canvas.height = h
				ctx.clearRect(0, 0, w, h)
				ctx.drawImage(img, 0, 0, w, h)
				const imgData = ctx.getImageData(0, 0, w, h)
				resolve({ canvas, ctx, w, h, imgData })
			} catch (e) {
				console.error('[embroidery] 图片绘制或像素读取失败', e)
				resolve(null)
			}
		}
		img.onerror = (e) => {
			console.warn('[embroidery] 图片解码失败', src, e)
			resolve(null)
		}
		img.src = src
	})
}

/** Sobel 边缘检测，返回 { mag[], dir[] } */
function computeEdges(imgData, w, h) {
	const data = imgData.data
	const mag = new Float32Array(w * h)
	const dir = new Float32Array(w * h)
	const gray = new Float32Array(w * h)
	for (let i = 0, p = 0; i < data.length; i += 4, p++) {
		gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
	}
	for (let y = 1; y < h - 1; y++) {
		for (let x = 1; x < w - 1; x++) {
			const i = y * w + x
			const gx = -gray[i - w - 1] - 2 * gray[i - 1] - gray[i + w - 1]
				+ gray[i - w + 1] + 2 * gray[i + 1] + gray[i + w + 1]
			const gy = -gray[i - w - 1] - 2 * gray[i - w] - gray[i - w + 1]
				+ gray[i + w - 1] + 2 * gray[i + w] + gray[i + w + 1]
			mag[i] = Math.sqrt(gx * gx + gy * gy)
			dir[i] = Math.atan2(gy, gx)
		}
	}
	return { mag, dir }
}

/** 方向平滑：对 (x,y) 周围 radius 范围内的梯度方向做加权平均（避免针脚方向混乱） */
function smoothDir(dir, w, h, x, y, radius) {
	let sx = 0, sy = 0, cnt = 0
	for (let dy = -radius; dy <= radius; dy++) {
		for (let dx = -radius; dx <= radius; dx++) {
			const nx = x + dx, ny = y + dy
			if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
			const d = dir[ny * w + nx]
			sx += Math.cos(d)
			sy += Math.sin(d)
			cnt++
		}
	}
	if (cnt === 0) return dir[y * w + x]
	return Math.atan2(sy / cnt, sx / cnt)
}

/** 颜色量化到最近调色板色 */
function quantize(r, g, b, palette) {
	let best = palette[0]
	let bestD = Infinity
	for (const c of palette) {
		const dr = r - c[0], dg = g - c[1], db = b - c[2]
		const d = dr * dr + dg * dg + db * db
		if (d < bestD) { bestD = d; best = c }
	}
	return best
}

/** 绘制麻布织纹底色（可见的经纬织纹 + 细微颗粒 + 天然亚麻色） */
function paintLinenBase(ctx, w, h, baseColor) {
	ctx.fillStyle = baseColor
	ctx.fillRect(0, 0, w, h)
	// 经纬织纹（可见的粗纺纹理）
	ctx.save()
	ctx.globalAlpha = 0.18
	ctx.lineWidth = 1
	const weave = 3
	for (let y = 0; y < h; y += weave) {
		// 横线：亚麻暖棕
		ctx.strokeStyle = 'rgba(155,120,80,0.28)'
		ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke()
	}
	ctx.strokeStyle = 'rgba(140,100,60,0.22)'
	for (let x = 0; x < w; x += weave) {
		ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke()
	}
	ctx.restore()
	// 天然颗粒感（细密噪点，模拟亚麻纤维）
	const imgData = ctx.getImageData(0, 0, w, h)
	const data = imgData.data
	for (let i = 0; i < data.length; i += 4) {
		const n = (Math.sin((i * 12.9898 + w * 78.233) % 43758.5453) * 43758.5453) % 1
		const d = Math.round(n * 10 - 5)
		data[i] = Math.max(0, Math.min(255, data[i] + d))
		data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + d))
		data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + d))
	}
	ctx.putImageData(imgData, 0, 0)
}

/** 绘制单根绣线针脚：立体缎面效果
 *  - 方向相关高光（各向异性反射）
 *  - 侧面投影（3D 立体感）
 *  - 末端线结
 */
function drawStitch(ctx, x, y, angle, len, color, width, alpha) {
	const half = len / 2
	const dx = Math.cos(angle) * half
	const dy = Math.sin(angle) * half
	const x1 = x - dx, y1 = y - dy
	const x2 = x + dx, y2 = y + dy

	ctx.save()
	ctx.globalAlpha = alpha
	ctx.lineCap = 'round'

	// ==== 第一层：侧面投影（立体效果，向右下方偏移，模拟光照） ====
	const shadowOffX = Math.cos(angle + Math.PI / 2) * width * 0.35 + 0.8
	const shadowOffY = Math.sin(angle + Math.PI / 2) * width * 0.35 + 0.8
	ctx.strokeStyle = 'rgba(24,18,12,0.35)'
	ctx.lineWidth = width * 1.05
	ctx.beginPath()
	ctx.moveTo(x1 + shadowOffX, y1 + shadowOffY)
	ctx.lineTo(x2 + shadowOffX, y2 + shadowOffY)
	ctx.stroke()

	// ==== 第二层：丝线两侧暗边（模拟圆丝线截面） ====
	ctx.strokeStyle = shadeColor(color, -0.38)
	ctx.lineWidth = width
	ctx.beginPath()
	ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

	// ==== 第三层：主色层 ====
	ctx.strokeStyle = color
	ctx.lineWidth = width * 0.72
	ctx.beginPath()
	ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

	// ==== 第四层：中心高光带（各向异性反射——丝线沿长度方向反射） ====
	// 用渐变高光：从线的一端到另一端，有亮带，模拟丝线光泽
	const grad = ctx.createLinearGradient(x1 - shadowOffX, y1 - shadowOffY, x2 + shadowOffX, y2 + shadowOffY)
	grad.addColorStop(0, shadeColor(color, 0.2))
	grad.addColorStop(0.5, shadeColor(color, 0.7))
	grad.addColorStop(1, shadeColor(color, 0.15))
	ctx.strokeStyle = grad
	ctx.lineWidth = Math.max(0.8, width * 0.3)
	ctx.beginPath()
	ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()

	// ==== 第五层：末端线结（3D 小凸起，模拟实际针脚打结） ====
	ctx.fillStyle = shadeColor(color, -0.25)
	ctx.beginPath()
	ctx.arc(x1, y1, width * 0.55, 0, Math.PI * 2)
	ctx.fill()
	ctx.beginPath()
	ctx.arc(x2, y2, width * 0.55, 0, Math.PI * 2)
	ctx.fill()
	// 线结高光
	ctx.fillStyle = shadeColor(color, 0.6)
	ctx.beginPath()
	ctx.arc(x1 - width * 0.18, y1 - width * 0.18, width * 0.22, 0, Math.PI * 2)
	ctx.fill()
	ctx.beginPath()
	ctx.arc(x2 - width * 0.18, y2 - width * 0.18, width * 0.22, 0, Math.PI * 2)
	ctx.fill()

	ctx.restore()
}

/** 颜色加深/提亮 amt[-1,1] */
function shadeColor(rgb, amt) {
	if (typeof rgb === 'string') {
		const m = rgb.match(/\d+/g)
		if (!m) return rgb
		rgb = [+m[0], +m[1], +m[2]]
	}
	const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))))
	return `rgb(${f(rgb[0])},${f(rgb[1])},${f(rgb[2])})`
}

function rgbStr(c) { return `rgb(${c[0]},${c[1]},${c[2]})` }

/**
 * 铺色块底图：把图像量化为大色块，作为针脚下方的底色（保证边界清楚）
 * cell 越大色块越整
 */
function paintColorBase(ctx, data, w, h, palette, cell) {
	for (let y = 0; y < h; y += cell) {
		for (let x = 0; x < w; x += cell) {
			const i = (y * w + x) * 4
			const a = data[i + 3]
			if (a < 30) continue
			const q = quantize(data[i], data[i + 1], data[i + 2], palette)
			ctx.fillStyle = `rgba(${q[0]},${q[1]},${q[2]},0.92)`
			ctx.fillRect(x, y, cell, cell)
		}
	}
}

/**
 * 主渲染入口
 * 写实模式：保留 AI 原图细节，只轻叠加织纹与细密针脚肌理（不做色块量化，避免卡通化）
 */
export async function generateEmbroidery(canvas, src, style) {
	const maxSize = 480
	const loaded = await loadImageToCanvas(canvas, src, maxSize)
	if (!loaded) return ''
	const { ctx, w, h, imgData } = loaded
	const data = imgData.data
	const { mag, dir } = computeEdges(imgData, w, h)

	let maxMag = 1
	for (let i = 0; i < mag.length; i++) if (mag[i] > maxMag) maxMag = mag[i]

	// 原图已在画布上，直接叠加写实针脚肌理
	renderRealistic(ctx, data, mag, dir, w, h, maxMag, style)

	// #ifdef H5
	// H5 端 uni.canvasToTempFilePath 必须传 canvasId 且不认 canvas 节点，直接原生导出更可靠
	try {
		const dataUrl = canvas.toDataURL('image/png')
		if (dataUrl) return dataUrl
	} catch (e) {
		console.warn('[embroidery] canvas.toDataURL 失败，改走 uni API', e)
	}
	// #endif

	// #ifndef H5
	// 微信开发者工具的 canvas 节点带有原生 toDataURL（真机没有）：
	// 优先产出 dataURL，避免 http://tmp 临时路径在工具里难以被其他画布再次加载
	try {
		if (typeof canvas.toDataURL === 'function') {
			const dataUrl = canvas.toDataURL('image/png')
			if (dataUrl && dataUrl.length > 100) return dataUrl
		}
	} catch (e) {
		console.warn('[embroidery] 工具 toDataURL 失败（可能跨域污染），改走 canvasToTempFilePath', e)
	}
	// #endif

	return new Promise((resolve) => {
		uni.canvasToTempFilePath({
			canvas,
			canvasId: 'aiCanvas',
			success: (res) => resolve(res.tempFilePath),
			fail: () => {
				// #ifdef H5
				// H5 的 uni.canvasToTempFilePath 依赖 canvasId，取不到时直接用原生 canvas 导出
				try {
					resolve(canvas.toDataURL('image/png'))
					return
				} catch (e) {
					console.warn('[embroidery] canvas 导出失败', e)
				}
				// #endif
				// 真机上偶发导出失败：回退原图，保证至少有结果可看
				resolve(src)
			}
		})
	})
}

/* ============ 写实叠加：保留原图 + 细密针脚肌理（四风格差异化） ============
   不重绘、不量化色块。每风格：像素预处理（定基调）+ 专属针脚参数 + 专属点缀
*/
function renderRealistic(ctx, data, mag, dir, w, h, maxMag, style) {
	// 1. 风格化像素预处理（在原图基础上调性，不改结构）
	applyStyleTone(ctx, w, h, style)

	// 2. 极轻的麻布织纹（让照片有布面感，不遮细节）
	ctx.save()
	ctx.globalAlpha = style === 'gold' ? 0.08 : 0.05
	ctx.lineWidth = 1
	for (let y = 0; y < h; y += 3) {
		ctx.strokeStyle = 'rgba(155,120,80,0.5)'
		ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke()
	}
	for (let x = 0; x < w; x += 3) {
		ctx.strokeStyle = 'rgba(140,100,60,0.4)'
		ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke()
	}
	ctx.restore()

	// 3. 风格化细密针脚
	const cell = 5
	for (let y = 2; y < h - 2; y += cell) {
		for (let x = 2; x < w - 2; x += cell) {
			const i = y * w + x
			const pi = i * 4
			if (data[pi + 3] < 30) continue
			const m = mag[i] / maxMag
			const r0 = data[pi], g0 = data[pi + 1], b0 = data[pi + 2]

			if (style === 'cartoon') {
				// Q版卡通：统一 45° 整齐排列，长短交替，圆润可爱
				const row = Math.floor(y / cell)
				const isLong = (row + Math.floor(x / cell)) % 2 === 0
				drawStitch(ctx, x, y, Math.PI / 4, isLong ? 7 : 4.5,
					`rgb(${r0},${g0},${b0})`, 1.1, 0.24)
			} else if (style === 'ink') {
				// 水墨写意：墨色浓淡驱动疏密，墨浓处长笔触
				const lum = 0.299 * r0 + 0.587 * g0 + 0.114 * b0
				const ink = 1 - lum / 255
				if (ink < 0.12) continue
				const angle = smoothDir(dir, w, h, x, y, 3) + Math.PI / 2
				const shade = Math.round(40 + ink * 30)
				drawStitch(ctx, x, y, angle, 4 + ink * 9,
					`rgb(${shade},${Math.round(shade * 0.85)},${Math.round(shade * 0.7)})`,
					0.8 + ink * 1.0, 0.18 + ink * 0.22)
			} else if (style === 'gold') {
				// 金线描边：内部极稀疏细针脚，轮廓靠下面第 4 步金线
				if ((x + y) % 10 !== 0) continue
				const angle = smoothDir(dir, w, h, x, y, 2) + Math.PI / 2
				drawStitch(ctx, x, y, angle, 5, `rgb(${r0},${g0},${b0})`, 0.9, 0.15)
			} else {
				// 传统原版：随结构方向的缎面细针脚，工整细密
				const angle = smoothDir(dir, w, h, x, y, 2) + Math.PI / 2
				drawStitch(ctx, x, y, angle, 4 + (1 - m) * 4,
					`rgb(${r0},${g0},${b0})`, 0.9 + m * 0.5, 0.18 + m * 0.14)
			}
		}
	}

	// 4. 金线描边：轮廓金线（风格核心，明显可见）
	if (style === 'gold') {
		ctx.save()
		ctx.lineCap = 'round'
		for (let y = 2; y < h - 2; y += 3) {
			for (let x = 2; x < w - 2; x += 3) {
				const i = y * w + x
				const m = mag[i] / maxMag
				if (m > 0.42) {
					const sa = dir[i] + Math.PI / 2
					const len = 4 + m * 6
					// 暗金底 + 亮金线，温润不刺眼
					ctx.strokeStyle = 'rgba(138,90,18,0.55)'
					ctx.lineWidth = 1.4 + m * 0.7
					ctx.beginPath()
					ctx.moveTo(x - Math.cos(sa) * len / 2, y - Math.sin(sa) * len / 2)
					ctx.lineTo(x + Math.cos(sa) * len / 2, y + Math.sin(sa) * len / 2)
					ctx.stroke()
					ctx.strokeStyle = 'rgba(212,175,55,0.6)'
					ctx.lineWidth = 0.9 + m * 0.4
					ctx.beginPath()
					ctx.moveTo(x - Math.cos(sa) * len / 2, y - Math.sin(sa) * len / 2)
					ctx.lineTo(x + Math.cos(sa) * len / 2, y + Math.sin(sa) * len / 2)
					ctx.stroke()
				}
			}
		}
		ctx.restore()
	}
}

/* 风格化像素预处理：在原图上调整体色调（不改构图与细节结构） */
function applyStyleTone(ctx, w, h, style) {
	if (style === 'real') return // 传统原版：保留原色，最写实
	const imgData = ctx.getImageData(0, 0, w, h)
	const d = imgData.data
	for (let i = 0; i < d.length; i += 4) {
		const r = d[i], g = d[i + 1], b = d[i + 2]
		if (style === 'ink') {
			// 彻底去色成黑白灰墨 + 大幅提亮留白（宣纸水墨感）
			const v = 0.299 * r + 0.587 * g + 0.114 * b
			const lift = 0.32
			d[i] = v + (250 - v) * lift
			d[i + 1] = v + (247 - v) * lift
			d[i + 2] = v + (236 - v) * lift
		} else if (style === 'cartoon') {
			// 大幅提亮 + 柔化（粉嫩淡雅）
			const lift = 0.26
			d[i] = r + (255 - r) * lift
			d[i + 1] = g + (255 - g) * lift
			d[i + 2] = b + (255 - b) * lift
		} else if (style === 'gold') {
			// 大幅压暗偏暖（深缎底衬金线）
			d[i] = r * 0.45
			d[i + 1] = g * 0.40
			d[i + 2] = b * 0.30
		}
	}
	ctx.putImageData(imgData, 0, 0)
}

/* ============ 风格一：Q版卡通 ============
   圆润简洁色块、针脚整齐可爱、粗黑描边
*/
function renderCartoon(ctx, data, mag, dir, w, h, maxMag) {
	const palette = [
		[200, 16, 46], [232, 139, 157], [255, 200, 60],
		[59, 122, 87], [42, 74, 127], [107, 63, 160],
		[255, 253, 247], [245, 200, 160]
	]
	// 1. 麻布底（暖米白粗纺）
	paintLinenBase(ctx, w, h, '#FAF3E4')
	// 2. 整色块底图（大色块，边界清楚）
	paintColorBase(ctx, data, w, h, palette, 6)

	// 2. 整齐可爱针脚：细密、统一方向（45°）、长短交替
	const cell = 8
	for (let y = cell / 2; y < h; y += cell) {
		const row = Math.floor(y / cell)
		for (let x = cell / 2; x < w; x += cell) {
			const i = (Math.floor(y) * w + Math.floor(x)) * 4
			if (data[i + 3] < 30) continue
			const q = quantize(data[i], data[i + 1], data[i + 2], palette)
			// 长短交替（模拟卡通绣的整齐排列）
			const isLong = (row + Math.floor(x / cell)) % 2 === 0
			const len = isLong ? 10 : 6
			// 统一 45° 方向，整齐可爱
			const angle = Math.PI / 4
			drawStitch(ctx, x, y, angle, len, rgbStr(q), 1.5, 0.7)
		}
	}

	// 3. 粗黑描边（色块边界）
	ctx.lineCap = 'round'
	for (let y = 3; y < h - 3; y += 2) {
		for (let x = 3; x < w - 3; x += 2) {
			const i = y * w + x
			const m = mag[i] / maxMag
			if (m > 0.42) {
				const sa = dir[i] + Math.PI / 2
				const len = 7 + m * 10
				ctx.strokeStyle = 'rgba(28,20,14,0.9)'
				ctx.lineWidth = 2.6
				ctx.beginPath()
				ctx.moveTo(x - Math.cos(sa) * len / 2, y - Math.sin(sa) * len / 2)
				ctx.lineTo(x + Math.cos(sa) * len / 2, y + Math.sin(sa) * len / 2)
				ctx.stroke()
			}
		}
	}
}

/* ============ 风格二：传统原版 ============
   细密但不杂乱、保留婺绣层次、缎面针脚随轮廓走
*/
function renderReal(ctx, data, mag, dir, w, h, maxMag) {
	// 米白粗纺麻布底
	paintLinenBase(ctx, w, h, '#F8F0DE')

	// 1. 色块底（中度量化，色层分明）
	paintColorBase(ctx, data, w, h, WU_PALETTE, 4)

	// 2. 缎面针脚：细密精致，随结构方向、边缘短密平坦区长疏
	const cell = 5
	for (let y = 2; y < h - 2; y += cell) {
		for (let x = 2; x < w - 2; x += cell) {
			const i = y * w + x
			const pi = i * 4
			if (data[pi + 3] < 30) continue
			const q = quantize(data[pi], data[pi + 1], data[pi + 2], WU_PALETTE)
			const m = mag[i] / maxMag
			// 平滑方向，避免杂乱
			const angle = smoothDir(dir, w, h, x, y, 2) + Math.PI / 2
			// 平坦区长针脚，边缘短针脚（整体细小化）
			const len = m > 0.35 ? 4 + (1 - m) * 2.5 : 7 + (1 - m) * 5
			const width = 1.1 + m * 0.6
			const alpha = 0.68 + m * 0.22
			drawStitch(ctx, x, y, angle, len, rgbStr(q), width, alpha)
		}
	}

	// 3. 强边缘叠深色轮廓线（增强层次感，不乱）
	ctx.lineCap = 'round'
	for (let y = 3; y < h - 3; y += 3) {
		for (let x = 3; x < w - 3; x += 3) {
			const i = y * w + x
			const m = mag[i] / maxMag
			if (m > 0.6) {
				const sa = dir[i] + Math.PI / 2
				ctx.strokeStyle = 'rgba(46,38,32,0.45)'
				ctx.lineWidth = 1.3
				ctx.beginPath()
				ctx.moveTo(x - Math.cos(sa) * 4, y - Math.sin(sa) * 4)
				ctx.lineTo(x + Math.cos(sa) * 4, y + Math.sin(sa) * 4)
				ctx.stroke()
			}
		}
	}
}

/* ============ 风格三：水墨写意 ============
   针脚疏密变化、长笔触流动、墨晕晕染
*/
function renderInk(ctx, data, mag, dir, w, h, maxMag) {
	// 米黄宣纸底（但用亚麻肌理，水墨与织纹融合）
	paintLinenBase(ctx, w, h, '#F2E8D2')

	const cell = 9
	for (let y = cell / 2; y < h; y += cell) {
		for (let x = cell / 2; x < w; x += cell) {
			const i = (Math.floor(y) * w + Math.floor(x)) * 4
			if (data[i + 3] < 30) continue
			const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
			const ink = 1 - lum / 255 // 越暗墨越浓
			if (ink < 0.1) continue
			const angle = smoothDir(dir, w, h, Math.floor(x), Math.floor(y), 3) + Math.PI / 2
			// 墨浓处长笔触，墨淡处短而疏（整体细小化）
			const len = 5 + ink * 12
			const width = 1.0 + ink * 1.8
			const r = Math.round(28 + ink * 22)
			const g = Math.round(22 + ink * 18)
			const b = Math.round(16 + ink * 14)
			const alpha = 0.22 + ink * 0.6
			ctx.save()
			ctx.globalAlpha = alpha
			ctx.lineCap = 'round'
			ctx.strokeStyle = `rgb(${r},${g},${b})`
			ctx.lineWidth = width
			ctx.beginPath()
			ctx.moveTo(x - Math.cos(angle) * len / 2, y - Math.sin(angle) * len / 2)
			ctx.lineTo(x + Math.cos(angle) * len / 2, y + Math.sin(angle) * len / 2)
			ctx.stroke()
			ctx.restore()
		}
	}

	// 墨晕：强边缘处柔化墨团（晕染感）
	for (let y = 6; y < h - 6; y += 10) {
		for (let x = 6; x < w - 6; x += 10) {
			const i = y * w + x
			const m = mag[i] / maxMag
			if (m > 0.45) {
				const grad = ctx.createRadialGradient(x, y, 0, x, y, 7 + m * 9)
				grad.addColorStop(0, 'rgba(28,22,16,0.16)')
				grad.addColorStop(1, 'rgba(28,22,16,0)')
				ctx.fillStyle = grad
				ctx.beginPath()
				ctx.arc(x, y, 7 + m * 9, 0, Math.PI * 2)
				ctx.fill()
			}
		}
	}

	// 朱砂点睛：偏红像素点染
	for (let y = 8; y < h - 8; y += 16) {
		for (let x = 8; x < w - 8; x += 16) {
			const i = (y * w + x) * 4
			const r = data[i], g = data[i + 1], b = data[i + 2]
			if (r > g + 35 && r > b + 35 && r > 110) {
				ctx.fillStyle = 'rgba(175,28,38,0.55)'
				ctx.beginPath()
				ctx.arc(x, y, 2.2, 0, Math.PI * 2)
				ctx.fill()
			}
		}
	}
}

/* ============ 风格四：金线描边 ============
   金线轮廓清晰、内部绣线不过度填充
*/
function renderGold(ctx, data, mag, dir, w, h, maxMag) {
	// 深色粗纺麻布底（凸显金线反光）
	paintLinenBase(ctx, w, h, '#1E1913')

	// 1. 淡色填充层（低饱和，凸显金线）
	const cell = 7
	for (let y = 0; y < h; y += cell) {
		for (let x = 0; x < w; x += cell) {
			const i = (y * w + x) * 4
			if (data[i + 3] < 30) continue
			const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
			const v = Math.round(38 + lum * 0.22)
			ctx.fillStyle = `rgba(${v},${v - 4},${v - 10},0.85)`
			ctx.fillRect(x, y, cell, cell)
		}
	}

	// 2. 金线轮廓：沿边缘画连续金线（清晰不碎）
	ctx.lineCap = 'round'
	for (let y = 2; y < h - 2; y += 2) {
		for (let x = 2; x < w - 2; x += 2) {
			const i = y * w + x
			const m = mag[i] / maxMag
			if (m > 0.3) {
				const sa = dir[i] + Math.PI / 2
				const len = 5 + m * 8
				const x1 = x - Math.cos(sa) * len / 2
				const y1 = y - Math.sin(sa) * len / 2
				const x2 = x + Math.cos(sa) * len / 2
				const y2 = y + Math.sin(sa) * len / 2
				// 暗底
				ctx.strokeStyle = 'rgba(110,72,18,0.9)'
				ctx.lineWidth = 1.8 + m * 1.0
				ctx.beginPath()
				ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
				// 主金
				ctx.strokeStyle = 'rgba(212,175,55,0.96)'
				ctx.lineWidth = 1.2 + m * 0.6
				ctx.beginPath()
				ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
				// 高光
				ctx.strokeStyle = 'rgba(255,240,180,0.92)'
				ctx.lineWidth = Math.max(0.5, 0.4 + m * 0.4)
				ctx.beginPath()
				ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
			}
		}
	}

	// 3. 内部稀疏金色短针脚（点到为止，不过度填充）
	for (let y = 7; y < h - 7; y += 14) {
		for (let x = 7; x < w - 7; x += 14) {
			const i = y * w + x
			const m = mag[i] / maxMag
			if (m < 0.22) {
				const pi = i * 4
				const lum = 0.299 * data[pi] + 0.587 * data[pi + 1] + 0.114 * data[pi + 2]
				const alpha = 0.12 + (lum / 255) * 0.2
				const angle = dir[i] + Math.PI / 2
				ctx.save()
				ctx.globalAlpha = alpha
				ctx.strokeStyle = 'rgba(212,175,55,0.7)'
				ctx.lineWidth = 1
				ctx.lineCap = 'round'
				ctx.beginPath()
				ctx.moveTo(x - Math.cos(angle) * 3.5, y - Math.sin(angle) * 3.5)
				ctx.lineTo(x + Math.cos(angle) * 3.5, y + Math.sin(angle) * 3.5)
				ctx.stroke()
				ctx.restore()
			}
		}
	}
}
