<template>
	<view class="wy-page">
		<!-- 骨架屏 -->
		<view v-if="loading" class="wy-skel-wrap">
			<view class="wy-skel wy-skel-tag"></view>
			<view class="wy-skel wy-skel-title"></view>
			<view class="wy-skel wy-skel-line" style="width: 82%"></view>
			<view class="wy-skel wy-skel-line" style="width: 58%"></view>
			<view class="wy-skel wy-skel-img" style="height: 240rpx; margin-top: 28rpx"></view>
			<view class="wy-skel wy-skel-img" style="height: 240rpx; margin-top: 24rpx"></view>
		</view>
		<!-- 提审期占位：isDisplay=1 时隐藏该功能 -->
		<view v-else-if="hideAI" class="wy-off">
			<text class="wy-off-title wy-serif">该功能暂未开放</text>
			<text class="wy-off-desc">相关服务正在升级完善中，敬请期待。</text>
		</view>
		<!-- 真实内容 -->
		<block v-else>
		<!-- 标题区 -->
		<view class="wy-sec">
			<view class="title-block">
				<text class="title-cn wy-serif wy-gold-title">{{ head.cn }}</text>
				<text class="title-sub">{{ head.sub }}</text>
			</view>
			<text class="wy-sec-sub">{{ head.desc }}</text>
		</view>

		<!-- 输入方式切换 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">第一步 · 选择灵感来源</text>
			</view>

			<view class="seg">
				<view class="seg-item" :class="{ 'seg-on': mode === 'photo' }" @tap="switchMode('photo')">
					<text>上传照片</text>
				</view>
				<view class="seg-item" :class="{ 'seg-on': mode === 'text' }" @tap="switchMode('text')">
					<text>输入文字</text>
				</view>
			</view>

			<!-- 上传照片 -->
			<view v-if="mode === 'photo'" class="upload-box" @tap="choosePhoto">
				<image v-if="photo" class="upload-img" :src="photo" mode="aspectFill"></image>
				<view v-else class="upload-empty">
					<view class="upload-plus"></view>
					<text class="upload-tip">点击上传照片</text>
					<text class="upload-hint">支持人像、宠物、合影等，作刺绣底稿参考</text>
				</view>
			</view>

			<!-- 输入文字 -->
			<view v-else class="text-box">
				<textarea class="text-area" v-model="text" maxlength="60"
					placeholder="如：婺州古建与喜鹊、庭院牡丹、婺江月夜……" placeholder-class="ta-ph" />
				<view class="hot-words">
					<text class="hot-label">灵感词：</text>
					<text class="hot-word" v-for="(w, i) in hotWords" :key="i" @tap="pickWord(w)">{{ w }}</text>
				</view>
				<view class="deep-row" @tap="toggleDeep">
					<view class="deep-check" :class="{ on: deepSearch }">{{ deepSearch ? '✓' : '' }}</view>
					<text class="deep-label">深度考据（联网搜索文化背景，纹样更贴合主题）</text>
				</view>
			</view>
		</view>

		<!-- 风格选择 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">第二步 · 选择风格</text>
			</view>
			<view class="style-list">
				<view class="style-card" :class="{ 'style-on': style === s.key }" v-for="(s, i) in styles" :key="i" @tap="setStyle(s.key)">
					<image class="style-img" :src="s.img" mode="aspectFill"></image>
					<text class="style-name wy-serif">{{ s.name }}</text>
					<text class="style-desc">{{ s.desc }}</text>
					<text class="style-price">{{ s.price }}</text>
				</view>
			</view>
		</view>

		<!-- 生成与预览 -->
		<view class="wy-sec">
			<view class="wy-sec-head">
				<view class="wy-sec-bar"></view>
				<text class="wy-sec-title wy-serif">第三步 · 生成并预览</text>
			</view>

			<view class="result-box wy-card">
				<image class="result-img" :src="result || IMG.result" mode="widthFix" @tap="previewResult"></image>
				<view class="result-mask" v-if="generating">
					<view class="spin"></view>
					<text class="spin-txt">{{ (mode === 'text' && deepSearch) ? 'AI 正在联网考据并绘制…' : 'AI 正在绘制底稿…' }}</text>
				</view>
				<view class="result-label">
					<text class="wy-tag">{{ curStyleName }}</text>
					<text class="result-label-txt">{{ result ? '婺绣审美 · 点击查看大图' : '婺绣审美 · 在线预览' }}</text>
				</view>
			</view>

			<!-- 每张生成图都配一份纹样档案：有联网考据用考据，没有则按分类自动生成 -->
			<view class="brief-card" v-if="resultMeta">
				<view class="brief-head">
					<text class="brief-title wy-serif">{{ brief ? 'AI 深度考据' : '纹样档案' }}</text>
					<text class="brief-tag wy-tag">{{ brief ? '联网检索' : '馆藏资料' }}</text>
				</view>
				<text class="brief-txt">{{ brief || resultMeta.detail }}</text>
			</view>

			<!-- 本次使用的实景参考图（生图依据，有据可查） -->
			<view class="brief-card ref-card" v-if="refPhoto">
				<view class="brief-head">
					<text class="brief-title wy-serif">本次参考实景图</text>
					<text class="brief-tag wy-tag">已校验为该景点实景</text>
				</view>
				<image class="ref-img" :src="refPhoto" mode="widthFix" @tap="previewRef"></image>
				<text class="ref-tip">生图以此照片的内容构图为准 · 点击查看大图</text>
			</view>

			<view class="gen-row">
				<view class="wy-btn gen-btn" @tap="generate">
					<text>生成专属刺绣底稿</text>
				</view>
				<view class="wy-btn-ghost gen-btn" v-if="result" @tap="importToDIY">
					<text>导入刺绣DIY</text>
				</view>
				<view class="wy-btn-ghost gen-btn" v-if="result" @tap="exportDraft">
					<text>导出底稿</text>
				</view>
			</view>
		</view>

		<!-- 流程条 -->
		<view class="wy-sec">
			<view class="flow">
				<view class="flow-item" v-for="(f, i) in flow" :key="i">
					<text class="flow-no">{{ i + 1 }}</text>
					<text class="flow-name">{{ f }}</text>
					<view class="flow-arrow" v-if="i < flow.length - 1">›</view>
				</view>
			</view>
		</view>

		<!-- 下单 -->
		<view class="wy-sec">
			<view class="order-card">
				<text class="order-title wy-serif">{{ orderTitle }}</text>
				<text class="order-desc">{{ orderDesc }}</text>
				<view class="wy-btn order-btn" @tap="order">
					<text>立即下单定制</text>
				</view>
			</view>
		</view>

		<view class="wy-footer">
			<text class="wy-footer-brand wy-serif wy-gold-title">绣韵焕兴</text>
			<text class="wy-footer-line">匠心 · 智绘 · 专属刺绣生成</text>
		</view>
		</block>
		<!-- 离屏画布：用于 AI 绣稿渲染 -->
		<canvas type="2d" id="aiCanvas" canvas-id="aiCanvas" class="ai-canvas"></canvas>
	</view>
