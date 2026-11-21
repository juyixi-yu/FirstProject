<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 90%"></view>
			<view class="wy-skel wy-skel-line" style="width: 72%"></view>
			<view class="wy-skel wy-skel-line" style="width: 52%"></view>
			<view class="wy-skel wy-skel-img" style="height: 320rpx; margin-top: 28rpx"></view>
		</view>
		<!-- 提审期占位：isDisplay=1 时隐藏该功能 -->
		<view v-else-if="hideAI" class="wy-off">
			<text class="wy-off-title wy-serif">该功能暂未开放</text>
			<text class="wy-off-desc">相关服务正在升级完善中，敬请期待。</text>
		</view>
		<!-- 真实内容 -->
		<block v-else>
		<!-- 标题 -->
		<view class="wy-sec">
			<view class="title-block">
				<text class="title-cn wy-serif wy-gold-title">{{ head.cn }}</text>
				<text class="title-sub">{{ head.sub }}</text>
			</view>
			<text class="wy-sec-sub">{{ head.desc }}</text>
		</view>

		<!-- AI 修复 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">AI 婺绣数字修复</text>
			</view>

			<view class="fix-upload" @tap="chooseOld">
				<image v-if="oldPhoto" class="fix-upload-img" :src="oldPhoto" mode="aspectFill"></image>
				<view v-else class="fix-upload-empty">
					<view class="up-icon"></view>
					<text class="up-tip">上传老绣片照片</text>
					<text class="up-hint">破损、褪色的旧绣片，越真实越有参考价值</text>
				</view>
			</view>

			<view class="compare">
				<view class="cmp-col">
					<image class="cmp-img" :src="oldPhoto || IMG.before" mode="aspectFill"></image>
					<text class="cmp-label">修复前</text>
				</view>
				<view class="cmp-mid">
					<text class="cmp-ai wy-serif">AI</text>
					<view class="cmp-line"></view>
				</view>
				<view class="cmp-col">
					<image class="cmp-img cmp-img-on" :src="restoredImg || IMG.after" mode="aspectFill"></image>
					<text class="cmp-label cmp-label-on">修复后</text>
				</view>
			</view>

			<view class="wy-btn fix-btn" @tap="restore">
				<text>{{ restoring ? 'AI 修复中…' : '一键 AI 修复还原' }}</text>
			</view>

			<!-- 修复档位与价格 -->
			<view class="repair-list">
				<view class="repair-row wy-card" v-for="(r, i) in repairs" :key="i" @tap="buyRepair(r)">
					<view class="repair-body">
						<text class="repair-name wy-serif">{{ r.name }}</text>
						<text class="repair-desc">{{ r.desc }}</text>
					</view>
					<view class="repair-right">
						<text class="repair-price">{{ r.price }}</text>
						<text class="repair-go">预约 ›</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 价值说明 -->
		<view class="wy-sec">
			<view class="value-card">
				<text class="value-tag wy-tag">{{ valueTag }}</text>
				<text class="value-txt">{{ valueTxt }}</text>
			</view>
		</view>

		<!-- 数字纹样库 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">标准化数字纹样</text>
			</view>
			<text class="wy-sec-sub">以 AI 提取斑驳纹样中的清晰线条，形成可复用的标准纹样资产</text>

			<view class="pat-grid">
				<view class="pat-item" v-for="(p, i) in patterns" :key="i">
					<image class="pat-img" :src="p.img" mode="aspectFill"></image>
					<view class="pat-info">
						<text class="pat-name wy-serif">{{ p.name }}</text>
						<text class="pat-desc">{{ p.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">AI 修复 · 数字纹样库</text>
		</view>
		<canvas type="2d" id="fixCanvas" canvas-id="fixCanvas" class="fix-canvas"></canvas>
		</block>
	</view>
</template>

<script>
	import { img, getPage, getHideAI } from '../../utils/cloud'
	import { imageToBase64 } from '../../utils/image-base64'
	import { restoreOldPiece } from '../../utils/restore'

	function defImg() {
		return {
			before: img('pattern-before.jpg'),
			after: img('pattern-after.jpg')
		}
	}

	export default {
		data() {
			return {
				loading: true,
				hideAI: false,
				IMG: defImg(),
				head: {
					cn: '数字纹样库',
					sub: '非遗数字化保护 · AI 修复与素材提取',
					desc: '上传破损、褪色的老绣片，AI 自动补全残缺图案、还原历史色彩，并汇聚为标准化的数字纹样库'
				},
				valueTag: '文化责任感',
				valueTxt: '数字化修复既是对非遗的保护，也为前期设计定制、文创联动开发提供源源不断的素材，让古老纹样重获数字新生、代代相传。',
				oldPhoto: '',
				restoredImg: '',
				restoring: false,
				patterns: [
					{ name: '喜鹊报春', desc: '喜鹊与梅枝，寓意报喜', img: img('pattern-magpie.jpg') },
					{ name: '富贵牡丹', desc: '牡丹盛开，寓意富贵', img: img('pattern-peony.jpg') },
					{ name: '婺州古建', desc: '粉墙黛瓦，婺州风貌', img: img('pattern-wuzhou.jpg') },
					{ name: '祥云纹样', desc: '云纹连绵，寓意吉祥', img: img('pattern-cloud.jpg') }
				],
				repairs: [
					{ name: '少量修复', desc: '局部破损、褪色，单处纹样还原', price: '¥ 120' },
					{ name: '中量修复', desc: '数处破损、褪色，纹样局部还原', price: '¥ 260' },
					{ name: '多量修复', desc: '大面积残损、复杂纹样完整还原', price: '¥ 480' }
				]
			}
		},
		onLoad() {
			this.fetch()
		},
		methods: {
			async fetch() {
				this.hideAI = await getHideAI()
				const d = await getPage('pattern')
				this.loading = false
				if (!d) return
				if (d.images) {
					const next = { ...this.IMG }
					Object.keys(d.images).forEach((k) => { next[k] = img(d.images[k]) })
					this.IMG = next
				}
				if (d.head) this.head = d.head
				if (d.valueTag) this.valueTag = d.valueTag
				if (d.valueTxt) this.valueTxt = d.valueTxt
				if (d.patterns) this.patterns = d.patterns.map((p) => ({ ...p, img: img(p.img) }))
				if (d.repairs) this.repairs = d.repairs
			},
			chooseOld() {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						this.oldPhoto = res.tempFilePaths[0]
						this.restoredImg = ''
					}
				})
			},
			/** 修复档位预约：统一进入订单确认页（当前版本不做真实支付） */
			buyRepair(r) {
				const q = [
					'from=pattern',
					'title=' + encodeURIComponent('数字纹样修复 · ' + r.name),
					'price=' + encodeURIComponent(r.price || '0'),
					'spec=' + encodeURIComponent(r.desc || '老绣片纹样 AI 修复'),
					'img=' + encodeURIComponent(this.IMG.after || ''),
					'qty=1'
				].join('&')
				uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
			},
			getFixCanvas() {
				return new Promise((resolve) => {
					uni.createSelectorQuery()
						.select('#fixCanvas')
						.fields({ node: true, size: true })
						.exec((res) => {
							resolve((res && res[0] && res[0].node) || null)
						})
				})
			},
			async restore() {
				if (this.restoring) return
				if (!this.oldPhoto) {
					uni.showToast({ title: '请先上传老绣片照片', icon: 'none' })
					return
				}
				this.restoring = true
				this.restoredImg = ''
				uni.showLoading({ title: '修复中…', mask: true })
				let cloudDone = false
				try {
					// 1. 压缩 + 转 base64（H5 走 canvas，其他端走文件系统 API）
					const b64 = await imageToBase64(this.oldPhoto)

					// 2. 云函数：图像编辑，保留构图补全破损纹样
					const res = await uniCloud.callFunction({
						name: 'wy-ai',
						data: { action: 'restorePattern', imageBase64: b64 },
						timeout: 300000
					})

					const r = res.result || {}
					if (r.code !== 0 || !r.data || !r.data.url) {
						throw new Error(r.msg || '云端修复失败')
					}

					// 3. 下载修复结果
					const dl = await uni.downloadFile({ url: r.data.url })
					if (dl.statusCode !== 200) throw new Error('修复图下载失败')

					cloudDone = true
					uni.hideLoading()
					uni.showToast({ title: '修复完成', icon: 'none' })
					this.restoredImg = dl.tempFilePath
				} catch (e) {
					console.error('[pattern] 云端修复失败，改用本地修复', e)
					uni.showModal({
						title: '云端修复不可用',
						content: '已改用本地算法。失败原因：' + String((e && e.message) || e).slice(0, 120),
						showCancel: false,
						confirmText: '知道了'
					})
				}

				// 云端不可用时，用本地算法兜底（补色 + 补破损，保留原始构图）
				if (!cloudDone) {
					try {
						const canvas = await this.getFixCanvas()
						if (!canvas) throw new Error('画布初始化失败')
						const out = await restoreOldPiece(canvas, this.oldPhoto)
						if (!out) throw new Error('修复结果导出失败')
						uni.hideLoading()
						uni.showToast({ title: '已用本地算法修复', icon: 'none' })
						this.restoredImg = out
					} catch (e2) {
						uni.hideLoading()
						console.error('[pattern] 修复失败', e2)
						uni.showModal({
							title: '修复失败',
							content: String((e2 && e2.message) || e2),
							showCancel: false,
							confirmText: '知道了'
						})
					}
				}
				this.restoring = false
			}
		}
	}
