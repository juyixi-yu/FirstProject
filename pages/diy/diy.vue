<template>
	<view class="diy-page">
		<!-- ===== 顶部栏 ===== -->
		<view class="tb">
			<view class="tb-mid">
				<text class="tb-title">{{ keyMode ? '键盘落针模式' : '自由手作模式' }}</text>
				<text class="tb-sub">已落 {{ stitchRecords.length }} 针</text>
			</view>
			<view class="tb-actions">
				<view class="tb-btn" @tap="undo"><text>撤销</text></view>
				<view class="tb-btn tb-btn-pink" @tap="saveImg"><text>保存</text></view>
			</view>
		</view>

		<!-- ===== 绣布舞台 ===== -->
		<view class="stage">
			<view
				class="cloth-wrap"
				:style="{ width: px + 'px', height: px + 'px', backgroundColor: clothColor }"
			>
				<canvas
					type="2d"
					id="embCanvas"
					canvas-id="embCanvas"
					class="cv"
					:style="{ width: px + 'px', height: px + 'px' }"
					@touchstart="onTouchStart"
					@touchmove.stop.prevent="onTouchMove"
					@touchend="onTouchEnd"
				></canvas>
				<!-- 十字准星 -->
				<view v-if="keyMode || tool === 'stitch'" class="crosshair" :style="{ left: cur.x + 'px', top: cur.y + 'px' }">
					<view class="ch-h"></view>
					<view class="ch-v"></view>
					<view class="ch-ring"></view>
					<view class="ch-dot" :style="{ background: color }"></view>
				</view>
			</view>
			<text class="stage-tip">{{ tipText }}</text>
		</view>

		<!-- ===== 模式切换 ===== -->
		<view class="mode-row">
			<view class="mode-btn" :class="{ on: keyMode }" @tap="keyMode = true">
				<text class="mode-ico">⌨️</text><text>键盘落针</text>
			</view>
			<view class="mode-btn" :class="{ on: !keyMode }" @tap="keyMode = false">
				<text class="mode-ico">✍️</text><text>自由手作</text>
			</view>
		</view>

		<!-- ===== 键盘落针控制台 ===== -->
		<view class="kbd-card">
			<view class="kbd-head">
				<text class="kbd-title">{{ keyMode ? '落针控制台 · 键盘可用' : '落针控制台' }}</text>
				<view class="kbd-tools">
					<text class="kbd-hint">{{ keyMode ? '方向键移针 / 空格落针' : '点方向键移针位' }}</text>
					<view class="clear-chip" @tap="clearCanvas"><text>清空</text></view>
				</view>
			</view>
			<view class="kbd-body">
				<view class="dpad">
					<view class="dp dp-up" @tap="moveCursor(0, -1)"></view>
					<view class="dp dp-left" @tap="moveCursor(-1, 0)"></view>
					<view class="dp dp-mid"></view>
					<view class="dp dp-right" @tap="moveCursor(1, 0)"></view>
					<view class="dp dp-down" @tap="moveCursor(0, 1)"></view>
				</view>
				<view class="kbd-drop" @tap="dropStitch">
					<text class="kd-ico">🪡</text>
					<text class="kd-txt">落针</text>
					<text class="kd-key">空格</text>
				</view>
				<view class="kbd-side">
					<view class="ks-item" @tap="rotate(-15)"><text>↺</text></view>
					<view class="ks-angle">{{ angle }}°</view>
					<view class="ks-item" @tap="rotate(15)"><text>↻</text></view>
					<view class="ks-grid" @tap="cycleGrid">{{ grid }}px</view>
				</view>
			</view>
			<view class="kbd-legend" v-if="keyMode">
				<text class="lg">↑↓←→ 移针</text>
				<text class="lg">空格 落针</text>
				<text class="lg">1-9 换线</text>
				<text class="lg">A/B/C 换针法</text>
				<text class="lg">Z 撤销</text>
				<text class="lg">Q/E 转针</text>
			</view>
		</view>

		<!-- ===== 工具 ===== -->
		<view class="panel">
			<view class="panel-head">
				<text class="panel-title">工具箱</text>
			</view>
			<view class="tool-row">
				<view
					class="tool"
					:class="{ on: tool === t.key }"
					v-for="t in tools"
					:key="t.key"
					@tap="pickTool(t.key)"
				>
					<text class="tool-ico">{{ t.icon }}</text>
					<text class="tool-name">{{ t.name }}</text>
				</view>
			</view>
		</view>

		<!-- ===== 针法 ===== -->
		<view class="panel">
			<view class="panel-head">
				<text class="panel-title">针法纹样</text>
				<text class="panel-note">快捷键 A / B / C / D</text>
			</view>
			<view class="scroll-x">
				<view
					class="chip"
					:class="{ on: stitchType === s.key }"
					v-for="s in stitchTypes"
					:key="s.key"
					@tap="setStitch(s.key)"
				>
					<text class="chip-key">{{ s.hotkey }}</text>
					<text class="chip-name">{{ s.name }}</text>
					<text class="chip-desc">{{ s.desc }}</text>
				</view>
			</view>
			<view class="sub-row">
				<text class="sub-label">针脚</text>
				<view class="size-list">
					<view
						class="sz"
						:class="{ on: sizeGear === k }"
						v-for="k in ['s', 'm', 'l']"
						:key="k"
						@tap="setGear(k)"
					>
						<text>{{ gears[k].name }}</text>
					</view>
				</view>
			</view>
			<view class="sub-row">
				<text class="sub-label">针向</text>
				<view class="size-list">
					<view
						class="sz"
						:class="{ on: angle === a }"
						v-for="a in [0, 45, 90, 135]"
						:key="a"
						@tap="angle = a"
					>
						<text>{{ a }}°</text>
					</view>
					<view class="sz" @tap="rotate(-15)"><text>↺</text></view>
					<view class="sz" @tap="rotate(15)"><text>↻</text></view>
				</view>
			</view>
		</view>

		<!-- ===== 绣线颜色 ===== -->
		<view class="panel">
			<view class="panel-head">
				<text class="panel-title">绣线</text>
				<text class="panel-note">数字键 1 - 9</text>
			</view>
			<view class="color-row">
				<view
					class="color-item"
					v-for="(c, i) in colorList"
					:key="c.hex"
					@tap="setColor(c.hex)"
				>
					<view
						class="color-dot"
						:class="{ on: color === c.hex }"
						:style="{ backgroundColor: c.hex }"
					></view>
					<text class="color-no" :class="{ on: color === c.hex }">{{ i + 1 }}</text>
				</view>
			</view>
		</view>

		<!-- ===== 布色 / 花边 / 尺寸 ===== -->
		<view class="panel">
			<view class="panel-head"><text class="panel-title">绣布</text></view>

			<view class="sub-row">
				<text class="sub-label">布色</text>
				<view class="cloth-colors">
					<view
						class="cc"
						:class="{ on: clothColor === c.hex }"
						v-for="c in clothColors"
						:key="c.hex"
						:style="{ backgroundColor: c.hex }"
						@tap="clothColor = c.hex; drawAll()"
					></view>
				</view>
			</view>

			<view class="sub-row">
				<text class="sub-label">花边</text>
				<view class="border-list">
					<view
						class="bd"
						:class="{ on: borderStyle === b.key }"
						v-for="b in borderList"
						:key="b.key"
						@tap="borderStyle = b.key; drawAll()"
					>
						<text>{{ b.name }}</text>
					</view>
				</view>
			</view>

			<view class="sub-row">
				<text class="sub-label">尺寸</text>
				<view class="size-list">
					<view
						class="sz"
						:class="{ on: sizeKey === s.key }"
						v-for="s in sizeList"
						:key="s.key"
						@tap="setSize(s.key)"
					>
						<text>{{ s.name }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- ===== 底部操作 ===== -->
		<view class="bottom-bar">
			<view class="bb" @tap="undo"><text class="bb-ico">↶</text><text>撤销</text></view>
			<view class="bb" @tap="clearCanvas"><text class="bb-ico">🧹</text><text>清空</text></view>
			<view class="bb" @tap="saveImg"><text class="bb-ico">💾</text><text>保存</text></view>
			<view class="bb bb-pink" @tap="onShare"><text class="bb-ico">💗</text><text>分享</text></view>
		</view>

		<!-- ===== 文字弹窗 ===== -->
		<view class="modal" v-if="showTextModal" @tap="showTextModal = false">
			<view class="modal-box" @tap.stop>
				<text class="modal-title">绣上文字</text>
				<input
					class="modal-input"
					v-model="textInput"
					maxlength="12"
					placeholder="如：婺绣新生"
					placeholder-class="ph"
				/>
				<view class="modal-actions">
					<view class="ma ma-ghost" @tap="showTextModal = false">取消</view>
					<view class="ma ma-pink" @tap="confirmText">绣到布上</view>
				</view>
			</view>
		</view>

		<!-- ===== 图案库弹窗 ===== -->
		<view class="modal" v-if="showPatModal" @tap="showPatModal = false">
			<view class="modal-box modal-box-wide" @tap.stop>
				<text class="modal-title">图案库 · 矢量纹样</text>
				<scroll-view scroll-y class="pat-scroll">
					<view class="pat-grid">
						<view class="pat" v-for="(p, i) in patLib" :key="i" @tap="placePat(p)">
							<text class="pat-ico">{{ p.icon }}</text>
							<text class="pat-name">{{ p.name }}</text>
						</view>
					</view>
				</scroll-view>
				<view class="modal-actions">
					<view class="ma ma-ghost" @tap="showPatModal = false">关闭</view>
				</view>
			</view>
		</view>

		<!-- ===== 模板库弹窗 ===== -->
		<view class="modal" v-if="showTplModal" @tap="showTplModal = false">
			<view class="modal-box modal-box-wide" @tap.stop>
				<text class="modal-title">模板库 · 卡通纹样</text>
				<text class="tpl-tip">点选模板即按当前针法落针，可继续修改或撤销</text>

				<view class="tpl-cats">
					<view
						class="tpl-cat"
						:class="{ on: tplCat === c.key }"
						v-for="c in tplCats"
						:key="c.key"
						@tap="tplCat = c.key"
					>
						<text>{{ c.name }}</text>
					</view>
				</view>

				<scroll-view scroll-y class="tpl-scroll">
					<view class="tpl-grid">
						<view class="tpl" v-for="t in tplList" :key="t.id" @tap="applyTemplate(t)">
							<text class="tpl-ico">{{ t.icon }}</text>
							<text class="tpl-name">{{ t.name }}</text>
							<text class="tpl-cat-txt">{{ catName(t.cat) }}</text>
						</view>
					</view>
				</scroll-view>

				<view class="modal-actions">
					<view class="ma ma-ghost" @tap="showTplModal = false">关闭</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { img } from '../../utils/cloud'
import { TEMPLATE_CATS, getTemplates, buildTemplateStitches } from '../../utils/templates'
// 针脚大小档位（长度 / 线宽，单位 px）
const GEARS = {
	s: { name: '小', len: 8, width: 2.4 },
	m: { name: '中', len: 12, width: 3.6 },
	l: { name: '大', len: 18, width: 5.4 }
}

// 绣线色板（数字键 1-9 对应）
const COLORS = [
	{ hex: '#C8102E', name: '中国红' },
	{ hex: '#E88B9D', name: '桃粉' },
	{ hex: '#C08A1E', name: '鎏金' },
	{ hex: '#2A4A7F', name: '青花蓝' },
	{ hex: '#3B7A57', name: '松绿' },
	{ hex: '#6B3FA0', name: '紫檀' },
	{ hex: '#2E2620', name: '墨黑' },
	{ hex: '#D4AF37', name: '明黄' },
	{ hex: '#8B4513', name: '檀棕' }
]

// 针法（A/B/C/D）
const STITCH_TYPES = [
	{ key: 'ping', hotkey: 'A', name: '平针绣', desc: '平顺匀净' },
	{ key: 'panjin', hotkey: 'B', name: '盘金绣', desc: '金线盘绕' },
	{ key: 'jiezi', hotkey: 'C', name: '结子绣', desc: '绕结成珠' },
	{ key: 'suo', hotkey: 'D', name: '锁针绣', desc: '环环相扣' }
]

// 布色
const CLOTH_COLORS = [
	{ hex: '#FFFDF7', name: '米白' },
	{ hex: '#FDF1F4', name: '藕粉' },
	{ hex: '#EDF3F7', name: '月白' },
	{ hex: '#F4EADB', name: '茶褐' },
	{ hex: '#EAF2E6', name: '豆绿' }
]

// 花边
const BORDERS = [
	{ key: 'none', name: '无' },
	{ key: 'meander', name: '回纹' },
	{ key: 'cloud', name: '云纹' },
	{ key: 'wave', name: '水波' },
	{ key: 'flower', name: '小花' }
]

// 图案库：emoji + 矢量纹样
const PAT_LIB = [
	{ kind: 'vec', key: 'plum', name: '梅花', icon: '❀' },
	{ kind: 'vec', key: 'cloud', name: '祥云', icon: '☁' },
	{ kind: 'vec', key: 'meander', name: '回纹', icon: '⛩' },
	{ kind: 'vec', key: 'leaf', name: '缠枝', icon: '🌿' },
	{ kind: 'vec', key: 'wave', name: '水波', icon: '〜' },
	{ kind: 'vec', key: 'diamond', name: '菱格', icon: '◇' },
	{ kind: 'emoji', key: '牡丹', name: '牡丹', icon: '🌸' },
	{ kind: 'emoji', key: '蝴蝶', name: '蝴蝶', icon: '🦋' },
	{ kind: 'emoji', key: '灯笼', name: '灯笼', icon: '🏮' },
	{ kind: 'emoji', key: '明月', name: '明月', icon: '🌙' },
	{ kind: 'emoji', key: '翠竹', name: '翠竹', icon: '🎋' },
	{ kind: 'emoji', key: '爱心', name: '爱心', icon: '♡' }
]

export default {
	data() {
		return {
			// 画布
			px: 320,
			sizeKey: 'm',
			canvas: null,
			ctx: null,
			imgCache: {},
			rect: null,

			// 模式 / 工具
			keyMode: true,
			tool: 'stitch',

			// 刺绣参数
			stitchType: 'ping',
			color: '#C8102E',
			angle: 0,
			grid: 12,
			sizeGear: 'm',
			gears: GEARS,

			// 十字准星
			cur: { x: 160, y: 160 },
			drawing: false,

			// 作品数据
			stitchRecords: [],
			anchor: null,
			texts: [],
			stickers: [],
			images: [],

			// 历史（撤销）
			history: [],

			// 弹窗
			showTextModal: false,
			textInput: '',
			showPatModal: false,

			// 模板库
			showTplModal: false,
			tplCat: 'all',
			tplCats: TEMPLATE_CATS,

			// 配置
			colorList: COLORS,
			stitchTypes: STITCH_TYPES,
			clothColors: CLOTH_COLORS,
			borderList: BORDERS,
			patLib: PAT_LIB,
			clothColor: '#FFFDF7',
			borderStyle: 'none',
			sizeList: [],

			tools: [
				{ key: 'tpl', icon: '📖', name: '模板库' },
				{ key: 'stitch', icon: '🪡', name: '落针' },
				{ key: 'draw', icon: '✍️', name: '手绘' },
				{ key: 'text', icon: '🅰️', name: '文字' },
				{ key: 'pat', icon: '🌸', name: '图案' },
				{ key: 'image', icon: '🖼️', name: '插图' },
				{ key: 'scissors', icon: '✂️', name: '剪刀' }
			]
		}
	},
	computed: {
		tipText() {
			if (this.tool === 'draw') return '在绣布上滑动即可手绘，可配合绣线颜色'
			if (this.tool === 'scissors') return '点按要拆掉的针脚或图案，即可剪除'
			if (this.tool === 'text') return '点按绣布选位置，再输入文字'
			if (this.tool === 'pat') return '点按绣布选位置，再挑选图案'
			if (this.tool === 'image') return '点下方「插图」按钮从相册选图'
			return this.keyMode ? '方向键移动准星，空格落针' : '点按绣布即落一针，也可用控制台微调'
		},
		tplList() {
			return getTemplates(this.tplCat)
		}
	},
	onReady() {
		this.buildSizes()
		this.$nextTick(() => {
			setTimeout(() => this.initCanvas(), 60)
		})
		this.bindKeys()
	},
	onShow() {
		if (this.ctx) this.drawAll()
		this.checkImportedPattern()
		// #ifdef H5
		this.bindKeys()
		// #endif
	},
	onUnload() {
		this.unbindKeys()
	},
	methods: {
		// ===== 尺寸配置 =====
		buildSizes() {
			const sys = uni.getSystemInfoSync()
			const avail = Math.min(sys.windowWidth - 44, 400)
			this.sizeList = [
				{ key: 's', name: '小', px: Math.round(avail * 0.76) },
				{ key: 'm', name: '中', px: Math.round(avail * 0.88) },
				{ key: 'l', name: '大', px: avail }
			]
			const def = this.sizeList.find((s) => s.key === 'm')
			this.px = def ? def.px : avail
			this.cur = { x: Math.round(this.px / 2 / this.grid) * this.grid, y: Math.round(this.px / 2 / this.grid) * this.grid }
			this.syncRect()
		},

		// ===== 画布初始化 =====
		initCanvas() {
			const sys = uni.getSystemInfoSync()
			const dpr = sys.pixelRatio || 2
			const px = this.px
			uni.createSelectorQuery()
				.select('#embCanvas')
				.fields({ node: true, size: true })
				.exec((res) => {
					let canvas = res && res[0] && res[0].node
					// #ifdef H5
					if (!canvas && typeof document !== 'undefined') {
						const el = document.getElementById('embCanvas')
						if (el) {
							canvas = el.tagName === 'CANVAS' ? el : (el.querySelector ? el.querySelector('canvas') : null)
						}
					}
					// #endif
					if (!canvas || !canvas.getContext) {
						// 开发者工具/真机首屏可能查不到节点，延迟重试，避免画布永远不初始化
						if (!this._initRetried) {
							this._initRetried = true
							console.warn('[diy] 画布节点未就绪，300ms 后重试')
							setTimeout(() => this.initCanvas(), 300)
						} else {
							console.warn('[diy] 画布节点获取失败')
							uni.showModal({
								title: '导入诊断',
								content: '画布节点获取失败（#embCanvas）',
								showCancel: false
							})
						}
						return
					}
					this._initRetried = false
					canvas.width = px * dpr
					canvas.height = px * dpr
					const ctx = canvas.getContext('2d')
					if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0)
					ctx.scale(dpr, dpr)
					this.canvas = canvas
					this.ctx = ctx
					console.log('[diy] 画布就绪')
					this.restore()
					this.drawAll()
					this.checkImportedPattern()
				})
			this.syncRect()
		},

		// 记录画布在屏幕上的位置（H5 触摸坐标换算用）
		syncRect() {
			setTimeout(() => {
				uni.createSelectorQuery()
					.select('#embCanvas')
					.boundingClientRect((r) => {
						if (r) this.rect = r
					})
					.exec()
			}, 80)
		},

		// ===== 从定制页导入底稿作为描底参考 =====
		checkImportedPattern() {
			const app = getApp()
			if (!app || !app.globalData || !app.globalData.customImportPattern) return
			// onShow 先于画布初始化触发，此时 canvas 不存在（小程序端无法 new Image），
			// 轮询等待画布就绪；超时给出可见提示，避免静默失败
			if (!this.canvas) {
				this._importRetries = (this._importRetries || 0) + 1
				if (this._importRetries <= 15) {
					setTimeout(() => this.checkImportedPattern(), 200)
				} else {
					this._importRetries = 0
					uni.showModal({
						title: '导入诊断',
						content: '画布初始化超时，底稿无法导入',
						showCancel: false
					})
				}
				return
			}
			this._importRetries = 0
			const path = app.globalData.customImportPattern
			app.globalData.customImportPattern = null
			console.log('[diy] 开始导入底稿:', String(path).slice(0, 60))
			try {
				this.loadImage(path).then((img) => {
					if (!img) {
						uni.showToast({ title: '底稿导入失败', icon: 'none' })
						return
					}
					this.pushHistory()
					this.images.push({
						path,
						x: 0,
						y: 0,
						w: this.px,
						h: this.px,
						opacity: 0.45
					})
					let drawErr = ''
					try { this.drawAll() } catch (e) { drawErr = String(e && e.message || e) }
					// 临时诊断：确认图片解码尺寸与绘制结果，定位"加载成功但不显示"
					uni.showModal({
						title: '导入诊断',
						content: '图片尺寸 ' + (img.width || 0) + 'x' + (img.height || 0) + (drawErr ? '，绘制异常: ' + drawErr : '，已执行绘制'),
						showCancel: false
					})
				})
			} catch (e) {
				uni.showModal({
					title: '导入诊断',
					content: '导入异常: ' + String(e && e.message || e),
					showCancel: false
				})
			}
		},

		// ===== 通用图片加载：支持本地路径、网络 URL、临时文件 =====
		loadImage(src) {
			return new Promise((resolve) => {
				if (this.imgCache[src]) return resolve(this.imgCache[src])

				// 本地路径或临时文件：直接加载
				if (/^(wxfile|http|\/|file|data:)/.test(src)) {
					this._createImg(src, resolve)
					return
				}

				// 其他情况先下载再加载
				uni.downloadFile({
					url: src,
					timeout: 30000,
					success: (d) => {
						if (d.statusCode === 200 && d.tempFilePath) {
							this._createImg(d.tempFilePath, resolve)
						} else {
							resolve(null)
						}
					},
					fail: () => resolve(null)
				})
			})
		},

		_createImg(src, resolve) {
			let img = null
			try {
				if (this.canvas && this.canvas.createImage) img = this.canvas.createImage()
				else if (typeof Image !== 'undefined') img = new Image()
			} catch (e) { img = null }
			if (!img) return resolve(null)
			let done = false
			const finish = (r) => {
				if (done) return
				done = true
				clearTimeout(timer)
				resolve(r)
			}
			// 部分端图片加载可能静默悬挂，超时兜底，保证至少有失败提示
			const timer = setTimeout(() => {
				console.warn('[diy] 图片加载超时:', String(src).slice(0, 80))
				finish(null)
			}, 10000)
			img.onload = () => {
				this.imgCache[src] = img
				finish(img)
			}
			img.onerror = (e) => {
				console.warn('[diy] 图片加载失败:', String(src).slice(0, 80), e)
				finish(null)
			}
			img.src = src
		},

		// ===== 全量重绘 =====
		drawAll() {
			const ctx = this.ctx
			if (!ctx) return
			const w = this.px

			ctx.clearRect(0, 0, w, w)

			// 布色
			ctx.fillStyle = this.clothColor
			ctx.fillRect(0, 0, w, w)

			// 布纹：淡淡的灰色小格子（光标吸附基准）
			ctx.save()
			ctx.strokeStyle = 'rgba(140,135,125,0.28)'
			ctx.lineWidth = 1
			for (let x = 0; x <= w; x += this.grid) {
				ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, w); ctx.stroke()
			}
			for (let y = 0; y <= w; y += this.grid) {
				ctx.beginPath(); ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); ctx.stroke()
			}
			ctx.restore()

			// 花边
			this.drawBorder(ctx, w, this.borderStyle)

			// 插入图片
			this.images.forEach((im) => {
				const img = this.imgCache[im.path]
				if (img) {
					ctx.save()
					if (im.opacity) ctx.globalAlpha = im.opacity
					try {
						ctx.drawImage(img, im.x, im.y, im.w, im.h)
					} catch (e) {
						// 不再静默吞掉：图片绘制失败时给出提示，便于定位"导入后不显示"
						console.warn('[diy] drawImage 失败:', e)
						if (!this._drawImgErrShown) {
							this._drawImgErrShown = true
							uni.showToast({ title: '底稿绘制失败: ' + (e && e.message || '未知'), icon: 'none' })
						}
					}
					ctx.restore()
				} else {
					console.warn('[diy] 图片不在缓存中:', String(im.path).slice(0, 60))
				}
			})

			// 针脚（键盘落针与手绘拾针共用同一套渲染）
			this.stitchRecords.forEach((r) => this.drawOneStitch(ctx, r))

			// 图案
			this.stickers.forEach((s) => this.drawSticker(ctx, s))

			// 文字
			this.texts.forEach((t) => {
				ctx.save()
				ctx.fillStyle = t.color
				ctx.font = `${t.size}px "Songti SC", "STSong", serif`
				ctx.textBaseline = 'top'
				ctx.fillText(t.text, t.x, t.y)
				ctx.restore()
			})

			this.persist()
		},

		// ===== 作品持久化：重开页面样子不变 =====
		persist() {
			if (this._persistTimer) clearTimeout(this._persistTimer)
			this._persistTimer = setTimeout(() => {
				this._persistTimer = null
				try {
					uni.setStorageSync('wy_diy_art', {
						s: this.stitchRecords,
						t: this.texts,
						p: this.stickers,
						i: this.images.map((x) => ({ path: x.path, x: x.x, y: x.y, w: x.w, h: x.h, opacity: x.opacity }))
					})
				} catch (e) {}
			}, 400)
		},
		restore() {
			let d = null
			try { d = uni.getStorageSync('wy_diy_art') } catch (e) { d = null }
			if (!d || !d.s || !d.s.length) return
			this.stitchRecords = d.s
			this.texts = d.t || []
			this.stickers = d.p || []
			this.images = d.i || []
			const jobs = this.images.map((im) => this.loadImage(im.path))
			if (jobs.length) Promise.all(jobs).then(() => this.drawAll())
		},

		// ===== 花边绘制 =====
		drawBorder(ctx, w, style) {
			if (!style || style === 'none') return
			ctx.save()
			ctx.strokeStyle = 'rgba(192,138,30,0.75)'
			ctx.lineWidth = 2
			ctx.lineCap = 'round'
			const m = 9
			const step = Math.max(14, Math.round(w / 14))

			if (style === 'meander') {
				for (let x = m; x < w - m; x += step) {
					ctx.beginPath()
					ctx.moveTo(x, m); ctx.lineTo(x + step * 0.65, m)
					ctx.lineTo(x + step * 0.65, m + 7); ctx.lineTo(x + step * 0.3, m + 7)
					ctx.stroke()
					ctx.beginPath()
					ctx.moveTo(x + 2, w - m); ctx.lineTo(x + step * 0.65, w - m)
					ctx.lineTo(x + step * 0.65, w - m - 7); ctx.lineTo(x + step * 0.3, w - m - 7)
					ctx.stroke()
				}
				for (let y = m; y < w - m; y += step) {
					ctx.beginPath()
					ctx.moveTo(m, y); ctx.lineTo(m, y + step * 0.65)
					ctx.lineTo(m + 7, y + step * 0.65); ctx.lineTo(m + 7, y + step * 0.3)
					ctx.stroke()
					ctx.beginPath()
					ctx.moveTo(w - m, y); ctx.lineTo(w - m, y + step * 0.65)
					ctx.lineTo(w - m - 7, y + step * 0.65); ctx.lineTo(w - m - 7, y + step * 0.3)
					ctx.stroke()
				}
			} else if (style === 'cloud') {
				const r = 6
				for (let x = m + r; x < w - m; x += r * 2) {
					ctx.beginPath(); ctx.arc(x, m + 2, r, Math.PI, 0); ctx.stroke()
					ctx.beginPath(); ctx.arc(x, w - m - 2, r, 0, Math.PI); ctx.stroke()
				}
				for (let y = m + r; y < w - m; y += r * 2) {
					ctx.beginPath(); ctx.arc(m + 2, y, r, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke()
					ctx.beginPath(); ctx.arc(w - m - 2, y, r, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke()
				}
			} else if (style === 'wave') {
				const amp = 4
				const period = 16
				const drawS = (yBase, dir) => {
					ctx.beginPath()
					for (let x = m; x <= w - m; x += 2) {
						const y = yBase + Math.sin((x / period) * Math.PI * 2) * amp * dir
						if (x === m) ctx.moveTo(x, y)
						else ctx.lineTo(x, y)
					}
					ctx.stroke()
				}
				drawS(m + amp, 1)
				drawS(w - m - amp, -1)
				ctx.beginPath()
				for (let y = m; y <= w - m; y += 2) {
					const x1 = m + amp + Math.sin((y / period) * Math.PI * 2) * amp
					if (y === m) ctx.moveTo(x1, y)
					else ctx.lineTo(x1, y)
				}
				ctx.stroke()
				ctx.beginPath()
				for (let y = m; y <= w - m; y += 2) {
					const x2 = w - m - amp + Math.sin((y / period) * Math.PI * 2) * amp
					if (y === m) ctx.moveTo(x2, y)
					else ctx.lineTo(x2, y)
				}
				ctx.stroke()
			} else if (style === 'flower') {
				const gap = 18
				for (let x = m + 6; x < w - m; x += gap) {
					this.miniFlower(ctx, x, m + 4, 4)
					this.miniFlower(ctx, x, w - m - 4, 4)
				}
				for (let y = m + 6; y < w - m; y += gap) {
					this.miniFlower(ctx, m + 4, y, 4)
					this.miniFlower(ctx, w - m - 4, y, 4)
				}
			}
			ctx.restore()
		},

		miniFlower(ctx, x, y, r) {
			for (let i = 0; i < 5; i++) {
				const a = (i / 5) * Math.PI * 2
				ctx.beginPath()
				ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.65, 0, Math.PI * 2)
				ctx.stroke()
			}
		},

		// ===== 单针绘制（真实绣线质感） =====
		drawOneStitch(ctx, r) {
			const rad = (r.angle * Math.PI) / 180
			const dx = Math.cos(rad)
			const dy = Math.sin(rad)
			// 两端略延长，让相邻针脚自然搭接，形成连贯线迹
			const half = r.length / 2 + r.width * 0.16
			const p0 = { x: r.x - dx * half, y: r.y - dy * half }
			const p1 = { x: r.x + dx * half, y: r.y + dy * half }

			if (r.type === 'panjin') this.stitchPanjin(ctx, p0, p1, r)
			else if (r.type === 'jiezi') this.stitchKnot(ctx, r)
			else if (r.type === 'suo') this.stitchChain(ctx, p0, p1, r)
			else this.stitchFlat(ctx, p0, p1, r)
		},

		// 稳定伪随机（同一 seed 重绘结果一致）
		rng(seed) {
			let s = Math.floor(seed || 1) % 2147483647
			if (s <= 0) s += 2147483646
			return () => {
				s = (s * 16807) % 2147483647
				return (s - 1) / 2147483646
			}
		},

		// 颜色明暗：amt > 0 提亮，amt < 0 加深
		shade(hex, amt) {
			let h = String(hex).replace('#', '')
			if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
			let r = parseInt(h.substring(0, 2), 16)
			let g = parseInt(h.substring(2, 4), 16)
			let b = parseInt(h.substring(4, 6), 16)
			if (isNaN(r) || isNaN(g) || isNaN(b)) return hex
			if (amt >= 0) {
				r += (255 - r) * amt
				g += (255 - g) * amt
				b += (255 - b) * amt
			} else {
				r *= 1 + amt
				g *= 1 + amt
				b *= 1 + amt
			}
			return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
		},

		// 一针绣线：填充式轮廓（两端收成线头），圆柱渐变 + 丝股条纹 + 底部压痕
		// 线身全程不透明 → 后绣的针会完全盖住先绣的针，不会透叠混色
		threadLine(ctx, p0, p1, color, width, seed) {
			const rnd = this.rng(seed)
			const dx = p1.x - p0.x
			const dy = p1.y - p0.y
			const len = Math.sqrt(dx * dx + dy * dy) || 1
			const ux = dx / len
			const uy = dy / len
			const nx = -uy
			const ny = ux
			const hw = Math.max(1.1, width / 2)
			const bow = (rnd() - 0.5) * width * 0.30
			const mx = (p0.x + p1.x) / 2
			const my = (p0.y + p1.y) / 2

			// 中线（带轻微弓形，像线被拉紧的弧度）
			const at = (t) => {
				const b = Math.sin(Math.PI * t) * bow
				return { x: p0.x + dx * t + nx * b, y: p0.y + dy * t + ny * b }
			}
			// 截面半宽：线头收成一半宽、端面是平的 → 不是圆头胶囊
			const halfAt = (t) => {
				const ct = Math.min(1, Math.max(0, t))
				return hw * (0.50 + 0.50 * Math.sin(Math.PI * ct))
			}
			const outline = (ox, oy, scale) => {
				const N = 12
				ctx.beginPath()
				for (let i = 0; i <= N; i++) {
					const p = at(i / N)
					const w = halfAt(i / N) * scale
					const x = p.x + nx * w + ox
					const y = p.y + ny * w + oy
					if (i === 0) ctx.moveTo(x, y)
					else ctx.lineTo(x, y)
				}
				for (let i = N; i >= 0; i--) {
					const p = at(i / N)
					const w = halfAt(i / N) * scale
					ctx.lineTo(p.x - nx * w + ox, p.y - ny * w + oy)
				}
				ctx.closePath()
			}

			// 1. 布面压痕：深色轮廓略下移放大，只在下缘露出一圈 → 线陷进布里
			ctx.save()
			ctx.fillStyle = '#2A1A0C'
			ctx.globalAlpha = 0.32
			outline(0.6, 1.7, 1.18)
			ctx.fill()
			ctx.globalAlpha = 0.20
			outline(0.2, 0.9, 1.06)
			ctx.fill()
			ctx.restore()

			// 2. 线身：不透明圆柱渐变（两侧暗边、中间高光）
			ctx.save()
			ctx.globalAlpha = 1
			const g = ctx.createLinearGradient(
				mx - nx * hw, my - ny * hw,
				mx + nx * hw, my + ny * hw
			)
			g.addColorStop(0.00, this.shade(color, -0.62))
			g.addColorStop(0.14, this.shade(color, -0.26))
			g.addColorStop(0.34, this.shade(color, 0.30))
			g.addColorStop(0.48, this.shade(color, 0.46))
			g.addColorStop(0.64, this.shade(color, 0.04))
			g.addColorStop(0.84, this.shade(color, -0.32))
			g.addColorStop(1.00, this.shade(color, -0.64))
			ctx.fillStyle = g
			outline(0, 0, 1)
			ctx.fill()
			ctx.restore()

			// 3. 丝股条纹（实色，剪裁在针脚轮廓内）→ 看得出是丝线捻股而不是一块色块
			ctx.save()
			outline(0, -0, 0.94)
			ctx.clip()
			ctx.lineCap = 'butt'
			const strands = [
				{ o: -0.54, t: -0.22 },
				{ o: 0.02, t: 0.20 },
				{ o: 0.54, t: -0.36 }
			]
			strands.forEach((s) => {
				ctx.strokeStyle = this.shade(color, s.t)
				ctx.lineWidth = Math.max(0.5, hw * 0.34)
				ctx.beginPath()
				for (let i = 0; i <= 10; i++) {
					const p = at(i / 10)
					const x = p.x + nx * s.o * hw
					const y = p.y + ny * s.o * hw
					if (i === 0) ctx.moveTo(x, y)
					else ctx.lineTo(x, y)
				}
				ctx.stroke()
			})

			// 4. 捻纹：斜向短线，模拟丝线绞合的纹路
			const twists = Math.min(6, Math.max(1, Math.floor(len / 3.2)))
			ctx.lineWidth = Math.max(0.45, hw * 0.22)
			for (let i = 1; i <= twists; i++) {
				const t = i / (twists + 1)
				const p = at(t)
				ctx.strokeStyle = this.shade(color, i % 2 ? 0.22 : -0.18)
				ctx.globalAlpha = 0.55
				ctx.beginPath()
				ctx.moveTo(p.x + nx * halfAt(t) * 0.92, p.y + ny * halfAt(t) * 0.92)
				ctx.lineTo(
					p.x - nx * halfAt(t) * 0.92 + ux * 0.7,
					p.y - ny * halfAt(t) * 0.92 + uy * 0.7
				)
				ctx.stroke()
			}
			ctx.globalAlpha = 1
			ctx.restore()

			// 5. 边缘散开的细纤维（实色短线，少量，不夸张）
			ctx.save()
			ctx.lineCap = 'round'
			const hairs = 2 + Math.floor(rnd() * 3)
			for (let i = 0; i < hairs; i++) {
				const t = 0.12 + rnd() * 0.76
				const p = at(t)
				const side = rnd() < 0.5 ? -1 : 1
				const w0 = halfAt(t) * 0.85
				const out = halfAt(t) * (1.02 + rnd() * 0.28)
				const drift = (rnd() - 0.5) * width * 0.7
				ctx.globalAlpha = 0.62 + rnd() * 0.22
				ctx.strokeStyle = this.shade(color, side > 0 ? -0.24 : 0.18)
				ctx.lineWidth = Math.max(0.4, width * 0.07)
				ctx.beginPath()
				ctx.moveTo(p.x + nx * side * w0, p.y + ny * side * w0)
				ctx.lineTo(
					p.x + nx * side * out + ux * drift,
					p.y + ny * side * out + uy * drift
				)
				ctx.stroke()
			}
			ctx.restore()
		},

		stitchFlat(ctx, p0, p1, r) {
			this.threadLine(ctx, p0, p1, r.color, r.width, r.seed)
		},

		stitchPanjin(ctx, p0, p1, r) {
			const gold = (r.color === '#C08A1E' || r.color === '#D4AF37') ? '#D9B44A' : r.color
			this.threadLine(ctx, p0, p1, gold, r.width * 1.05, r.seed)

			// 金线盘绕：斜向丝纹，实色压在线身上
			const dx = p1.x - p0.x
			const dy = p1.y - p0.y
			const len = Math.sqrt(dx * dx + dy * dy) || 1
			const ux = dx / len
			const uy = dy / len
			const nx = -uy
			const ny = ux
			const count = Math.max(2, Math.min(7, Math.floor(len / Math.max(2, r.width * 0.9))))
			ctx.save()
			ctx.lineCap = 'butt'
			ctx.lineWidth = Math.max(0.5, r.width * 0.22)
			for (let i = 1; i < count; i++) {
				const t = (i / count) * 0.84 + 0.08
				const cx = p0.x + dx * t
				const cy = p0.y + dy * t
				const w = r.width * 0.42
				ctx.globalAlpha = 0.66
				ctx.strokeStyle = i % 2 ? '#FFF3C4' : '#8A6A20'
				ctx.beginPath()
				ctx.moveTo(cx + nx * w - ux * 0.5, cy + ny * w - uy * 0.5)
				ctx.lineTo(cx - nx * w + ux * 0.5, cy - ny * w + uy * 0.5)
				ctx.stroke()
			}
			ctx.restore()
		},

		stitchKnot(ctx, r) {
			const rad = Math.max(1.6, r.width * 0.85)
			ctx.save()
			// 布面压痕
			ctx.globalAlpha = 0.34
			ctx.fillStyle = '#2A1A0C'
			ctx.beginPath()
			ctx.arc(r.x + 0.9, r.y + 1.5, rad * 1.10, 0, Math.PI * 2)
			ctx.fill()

			// 绕结成珠：不透明径向渐变 → 后针完全遮挡
			ctx.globalAlpha = 1
			const g = ctx.createRadialGradient(r.x - rad * 0.38, r.y - rad * 0.42, rad * 0.10, r.x, r.y, rad)
			g.addColorStop(0, this.shade(r.color, 0.62))
			g.addColorStop(0.45, this.shade(r.color, 0.18))
			g.addColorStop(0.78, this.shade(r.color, -0.22))
			g.addColorStop(1, this.shade(r.color, -0.58))
			ctx.fillStyle = g
			ctx.beginPath()
			ctx.arc(r.x, r.y, rad, 0, Math.PI * 2)
			ctx.fill()

			// 缠绕丝圈（深色实线）
			ctx.strokeStyle = this.shade(r.color, -0.42)
			ctx.lineWidth = Math.max(0.6, rad * 0.18)
			ctx.beginPath()
			ctx.arc(r.x, r.y, rad * 0.62, Math.PI * 0.12, Math.PI * 1.02)
			ctx.stroke()
			// 一点丝光
			ctx.strokeStyle = this.shade(r.color, 0.70)
			ctx.lineWidth = Math.max(0.5, rad * 0.16)
			ctx.beginPath()
			ctx.arc(r.x - rad * 0.10, r.y - rad * 0.12, rad * 0.72, Math.PI * 1.10, Math.PI * 1.62)
			ctx.stroke()
			ctx.restore()
		},

		stitchChain(ctx, p0, p1, r) {
			const dx = p1.x - p0.x
			const dy = p1.y - p0.y
			const len = Math.sqrt(dx * dx + dy * dy) || 1
			const loops = Math.max(1, Math.round(len / Math.max(3, r.width * 2.6)))
			const ang = Math.atan2(dy, dx)
			for (let i = 0; i < loops; i++) {
				const t = (i + 0.5) / loops
				const cx = p0.x + dx * t
				const cy = p0.y + dy * t
				const rr = Math.min(r.width * 1.05, len / 2)
				ctx.save()
				// 布面压痕
				ctx.globalAlpha = 0.30
				ctx.strokeStyle = '#2A1A0C'
				ctx.lineWidth = Math.max(0.9, r.width * 0.62)
				ctx.beginPath()
				if (ctx.ellipse) ctx.ellipse(cx + 0.7, cy + 1.4, rr, rr * 0.72, ang, 0, Math.PI * 2)
				else ctx.arc(cx + 0.7, cy + 1.4, rr, 0, Math.PI * 2)
				ctx.stroke()

				// 链环本体：不透明深边
				ctx.globalAlpha = 1
				ctx.strokeStyle = this.shade(r.color, -0.42)
				ctx.lineWidth = Math.max(0.8, r.width * 0.52)
				ctx.beginPath()
				if (ctx.ellipse) ctx.ellipse(cx, cy, rr, rr * 0.72, ang, 0, Math.PI * 2)
				else ctx.arc(cx, cy, rr, 0, Math.PI * 2)
				ctx.stroke()

				// 内芯亮面
				ctx.strokeStyle = this.shade(r.color, 0.16)
				ctx.lineWidth = Math.max(0.6, r.width * 0.30)
				ctx.beginPath()
				if (ctx.ellipse) ctx.ellipse(cx, cy - rr * 0.10, rr * 0.96, rr * 0.66, ang, 0, Math.PI * 2)
				else ctx.arc(cx, cy, rr * 0.9, 0, Math.PI * 2)
				ctx.stroke()

				// 丝光
				ctx.strokeStyle = this.shade(r.color, 0.62)
				ctx.lineWidth = Math.max(0.5, r.width * 0.12)
				ctx.beginPath()
				if (ctx.ellipse) ctx.ellipse(cx, cy - rr * 0.22, rr * 0.70, rr * 0.38, ang, Math.PI * 1.05, Math.PI * 1.78)
				else ctx.arc(cx, cy, rr * 0.7, Math.PI * 1.05, Math.PI * 1.78)
				ctx.stroke()
				ctx.restore()
			}
		},

		// ===== 图案绘制 =====
		drawSticker(ctx, s) {
			ctx.save()
			if (s.kind === 'emoji') {
				ctx.font = `${s.size}px sans-serif`
				ctx.textAlign = 'center'
				ctx.textBaseline = 'middle'
				ctx.fillText(s.key, s.x, s.y)
			} else {
				this.drawVector(ctx, s.key, s.x, s.y, s.size, s.color)
			}
			ctx.restore()
		},

		drawVector(ctx, key, x, y, size, color) {
			const r = size / 2
			ctx.strokeStyle = color
			ctx.fillStyle = color
			ctx.lineWidth = Math.max(1.2, size / 22)
			ctx.lineCap = 'round'
			ctx.lineJoin = 'round'

			if (key === 'plum') {
				for (let i = 0; i < 5; i++) {
					const a = -Math.PI / 2 + (i / 5) * Math.PI * 2
					ctx.beginPath()
					ctx.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.42, 0, Math.PI * 2)
					ctx.stroke()
				}
				ctx.beginPath(); ctx.arc(x, y, r * 0.16, 0, Math.PI * 2); ctx.fill()
			} else if (key === 'cloud') {
				ctx.lineWidth = Math.max(1.5, size / 16)
				ctx.beginPath()
				ctx.arc(x, y - r * 0.18, r * 0.55, Math.PI * 0.15, Math.PI * 0.85)
				ctx.stroke()
				ctx.beginPath()
				ctx.arc(x - r * 0.5, y + r * 0.18, r * 0.36, Math.PI * 0.55, Math.PI * 1.55)
				ctx.stroke()
				ctx.beginPath()
				ctx.arc(x + r * 0.5, y + r * 0.18, r * 0.36, Math.PI * 1.45, Math.PI * 0.45)
				ctx.stroke()
			} else if (key === 'meander') {
				ctx.beginPath()
				ctx.moveTo(x - r, y - r)
				ctx.lineTo(x - r, y + r)
				ctx.lineTo(x + r, y + r)
				ctx.lineTo(x + r, y - r * 0.2)
				ctx.lineTo(x - r * 0.3, y - r * 0.2)
				ctx.lineTo(x - r * 0.3, y + r * 0.4)
				ctx.stroke()
			} else if (key === 'leaf') {
				ctx.beginPath()
				ctx.moveTo(x, y + r)
				ctx.quadraticCurveTo(x + r, y, x, y - r)
				ctx.quadraticCurveTo(x - r, y, x, y + r)
				ctx.stroke()
				ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x, y - r); ctx.stroke()
			} else if (key === 'wave') {
				ctx.beginPath()
				for (let i = -r; i <= r; i += 2) {
					const yy = y + Math.sin((i / r) * Math.PI * 1.6) * r * 0.38
					if (i === -r) ctx.moveTo(x + i, yy)
					else ctx.lineTo(x + i, yy)
				}
				ctx.stroke()
			} else if (key === 'diamond') {
				ctx.beginPath()
				ctx.moveTo(x, y - r); ctx.lineTo(x + r, y)
				ctx.lineTo(x, y + r); ctx.lineTo(x - r, y)
				ctx.closePath(); ctx.stroke()
				ctx.beginPath()
				ctx.moveTo(x, y - r * 0.5); ctx.lineTo(x + r * 0.5, y)
				ctx.lineTo(x, y + r * 0.5); ctx.lineTo(x - r * 0.5, y)
				ctx.closePath(); ctx.stroke()
			}
		},

		// ===== 工具切换 =====
		pickTool(key) {
			this.tool = key
			if (key === 'tpl') {
				// 模板库是动作型入口，不改变当前落针工具
				this.tool = 'stitch'
				this.showTplModal = true
			}
			if (key === 'image') this.pickImage()
			if (key === 'text') this.showTextModal = true
			if (key === 'pat') this.showPatModal = true
		},

		catName(key) {
			const c = this.tplCats.find((x) => x.key === key)
			return c ? c.name : ''
		},

		// 选择模板：转成针脚记录后直接落到绣布上（即所见即所得的绣针预览）
		applyTemplate(tpl) {
			if (!this.ctx) {
				uni.showToast({ title: '绣布还在准备中，稍后再试', icon: 'none' })
				return
			}
			const recs = buildTemplateStitches(tpl, {
				px: this.px,
				gear: this.gears[this.sizeGear],
				stitchType: this.stitchType
			})
			if (!recs.length) return
			this.pushHistory()
			this.stitchRecords = this.stitchRecords.concat(recs)
			this.showTplModal = false
			this.tool = 'stitch'
			this.drawAll()
			uni.showToast({ title: '「' + tpl.name + '」已落针，可继续修改或撤销', icon: 'none' })
		},

		setStitch(k) {
			this.stitchType = k
		},
		setGear(k) {
			if (!this.gears[k]) return
			this.sizeGear = k
		},
		setColor(hex) {
			this.color = hex
		},
		rotate(d) {
			this.angle = (((this.angle + d) % 360) + 360) % 360
		},
		cycleGrid() {
			const arr = [6, 12, 18, 24]
			const i = arr.indexOf(this.grid)
			this.grid = arr[(i + 1) % arr.length]
			this.snapCursor()
		},

		// ===== 光标：始终吸附到格子交叉点 =====
		snapCursor() {
			const g = this.grid
			const maxI = Math.max(1, Math.floor(this.px / g) - 1)
			const ix = Math.max(1, Math.min(maxI, Math.round(this.cur.x / g)))
			const iy = Math.max(1, Math.min(maxI, Math.round(this.cur.y / g)))
			this.cur = { x: ix * g, y: iy * g }
		},
		clampCursor() {
			this.snapCursor()
		},
		moveCursor(dx, dy) {
			const g = this.grid
			const maxI = Math.max(1, Math.floor(this.px / g) - 1)
			const ix = Math.max(1, Math.min(maxI, Math.round(this.cur.x / g) + dx))
			const iy = Math.max(1, Math.min(maxI, Math.round(this.cur.y / g) + dy))
			this.cur = { x: ix * g, y: iy * g }
		},
		setCursorAt(x, y) {
			this.cur = { x, y }
			this.snapCursor()
		},

		// ===== 落针 =====
		// 一针一针地记，长短粗细带轻微随机，但同 seed 重绘结果不变
		addStitch(x, y, angle, lenOverride) {
			const seed = (this.stitchRecords.length + 1) * 7919 + 104729
			const rnd = this.rng(seed)
			const gear = this.gears[this.sizeGear]
			const rec = {
				x,
				y,
				angle: angle + (rnd() - 0.5) * 4,
				type: this.stitchType,
				color: this.color,
				length: (lenOverride || gear.len) * (0.92 + rnd() * 0.16),
				width: gear.width * (0.86 + rnd() * 0.28),
				seed
			}
			this.stitchRecords.push(rec)
			return rec
		},

		dropStitch() {
			if (!this.ctx) return
			this.pushHistory()
			this.addStitch(this.cur.x, this.cur.y, this.angle)
			this.drawAll()
			try { uni.vibrateShort && uni.vibrateShort({ type: 'light' }) } catch (e) {}
		},

		// ===== 触摸 =====
		getPos(e) {
			const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || null
			if (!t) return { x: 0, y: 0 }
			let x = t.x
			let y = t.y
			if (x === undefined) {
				const cx = t.clientX
				const cy = t.clientY
				const r = this.rect || { left: 0, top: 0 }
				x = cx - r.left
				y = cy - r.top
			}
			return { x, y }
		},

		onTouchStart(e) {
			const p = this.getPos(e)
			if (this.tool === 'draw') {
				this.pushHistory()
				this.drawing = true
				this.anchor = p
			} else if (this.tool === 'scissors') {
				this.cutAt(p.x, p.y)
			} else {
				this.setCursorAt(p.x, p.y)
				if (this.tool === 'text') this.showTextModal = true
				else if (this.tool === 'pat') this.showPatModal = true
				else if (this.tool === 'stitch' && !this.keyMode) this.dropStitch()
			}
		},
		// 手绘不做画笔涂抹，而是沿路径一针一针地绣，和键盘落针质感完全一致
		onTouchMove(e) {
			if (this.tool !== 'draw' || !this.drawing || !this.anchor) return
			const p = this.getPos(e)
			const gear = this.gears[this.sizeGear]
			const step = Math.max(2.5, gear.len * 0.85)
			let guard = 0
			while (guard++ < 60) {
				const dx = p.x - this.anchor.x
				const dy = p.y - this.anchor.y
				const d = Math.sqrt(dx * dx + dy * dy)
				if (d < step) break
				const ux = dx / d
				const uy = dy / d
				const rec = this.addStitch(
					this.anchor.x + (ux * step) / 2,
					this.anchor.y + (uy * step) / 2,
					(Math.atan2(dy, dx) * 180) / Math.PI,
					step * 1.12
				)
				this.drawOneStitch(this.ctx, rec)
				this.anchor = { x: this.anchor.x + ux * step, y: this.anchor.y + uy * step }
			}
		},
		onTouchEnd() {
			if (this.drawing) {
				this.drawing = false
				this.anchor = null
				this.persist()
			}
		},

		// ===== 剪刀剪除 =====
		cutAt(x, y) {
			let hit = null
			let min = 26
			this.stitchRecords.forEach((s, i) => {
				const d = Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2)
				if (d < min) { min = d; hit = { type: 'stitch', i } }
			})
			if (!hit) {
				this.stickers.forEach((s, i) => {
					const d = Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2)
					if (d < s.size * 0.7 && d < min) { min = d; hit = { type: 'sticker', i } }
				})
			}
			if (!hit) {
				this.texts.forEach((t, i) => {
					const d = Math.sqrt((t.x + t.size - x) ** 2 + (t.y + t.size / 2 - y) ** 2)
					if (d < t.size * 1.4 && d < min) { min = d; hit = { type: 'text', i } }
				})
			}
			if (!hit) {
				uni.showToast({ title: '这里没有可剪的针脚', icon: 'none' })
				return
			}
			this.pushHistory()
			if (hit.type === 'stitch') this.stitchRecords.splice(hit.i, 1)
			if (hit.type === 'sticker') this.stickers.splice(hit.i, 1)
			if (hit.type === 'text') this.texts.splice(hit.i, 1)
			this.drawAll()
		},

		// ===== 文字 =====
		confirmText() {
			const txt = (this.textInput || '').trim()
			if (!txt) {
				uni.showToast({ title: '请输入文字', icon: 'none' })
				return
			}
			this.pushHistory()
			this.texts.push({
				text: txt,
				x: this.cur.x,
				y: this.cur.y,
				size: 22,
				color: this.color
			})
			this.showTextModal = false
			this.textInput = ''
			this.tool = 'stitch'
			this.drawAll()
		},

		// ===== 图案 =====
		placePat(p) {
			this.pushHistory()
			this.stickers.push({
				kind: p.kind,
				key: p.kind === 'emoji' ? p.icon : p.key,
				name: p.name,
				x: this.cur.x,
				y: this.cur.y,
				size: 46,
				color: this.color
			})
			this.showPatModal = false
			this.tool = 'stitch'
			this.drawAll()
		},

		// ===== 插图 =====
		pickImage() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					const path = res.tempFilePaths[0]
					this.loadImage(path).then((img) => {
						if (!img) {
							uni.showToast({ title: '图片读取失败', icon: 'none' })
							return
						}
						let iw = img.width || 100
						let ih = img.height || 100
						const max = this.px * 0.45
						const scale = Math.min(max / iw, max / ih, 1)
						iw = iw * scale
						ih = ih * scale
						this.pushHistory()
						this.images.push({
							path,
							x: this.cur.x - iw / 2,
							y: this.cur.y - ih / 2,
							w: iw,
							h: ih
						})
						this.tool = 'stitch'
						this.drawAll()
					})
				}
			})
		},
		loadImage(src) {
			return new Promise((resolve) => {
				if (this.imgCache[src]) return resolve(this.imgCache[src])
				let img = null
				try {
					if (this.canvas && this.canvas.createImage) img = this.canvas.createImage()
					else if (typeof Image !== 'undefined') img = new Image()
				} catch (e) { img = null }
				if (!img) return resolve(null)
				img.onload = () => {
					this.imgCache[src] = img
					resolve(img)
				}
				img.onerror = () => resolve(null)
				img.src = src
			})
		},

		// ===== 撤销 / 清空 =====
		pushHistory() {
			this.history.push(JSON.stringify({
				s: this.stitchRecords,
				t: this.texts,
				p: this.stickers,
				i: this.images.map((x) => ({ path: x.path, x: x.x, y: x.y, w: x.w, h: x.h }))
			}))
			if (this.history.length > 25) this.history.shift()
		},
		undo() {
			if (!this.history.length) {
				uni.showToast({ title: '没有可撤销的操作', icon: 'none' })
				return
			}
			const snap = JSON.parse(this.history.pop())
			this.stitchRecords = snap.s
			this.texts = snap.t
			this.stickers = snap.p
			this.images = snap.i
			this.drawAll()
		},
		clearCanvas() {
			const total = this.stitchRecords.length + this.texts.length + this.stickers.length + this.images.length
			if (total === 0) {
				uni.showToast({ title: '绣布已经是空的', icon: 'none' })
				return
			}
			uni.showModal({
				title: '一键清空',
				content: '确定要全部擦掉吗？擦掉之后不能恢复。',
				confirmText: '确定清空',
				confirmColor: '#E16A85',
				cancelText: '取消',
				success: (r) => {
					if (!r.confirm) return
					this.stitchRecords = []
					this.texts = []
					this.stickers = []
					this.images = []
					this.history = []
					this.drawAll()
				}
			})
		},

		// ===== 尺寸切换 =====
		setSize(key) {
			if (key === this.sizeKey) return
			const item = this.sizeList.find((s) => s.key === key)
			if (!item) return
			this.pushHistory()
			const r = item.px / this.px

			this.stitchRecords.forEach((s) => {
				s.x *= r; s.y *= r; s.length *= r; s.width *= r
			})
			this.texts.forEach((t) => { t.x *= r; t.y *= r; t.size *= r })
			this.stickers.forEach((s) => { s.x *= r; s.y *= r; s.size *= r })
			this.images.forEach((im) => { im.x *= r; im.y *= r; im.w *= r; im.h *= r })
			this.cur = { x: this.cur.x * r, y: this.cur.y * r }

			this.sizeKey = key
			this.px = item.px
			this.ctx = null
			this.$nextTick(() => {
				setTimeout(() => this.initCanvas(), 60)
			})
		},

		// ===== 键盘 =====
		bindKeys() {
			// #ifdef H5
			if (this._keyHandler) return
			this._keyHandler = (e) => {
				const k = e.key
				const code = e.code
				if (code === 'Space' || k === ' ') {
					e.preventDefault(); this.dropStitch(); return
				}
				if (k === 'ArrowUp') { e.preventDefault(); this.moveCursor(0, -1); return }
				if (k === 'ArrowDown') { e.preventDefault(); this.moveCursor(0, 1); return }
				if (k === 'ArrowLeft') { e.preventDefault(); this.moveCursor(-1, 0); return }
				if (k === 'ArrowRight') { e.preventDefault(); this.moveCursor(1, 0); return }
				if (k === 'q' || k === 'Q') { this.rotate(-15); return }
				if (k === 'e' || k === 'E') { this.rotate(15); return }
				if (k === 'z' || k === 'Z') { this.undo(); return }
				if (k === 'Backspace') { e.preventDefault(); this.undo(); return }
				if (k >= '1' && k <= '9') {
					const idx = Number(k) - 1
					if (this.colorList[idx]) this.color = this.colorList[idx].hex
					return
				}
				const up = (k || '').toUpperCase()
				if (up === 'A') { this.stitchType = 'ping'; return }
				if (up === 'B') { this.stitchType = 'panjin'; return }
				if (up === 'C') { this.stitchType = 'jiezi'; return }
				if (up === 'D') { this.stitchType = 'suo'; return }
			}
			document.addEventListener('keydown', this._keyHandler)
			// #endif
		},
		unbindKeys() {
			// #ifdef H5
			if (this._keyHandler) {
				document.removeEventListener('keydown', this._keyHandler)
				this._keyHandler = null
			}
			// #endif
		},

		// ===== 保存 / 分享 =====
		saveImg() {
			if (!this.canvas) {
				uni.showToast({ title: '画布还没准备好', icon: 'none' })
				return
			}
			this.drawAll()
			uni.showLoading({ title: '正在生成绣品…' })
			setTimeout(() => {
				uni.canvasToTempFilePath({
					canvas: this.canvas,
					canvasId: 'embCanvas',
					success: (res) => {
						// #ifdef H5
						const a = document.createElement('a')
						a.href = res.tempFilePath
						a.download = '婺绣作品.png'
						document.body.appendChild(a)
						a.click()
						document.body.removeChild(a)
						uni.hideLoading()
						uni.showToast({ title: '已开始下载', icon: 'success' })
						// #endif
						// #ifndef H5
						uni.saveImageToPhotosAlbum({
							filePath: res.tempFilePath,
							success: () => {
								uni.hideLoading()
								uni.showToast({ title: '已保存到相册', icon: 'success' })
							},
							fail: (err) => {
								uni.hideLoading()
								const msg = (err && err.errMsg) || ''
								if (msg.indexOf('auth') !== -1 || msg.indexOf('deny') !== -1) {
									uni.showModal({
										title: '需要相册权限',
										content: '请在设置中开启相册权限后重试',
										confirmText: '去设置',
										success: (r) => { if (r.confirm) uni.openSetting() }
									})
								} else {
									uni.showToast({ title: '保存失败', icon: 'none' })
								}
							}
						})
						// #endif
					},
					fail: () => {
						uni.hideLoading()
						uni.showToast({ title: '生成失败', icon: 'none' })
					}
				})
			}, 120)
		},
		onShare() {
			// #ifdef MP-WEIXIN
			uni.showToast({ title: '点右上角「···」转发给好友', icon: 'none' })
			// #endif
			// #ifndef MP-WEIXIN
			uni.showToast({ title: '请使用浏览器/系统分享', icon: 'none' })
			// #endif
		}
	},
	onShareAppMessage() {
		return {
			title: '我一针一线绣了幅婺绣作品，快来试试～',
			path: '/pages/diy/diy',
			imageUrl: img('diy-cover-full.jpg')
		}
	},
	onShareTimeline() {
		return { title: '婺韵焕兴 · 线上刺绣 DIY' }
	}
}
</script>