</template>

<script>
	import { img, getPage, getHideAI } from '../../utils/cloud'
	import { imageToBase64 } from '../../utils/image-base64'
	import { generateEmbroidery } from '../../utils/embroidery'

	function defImg() {
		return {
			cartoon: img('style-cartoon.jpg'),
			real: img('style-real.jpg'),
			result: img('ai-draft.jpg')
		}
	}

	// 精品纹样预设表：命中关键词直接以馆藏级刺绣图为底稿做风格转换，跳过联网考据
	// 图片走 CDN（img() 助手），不占用小程序主包体积；文件需上传到图床 juyixi 目录
	// imgs 数组：同一景点多张馆藏底稿时随机取一张，增加生成多样性
	const PRESET_PATTERNS = [
		{
			reg: /双龙洞/,
			imgs: [img('3bb3e923696a85d9062c977ecc16d75d.jpg'), img('1f8b4cc3eabd1d291b575c65bee712a5.jpg')],
			name: '金华双龙洞'
		},
		{
			reg: /诸葛八卦村|八卦村/,
			imgs: [img('ea44b07a54335c16d29efe67f45ffc37.jpg'), img('f8445fd8aac9b8b658bad831c00b49db.png')],
			name: '兰溪诸葛八卦村'
		},
		{
			reg: /国际商贸城|义乌商贸城|义务国际商贸城|商贸城/,
			imgs: [
				img('pattern-yiwu.jpg'),
				img('ad8d945e2a1c03221936c5e20b1c1e65.jpg'),
				img('pattern-yiwu-gate.jpg'),
				img('pattern-yiwu-hoop.jpg')
			],
			name: '义乌国际商贸城'
		},
		{ reg: /五金城|永康五金/, img: img('pattern-yongkang.jpg'), name: '永康五金城' },
		{ reg: /万佛塔/, img: img('pattern-wanfota.jpg'), name: '金华万佛塔' },
		{ reg: /板凳龙/, img: img('pattern-bandenglong.jpg'), name: '浦江板凳龙' },
		{ reg: /地下长河|兰溪地下长河/, img: img('024b17304278cdea593312f388dc3abd.jpg'), name: '兰溪地下长河' },
		{ reg: /万丈潭|磐安万丈潭/, img: img('ee9bad1d6921d842d30d004bcb08fec6.png'), name: '磐安万丈潭' },
		{ reg: /仙华山|浦江仙华山/, img: img('b61fdec36c1d2859002adbbd4c8d0a65.png'), name: '浦江仙华山' },
		{ reg: /郭洞|武义郭洞/, img: img('08f462aeee7b277046beea373db0f029.png'), name: '武义郭洞' },
		{ reg: /方岩|永康方岩/, img: img('29e10a6717c5ee592a63141f4e761496.png'), name: '永康方岩' },
		{ reg: /卢宅|东阳卢宅/, img: img('6c2217fe30f2634d23b488041861ad5b.png'), name: '东阳卢宅' },
		{ reg: /秦王宫|横店秦王宫/, img: img('4dd8fc1f387659ba437a161561adae8a.png'), name: '横店秦王宫' },
		{ reg: /古子城|金华古子城/, img: img('pattern-guzicheng.jpg'), name: '金华古子城' }
	]

	// 风格分类与详细介绍：展示在生成结果图下方
	const STYLE_DETAIL = {
		cartoon: { name: 'Q 版卡通', cat: '卡通插画', palette: '高饱和亮色为主，金线少量点缀', compose: '主体放大居中，背景简化留白', desc: '造型夸张可爱、线条圆润、配色明快，绣制后适合挂件、钥匙扣、伴手礼等小件文创。' },
		real: { name: '传统原版', cat: '传统写实', palette: '朱红、藏青、墨绿、赭石、米白', compose: '主体居中偏上，色块分层，四边留白 1:1.5', desc: '缎面针脚细密平齐，色层分明、过渡自然，最大程度还原传统婺绣的质感与光泽。' },
		ink: { name: '水墨写意', cat: '写意水墨', palette: '墨黑、灰阶、淡赭与留白', compose: '虚实相生，留白约占三成，主体偏左', desc: '墨色晕染、虚实相生，以留白与疏密表现东方意境，适合雅致挂画类绣品。' },
		gold: { name: '金线描边', cat: '金线工艺', palette: '深底 + 金线勾边 + 朱红点睛', compose: '主体居中，金线起伏勾边，边饰收口', desc: '金线勾边、主体满绣，光泽华贵典雅，适合礼盒、纪念品类绣品。' }
	}

	// 题材分类规则
	const TOPIC_RULES = [
		{ reg: /龙|狮|凤|麒麟|瑞兽/, cat: '祥瑞神兽' },
		{ reg: /洞|塔|村|宅|城|山|潭|宫|殿|桥|街|建/, cat: '建筑景观' },
		{ reg: /牡丹|莲|梅|兰|菊|竹|花|草/, cat: '花卉草木' },
		{ reg: /鹊|鸟|鹤|蝶|鱼|猫|犬/, cat: '花鸟虫鱼' },
		{ reg: /月|夜|江|云|水|雨|风/, cat: '山水意境' }
	]

	// 题材对应的寓意与核心视觉元素
	const TOPIC_INFO = {
		'祥瑞神兽': { meaning: '祈福纳吉、镇宅守安', elements: '瑞兽身形盘绕、鳞羽与云气穿插' },
		'建筑景观': { meaning: '乡土记忆与人文地标的凝练', elements: '屋脊与檐角线条、对称立面、台阶与水面倒影' },
		'人文景观': { meaning: '地方风物与民俗记忆的凝练', elements: '地标主体轮廓、对称立面与周边环境层次' },
		'花卉草木': { meaning: '富贵和合、生机绵延', elements: '花瓣层叠、枝干穿插、叶脉走势' },
		'花鸟虫鱼': { meaning: '喜乐团圆、生生不息', elements: '禽鸟姿态、翅羽层次、水波与莲叶' },
		'山水意境': { meaning: '山水寄情、宁静致远', elements: '远近山影、江水留白、云雾虚实' },
		'照片定制': { meaning: '一人一图，专属纪念', elements: '主体轮廓、姿态与背景层次' },
		'文字意象': { meaning: '以文入绣，寄托心意', elements: '意象轮廓、文字意涵与画面留白' }
	}

	export default {
		data() {
			return {
				loading: true,
				hideAI: false,
				IMG: defImg(),
				head: {
					cn: '匠心 · 智绘',
					sub: '专属认知空间 · 一人一图，造一件孤品',
					desc: '上传个人照片或输入文字（如婺州古建、喜鹊、牡丹），AI 即可生成符合婺绣审美的刺绣底稿'
				},
				mode: 'photo',
				style: 'cartoon',
				photo: '',
				text: '',
				result: '',
				generating: false,
				deepSearch: true,
				brief: '',
				refPhoto: '',
				presetSrc: '',
				presetUrl: '',
				presetCandidates: [],
				presetName: '',
				hotWords: ['婺州古建', '喜鹊', '牡丹', '婺江月夜', '并蒂莲'],
				flow: ['选图', '生成', '预览', '下单'],
				styles: [
					{ key: 'cartoon', name: 'Q 版卡通', desc: '可爱灵动，适合挂件、伴手礼', price: '简单款免费 · 复杂款 ¥ 69', img: img('style-cartoon.jpg') },
					{ key: 'real', name: '传统原版', desc: '细腻还原，贴近传统婺绣', price: '简单款免费 · 复杂款 ¥ 89', img: img('style-real.jpg') },
					{ key: 'ink', name: '水墨写意', desc: '墨色晕染，东方雅致意境', price: '简单款免费 · 复杂款 ¥ 79', img: img('style-real.jpg') },
					{ key: 'gold', name: '金线描边', desc: '金线勾勒，华贵典雅', price: '简单款免费 · 复杂款 ¥ 99', img: img('style-cartoon.jpg') }
				],
				orderTitle: '一键下单 · 手工绣制',
				orderDesc: '在线预览满意后，一键下单，由第三方工作室手工绣制并邮寄到家。从选图、生成到收件，一机一人，把“买成品”升级为“造孤品”。'
			}
		},
		computed: {
			curStyleName() {
				const s = this.styles.find((x) => x.key === this.style)
				return s ? s.name : ''
			},
			// 生成结果的分类型号档案（与 AI 深度考据同一版式）
			resultMeta() {
				if (!this.result) return null
				const st = STYLE_DETAIL[this.style] || {}
				const topic = this.presetName || (this.mode === 'photo' ? '上传照片' : (this.text || '灵感主题'))
				const hit = TOPIC_RULES.filter((r) => r.reg.test(topic))[0]
				// 命中精品预设的景点名统一归入人文景观，避免「双龙洞」里的「龙」被误判成祥瑞神兽
				const topicCat = this.presetName ? '人文景观' : (hit ? hit.cat : (this.mode === 'photo' ? '照片定制' : '文字意象'))
				const info = TOPIC_INFO[topicCat] || TOPIC_INFO['文字意象']
				return {
					detail: '【分类：' + (st.cat || '婺绣绣稿') + ' · ' + topicCat + '】'
						+ '题材归属：' + (this.presetName ? this.presetName + '（金华·婺州）' : topic) + '；'
						+ '文化寓意：' + info.meaning + '；'
						+ '核心视觉元素：' + info.elements + '；'
						+ '推荐配色：' + (st.palette || '朱红、藏青、赭石为主') + '；'
						+ '刺绣构图：' + (st.compose || '主体居中，四边留白') + '。'
				}
			}
		},
		onLoad() {
			this.fetch()
		},
		methods: {
			async fetch() {
				this.hideAI = await getHideAI()
				const d = await getPage('custom')
				this.loading = false
				if (!d) return
				if (d.images) {
					const next = { ...this.IMG }
					Object.keys(d.images).forEach((k) => { next[k] = img(d.images[k]) })
					this.IMG = next
				}
				if (d.head) this.head = d.head
				if (d.styles) this.styles = d.styles.map((s) => ({ ...s, img: img(s.img) }))
				if (d.hotWords) this.hotWords = d.hotWords
				if (d.flow) this.flow = d.flow
				if (d.orderTitle) this.orderTitle = d.orderTitle
				if (d.orderDesc) this.orderDesc = d.orderDesc
			},
			switchMode(m) {
				this.mode = m
			},
			setStyle(s) {
				this.style = s
			},
			choosePhoto() {
				uni.chooseImage({
					count: 1,
					success: (res) => {
						this.photo = res.tempFilePaths[0]
					}
				})
			},
			pickWord(w) {
				this.text = w
			},
			toggleDeep() {
				this.deepSearch = !this.deepSearch
			},
			generate() {
				if (this.generating) return
				if (this.mode === 'photo' && !this.photo) {
					uni.showToast({ title: '请先上传照片', icon: 'none' })
					return
				}
				if (this.mode === 'text' && !this.text) {
					uni.showToast({ title: '请输入灵感文字', icon: 'none' })
					return
				}
				// 精品纹样预设：以馆藏级刺绣图为内容底稿，仍按所选风格做 AI 风格转换
				if (this.mode === 'text') {
					const hit = PRESET_PATTERNS.find(p => p.reg.test(this.text))
					if (hit) {
						this.brief = ''
						this.refPhoto = ''
						this.presetName = hit.name
						this.generating = true
						// 多张馆藏底稿随机排序，逐张尝试下载，缺图自动跳过换下一张
						const list = hit.imgs ? hit.imgs.slice() : [hit.img]
						for (let i = list.length - 1; i > 0; i--) {
							const j = Math.floor(Math.random() * (i + 1))
							const t = list[i]; list[i] = list[j]; list[j] = t
						}
						console.log('[preset] 候选底稿:', list)
						const first = list[0]
						this.presetSrc = first
						if (/^https?:/.test(first)) {
							// 手机端不下载：downloadFile 受合法域名限制会直接失败，
							// 改为把候选地址整体交给云函数，由云端探测可用的那张
							this.presetUrl = first
							this.presetCandidates = list
						} else {
							// 本地包内图片直接用
							this.presetUrl = ''
							this.presetCandidates = []
						}
						this.doGenerate()
						return
					}
				}
				this.presetSrc = ''
				this.presetUrl = ''
				this.presetCandidates = []
				this.presetName = ''
				this.generating = true
				this.doGenerate()
			},
			async doGenerate() {
				try {
					const canvas = await this.getAICanvas()
					if (!canvas) {
						uni.showToast({ title: '画布初始化失败', icon: 'none' })
						this.generating = false
						return
					}
					let src = this.photo
					// 主题专属短路：双龙洞等直接返回用户上传原图，不调云函数、不调 AI
					const PRESET_THEME_IMGS = {
						'金华双龙洞': [img('3bb3e923696a85d9062c977ecc16d75d.jpg'), img('1f8b4cc3eabd1d291b575c65bee712a5.jpg')]
					}
					if (this.presetName && PRESET_THEME_IMGS[this.presetName]) {
						const pair = PRESET_THEME_IMGS[this.presetName]
						console.log('[custom] 主题专属预设，直接显示原图:', pair.join(' , '))
						// 随机选一张做主图，另一张做参考
						const pickIdx = Math.floor(Math.random() * pair.length)
						src = pair[pickIdx]
						this.refPhoto = pair[1 - pickIdx] || ''
						this.generating = false
						return src
					}
					// 预设图：内容锁定为该景点刺绣底稿，混元仅做所选风格转换
					if (this.presetSrc) {
						try {
							// 有 CDN 地址就直接交给云函数（底稿 3-5MB，不转 base64 才不会被体积限制卡住）
							src = this.presetUrl
								? await this.urlToPattern(this.presetUrl)
								: await this.photoToPattern(this.presetSrc)
						} catch (e) {
							uni.showModal({
								title: 'AI 风格化失败',
								content: String(e && e.message || e && e.errMsg || '未知错误'),
								showCancel: false,
								confirmText: '知道了',
								confirmColor: '#C08A1E'
							})
							this.generating = false
							return
						}
					// 文字模式：AI 真正理解描述语义 → 生成对应图案 → 再绣稿化
					} else if (this.mode === 'text') {
						try {
							src = await this.descToImage(this.text)
						} catch (e) {
							uni.showModal({
								title: 'AI 生成失败',
								content: String(e && e.message || '未知错误'),
								showCancel: false,
								confirmText: '知道了',
								confirmColor: '#C08A1E'
							})
							this.generating = false
							return
						}
						if (!src) {
							uni.showToast({ title: 'AI 生成失败，请重试', icon: 'none' })
							this.generating = false
							return
						}
					} else if (src) {
						// 图生图：上传照片 → 混元按选定风格重绘为婺绣纹样 → 下载 → 再绣稿化
						try {
							src = await this.photoToPattern(src)
						} catch (e) {
							uni.showModal({
								title: 'AI 风格化失败',
								content: String(e && e.message || e && e.errMsg || '未知错误'),
								showCancel: false,
								confirmText: '知道了',
								confirmColor: '#C08A1E'
							})
							this.generating = false
							return
						}
					}
					const resultPath = await generateEmbroidery(canvas, src, this.style)
					if (resultPath) {
						this.result = resultPath
						uni.showToast({ title: '专属底稿已生成', icon: 'success' })
					} else {
						uni.showToast({ title: '生成失败，请重试', icon: 'none' })
					}
				} catch (e) {
					console.error('[custom] generate error', e)
					uni.showModal({
						title: '生成失败',
						content: String(e && e.message || e && e.errMsg || '未知错误'),
						showCancel: false,
						confirmText: '知道了',
						confirmColor: '#C08A1E'
					})
				}
				this.generating = false
			},
			getAICanvas() {
				// #ifdef H5
				// H5 用离屏 canvas，避免 uni canvas 组件的 backing store 尺寸与绘制尺寸不一致导致导出被裁
				return Promise.resolve(document.createElement('canvas'))
				// #endif
				// #ifndef H5
				return new Promise((resolve) => {
					uni.createSelectorQuery()
						.select('#aiCanvas')
						.fields({ node: true, size: true })
						.exec((res) => {
							const canvas = res && res[0] && res[0].node
							resolve(canvas || null)
						})
				})
				// #endif
			},
			// 上传照片 → 压缩转 base64 → 随云函数请求上传（走 request 域名，避开 uploadFile 白名单）→ 按风格重绘 → 下载
			photoToPattern(filePath) {
				return imageToBase64(filePath).then((b64) => new Promise((resolve, reject) => {
					uniCloud.callFunction({
						name: 'wy-ai',
						data: { action: 'genPattern', text: '', style: this.style, imageBase64: b64 },
						timeout: 180000,
						success: (res) => {
							const r = (res && res.result) || {}
							if (r.code === 0 && r.data && r.data.url) {
								uni.downloadFile({
									url: r.data.url,
									timeout: 60000,
									success: (d) => {
										if (d.statusCode === 200 && d.tempFilePath) resolve(d.tempFilePath)
										else reject(new Error('图片下载失败 status=' + d.statusCode))
									},
									fail: (e) => reject(new Error('图片下载失败：' + ((e && e.errMsg) || '网络错误')))
								})
							} else {
								reject(new Error(r.msg || ('云函数返回异常 code=' + r.code)))
							}
						},
						fail: (err) => reject(new Error((err && err.errMsg) || '云函数调用失败'))
					})
				}))
			},
			// 预设底稿（CDN 地址）→ 云函数直传参考图 → 返回风格化图片 → 本地下载
			// 走 URL 而不是 base64：底稿单张 3-5MB，压到 1.3MB 以下会糊掉刺绣细节
			urlToPattern(refUrl) {
				return new Promise((resolve, reject) => {
					uniCloud.callFunction({
						name: 'wy-ai',
						data: { action: 'genPattern', text: this.text || this.presetName || '', style: this.style, refImageUrl: refUrl, refImageUrls: this.presetCandidates },
						timeout: 180000,
						success: (res) => {
							const r = (res && res.result) || {}
							if (r.code === 0 && r.data && r.data.url) {
								uni.downloadFile({
									url: r.data.url,
									timeout: 60000,
									success: (d) => {
										if (d.statusCode === 200 && d.tempFilePath) resolve(d.tempFilePath)
										else reject(new Error('图片下载失败 status=' + d.statusCode))
									},
									fail: (e) => reject(new Error('图片下载失败：' + ((e && e.errMsg) || '网络错误')))
								})
							} else {
								reject(new Error(r.msg || ('云函数返回异常 code=' + r.code)))
							}
						},
						fail: (err) => reject(new Error((err && err.errMsg) || '云函数调用失败'))
					})
				})
			},
			// 文字描述 → 云函数 wy-ai（可选联网深度考据）调混元出图 → 返回图片 URL → 客户端下载
			descToImage(text) {
				this.brief = ''
				this.refPhoto = ''
				return new Promise((resolve, reject) => {
					uniCloud.callFunction({
						name: 'wy-ai',
						data: { action: 'genPattern', text, style: this.style, deepSearch: this.deepSearch },
						timeout: 180000,
						success: (res) => {
							const r = (res && res.result) || {}
							if (r.code === 0 && r.data && r.data.url) {
								console.log('[custom] AI 提示词:', r.data.prompt)
								if (r.data.brief) this.brief = r.data.brief
								if (r.data.refPhoto) this.refPhoto = r.data.refPhoto
								// 联网考据失败：明确告知已降级，不再静默
								if (r.data.researchFailed) {
									uni.showModal({
										title: '联网考据失败',
										content: '已降级为直接生成（不联网）。原因：' + (r.data.researchError || '未知')
											+ '。可到智谱开放平台确认 web_search 服务已开通。',
										showCancel: false,
										confirmText: '知道了',
										confirmColor: '#C08A1E'
									})
								} else if (this.deepSearch && r.data.category === 'A' && !r.data.refPhoto) {
									// A 类但没拿到实景图
									uni.showToast({
										title: r.data.photoSearchSkipped || '未找到实景参考图，已按考据文字生成',
										icon: 'none',
										duration: 3000
									})
								}
								uni.downloadFile({
									url: r.data.url,
									timeout: 60000,
									success: (d) => {
										if (d.statusCode === 200 && d.tempFilePath) resolve(d.tempFilePath)
										else reject(new Error('图片下载失败 status=' + d.statusCode))
									},
									fail: (e) => reject(new Error('图片下载失败：' + ((e && e.errMsg) || '网络错误')))
								})
							} else {
								console.warn('[custom] AI 生成失败:', r)
								reject(new Error(r.msg || ('云函数返回异常 code=' + r.code)))
							}
						},
						fail: (err) => {
							console.warn('[custom] 云函数 wy-ai 调用失败', err)
							reject(new Error((err && err.errMsg) || '云函数调用失败'))
						}
					})
				})
			},
			previewResult() {
				if (!this.result || this.generating) return
				uni.previewImage({
					urls: [this.result],
					current: this.result
				})
			},
			previewRef() {
				if (!this.refPhoto) return
				uni.previewImage({
					urls: [this.refPhoto],
					current: this.refPhoto
				})
			},
			importToDIY() {
				if (!this.result) return
				const app = getApp()
				app.globalData = app.globalData || {}
				const src = this.result
				const pass = (p) => {
					app.globalData.customImportPattern = p
					uni.showToast({ title: '底稿已导入，前往DIY编辑', icon: 'none' })
					setTimeout(() => {
						uni.navigateTo({ url: '/pages/diy/diy' })
					}, 600)
				}
				// 小程序端画布导出的是本地临时路径（wxfile://、http://tmp/），H5 是 data:，
				// 均无需下载直接传给 DIY；仅云端 URL 需先下载到本地临时文件
				const isLocal = /^(wxfile|data:|file:|\/)/.test(src) || /^https?:\/\/tmp\//.test(src)
				if (isLocal) {
					pass(src)
					return
				}
				uni.downloadFile({
					url: src,
					timeout: 30000,
					success: (d) => {
						if (d.statusCode === 200 && d.tempFilePath) {
							pass(d.tempFilePath)
						} else {
							uni.showToast({ title: '底稿下载失败', icon: 'none' })
						}
					},
					fail: () => {
						uni.showToast({ title: '底稿下载失败', icon: 'none' })
					}
				})
			},
			exportDraft() {
				if (!this.result) return
				const app = getApp()
				app.globalData = app.globalData || {}
				app.globalData.exportPattern = this.result
				// dataURL 体积大，不进 URL 参数（会超出 navigateTo 长度限制），统一走 globalData
				const q = /^https?:\/\//.test(this.result) ? '?src=' + encodeURIComponent(this.result) : ''
				uni.navigateTo({
					url: '/pages/pattern-export/pattern-export' + q
				})
			},
			order() {
				if (!this.result) {
					uni.showToast({ title: '请先生成绣稿', icon: 'none' })
					return
				}
				const s = this.styles.find((x) => x.key === this.style) || {}
				const q = [
					'from=custom',
					'title=' + encodeURIComponent('匠心·智绘 · ' + (s.name || '专属') + '婺绣定制'),
					'price=' + encodeURIComponent('69'),
					'spec=' + encodeURIComponent((s.name || '专属绣稿') + ' · 手工绣制，复杂款按工时计价'),
					'img=' + encodeURIComponent(s.img || ''),
					'qty=1'
				].join('&')
				uni.navigateTo({ url: '/pages/order-confirm/order-confirm?' + q })
			}
		}
	}
