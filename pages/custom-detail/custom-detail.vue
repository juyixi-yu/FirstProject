<template>
	<view class="wy-page cd-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">定制详情</text>
			<view class="nav-placeholder"></view>
		</view>

		<block v-if="order">
			<!-- 纹样预览 -->
			<view class="cd-sec">
				<view class="wy-sec-head">
					<view class="wy-sec-bar"></view>
					<text class="wy-sec-title wy-serif">纹样预览</text>
				</view>
				<view class="preview-box wy-card">
					<image class="preview-img" :src="order.img" mode="aspectFill"></image>
					<view class="preview-label">
						<text class="wy-tag">{{ statusLabel(order.status) }}</text>
					</view>
				</view>
				<text class="preview-name wy-serif">{{ order.name }}</text>
				<text class="preview-desc">{{ order.desc }}</text>
			</view>

			<!-- 款式选择 -->
			<view class="cd-sec">
				<view class="wy-sec-head">
					<view class="wy-sec-bar"></view>
					<text class="wy-sec-title wy-serif">款式选择</text>
				</view>
				<view class="style-list">
					<view
						class="style-item wy-card"
						v-for="(s, i) in styles"
						:key="i"
						:class="{ active: order.style === s.name }"
						@tap="selectStyle(s)"
					>
						<text class="style-name wy-serif">{{ s.name }}</text>
						<text class="style-price">{{ s.price }}</text>
						<text class="style-check" v-if="order.style === s.name">✓</text>
					</view>
				</view>
			</view>

			<!-- 收货信息：网站端按登录用户自动匹配；小程序端整块隐藏 -->
			<view class="cd-sec" v-if="showContact">
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

			<!-- 进度说明 -->
			<view class="cd-sec">
				<view class="wy-sec-head">
					<view class="wy-sec-bar"></view>
					<text class="wy-sec-title wy-serif">进度说明</text>
				</view>
				<view class="progress-box wy-card">
					<view class="step" v-for="(s, i) in steps" :key="i">
						<view class="step-dot" :class="{ done: s.done, active: s.active }"></view>
						<view class="step-line" v-if="i < steps.length - 1" :class="{ done: s.done }"></view>
						<view class="step-body">
							<text class="step-title">{{ s.title }}</text>
							<text class="step-time" v-if="s.time">{{ s.time }}</text>
							<text class="step-desc">{{ s.desc }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 底部操作栏 -->
			<view class="cd-bar">
				<view class="cd-btn cd-btn-ghost" @tap="contactService">联系客服</view>
				<view class="cd-btn cd-btn-gold" v-if="order.status === 'pending'" @tap="submitDraft">提交定稿</view>
			</view>
		</block>

		<!-- 未找到 -->
		<view class="empty" v-else>
			<text class="empty-ico">📦</text>
			<text class="empty-text">定制信息加载失败</text>
		</view>
	</view>
</template>

<script>
import { img } from '../../utils/cloud'
import { getCurrentUser, SHOW_CONTACT } from '../../utils/user'

const STATUS_LABEL = {
	making: '制作中',
	pending: '待确认',
	done: '已完成',
	cancelled: '已取消'
}

const MOCK_ORDERS = {
	C20261015001: {
		id: 'C20261015001',
		name: '喜上眉梢 · 团扇定制',
		style: '团扇 · 真丝绢面',
		time: '2026-10-15 14:32',
		desc: '以用户在刺绣DIY中创作的「喜鹊登梅」纹样为底稿，定制团扇一把，金线盘边。',
		img: img('product-pendant.jpg'),
		status: 'making'
	},
	C20261008002: {
		id: 'C20261008002',
		name: '牡丹富贵 · 胸针定制',
		style: '胸针 · 黄铜底托',
		time: '2026-10-08 09:15',
		desc: '用户自制「牡丹」纹样，配色典雅，定制为刺绣胸针，赠送长辈。',
		img: img('product-wuju-brooch.jpg'),
		status: 'pending'
	},
	C20260920003: {
		id: 'C20260920003',
		name: '婺江月夜 · 挂件定制',
		style: '挂件 · NFC 智能',
		time: '2026-09-20 16:48',
		desc: '「婺江月夜」纹样定制 NFC 智能投影挂件，碰一碰弹出 AR 影像。',
		img: img('product-pendant.jpg'),
		status: 'done'
	},
	C20260905004: {
		id: 'C20260905004',
		name: '庭院小景 · 香囊定制',
		style: '香囊 · 艾草填充',
		time: '2026-09-05 11:20',
		desc: '「庭院小景」纹样定制香囊，因用户改选其他款式已取消。',
		img: img('product-sachet.jpg'),
		status: 'cancelled'
	}
}

const STYLES = [
	{ name: '团扇 · 真丝绢面', price: '¥ 268 起' },
	{ name: '胸针 · 黄铜底托', price: '¥ 158 起' },
	{ name: '挂件 · NFC 智能', price: '¥ 198 起' },
	{ name: '香囊 · 艾草填充', price: '¥ 98 起' }
]

export default {
	data() {
		return {
			showContact: SHOW_CONTACT,
			contact: getCurrentUser(),
			order: null,
			styles: STYLES
		}
	},
	onShow() {
		// 登录态变化后重新匹配收货人 / 手机号 / 地址
		this.contact = getCurrentUser()
	},
	computed: {
		steps() {
			const base = [
				{ title: '提交定制', time: this.order ? this.order.time : '', desc: '用户提交DIY纹样与款式需求', done: true },
				{ title: '纹样确认', time: '', desc: '设计师校对纹样细节，与用户确认定稿', done: this.order && this.order.status !== 'pending' },
				{ title: '手工制作', time: '', desc: '非遗传承人按定稿手工绣制', done: this.order && (this.order.status === 'done' || this.order.status === 'cancelled') },
				{ title: '质检发货', time: '', desc: '成品质检合格后包装发货', done: this.order && this.order.status === 'done' }
			]
			if (this.order && this.order.status === 'pending') {
				base[1].active = true
			} else if (this.order && this.order.status === 'making') {
				base[2].active = true
			}
			return base
		}
	},
	onLoad(options) {
		const id = (options && options.id) || ''
		this.order = MOCK_ORDERS[id] || null
	},
	methods: {
		onBack() {
			uni.navigateBack()
		},
		selectStyle(s) {
			if (!this.order) return
			if (this.order.status === 'done' || this.order.status === 'cancelled') {
				uni.showToast({ title: '当前状态不可修改款式', icon: 'none' })
				return
			}
			if (this.order.style === s.name) return
			this.order = Object.assign({}, this.order, { style: s.name })
			uni.showToast({ title: '已选择「' + s.name.split(' · ')[0] + '」', icon: 'none' })
		},
		statusLabel(s) {
			return STATUS_LABEL[s] || ''
		},
		submitDraft() {
			uni.showModal({
				title: '提交定稿',
				content: '确认提交当前纹样为最终定稿？提交后将进入制作环节。',
				confirmText: '确认提交',
				confirmColor: '#C08A1E',
				success: (res) => {
					if (res.confirm && this.order) {
						this.order.status = 'making'
						uni.showToast({ title: '已提交定稿', icon: 'success' })
					}
				}
			})
		},
		contactService() {
			uni.showToast({ title: '客服微信：13600976724', icon: 'none' })
		}
	}
}
</script>

<style>
.cd-page { padding: 0 0 140rpx; }

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

.cd-sec { padding: 32rpx 32rpx 0; }

/* 纹样预览 */
.preview-box {
	position: relative;
	height: 400rpx;
	margin-top: 20rpx;
}
.preview-img { width: 100%; height: 400rpx; }
.preview-label {
	position: absolute;
	top: 20rpx; left: 20rpx;
}
.preview-name {
	display: block;
	margin-top: 20rpx;
	font-size: 34rpx; color: #2E2620; font-weight: bold;
	letter-spacing: 2rpx;
}
.preview-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 26rpx; color: #6E6252; line-height: 1.7;
}

