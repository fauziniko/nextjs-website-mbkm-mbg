import * as Minio from 'minio'

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '443'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
})

const BUCKET = process.env.MINIO_BUCKET_NAME || 'mbkm-public-assets'

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const objectName = `mbg/${Date.now()}-${fileName}`
  
  await minioClient.putObject(BUCKET, objectName, file, file.length, {
    'Content-Type': contentType,
  })

  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
  const endpoint = process.env.MINIO_ENDPOINT
  return `${protocol}://${endpoint}/${BUCKET}/${objectName}`
}

export async function deleteFile(objectName: string): Promise<void> {
  await minioClient.removeObject(BUCKET, objectName)
}

export { minioClient, BUCKET }