</script>

<style>
	/* 标题 */
	.title-block {
		padding: 20rpx 0 4rpx;
	}

	.title-cn {
		display: block;
		font-size: 76rpx;
		letter-spacing: 10rpx;
	}

	.title-sub {
		display: block;
		margin-top: 10rpx;
		font-size: 26rpx;
		letter-spacing: 3rpx;
		color: var(--wy-txt-2);
	}

	/* 分段控件 */
	.seg {
		display: flex;
		margin-top: 28rpx;
		padding: 8rpx;
		border-radius: 999rpx;
		border: 1rpx solid var(--wy-line);
		background-color: rgba(212, 175, 55, 0.06);
	}

	.seg-item {
		flex: 1;
		height: 76rpx;
		line-height: 76rpx;
		text-align: center;
		font-size: 28rpx;
		color: var(--wy-txt-2);
		border-radius: 999rpx;
	}

	.seg-on {
		color: #2A1C08;
		font-weight: 600;
		background-image: linear-gradient(135deg, #F6E6AE, #D4AF37 60%, #C99A3B);
	}

	/* 上传 */
	.upload-box {
		margin-top: 26rpx;
		height: 360rpx;
		border-radius: 20rpx;
		border: 2rpx dashed rgba(212, 175, 55, 0.4);
		background-color: rgba(212, 175, 55, 0.04);
		overflow: hidden;
	}

	.upload-img {
		width: 100%;
		height: 360rpx;
	}

	.upload-empty {
		height: 360rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.upload-plus {
		position: relative;
		width: 70rpx;
		height: 70rpx;
	}

	.upload-plus::before,
	.upload-plus::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		background-color: var(--wy-gold);
		border-radius: 4rpx;
	}

	.upload-plus::before {
		width: 46rpx;
		height: 3rpx;
		margin: -1rpx 0 0 -23rpx;
	}

	.upload-plus::after {
		width: 3rpx;
		height: 46rpx;
		margin: -23rpx 0 0 -1rpx;
	}

	.upload-tip {
		margin-top: 18rpx;
		font-size: 28rpx;
		color: var(--wy-gold-lt);
	}

	.upload-hint {
		margin-top: 10rpx;
		font-size: 23rpx;
		color: var(--wy-txt-2);
	}

	/* 文字输入 */
	.text-box {
		margin-top: 26rpx;
	}

	.text-area {
		width: 100%;
		height: 220rpx;
		box-sizing: border-box;
		padding: 24rpx;
		font-size: 27rpx;
		line-height: 42rpx;
		color: var(--wy-txt);
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.ta-ph {
		color: #6E6152;
		font-size: 26rpx;
	}

	.hot-words {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		margin-top: 18rpx;
	}

	.hot-label {
		font-size: 23rpx;
		color: var(--wy-txt-2);
	}

	.hot-word {
		margin: 8rpx 14rpx 8rpx 0;
		padding: 8rpx 20rpx;
		font-size: 23rpx;
		color: var(--wy-gold-lt);
		border: 1rpx solid var(--wy-line);
		border-radius: 999rpx;
	}

	/* 深度考据开关 */
	.deep-row {
		display: flex;
		align-items: center;
		margin-top: 16rpx;
	}

	.deep-check {
		width: 36rpx;
		height: 36rpx;
		flex-shrink: 0;
		line-height: 36rpx;
		text-align: center;
		font-size: 22rpx;
		color: #2A1C08;
		border-radius: 8rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.deep-check.on {
		border-color: var(--wy-gold);
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
	}

	.deep-label {
		margin-left: 14rpx;
		font-size: 24rpx;
		color: var(--wy-txt-2);
	}

	/* AI 深度考据简报 */
	.brief-card {
		margin-top: 20rpx;
		padding: 24rpx 26rpx;
		border-radius: 18rpx;
		border: 1rpx dashed rgba(160, 120, 40, 0.35);
		background-color: rgba(200, 154, 59, 0.06);
	}

	.brief-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brief-title {
		font-size: 28rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.brief-txt {
		display: block;
		margin-top: 14rpx;
		font-size: 25rpx;
		line-height: 42rpx;
		color: var(--wy-txt-2);
	}

	/* 实景参考图卡片 */
	.ref-card {
		margin-top: 20rpx;
	}
	.ref-img {
		width: 100%;
		border-radius: 12rpx;
		margin-top: 12rpx;
	}
	.ref-tip {
		display: block;
		font-size: 20rpx;
		color: #9C8B78;
		margin-top: 10rpx;
	}

	/* 风格 */
	.style-list {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		margin-top: 28rpx;
	}

	.style-card {
		width: 335rpx;
		box-sizing: border-box;
		padding: 14rpx;
		margin-bottom: 22rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.style-on {
		border-color: var(--wy-gold);
		box-shadow: 0 0 0 2rpx rgba(200, 154, 59, 0.45), 0 8rpx 24rpx rgba(120, 90, 40, 0.16);
	}

	.style-img {
		width: 100%;
		height: 240rpx;
		border-radius: 14rpx;
	}

	.style-name {
		display: block;
		margin-top: 16rpx;
		font-size: 30rpx;
		color: var(--wy-txt);
		letter-spacing: 2rpx;
	}

	.style-desc {
		display: block;
		margin-top: 6rpx;
		font-size: 22rpx;
		color: var(--wy-txt-2);
	}

	.style-price {
		display: block;
		margin-top: 10rpx;
		font-size: 23rpx;
		line-height: 34rpx;
		font-weight: 600;
		color: var(--wy-gold-dk);
	}

	/* 结果 */
	.result-box {
		position: relative;
		margin-top: 28rpx;
		min-height: 240rpx;
	}

	.result-img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 14rpx;
	}

	.result-mask {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: rgba(14, 11, 10, 0.78);
	}

	.spin {
		width: 66rpx;
		height: 66rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(212, 175, 55, 0.25);
		border-top-color: var(--wy-gold);
		animation: wy-spin 0.9s linear infinite;
	}

	@keyframes wy-spin {
		to {
			transform: rotate(360deg);
		}
	}

	.spin-txt {
		margin-top: 24rpx;
		font-size: 26rpx;
		color: #F1D98F;
	}

	.result-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 22rpx 26rpx;
	}

	.result-label-txt {
		font-size: 24rpx;
		color: var(--wy-txt-2);
	}

	.gen-btn {
		display: block;
		margin-top: 28rpx;
		text-align: center;
	}

	/* 流程条 */
	.flow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx 24rpx;
		border-radius: 20rpx;
		border: 1rpx solid var(--wy-line);
		background-color: var(--wy-card);
	}

	.flow-item {
		display: flex;
		align-items: center;
	}

	.flow-no {
		width: 44rpx;
		height: 44rpx;
		line-height: 44rpx;
		text-align: center;
		font-size: 24rpx;
		color: #2A1C08;
		border-radius: 50%;
		background-image: linear-gradient(135deg, #F6E6AE, #C99A3B);
	}

	.flow-name {
		margin-left: 12rpx;
		font-size: 27rpx;
		color: var(--wy-txt);
	}

	.flow-arrow {
		margin: 0 8rpx 0 18rpx;
		font-size: 32rpx;
		color: rgba(138, 101, 22, 0.5);
	}

	/* 下单 */
	.order-card {
		padding: 34rpx 30rpx;
		border-radius: 22rpx;
		border: 1rpx solid var(--wy-line);
		background-image: linear-gradient(135deg, rgba(200, 16, 46, 0.14), rgba(214, 197, 166, 0.5));
	}

	.order-title {
		display: block;
		font-size: 34rpx;
		color: var(--wy-gold-lt);
		letter-spacing: 2rpx;
	}

	.order-desc {
		display: block;
		margin-top: 16rpx;
		font-size: 26rpx;
		line-height: 44rpx;
		color: var(--wy-txt-2);
	}

	.order-btn {
		display: block;
		margin-top: 30rpx;
		text-align: center;
	}

	/* 生成按钮行 */
	.gen-row {
		display: flex;
		gap: 20rpx;
		margin-top: 28rpx;
	}
	.gen-row .gen-btn {
		flex: 1;
		margin-top: 0;
	}

	/* 离屏画布（移出可视区） */
	.ai-canvas {
		position: fixed;
		left: -9999rpx;
		top: -9999rpx;
		width: 360px;
		height: 360px;
	}
</style>
