<template>
	<view class="wy-page zh-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">智绘刺绣</text>
			<view class="nav-placeholder"></view>
		</view>

		<!-- 品牌引导 -->
		<view class="zh-hero">
			<text class="zh-hero-title wy-serif wy-gold-title">一针一线 · 由你创造</text>
			<text class="zh-hero-sub">{{ hideAI ? '线上刺绣 DIY · 一针一线由你创造' : '线上刺绣 DIY & AI 纹样生成' }}</text>
			<view class="zh-hero-rule"></view>
			<text class="zh-hero-desc">{{ hideAI ? '在虚拟绣布上选线、落针，在指尖体验千年婺绣的匠心与浪漫' : '从虚拟绣布到 AI 底稿，在指尖体验千年婺绣的匠心与浪漫' }}</text>
		</view>

		<!-- 两大模块卡片 -->
		<view class="zh-list">
			<!-- 线上刺绣DIY -->
			<view class="mod-card wy-card" @tap="go('diy')">
				<view class="mod-thumb">
					<image class="mod-img" :src="img('diy-cover-full.jpg')" mode="aspectFill"></image>
					<text class="mod-idx mod-idx-1">壹</text>
				</view>
				<view class="mod-body">
					<text class="mod-title wy-serif">线上刺绣DIY</text>
					<text class="mod-desc">虚拟绣布 · 多色绣线 · 四种针法，不用实物针线就能创作婺绣作品</text>
					<view class="mod-foot">
						<text class="wy-tag">互动体验</text>
						<text class="mod-more">开始创作 ›</text>
					</view>
				</view>
			</view>

			<!-- AI 纹样生成（isDisplay=1 时隐藏） -->
			<view class="mod-card wy-card" v-if="!hideAI" @tap="go('custom')">
				<view class="mod-thumb">
					<image class="mod-img" :src="img('ai-pattern-cover.jpg')" mode="aspectFill"></image>
					<text class="mod-idx mod-idx-2">贰</text>
				</view>
				<view class="mod-body">
					<text class="mod-title wy-serif">AI纹样生成</text>
					<text class="mod-desc">匠心·智绘定制，上传照片或输入灵感文字，AI 自动生成婺绣风格底稿</text>
					<view class="mod-foot">
						<text class="wy-tag">AI 定制</text>
						<text class="mod-more">去生成 ›</text>
					</view>
				</view>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">匠心 · 智绘 · 非遗新生</text>
		</view>
	</view>
</template>

<script>
	import { img, getHideAI } from '../../utils/cloud'

	export default {
		data() {
			return {
				hideAI: false
			}
		},
		onLoad() {
			getHideAI().then((hide) => { this.hideAI = hide })
		},
		methods: {
			img, // 暴露给模板调用
			onBack() {
				uni.navigateBack()
			},
			go(path) {
				uni.navigateTo({ url: '/pages/' + path + '/' + path })
			}
		}
	}
</script>

<style>
.zh-page { padding: 0 0 40rpx; }

/* 自定义顶栏 */
.nav-bar {
	display: flex; align-items: center;
	padding: 24rpx 32rpx;
	background: #FFFDF7;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.2);
}
.nav-back {
	width: 60rpx; height: 60rpx;
	display: flex; align-items: center; justify-content: center;
}
.nav-back-ico { font-size: 48rpx; color: #C08A1E; line-height: 1; }
.nav-title {
	flex: 1; text-align: center;
	font-size: 34rpx; color: #2E2620; font-weight: bold;
}
.nav-placeholder { width: 60rpx; }

/* 品牌引导 */
.zh-hero {
	padding: 40rpx 40rpx 20rpx;
	display: flex; flex-direction: column; align-items: center; gap: 14rpx;
}
.zh-hero-title {
	font-size: 44rpx;
	letter-spacing: 6rpx;
}
.zh-hero-sub {
	font-size: 26rpx; color: #9A8F85; letter-spacing: 4rpx;
}
.zh-hero-rule {
	width: 48rpx; height: 2rpx;
	background: linear-gradient(90deg, transparent, #C08A1E, transparent);
	margin: 10rpx 0 8rpx;
}
.zh-hero-desc {
	font-size: 26rpx; color: #6E6252; text-align: center;
	line-height: 1.8;
	padding: 0 20rpx;
}

/* 两大模块卡片容器 */
.zh-list {
	padding: 20rpx 32rpx;
	display: flex; flex-direction: column; gap: 28rpx;
}

/* 卡片 —— 首页同款 .mod-card */
.mod-card {
	padding: 16rpx;
}
.mod-card .mod-thumb {
	position: relative;
	height: 320rpx;
	border-radius: 16rpx;
	overflow: hidden;
}
.mod-card .mod-img {
	width: 100%; height: 320rpx;
	border-radius: 16rpx;
	display: block;
}
.mod-card .mod-idx {
	position: absolute;
	top: 20rpx; right: 20rpx;
	font-family: 'STKaiti', 'KaiTi', '楷体', serif;
	font-size: 44rpx;
	font-weight: bold;
	letter-spacing: 2rpx;
	padding: 6rpx 20rpx;
	border-radius: 8rpx;
	color: #fff;
}
.mod-card .mod-idx-1 {
	background: linear-gradient(135deg, rgba(200, 16, 46, 0.85), rgba(192, 138, 30, 0.85));
}
.mod-card .mod-idx-2 {
	background: linear-gradient(135deg, rgba(42, 74, 127, 0.85), rgba(59, 122, 87, 0.85));
}
.mod-card .mod-body {
	padding: 20rpx 10rpx 10rpx;
}
.mod-card .mod-title {
	font-size: 34rpx;
	color: #2E2620;
	font-weight: bold;
	letter-spacing: 2rpx;
}
.mod-card .mod-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 26rpx;
	color: #6E6252;
	line-height: 1.7;
}
.mod-card .mod-foot {
	display: flex; justify-content: space-between; align-items: center;
	margin-top: 14rpx;
}
.mod-card .mod-more {
	font-size: 24rpx; color: #8A5A12;
}
</style>
