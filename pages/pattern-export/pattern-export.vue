<template>
	<view class="exp-page">
		<!-- 无底稿提示 -->
		<view v-if="!src" class="exp-empty">
			<text class="exp-empty-ico">🧵</text>
			<text class="exp-empty-title wy-serif">暂无可导出的底稿</text>
			<text class="exp-empty-desc">请先在「匠心·智绘」生成专属纹样，再进入本页导出刺绣图纸</text>
			<view class="exp-btn" @tap="goCustom"><text>去生成纹样</text></view>
		</view>

		<block v-else>
			<!-- 底稿预览 -->
			<view class="exp-sec">
				<view class="exp-head">
					<view class="exp-bar"></view>
					<text class="exp-title wy-serif">底稿预览</text>
					<text class="exp-tag">{{ modeName }}</text>
				</view>
				<view class="exp-preview">
					<image class="exp-img" :src="previewSrc" mode="widthFix" @tap="previewBig"></image>
					<view class="exp-mask" v-if="processing">
						<view class="spin"></view>
						<text class="spin-txt">正在绘制图纸…</text>
					</view>
				</view>
				<text class="exp-tip">点击图纸可放大查看细节</text>
			</view>

			<!-- 导出格式 -->
			<view class="exp-sec">
				<view class="exp-head">
					<view class="exp-bar"></view>
					<text class="exp-title wy-serif">选择导出格式</text>
				</view>
				<view class="fmt-list">
					<view
						class="fmt-card"
						:class="{ on: mode === f.key }"
						v-for="f in formats"
						:key="f.key"
						@tap="setMode(f.key)"
					>
						<text class="fmt-ico">{{ f.icon }}</text>
						<view class="fmt-info">
							<text class="fmt-name wy-serif">{{ f.name }}</text>
							<text class="fmt-desc">{{ f.desc }}</text>
						</view>
						<view class="fmt-check" v-if="mode === f.key">✓</view>
					</view>
				</view>
			</view>

			<!-- 图纸规格 -->
			<view class="exp-sec" v-if="mode === 'grid'">
				<view class="exp-head">
					<view class="exp-bar"></view>
					<text class="exp-title wy-serif">网格密度</text>
				</view>
				<view class="grid-row">
					<view
						class="grid-opt"
						:class="{ on: gridCols === g }"
						v-for="g in [30, 40, 60]"
						:key="g"
						@tap="gridCols = g; renderMode()"
					>
						<text>{{ g }} 格</text>
					</view>
				</view>
				<text class="exp-tip">横向格数，格越密越适合精细纹样</text>
			</view>

			<!-- 操作 -->
			<view class="exp-actions">
				<view class="exp-btn exp-btn-main" @tap="saveImage">
					<text>{{ saving ? '正在保存…' : '保存到相册' }}</text>
				</view>
				<view class="exp-btn exp-btn-ghost" @tap="goBack">
					<text>返回修改</text>
				</view>
			</view>

			<view class="exp-footer">
				<text class="exp-footer-brand wy-serif">绣韵焕兴</text>
				<text class="exp-footer-line">导出的图纸可打印，对照网格逐格落针</text>
			</view>
		</block>

		<!-- 离屏画布：绘制网格 / 线稿 -->
		<canvas
			type="2d"
			id="expCanvas"
			canvas-id="expCanvas"
			class="exp-canvas"
			:style="{ width: cvW + 'px', height: cvH + 'px' }"
		></canvas>
	</view>
</template>

