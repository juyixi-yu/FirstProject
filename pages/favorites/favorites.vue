<template>
	<view class="wy-page fav-page">
		<!-- 自定义顶栏 -->
		<view class="nav-bar">
			<view class="nav-back" @tap="onBack">
				<text class="nav-back-ico">‹</text>
			</view>
			<text class="nav-title wy-serif">我的收藏</text>
			<view class="nav-action" @tap="toggleManage">
				<text class="nav-action-text">{{ manageMode ? '完成' : '管理' }}</text>
			</view>
		</view>

		<!-- 收藏列表 -->
		<view class="fav-list" v-if="favorites.length">
			<view
				class="fav-card wy-card"
				v-for="item in favorites"
				:key="item.id"
				:class="{ 'is-selected': selectedIds.includes(item.id) }"
				@tap="openDetail(item)"
			>
				<!-- 批量模式：选择框 -->
				<view class="fav-check" v-if="manageMode" @tap.stop="toggleSelect(item.id)">
					<view class="fav-check-inner" :class="{ checked: selectedIds.includes(item.id) }">
						<text class="fav-check-ico" v-if="selectedIds.includes(item.id)">✓</text>
					</view>
				</view>

				<image class="fav-img" :src="item.img" mode="aspectFill"></image>
				<view class="fav-info">
					<text class="fav-name wy-serif">{{ item.name }}</text>
					<text class="fav-desc">{{ item.desc }}</text>
					<view class="fav-foot">
						<text class="fav-price">{{ item.price }}</text>
						<!-- 普通模式：取消收藏按钮 -->
						<view class="fav-cancel" v-if="!manageMode" @tap.stop="cancelOne(item.id)">
							<text class="fav-cancel-ico">♥</text>
							<text class="fav-cancel-text">取消收藏</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 空状态 -->
		<view class="empty" v-else>
			<text class="empty-ico">🖤</text>
			<text class="empty-text">暂无收藏商品</text>
			<text class="empty-sub">快去商城逛逛吧</text>
			<view class="wy-btn empty-btn" @tap="goMall">去商城看看</view>
		</view>

		<!-- 批量操作底栏 -->
		<view class="batch-bar" v-if="manageMode && favorites.length">
			<view class="batch-all" @tap="toggleSelectAll">
				<view class="fav-check-inner" :class="{ checked: isAllSelected }">
					<text class="fav-check-ico" v-if="isAllSelected">✓</text>
				</view>
				<text class="batch-all-text">全选</text>
			</view>
			<view class="batch-delete" :class="{ disabled: selectedIds.length === 0 }" @tap="batchDelete">
				<text class="batch-delete-text">删除({{ selectedIds.length }})</text>
			</view>
		</view>
	</view>
</template>

<script>
import { DEFAULT_PRODUCTS } from '../../utils/products'

const STORAGE_KEY = 'wy_favorites'

/** 读取本地收藏；仅在 key 不存在（首次使用）时写入示例数据便于预览 */
function loadFavorites() {
	let raw
	try {
		raw = uni.getStorageSync(STORAGE_KEY)
	} catch (e) {
		raw = ''
	}
	if (raw && Array.isArray(raw)) return raw
	// key 不存在才播种示例数据；若用户主动清空（空数组）则不再播种
	if (raw === '' || raw === null || raw === undefined) {
		const seed = DEFAULT_PRODUCTS.slice(0, 3)
		try {
			uni.setStorageSync(STORAGE_KEY, seed)
		} catch (e) {
			// ignore
		}
		return seed
	}
	return []
}

function saveFavorites(list) {
	try {
		uni.setStorageSync(STORAGE_KEY, list)
	} catch (e) {
		// ignore
	}
}

