<template>
	<view class="wy-page oc-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">订单确认</text>
			<view class="nav-placeholder"></view>
		</view>

		<!-- 收货信息：网站端按登录用户自动匹配；小程序端整块隐藏 -->
		<view class="oc-sec" v-if="showContact">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">收货信息</text>
			</view>
			<view class="addr-box wy-card">
				<view class="addr-row">
					<text class="addr-label">收货人</text>
					<text class="addr-val">{{ contact.name }}</text>
				</view>
				<view class="addr-row">
					<text class="addr-label">联系电话</text>
					<text class="addr-val">{{ contact.phone }}</text>
				</view>
				<view class="addr-row">
					<text class="addr-label">收货地址</text>
					<text class="addr-val">{{ contact.address }}</text>
				</view>
			</view>
		</view>

		<!-- 商品清单 -->
		<view class="oc-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">商品清单</text>
			</view>
			<view class="goods-box wy-card">
				<image v-if="img" class="goods-img" :src="img" mode="aspectFill"></image>
				<view v-else class="goods-img goods-img-empty"><text class="goods-img-ico">纹</text></view>
				<view class="goods-body">
					<text class="goods-name wy-serif">{{ title }}</text>
					<text class="goods-spec">{{ spec }}</text>
					<view class="goods-foot">
						<text class="goods-price">¥ {{ unitPrice.toFixed(2) }}</text>
						<view class="qty-box">
							<view class="qty-btn" :class="{ off: qty <= 1 }" @tap="minus">－</view>
							<text class="qty-num">{{ qty }}</text>
							<view class="qty-btn" @tap="plus">＋</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 订单备注 -->
		<view class="oc-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">订单备注</text>
			</view>
			<view class="remark-box wy-card">
				<textarea
					class="remark-input"
					v-model="remark"
					maxlength="100"
					placeholder="选填：尺寸、配色、送礼寄语等"
					placeholder-class="remark-ph"
				/>
			</view>
		</view>

		<!-- 金额明细 -->
		<view class="oc-sec">
			<view class="sum-box wy-card">
				<view class="sum-row">
					<text class="sum-label">商品金额</text>
					<text class="sum-val">¥ {{ goodsAmount }}</text>
				</view>
				<view class="sum-row">
					<text class="sum-label">运费</text>
					<text class="sum-val">¥ 0.00</text>
				</view>
				<view class="sum-row sum-total">
					<text class="sum-label">应付合计</text>
					<text class="sum-total-val">¥ {{ totalAmount }}</text>
				</view>
			</view>
		</view>

		<!-- 底部提交栏 -->
		<view class="oc-bar">
			<view class="oc-total">
				<text class="oc-total-label">合计</text>
				<text class="oc-total-val">¥ {{ totalAmount }}</text>
			</view>
			<view class="oc-submit" @tap="submit">
				<text class="oc-submit-txt">提交订单</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { getCurrentUser, SHOW_CONTACT } from '../../utils/user'

	function safeDecode(v) {
		if (!v) return ''
		try {
			return decodeURIComponent(v)
		} catch (e) {
			return String(v)
		}
	}

	/** 从「¥ 89」这类文案里取出数值 */
	function toNumber(v) {
		const n = parseFloat(String(v).replace(/[^\d.]/g, ''))
		return isNaN(n) ? 0 : n
	}

	export default {
		data() {
			return {
				showContact: SHOW_CONTACT,
				contact: getCurrentUser(),
				from: '',
				title: '订单商品',
				spec: '非遗文创',
				img: '',
				price: '0',
				qty: 1,
				remark: '',
				submitting: false
			}
		},
		onShow() {
			// 登录态可能在本页打开后才写入，回到页面时重新匹配
			this.contact = getCurrentUser()
		},
		onLoad(options) {
			const o = options || {}
			this.from = o.from || ''
			this.title = safeDecode(o.title) || '订单商品'
			this.spec = safeDecode(o.spec) || '非遗文创'
			this.img = safeDecode(o.img)
			this.price = safeDecode(o.price) || '0'
			this.qty = Math.max(1, parseInt(o.qty, 10) || 1)
		},
		computed: {
			unitPrice() {
				return toNumber(this.price)
			},
			goodsAmount() {
				return (this.unitPrice * this.qty).toFixed(2)
			},
			totalAmount() {
				return this.goodsAmount
			}
		},
		methods: {
			onBack() {
				uni.navigateBack()
			},
			minus() {
				if (this.qty <= 1) return
				this.qty--
			},
			plus() {
				if (this.qty >= 99) return
				this.qty++
			},
			submit() {
				if (this.submitting) return
				this.submitting = true
				uni.showModal({
					title: '订单已提交',
					content: '当前为演示版本，订单确认流程已完成，支付功能暂未接入。',
					showCancel: false,
					confirmText: '知道了',
					complete: () => {
						this.submitting = false
					}
				})
			}
		}
	}
