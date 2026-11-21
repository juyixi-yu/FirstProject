<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 86%"></view>
			<view class="wy-skel wy-skel-line" style="width: 60%"></view>
			<view class="wy-skel wy-skel-img" style="height: 380rpx; margin-top: 8rpx"></view>
		</view>
		<!-- 真实内容 -->
		<block v-else>
		<!-- 展馆入口短片 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">{{ hideAI ? '展馆入口 · 婺绣短片' : '展馆入口·AI婺绣短片' }}</text>
			</view>
			<text class="wy-sec-sub">{{ hideAI ? '打开展馆，先看一段婺绣介绍短片，第一印象便沉浸于百年风华' : '打开展馆，先看一段以AI生成的婺绣介绍短片，第一印象便沉浸于百年风华' }}</text>

			<video class="video-player" :src="videoUrl" :poster="IMG.video" :autoplay="false" :show-center-play-btn="true" :enable-progress-gesture="false" object-fit="contain" controls @error="onVideoError"></video>
			<view class="video-cap">
				<text class="video-cap-title wy-serif">{{ videoTitle }}</text>
				<text class="video-cap-sub">{{ videoSub }}</text>
			</view>
		</view>

		<!-- 3D 全息历史长卷 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">明朝婺州·3D全息长卷</text>
			</view>
			<text class="wy-sec-sub">基于明朝婺州场景的3D全息历史长卷，把静态卷轴转化为动态数字影像</text>

			<view class="scroll-box wy-card">
				<image class="scroll-img" :src="IMG.scroll" mode="widthFix"></image>
				<view class="scroll-band">
					<text class="scroll-band-txt">{{ scrollBand }}</text>
				</view>
			</view>
			<view class="quote">
				<text class="quote-mark wy-serif">“</text>
				<text class="quote-txt wy-serif">{{ quote }}</text>
			</view>
		</view>

		<!-- 百年风华时间轴 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">婺绣百年风华</text>
			</view>
			<view class="timeline">
				<view class="tl-item" v-for="(t, i) in timeline" :key="i">
					<view class="tl-axis">
						<view class="tl-dot"></view>
						<view class="tl-line" v-if="i < timeline.length - 1"></view>
					</view>
					<view class="tl-body">
						<text class="tl-era wy-serif">{{ t.era }}</text>
						<text class="tl-title">{{ t.title }}</text>
						<text class="tl-desc">{{ t.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 文化底蕴 -->
		<view class="wy-sec">
			<view class="cred-card">
				<text class="cred-tag wy-tag">{{ credTag }}</text>
				<text class="cred-txt">{{ credTxt }}</text>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">婺绣数字展馆 · 文化入口</text>
		</view>
		</block>
	</view>
</template>

<script>
	import { img, getPage, getHideAI } from '../../utils/cloud'

	function defImg() {
		return {
			video: img('video-cover.jpg'),
			scroll: img('scroll.jpg')
		}
	}

	export default {
		data() {
			return {
				loading: true,
				hideAI: false,
				IMG: defImg(),
				videoUrl: encodeURI(img('videos/Ai短片.mp4')),
				videoTitle: '婺绣百年风华',			
				scrollBand: '粉墙黛瓦 · 婺州古村 · 绣坊灯火',
				quote: '针线守匠心，一针一线皆藏婺州山水与人情。',
				credTag: '非遗数字化传播',
				credTxt: '以高清视频与全息影像打破非遗传播的时空限制，降低初次接触的认知门槛，让更多人在第一眼就感受到婺绣平、齐、细、密的针法之美与文化底蕴。',
				timeline: [
					{ era: '明清', title: '婺州绣坊兴起', desc: '婺绣因婺剧而兴，多用于婺剧戏服，绣坊遍布江南水乡、粉墙黛瓦之间。' },
					{ era: '近代', title: '针法代代相传', desc: '“平、齐、细、密”的针法在绣娘指尖口传心授，延续百年。' },
					{ era: '当代', title: '非遗保护与复兴', desc: '婺绣列入非物质文化遗产，传统技艺重回大众视野。' },
					{ era: '未来', title: '科技数字新生', desc: '全息影像与 AI 技术让古老纹样在数字世界重获新生。' }
				]
			}
		},
		onLoad() {
			this.fetch()
		},
		methods: {
			// 提审期（isDisplay=1）兜底：无数据或数据缺字段时，也要保证不渲染含「AI」的字样
			neutralize() {
				if (this.videoSub && this.videoSub.toUpperCase().indexOf('AI') !== -1) {
					this.videoSub = '婺绣技艺与历史长卷'
				}
				this.timeline = this.timeline.map((t) => (t.desc && t.desc.toUpperCase().indexOf('AI') !== -1
					? { ...t, desc: '全息影像与数字技术让古老纹样在数字世界重获新生。' }
					: t))
			},
			async fetch() {
				this.hideAI = await getHideAI()
				const d = await getPage('exhibition')
				if (d) {
					if (d.images) {
						const next = { ...this.IMG }
						Object.keys(d.images).forEach((k) => { next[k] = img(d.images[k]) })
						this.IMG = next
					}
					if (d.videoTitle) this.videoTitle = d.videoTitle
					if (d.videoSub) this.videoSub = d.videoSub
					if (d.introVideo) {
						const first = (Array.isArray(d.introVideo) ? d.introVideo : [d.introVideo]).filter((f) => !!f)[0]
						if (first) this.videoUrl = encodeURI(img(first))
					}
					if (d.scrollBand) this.scrollBand = d.scrollBand
					if (d.quote) this.quote = d.quote
					if (d.credTag) this.credTag = d.credTag
					if (d.credTxt) this.credTxt = d.credTxt
					if (d.timeline) this.timeline = d.timeline
				}
				if (this.hideAI) this.neutralize()
				this.loading = false
			},
			// 视频加载失败兜底：云端配置的地址失效时回退到默认 AI 短片
			onVideoError(e) {
				const def = encodeURI(img('videos/Ai短片.mp4'))
				console.error('[exhibition] 视频加载失败', this.videoUrl, e && e.detail)
				if (this.videoUrl !== def) this.videoUrl = def
			}
		}
	}
</script>

<style>
	/* 展馆短片 */
	.video-player {
		width: 100%;
		height: 400rpx;
		margin-top: 28rpx;
		border-radius: 16rpx;
		background-color: #000;
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

	/* 全息长卷 */
	.scroll-box {
		margin-top: 28rpx;
	}

	.scroll-img {
		width: 100%;
		display: block;
	}

	.scroll-band {
		padding: 20rpx 26rpx;
		text-align: center;
		background-image: linear-gradient(90deg, rgba(212, 175, 55, 0.05), rgba(212, 175, 55, 0.16), rgba(212, 175, 55, 0.05));
	}

	.scroll-band-txt {
		font-size: 30rpx;
		letter-spacing: 6rpx;
		color: var(--wy-gold-dk);
	}

	.quote {
		position: relative;
		margin-top: 24rpx;
		padding: 30rpx 34rpx 30rpx 60rpx;
		border-radius: 18rpx;
		background-color: var(--wy-card-2);
		border: 1rpx solid rgba(160, 120, 40, 0.18);
	}

	.quote-mark {
		position: absolute;
		left: 20rpx;
		top: 6rpx;
		font-size: 74rpx;
		color: rgba(138, 101, 22, 0.45);
	}

	.quote-txt {
		font-size: 28rpx;
		line-height: 46rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	/* 时间轴 */
	.timeline {
		margin-top: 30rpx;
	}

	.tl-item {
		display: flex;
	}

	.tl-axis {
		width: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tl-dot {
		width: 16rpx;
		height: 16rpx;
		margin-top: 12rpx;
		border-radius: 50%;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
		box-shadow: 0 0 16rpx rgba(212, 175, 55, 0.6);
	}

	.tl-line {
		flex: 1;
		width: 2rpx;
		margin: 8rpx 0;
		background-image: linear-gradient(180deg, rgba(212, 175, 55, 0.5), rgba(212, 175, 55, 0.06));
	}

	.tl-body {
		flex: 1;
		padding: 0 0 34rpx 18rpx;
	}

	.tl-era {
		display: inline-block;
		padding: 2rpx 16rpx;
		font-size: 22rpx;
		color: var(--wy-gold-lt);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
	}

	.tl-title {
		display: block;
		margin-top: 12rpx;
		font-size: 32rpx;
		color: var(--wy-txt);
	}

	.tl-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-txt-2);
	}

	/* 文化底蕴卡 */
	.cred-card {
		padding: 32rpx 30rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-image: linear-gradient(135deg, rgba(200, 16, 46, 0.12), rgba(214, 197, 166, 0.5));
	}

	.cred-txt {
		display: block;
		margin-top: 18rpx;
		font-size: 26rpx;
		line-height: 44rpx;
		color: var(--wy-txt-2);
	}

</style>