<script>
	const EXPORT_W = 1200 // 导出图纸宽度（px）

	export default {
		data() {
			return {
				src: '',
				previewSrc: '',
				mode: 'grid',
				gridCols: 40,
				processing: false,
				saving: false,
				cvW: 10,
				cvH: 10,
				formats: [
					{ key: 'orig', icon: '🖼️', name: '高清绣稿', desc: '保留 AI 绣稿全部细节色彩，直接打印或发工作室绣制' },
					{ key: 'grid', icon: '📐', name: '网格图纸', desc: '叠加坐标网格与行列编号，对照图纸逐格落针' },
					{ key: 'mono', icon: '✏️', name: '黑白线稿', desc: '去色增强轮廓，用于描稿转印到绣布上' }
				]
			}
		},
		computed: {
			modeName() {
				const f = this.formats.find((x) => x.key === this.mode)
				return f ? f.name : ''
			}
		},
		onLoad(opt) {
			let src = opt && opt.src ? decodeURIComponent(opt.src) : ''
			if (!src) {
				const app = getApp()
				src = (app.globalData && app.globalData.exportPattern) || ''
			}
			if (!src) return
			this.src = src
			this.previewSrc = src
		},
		onReady() {
			// 小程序端需等页面首次渲染完成后才能查询到 canvas 节点
			if (this.src && this.mode !== 'orig') this.renderMode()
		},
		methods: {
			goCustom() {
				uni.navigateTo({ url: '/pages/custom/custom' })
			},
			goBack() {
				uni.navigateBack()
			},
			previewBig() {
				uni.previewImage({ urls: [this.previewSrc], current: this.previewSrc })
			},
			setMode(m) {
				if (this.mode === m || this.processing) return
				this.mode = m
				if (m === 'orig') {
					this.previewSrc = this.src
				} else {
					this.renderMode()
				}
			},

			getCanvas() {
				// #ifdef H5
				return Promise.resolve(document.createElement('canvas'))
				// #endif
				// #ifndef H5
				return new Promise((resolve) => {
					uni.createSelectorQuery()
						.in(this)
						.select('#expCanvas')
						.fields({ node: true, size: true })
						.exec((res) => resolve((res && res[0] && res[0].node) || null))
				})
				// #endif
			},

			loadImg(canvas, src) {
				return new Promise((resolve, reject) => {
					const img = canvas.createImage ? canvas.createImage() : new Image()
					img.onload = () => resolve(img)
					img.onerror = () => reject(new Error('底稿加载失败'))
					// #ifdef H5
					img.crossOrigin = 'anonymous'
					// #endif
					img.src = src
				})
			},

			/**
			 * dataURL 转本地临时文件：小程序端 getImageInfo / canvas.createImage 均不认
			 * base64 形式的 src，必须先落地成文件路径才能读取尺寸和绘制
			 */
			toLocalFile(src) {
				if (!/^data:image\//i.test(src)) return Promise.resolve(src)
				// #ifdef H5
				return Promise.resolve(src)
				// #endif
				// #ifndef H5
				return new Promise((resolve) => {
					try {
						const comma = src.indexOf(',')
						if (comma < 0) return resolve(src)
						const mime = src.slice(5, comma).split(';')[0] || 'image/png'
						const ext = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg')
						const base = (uni.env && uni.env.USER_DATA_PATH) || (typeof wx !== 'undefined' && wx.env.USER_DATA_PATH)
						const file = base + '/exp-src-' + Date.now() + '.' + ext
						uni.getFileSystemManager().writeFile({
							filePath: file,
							data: src.slice(comma + 1),
							encoding: 'base64',
							success: () => resolve(file),
							fail: (e) => {
								console.warn('[pattern-export] dataURL 转临时文件失败', e)
								resolve(src)
							}
						})
					} catch (e) {
						console.warn('[pattern-export] dataURL 转换异常', e)
						resolve(src)
					}
				})
				// #endif
			},

			async renderMode() {
				if (this.processing) return
				this.processing = true
				try {
					const src = await this.toLocalFile(this.src)
					const info = await new Promise((res, rej) => {
						uni.getImageInfo({
							src,
							success: res,
							fail: () => rej(new Error('读取底稿尺寸失败'))
						})
					})
					const w = EXPORT_W
					const h = Math.round((info.height / info.width) * w)
					const canvas = await this.getCanvas()
					if (!canvas) throw new Error('画布初始化失败')
					canvas.width = w
					canvas.height = h
					this.cvW = 10
					this.cvH = 10
					const ctx = canvas.getContext('2d')
					ctx.clearRect(0, 0, w, h)

					const img = await this.loadImg(canvas, src)
					ctx.drawImage(img, 0, 0, w, h)

					if (this.mode === 'mono') this.applyMono(ctx, w, h)
					if (this.mode === 'grid') this.applyGrid(ctx, w, h)

					const out = await this.exportCanvas(canvas)
					if (out) this.previewSrc = out
				} catch (e) {
					console.warn('[pattern-export] render fail', e)
					uni.showToast({ title: (e && e.message) || '图纸绘制失败', icon: 'none' })
					this.previewSrc = this.src
				}
				this.processing = false
			},

			/* 黑白线稿：灰度 + 对比拉伸 */
			applyMono(ctx, w, h) {
				const imgData = ctx.getImageData(0, 0, w, h)
				const d = imgData.data
				let min = 255, max = 0
				const gray = new Uint8Array(w * h)
				for (let i = 0; i < d.length; i += 4) {
					const g = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114)
					gray[i / 4] = g
					if (g < min) min = g
					if (g > max) max = g
				}
				const range = Math.max(1, max - min)
				for (let i = 0; i < gray.length; i++) {
					let v = ((gray[i] - min) / range) * 255
					// 提亮背景，压深线条，模拟线稿
					v = v > 200 ? 255 : v * 0.85
					const j = i * 4
					d[j] = d[j + 1] = d[j + 2] = v
					d[j + 3] = 255
				}
				ctx.putImageData(imgData, 0, 0)
			},

			/* 网格图纸：坐标格 + 编号 + 标题栏 */
			applyGrid(ctx, w, h) {
				const cols = this.gridCols
				const cell = w / cols
				const rows = Math.round(h / cell)

				// 网格线
				ctx.save()
				ctx.strokeStyle = 'rgba(30, 30, 30, 0.28)'
				ctx.lineWidth = 1
				for (let c = 0; c <= cols; c++) {
					const x = Math.round(c * cell) + 0.5
					ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
				}
				for (let r = 0; r <= rows; r++) {
					const y = Math.round(r * cell) + 0.5
					ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
				}
				// 每 5 格加粗主线
				ctx.strokeStyle = 'rgba(180, 40, 40, 0.5)'
				ctx.lineWidth = 2
				for (let c = 0; c <= cols; c += 5) {
					const x = Math.round(c * cell) + 0.5
					ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
				}
				for (let r = 0; r <= rows; r += 5) {
					const y = Math.round(r * cell) + 0.5
					ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
				}

				// 行列编号（每 5 格标一次）
				const fs = Math.max(14, cell * 0.9)
				ctx.font = 'bold ' + fs + 'px sans-serif'
				ctx.fillStyle = 'rgba(180, 40, 40, 0.85)'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'middle'
				for (let c = 0; c < cols; c += 5) {
					this.drawLabel(ctx, String(c), c * cell + cell / 2, fs * 0.7)
				}
				for (let r = 0; r < rows; r += 5) {
					this.drawLabel(ctx, String(r), fs * 0.7, r * cell + cell / 2)
				}
				ctx.restore()
			},

			drawLabel(ctx, txt, x, y) {
				const fs = ctx.font
				const pad = 3
				const metrics = ctx.measureText(txt)
				ctx.save()
				ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
				ctx.fillRect(x - metrics.width / 2 - pad, y - 8, metrics.width + pad * 2, 16)
				ctx.fillStyle = 'rgba(180, 40, 40, 0.9)'
				ctx.fillText(txt, x, y)
				ctx.restore()
			},

			exportCanvas(canvas) {
				// #ifdef H5
				try {
					return Promise.resolve(canvas.toDataURL('image/png'))
				} catch (e) {
					console.warn('[pattern-export] toDataURL fail', e)
				}
				// #endif
				return new Promise((resolve) => {
					uni.canvasToTempFilePath({
						canvas,
						canvasId: 'expCanvas',
						success: (res) => resolve(res.tempFilePath),
						fail: () => {
							// #ifdef H5
							try {
								resolve(canvas.toDataURL('image/png'))
								return
							} catch (e) {}
							// #endif
							resolve('')
						}
					})
				})
			},

			async saveImage() {
				if (this.saving || this.processing) return
				if (this.mode !== 'orig' && this.previewSrc === this.src) {
					uni.showToast({ title: '图纸还在绘制中', icon: 'none' })
					return
				}
				this.saving = true
				const path = await this.toLocalFile(this.previewSrc)
				// #ifdef H5
				const a = document.createElement('a')
				a.href = path
				a.download = '刺绣底稿-' + this.mode + '-' + Date.now() + '.png'
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				uni.showToast({ title: '已开始下载', icon: 'success' })
				this.saving = false
				return
				// #endif
				// #ifndef H5
				// saveImageToPhotosAlbum 仅支持本地路径，云端 URL 需先下载
				if (/^https?:\/\//.test(path) && !/^https?:\/\/tmp\//.test(path)) {
					uni.downloadFile({
						url: path,
						timeout: 30000,
						success: (d) => {
							if (d.statusCode === 200 && d.tempFilePath) {
								this._saveToAlbum(d.tempFilePath)
							} else {
								this.saving = false
								uni.showToast({ title: '保存失败，请重试', icon: 'none' })
							}
						},
						fail: () => {
							this.saving = false
							uni.showToast({ title: '保存失败，请重试', icon: 'none' })
						}
					})
					return
				}
				this._saveToAlbum(path)
				// #endif
			},

			_saveToAlbum(path) {
				uni.saveImageToPhotosAlbum({
					filePath: path,
					success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
					fail: (e) => {
						if (e && /auth|deny/i.test(e.errMsg || '')) {
							uni.showModal({
								title: '需要相册权限',
								content: '请在设置中允许保存图片到相册',
								confirmText: '去设置',
								confirmColor: '#C08A1E',
								success: (r) => { if (r.confirm) uni.openSetting() }
							})
						} else {
							uni.showToast({ title: '保存失败，请重试', icon: 'none' })
						}
					},
					complete: () => { this.saving = false }
				})
			}
		}
	}
