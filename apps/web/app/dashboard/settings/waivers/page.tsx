import { requireOperator } from '@/lib/security/auth'
import { generateTemplateEditorJwt } from '@/app/actions/operatorFirma'
import { WaiverSettingsClient } from './WaiverSettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Waiver Settings — BoatCheckin' }

export default async function WaiversPage() {
  const { operator } = await requireOperator()

  let jwt = null
  if (operator.firma_workspace_id) {
    const res = await generateTemplateEditorJwt(operator.id)
    if (res.success) {
      jwt = res.token
    }
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-5 space-y-4">
      <h1 className="text-[24px] font-bold text-[#0D1B2A] mb-1">
        Digital Liability Waivers
      </h1>
      <p className="text-[14px] text-[#6B7C93] mb-6">
        Manage your default waiver template and specific boat waivers. Guests will automatically sign this during the join flow.
      </p>

      <WaiverSettingsClient
        operatorId={operator.id}
        companyName={operator.company_name || operator.full_name || 'BoatCheckin Partner'}
        workspaceId={operator.firma_workspace_id}
        jwtToken={jwt}
      />
    </div>
  )
}
