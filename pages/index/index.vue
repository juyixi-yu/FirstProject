<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 88%"></view>
			<view class="wy-skel wy-skel-line" style="width: 62%"></view>
			<view class="wy-skel wy-skel-img" style="height: 420rpx; margin-top: 28rpx"></view>
			<view class="wy-skel wy-skel-img" style="height: 300rpx; margin-top: 28rpx"></view>
		</view>
		<!-- 加载失败 -->
		<view v-else-if="loadFailed" class="load-fail">
			<text class="load-fail-title wy-serif wy-gold-title">内容加载失败</text>
			<text class="load-fail-desc">未从云数据库取到内容，请确认 wy-content 云函数已部署、云数据库已初始化</text>
			<view class="wy-btn-ghost load-fail-btn" @tap="fetch">重新加载</view>
		</view>
		<!-- 真实内容 -->
		<block v-else>
		<!-- Hero 品牌门面 -->
		<view class="hero">
			<image class="hero-img" :src="IMG.hero" mode="aspectFill"></image>
			<view class="hero-mask"></view>
			<view class="hero-inner">
				<text class="hero-eyebrow">{{ hero.eyebrow }}</text>
				<text class="hero-brand wy-serif wy-gold-title">{{ hero.brand }}</text>
				<text class="hero-slogan wy-serif">{{ hero.slogan }}</text>
				<view class="hero-rule"></view>
				<text class="hero-desc">{{ hero.desc }}</text>
				<view class="hero-btn wy-btn" @tap="go('exhibition')">
					<text>{{ hero.cta }}</text>
					<text class="hero-btn-arrow">›</text>
				</view>
			</view>
		</view>

		<!-- 顶部快捷宫格导航 -->
		<view class="quick-grid">
			<view class="quick-cell" v-for="(m, i) in modules" :key="i" @tap="go(m.path)">
				<view class="quick-badge">
					<text class="quick-ico">{{ quickIcons[m.path] }}</text>
				</view>
				<text class="quick-label">{{ quickLabels[m.path] }}</text>
			</view>
		</view>

		<!-- 六大核心模块 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">{{ sections.modulesTitle }}</text>
			</view>
			<text class="wy-sec-sub">{{ sections.modulesSub }}</text>
			<view class="mod-list">
				<view class="mod-card wy-card" v-for="(m, i) in modules" :key="i" @tap="go(m.path)">
					<view class="mod-thumb">
						<image class="mod-img" :src="m.img" mode="aspectFill"></image>
						<text class="mod-index">{{ m.no }}</text>
					</view>
					<view class="mod-body">
						<text class="mod-title wy-serif">{{ m.title }}</text>
						<text class="mod-desc">{{ m.desc }}</text>
						<view class="mod-foot">
							<text class="wy-tag">{{ m.tag }}</text>
							<text class="mod-more">查看详情 ›</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 线下生态 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">{{ sections.offlineTitle }}</text>
			</view>
			<text class="wy-sec-sub">{{ sections.offlineSub }}</text>
			<view class="off-list">
				<view class="off-item" v-for="(o, i) in offline" :key="i">
					<text class="off-no wy-serif">{{ o.no }}</text>
					<view class="off-body">
						<text class="off-title">{{ o.title }}</text>
						<text class="off-desc">{{ o.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- NFC 碰一碰 · 四大玩法 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">{{ sections.nfcTitle }}</text>
			</view>
			<text class="wy-sec-sub">{{ sections.nfcSub }}</text>
			<view class="nfc-grid">
				<view class="nfc-item wy-card" v-for="(it, i) in nfc" :key="i">
					<text class="nfc-no">{{ it.no }}</text>
					<text class="nfc-name wy-serif">{{ it.name }}</text>
					<text class="nfc-desc">{{ it.desc }}</text>
				</view>
			</view>
		</view>

		<!-- 页脚 -->
		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">{{ footer.brand }}</text>
			<text class="wy-footer-line">{{ footer.line }}</text>
			<view class="footer-cta">{{ footer.cta }}</view>
		</view>
		</block>
	</view>
</template>

<script>
	import { img, getPage, getHideAI } from '../../utils/cloud'

	// 提审期（isDisplay=1）用于替换含「AI」字样的中性文案；isDisplay=0 时原样显示数据库文案
	const NEUTRAL_SECTIONS = {
		modulesTitle: '核心功能模块',
		modulesSub: '从文创商城到智绘定制、从美育课堂到线下体验，一站式体验非遗新生'
	}
	// 模块更名：记忆金属 → 文物纹样提取（功能不变，仅改展示文案）
	const MODULE_RENAME = {
		metal: {
			title: '文物纹样提取',
			desc: '上传文物、老绣片照片，提取可复用的婺绣纹样，亦可定制成随身饰片',
			tag: '纹样提取',
			img: '/static/metal-cover.jpg'
		}
	}
	// 模块展示顺序：智绘刺绣(DIY+AI合并) → 文创商城 → 美育课堂 → 纹样修复 → 文物纹样提取
	const MODULE_ORDER = ['zhihui', 'mall', 'classroom', 'pattern', 'metal']
	// 隐藏 AI 模块后按顺序重新编号，避免出现断号
	const MODULE_NO = ['壹', '贰', '叁', '肆', '伍']
	// tabBar 页面集合，跳转这些页面必须用 switchTab 而非 navigateTo
	const TAB_PATHS = ['index', 'mall', 'zhihui', 'classroom', 'mine']

	export default {
		data() {
			return {
				loading: true,
				loadFailed: false,
				hideAI: false,
				IMG: {},
				hero: {},
				nfc: [],
				modules: [],
				offline: [],
				sections: {},
				footer: {},
				quickIcons: {
					zhihui: '🪡',
					mall: '🛍️',
					classroom: '📖',
					pattern: '🧵',
					metal: '✨'
				},
				// 快速导航短名称（独立于模块卡片的完整标题）
				quickLabels: {
					zhihui: '智绘刺绣',
					mall: '文创商城',
					classroom: '美育课堂',
					pattern: '纹样修复',
					metal: '文物纹样提取'
				}
			}
		},
		onLoad() {
			this.fetch()
		},
		methods: {
			async fetch() {
				this.loading = true
				this.loadFailed = false
				this.hideAI = await getHideAI()
				const d = await getPage('index')
				this.loading = false
				if (!d) {
					this.loadFailed = true
					return
				}
				if (d.images) {
					const next = {}
					Object.keys(d.images).forEach((k) => { next[k] = img(d.images[k]) })
					this.IMG = next
				}
				if (d.hero) this.hero = d.hero
				if (d.nfc) this.nfc = d.nfc
				if (d.modules) {
					// isDisplay=1 时隐藏 AI 模块入口
					let list = d.modules.filter((m) => {
						// isDisplay=1 时隐藏所有 AI 相关模块入口（纹样修复、记忆金属）
						if (this.hideAI && (m.path === 'pattern' || m.path === 'metal')) return false
						// diy 和 custom 合并为 zhihui，两者都不单独展示
						if (m.path === 'diy' || m.path === 'custom') return false
						return true
					})
					// diy + custom 合并为一个「匠心智绘定制」大模块，固定排第一
					list.push({
						title: '匠心智绘定制',
						desc: this.hideAI
							? '线上刺绣 DIY，从虚拟绣布到专属绣样，指尖体验千年婺绣'
							: '线上刺绣 DIY + AI 纹样生成，从虚拟绣布到 AI 底稿，指尖体验千年婺绣',
						tag: '匠心智绘',
						path: 'zhihui',
						img: 'zhihui-cover.jpg'
					})
					// 按 MODULE_ORDER 排序，并重新连续编号
					list.sort((a, b) => MODULE_ORDER.indexOf(a.path) - MODULE_ORDER.indexOf(b.path))
					this.modules = list.map((m, i) => {
						const o = MODULE_RENAME[m.path] ? { ...m, ...MODULE_RENAME[m.path] } : m
						return {
							...o,
							no: MODULE_NO[i],
							// 统一走 img()：/static/ 原样返回，裸文件名转 CDN
							img: img(o.img)
						}
					})
				}
				if (d.offline) this.offline = d.offline
				if (d.sections) {
					this.sections = this.hideAI ? { ...d.sections, ...NEUTRAL_SECTIONS } : d.sections
					// diy+custom 合并后模块数从 6 变回 5，云端标题里的「六大」同步改回「五大」
					if (!this.hideAI) {
						this.sections = {
							...this.sections,
							modulesTitle: String(this.sections.modulesTitle || '').replace('六大', '五大')
						}
					}
				}
				if (d.footer) this.footer = d.footer
			},
			go(path) {
				const url = '/pages/' + path + '/' + path
				if (TAB_PATHS.includes(path)) {
					uni.switchTab({ url })
				} else {
					uni.navigateTo({ url })
				}
			}
		}
	}
</script>

<style>
	/* Hero */
	.hero {
		position: relative;
		height: 720rpx;
		overflow: hidden;
	}

	.hero-img {
		width: 100%;
		height: 720rpx;
	}

	.hero-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background-image: linear-gradient(180deg, rgba(30, 24, 16, 0.34) 0%, rgba(30, 24, 16, 0.6) 55%, #F2EADC 100%);
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

	.hero-inner {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		padding: 92rpx 48rpx 0;
	}

	.hero-eyebrow {
		display: inline-block;
		padding: 6rpx 20rpx;
		font-size: 22rpx;
		letter-spacing: 3rpx;
		color: #F6E6AE;
		border: 1rpx solid rgba(241, 217, 143, 0.45);
		border-radius: 999rpx;
		background-color: rgba(20, 16, 12, 0.38);
	}

	/* 首页 Hero 文字压在照片上，需用浅金/浅色保证可读，不随浅色主题变深 */
	.hero-brand {
		display: block;
		margin-top: 34rpx;
		font-size: 96rpx;
		line-height: 108rpx;
		letter-spacing: 12rpx;
		font-weight: bolder;
		color: #F6E6AE;
		background-image: linear-gradient(135deg, #F6E6AE 0%, #D4AF37 55%, #C99A3B 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.hero-slogan {
		display: block;
		margin-top: 10rpx;
		font-size: 34rpx;
		letter-spacing: 6rpx;
		color: var(--wy-on-img);
	}

	.hero-rule {
		width: 120rpx;
		height: 3rpx;
		margin: 32rpx 0 26rpx;
		background-image: linear-gradient(90deg, #F1D98F, rgba(241, 217, 143, 0));
	}

	.hero-desc {
		display: block;
		width: 92%;
		font-size: 26rpx;
		line-height: 42rpx;
		color: var(--wy-on-img-2);
	}

	.hero-btn {
		margin-top: 44rpx;
	}

	.hero-btn-arrow {
		margin-left: 12rpx;
		font-size: 30rpx;
	}

	/* 顶部宫格导航 */
	.quick-grid {
		position: relative;
		z-index: 2;
		display: flex;
		justify-content: space-between;
		margin: -40rpx 32rpx 0;
		padding: 36rpx 20rpx 32rpx;
		background: #FFFBF3;
		border-radius: 28rpx;
		box-shadow: 0 12rpx 32rpx rgba(120, 90, 40, 0.12);
	}

	.quick-cell {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
	}

	.quick-badge {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: linear-gradient(135deg, #FFFBF3 0%, #F6E6AE 100%);
		border: 1rpx solid rgba(200, 154, 59, 0.30);
		box-shadow: 0 4rpx 12rpx rgba(200, 154, 59, 0.18);
	}

	.quick-ico {
		font-size: 44rpx;
		line-height: 1;
	}

	.quick-label {
		font-size: 24rpx;
		color: #2E2620;
		letter-spacing: 1rpx;
	}

	/* NFC */
	.nfc-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.nfc-item {
		width: 335rpx;
		box-sizing: border-box;
		padding: 26rpx 24rpx;
		margin-bottom: 20rpx;
	}

	.nfc-no {
		display: block;
		font-size: 40rpx;
		font-weight: 700;
		color: rgba(138, 101, 22, 0.5);
		font-family: "Songti SC", "STSong", serif;
	}

	.nfc-name {
		display: block;
		margin-top: 10rpx;
		font-size: 32rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.nfc-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 23rpx;
		line-height: 34rpx;
		color: var(--wy-txt-2);
	}

	/* 模块卡片 */
	.mod-list {
		margin-top: 28rpx;
	}

	.mod-card {
		margin-bottom: 26rpx;
	}

	.mod-thumb {
		position: relative;
		height: 320rpx;
	}

	.mod-img {
		width: 100%;
		height: 320rpx;
	}

	.mod-index {
		position: absolute;
		left: 24rpx;
		top: 20rpx;
		width: 62rpx;
		height: 62rpx;
		line-height: 62rpx;
		text-align: center;
		font-size: 30rpx;
		color: #2A1C08;
		border-radius: 50%;
		font-family: "Songti SC", "STSong", serif;
		background-image: linear-gradient(135deg, #F6E6AE, #D4AF37 60%, #C99A3B);
	}

	.mod-body {
		padding: 26rpx 28rpx 30rpx;
	}

	.mod-title {
		display: block;
		font-size: 38rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.mod-desc {
		display: block;
		margin-top: 14rpx;
		font-size: 25rpx;
		line-height: 40rpx;
		color: var(--wy-txt-2);
	}

	.mod-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 24rpx;
	}

	.mod-more {
		font-size: 25rpx;
		color: var(--wy-gold);
	}

	/* 线下生态 */
	.off-list {
		margin-top: 28rpx;
	}

	.off-item {
		display: flex;
		padding: 28rpx 26rpx;
		margin-bottom: 20rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-image: linear-gradient(135deg, rgba(200, 154, 59, 0.12), rgba(214, 197, 166, 0.45));
	}

	.off-no {
		width: 76rpx;
		font-size: 46rpx;
		line-height: 54rpx;
		color: rgba(138, 101, 22, 0.5);
	}

	.off-body {
		flex: 1;
	}

	.off-title {
		display: block;
		font-size: 31rpx;
		color: var(--wy-txt);
	}

	.off-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-txt-2);
	}

	/* 页脚 CTA */
	.footer-cta {
		display: inline-block;
		margin-top: 30rpx;
		padding: 16rpx 40rpx;
		font-size: 25rpx;
		letter-spacing: 4rpx;
		color: var(--wy-gold-lt);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
		background-color: rgba(200, 154, 59, 0.10);
	}
</style>