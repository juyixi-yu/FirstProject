<template>
	<view class="wy-page detail-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">商品详情</text>
			<view class="nav-placeholder"></view>
		</view>

		<block v-if="product">
			<!-- 商品图 -->
			<image class="detail-img" :src="product.img" mode="aspectFill"></image>

			<!-- 商品信息 -->
			<view class="detail-card wy-card">
				<text class="detail-name wy-serif">{{ product.name }}</text>
				<text class="detail-desc">{{ product.desc }}</text>
				<view class="detail-price-row">
					<text class="detail-price">{{ product.price }}</text>
					<text class="detail-tag wy-tag">非遗文创</text>
				</view>
			</view>

			<!-- 商品介绍 -->
			<view class="detail-card wy-card">
				<view class="wy-sec-head">
					<view class="wy-sec-bar"></view>
					<text class="wy-sec-title wy-serif">商品介绍</text>
				</view>
				<text class="detail-p">
					本品源自婺绣非遗工艺，由本项目团队联合非遗传承人共同设计开发。每一件作品都承载着千年婺州的针脚温度，是传统文化与现代生活美学的融合之作。
				</text>
				<text class="detail-p">
					· 材质：优选面料，手工刺绣工艺\n· 工艺：婺绣传统针法，一针一线手工制作\n· 包装：国风礼盒包装，适合自用与馈赠
				</text>
			</view>

			<!-- 底部操作栏 -->
			<view class="detail-bar">
				<view class="detail-fav" @tap="toggleFav">
					<text class="detail-fav-ico">{{ isFavorited ? '♥' : '♡' }}</text>
					<text class="detail-fav-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
				</view>
				<view class="detail-cart" @tap="addCart">
					<text class="detail-cart-text">加入购物车</text>
				</view>
				<view class="detail-buy" @tap="onBuy">
					<text class="detail-buy-text">立即购买</text>
				</view>
			</view>
		</block>

		<!-- 未找到商品 -->
		<view class="empty" v-else>
			<text class="empty-ico">📦</text>
			<text class="empty-text">商品信息加载失败</text>
		</view>
	</view>
</template>

<script>
import { getProductById } from '../../utils/products'
import { addToCart } from '../../utils/cart'

const FAV_KEY = 'wy_favorites'

function loadFavs() {
	try {
		const raw = uni.getStorageSync(FAV_KEY)
		if (raw && Array.isArray(raw)) return raw
	} catch (e) {}
	return []
}

function saveFavs(list) {
	try {
		uni.setStorageSync(FAV_KEY, list)
	} catch (e) {}
}

export default {
	data() {
		return {
			product: null,
			isFavorited: false
		}
	},
	onLoad(options) {
		const id = (options && options.id) || ''
		this.product = getProductById(id)
		if (this.product) {
			const favs = loadFavs()
			this.isFavorited = favs.some((f) => f.id === this.product.id)
		}
	},
	methods: {
		onBack() {
			uni.navigateBack()
		},
		toggleFav() {
			if (!this.product) return
			const favs = loadFavs()
			const idx = favs.findIndex((f) => f.id === this.product.id)
			if (idx >= 0) {
				favs.splice(idx, 1)
				this.isFavorited = false
				uni.showToast({ title: '已取消收藏', icon: 'none' })
			} else {
				favs.unshift(this.product)
				this.isFavorited = true
				uni.showToast({ title: '收藏成功', icon: 'success' })
			}
			saveFavs(favs)
		},
		addCart() {
			if (!this.product) return
			addToCart(this.product)
			uni.showToast({ title: '已加入购物车', icon: 'success' })
		},
		onBuy() {
			if (!this.product) return
			const p = this.product
			const q = [
				'from=product',
				'title=' + encodeURIComponent(p.name),
				'price=' + encodeURIComponent(p.price || '0'),
				'spec=' + encodeURIComponent('非遗文创 · 婺绣手工刺绣'),
				'img=' + encodeURIComponent(p.img || ''),
				'qty=1'
			].join('&')
			uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
		}
	}
}
</script>

<style>
.detail-page { padding: 0 0 140rpx; }

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

.detail-img {
	width: 100%;
	height: 560rpx;
}

.detail-card {
	margin: 24rpx 28rpx 0;
	padding: 28rpx;
}

.detail-name {
	display: block;
	font-size: 38rpx; color: #2E2620; font-weight: bold;
	letter-spacing: 2rpx;
}
.detail-desc {
	display: block;
	margin-top: 14rpx;
	font-size: 26rpx; color: #9A8F85;
	line-height: 1.7;
}
.detail-price-row {
	display: flex; align-items: center; gap: 20rpx;
	margin-top: 24rpx;
}
.detail-price {
	font-size: 40rpx; color: #C8102E; font-weight: bold;
}
.detail-tag {
	font-size: 22rpx;
}

.detail-p {
	display: block;
	margin-top: 18rpx;
	font-size: 26rpx; color: #4A3A2C;
	line-height: 1.85;
	white-space: pre-line;
}

/* 底部操作栏 */
.detail-bar {
	position: fixed;
	left: 0; right: 0; bottom: 0;
	display: flex; align-items: center;
	padding: 16rpx 28rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: #FFFDF7;
	border-top: 1rpx solid rgba(200, 154, 59, 0.2);
	gap: 24rpx;
}
.detail-fav {
	display: flex; flex-direction: column; align-items: center;
	width: 120rpx;
}
.detail-fav-ico {
	font-size: 44rpx; color: #C08A1E; line-height: 1;
}
.detail-fav-text {
	margin-top: 4rpx;
	font-size: 22rpx; color: #8A5A12;
}
.detail-cart {
	height: 80rpx;
	padding: 0 26rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(192, 138, 30, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
}

.detail-cart-text {
	font-size: 25rpx;
	color: #8A5A12;
}

.detail-buy {
	flex: 1;
	height: 80rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
	display: flex; align-items: center; justify-content: center;
}
.detail-buy-text {
	font-size: 30rpx; color: #fff; font-weight: bold;
	letter-spacing: 4rpx;
}

/* 空状态 */
.empty {
	display: flex; flex-direction: column; align-items: center; gap: 20rpx;
	padding: 160rpx 0;
}
.empty-ico { font-size: 80rpx; opacity: 0.6; }
.empty-text { font-size: 28rpx; color: #9A8F85; }
</style>
