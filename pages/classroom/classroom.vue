<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 88%"></view>
			<view class="wy-skel wy-skel-line" style="width: 66%"></view>
			<view class="wy-skel wy-skel-img" style="height: 150rpx; margin-top: 28rpx"></view>
			<view class="wy-skel wy-skel-img" style="height: 150rpx; margin-top: 22rpx"></view>
		</view>
		<!-- 真实内容 -->
		<block v-else>
		<!-- 标题 -->
		<view class="wy-sec">
			<view class="title-block">
				<text class="title-cn wy-serif wy-gold-title">{{ head.cn }}</text>
				<text class="title-sub">{{ head.sub }}</text>
			</view>
			<text class="wy-sec-sub">{{ head.desc }}</text>
		</view>

		<!-- 课程体系 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">课程体系</text>
			</view>
			<view class="course-list">
				<view class="course-card wy-card" v-for="(c, i) in courses" :key="i">
					<view class="course-head">
						<view class="course-head-l">
							<text class="course-level wy-serif">{{ c.level }}</text>
							<text class="course-badge">{{ c.badge }}</text>
						</view>
						<text class="course-price">{{ c.price }}</text>
					</view>
					<view class="course-mods">
						<view class="course-mod" v-for="(m, j) in c.mods" :key="j">
							<text class="mod-dot"></text>
							<text class="mod-txt">{{ m }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 视频课堂：入门 / 进阶导学视频 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">视频课堂</text>
			</view>
			<text class="wy-sec-sub">入门、进阶各配一段导学视频，先睹为快，跟着老师一针一线学婺绣</text>
			<view class="video-list">
				<view class="video-card wy-card" v-for="(v, i) in videos" :key="i">
					<view class="video-head">
						<text class="video-title wy-serif">{{ v.level }} · {{ v.title }}</text>
						<text class="video-badge">{{ v.badge }}</text>
					</view>
					<!-- 进阶课：始终展示播放器，前30秒免费试看，超时暂停并弹付费窗 -->
					<template v-if="v.lockType === 'pay'">
						<video
							id="adv-video"
							ref="advVideo"
							class="course-video"
							:src="v.src"
							:poster="v.poster"
							:controls="paidAdvanced"
							object-fit="cover"
							:show-center-play-btn="true"
							@play="onAdvPlay"
							@pause="onAdvPause"
							@timeupdate="(e) => onAdvTime(e, v)"
							@ended="onAdvEnd"
						></video>
						<view v-if="!paidAdvanced" class="trial-hint" @tap="onAdvLockTap">
							<text class="trial-badge">免费试看 30s</text>
						</view>
					</template>
					<!-- 入门课：按预约权限决定显示播放器还是锁定遮罩 -->
					<template v-else>
						<video
							v-if="isVideoOpen(v)"
							class="course-video"
							:src="v.src"
							:poster="v.poster"
							controls
							object-fit="cover"
							:show-center-play-btn="true"
						></video>
						<view v-else class="video-lock" @tap="onVideoLock(v)">
							<text class="vl-ico">🔒</text>
							<text class="vl-title">{{ v.lockType === 'pay' ? '付费解锁观看' : '预约到点开放' }}</text>
							<text class="vl-desc">{{ lockDesc(v) }}</text>
							<view class="vl-btn">{{ v.lockType === 'pay' ? '¥ ' + v.price + ' 解锁' : (bookedAt ? '未到开放时间' : '去预约') }}</view>
						</view>
					</template>
					<text class="video-desc">{{ v.desc }}</text>
				</view>
			</view>
		</view>

		<!-- 课程配套材料包 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">课程配套材料包</text>
			</view>
			<text class="wy-sec-sub">按课程进度配套实物材料，绣线、绣绷、纹样底稿、工具一应俱全，开箱即可上手</text>
			<view class="kit-list">
				<view class="kit-card wy-card" v-for="(k, i) in kits" :key="i">
					<view class="kit-head">
						<text class="kit-name wy-serif">{{ k.name }}</text>
						<text class="kit-badge">{{ k.badge }}</text>
					</view>
					<view class="kit-price-row">
						<text class="kit-price">¥ {{ k.price }}</text>
						<text class="kit-unit">/ 套</text>
					</view>
					<view class="kit-mods">
						<view class="kit-mod" v-for="(m, j) in k.mods" :key="j">
							<text class="mod-dot"></text>
							<text class="mod-txt">{{ m }}</text>
						</view>
					</view>
					<view class="kit-btn" @tap="buyKit(k)">
						<text>购买材料包</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 针法拆解 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">针法动态拆解</text>
			</view>
			<text class="wy-sec-sub">把婺绣平针绣、盘金绣、结子绣、锁针绣四大经典针法逐步拆解，基础到高级一学就会</text>
			<view class="stitch-grid">
				<view class="stitch-item" v-for="(s, i) in stitches" :key="i">
					<image class="stitch-bg" :src="s.img" mode="aspectFill"></image>
					<view class="stitch-mask"></view>
					<view class="stitch-body">
						<text class="stitch-char wy-serif">{{ s.char }}</text>
						<text class="stitch-name">{{ s.name }}</text>
						<text class="stitch-desc">{{ s.desc }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- NFC 随身私教 -->
		<view class="wy-sec">
			<view class="tutor-card">
				<view class="tutor-head">
					<text class="tutor-title wy-serif">{{ tutorTitle }}</text>
					<text class="wy-tag">碰一碰</text>
				</view>
				<text class="tutor-desc">{{ tutorDesc }}</text>
				<view class="tutor-flow">
					<text class="tf-step">材料包到家</text>
					<text class="tf-arrow">›</text>
					<text class="tf-step">手机碰一碰</text>
					<text class="tf-arrow">›</text>
					<text class="tf-step">弹出步骤教程</text>
				</view>
			</view>
		</view>

		<!-- 线下预约 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">线下工作室体验</text>
			</view>
			<text class="wy-sec-sub">理论 + 实践双线联动，从线上启蒙走进工作室，亲手绣出第一件作品</text>

			<view class="book-card wy-card">
				<picker mode="date" :value="bookDate" :start="minDate" @change="onDate">
					<view class="book-row">
						<text class="book-label">体验日期</text>
						<view class="book-value">
							<text class="book-val-txt">{{ bookDate || '请选择日期' }}</text>
							<text class="book-arrow">›</text>
						</view>
					</view>
				</picker>
				<picker mode="selector" :range="slots" :value="timeIndex" @change="onTime">
					<view class="book-row book-row-last">
						<text class="book-label">体验时段</text>
						<view class="book-value">
							<text class="book-val-txt">{{ bookTime || '请选择时段' }}</text>
							<text class="book-arrow">›</text>
						</view>
					</view>
				</picker>
			</view>

			<view class="wy-btn book-btn" @tap="book">
				<text>预约工作室体验课</text>
			</view>
		</view>

		<!-- 进阶视频付费解锁窗口 -->
		<view class="pay-mask" v-if="payShow" @tap="payShow = false">
			<view class="pay-panel" @tap.stop>
				<text class="pay-title wy-serif">进阶课 · 进阶技法导学</text>
				<view class="pay-price-row">
					<text class="pay-cur">¥</text>
					<text class="pay-price">{{ videos[1].price }}</text>
				</view>
				<text class="pay-desc">付费课程专属视频 · 一次购买永久观看，无需重复付费</text>
				<view class="wy-btn pay-btn" @tap="payNow"><text>立即购买</text></view>
				<view class="pay-cancel" @tap="payShow = false"><text>取消</text></view>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">非遗美育课堂 · 线上 + 线下</text>
		</view>
		</block>
	</view>
</template>

<script>
	import { img, getPage, getSlots } from '../../utils/cloud'

	function today() {
		const d = new Date()
		const p = (n) => (n < 10 ? '0' + n : '' + n)
		return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
	}

	const TODAY = today()

	export default {
		data() {
			return {
				loading: true,
				head: {
					cn: '非遗美育课堂',
					sub: '线上视频课 · 线下体验课 · 双线联动',
					desc: '从启蒙到精进的完整闭环：线上学理论、练针法，线下进工作室亲手体验'
				},
				bookDate: TODAY,
				bookTime: '',
				timeIndex: 0,
				slots: [],
				minDate: TODAY,
				tutorTitle: 'NFC 智能挂件 · 随身私教',
				tutorDesc: '课程配套邮寄实物材料包，并附 NFC 智能挂件。手机碰一碰，即可弹出当前步骤的视频教程，相当于把一位“随身私教”带回家。',
				videos: [
					{ level: '入门课', title: '零基础导学', badge: '预约开放', lockType: 'booking', price: '', src: img('videos/08d1f686c664da08c2680ab76d5275b2.mp4'), desc: '婺绣历史文化与基础针法演示，预约线下体验课后到点自动开放；仅限预约当日观看' },
					{ level: '进阶课', title: '进阶技法导学', badge: '付费 ¥199', lockType: 'pay', price: '199', src: img('videos/d11e98f711541b5bc2150a8980f34d2d.mp4'), desc: '纹样构图配色与复杂针法实操讲解，付费解锁永久观看' }
				],
				bookedAt: 0,
				bookedText: '',
				paidAdvanced: false,
				advCurrentTime: 0,
				advLocked: false,
				payShow: false,
				courses: [
					{ level: '入门课', badge: '零基础友好', price: '免费', mods: ['理论课 · 婺绣历史与文化', '实践课 · 基础针法入门实操'] },
					{ level: '进阶课', badge: '从会到精', price: '¥ 199', mods: ['理论课 · 纹样构图与配色', '实践课 · 复杂针法进阶实操'] }
				],
				kits: [
					{ name: '入门款材料包', badge: '零基础适用', price: '35', mods: ['基础绣线 6 色 · 真丝线', '小号竹绣绷 1 个', '入门纹样底稿 3 张', '绣针 · 顶针 · 拆线刀'] },
					{ name: '进阶款材料包', badge: '进阶实操', price: '65', mods: ['高级绣线 12 色 · 含盘金线', '中号实木绣绷 1 个', '进阶纹样底稿 5 张', 'NFC 教程卡片 1 张'] }
				],
				stitches: [
					{ char: '平', name: '平针绣', desc: '针脚平顺匀净如镜、排线紧密不露底色，是婺绣最根本的绣法，绣面平整服帖，尽显丝线光泽。', img: img('stitch-ping.jpg') },
					{ char: '盘', name: '盘金绣', desc: '金线盘绕纹样轮廓、钉缀固定金光沉稳，多用于婺剧戏服礼器，显贵气于一身，历久而不褪色。', img: img('stitch-panjin.jpg') },
					{ char: '结', name: '结子绣', desc: '丝线绕结成粒如珠、颗颗饱满立体凸起，多用于点缀花蕊纹样，绣面更为丰盈，粒粒凹凸可爱。', img: img('stitch-jiezi.jpg') },
					{ char: '锁', name: '锁针绣', desc: '针脚环环相扣如链、线条挺括连贯不断，最宜走边勾线与勾筋，轮廓挺立不散，久绣而形不变。', img: img('stitch-suo.jpg') }
				]
			}
		},
		onLoad() {
			this.refreshLocks()
			this.fetch()
		},
		onShow() {
			this.refreshLocks()
		},
		methods: {
			refreshLocks() {
				try {
					const b = uni.getStorageSync('wy_class_booking')
					if (b && b.ts && b.date) {
						// 预约当日 00:00:00 的时间戳（用于判断是否仍在有效期内）
						const today0 = new Date()
						today0.setHours(0, 0, 0, 0)
						const booked0 = new Date(b.date + 'T00:00:00').getTime()
						const now = Date.now()
						if (now >= booked0 && now < today0.getTime() + 24 * 3600 * 1000) {
							// 当天内：预约时间已过 → 解锁；预约时间未到 → 锁定
							this.bookedAt = b.ts
						} else {
							// 已过期（第二天及以后）或日期格式不合法 → 清掉，恢复锁定
							this.bookedAt = 0
						}
						this.bookedText = b.date + ' ' + (b.time || '')
					} else {
						this.bookedAt = 0
						this.bookedText = ''
					}
					// 支付尚未接入：进阶课始终锁定，购买按钮仅跳转订单确认页
					this.paidAdvanced = false
				} catch (e) {}
			},
			isVideoOpen(v) {
				if (v.lockType === 'pay') return this.paidAdvanced
				// 入门课：已预约 + 当天 + 到点
				return !!(this.bookedAt && Date.now() >= this.bookedAt)
			},
			lockDesc(v) {
				if (v.lockType === 'pay') return '付费课程专属视频，一次购买永久观看'
				if (this.bookedAt) return '已预约 ' + this.bookedText + '，到点自动开放'
				return '预约线下体验课后，到预约时间自动开放'
			},
			onVideoLock(v) {
				if (v.lockType === 'pay') {
					this.payShow = true
					return
				}
				if (this.bookedAt) {
					uni.showToast({ title: '预约时间未到，到点自动开放', icon: 'none' })
					return
				}
				uni.showModal({
					title: '视频未开放',
					content: '请先预约线下体验课，到预约时间后入门导学视频自动开放',
					confirmText: '去预约',
					success: (r) => {
						if (r.confirm) uni.pageScrollTo({ selector: '.book-card', duration: 300 })
					}
				})
			},
			payNow() {
				const v = this.videos[1] || {}
				this.payShow = false
				const q = [
					'from=classroom',
					'title=' + encodeURIComponent('进阶课 · ' + (v.title || '进阶技法导学')),
					'price=' + encodeURIComponent(v.price || '199'),
					'spec=' + encodeURIComponent('线上课程 · 一次购买永久观看'),
					'img=' + encodeURIComponent(v.poster || ''),
					'qty=1'
				].join('&')
				uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
			},
			// ===== 进阶课 · 前30秒免费试看控制 =====
			onAdvPlay() {
				this.advLocked = false
			},
			onAdvPause() {
				// 暂停由用户触发或超时拦截触发，无需额外处理
			},
			onAdvTime(e, v) {
				this.advCurrentTime = e.detail.currentTime || 0
				if (!this.paidAdvanced && !this.advLocked && this.advCurrentTime >= 30) {
					this.advLocked = true
					try { uni.createVideoContext('adv-video', this).pause() } catch (err) {}
					this.payShow = true
				}
			},
			onAdvEnd() {
				// 播放到结尾（未付费不会走到这里，30秒就被截了）
			},
			onAdvLockTap() {
				this.payShow = true
			},
			async fetch() {
				const d = await getPage('classroom')
				// 可预约时段来自云数据库集合 wy-book-slot
				this.slots = await getSlots()
				this.loading = false
				if (!d) return
				if (d.head) this.head = d.head
				if (d.courses) this.courses = d.courses
				if (d.kits) this.kits = d.kits
				if (d.stitches) this.stitches = d.stitches.map((s) => ({ ...s, img: img(s.img) }))
				if (d.videos) this.videos = d.videos.map((v) => {
					const o = { ...v, src: img(v.src) }
					if (v.poster) o.poster = img(v.poster)
					return o
				})
				if (d.tutorTitle) this.tutorTitle = d.tutorTitle
				if (d.tutorDesc) this.tutorDesc = d.tutorDesc
			},
			onDate(e) {
				this.bookDate = e.detail.value
			},
			onTime(e) {
				const i = Number(e.detail.value) || 0
				this.timeIndex = i
				this.bookTime = this.slots[i] || ''
			},
			book() {
				if (!this.bookDate || !this.bookTime) {
					uni.showToast({ title: '请选择体验日期和时段', icon: 'none' })
					return
				}
				// 解析时段开始时间（如 "14:00-16:00"），手动拼 Date 避免部分环境解析失败
				const m = String(this.bookTime).match(/(\d{1,2}):(\d{2})/)
				const hh = m ? +m[1] : 9
				const mm = m ? +m[2] : 0
				const d = String(this.bookDate).split('-')
				const ts = new Date(+d[0], (+d[1] || 1) - 1, +d[2] || 1, hh, mm, 0).getTime()
				uni.setStorageSync('wy_class_booking', { date: this.bookDate, time: this.bookTime, ts })
				this.bookedAt = ts
				this.bookedText = this.bookDate + ' ' + this.bookTime
				uni.showModal({
					title: '预约成功',
					content: this.bookDate + ' ' + this.bookTime + ' 线下体验课已预约，入门导学视频将在到点后自动开放',
					showCancel: false
				})
			},
			buyKit(k) {
				uni.showToast({ title: k.name + ' ¥' + k.price + '/套，即将上架商城', icon: 'none' })
			}
		}
	}
</script>

<style>
	.title-block {
		padding: 20rpx 0 4rpx;
	}

	.title-cn {
		display: block;
		font-size: 64rpx;
		letter-spacing: 8rpx;
	}

	.title-sub {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		letter-spacing: 2rpx;
		color: var(--wy-txt-2);
	}

	/* 课程 */
	.course-list {
		margin-top: 28rpx;
	}

	.course-card {
		padding: 28rpx 28rpx 26rpx;
		margin-bottom: 22rpx;
	}

	.course-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.course-head-l {
		display: flex;
		align-items: center;
	}

	.course-level {
		font-size: 36rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 3rpx;
	}

	.course-badge {
		margin-left: 16rpx;
		padding: 4rpx 18rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
	}

	.course-price {
		font-size: 34rpx;
		font-weight: 600;
		color: var(--wy-gold-dk);
		letter-spacing: 1rpx;
	}

	.course-mods {
		margin-top: 20rpx;
	}

	.course-mod {
		display: flex;
		align-items: center;
		margin-top: 14rpx;
	}

	.mod-dot {
		width: 10rpx;
		height: 10rpx;
		margin-right: 16rpx;
		border-radius: 50%;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
	}

	.mod-txt {
		font-size: 26rpx;
		color: var(--wy-txt);
	}

	/* 视频课堂 */
	.video-list {
		margin-top: 28rpx;
	}

	.video-card {
		padding: 28rpx;
		margin-bottom: 22rpx;
	}

	.video-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.video-title {
		font-size: 32rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.video-badge {
		padding: 4rpx 18rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
	}

	.course-video {
		width: 100%;
		height: 380rpx;
		border-radius: 14rpx;
		background: #1a1410;
	}

	/* 进阶课试看角标（未付费时显示） */
	.trial-hint {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		z-index: 3;
		padding: 8rpx 20rpx;
		border-radius: 24rpx;
		background: rgba(139, 90, 43, 0.88);
		backdrop-filter: blur(6rpx);
	}
	.trial-badge {
		font-size: 22rpx;
		color: #fff8ee;
		letter-spacing: 1rpx;
	}
	.video-card { position: relative; }

	.video-desc {
		display: block;
		margin-top: 16rpx;
		font-size: 24rpx;
		line-height: 38rpx;
		color: var(--wy-txt-2);
	}

	/* 视频锁定遮罩 */
	.video-lock {
		width: 100%;
		height: 380rpx;
		border-radius: 14rpx;
		background: #1a1410;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.vl-ico {
		font-size: 56rpx;
		margin-bottom: 14rpx;
	}

	.vl-title {
		font-size: 30rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.vl-desc {
		margin-top: 10rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
		padding: 0 40rpx;
		text-align: center;
	}

	.vl-btn {
		margin-top: 22rpx;
		padding: 10rpx 44rpx;
		font-size: 26rpx;
		color: #2a1f10;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
		border-radius: 999rpx;
	}

	/* 付费解锁窗口 */
	.pay-mask {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 99;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pay-panel {
		width: 560rpx;
		background: #241c12;
		border: 1rpx solid var(--wy-line);
		border-radius: 24rpx;
		padding: 48rpx 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.pay-title {
		font-size: 32rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.pay-price-row {
		display: flex;
		align-items: baseline;
		margin: 26rpx 0 10rpx;
		color: var(--wy-gold-lt);
	}

	.pay-cur {
		font-size: 30rpx;
	}

	.pay-price {
		font-size: 64rpx;
		font-weight: 600;
	}

	.pay-desc {
		font-size: 24rpx;
		color: var(--wy-txt-2);
		margin-bottom: 36rpx;
	}

	.pay-btn {
		width: 100%;
	}

	.pay-cancel {
		margin-top: 24rpx;
		font-size: 26rpx;
		color: var(--wy-txt-2);
		padding: 10rpx 40rpx;
	}

	/* 材料包 */
	.kit-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.kit-card {
		width: calc(50% - 8rpx);
		box-sizing: border-box;
		padding: 26rpx 24rpx;
		margin-bottom: 16rpx;
		display: flex;
		flex-direction: column;
	}

	.kit-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.kit-name {
		font-size: 30rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 1rpx;
	}

	.kit-badge {
		padding: 4rpx 12rpx;
		font-size: 20rpx;
		color: var(--wy-txt-2);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
	}

	.kit-price-row {
		display: flex;
		align-items: baseline;
		margin-top: 14rpx;
	}

	.kit-price {
		font-size: 40rpx;
		font-weight: 600;
		color: var(--wy-gold-dk);
		letter-spacing: 1rpx;
	}

	.kit-unit {
		margin-left: 8rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	.kit-mods {
		flex: 1;
		margin-top: 16rpx;
	}

	.kit-mod {
		display: flex;
		align-items: flex-start;
		margin-top: 10rpx;
	}

	.kit-mod .mod-dot {
		margin-top: 12rpx;
	}

	.kit-btn {
		margin-top: 20rpx;
		height: 62rpx;
		border-radius: 999rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 25rpx;
		color: #6B4A10;
		background-image: linear-gradient(135deg, #F6E6AE, #D9B45C);
		border: 1rpx solid rgba(160, 120, 40, 0.3);
	}

	/* 针法 */
	.stitch-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.stitch-item {
		position: relative;
		width: 335rpx;
		box-sizing: border-box;
		min-height: 460rpx;
		padding: 26rpx 24rpx;
		margin-bottom: 22rpx;
		border-radius: 18rpx;
		border: 1rpx solid var(--wy-line);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}

	.stitch-bg {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.stitch-mask {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-image: linear-gradient(180deg, rgba(18, 14, 10, 0.10) 0%, rgba(18, 14, 10, 0.34) 42%, rgba(18, 14, 10, 0.78) 100%);
	}

	.stitch-body {
		position: relative;
	}

	.stitch-char {
		display: block;
		font-size: 60rpx;
		color: #F6E6AE;
		line-height: 68rpx;
	}

	.stitch-name {
		display: block;
		margin-top: 8rpx;
		font-size: 28rpx;
		letter-spacing: 2rpx;
		color: var(--wy-on-img);
	}

	.stitch-desc {
		display: block;
		margin-top: 8rpx;
		font-size: 22rpx;
		line-height: 34rpx;
		color: var(--wy-on-img-2);
	}

	/* NFC 私教 */
	.tutor-card {
		padding: 34rpx 30rpx;
		border-radius: 22rpx;
		border: 1rpx solid var(--wy-line);
		background-image: linear-gradient(135deg, rgba(200, 154, 59, 0.16), rgba(214, 197, 166, 0.5));
	}

	.tutor-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tutor-title {
		font-size: 34rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.tutor-desc {
		display: block;
		margin-top: 18rpx;
		font-size: 26rpx;
		line-height: 44rpx;
		color: var(--wy-txt-2);
	}

	.tutor-flow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 26rpx;
		padding-top: 24rpx;
		border-top: 1rpx solid rgba(160, 120, 40, 0.18);
	}

	.tf-step {
		font-size: 23rpx;
		color: var(--wy-txt);
	}

	.tf-arrow {
		font-size: 30rpx;
		color: rgba(138, 101, 22, 0.5);
	}

	.book-btn {
		display: block;
		margin-top: 28rpx;
		text-align: center;
	}

	/* 预约日期/时段选择 */
	.book-card {
		margin-top: 28rpx;
		padding: 0 28rpx;
	}

	.book-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100rpx;
		border-bottom: 1rpx solid rgba(160, 120, 40, 0.16);
	}

	.book-row-last {
		border-bottom: none;
	}

	.book-label {
		font-size: 28rpx;
		color: var(--wy-txt);
	}

	.book-value {
		display: flex;
		align-items: center;
	}

	.book-val-txt {
		font-size: 28rpx;
		letter-spacing: 2rpx;
		color: var(--wy-gold-dk);
	}

	.book-arrow {
		margin-left: 12rpx;
		font-size: 32rpx;
		color: rgba(138, 101, 22, 0.5);
	}
</style>