</script>

<style>
.oc-page {
	padding: 0 0 180rpx;
}

/* 自定义顶栏 */
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

.oc-sec {
	padding: 0 28rpx;
	margin-top: 34rpx;
}

/* 收货信息 */
.addr-box {
	margin-top: 20rpx;
	padding: 10rpx 28rpx;
}

.addr-row {
	display: flex;
	align-items: flex-start;
	padding: 18rpx 0;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.12);
}

.addr-row:last-child {
	border-bottom: none;
}

.addr-label {
	width: 140rpx;
	font-size: 26rpx;
	color: #9A8F85;
}

.addr-val {
	flex: 1;
	font-size: 27rpx;
	line-height: 40rpx;
	color: #2E2620;
}

/* 商品清单 */
.goods-box {
	display: flex;
	margin-top: 20rpx;
	padding: 24rpx;
}

.goods-img {
	width: 168rpx;
	height: 168rpx;
	border-radius: 14rpx;
	background: rgba(200, 154, 59, 0.08);
}

.goods-img-empty {
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1rpx dashed rgba(200, 154, 59, 0.35);
}

.goods-img-ico {
	font-size: 52rpx;
	color: #C08A1E;
	opacity: 0.7;
}

.goods-body {
	flex: 1;
	margin-left: 22rpx;
	display: flex;
	flex-direction: column;
}

.goods-name {
	font-size: 30rpx;
	color: #2E2620;
	letter-spacing: 1rpx;
	line-height: 42rpx;
}

.goods-spec {
	margin-top: 8rpx;
	font-size: 23rpx;
	line-height: 34rpx;
	color: #9A8F85;
}

.goods-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: auto;
	padding-top: 14rpx;
}

.goods-price {
	font-size: 32rpx;
	font-weight: 600;
	color: #C8102E;
}

.qty-box {
	display: flex;
	align-items: center;
}

.qty-btn {
	width: 48rpx;
	height: 48rpx;
	line-height: 46rpx;
	text-align: center;
	font-size: 26rpx;
	color: #8A5A12;
	border: 1rpx solid rgba(200, 154, 59, 0.4);
	border-radius: 10rpx;
	background: rgba(200, 154, 59, 0.06);
}

.qty-btn.off {
	color: #C9C1B6;
	border-color: rgba(154, 143, 133, 0.3);
}

.qty-num {
	min-width: 64rpx;
	text-align: center;
	font-size: 27rpx;
	color: #2E2620;
}

/* 备注 */
.remark-box {
	margin-top: 20rpx;
	padding: 20rpx 24rpx;
}

.remark-input {
	width: 100%;
	height: 140rpx;
	font-size: 26rpx;
	line-height: 40rpx;
	color: #2E2620;
}

.remark-ph {
	color: #B5AA9C;
}

/* 金额 */
.sum-box {
	margin-top: 20rpx;
	padding: 10rpx 28rpx;
}

.sum-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
}

.sum-label {
	font-size: 26rpx;
	color: #8A7F73;
}

.sum-val {
	font-size: 27rpx;
	color: #2E2620;
}

.sum-total {
	border-top: 1rpx solid rgba(200, 154, 59, 0.16);
}

.sum-total-val {
	font-size: 34rpx;
	font-weight: 600;
	color: #C8102E;
}

/* 底部栏 */
.oc-bar {
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

.oc-total {
	flex: 1;
}

.oc-total-label {
	font-size: 24rpx;
	color: #9A8F85;
}

.oc-total-val {
	margin-left: 10rpx;
	font-size: 38rpx;
	font-weight: 600;
	color: #C8102E;
}

.oc-submit {
	width: 300rpx;
	height: 84rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
}

.oc-submit-txt {
	font-size: 30rpx;
	font-weight: bold;
	color: #fff;
	letter-spacing: 4rpx;
}
</style>
