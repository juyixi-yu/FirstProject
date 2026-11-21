<template>
	<view class="wy-page mine-page">
		<view class="mine-hero">
			<view class="mine-avatar">
				<text class="mine-avatar-text wy-serif">绣</text>
			</view>
			<view class="mine-user">
				<text class="mine-name wy-serif">婺绣友人</text>
				<text class="mine-slogan">一针一线，续千年雅韵</text>
			</view>
		</view>

		<view class="mine-card wy-card">
			<view class="mine-item" @tap="goOrders">
				<text class="mine-ico">🎁</text>
				<text class="mine-label">我的订单</text>
				<text class="mine-arrow">›</text>
			</view>
			<view class="mine-item" @tap="goFavorites">
				<text class="mine-ico">⭐</text>
				<text class="mine-label">我的收藏</text>
				<text class="mine-arrow">›</text>
			</view>
			<view class="mine-item" @tap="goMyCustom">
				<text class="mine-ico">🎨</text>
				<text class="mine-label">我的定制</text>
				<text class="mine-arrow">›</text>
			</view>
			<view class="mine-item" @tap="goStudyRecords">
				<text class="mine-ico">📖</text>
				<text class="mine-label">学习记录</text>
				<text class="mine-arrow">›</text>
			</view>
		</view>

		<view class="mine-card wy-card">
			<view class="mine-item" @tap="go('exhibition')">
				<text class="mine-ico">🏛️</text>
				<text class="mine-label">数字展馆</text>
				<text class="mine-arrow">›</text>
			</view>
			<view class="mine-item" @tap="go('pattern')">
				<text class="mine-ico">🧵</text>
				<text class="mine-label">纹样修复</text>
				<text class="mine-arrow">›</text>
			</view>
			<view class="mine-item" @tap="go('metal')">
				<text class="mine-ico">✨</text>
				<text class="mine-label">文物纹样提取</text>
				<text class="mine-arrow">›</text>
			</view>
		</view>

		<view class="mine-card wy-card">
			<view class="mine-item" @tap="showService = true">
				<text class="mine-ico">📮</text>
				<text class="mine-label">联系客服</text>
				<text class="mine-arrow">›</text>
			</view>
			<view class="mine-item" @tap="showAbout = true">
				<text class="mine-ico">ℹ️</text>
				<text class="mine-label">关于绣韵焕兴</text>
				<text class="mine-arrow">›</text>
			</view>
		</view>

		<!-- 联系客服 -->
		<view class="about-mask" v-if="showService" @tap.self="showService = false">
			<view class="about-panel">
				<view class="about-head">
					<text class="about-title wy-serif">💬 客服咨询</text>
					<view class="about-close" @tap="showService = false">
						<text class="about-close-x">×</text>
					</view>
				</view>

				<scroll-view scroll-y class="about-scroll">
					<view class="about-body">
						<view class="about-section">
							<view class="about-sec-head">
								<view class="about-bar"></view>
								<text class="about-sec-title wy-serif">咨询范围</text>
							</view>
							<view class="svc-list">
								<view class="svc-item">
									<text class="svc-num">1</text>
									<text class="svc-text">刺绣DIY模块操作问题、图纸导出疑问</text>
								</view>
								<view class="svc-item">
									<text class="svc-num">2</text>
									<text class="svc-text">文创材料包、定制刺绣订单咨询、售后</text>
								</view>
								<view class="svc-item">
									<text class="svc-num">3</text>
									<text class="svc-text">美育研学课程、学校合作对接</text>
								</view>
								<view class="svc-item">
									<text class="svc-num">4</text>
									<text class="svc-text">纹样修复、纹样商用授权咨询</text>
								</view>
								<view class="svc-item">
									<text class="svc-num">5</text>
									<text class="svc-text">产品建议、功能反馈</text>
								</view>
							</view>
						</view>

						<view class="about-section">
							<view class="about-sec-head">
								<view class="about-bar"></view>
								<text class="about-sec-title wy-serif">📞 联系方式</text>
							</view>
							<view class="svc-contact">
								<view class="svc-contact-row">
									<text class="svc-contact-label">客服微信</text>
									<text class="svc-contact-val about-em" @tap="copyWechat">13600976724</text>
								</view>
								<view class="svc-contact-row">
									<text class="svc-contact-label">咨询时段</text>
									<text class="svc-contact-val">9:00 — 21:00</text>
								</view>
								<view class="svc-contact-row svc-contact-row-tip">
									<text class="svc-contact-tip">💬 也可以直接在对话框留言，我们会尽快回复</text>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- 关于绣韵焕兴 -->
		<view class="about-mask" v-if="showAbout" @tap.self="showAbout = false">
			<view class="about-panel">
				<view class="about-head">
					<text class="about-title wy-serif">绣韵焕兴 · 项目介绍</text>
					<view class="about-close" @tap="showAbout = false">
						<text class="about-close-x">×</text>
					</view>
				</view>

				<scroll-view scroll-y class="about-scroll">
					<view class="about-body">
						<text class="about-lead">
							绣韵焕兴是聚焦金华非遗婺绣数字化传承的创新项目。我们打造逐针式线上刺绣DIY工具，还原真实婺绣一针一线的创作体验，搭配文创定制、非遗美育课堂、传统纹样数字化修复等服务，降低传统刺绣的学习门槛，让古老婺绣以年轻化的数字形式走进大众生活。
						</text>

						<view class="about-section">
							<view class="about-sec-head">
								<view class="about-bar"></view>
								<text class="about-sec-title wy-serif">核心业务</text>
							</view>
							<view class="about-biz">
								<view class="about-biz-item">
									<text class="about-check">✅</text>
									<text class="about-biz-name">刺绣DIY</text>
									<text class="about-biz-desc">网格逐针落针创作，支持导出图纸落地实物刺绣</text>
								</view>
								<view class="about-biz-item">
									<text class="about-check">✅</text>
									<text class="about-biz-name">文创商城</text>
									<text class="about-biz-desc">婺绣DIY材料包、非遗特色文创产品</text>
								</view>
								<view class="about-biz-item">
									<text class="about-check">✅</text>
									<text class="about-biz-name">匠心定制</text>
									<text class="about-biz-desc">线上自制纹样，定制刺绣胸针、团扇、挂件等</text>
								</view>
								<view class="about-biz-item">
									<text class="about-check">✅</text>
									<text class="about-biz-name">美育课堂</text>
									<text class="about-biz-desc">面向中小学的婺绣非遗研学课程</text>
								</view>
								<view class="about-biz-item">
									<text class="about-check">✅</text>
									<text class="about-biz-name">纹样修复</text>
									<text class="about-biz-desc">老旧婺绣纹样数字化复原、翻新</text>
								</view>
								<view class="about-biz-item">
									<text class="about-check">✅</text>
									<text class="about-biz-name">文物纹样提取</text>
									<text class="about-biz-desc">文物纹样数字化提取与衍生定制</text>
								</view>
							</view>
						</view>

						<view class="about-section">
							<view class="about-sec-head">
								<view class="about-bar"></view>
								<text class="about-sec-title wy-serif">团队介绍</text>
							</view>
							<text class="about-p">
								我们是一支学生创新创业团队，扎根金华本土，致力于用数字技术活化婺绣非遗，让传统手艺被更多年轻人看见、体验与喜爱。
							</text>
						</view>

						<view class="about-section">
							<view class="about-sec-head">
								<view class="about-bar"></view>
								<text class="about-sec-title wy-serif">合作联系</text>
							</view>
							<text class="about-p">
								研学合作、文创联名、非遗工坊对接，可通过<span class="about-em">【联系客服】</span>咨询洽谈。
							</text>
						</view>

						<view class="about-section">
							<view class="about-sec-head">
								<view class="about-bar"></view>
								<text class="about-sec-title wy-serif">版权声明</text>
							</view>
							<text class="about-p">
								本小程序内所有原创针脚纹样、交互设计内容版权归本项目所有，未经许可禁止商用；非遗科普资料来源于公开非遗文献。
							</text>
						</view>

						<view class="about-version">
							<text class="about-version-text">版本：V1.0</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<script>
