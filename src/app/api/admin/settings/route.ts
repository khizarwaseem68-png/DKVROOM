import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth/auth-utils'
import { apiResponse, apiError } from '@/lib/security/middleware'
import { resetProvider } from '@/lib/upload/registry'

export async function GET() {
  try {
    const setting = await db.platformSetting.findUnique({
      where: { key: 'upload_provider' },
    })

    return apiResponse({
      uploadProvider: setting?.value || process.env.UPLOAD_PROVIDER || 'cloudinary',
    })
  } catch (error) {
    console.error('[SETTINGS_GET_ERROR]', error)
    return apiError('Failed to fetch settings', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return apiError('Unauthorized', 401)
    }

    const body = await request.json()
    const { uploadProvider } = body as { uploadProvider?: string }

    if (uploadProvider && !['cloudinary', 'filesystem'].includes(uploadProvider)) {
      return apiError('Invalid provider. Must be "cloudinary" or "filesystem".', 400)
    }

    if (uploadProvider) {
      await db.platformSetting.upsert({
        where: { key: 'upload_provider' },
        update: { value: uploadProvider },
        create: { key: 'upload_provider', value: uploadProvider },
      })

      resetProvider()
    }

    return apiResponse({ success: true, uploadProvider })
  } catch (error) {
    console.error('[SETTINGS_PUT_ERROR]', error)
    return apiError('Failed to update settings', 500)
  }
}
