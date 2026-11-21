<template>
	<view class="wy-page detail-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">订单详情</text>
			<view class="nav-placeholder"></view>
		</view>

		<view class="detail-body" v-if="order">
			<!-- 状态条 -->
			<view class="status-banner">
				<text class="status-banner-text">{{ statusLabel }}</text>
				<text class="status-banner-tip">{{ statusTip }}</text>
			</view>

			<!-- 收货信息：网站端展示；小程序端整块隐藏 -->
			<view class="card-section" v-if="showContact">
				<view class="section-head">
					<text class="section-ico">📍</text>
					<text class="section-title">收货信息</text>
				</view>
				<view class="addr-row">
					<text class="addr-name">{{ order.receiver }}</text>
					<text class="addr-phone">{{ order.phone }}</text>
				</view>
				<text class="addr-detail">{{ order.address }}</text>
			</view>

			<!-- 商品信息 -->
			<view class="card-section">
				<view class="section-head">
					<text class="section-ico">📦</text>
					<text class="section-title">商品信息</text>
				</view>
				<view class="goods-row">
					<image class="goods-img" :src="order.img" mode="aspectFill"></image>
					<view class="goods-info">
						<text class="goods-name">{{ order.name }}</text>
						<text class="goods-spec">{{ order.spec }}</text>
						<view class="goods-price-row">
							<text class="goods-price">¥{{ order.price }}</text>
							<text class="goods-qty">x{{ order.qty }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 订单信息 -->
			<view class="card-section">
				<view class="section-head">
					<text class="section-ico">📋</text>
					<text class="section-title">订单信息</text>
				</view>
				<view class="info-row">
					<text class="info-label">订单编号</text>
					<view class="info-val-wrap">
						<text class="info-val">{{ order.id }}</text>
						<text class="info-copy" @tap="copyId">复制</text>
					</view>
				</view>
				<view class="info-row">
					<text class="info-label">下单时间</text>
					<text class="info-val">{{ order.createTime }}</text>
				</view>
				<view class="info-row">
					<text class="info-label">支付方式</text>
					<text class="info-val">{{ order.payMethod }}</text>
				</view>
				<view class="info-row info-row-total">
					<text class="info-label">实付款</text>
					<text class="info-total">¥{{ order.total }}</text>
				</view>
			</view>

			<!-- 底部操作 -->
			<view class="foot-actions">
				<view class="btn btn-ghost" v-if="order.status === 'unpaid'" @tap="cancelOrder">取消订单</view>
				<view class="btn btn-gold" v-if="order.status === 'unpaid'" @tap="payOrder">立即付款</view>
				<view class="btn btn-ghost" v-if="order.status === 'unshipped'" @tap="remindShip">提醒发货</view>
				<view class="btn btn-gold" v-if="order.status === 'done'" @tap="afterSale">申请售后</view>
				<view class="btn btn-ghost" v-if="order.status === 'refund'" @tap="cancelRefund">撤销售后</view>
			</view>
		</view>

		<view class="empty" v-else>
			<text class="empty-text">订单不存在或已删除</text>
		</view>
	</view>
</template>

<script>
import { SHOW_CONTACT } from '../../utils/user'

const MOCK_ORDERS = {}

const STATUS = {
	unpaid: { label: '待付款', tip: '请在24小时内完成付款，超时订单将自动取消' },
	unshipped: { label: '待发货', tip: '卖家正在为您备货，请耐心等待' },
	done: { label: '已完成', tip: '交易已完成，如有问题可申请售后' },
	refund: { label: '售后中', tip: '售后申请处理中，客服将尽快与您联系' }
}

export default {
	data() {
		return {
			showContact: SHOW_CONTACT,
			order: null
		}
	},
	computed: {
		statusLabel() {
			return this.order ? (STATUS[this.order.status]?.label || '') : ''
		},
		statusTip() {
			return this.order ? (STATUS[this.order.status]?.tip || '') : ''
		}
	},
	onLoad(opts) {
		const id = opts.id
		this.order = MOCK_ORDERS[id] || null
	},
	methods: {
		onBack() {
			uni.navigateBack()
		},
		copyId() {
			uni.setClipboardData({
				data: this.order.id,
				success: () => uni.showToast({ title: '订单号已复制', icon: 'success' })
			})
		},
		payOrder() {
			uni.showToast({ title: '演示环境，暂未接入支付', icon: 'none' })
		},
		cancelOrder() {
			uni.showToast({ title: '订单已取消', icon: 'success' })
			setTimeout(() => uni.navigateBack(), 800)
		},
		remindShip() {
			uni.showToast({ title: '已提醒卖家发货', icon: 'success' })
		},
		afterSale() {
			uni.showToast({ title: '已提交售后申请', icon: 'success' })
		},
		cancelRefund() {
			uni.showToast({ title: '已撤销售后', icon: 'success' })
		}
	}
}
</script>

<style>
.detail-page { padding: 0 0 40rpx; }

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

/* 状态条 */
.status-banner {
	padding: 36rpx 32rpx;
	background: linear-gradient(135deg, #C08A1E 0%, #E8C872 100%);
	display: flex; flex-direction: column; gap: 10rpx;
}
.status-banner-text { font-size: 36rpx; color: #fff; font-weight: bold; }
.status-banner-tip { font-size: 24rpx; color: rgba(255,255,255,0.88); }

/* 区块卡片 */
.detail-body { padding: 24rpx 28rpx; display: flex; flex-direction: column; gap: 24rpx; }
.card-section {
	background: var(--wy-card, #FFFDF7);
	border: 1rpx solid rgba(200, 154, 59, 0.15);
	border-radius: 20rpx;
	padding: 24rpx 28rpx;
	box-shadow: 0 8rpx 24rpx rgba(120, 90, 40, 0.06);
}
.section-head {
	display: flex; align-items: center; gap: 12rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.1);
	margin-bottom: 18rpx;
}
.section-ico { font-size: 30rpx; }
.section-title { font-size: 28rpx; color: #2E2620; font-weight: bold; }

/* 收货信息 */
.addr-row { display: flex; gap: 20rpx; margin-bottom: 10rpx; }
.addr-name { font-size: 28rpx; color: #2E2620; font-weight: bold; }
.addr-phone { font-size: 26rpx; color: #4A3A2C; }
.addr-detail { font-size: 26rpx; color: #4A3A2C; line-height: 1.6; }

/* 商品信息 */
.goods-row { display: flex; gap: 20rpx; }
.goods-img {
	width: 160rpx; height: 160rpx; flex-shrink: 0;
	border-radius: 12rpx;
	background: #F1E7D6;
}
.goods-info { flex: 1; display: flex; flex-direction: column; gap: 10rpx; }
.goods-name { font-size: 28rpx; color: #2E2620; font-weight: 500; }
.goods-spec { font-size: 24rpx; color: #9A8F85; }
.goods-price-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.goods-price { font-size: 28rpx; color: #C8102E; font-weight: bold; }
.goods-qty { font-size: 24rpx; color: #9A8F85; }

/* 订单信息 */
.info-row {
	display: flex; justify-content: space-between; align-items: center;
	padding: 12rpx 0;
}
.info-label { font-size: 26rpx; color: #9A8F85; }
.info-val { font-size: 26rpx; color: #2E2620; }
.info-val-wrap { display: flex; align-items: center; gap: 16rpx; }
.info-copy {
	font-size: 22rpx; color: #C08A1E;
	padding: 4rpx 16rpx;
	border: 1rpx solid rgba(200, 154, 59, 0.4);
	border-radius: 20rpx;
}
.info-row-total {
	margin-top: 12rpx;
	padding-top: 18rpx;
	border-top: 1rpx dashed rgba(200, 154, 59, 0.2);
}
.info-total { font-size: 34rpx; color: #C8102E; font-weight: bold; }

/* 底部操作 */
.foot-actions {
	display: flex; justify-content: flex-end; gap: 20rpx;
	padding: 16rpx 8rpx 0;
}
.btn {
	padding: 16rpx 40rpx;
	border-radius: 40rpx;
	font-size: 27rpx;
	display: flex; align-items: center; justify-content: center;
}
.btn-ghost {
	border: 1rpx solid rgba(200, 154, 59, 0.5);
	color: #8A5A12;
	background: #FFFDF7;
}
.btn-gold {
	background: linear-gradient(135deg, #E8C872, #C08A1E);
	color: #fff;
}

/* 空状态 */
.empty {
	display: flex; flex-direction: column; align-items: center;
	padding: 160rpx 0;
}
.empty-text { font-size: 28rpx; color: #9A8F85; }
</style>
