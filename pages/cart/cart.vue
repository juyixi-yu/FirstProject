<template>
	<view class="wy-page cart-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">购物车</text>
			<view class="nav-placeholder"></view>
		</view>

		<block v-if="items.length">
			<!-- 商品列表 -->
			<view class="cart-list">
				<view class="cart-item wy-card" v-for="(it, i) in items" :key="it.id">
					<view class="cart-check" :class="{ on: it.checked }" @tap="toggle(i)">
						<text class="cart-check-ico" v-if="it.checked">✓</text>
					</view>
					<image v-if="it.img" class="cart-img" :src="it.img" mode="aspectFill"></image>
					<view v-else class="cart-img cart-img-empty"><text class="cart-img-ico">纹</text></view>
					<view class="cart-body">
						<text class="cart-name wy-serif">{{ it.name }}</text>
						<text class="cart-desc">{{ it.desc }}</text>
						<view class="cart-foot">
							<text class="cart-price">{{ it.price }}</text>
							<view class="qty-box">
								<view class="qty-btn" :class="{ off: it.qty <= 1 }" @tap="minus(i)">－</view>
								<text class="qty-num">{{ it.qty }}</text>
								<view class="qty-btn" @tap="plus(i)">＋</view>
							</view>
						</view>
					</view>
					<text class="cart-del" @tap="del(i)">删除</text>
				</view>
			</view>

			<!-- 底部结算栏 -->
			<view class="cart-bar">
				<view class="cart-all" @tap="toggleAll">
					<view class="cart-check" :class="{ on: allChecked }">
						<text class="cart-check-ico" v-if="allChecked">✓</text>
					</view>
					<text class="cart-all-txt">全选</text>
				</view>
				<view class="cart-total">
					<text class="cart-total-label">合计</text>
					<text class="cart-total-val">¥ {{ totalText }}</text>
				</view>
				<view class="cart-go" :class="{ off: selectedCount === 0 }" @tap="goCheckout">
					<text class="cart-go-txt">去结算({{ selectedCount }})</text>
				</view>
			</view>
		</block>

		<!-- 空购物车 -->
		<block v-else>
			<view class="cart-empty">
				<text class="cart-empty-ico">🧺</text>
				<text class="cart-empty-title wy-serif">购物车还是空的</text>
				<text class="cart-empty-desc">挑一件婺绣文创，或从下方推荐一键加购</text>
				<view class="cart-empty-btn" @tap="goMall"><text>去逛逛</text></view>
			</view>

			<view class="wy-sec">
				<view class="wy-sec-head">
					<view class="wy-sec-bar"></view>
					<text class="wy-sec-title wy-serif">为你推荐</text>
				</view>
				<view class="rec-list">
					<view class="rec-item wy-card" v-for="(p, i) in recs" :key="i">
						<image class="rec-img" :src="p.img" mode="aspectFill"></image>
						<view class="rec-body">
							<text class="rec-name wy-serif">{{ p.name }}</text>
							<text class="rec-desc">{{ p.desc }}</text>
							<view class="rec-foot">
								<text class="rec-price">{{ p.price }}</text>
								<text class="rec-add" @tap="addRec(p)">加入购物车</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</block>
	</view>
</template>

<script>
import { getCart, addToCart, updateQty, removeCart, toNumber } from '../../utils/cart'
import { DEFAULT_PRODUCTS } from '../../utils/products'

export default {
	data() {
		return {
			items: [],
			recs: DEFAULT_PRODUCTS.slice(0, 2).map((p) => ({ ...p }))
		}
	},
	onShow() {
		this.refresh()
	},
	computed: {
		allChecked() {
			return this.items.length > 0 && this.items.every((it) => it.checked)
		},
		selectedCount() {
			return this.items.filter((it) => it.checked).length
		},
		selectedTotal() {
			return this.items
				.filter((it) => it.checked)
				.reduce((sum, it) => sum + toNumber(it.price) * it.qty, 0)
		},
		totalText() {
			return this.selectedTotal.toFixed(2)
		}
	},
	methods: {
		refresh() {
			this.items = getCart().map((it) => ({ ...it, checked: true }))
		},
		onBack() {
			uni.navigateBack()
		},
		toggle(i) {
			this.items[i].checked = !this.items[i].checked
		},
		toggleAll() {
			const next = !this.allChecked
			this.items = this.items.map((it) => ({ ...it, checked: next }))
		},
		minus(i) {
			if (this.items[i].qty <= 1) return
			this.items[i].qty--
			updateQty(this.items[i].id, this.items[i].qty)
		},
		plus(i) {
			if (this.items[i].qty >= 99) return
			this.items[i].qty++
			updateQty(this.items[i].id, this.items[i].qty)
		},
		del(i) {
			const it = this.items[i]
			uni.showModal({
				title: '移出购物车',
				content: '确定移出「' + it.name + '」？',
				confirmColor: '#C08A1E',
				success: (r) => {
					if (!r.confirm) return
					removeCart(it.id)
					this.refresh()
				}
			})
		},
		addRec(p) {
			addToCart(p)
			uni.showToast({ title: '已加入购物车', icon: 'success' })
			this.refresh()
		},
		goMall() {
			uni.switchTab({ url: '/pages/mall/mall' })
		},
		goCheckout() {
			const sel = this.items.filter((it) => it.checked)
			if (!sel.length) {
				uni.showToast({ title: '请先选择商品', icon: 'none' })
				return
			}
			const total = sel.reduce((sum, it) => sum + toNumber(it.price) * it.qty, 0).toFixed(2)
			const count = sel.reduce((sum, it) => sum + it.qty, 0)
			const names = sel.map((it) => it.name).join('、')
			const q = [
				'from=cart',
				'title=' + encodeURIComponent('购物车结算 · ' + count + ' 件商品'),
				'price=' + encodeURIComponent(total),
				'spec=' + encodeURIComponent(names.slice(0, 40)),
				'img=' + encodeURIComponent(sel[0].img || ''),
				'qty=1'
			].join('&')
			uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
		}
	}
}
</script>

