<template>
	<view class="wy-page orders-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">我的订单</text>
			<view class="nav-placeholder"></view>
		</view>

		<!-- 状态切换 -->
		<view class="status-tabs">
			<view
				class="status-tab"
				v-for="tab in tabs"
				:key="tab.key"
				@tap="curStatus = tab.key"
			>
				<text class="status-tab-text" :class="{ active: curStatus === tab.key }">{{ tab.label }}</text>
				<view class="status-tab-bar" v-if="curStatus === tab.key"></view>
			</view>
		</view>

		<!-- 订单列表 -->
		<view class="order-list" v-if="filteredOrders.length">
			<view
				class="order-card wy-card"
				v-for="o in filteredOrders"
				:key="o.id"
				@tap="goDetail(o.id)"
			>
				<view class="order-head">
					<text class="order-no">订单号：{{ o.id }}</text>
					<text class="order-status" :class="'st-' + o.status">{{ statusLabel(o.status) }}</text>
				</view>

				<view class="order-goods">
					<image class="order-img" :src="o.img" mode="aspectFill"></image>
					<view class="order-info">
						<text class="order-name">{{ o.name }}</text>
						<text class="order-spec">{{ o.spec }}</text>
						<view class="order-price-row">
							<text class="order-price">¥{{ o.price }}</text>
							<text class="order-qty">x{{ o.qty }}</text>
						</view>
					</view>
				</view>

				<view class="order-foot">
					<text class="order-count">共{{ o.qty }}件商品 合计：<text class="order-total">¥{{ o.total }}</text></text>
					<view class="order-actions">
						<view class="btn btn-ghost" v-if="o.status === 'unpaid'" @tap.stop="cancelOrder(o.id)">取消订单</view>
						<view class="btn btn-gold" v-if="o.status === 'unpaid'" @tap.stop="payOrder(o.id)">去付款</view>
						<view class="btn btn-ghost" v-if="o.status === 'unshipped'" @tap.stop="remindShip(o.id)">提醒发货</view>
						<view class="btn btn-gold" v-if="o.status === 'done'" @tap.stop="confirmDone(o.id)">再次购买</view>
						<view class="btn btn-ghost" v-if="o.status === 'done'" @tap.stop="afterSale(o.id)">申请售后</view>
						<view class="btn btn-ghost" v-if="o.status === 'refund'" @tap.stop="cancelRefund(o.id)">撤销售后</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-else>
			<text class="empty-ico">📦</text>
			<text class="empty-text">暂无相关订单</text>
		</view>
	</view>
</template>

<script>
const TABS = [
	{ key: 'all', label: '全部' },
	{ key: 'unpaid', label: '待付款' },
	{ key: 'unshipped', label: '待发货' },
	{ key: 'done', label: '已完成' },
	{ key: 'refund', label: '售后' }
]

// 订单数据（待接入云数据库 orders 集合）
const MOCK_ORDERS = []

const STATUS_LABEL = {
	unpaid: '待付款',
	unshipped: '待发货',
	done: '已完成',
	refund: '售后中'
}

export default {
	data() {
		return {
			tabs: TABS,
			curStatus: 'all',
			orders: MOCK_ORDERS
		}
	},
	computed: {
		filteredOrders() {
			if (this.curStatus === 'all') return this.orders
			return this.orders.filter((o) => o.status === this.curStatus)
		}
	},
	methods: {
		onBack() {
			uni.navigateBack()
		},
		statusLabel(s) {
			return STATUS_LABEL[s] || ''
		},
		goDetail(id) {
			uni.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id })
		},
		payOrder() {
			uni.showToast({ title: '演示环境，暂未接入支付', icon: 'none' })
		},
		cancelOrder(id) {
			this.removeOrder(id)
		},
		remindShip() {
			uni.showToast({ title: '已提醒卖家发货', icon: 'success' })
		},
		confirmDone() {
			uni.showToast({ title: '已为您跳转商城', icon: 'none' })
			setTimeout(() => uni.switchTab({ url: '/pages/mall/mall' }), 800)
		},
		afterSale(id) {
			const o = this.orders.find((x) => x.id === id)
			if (o) { o.status = 'refund'; uni.showToast({ title: '已提交售后申请', icon: 'success' }) }
		},
		cancelRefund(id) {
			const o = this.orders.find((x) => x.id === id)
			if (o) { o.status = 'done'; uni.showToast({ title: '已撤销售后', icon: 'success' }) }
		},
		removeOrder(id) {
			this.orders = this.orders.filter((x) => x.id !== id)
			uni.showToast({ title: '订单已取消', icon: 'success' })
		}
	}
}
</script>

<style>
.orders-page { padding: 0 0 40rpx; }

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

/* 状态切换 */
.status-tabs {
	display: flex;
	background: #FFFDF7;
	padding: 0 12rpx;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.12);
}
.status-tab {
	flex: 1;
	padding: 24rpx 0;
	display: flex; flex-direction: column; align-items: center;
	position: relative;
}
.status-tab-text {
	font-size: 27rpx; color: #9A8F85;
}
.status-tab-text.active { color: #C08A1E; font-weight: bold; }
.status-tab-bar {
	position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
	width: 48rpx; height: 6rpx;
	background: linear-gradient(90deg, #E8C872, #C08A1E);
	border-radius: 3rpx;
}

/* 订单卡片 */
.order-list { padding: 24rpx 28rpx; display: flex; flex-direction: column; gap: 24rpx; }
.order-card { padding: 24rpx; }
.order-head {
	display: flex; justify-content: space-between; align-items: center;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.1);
}
.order-no { font-size: 24rpx; color: #9A8F85; }
.order-status { font-size: 26rpx; font-weight: bold; }
.st-unpaid { color: #C8102E; }
.st-unshipped { color: #C08A1E; }
.st-done { color: #2E2620; }
.st-refund { color: #8A5A12; }

.order-goods { display: flex; gap: 20rpx; padding: 22rpx 0; }
.order-img {
	width: 150rpx; height: 150rpx; flex-shrink: 0;
	border-radius: 12rpx;
	background: #F1E7D6;
}
.order-info { flex: 1; display: flex; flex-direction: column; gap: 10rpx; }
.order-name { font-size: 28rpx; color: #2E2620; font-weight: 500; }
.order-spec { font-size: 24rpx; color: #9A8F85; }
.order-price-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.order-price { font-size: 28rpx; color: #C8102E; font-weight: bold; }
.order-qty { font-size: 24rpx; color: #9A8F85; }

.order-foot {
	padding-top: 18rpx;
	border-top: 1rpx solid rgba(200, 154, 59, 0.1);
	display: flex; justify-content: space-between; align-items: center;
}
.order-count { font-size: 24rpx; color: #4A3A2C; }
.order-total { font-size: 30rpx; color: #C8102E; font-weight: bold; }
.order-actions { display: flex; gap: 16rpx; }

.btn {
	padding: 12rpx 28rpx;
	border-radius: 32rpx;
	font-size: 25rpx;
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
	display: flex; flex-direction: column; align-items: center; gap: 20rpx;
	padding: 160rpx 0;
}
.empty-ico { font-size: 80rpx; opacity: 0.6; }
.empty-text { font-size: 28rpx; color: #9A8F85; }
</style>