</script>

<style>
	.exp-page {
		min-height: 100vh;
		background: #f7f2e9;
		padding: 24rpx 28rpx 60rpx;
		box-sizing: border-box;
	}

	/* 空状态 */
	.exp-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 160rpx 60rpx;
	}
	.exp-empty-ico { font-size: 90rpx; margin-bottom: 30rpx; }
	.exp-empty-title { font-size: 38rpx; color: #3a2c22; margin-bottom: 16rpx; }
	.exp-empty-desc {
		font-size: 26rpx;
		color: #8a7a68;
		text-align: center;
		line-height: 1.7;
		margin-bottom: 50rpx;
	}

	/* 区块 */
	.exp-sec {
		background: #fffdf8;
		border: 1rpx solid #e8dcc8;
		border-radius: 20rpx;
		padding: 28rpx;
		margin-bottom: 28rpx;
	}
	.exp-head { display: flex; align-items: center; margin-bottom: 24rpx; }
	.exp-bar {
		width: 8rpx;
		height: 32rpx;
		background: linear-gradient(180deg, #c8102e, #c08a1e);
		border-radius: 4rpx;
		margin-right: 16rpx;
	}
	.exp-title { font-size: 32rpx; color: #3a2c22; flex: 1; }
	.exp-tag {
		font-size: 22rpx;
		color: #c08a1e;
		background: rgba(192, 138, 30, 0.12);
		border: 1rpx solid rgba(192, 138, 30, 0.4);
		border-radius: 999rpx;
		padding: 4rpx 18rpx;
	}

	/* 预览 */
	.exp-preview {
		position: relative;
		border: 1rpx solid #e8dcc8;
		border-radius: 14rpx;
		overflow: hidden;
		background: #efe6d5;
	}
	.exp-img { width: 100%; display: block; }
	.exp-mask {
		position: absolute;
		left: 0; top: 0; right: 0; bottom: 0;
		background: rgba(247, 242, 233, 0.85);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	.spin {
		width: 56rpx;
		height: 56rpx;
		border: 5rpx solid rgba(200, 16, 46, 0.15);
		border-top-color: #c8102e;
		border-radius: 50%;
		animation: expspin 0.9s linear infinite;
	}
	@keyframes expspin { to { transform: rotate(360deg); } }
	.spin-txt { margin-top: 18rpx; font-size: 24rpx; color: #8a7a68; }
	.exp-tip {
		display: block;
		margin-top: 16rpx;
		font-size: 22rpx;
		color: #a8977f;
		text-align: center;
	}

	/* 格式卡 */
	.fmt-list { display: flex; flex-direction: column; gap: 18rpx; }
	.fmt-card {
		display: flex;
		align-items: center;
		border: 2rpx solid #e8dcc8;
		border-radius: 16rpx;
		padding: 22rpx 24rpx;
		background: #fff;
		position: relative;
	}
	.fmt-card.on {
		border-color: #c8102e;
		background: rgba(200, 16, 46, 0.04);
	}
	.fmt-ico { font-size: 44rpx; margin-right: 20rpx; }
	.fmt-info { flex: 1; display: flex; flex-direction: column; }
	.fmt-name { font-size: 30rpx; color: #3a2c22; margin-bottom: 6rpx; }
	.fmt-desc { font-size: 23rpx; color: #8a7a68; line-height: 1.5; }
	.fmt-check {
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background: #c8102e;
		color: #fff;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* 网格密度 */
	.grid-row { display: flex; gap: 18rpx; }
	.grid-opt {
		flex: 1;
		text-align: center;
		padding: 18rpx 0;
		border: 2rpx solid #e8dcc8;
		border-radius: 12rpx;
		font-size: 26rpx;
		color: #6a5a48;
		background: #fff;
	}
	.grid-opt.on {
		border-color: #c8102e;
		color: #c8102e;
		background: rgba(200, 16, 46, 0.05);
		font-weight: 600;
	}

	/* 操作 */
	.exp-actions { display: flex; gap: 20rpx; margin-top: 10rpx; }
	.exp-btn {
		flex: 1;
		text-align: center;
		padding: 26rpx 0;
		border-radius: 999rpx;
		font-size: 30rpx;
	}
	.exp-btn-main {
		background: linear-gradient(135deg, #c8102e, #a00d26);
		color: #fff;
		box-shadow: 0 8rpx 24rpx rgba(200, 16, 46, 0.25);
	}
	.exp-btn-ghost {
		border: 2rpx solid #c08a1e;
		color: #c08a1e;
		background: transparent;
	}

	/* 页脚 */
	.exp-footer {
		margin-top: 60rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.exp-footer-brand { font-size: 34rpx; color: #c08a1e; letter-spacing: 8rpx; }
	.exp-footer-line { font-size: 22rpx; color: #a8977f; margin-top: 12rpx; }

	/* 离屏画布 */
	.exp-canvas {
		position: fixed;
		left: -9999px;
		top: -9999px;
		pointer-events: none;
	}

	.wy-serif { font-family: 'STKaiti', 'KaiTi', serif; }
</style>
