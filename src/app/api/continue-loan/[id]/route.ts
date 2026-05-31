import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'
import { saveFile, validateFile } from '@/lib/file-upload'

const DOC_CATEGORIES: Record<string, { maxSizeMB: number; allowedMimes: string[]; dbField: string; subfolder: string }> = {
  customerIc: { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], dbField: 'customerIcUrl', subfolder: 'ic' },
  customerLicense: { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], dbField: 'customerLicenseUrl', subfolder: 'license' },
  paymentReceipt: { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], dbField: 'paymentReceiptUrl', subfolder: 'receipts' },
  policeReport: { maxSizeMB: 10, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], dbField: 'policeReportUrl', subfolder: 'documents' },
  agreementDoc: { maxSizeMB: 10, allowedMimes: ['application/pdf', 'image/jpeg', 'image/png'], dbField: 'agreementDocUrl', subfolder: 'agreements' },
  ownerIc: { maxSizeMB: 5, allowedMimes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], dbField: 'ownerIcUrl', subfolder: 'ic' },
  ownerAgreement: { maxSizeMB: 10, allowedMimes: ['application/pdf', 'image/jpeg', 'image/png'], dbField: 'ownerAgreementUrl', subfolder: 'agreements' },
}

// GET /api/continue-loan/[id] - Single enquiry detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { id } = await params

  const enquiry = await db.continueLoanEnquiry.findUnique({
    where: { id },
    include: {
      car: {
        select: {
          id: true, brand: true, model: true, year: true, photos: true,
          price: true, monthlyInstallment: true, remainingMonths: true,
          remainingBalance: true, takeoverAmount: true, bankName: true,
          vehicleCondition: true, requiredDocs: true,
        }
      },
      customer: { select: { id: true, name: true, email: true, phone: true, whatsapp: true, icNumber: true } },
      dealer: { select: { id: true, companyName: true, phone: true, whatsapp: true, address: true, city: true, state: true } },
      payments: true,
    }
  })

  if (!enquiry) return apiError('Enquiry not found', 404)

  // Authorization check
  if (user.role === 'customer' && enquiry.customerId !== user.id) {
    return apiError('Forbidden', 403)
  }
  if (user.role === 'dealer' && user.dealer && enquiry.dealerId !== user.dealer.id) {
    return apiError('Forbidden', 403)
  }

  return apiResponse({ success: true, data: enquiry })
}

