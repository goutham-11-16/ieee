export const compressImage = async (file: File, options?: {
    maxSizeMB?: number
    maxWidthOrHeight?: number
}): Promise<File> => {
    const { maxSizeMB = 0.1, maxWidthOrHeight = 1000 } = options || {}

    // If the file is already smaller than the max size, return it as is
    if (file.size / 1024 / 1024 < maxSizeMB) {
        return file
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (event) => {
            const img = new Image()
            img.src = event.target?.result as string
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height = Math.round((height * maxWidthOrHeight) / width)
                        width = maxWidthOrHeight
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width = Math.round((width * maxWidthOrHeight) / height)
                        height = maxWidthOrHeight
                    }
                }

                canvas.width = width
                canvas.height = height

                if (ctx) {
                    // Fill background with white to prevent transparent PNGs from turning black in JPEG
                    ctx.fillStyle = '#FFFFFF'
                    ctx.fillRect(0, 0, width, height)
                    ctx.drawImage(img, 0, 0, width, height)
                }

                let quality = 0.7
                const compressToSize = () => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Canvas to Blob failed'))
                                return
                            }

                            if (blob.size / 1024 / 1024 > maxSizeMB && quality > 0.1) {
                                quality -= 0.1
                                compressToSize() // Recursive call to compress further
                            } else {
                                const baseName = file.name.replace(/\.[^/.]+$/, "")
                                const newFileName = baseName ? `${baseName}.jpg` : 'image.jpg'
                                const newFile = new File([blob], newFileName, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                })
                                resolve(newFile)
                            }
                        },
                        'image/jpeg',
                        quality
                    )
                }
                compressToSize()
            }
            img.onerror = (error) => reject(error)
        }
        reader.onerror = (error) => reject(error)
    })
}
