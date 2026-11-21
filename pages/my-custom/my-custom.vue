<template>
	<view class="wy-page mc-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">我的定制</text>
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

		<!-- 定制列表 -->
		<view class="mc-list" v-if="filteredList.length">
			<view
				class="mc-card wy-card"
				v-for="o in filteredList"
				:key="o.id"
				@tap="goDetail(o.id)"
			>
				<view class="mc-head">
					<text class="mc-name wy-serif">{{ o.name }}</text>
					<text class="mc-status" :class="'st-' + o.status">{{ statusLabel(o.status) }}</text>
				</view>

				<view class="mc-body">
					<image class="mc-img" :src="o.img" mode="aspectFill"></image>
					<view class="mc-info">
						<text class="mc-style">款式：{{ o.style }}</text>
						<text class="mc-time">下单时间：{{ o.time }}</text>
						<view class="mc-desc">
							<text class="mc-desc-txt">{{ o.desc }}</text>
						</view>
					</view>
				</view>

				<view class="mc-foot">
					<view class="btn btn-ghost" @tap.stop="contactService">联系客服</view>
					<view class="btn btn-gold" v-if="o.status === 'pending'" @tap.stop="submitDraft(o.id)">提交定稿</view>
					<view class="btn btn-gold" v-else @tap.stop="goDetail(o.id)">查看详情</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-else>
			<text class="empty-ico">🧵</text>
			<text class="empty-text">暂无定制作品</text>
			<text class="empty-sub">去刺绣DIY创作吧</text>
			<view class="wy-btn empty-btn" @tap="goDIY">去创作</view>
		</view>
	</view>
</template>

<script>
import { img } from '../../utils/cloud'

const TABS = [
	{ key: 'all', label: '全部' },
	{ key: 'making', label: '制作中' },
	{ key: 'pending', label: '待确认' },
	{ key: 'done', label: '已完成' },
	{ key: 'cancelled', label: '已取消' }
]

// 定制订单数据（待接入云数据库 custom_orders 集合）
const MOCK_ORDERS = [
	{
		id: 'C20261015001',
		name: '喜上眉梢 · 团扇定制',
		style: '团扇 · 真丝绢面',
		time: '2026-10-15 14:32',
		desc: '以用户在刺绣DIY中创作的「喜鹊登梅」纹样为底稿，定制团扇一把，金线盘边。',
		img: img('product-pendant.jpg'),
		status: 'making'
	},
	{
		id: 'C20261008002',
		name: '牡丹富贵 · 胸针定制',
		style: '胸针 · 黄铜底托',
		time: '2026-10-08 09:15',
		desc: '用户自制「牡丹」纹样，配色典雅，定制为刺绣胸针，赠送长辈。',
		img: img('product-wuju-brooch.jpg'),
		status: 'pending'
	},
	{
		id: 'C20260920003',
		name: '婺江月夜 · 挂件定制',
		style: '挂件 · NFC 智能',
		time: '2026-09-20 16:48',
		desc: '「婺江月夜」纹样定制 NFC 智能投影挂件，碰一碰弹出 AR 影像。',
		img: img('product-pendant.jpg'),
		status: 'done'
	},
	{
		id: 'C20260905004',
		name: '庭院小景 · 香囊定制',
		style: '香囊 · 艾草填充',
		time: '2026-09-05 11:20',
		desc: '「庭院小景」纹样定制香囊，因用户改选其他款式已取消。',
		img: img('product-sachet.jpg'),
		status: 'cancelled'
	}
]

const STATUS_LABEL = {
	making: '制作中',
	pending: '待确认',
	done: '已完成',
	cancelled: '已取消'
}

export default {
	data() {
		return {
			tabs: TABS,
			curStatus: 'all',
			list: MOCK_ORDERS
		}
	},
	computed: {
		filteredList() {
			if (this.curStatus === 'all') return this.list
			return this.list.filter((o) => o.status === this.curStatus)
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
			uni.navigateTo({ url: '/pages/custom-detail/custom-detail?id=' + id })
		},
		submitDraft(id) {
			uni.showModal({
				title: '提交定稿',
				content: '确认提交当前纹样为最终定稿？提交后将进入制作环节。',
				confirmText: '确认提交',
				confirmColor: '#C08A1E',
				success: (res) => {
					if (res.confirm) {
						const o = this.list.find((x) => x.id === id)
						if (o) { o.status = 'making' }
						uni.showToast({ title: '已提交定稿', icon: 'success' })
					}
				}
			})
		},
		contactService() {
			uni.showToast({ title: '客服微信：13600976724', icon: 'none' })
		},
		goDIY() {
			uni.navigateTo({ url: '/pages/diy/diy' })
		}
	}
}
</script>

<style>
.mc-page { padding: 0 0 40rpx; }

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

/* 定制卡片 */
.mc-list { padding: 24rpx 28rpx; display: flex; flex-direction: column; gap: 24rpx; }
.mc-card { padding: 24rpx; }
.mc-head {
	display: flex; justify-content: space-between; align-items: center;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.1);
}
.mc-name { font-size: 30rpx; color: #2E2620; font-weight: bold; }
.mc-status { font-size: 26rpx; font-weight: bold; }
.st-making { color: #C08A1E; }
.st-pending { color: #C8102E; }
.st-done { color: #2E2620; }
.st-cancelled { color: #9A8F85; }

.mc-body { display: flex; gap: 20rpx; padding: 22rpx 0; }
.mc-img {
	width: 150rpx; height: 150rpx; flex-shrink: 0;
	border-radius: 12rpx;
	background: #F1E7D6;
}
.mc-info { flex: 1; display: flex; flex-direction: column; gap: 10rpx; min-width: 0; }
.mc-style { font-size: 26rpx; color: #4A3A2C; }
.mc-time { font-size: 24rpx; color: #9A8F85; }
.mc-desc { margin-top: 4rpx; }
.mc-desc-txt {
	font-size: 24rpx; color: #6E6252; line-height: 1.6;
	display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
	overflow: hidden;
}

.mc-foot {
	padding-top: 18rpx;
	border-top: 1rpx solid rgba(200, 154, 59, 0.1);
	display: flex; justify-content: flex-end; gap: 16rpx;
}

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
.empty-text { font-size: 30rpx; color: #2E2620; }
.empty-sub { font-size: 26rpx; color: #9A8F85; }
.empty-btn { margin-top: 24rpx; }
</style>