// PUT /api/continue-loan/[id] - Update enquiry (upload documents, change status)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { id } = await params

  const enquiry = await db.continueLoanEnquiry.findUnique({
    where: { id },
    include: { car: true }
  })

  if (!enquiry) return apiError('Enquiry not found', 404)

  const contentType = request.headers.get('content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')

  let body: Record<string, any> = {}
  const uploadedFiles: Array<{ key: string; file: File }> = []

  if (isMultipart) {
    const formData = await request.formData()
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        if (DOC_CATEGORIES[key]) {
          uploadedFiles.push({ key, file: value })
        }
      } else {
        body[key] = value
      }
    }
  } else {
    body = await request.json()
  }

  // Customer: Upload documents
  if (user.role === 'customer') {
    if (enquiry.customerId !== user.id) return apiError('Forbidden', 403)

    const updateData: any = {}
    const dbFieldKeys = ['customerIcUrl', 'customerLicenseUrl', 'paymentReceiptUrl', 'policeReportUrl', 'agreementDocUrl']

    // File fields that map to DB
    const fileDbMap: Record<string, string> = {}
    for (const [key, cfg] of Object.entries(DOC_CATEGORIES)) {
      if (dbFieldKeys.includes(cfg.dbField)) {
        fileDbMap[key] = cfg.dbField
      }
    }

    // Validate files before DB
    for (const { key, file } of uploadedFiles) {
      const cfg = DOC_CATEGORIES[key]
      if (!cfg || !fileDbMap[key]) {
        return apiError(`Invalid file field: ${key}`, 400)
      }
      const err = validateFile(file, cfg.maxSizeMB, cfg.allowedMimes)
      if (err) return apiError(`${key}: ${err}`, 400)
      // Will save after DB update
    }

    // Text fields from body
    for (const field of dbFieldKeys) {
      if (body[field] !== undefined) {
        updateData[field] = sanitizeInput(body[field])
      }
    }

    // Customer can also update agreement status to certain values
    if (body.agreementStatus) {
      const customerAllowedStatuses = ['agreement_signed']
      if (customerAllowedStatuses.includes(body.agreementStatus)) {
        updateData.agreementStatus = body.agreementStatus
      } else {
        return apiError('Invalid agreement status for customer', 400)
      }
    }

    const hasUpdates = Object.keys(updateData).length > 0 || uploadedFiles.length > 0

    if (!hasUpdates) {
      return apiError('No valid fields to update', 400)
    }

    // Update DB first
    const updatedEnquiry = await db.continueLoanEnquiry.update({
      where: { id },
      data: updateData,
    })

    // Save files after DB update succeeds
    for (const { key, file } of uploadedFiles) {
      try {
        const cfg = DOC_CATEGORIES[key]
        const url = await saveFile(file, cfg.subfolder, `continue_loan_${id}`)
        await db.continueLoanEnquiry.update({
          where: { id },
          data: { [cfg.dbField]: url },
        })
      } catch {
        // File save failed but DB is already updated
      }
    }

    // Fetch fresh data after file saves
    const finalEnquiry = await db.continueLoanEnquiry.findUnique({ where: { id } })

    // Notify dealer of document upload
    if (Object.keys(updateData).some(k => k !== 'agreementStatus')) {
      const dealer = await db.dealer.findUnique({ where: { id: enquiry.dealerId } })
      if (dealer) {
        await db.notification.create({
          data: {
            userId: dealer.userId,
            title: 'Documents Uploaded',
            message: `Customer has uploaded documents for continue loan enquiry on ${enquiry.car.brand} ${enquiry.car.model}`,
            type: 'info',
            link: `/continue-loan/${id}`,
          }
        })
      }
    }

    return apiResponse({ success: true, data: finalEnquiry || updatedEnquiry })
  }

  // Dealer: Upload owner documents and send agreement
  if (user.role === 'dealer' && user.dealer) {
    if (enquiry.dealerId !== user.dealer.id) return apiError('Forbidden', 403)

    const updateData: any = {}
    const dbFieldKeys = ['ownerIcUrl', 'ownerAgreementUrl']

    // File fields that map to DB
    const fileDbMap: Record<string, string> = {}
    for (const [key, cfg] of Object.entries(DOC_CATEGORIES)) {
      if (dbFieldKeys.includes(cfg.dbField)) {
        fileDbMap[key] = cfg.dbField
      }
    }

    // Validate files before DB
    for (const { key, file } of uploadedFiles) {
      const cfg = DOC_CATEGORIES[key]
      if (!cfg || !fileDbMap[key]) {
        return apiError(`Invalid file field: ${key}`, 400)
      }
      const err = validateFile(file, cfg.maxSizeMB, cfg.allowedMimes)
      if (err) return apiError(`${key}: ${err}`, 400)
    }

    // Text fields from body
    for (const field of dbFieldKeys) {
      if (body[field] !== undefined) {
        updateData[field] = sanitizeInput(body[field])
      }
    }

    // Dealer can send agreement
    if (body.agreementStatus) {
      const dealerAllowedStatuses = ['agreement_sent', 'deposit_paid', 'handover_complete', 'completed']
      if (dealerAllowedStatuses.includes(body.agreementStatus)) {
        updateData.agreementStatus = body.agreementStatus
      } else {
        return apiError('Invalid agreement status for dealer', 400)
      }
    }

    const hasUpdates = Object.keys(updateData).length > 0 || uploadedFiles.length > 0

    if (!hasUpdates) {
      return apiError('No valid fields to update', 400)
    }

    // Update DB first
    const updatedEnquiry = await db.continueLoanEnquiry.update({
      where: { id },
      data: updateData,
    })

    // Save files after DB update succeeds
    for (const { key, file } of uploadedFiles) {
      try {
        const cfg = DOC_CATEGORIES[key]
        const url = await saveFile(file, cfg.subfolder, `continue_loan_${id}`)
        await db.continueLoanEnquiry.update({
          where: { id },
          data: { [cfg.dbField]: url },
        })
      } catch {
        // File save failed but DB is already updated
      }
    }

    // Fetch fresh data after file saves
    const finalEnquiry = await db.continueLoanEnquiry.findUnique({ where: { id } })

    // Notify customer of agreement sent or status change
    if (body.agreementStatus === 'agreement_sent') {
      await db.notification.create({
        data: {
          userId: enquiry.customerId,
          title: 'Agreement Sent',
          message: `The dealer has sent the agreement for ${enquiry.car.brand} ${enquiry.car.model}. Please review and sign.`,
          type: 'info',
          link: `/continue-loan/${id}`,
        }
      })
    }

    return apiResponse({ success: true, data: finalEnquiry || updatedEnquiry })
  }

  // Admin: Verify and unlock contact
  if (requireRole(user, ['admin'])) {
    const updateData: any = {}

    if (body.contactUnlocked === true) {
      updateData.contactUnlocked = true
      updateData.unlockedAt = new Date()
    }

    if (body.agreementStatus) {
      updateData.agreementStatus = body.agreementStatus
    }

    if (body.notes) {
      updateData.notes = sanitizeInput(body.notes)
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update', 400)
    }

    const updatedEnquiry = await db.continueLoanEnquiry.update({
      where: { id },
      data: updateData,
    })

    // Notify customer and dealer if contact unlocked
    if (body.contactUnlocked === true) {
      await db.notification.create({
        data: {
          userId: enquiry.customerId,
          title: 'Contact Details Unlocked',
          message: `Contact details have been unlocked for ${enquiry.car.brand} ${enquiry.car.model}. You can now contact the dealer directly.`,
          type: 'success',
          link: `/continue-loan/${id}`,
        }
      })

      const dealer = await db.dealer.findUnique({ where: { id: enquiry.dealerId } })
      if (dealer) {
        await db.notification.create({
          data: {
            userId: dealer.userId,
            title: 'Contact Details Unlocked',
            message: `Contact details unlocked for continue loan enquiry on ${enquiry.car.brand} ${enquiry.car.model}.`,
            type: 'success',
            link: `/continue-loan/${id}`,
          }
        })
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'continue_loan_updated',
        resource: 'continueLoanEnquiry',
        resourceId: id,
        details: JSON.stringify(updateData),
        severity: 'info',
      }
    })

    return apiResponse({ success: true, data: updatedEnquiry })
  }

  return apiError('Forbidden', 403)
}
