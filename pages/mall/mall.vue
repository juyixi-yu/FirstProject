<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 84%"></view>
			<view class="wy-skel wy-skel-line" style="width: 60%"></view>
			<view class="wy-skel wy-skel-line" style="width: 44%"></view>
			<view class="wy-skel wy-skel-img" style="height: 420rpx; margin-top: 28rpx"></view>
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

		<!-- 购物车 / 订单入口 -->
		<view class="mall-actions">
			<view class="ma-item" @tap="goCart">
				<text class="ma-ico">🛒</text>
				<text class="ma-txt">购物车</text>
				<text class="ma-badge" v-if="cartNum > 0">{{ cartNum }}</text>
			</view>
			<view class="ma-item" @tap="goOrders">
				<text class="ma-ico">📋</text>
				<text class="ma-txt">我的订单</text>
			</view>
		</view>

		<!-- 主推产品：城市记忆礼盒 -->
		<view class="wy-sec">
			<view class="hero-prod wy-card">
				<image class="hero-prod-img" :src="IMG.hero" mode="aspectFill"></image>
				<view class="hero-prod-mask"></view>
				<view class="hero-prod-info">
					<text class="hp-badge wy-tag">{{ heroProd.badge }}</text>
					<text class="hp-title wy-serif">{{ heroProd.title }}</text>
					<text class="hp-desc">{{ heroProd.desc }}</text>
				</view>
			</view>

			<view class="tier-list">
				<view
					class="tier-card"
					:class="{ active: tierIndex === i }"
					v-for="(t, i) in tiers"
					:key="i"
					@tap="selectTier(i)"
				>
					<view class="tier-head">
						<text class="tier-name wy-serif">{{ t.name }}</text>
						<text class="tier-price">{{ t.price }}</text>
					</view>
					<text class="tier-ratio">{{ t.ratio }}</text>
					<text class="tier-desc">{{ t.desc }}</text>
					<text class="tier-check" v-if="tierIndex === i">✓</text>
				</view>
			</view>

			<view class="mem-card">
				<text class="mem-label">城市记忆文创</text>
				<view class="mem-tags">
					<text class="mem-tag" v-for="(m, i) in memories" :key="i">{{ m }}</text>
				</view>
			</view>

			<view class="wy-btn tier-buy" @tap="buyTier">
				<text>选购 {{ tiers[tierIndex].name }} · {{ tiers[tierIndex].price }}</text>
			</view>
		</view>

		<!-- 商品列表 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">日常文创</text>
			</view>
			<view class="prod-grid">
				<view class="prod-card" v-for="(p, i) in products" :key="i" @tap="buy(p)">
					<view class="prod-img-wrap">
						<image class="prod-img" :src="p.img" mode="aspectFill"></image>
						<view class="prod-fav" :class="{ active: isFav(p.id) }" @tap.stop="toggleFav(p)">
							<text class="prod-fav-ico">{{ isFav(p.id) ? '♥' : '♡' }}</text>
						</view>
					</view>
					<view class="prod-info">
						<text class="prod-name wy-serif">{{ p.name }}</text>
						<text class="prod-desc">{{ p.desc }}</text>
						<view class="prod-foot">
							<text class="prod-price">{{ p.price }}</text>
							<view class="prod-btns">
								<text class="prod-add" @tap.stop="addCart(p)">加购</text>
								<text class="prod-buy" @tap.stop="buy(p)">购买</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 限时活动：特惠 / 拼团 / 秒杀 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">限时活动</text>
			</view>
			<view class="act-head">
				<text class="act-hint">距本场结束</text>
				<text class="act-clock">{{ countdown }}</text>
			</view>
			<view class="act-list">
				<view class="act-card" :class="'act-' + a.type" v-for="(a, i) in activities" :key="i" @tap="buyActivity(a)">
					<view class="act-top">
						<text class="act-tag">{{ a.tag }}</text>
						<text class="act-title wy-serif">{{ a.title }}</text>
					</view>
					<text class="act-desc">{{ a.desc }}</text>
					<view class="act-foot">
						<view class="act-price-box">
							<text class="act-price">{{ a.price }}</text>
							<text class="act-origin" v-if="a.origin">{{ a.origin }}</text>
						</view>
						<text class="act-btn">{{ a.btn }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 两大玩法 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">两大玩法</text>
			</view>
			<view class="play-list">
				<view class="play-card" v-for="(p, i) in plays" :key="i">
					<text class="play-no wy-serif">{{ p.no }}</text>
					<view class="play-body">
						<text class="play-title">{{ p.title }}</text>
						<text class="play-desc">{{ p.desc }}</text>
						<view class="play-tags">
							<text class="wy-tag" v-for="(t, j) in p.tags" :key="j">{{ t }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 商业转化 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">多维商业转化</text>
			</view>
			<view class="convert-list">
				<view class="convert-item" v-for="(c, i) in converts" :key="i">
					<text class="convert-no">{{ i + 1 }}</text>
					<view class="convert-body">
						<text class="convert-title">{{ c.title }}</text>
						<text class="convert-desc">{{ c.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 渠道 -->
		<view class="wy-sec">
			<view class="channel-card">
				<text class="channel-title wy-serif">{{ channelTitle }}</text>
				<text class="channel-desc">{{ channelDesc }}</text>
				<view class="channel-tags">
					<text class="chan-tag" v-for="(t, i) in channelTags" :key="i">{{ t }}</text>
				</view>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">智能文创商城 · 电商零售</text>
		</view>
		</block>
	</view>
</template>

<script>
	import { img, getPage } from '../../utils/cloud'
	import { DEFAULT_PRODUCTS } from '../../utils/products'
	import { addToCart, cartCount } from '../../utils/cart'

	const FAV_KEY = 'wy_favorites'

	/** 从商品图片文件名派生稳定 id（如 product-pendant.jpg → pendant） */
	function deriveId(p) {
		if (p && p.id) return p.id
		if (p && p.img) {
			const m = String(p.img).match(/([^/]+)\.[^.]+$/)
			if (m) return m[1].replace(/^product-/, '')
		}
		return p && p.name ? String(p.name) : ''
	}

	function loadFavIds() {
		try {
			const raw = uni.getStorageSync(FAV_KEY)
			if (raw && Array.isArray(raw)) return raw.map((f) => f.id)
		} catch (e) {}
		return []
	}

	function defImg() {
		return {
			pendant: img('pendant-hero.jpg'),
			hero: img('/static/city-memory-hero.jpg')
		}
	}

	export default {
		data() {
			return {
				loading: true,
				IMG: defImg(),
				head: {
					cn: '智能文创商城',
					sub: '买回去，就能看、能听 · 非遗文创',
					desc: '主推婺绣非遗礼盒系列（三档可选），把浦江板凳龙、义乌商贸、东阳木雕、永康五金一一装进盒子'
				},
				heroProd: {
					badge: '主推 · 一城记忆入盒',
					title: '婺绣非遗礼盒系列',
					desc: '入门体验、雅致馈赠、典藏臻品三档可选，把浦江板凳龙、义乌商贸、东阳木雕、永康五金一一装进盒子，非遗文创 × 城市记忆，开箱即是金华'
				},
				tierIndex: 1,
				tiers: [
					{
						name: '入门体验礼盒',
						price: '¥ 89',
						ratio: '浦江板凳龙 · 义乌商贸纹样',
						desc: '萃取金华本土民俗纹样，融合浦江板凳龙、义乌商贸元素，日常体验与伴手礼皆宜。'
					},
					{
						name: '雅致馈赠礼盒',
						price: '¥ 199',
						ratio: '东阳木雕 · 永康五金',
						desc: '结合东阳木雕、永康五金跨界设计，木纹与金属质感相映，馈赠体面雅致。'
					},
					{
						name: '典藏臻品礼盒',
						price: '¥ 299',
						ratio: '重工绣艺 · 数字新品',
						desc: '搭配数字新兴产品，采用重工绣艺与科技赋能打造，收藏级典藏之作。'
					}
				],
				memories: ['义乌丝路商贸', '东阳木雕纹样', '永康五金雕塑纹样', '浦江板凳龙符号'],
				channelTitle: '线上线下联动渠道',
				channelDesc: '抖音、淘宝等主流电商平台同步上架，短视频种草、科技直播间带货，构建“黑科技 + 老手艺”的新型销售模式。',
				channelTags: ['抖音', '淘宝', '小红书', '短视频种草', '科技直播间'],
				products: DEFAULT_PRODUCTS.map((p) => ({ ...p })),
				favIds: [],
				cartNum: 0,
				countdown: '00:00:00',
				clockTimer: null,
				activities: [
					{
						type: 'limit',
						tag: '限时特惠',
						title: '雅致馈赠礼盒 · 今日直降',
						desc: '今日 24:00 前下单立减 40 元，错过恢复原价',
						price: '¥ 159',
						origin: '¥ 199',
						btn: '立即抢购',
						spec: '限时特惠 · 雅致馈赠礼盒'
					},
					{
						type: 'group',
						tag: '三人拼团',
						title: '入门体验礼盒 · 拼团价',
						desc: '3 人成团即享拼团价，拼团成功后统一发货',
						price: '¥ 69',
						origin: '¥ 89',
						btn: '发起拼团',
						spec: '三人拼团 · 入门体验礼盒'
					},
					{
						type: 'seckill',
						tag: '整点秒杀',
						title: '数字纹样挂件 · 限量 50 件',
						desc: '每场限量 50 件，售完即止，每人限购 1 件',
						price: '¥ 39',
						origin: '¥ 79',
						btn: '马上抢',
						spec: '整点秒杀 · 数字纹样挂件'
					}
				],
				plays: [
					{ no: '壹', title: 'IP 联名', desc: '推出十二生肖定制、婺州古建等主题款，把婺绣与大众熟悉的 IP 相连。', tags: ['十二生肖定制', '婺州古建主题'] },
					{ no: '贰', title: '盲盒经济', desc: '设置基础款与隐藏款，利用随机性带动年轻人复购与收藏。', tags: ['基础款', '全息投影限量挂件', '传承人签名单品'] }
				],
				converts: [
					{ title: '景区数字化寻宝兑换', desc: '与景区售卖店联动，把挂件升级为“数字门票”，集齐 IP 款式即可兑换 NFC 智能投影挂件。' },
					{ title: '高端酒店联名预售', desc: '与高端酒店联名预售，让文创走进品质场景，实现多维度的商业转化。' }
				]
			}
		},
		onLoad() {
			this.fetch()
		},
		onShow() {
			this.favIds = loadFavIds()
			this.cartNum = cartCount()
			this.startClock()
		},
		onHide() {
			this.stopClock()
		},
		onUnload() {
			this.stopClock()
		},
		methods: {
			async fetch() {
				const d = await getPage('mall')
				this.loading = false
				if (!d) return
				if (d.images) {
					const next = { ...this.IMG }
					Object.keys(d.images).forEach((k) => { next[k] = img(d.images[k]) })
					this.IMG = next
				}
				// 主推为固定产品（婺绣非遗礼盒系列），礼盒名称与档位价格只认本地定义，
				// 避免云数据库的旧 mall 文档把礼盒名称/价格改回旧的三档款
				if (d.memories) this.memories = d.memories
				if (d.products) {
					this.products = d.products.map((p) => ({
						...p,
						id: deriveId(p),
						img: img(p.img)
					}))
				}
				if (d.plays) this.plays = d.plays
				if (d.converts) this.converts = d.converts
				if (d.channelTitle) this.channelTitle = d.channelTitle
				if (d.channelDesc) this.channelDesc = d.channelDesc
				if (d.channelTags) this.channelTags = d.channelTags
			},
			selectTier(i) {
				if (this.tierIndex === i) return
				this.tierIndex = i
				uni.showToast({ title: '已选「' + this.tiers[i].name + '」', icon: 'none' })
			},
			/** 今日剩余时间倒计时（限时活动氛围） */
			startClock() {
				this.stopClock()
				this.tickClock()
				this.clockTimer = setInterval(() => this.tickClock(), 1000)
			},
			stopClock() {
				if (this.clockTimer) {
					clearInterval(this.clockTimer)
					this.clockTimer = null
				}
			},
			tickClock() {
				const now = new Date()
				const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
				let s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
				const p = (n) => (n < 10 ? '0' + n : '' + n)
				this.countdown = p(Math.floor(s / 3600)) + ':' + p(Math.floor((s % 3600) / 60)) + ':' + p(s % 60)
			},
			goCart() {
				uni.navigateTo({ url: '/pages/cart/cart' })
			},
			goOrders() {
				uni.navigateTo({ url: '/pages/orders/orders' })
			},
			addCart(p) {
				addToCart(p)
				this.cartNum = cartCount()
				uni.showToast({ title: '已加入购物车', icon: 'success' })
			},
			/** 限时特惠 / 拼团 / 秒杀统一进入订单确认页 */
			buyActivity(a) {
				this.goConfirm({
					from: 'activity',
					title: a.tag + ' · ' + a.title,
					price: a.price,
					spec: a.spec + '（' + a.desc + '）',
					img: this.IMG.hero
				})
			},
			/** 统一跳转订单确认页（当前版本不做真实支付） */
			goConfirm(params) {
				const q = Object.keys(params)
					.filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
					.map((k) => k + '=' + encodeURIComponent(params[k]))
					.join('&')
				uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
			},
			buyTier() {
				const t = this.tiers[this.tierIndex]
				this.goConfirm({
					from: 'mall',
					title: '婺绣非遗礼盒 · ' + t.name,
					price: t.price,
					spec: t.ratio,
					img: this.IMG.hero
				})
			},
			buy(p) {
				const prod = typeof p === 'string' ? this.products.find((x) => x.name === p) || { name: p } : p
				this.goConfirm({
					from: 'mall',
					title: prod.name,
					price: prod.price,
					spec: prod.desc || '非遗文创',
					img: prod.img
				})
			},
			isFav(id) {
				return this.favIds.indexOf(id) >= 0
			},
			toggleFav(p) {
				let list = []
				try {
					const raw = uni.getStorageSync(FAV_KEY)
					list = (raw && Array.isArray(raw)) ? raw : []
				} catch (e) {
					list = []
				}
				const idx = list.findIndex((f) => f.id === p.id)
				if (idx >= 0) {
					list.splice(idx, 1)
					this.favIds = this.favIds.filter((id) => id !== p.id)
					uni.showToast({ title: '已取消收藏', icon: 'none' })
				} else {
					list.unshift({ id: p.id, name: p.name, desc: p.desc, price: p.price, img: p.img })
					this.favIds.push(p.id)
					uni.showToast({ title: '收藏成功', icon: 'success' })
				}
				try {
					uni.setStorageSync(FAV_KEY, list)
				} catch (e) {
					// ignore
				}
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
		font-size: 64rpx;
		letter-spacing: 8rpx;
	}

	.title-sub {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		letter-spacing: 2rpx;
		color: var(--wy-txt-2);
	}

	/* 主推 */
	.hero-prod {
		position: relative;
		height: 520rpx;
		margin-top: 28rpx;
	}

	.hero-prod-img {
		width: 100%;
		height: 520rpx;
	}

	.hero-prod-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background-image: linear-gradient(180deg, rgba(14, 11, 10, 0.1) 0%, rgba(14, 11, 10, 0.86) 78%);
	}

	.hero-prod-info {
		position: absolute;
		left: 30rpx;
		right: 30rpx;
		bottom: 30rpx;
	}

	/* 压在主推商品图深色遮罩上，用浅色保证可读 */
	.hp-badge {
		color: #F6E6AE;
		border-color: rgba(241, 217, 143, 0.45);
		background-color: rgba(20, 16, 12, 0.42);
	}

	.hp-title {
		display: block;
		margin-top: 16rpx;
		font-size: 46rpx;
		color: var(--wy-on-img);
		letter-spacing: 2rpx;
	}

	.hp-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-on-img-2);
	}

	/* 主推档位 */
	.tier-list {
		margin-top: 22rpx;
	}

	.tier-card {
		position: relative;
		box-sizing: border-box;
		padding: 24rpx 26rpx;
		margin-bottom: 16rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.tier-card.active {
		border-color: var(--wy-gold);
		background-image: linear-gradient(135deg, rgba(212, 175, 55, 0.14), rgba(214, 197, 166, 0.42));
	}

	.tier-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.tier-name {
		font-size: 32rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.tier-price {
		font-size: 32rpx;
		font-weight: 600;
		color: var(--wy-gold-dk);
	}

	.tier-ratio {
		display: block;
		margin-top: 12rpx;
		font-size: 24rpx;
		color: var(--wy-gold-dk);
		letter-spacing: 1rpx;
	}

	.tier-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-txt-2);
	}

	.tier-check {
		position: absolute;
		top: 18rpx;
		right: 18rpx;
		width: 34rpx;
		height: 34rpx;
		line-height: 34rpx;
		text-align: center;
		font-size: 20rpx;
		color: #2A1C08;
		border-radius: 50%;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
	}

	/* 城市记忆文创 */
	.mem-card {
		margin-top: 22rpx;
		padding: 24rpx 26rpx;
		border-radius: 18rpx;
		border: 1rpx dashed rgba(160, 120, 40, 0.35);
		background-color: rgba(200, 154, 59, 0.06);
	}

	.mem-label {
		display: block;
		font-size: 26rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.mem-tags {
		display: flex;
		flex-wrap: wrap;
		margin-top: 14rpx;
	}

	.mem-tag {
		margin: 0 14rpx 14rpx 0;
		padding: 8rpx 22rpx;
		font-size: 23rpx;
		color: var(--wy-gold-lt);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
		background-color: rgba(200, 154, 59, 0.1);
	}

	.tier-buy {
		margin-top: 10rpx;
		text-align: center;
	}

	/* 商品 */
	.prod-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.prod-card {
		width: 335rpx;
		box-sizing: border-box;
		margin-bottom: 22rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
		overflow: hidden;
	}

	.prod-img-wrap {
		position: relative;
		width: 335rpx;
		height: 240rpx;
	}

	.prod-img {
		width: 335rpx;
		height: 240rpx;
	}

	.prod-fav {
		position: absolute;
		top: 12rpx;
		right: 12rpx;
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 253, 247, 0.72);
		backdrop-filter: blur(4rpx);
	}

	.prod-fav-ico {
		font-size: 34rpx;
		color: rgba(46, 38, 32, 0.55);
		line-height: 1;
	}

	.prod-fav.active .prod-fav-ico {
		color: #C08A1E;
	}

	.prod-info {
		padding: 18rpx 20rpx 22rpx;
	}

	.prod-name {
		display: block;
		font-size: 30rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.prod-desc {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	.prod-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 18rpx;
	}

	.prod-price {
		font-size: 27rpx;
		color: var(--wy-gold);
		font-weight: 600;
	}

	.prod-buy {
		padding: 6rpx 24rpx;
		font-size: 23rpx;
		color: #2A1C08;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
	}

	/* 玩法 */
	.play-list {
		margin-top: 28rpx;
	}

	.play-card {
		display: flex;
		padding: 28rpx 26rpx;
		margin-bottom: 22rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.play-no {
		width: 80rpx;
		font-size: 46rpx;
		color: rgba(138, 101, 22, 0.5);
	}

	.play-body {
		flex: 1;
	}

	.play-title {
		display: block;
		font-size: 32rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.play-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 25rpx;
		line-height: 40rpx;
		color: var(--wy-txt-2);
	}

	.play-tags {
		display: flex;
		flex-wrap: wrap;
		margin-top: 16rpx;
	}

	.play-tags .wy-tag {
		margin: 0 12rpx 12rpx 0;
	}

	/* 商业转化 */
	.convert-list {
		margin-top: 28rpx;
	}

	.convert-item {
		display: flex;
		padding: 26rpx 26rpx;
		margin-bottom: 20rpx;
		border-radius: 20rpx;
		background-image: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(214, 197, 166, 0.45));
		border: 1rpx solid rgba(160, 120, 40, 0.18);
	}

	.convert-no {
		width: 54rpx;
		height: 54rpx;
		line-height: 54rpx;
		text-align: center;
		margin-right: 20rpx;
		font-size: 26rpx;
		color: #2A1C08;
		border-radius: 50%;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
	}

	.convert-body {
		flex: 1;
	}

	.convert-title {
		display: block;
		font-size: 30rpx;
		color: var(--wy-txt);
	}

	.convert-desc {
		display: block;
		margin-top: 10rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-txt-2);
	}

	/* 渠道 */
	.channel-card {
		padding: 34rpx 30rpx;
		border-radius: 22rpx;
		border: 1rpx solid var(--wy-line);
		background-image: linear-gradient(135deg, rgba(200, 16, 46, 0.14), rgba(214, 197, 166, 0.5));
	}

	.channel-title {
		display: block;
		font-size: 34rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.channel-desc {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		line-height: 44rpx;
		color: var(--wy-txt-2);
	}

	.channel-tags {
		display: flex;
		flex-wrap: wrap;
		margin-top: 22rpx;
	}

	.chan-tag {
		margin: 0 14rpx 14rpx 0;
		padding: 8rpx 22rpx;
		font-size: 23rpx;
		color: var(--wy-gold-lt);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
		background-color: rgba(200, 154, 59, 0.10);
	}

	/* 购物车 / 订单入口 */
	.mall-actions {
		display: flex;
		padding: 0 28rpx;
		margin-top: 24rpx;
	}

	.ma-item {
		position: relative;
		display: flex;
		align-items: center;
		padding: 16rpx 30rpx;
		margin-right: 16rpx;
		border-radius: 999rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.ma-ico {
		font-size: 26rpx;
	}

	.ma-txt {
		margin-left: 10rpx;
		font-size: 24rpx;
		color: var(--wy-txt);
	}

	.ma-badge {
		position: absolute;
		top: -8rpx;
		right: -6rpx;
		min-width: 30rpx;
		height: 30rpx;
		line-height: 30rpx;
		padding: 0 8rpx;
		text-align: center;
		font-size: 19rpx;
		color: #fff;
		border-radius: 999rpx;
		background-color: #C8102E;
	}

	/* 商品操作 */
	.prod-btns {
		display: flex;
		align-items: center;
	}

	.prod-add {
		padding: 6rpx 18rpx;
		margin-right: 10rpx;
		font-size: 21rpx;
		color: var(--wy-gold-dk);
		border: 1rpx solid rgba(160, 120, 40, 0.45);
		border-radius: 999rpx;
	}

	/* 限时活动 */
	.act-head {
		display: flex;
		align-items: center;
		margin-top: 20rpx;
	}

	.act-hint {
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	.act-clock {
		margin-left: 12rpx;
		padding: 4rpx 14rpx;
		font-size: 24rpx;
		font-weight: 600;
		color: #fff;
		letter-spacing: 1rpx;
		border-radius: 8rpx;
		background-color: #2A1C08;
	}

	.act-list {
		margin-top: 18rpx;
	}

	.act-card {
		padding: 24rpx 26rpx;
		margin-bottom: 18rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.act-limit {
		background-image: linear-gradient(135deg, rgba(200, 16, 46, 0.08), rgba(214, 197, 166, 0.42));
	}

	.act-group {
		background-image: linear-gradient(135deg, rgba(201, 154, 59, 0.12), rgba(214, 197, 166, 0.42));
	}

	.act-seckill {
		background-image: linear-gradient(135deg, rgba(111, 168, 154, 0.12), rgba(214, 197, 166, 0.42));
	}

	.act-top {
		display: flex;
		align-items: center;
	}

	.act-tag {
		padding: 4rpx 14rpx;
		margin-right: 14rpx;
		font-size: 20rpx;
		color: #fff;
		border-radius: 6rpx;
		background-color: #C8102E;
	}

	.act-group .act-tag {
		background-color: #C08A1E;
	}

	.act-seckill .act-tag {
		background-color: #4E8A7B;
	}

	.act-title {
		flex: 1;
		font-size: 28rpx;
		color: var(--wy-txt);
	}

	.act-desc {
		display: block;
		margin-top: 12rpx;
		font-size: 22rpx;
		line-height: 34rpx;
		color: var(--wy-txt-2);
	}

	.act-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 16rpx;
	}

	.act-price {
		font-size: 34rpx;
		font-weight: 600;
		color: #C8102E;
	}

	.act-origin {
		margin-left: 12rpx;
		font-size: 22rpx;
		color: #B5AA9C;
		text-decoration: line-through;
	}

	.act-btn {
		padding: 10rpx 30rpx;
		font-size: 24rpx;
		color: #fff;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #E8C872, #C08A1E);
	}

	.act-seckill .act-btn {
		background-image: linear-gradient(135deg, #8FC4B4, #4E8A7B);
	}
</style>