</script>

<style>
	.title-block {
		padding: 20rpx 0 4rpx;
	}

	.title-cn {
		display: block;
		font-size: 68rpx;
		letter-spacing: 10rpx;
	}

	.title-sub {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		letter-spacing: 2rpx;
		color: var(--wy-txt-2);
	}

	/* 上传 */
	.fix-upload {
		margin-top: 28rpx;
		height: 320rpx;
		border-radius: 20rpx;
		border: 2rpx dashed rgba(212, 175, 55, 0.4);
		background-color: rgba(212, 175, 55, 0.04);
		overflow: hidden;
	}

	.fix-upload-img {
		width: 100%;
		height: 320rpx;
	}

	.fix-upload-empty {
		height: 320rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.up-icon {
		width: 68rpx;
		height: 48rpx;
		border: 3rpx solid var(--wy-gold);
		border-radius: 12rpx 12rpx 4rpx 4rpx;
		position: relative;
	}

	.up-icon::after {
		content: '';
		position: absolute;
		left: 50%;
		top: -26rpx;
		margin-left: -4rpx;
		width: 8rpx;
		height: 30rpx;
		background-color: var(--wy-gold);
		border-radius: 4rpx;
	}

	.up-icon::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -30rpx;
		margin-left: -12rpx;
		width: 0;
		height: 0;
		border-left: 12rpx solid transparent;
		border-right: 12rpx solid transparent;
		border-bottom: 14rpx solid var(--wy-gold);
	}

	.up-tip {
		margin-top: 26rpx;
		font-size: 28rpx;
		color: var(--wy-gold-lt);
	}

	.up-hint {
		margin-top: 10rpx;
		font-size: 23rpx;
		color: var(--wy-txt-2);
	}

	/* 前后对比 */
	.compare {
		display: flex;
		align-items: center;
		margin-top: 24rpx;
	}

	.cmp-col {
		flex: 1;
	}

	.cmp-img {
		width: 100%;
		height: 240rpx;
		border-radius: 16rpx;
		border: 1rpx solid var(--wy-line);
	}

	.cmp-img-on {
		border-color: var(--wy-gold);
		box-shadow: 0 0 24rpx rgba(212, 175, 55, 0.35);
	}

	.cmp-label {
		display: block;
		margin-top: 14rpx;
		text-align: center;
		font-size: 24rpx;
		color: var(--wy-txt-2);
	}

	.cmp-label-on {
		color: var(--wy-gold-lt);
	}

	.cmp-mid {
		width: 90rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.cmp-ai {
		font-size: 28rpx;
		color: var(--wy-gold);
	}

	.cmp-line {
		width: 30rpx;
		height: 2rpx;
		margin-top: 8rpx;
		background-image: linear-gradient(90deg, rgba(212, 175, 55, 0), #D4AF37, rgba(212, 175, 55, 0));
	}

	.fix-btn {
		display: block;
		margin-top: 28rpx;
		text-align: center;
	}

	/* 修复档位与价格 */
	.repair-list {
		margin-top: 24rpx;
	}

	.repair-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24rpx 28rpx;
		margin-bottom: 18rpx;
	}

	.repair-body {
		flex: 1;
		padding-right: 20rpx;
	}

	.repair-name {
		display: block;
		font-size: 30rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.repair-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	.repair-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.repair-price {
		font-size: 34rpx;
		font-weight: 600;
		color: var(--wy-gold-dk);
	}

	.repair-go {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: var(--wy-gold-lt);
	}

	/* 价值卡 */
	.value-card {
		padding: 32rpx 30rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-image: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(214, 197, 166, 0.5));
	}

	.value-txt {
		display: block;
		margin-top: 18rpx;
		font-size: 26rpx;
		line-height: 44rpx;
		color: var(--wy-txt-2);
	}

	/* 纹样网格 */
	.pat-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.pat-item {
		width: 335rpx;
		box-sizing: border-box;
		margin-bottom: 22rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
		overflow: hidden;
	}

	.pat-img {
		width: 335rpx;
		height: 240rpx;
	}

	.pat-info {
		padding: 18rpx 20rpx 22rpx;
	}

	.pat-name {
		display: block;
		font-size: 30rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.pat-desc {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	.fix-canvas {
		position: fixed;
		left: -9999rpx;
		top: -9999rpx;
		width: 360px;
		height: 360px;
	}
</style>
