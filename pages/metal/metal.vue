<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 88%"></view>
			<view class="wy-skel wy-skel-line" style="width: 64%"></view>
			<view class="wy-skel wy-skel-img" style="height: 400rpx; margin-top: 28rpx"></view>
		</view>
		<!-- 加载失败 -->
		<view v-else-if="loadFailed" class="load-fail">
			<text class="load-fail-title wy-serif wy-gold-title">内容加载失败</text>
			<text class="load-fail-desc">未从云数据库取到内容，请确认 wy-content 云函数已部署、云数据库已初始化</text>
			<view class="wy-btn-ghost load-fail-btn" @tap="fetch">重新加载</view>
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

		<!-- 视频介绍仅保留在网站端，手机端不渲染 -->
		<!-- #ifdef H5 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">视频介绍</text>
			</view>
			<text class="wy-sec-sub">短片演示纹样提取流程：从文物照片到可用的婺绣纹样线条</text>
			<video
				class="video-player"
				:src="videoUrl"
				:poster="IMG.cover"
				:autoplay="false"
				:show-center-play-btn="true"
				:enable-progress-gesture="false"
				object-fit="cover"
				controls
				@error="onVideoError"
			></video>
			<view class="video-cap">
				<text class="video-cap-title wy-serif">{{ videoTitle }}</text>
				<text class="video-cap-sub">{{ videoSub }}</text>
			</view>
		</view>
		<!-- #endif -->

		<!-- 提交照片定制 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">{{ submitTitle }}</text>
			</view>
			<text class="wy-sec-sub">{{ submitDesc }}</text>

			<view class="fix-upload" @tap="choosePhoto">
				<image v-if="photo" class="fix-upload-img" :src="photo" mode="aspectFill"></image>
				<view v-else class="fix-upload-empty">
					<view class="up-icon"></view>
					<text class="up-tip">{{ uploadTip }}</text>
					<text class="up-hint">{{ uploadHint }}</text>
				</view>
			</view>

			<view class="mprice wy-card">
				<text class="mprice-num wy-serif">{{ priceTitle }}</text>
				<text class="mprice-desc">{{ priceDesc }}</text>
			</view>

			<!-- AI 生成的模样预览 -->
			<view v-if="generating || metalImg" class="ai-box wy-card">
				<view v-if="generating" class="ai-loading">
					<view class="ai-spin"></view>
					<text class="ai-loading-txt">AI 正在提取纹样、生成金属模样…</text>
				</view>
				<block v-else>
					<image class="ai-img" :src="metalImg" mode="widthFix"></image>
					<text class="ai-tip">AI 已按照片生成专属纹样，确认无误即可提交定制</text>
				</block>
			</view>

			<view class="wy-btn fix-btn" @tap="mainTap">
				<text>{{ btnText }}</text>
			</view>
		</view>

		<!-- 成品示例 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">成品示例</text>
			</view>
			<view class="ms-grid">
				<view class="ms-item" v-for="(s, i) in samples" :key="i">
					<image class="ms-img" :src="s.img" mode="aspectFill"></image>
					<view class="ms-info">
						<text class="ms-name wy-serif">{{ s.name }}</text>
						<text class="ms-desc">{{ s.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 定制流程 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">定制流程</text>
			</view>
			<view class="step-list">
				<view class="step-item" v-for="(s, i) in steps" :key="i">
					<text class="step-no wy-serif">{{ s.no }}</text>
					<view class="step-body">
						<text class="step-title">{{ s.title }}</text>
						<text class="step-desc">{{ s.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">{{ footerLine }}</text>
		</view>
		</block>
	</view>
</template>

<script>
	import { img, getPage, getHideAI } from '../../utils/cloud'
	import { imageToBase64 } from '../../utils/image-base64'

	function defImg() {
		return {
			cover: img('/static/metal-cover.jpg')
		}
	}

	// #ifdef H5
	// 网站端保留已有短片播放能力，手机端不加载视频。
	const INTRO_VIDEO = 'videos/Ai短片.mp4'
	// #endif

	// 模块更名：记忆金属 → 文物纹样提取（功能不变，仅改展示文案）
	const RENAME = {
		head: {
			cn: '文物纹样提取',
			sub: '从文物、老绣片中提取可复用的婺绣纹样',
			desc: '上传文物或老绣片照片，自动提取清晰纹样线条、生成专属纹样底稿，并可制成随身金属饰片'
		},
		// #ifdef H5
		videoTitle: '文物纹样提取 · 短片',
		videoSub: '从文物照片到可用纹样，提取全过程一看便知',
		// #endif
		footerLine: '非遗婺绣 · 文物纹样提取'
	}

	export default {
		data() {
			return {
				loading: true,
				loadFailed: false,
				hideAI: false,
				IMG: defImg(),
				head: { ...RENAME.head },
				// #ifdef H5
				videoTitle: RENAME.videoTitle,
				videoSub: RENAME.videoSub,
				videoUrl: encodeURI(img(INTRO_VIDEO)),
				// #endif
				priceTitle: '定制价 ¥ 699',
				priceDesc: '含纹样提取与设计、记忆金属成型加工、定制包装与寄送到家',
				submitTitle: '提交照片 · 定制专属纹样',
				submitDesc: '上传一张含纹样的照片（老绣片、剪纸、纹样图均可），我们据此制作同款纹样的记忆金属饰片',
				submitBtn: '提交照片定制',
				uploadTip: '点击上传照片',
				uploadHint: '纹样越清晰，还原越准确',
				photo: '',
				metalImg: '',
				generating: false,
				samples: [
					{ name: '双鱼纹', desc: '双鱼相对，年年有余', img: img('/static/metal-sample-1.jpg') },
					{ name: '游鱼纹', desc: '鱼身鳞纹清晰，灵动生趣', img: img('/static/metal-sample-2.jpg') },
					{ name: '螭龙纹', desc: '镜下螭龙盘绕，古意深沉', img: img('/static/metal-sample-3.jpg') },
					{ name: '铜镜全纹', desc: '镜背满纹提取，对称典雅', img: img('/static/metal-sample-4.jpg') }
				],
				steps: [
					{ no: '壹', title: '提交照片', desc: '上传含纹样的照片，注明尺寸与用途' },
					{ no: '贰', title: '纹样提取', desc: '从照片中提取清晰纹样线条，确认底稿' },
					{ no: '叁', title: '金属成型', desc: '记忆金属浮雕成型，可弯折可复原' },
					{ no: '肆', title: '包装寄送', desc: '定制礼盒包装，寄送到家' }
				],
				footerLine: RENAME.footerLine
			}
		},
		onLoad() {
			this.fetch()
		},
		computed: {
			btnText() {
				if (this.generating) return 'AI 生成中…'
				if (this.metalImg) return this.submitBtn
				return 'AI 生成专属模样'
			}
		},
		methods: {
			async fetch() {
				this.loading = true
				this.loadFailed = false
				this.hideAI = await getHideAI()
				const d = await getPage('metal')
				this.loading = false
				if (!d) {
					this.loadFailed = true
					return
				}
				// 封面与成品示例统一用本地随包的文物图，不受云端旧图影响
				if (d.head) this.head = { ...d.head, ...RENAME.head }
				// #ifdef H5
				// 网站端视频文案以本地为准，云端可覆盖播放地址
				this.videoTitle = RENAME.videoTitle
				this.videoSub = RENAME.videoSub
				if (d.videoUrl) this.videoUrl = encodeURI(img(d.videoUrl))
				// #endif
				if (d.priceTitle) this.priceTitle = d.priceTitle
				if (d.priceDesc) this.priceDesc = d.priceDesc
				if (d.submitTitle) this.submitTitle = d.submitTitle
				if (d.submitDesc) this.submitDesc = d.submitDesc
				if (d.submitBtn) this.submitBtn = d.submitBtn
				if (d.uploadTip) this.uploadTip = d.uploadTip
				if (d.uploadHint) this.uploadHint = d.uploadHint
				if (d.steps) this.steps = d.steps
			},
			// #ifdef H5
			onVideoError(e) {
				console.error('[metal] 短片加载失败', this.videoUrl, e && e.detail)
				uni.showToast({ title: '视频加载失败，请稍后再试', icon: 'none' })
			},
			// #endif
			choosePhoto() {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						this.photo = res.tempFilePaths[0]
						this.metalImg = ''
					}
				})
			},
			mainTap() {
				if (!this.photo) {
					uni.showToast({ title: '请先上传照片', icon: 'none' })
					return
				}
				if (this.metalImg) {
					this.submit()
					return
				}
				this.generate()
			},
			async generate() {
				if (this.generating) return
				this.generating = true
				try {
					// 1. 压缩 + 转 base64（H5 走 canvas，其他端走文件系统 API）
					const b64 = await imageToBase64(this.photo)

					// 2. 云函数：识别纹样 → 生成记忆金属浮雕模样 → 返回图片 URL
					const res = await uniCloud.callFunction({
						name: 'wy-ai',
						data: { action: 'metalPattern', imageBase64: b64 },
						timeout: 300000
					})

					const r = res.result || {}
					if (r.code !== 0 || !r.data || !r.data.url) {
						throw new Error(r.msg || 'AI 生成失败')
					}

					// 3. 下载生成结果
					const dl = await uni.downloadFile({ url: r.data.url })
					if (dl.statusCode !== 200) throw new Error('生成图下载失败')

					this.metalImg = dl.tempFilePath
					uni.showToast({ title: 'AI 模样已生成', icon: 'none' })
				} catch (e) {
					console.error('[metal] AI 生成失败', e)
					uni.showModal({
						title: 'AI 生成失败',
						content: String((e && e.message) || e),
						showCancel: false,
						confirmText: '知道了'
					})
				} finally {
					this.generating = false
				}
			},
			submit() {
				const q = [
					'from=metal',
					'title=' + encodeURIComponent('文物纹样提取 · 记忆金属定制'),
					'price=' + encodeURIComponent('699'),
					'spec=' + encodeURIComponent('纹样提取与金属成型 · 含定制包装与寄送'),
					'img=' + encodeURIComponent(this.metalImg || this.photo || this.IMG.cover),
					'qty=1'
				].join('&')
				uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
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

	/* 加载失败态 */
	.load-fail {
		padding: 140rpx 60rpx 0;
		text-align: center;
	}

	.load-fail-title {
		display: block;
		font-size: 40rpx;
		letter-spacing: 4rpx;
	}

	.load-fail-desc {
		display: block;
		margin-top: 24rpx;
		font-size: 24rpx;
		line-height: 40rpx;
		color: var(--wy-txt-2);
	}

	.load-fail-btn {
		margin-top: 48rpx;
	}

	/* 视频介绍短片 */
	.video-player {
		width: 100%;
		height: 400rpx;
		margin-top: 28rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-color: #000;
		overflow: hidden;
	}

	.video-cap {
		margin-top: 16rpx;
	}

	.video-cap-title {
		display: block;
		font-size: 34rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.video-cap-sub {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
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

	/* 价格卡 */
	.mprice {
		margin-top: 24rpx;
		padding: 28rpx 30rpx;
		text-align: center;
	}

	.mprice-num {
		display: block;
		font-size: 46rpx;
		letter-spacing: 4rpx;
		color: var(--wy-gold-dk);
	}

	.mprice-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 23rpx;
		line-height: 36rpx;
		color: var(--wy-txt-2);
	}

	.fix-btn {
		display: block;
		margin-top: 24rpx;
		text-align: center;
	}

	/* AI 模样预览 */
	.ai-box {
		margin-top: 24rpx;
		padding: 24rpx;
		overflow: hidden;
	}

	.ai-img {
		width: 100%;
		border-radius: 14rpx;
		border: 1rpx solid var(--wy-line);
	}

	.ai-tip {
		display: block;
		margin-top: 16rpx;
		font-size: 23rpx;
		line-height: 36rpx;
		text-align: center;
		color: var(--wy-txt-2);
	}

	.ai-loading {
		height: 240rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.ai-spin {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(212, 175, 55, 0.22);
		border-top-color: var(--wy-gold);
		animation: metal-spin 0.9s linear infinite;
	}

	@keyframes metal-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.ai-loading-txt {
		margin-top: 20rpx;
		font-size: 24rpx;
		color: var(--wy-txt-2);
	}

	/* 成品示例 */
	.ms-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.ms-item {
		width: 335rpx;
		box-sizing: border-box;
		margin-bottom: 22rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
		overflow: hidden;
	}

	.ms-img {
		width: 335rpx;
		height: 240rpx;
	}

	.ms-info {
		padding: 18rpx 20rpx 22rpx;
	}

	.ms-name {
		display: block;
		font-size: 30rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.ms-desc {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	/* 定制流程 */
	.step-list {
		margin-top: 28rpx;
	}

	.step-item {
		display: flex;
		align-items: flex-start;
		padding: 24rpx 26rpx;
		margin-bottom: 18rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.step-no {
		width: 60rpx;
		font-size: 32rpx;
		color: rgba(138, 101, 22, 0.55);
	}

	.step-body {
		flex: 1;
	}

	.step-title {
		display: block;
		font-size: 29rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.step-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-txt-2);
	}
</style>
