<template>
	<view class="wy-page sr-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">学习记录</text>
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

		<!-- 课程列表 -->
		<view class="sr-list" v-if="filteredList.length">
			<view
				class="sr-card wy-card"
				v-for="c in filteredList"
				:key="c.id"
				@tap="viewCourse(c)"
			>
				<image class="sr-img" :src="c.img" mode="aspectFill"></image>
				<view class="sr-info">
					<text class="sr-name wy-serif">{{ c.name }}</text>
					<text class="sr-time">上次学习：{{ c.time }}</text>
					<view class="sr-progress">
						<view class="sr-progress-bar">
							<view class="sr-progress-inner" :style="{ width: c.progress + '%' }"></view>
						</view>
						<text class="sr-progress-txt">{{ c.progress }}%</text>
					</view>
					<view class="sr-foot">
						<view class="btn btn-ghost" @tap.stop="viewCourse(c)">查看课程</view>
						<view class="btn btn-gold" v-if="c.progress < 100" @tap.stop="continueLearn(c)">继续学习</view>
						<view class="btn btn-gold" v-else @tap.stop="viewCourse(c)">复习课程</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-else>
			<text class="empty-ico">📖</text>
			<text class="empty-text">暂无学习记录</text>
			<text class="empty-sub">前往学堂体验婺绣课程</text>
			<view class="wy-btn empty-btn" @tap="goClassroom">去学堂</view>
		</view>
	</view>
</template>

<script>
import { img } from '../../utils/cloud'

const TABS = [
	{ key: 'all', label: '全部' },
	{ key: 'done', label: '已学' },
	{ key: 'learning', label: '进行中' }
]

// 学习记录数据（待接入云数据库 study_records 集合）
const MOCK_RECORDS = [
	{
		id: 'c01',
		name: '婺绣历史与文化',
		time: '2026-10-20 19:30',
		progress: 100,
		img: img('stitch-ping.jpg')
	},
	{
		id: 'c02',
		name: '基础针法入门实操',
		time: '2026-10-22 20:15',
		progress: 65,
		img: img('stitch-panjin.jpg')
	},
	{
		id: 'c03',
		name: '纹样构图与配色',
		time: '2026-10-25 14:00',
		progress: 30,
		img: img('stitch-jiezi.jpg')
	}
]

export default {
	data() {
		return {
			tabs: TABS,
			curStatus: 'all',
			list: MOCK_RECORDS
		}
	},
	computed: {
		filteredList() {
			if (this.curStatus === 'all') return this.list
			if (this.curStatus === 'done') return this.list.filter((c) => c.progress >= 100)
			return this.list.filter((c) => c.progress < 100)
		}
	},
	methods: {
		onBack() {
			uni.navigateBack()
		},
		viewCourse() {
			uni.showToast({ title: '课程详情即将开放', icon: 'none' })
		},
		continueLearn(c) {
			uni.showToast({ title: '继续学习「' + c.name + '」', icon: 'none' })
		},
		goClassroom() {
			uni.switchTab({ url: '/pages/classroom/classroom' })
		}
	}
}
</script>

<style>
.sr-page { padding: 0 0 40rpx; }

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

/* 课程卡片 */
.sr-list { padding: 24rpx 28rpx; display: flex; flex-direction: column; gap: 24rpx; }
.sr-card {
	display: flex;
	padding: 20rpx;
}
.sr-img {
	width: 200rpx; height: 200rpx; flex-shrink: 0;
	border-radius: 14rpx;
	background: #F1E7D6;
}
.sr-info {
	flex: 1;
	margin-left: 22rpx;
	display: flex; flex-direction: column;
	min-width: 0;
}
.sr-name {
	font-size: 30rpx; color: #2E2620; font-weight: bold;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sr-time {
	margin-top: 10rpx;
	font-size: 24rpx; color: #9A8F85;
}
.sr-progress {
	display: flex; align-items: center; gap: 14rpx;
	margin-top: auto;
	padding: 16rpx 0;
}
.sr-progress-bar {
	flex: 1;
	height: 12rpx;
	border-radius: 6rpx;
	background: #F1E7D6;
	overflow: hidden;
}
.sr-progress-inner {
	height: 100%;
	border-radius: 6rpx;
	background: linear-gradient(90deg, #E8C872, #C08A1E);
}
.sr-progress-txt {
	font-size: 24rpx; color: #C08A1E; font-weight: bold;
	min-width: 70rpx; text-align: right;
}
.sr-foot {
	display: flex; justify-content: flex-end; gap: 16rpx;
}

.btn {
	padding: 10rpx 26rpx;
	border-radius: 32rpx;
	font-size: 24rpx;
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