<style>
.diy-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #FFF6F8 0%, #FBE8EE 55%, #F7DFE7 100%);
	padding-bottom: 40rpx;
}

/* ===== 顶部栏 ===== */
.tb {
	display: flex;
	align-items: center;
	padding: 18rpx 24rpx;
	background: rgba(255, 255, 255, 0.72);
	border-bottom: 1rpx solid rgba(232, 139, 157, 0.22);
}
.tb-mid { flex: 1; display: flex; flex-direction: column; align-items: flex-start; }
.tb-title {
	font-family: "Songti SC", "STSong", serif;
	font-size: 27rpx; color: #7A4450; letter-spacing: 3rpx;
}
.tb-sub { font-size: 19rpx; color: #C08A9B; margin-top: 4rpx; }
.tb-actions { display: flex; gap: 10rpx; }
.tb-btn {
	padding: 10rpx 20rpx;
	font-size: 22rpx; color: #B9647A;
	border-radius: 999rpx;
	background: #fff;
	border: 1rpx solid rgba(232, 139, 157, 0.45);
}
.tb-btn-pink {
	color: #fff; font-weight: 600;
	background: linear-gradient(135deg, #F6A5B8, #E16A85);
	border-color: transparent;
}

/* ===== 舞台 ===== */
.stage { display: flex; flex-direction: column; align-items: center; padding: 28rpx 0 8rpx; }
.cloth-wrap {
	position: relative;
	border-radius: 22rpx;
	overflow: hidden;
	box-shadow: 0 12rpx 32rpx rgba(190, 110, 135, 0.22), 0 0 0 6rpx #fff inset;
	transition: width 0.2s, height 0.2s;
}
.cv { position: absolute; left: 0; top: 0; }

/* 十字准星 */
.crosshair { position: absolute; width: 0; height: 0; pointer-events: none; z-index: 6; }
.ch-h {
	position: absolute; left: -18px; top: -1px;
	width: 36px; height: 2px; background: rgba(225, 106, 133, 0.85);
}
.ch-v {
	position: absolute; left: -1px; top: -18px;
	width: 2px; height: 36px; background: rgba(225, 106, 133, 0.85);
}
.ch-ring {
	position: absolute; left: -7px; top: -7px;
	width: 14px; height: 14px; border-radius: 50%;
	border: 2px solid rgba(225, 106, 133, 0.9);
}
.ch-dot {
	position: absolute; left: -2.5px; top: -2.5px;
	width: 5px; height: 5px; border-radius: 50%;
}
.stage-tip {
	margin-top: 14rpx; font-size: 21rpx; color: #B98C9B; letter-spacing: 1rpx;
}

/* ===== 模式切换 ===== */
.mode-row { display: flex; gap: 16rpx; margin: 12rpx 24rpx 0; }
.mode-btn {
	flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx;
	height: 72rpx; font-size: 25rpx; color: #A87583;
	background: #fff; border-radius: 999rpx;
	border: 1rpx solid rgba(232, 139, 157, 0.35);
}
.mode-btn.on {
	color: #fff; font-weight: 600;
	background: linear-gradient(135deg, #F6A5B8, #E16A85);
	border-color: transparent;
	box-shadow: 0 6rpx 16rpx rgba(225, 106, 133, 0.32);
}
.mode-ico { font-size: 28rpx; }

/* ===== 键盘控制台 ===== */
.kbd-card {
	margin: 20rpx 24rpx 0;
	padding: 24rpx;
	background: #fff;
	border-radius: 24rpx;
	border: 1rpx solid rgba(232, 139, 157, 0.28);
	box-shadow: 0 8rpx 24rpx rgba(190, 110, 135, 0.12);
}
.kbd-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 18rpx; }
.kbd-title { font-size: 25rpx; color: #7A4450; font-weight: 600; letter-spacing: 2rpx; }
.kbd-hint { font-size: 19rpx; color: #C9A2AE; }
.kbd-tools { display: flex; align-items: center; gap: 12rpx; }
.clear-chip {
	padding: 6rpx 18rpx; font-size: 19rpx; color: #C2506C;
	border-radius: 999rpx; background: #FFEFF3;
	border: 1rpx solid rgba(232, 139, 157, 0.45);
}
.clear-chip:active { background: #F9CBD8; }
.kbd-body { display: flex; align-items: center; gap: 20rpx; }

.dpad { position: relative; width: 152rpx; height: 152rpx; flex: 0 0 auto; }
.dp {
	position: absolute; width: 48rpx; height: 48rpx; border-radius: 14rpx;
	background: linear-gradient(135deg, #FFEFF3, #FAD7E0);
	border: 1rpx solid rgba(232, 139, 157, 0.4);
	box-shadow: 0 2rpx 6rpx rgba(190, 110, 135, 0.14);
}
.dp:active { background: linear-gradient(135deg, #F6A5B8, #E16A85); }
.dp-up { top: 0; left: 52rpx; }
.dp-down { bottom: 0; left: 52rpx; }
.dp-left { left: 0; top: 52rpx; }
.dp-right { right: 0; top: 52rpx; }
.dp-mid {
	left: 52rpx; top: 52rpx;
	background: #fff; border-style: dashed;
}

.kbd-drop {
	flex: 1;
	height: 152rpx;
	border-radius: 24rpx;
	display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx;
	background: linear-gradient(135deg, #FFC6D4, #E16A85);
	box-shadow: 0 10rpx 24rpx rgba(225, 106, 133, 0.35);
}
.kbd-drop:active { transform: scale(0.97); }
.kd-ico { font-size: 44rpx; }
.kd-txt { font-size: 26rpx; color: #fff; font-weight: 700; letter-spacing: 4rpx; }
.kd-key { font-size: 18rpx; color: rgba(255, 255, 255, 0.85); }

.kbd-side { width: 96rpx; display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.ks-item {
	width: 62rpx; height: 62rpx; border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 30rpx; color: #B9647A;
	background: #fff; border: 1rpx solid rgba(232, 139, 157, 0.4);
}
.ks-item:active { background: #FAD7E0; }
.ks-angle { font-size: 20rpx; color: #B9647A; }
.ks-grid {
	padding: 6rpx 12rpx; font-size: 18rpx; color: #C08A9B;
	border-radius: 999rpx; background: #FFF0F4;
}

.kbd-legend { display: flex; flex-wrap: wrap; gap: 10rpx 16rpx; margin-top: 16rpx; }
.lg {
	font-size: 18rpx; color: #C08A9B;
	padding: 4rpx 12rpx; border-radius: 6rpx;
	background: #FFF0F4;
}

/* ===== 通用面板 ===== */
.panel {
	margin: 20rpx 24rpx 0;
	padding: 24rpx;
	background: #fff;
	border-radius: 24rpx;
	border: 1rpx solid rgba(232, 139, 157, 0.22);
	box-shadow: 0 8rpx 22rpx rgba(190, 110, 135, 0.10);
}
.panel-head {
	display: flex; align-items: baseline; justify-content: space-between;
	margin-bottom: 16rpx;
}
.panel-title {
	font-family: "Songti SC", "STSong", serif;
	font-size: 26rpx; color: #7A4450; letter-spacing: 3rpx;
}
.panel-note { font-size: 18rpx; color: #C9A2AE; }

/* 工具 */
.tool-row { display: flex; justify-content: space-between; }
.tool {
	display: flex; flex-direction: column; align-items: center; gap: 4rpx;
	width: 84rpx; padding: 10rpx 0;
	border-radius: 16rpx;
}
.tool.on { background: linear-gradient(160deg, #FFF0F4, #FBDDE5); }
.tool-ico { font-size: 32rpx; }
.tool-name { font-size: 18rpx; color: #9C6B79; }
.tool.on .tool-name { color: #C2506C; font-weight: 600; }

/* 横向滚动 chip */
.scroll-x { display: flex; gap: 12rpx; overflow-x: auto; white-space: nowrap; }
.chip {
	flex: 0 0 auto;
	padding: 12rpx 18rpx;
	border-radius: 14rpx;
	background: #FFF8FA;
	border: 1rpx solid rgba(232, 139, 157, 0.28);
}
.chip.on {
	background: linear-gradient(135deg, #FFD9E3, #F8B3C6);
	border-color: #E16A85;
}
.chip-key {
	display: inline-block;
	font-size: 17rpx; color: #C2506C;
	padding: 0 8rpx; margin-right: 6rpx;
	border-radius: 4rpx; background: #fff;
}
.chip-name { font-size: 24rpx; color: #7A4450; }
.chip.on .chip-name { font-weight: 600; }
.chip-desc { display: block; margin-top: 4rpx; font-size: 18rpx; color: #C9A2AE; }

/* 颜色 */
.color-row { display: flex; flex-wrap: wrap; gap: 16rpx; }
.color-item { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.color-dot {
	width: 46rpx; height: 46rpx; border-radius: 50%;
	border: 3rpx solid #fff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.14);
}
.color-dot.on {
	border-color: #E16A85;
	box-shadow: 0 0 0 4rpx rgba(225, 106, 133, 0.25);
}
.color-no { font-size: 17rpx; color: #C9A2AE; }
.color-no.on { color: #C2506C; font-weight: 600; }

/* 绣布设置 */
.sub-row { display: flex; align-items: center; gap: 14rpx; margin-top: 16rpx; }
.sub-row:first-of-type { margin-top: 0; }
.sub-label { font-size: 20rpx; color: #B98C9B; width: 56rpx; flex: 0 0 auto; }
.cloth-colors { display: flex; gap: 14rpx; }
.cc {
	width: 44rpx; height: 44rpx; border-radius: 10rpx;
	border: 3rpx solid #fff;
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.12);
}
.cc.on { border-color: #E16A85; }
.border-list, .size-list { display: flex; gap: 10rpx; flex-wrap: wrap; }
.bd, .sz {
	padding: 8rpx 18rpx;
	font-size: 21rpx; color: #9C6B79;
	border-radius: 999rpx;
	background: #FFF8FA;
	border: 1rpx solid rgba(232, 139, 157, 0.28);
}
.bd.on, .sz.on {
	color: #fff; font-weight: 600;
	background: linear-gradient(135deg, #F6A5B8, #E16A85);
	border-color: transparent;
}

/* ===== 底部栏 ===== */
.bottom-bar {
	display: flex;
	justify-content: space-around;
	align-items: center;
	margin: 24rpx 24rpx 0;
	padding: 16rpx 8rpx;
	background: rgba(255, 255, 255, 0.92);
	border-radius: 24rpx;
	border: 1rpx solid rgba(232, 139, 157, 0.25);
	box-shadow: 0 8rpx 22rpx rgba(190, 110, 135, 0.12);
}
.bb {
	display: flex; flex-direction: column; align-items: center; gap: 4rpx;
	font-size: 19rpx; color: #9C6B79;
	padding: 8rpx 20rpx; border-radius: 16rpx;
}
.bb-ico { font-size: 30rpx; }
.bb-pink { color: #C2506C; font-weight: 600; }

/* ===== 弹窗 ===== */
.modal {
	position: fixed; left: 0; top: 0; right: 0; bottom: 0;
	background: rgba(90, 45, 60, 0.42);
	display: flex; align-items: center; justify-content: center;
	z-index: 99;
}
.modal-box {
	width: 600rpx; padding: 36rpx 30rpx 26rpx;
	background: #fff; border-radius: 26rpx;
	box-shadow: 0 20rpx 48rpx rgba(90, 45, 60, 0.28);
}
.modal-box-wide { width: 640rpx; }
.modal-title {
	display: block; text-align: center; margin-bottom: 24rpx;
	font-family: "Songti SC", "STSong", serif;
	font-size: 30rpx; color: #7A4450; letter-spacing: 3rpx;
}
.modal-input {
	height: 84rpx; padding: 0 22rpx;
	font-size: 27rpx; color: #7A4450;
	border-radius: 16rpx;
	background: #FFF6F8;
	border: 1rpx solid rgba(232, 139, 157, 0.4);
}
.ph { color: #D3B4BE; }
.modal-actions { display: flex; gap: 16rpx; margin-top: 26rpx; }
.ma {
	flex: 1; height: 78rpx; line-height: 78rpx; text-align: center;
	font-size: 27rpx; border-radius: 999rpx;
}
.ma-ghost { color: #9C6B79; border: 1rpx solid rgba(232, 139, 157, 0.45); }
.ma-pink {
	color: #fff; font-weight: 600;
	background: linear-gradient(135deg, #F6A5B8, #E16A85);
}
.pat-scroll { height: 560rpx; }
.pat-grid { display: flex; flex-wrap: wrap; gap: 14rpx; }
.pat {
	width: 104rpx; padding: 14rpx 0;
	display: flex; flex-direction: column; align-items: center; gap: 4rpx;
	border-radius: 14rpx;
	background: #FFF8FA;
	border: 1rpx solid rgba(232, 139, 157, 0.28);
}
.pat-ico { font-size: 38rpx; }
.pat-name { font-size: 18rpx; color: #9C6B79; }

/* 模板库 */
.tpl-tip {
	display: block;
	margin-top: 8rpx;
	font-size: 20rpx;
	line-height: 1.5;
	color: #B08894;
}
.tpl-cats {
	display: flex; flex-wrap: wrap; gap: 10rpx;
	margin: 18rpx 0 14rpx;
}
.tpl-cat {
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	background: #FFF8FA;
	border: 1rpx solid rgba(232, 139, 157, 0.28);
	font-size: 21rpx;
	color: #9C6B79;
}
.tpl-cat.on {
	background: linear-gradient(135deg, #FFD9E3, #F8B3C6);
	border-color: #E16A85;
	color: #fff;
	font-weight: 600;
}
.tpl-scroll { height: 520rpx; }
.tpl-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.tpl {
	width: 132rpx; padding: 16rpx 0 12rpx;
	display: flex; flex-direction: column; align-items: center; gap: 4rpx;
	border-radius: 16rpx;
	background: #FFF8FA;
	border: 1rpx solid rgba(232, 139, 157, 0.28);
}
.tpl:active { background: #FFEFF4; border-color: #E16A85; }
.tpl-ico { font-size: 44rpx; line-height: 1.2; }
.tpl-name { font-size: 22rpx; color: #7A4A57; font-weight: 600; }
.tpl-cat-txt { font-size: 17rpx; color: #B08894; }
</style>