export default {
	data() {
		return {
			manageMode: false,
			selectedIds: [],
			favorites: []
		}
	},
	computed: {
		isAllSelected() {
			return this.favorites.length > 0 && this.selectedIds.length === this.favorites.length
		}
	},
	onShow() {
		this.favorites = loadFavorites()
		this.selectedIds = []
	},
	methods: {
		onBack() {
			uni.navigateBack()
		},
		toggleManage() {
			this.manageMode = !this.manageMode
			this.selectedIds = []
		},
		openDetail(item) {
			if (this.manageMode) return
			uni.navigateTo({ url: '/pages/product-detail/product-detail?id=' + item.id })
		},
		goMall() {
			uni.switchTab({ url: '/pages/mall/mall' })
		},
		toggleSelect(id) {
			const idx = this.selectedIds.indexOf(id)
			if (idx >= 0) {
				this.selectedIds.splice(idx, 1)
			} else {
				this.selectedIds.push(id)
			}
		},
		toggleSelectAll() {
			if (this.isAllSelected) {
				this.selectedIds = []
			} else {
				this.selectedIds = this.favorites.map((f) => f.id)
			}
		},
		cancelOne(id) {
			uni.showModal({
				title: '取消收藏',
				content: '确定取消收藏该商品吗？',
				confirmText: '确定',
				confirmColor: '#C08A1E',
				success: (res) => {
					if (res.confirm) {
						this.favorites = this.favorites.filter((f) => f.id !== id)
						saveFavorites(this.favorites)
						uni.showToast({ title: '已取消收藏', icon: 'success' })
					}
				}
			})
		},
		batchDelete() {
			if (this.selectedIds.length === 0) return
			uni.showModal({
				title: '批量删除',
				content: '确定删除选中的 ' + this.selectedIds.length + ' 件收藏商品吗？',
				confirmText: '删除',
				confirmColor: '#C8102E',
				success: (res) => {
					if (res.confirm) {
						this.favorites = this.favorites.filter((f) => !this.selectedIds.includes(f.id))
						saveFavorites(this.favorites)
						this.selectedIds = []
						uni.showToast({ title: '已删除', icon: 'success' })
						if (this.favorites.length === 0) {
							this.manageMode = false
						}
					}
				}
			})
		}
	}
}
</script>

<style>
.fav-page { padding: 0 0 40rpx; }

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
.nav-action {
	min-width: 80rpx; height: 60rpx;
	display: flex; align-items: center; justify-content: flex-end;
}
.nav-action-text { font-size: 28rpx; color: #C08A1E; }

/* 收藏列表 */
.fav-list {
	padding: 24rpx 28rpx;
	display: flex; flex-direction: column; gap: 24rpx;
}
.fav-card {
	display: flex; align-items: center;
	padding: 20rpx;
	position: relative;
}
.fav-card.is-selected {
	border-color: #C08A1E;
	box-shadow: 0 8rpx 24rpx rgba(192, 138, 30, 0.22);
}
.fav-check {
	width: 56rpx; height: 100%;
	display: flex; align-items: center; justify-content: center;
	margin-right: 12rpx;
}
.fav-check-inner {
	width: 40rpx; height: 40rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(200, 154, 59, 0.5);
	background: #FFFDF7;
	display: flex; align-items: center; justify-content: center;
}
.fav-check-inner.checked {
	background: linear-gradient(135deg, #E8C872, #C08A1E);
	border-color: #C08A1E;
}
.fav-check-ico {
	font-size: 26rpx; color: #fff; line-height: 1;
}
.fav-img {
	width: 180rpx; height: 180rpx; flex-shrink: 0;
	border-radius: 14rpx;
	background: #F1E7D6;
}
.fav-info {
	flex: 1;
	margin-left: 22rpx;
	display: flex; flex-direction: column;
	min-width: 0;
}
.fav-name {
	font-size: 30rpx; color: #2E2620; font-weight: bold;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fav-desc {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx; color: #9A8F85;
	overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fav-foot {
	display: flex; align-items: center; justify-content: space-between;
	margin-top: auto;
	padding-top: 18rpx;
}
.fav-price {
	font-size: 30rpx; color: #C8102E; font-weight: bold;
}
.fav-cancel {
	display: flex; align-items: center; gap: 6rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	border: 1rpx solid rgba(200, 154, 59, 0.4);
	background: #FFFDF7;
}
.fav-cancel-ico {
	font-size: 24rpx; color: #C08A1E;
}
.fav-cancel-text {
	font-size: 24rpx; color: #8A5A12;
}

/* 空状态 */
.empty {
	display: flex; flex-direction: column; align-items: center;
	padding: 180rpx 0 0;
}
.empty-ico { font-size: 96rpx; opacity: 0.5; }
.empty-text { margin-top: 28rpx; font-size: 30rpx; color: #2E2620; }
.empty-sub { margin-top: 12rpx; font-size: 26rpx; color: #9A8F85; }
.empty-btn { margin-top: 44rpx; }

/* 批量操作底栏 */
.batch-bar {
	position: fixed;
	left: 0; right: 0; bottom: 0;
	display: flex; align-items: center; justify-content: space-between;
	padding: 20rpx 32rpx;
	padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	background: #FFFDF7;
	border-top: 1rpx solid rgba(200, 154, 59, 0.2);
}
.batch-all {
	display: flex; align-items: center; gap: 14rpx;
}
.batch-all-text { font-size: 28rpx; color: #2E2620; }
.batch-delete {
	padding: 16rpx 44rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
}
.batch-delete.disabled {
	opacity: 0.45;
}
.batch-delete-text {
	font-size: 28rpx; color: #fff; font-weight: bold;
}
</style>
