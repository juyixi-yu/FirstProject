/**
 * 绣韵焕兴 · 默认商品数据
 * 与商城页（mall.vue）本地默认商品保持一致，供「我的收藏」「商品详情」等页面复用。
 * 后续接入云数据库后，可替换为云端拉取。
 */
import { img } from './cloud'

export const DEFAULT_PRODUCTS = [
	{ id: 'sachet', name: '婺绣香囊', desc: '手工刺绣，随身纳福', price: '¥ 88 起', img: img('product-sachet.jpg') },
	{ id: 'scarf', name: '婺绣丝巾', desc: '一方丝巾，婉约国风', price: '¥ 128 起', img: img('product-scarf.jpg') },
	{ id: 'pillow', name: '婺绣枕巾', desc: '刺绣枕巾，安眠婺韵', price: '¥ 98 起', img: img('product-pillow.jpg') },
	{ id: 'wuju-mask', name: '婺剧脸谱摆件', desc: '勾脸成谱，婺剧风华', price: '¥ 118 起', img: img('product-wuju-mask.jpg') },
	{ id: 'pendant', name: 'NFC 投影挂件', desc: '碰一碰弹出 AR 影像与婺绣故事', price: '¥ 168 起', img: img('product-pendant.jpg') },
	{ id: 'bookmark', name: '婺绣书签', desc: '一枚书签，案头婺韵', price: '¥ 36 起', img: img('product-bookmark.jpg') },
	{ id: 'coaster', name: '婺绣杯垫', desc: '绣纹杯垫，茶席生香', price: '¥ 46 起', img: img('product-coaster.jpg') }
]

export function getProductById(id) {
	return DEFAULT_PRODUCTS.find((p) => p.id === id) || null
}
