/**
 * 本地图片 → base64（不含 data: 前缀），供 wy-ai 云函数图生图使用。
 * H5 端：canvas 按原图尺寸绘制后用 JPEG 质量压缩导出；
 * 其他端：先 uni.compressImage 做质量压缩，压缩失败时退回原图再读。
 * 注意：不再对上传尺寸做硬拦截（b64.length 检查已移除），
 * 仅通过 JPEG 质量压缩控制体积，质量参数默认 0.4 可按需在调用处传入。
 */
export function imageToBase64(path, quality = 0.4) {
	// #ifdef H5
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => {
			try {
				const w = img.width
				const h = img.height
				const canvas = document.createElement('canvas')
				canvas.width = w
				canvas.height = h
				canvas.getContext('2d').drawImage(img, 0, 0, w, h)
				resolve(canvas.toDataURL('image/jpeg', quality).replace(/^data:[^,]*,/, ''))
			} catch (e) {
				reject(new Error('照片读取失败：' + ((e && e.message) || e)))
			}
		}
		img.onerror = () => reject(new Error('照片读取失败'))
		img.src = path
	})
	// #endif
	// #ifndef H5
	return new Promise((resolve, reject) => {
		const read = (filePath) => {
			uni.getFileSystemManager().readFile({
				filePath,
				encoding: 'base64',
				success: (f) => resolve(f.data),
				fail: (e) => reject(new Error('照片读取失败：' + ((e && e.errMsg) || '')))
			})
		}
		uni.compressImage({
			src: path,
			quality: Math.round(quality * 100),
			success: (c) => read(c.tempFilePath),
			fail: () => read(path)
		})
	})
	// #endif
}
