import { NextRequest } from 'next/server'
import { getUserFromRequest, requireRole } from '@/lib/auth/auth-utils'
import { rateLimit, sanitizeInput, apiResponse, apiError } from '@/lib/security/middleware'
import { db } from '@/lib/db'

// GET /api/loans/[id] - Single loan detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { id } = await params

  const loan = await db.loanApplication.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, whatsapp: true, address: true, icNumber: true } },
      car: { select: { id: true, brand: true, model: true, year: true, photos: true, price: true } },
      dealer: { select: { id: true, companyName: true, phone: true, whatsapp: true } },
    }
  })

  if (!loan) return apiError('Loan application not found', 404)

  // Authorization check
  if (user.role === 'customer' && loan.userId !== user.id) {
    return apiError('Forbidden', 403)
  }
  if (user.role === 'dealer' && user.dealer && loan.dealerId !== user.dealer.id) {
    return apiError('Forbidden', 403)
  }

  return apiResponse({ success: true, data: loan })
}

// PUT /api/loans/[id] - Update loan status (admin can approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateCheck = rateLimit(request)
  if (!rateCheck.allowed) return apiError('Too many requests', 429)

  const user = await getUserFromRequest(request)
  if (!user) return apiError('Unauthorized', 401)

  const { id } = await params

  const loan = await db.loanApplication.findUnique({
    where: { id },
    include: { car: true, user: true }
  })

  if (!loan) return apiError('Loan application not found', 404)

  // Customer can update their own loan documents
  if (user.role === 'customer' && loan.userId === user.id) {
    const body = await request.json()
    const allowedFields = ['documents', 'payslipUrls', 'bankStatementUrls', 'epfStatementUrl']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = typeof body[field] === 'string' ? sanitizeInput(body[field]) : JSON.stringify(body[field])
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update', 400)
    }

    // Update status to reviewing if documents are being uploaded
    if (loan.status === 'pending' && Object.keys(updateData).length > 0) {
      updateData.status = 'reviewing'
    }

    const updatedLoan = await db.loanApplication.update({
      where: { id },
      data: updateData,
    })

    return apiResponse({ success: true, data: updatedLoan })
  }

  // Admin can approve/reject
  if (requireRole(user, ['admin'])) {
    const body = await request.json()
    const { status, approvedAmount, approvedTenure, interestRate, monthlyRepayment, rejectionReason, bankName, bankResponse } = body

    if (!status || !['approved', 'rejected', 'reviewing', 'disbursed'].includes(status)) {
      return apiError('Invalid status', 400)
    }

    if (status === 'rejected' && !rejectionReason) {
      return apiError('Rejection reason is required', 400)
    }

    const updateData: any = {
      status,
      reviewedAt: new Date(),
      reviewedBy: user.id,
    }

    if (status === 'approved') {
      updateData.approvedAmount = approvedAmount ? parseFloat(String(approvedAmount)) : loan.amount
      updateData.approvedTenure = approvedTenure ? parseInt(String(approvedTenure)) : loan.tenure
      updateData.interestRate = interestRate ? parseFloat(String(interestRate)) : null
      updateData.monthlyRepayment = monthlyRepayment ? parseFloat(String(monthlyRepayment)) : null
      updateData.bankName = bankName ? sanitizeInput(bankName) : null
      updateData.bankResponse = bankResponse ? sanitizeInput(bankResponse) : null
    }

    if (status === 'rejected') {
      updateData.rejectionReason = sanitizeInput(rejectionReason)
    }

    const updatedLoan = await db.loanApplication.update({
      where: { id },
      data: updateData,
    })

    // Notify customer
    const notificationType = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
    const notificationMessage = status === 'approved'
      ? `Your loan application has been approved!${updateData.approvedAmount ? ` Approved amount: RM${updateData.approvedAmount}` : ''}`
      : status === 'rejected'
        ? `Your loan application has been rejected. Reason: ${rejectionReason}`
        : `Your loan application is now under review.`

    await db.notification.create({
      data: {
        userId: loan.userId,
        title: `Loan Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: notificationMessage,
        type: notificationType,
        link: `/loans/${id}`,
      }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: `loan_${status}`,
        resource: 'loanApplication',
        resourceId: id,
        details: JSON.stringify({ status, approvedAmount: updateData.approvedAmount, rejectionReason }),
        severity: status === 'rejected' ? 'warning' : 'info',
      }
    })

    return apiResponse({ success: true, data: updatedLoan })
  }

  return apiError('Forbidden', 403)
}