const TAB_PATHS = ['index', 'mall', 'custom', 'classroom', 'mine']
export default {
	data() {
		return {
			showAbout: false,
			showService: false
		}
	},
	methods: {
		goOrders() {
			uni.navigateTo({ url: '/pages/orders/orders' })
		},
		goFavorites() {
			uni.navigateTo({ url: '/pages/favorites/favorites' })
		},
		goMyCustom() {
			uni.navigateTo({ url: '/pages/my-custom/my-custom' })
		},
		goStudyRecords() {
			uni.navigateTo({ url: '/pages/study-records/study-records' })
		},
		copyWechat() {
			uni.setClipboardData({
				data: '13600976724',
				success: () => uni.showToast({ title: '微信号已复制', icon: 'success' })
			})
		},
		go(path) {
			const url = '/pages/' + path + '/' + path
			if (TAB_PATHS.includes(path)) {
				uni.switchTab({ url })
			} else {
				uni.navigateTo({ url })
			}
		}
	}
}
</script>

<style>
.mine-page { padding: 28rpx; }
.mine-hero {
	display: flex; align-items: center; gap: 32rpx;
	padding: 48rpx 36rpx;
	background: linear-gradient(135deg, #C08A1E 0%, #E8C872 100%);
	border-radius: 24rpx;
	margin-bottom: 28rpx;
}
.mine-avatar {
	width: 120rpx; height: 120rpx; border-radius: 60rpx;
	background: #fff; display: flex; align-items: center; justify-content: center;
	border: 4rpx solid rgba(255,255,255,0.6);
}
.mine-avatar-text { font-size: 56rpx; color: #C08A1E; font-weight: bold; }
.mine-user { display: flex; flex-direction: column; gap: 10rpx; }
.mine-name { font-size: 36rpx; color: #fff; font-weight: bold; }
.mine-slogan { font-size: 24rpx; color: rgba(255,255,255,0.85); }
.mine-card { margin-bottom: 24rpx; padding: 8rpx 0; }
.mine-item {
	display: flex; align-items: center; gap: 24rpx;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid rgba(46,38,32,0.08);
}
.mine-item:last-child { border-bottom: none; }
.mine-ico { font-size: 40rpx; }
.mine-label { flex: 1; font-size: 30rpx; color: #2E2620; }
.mine-arrow { font-size: 32rpx; color: #C08A1E; }

/* 关于绣韵焕兴 弹窗 */
.about-mask {
	position: fixed; inset: 0;
	background: rgba(46, 38, 32, 0.55);
	display: flex; align-items: center; justify-content: center;
	z-index: 99;
}
.about-panel {
	width: 86%;
	height: 82vh;
	background: linear-gradient(180deg, #FFFDF7 0%, #FBF2E0 100%);
	border: 1rpx solid rgba(200, 154, 59, 0.4);
	border-radius: 28rpx;
	box-shadow: 0 16rpx 48rpx rgba(80, 50, 10, 0.35);
	display: flex; flex-direction: column;
	overflow: hidden;
}
.about-head {
	display: flex; align-items: center; justify-content: space-between;
	padding: 28rpx 36rpx 22rpx;
	border-bottom: 1rpx solid rgba(200, 154, 59, 0.25);
}
.about-title {
	font-size: 34rpx; color: #2E2620; font-weight: bold;
}
.about-close {
	width: 52rpx; height: 52rpx; border-radius: 26rpx;
	background: rgba(200, 154, 59, 0.12);
	display: flex; align-items: center; justify-content: center;
}
.about-close-x { font-size: 38rpx; color: #C08A1E; line-height: 1; }
.about-scroll { flex: 1; height: 0; min-height: 0; }
.about-body { padding: 28rpx 36rpx 36rpx; }
.about-lead {
	display: block;
	font-size: 26rpx; line-height: 1.85; color: #4A3A2C;
	text-align: justify;
}
.about-section { margin-top: 36rpx; }
.about-sec-head {
	display: flex; align-items: center; gap: 14rpx;
	margin-bottom: 18rpx;
}
.about-bar {
	width: 6rpx; height: 28rpx;
	background: linear-gradient(180deg, #E8C872, #C08A1E);
	border-radius: 3rpx;
}
.about-sec-title { font-size: 30rpx; color: #2E2620; font-weight: bold; }
.about-biz {
	display: flex; flex-direction: column; gap: 16rpx;
}
.about-biz-item {
	display: flex; align-items: flex-start; gap: 14rpx;
	padding: 18rpx 22rpx;
	background: rgba(200, 154, 59, 0.08);
	border: 1rpx solid rgba(200, 154, 59, 0.18);
	border-radius: 16rpx;
}
.about-check { font-size: 26rpx; flex-shrink: 0; line-height: 1.6; }
.about-biz-name {
	font-size: 27rpx; color: #8A5A12; font-weight: bold;
	flex-shrink: 0; width: 140rpx; line-height: 1.6;
}
.about-biz-desc {
	font-size: 25rpx; line-height: 1.7; color: #4A3A2C;
	flex: 1;
}
.about-p {
	display: block;
	font-size: 26rpx; line-height: 1.85; color: #4A3A2C;
	text-align: justify;
}
.about-em { color: #C08A1E; font-weight: bold; }
.about-version {
	margin-top: 44rpx;
	text-align: center;
	padding-top: 24rpx;
	border-top: 1rpx dashed rgba(200, 154, 59, 0.3);
}
.about-version-text {
	font-size: 24rpx; color: #9A8F85;
}

/* 客服咨询 */
.svc-list {
	display: flex; flex-direction: column; gap: 14rpx;
}
.svc-item {
	display: flex; align-items: flex-start; gap: 16rpx;
	padding: 18rpx 22rpx;
	background: rgba(200, 154, 59, 0.08);
	border: 1rpx solid rgba(200, 154, 59, 0.18);
	border-radius: 16rpx;
}
.svc-num {
	width: 40rpx; height: 40rpx; flex-shrink: 0;
	border-radius: 20rpx;
	background: linear-gradient(135deg, #E8C872, #C08A1E);
	color: #fff; font-size: 24rpx; font-weight: bold;
	display: flex; align-items: center; justify-content: center;
	line-height: 1;
}
.svc-text {
	flex: 1;
	font-size: 26rpx; line-height: 1.7; color: #4A3A2C;
}
.svc-contact {
	display: flex; flex-direction: column; gap: 16rpx;
}
.svc-contact-row {
	display: flex; align-items: center; justify-content: space-between;
	padding: 20rpx 24rpx;
	background: rgba(200, 154, 59, 0.08);
	border: 1rpx solid rgba(200, 154, 59, 0.18);
	border-radius: 16rpx;
}
.svc-contact-label { font-size: 26rpx; color: #8A5A12; font-weight: bold; }
.svc-contact-val { font-size: 28rpx; color: #2E2620; }
.svc-contact-row-tip {
	justify-content: flex-start;
	background: transparent; border: 1rpx dashed rgba(200, 154, 59, 0.3);
}
.svc-contact-tip { font-size: 25rpx; color: #9A8F85; line-height: 1.7; }
</style>