<style>
.cart-page {
	padding: 0 0 180rpx;
}

/* 顶栏 */
.nav-bar {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	background: #FFFDF7;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.2);
}

.nav-back {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.nav-back-ico {
	font-size: 48rpx;
	color: #C08A1E;
	line-height: 1;
}

.nav-title {
	flex: 1;
	text-align: center;
	font-size: 34rpx;
	color: #2E2620;
	font-weight: bold;
}

.nav-placeholder {
	width: 60rpx;
}

/* 列表 */
.cart-list {
	padding: 24rpx 28rpx 0;
}

.cart-item {
	position: relative;
	display: flex;
	align-items: center;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.cart-check {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(200, 154, 59, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.cart-check.on {
	border-color: #C08A1E;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
}

.cart-check-ico {
	font-size: 22rpx;
	color: #fff;
	line-height: 1;
}

.cart-img {
	width: 150rpx;
	height: 150rpx;
	margin-left: 20rpx;
	border-radius: 12rpx;
	background: rgba(200, 154, 59, 0.08);
}

.cart-img-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1rpx dashed rgba(200, 154, 59, 0.35);
}

.cart-img-ico {
	font-size: 46rpx;
	color: #C08A1E;
	opacity: 0.7;
}

.cart-body {
	flex: 1;
	margin-left: 20rpx;
}

.cart-name {
	display: block;
	font-size: 28rpx;
	color: #2E2620;
	line-height: 40rpx;
	padding-right: 60rpx;
}

.cart-desc {
	display: block;
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #9A8F85;
}

.cart-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 18rpx;
}

.cart-price {
	font-size: 30rpx;
	font-weight: 600;
	color: #C8102E;
}

.qty-box {
	display: flex;
	align-items: center;
}

.qty-btn {
	width: 46rpx;
	height: 46rpx;
	line-height: 44rpx;
	text-align: center;
	font-size: 24rpx;
	color: #8A5A12;
	border: 1rpx solid rgba(200, 154, 59, 0.4);
	border-radius: 8rpx;
	background: rgba(200, 154, 59, 0.06);
}

.qty-btn.off {
	color: #C9C1B6;
	border-color: rgba(154, 143, 133, 0.3);
}

.qty-num {
	min-width: 56rpx;
	text-align: center;
	font-size: 26rpx;
	color: #2E2620;
}

.cart-del {
	position: absolute;
	top: 20rpx;
	right: 22rpx;
	font-size: 22rpx;
	color: #B5AA9C;
}

/* 结算栏 */
.cart-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	padding: 16rpx 28rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: #FFFDF7;
	border-top: 1rpx solid rgba(200, 154, 59, 0.2);
}

.cart-all {
	display: flex;
	align-items: center;
}

.cart-all-txt {
	margin-left: 12rpx;
	font-size: 24rpx;
	color: #8A7F73;
}

.cart-total {
	flex: 1;
	text-align: right;
	margin-right: 20rpx;
}

.cart-total-label {
	font-size: 24rpx;
	color: #9A8F85;
}

.cart-total-val {
	margin-left: 8rpx;
	font-size: 36rpx;
	font-weight: 600;
	color: #C8102E;
}

.cart-go {
	width: 240rpx;
	height: 80rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
}

.cart-go.off {
	opacity: 0.45;
}

.cart-go-txt {
	font-size: 28rpx;
	font-weight: bold;
	color: #fff;
	letter-spacing: 2rpx;
}

/* 空态 */
.cart-empty {
	padding: 100rpx 40rpx 20rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.cart-empty-ico {
	font-size: 88rpx;
}

.cart-empty-title {
	margin-top: 24rpx;
	font-size: 36rpx;
	color: #2E2620;
	letter-spacing: 2rpx;
}

.cart-empty-desc {
	margin-top: 14rpx;
	font-size: 24rpx;
	color: #9A8F85;
}

.cart-empty-btn {
	margin-top: 32rpx;
	padding: 16rpx 60rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(200, 154, 59, 0.55);
	color: #8A5A12;
	font-size: 26rpx;
}

/* 推荐 */
.rec-list {
	margin-top: 20rpx;
}

.rec-item {
	display: flex;
	padding: 20rpx;
	margin-bottom: 18rpx;
}

.rec-img {
	width: 150rpx;
	height: 150rpx;
	border-radius: 12rpx;
}

.rec-body {
	flex: 1;
	margin-left: 20rpx;
}

.rec-name {
	display: block;
	font-size: 28rpx;
	color: #2E2620;
}

.rec-desc {
	display: block;
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #9A8F85;
}

.rec-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 16rpx;
}

.rec-price {
	font-size: 28rpx;
	font-weight: 600;
	color: #C8102E;
}

.rec-add {
	padding: 8rpx 24rpx;
	font-size: 22rpx;
	color: #2A1C08;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #F6E6AE, #C99A3B);
}
</style>
