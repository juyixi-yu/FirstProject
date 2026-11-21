<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 绣韵焕兴 · 全局设计系统：宣纸米白 + 鎏金国风 */
	page {
		--wy-bg: #F2EADC;
		--wy-bg-2: #EAE0CE;
		--wy-card: #FFFDF7;
		--wy-card-2: #F1E7D6;
		--wy-line: rgba(160, 120, 40, 0.26);
		--wy-gold: #C08A1E;
		--wy-gold-lt: #C99A3B;
		--wy-gold-dk: #8A6516;
		--wy-red: #C8102E;
		--wy-txt: #2E2620;
		--wy-txt-2: #6E6252;
		--wy-on-img: #F7F0E2;
		--wy-on-img-2: rgba(247, 240, 226, 0.74);

		background-color: var(--wy-bg);
		color: var(--wy-txt);
		font-family: -apple-system, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
	}

	/* 页面容器：宣纸底 + 顶部鎏金微光 */
	.wy-page {
		min-height: 100vh;
		box-sizing: border-box;
		padding-bottom: 180rpx;
		background-color: var(--wy-bg);
		background-image: radial-gradient(120% 46% at 50% 0%, rgba(200, 154, 59, 0.10), rgba(200, 154, 59, 0) 62%);
	}

	/* 国风衬线标题 */
	.wy-serif {
		font-family: "Songti SC", "STSong", "SimSun", serif;
	}

	/* 鎏金渐变文字（浅底版：加深，保证可读） */
	.wy-gold-title {
		color: var(--wy-gold-dk);
		background-image: linear-gradient(135deg, #C99A3B 0%, #A87A18 52%, #7E5A12 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	/* 通用卡片：暖白纸面 + 柔和暖投影 */
	.wy-card {
		background-color: var(--wy-card);
		border: 1rpx solid var(--wy-line);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 24rpx rgba(120, 90, 40, 0.10);
		overflow: hidden;
	}

	/* 区块头部：金色短杠 + 标题 */
	.wy-sec {
		padding: 46rpx 32rpx 0;
	}

	.wy-sec-head {
		display: flex;
		align-items: center;
	}

	.wy-sec-bar {
		width: 8rpx;
		height: 34rpx;
		border-radius: 8rpx;
		margin-right: 16rpx;
		background-image: linear-gradient(180deg, #C99A3B, #8A6516);
		box-shadow: 0 0 16rpx rgba(200, 154, 59, 0.35);
	}

	.wy-sec-title {
		font-size: 38rpx;
		font-weight: 600;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.wy-sec-sub {
		display: block;
		margin: 14rpx 0 0 24rpx;
		font-size: 24rpx;
		color: var(--wy-txt-2);
		line-height: 36rpx;
	}

	/* 描边标签 */
	.wy-tag {
		display: inline-block;
		padding: 4rpx 18rpx;
		font-size: 22rpx;
		color: var(--wy-gold-dk);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
		background-color: rgba(200, 154, 59, 0.14);
	}

	/* 鎏金主按钮 */
	.wy-btn {
		display: inline-block;
		padding: 20rpx 44rpx;
		font-size: 28rpx;
		font-weight: 600;
		color: #2A1C08;
		letter-spacing: 2rpx;
		border-radius: 999rpx;
		background-image: linear-gradient(135deg, #F6E6AE, #D4AF37 55%, #C99A3B);
		box-shadow: 0 10rpx 26rpx rgba(200, 154, 59, 0.30);
	}

	.wy-btn-ghost {
		display: inline-block;
		padding: 18rpx 40rpx;
		font-size: 28rpx;
		color: var(--wy-gold-dk);
		letter-spacing: 2rpx;
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
	}

	/* 页脚 */
	.wy-footer {
		margin-top: 60rpx;
		padding: 50rpx 32rpx 40rpx;
		text-align: center;
		border-top: 1rpx solid rgba(160, 120, 40, 0.16);
	}

	.wy-footer-brand {
		display: block;
		font-size: 40rpx;
		letter-spacing: 8rpx;
	}

	.wy-footer-line {
		display: block;
		margin-top: 14rpx;
		font-size: 24rpx;
		color: var(--wy-txt-2);
		letter-spacing: 4rpx;
	}

	/* 骨架屏：鎏金流光滑过 */
	.wy-skel {
		position: relative;
		overflow: hidden;
		background-color: var(--wy-card-2);
		border-radius: 10rpx;
	}

	.wy-skel::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image: linear-gradient(90deg, rgba(200, 154, 59, 0) 0%, rgba(200, 154, 59, 0.18) 50%, rgba(200, 154, 59, 0) 100%);
		animation: wy-shimmer 1.5s linear infinite;
	}

	@keyframes wy-shimmer {
		0% {
			transform: translateX(-100%);
		}

		100% {
			transform: translateX(100%);
		}
	}

	.wy-skel-wrap {
		padding: 40rpx 32rpx 0;
	}

	.wy-skel-title {
		height: 44rpx;
		width: 46%;
		margin-bottom: 26rpx;
	}

	.wy-skel-line {
		height: 26rpx;
		margin-bottom: 18rpx;
	}

	.wy-skel-tag {
		height: 30rpx;
		width: 116rpx;
		border-radius: 999rpx;
		margin-bottom: 20rpx;
	}

	.wy-skel-img {
		width: 100%;
		background-color: var(--wy-card-2);
		border-radius: 20rpx;
	}

	/* 功能未开放占位（提审期隐藏 AI 相关内容时使用） */
	.wy-off {
		padding: 180rpx 60rpx 0;
		text-align: center;
	}

	.wy-off-title {
		display: block;
		font-size: 44rpx;
		letter-spacing: 4rpx;
	}

	.wy-off-desc {
		display: block;
		margin-top: 20rpx;
		font-size: 26rpx;
		color: var(--wy-txt-2);
		line-height: 40rpx;
	}
</style>