/* 款式选择 */
.style-list {
	display: flex; flex-wrap: wrap; gap: 16rpx;
	margin-top: 20rpx;
}
.style-item {
	position: relative;
	width: calc(50% - 8rpx);
	box-sizing: border-box;
	padding: 22rpx;
	display: flex; flex-direction: column; gap: 8rpx;
	border: 1rpx solid var(--wy-line);
}
.style-item.active {
	border-color: #C08A1E;
	background: rgba(200, 154, 59, 0.08);
}
.style-name { font-size: 27rpx; color: #2E2620; }
.style-price { font-size: 24rpx; color: #C8102E; font-weight: bold; }
.style-check {
	position: absolute;
	top: 12rpx; right: 12rpx;
	width: 36rpx; height: 36rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
	color: #fff;
	font-size: 22rpx;
	display: flex; align-items: center; justify-content: center;
}

/* 收货信息 */
.addr-box { padding: 24rpx 28rpx; margin-top: 20rpx; }
.addr-row {
	display: flex; align-items: flex-start;
	padding: 14rpx 0;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.1);
}
.addr-row:last-child { border-bottom: none; }
.addr-label {
	width: 140rpx; flex-shrink: 0;
	font-size: 26rpx; color: #9A8F85;
}
.addr-val { flex: 1; font-size: 27rpx; color: #2E2620; }

/* 进度说明 */
.progress-box { padding: 30rpx 28rpx; margin-top: 20rpx; }
.step {
	display: flex;
	position: relative;
	padding-bottom: 30rpx;
}
.step:last-child { padding-bottom: 0; }
.step-dot {
	width: 28rpx; height: 28rpx; flex-shrink: 0;
	border-radius: 50%;
	background: #E8DECC;
	border: 3rpx solid #C9B89A;
	margin-top: 4rpx;
}
.step-dot.done {
	background: linear-gradient(135deg, #E8C872, #C08A1E);
	border-color: #C08A1E;
}
.step-dot.active {
	background: #FFFDF7;
	border-color: #C08A1E;
	box-shadow: 0 0 0 6rpx rgba(192, 138, 30, 0.18);
}
.step-line {
	position: absolute;
	left: 13rpx; top: 36rpx;
	width: 2rpx;
	height: calc(100% - 36rpx);
	background: #E8DECC;
}
.step-line.done { background: linear-gradient(180deg, #C08A1E, #E8C872); }
.step-body {
	flex: 1;
	margin-left: 18rpx;
}
.step-title { font-size: 28rpx; color: #2E2620; font-weight: 500; }
.step-time { display: block; margin-top: 4rpx; font-size: 22rpx; color: #9A8F85; }
.step-desc { display: block; margin-top: 6rpx; font-size: 24rpx; color: #6E6252; line-height: 1.6; }

/* 底部操作栏 */
.cd-bar {
	position: fixed;
	left: 0; right: 0; bottom: 0;
	display: flex; gap: 20rpx;
	padding: 18rpx 28rpx;
	padding-bottom: calc(18rpx + env(safe-area-inset-bottom));
	background: #FFFDF7;
	border-top: 1rpx solid rgba(200, 154, 59, 0.2);
}
.cd-btn {
	flex: 1;
	height: 80rpx;
	border-radius: 999rpx;
	display: flex; align-items: center; justify-content: center;
	font-size: 28rpx; font-weight: bold;
}
.cd-btn-ghost {
	border: 1rpx solid rgba(200, 154, 59, 0.5);
	color: #8A5A12;
	background: #FFFDF7;
}
.cd-btn-gold {
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
