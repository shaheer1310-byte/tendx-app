import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PhasePlaceholder } from "@/components/layout/PhasePlaceholder";
import { PlanSwitcher } from "@/components/plan/PlanSwitcher";
import { TeamPanel } from "@/components/team/TeamPanel";
import { ApiKeysPanel } from "@/components/settings/ApiKeysPanel";
import { ConnectorList } from "@/components/settings/ConnectorList";
import { UpgradeGate } from "@/components/plan/UpgradeGate";
import { getPlan, isEnterprise } from "@/server/plan";
import { getCompany } from "@/server/dashboard";
import { listMembers } from "@/server/team";
import { listKeys } from "@/server/apikeys";
import { listConnectorInfos } from "@/server/connectors";
import { getCurrentUser, hasRole } from "@/server/auth-context";

export default async function SettingsPage() {
  const plan = getPlan();
  const company = await getCompany();
  const enterprise = isEnterprise();
  const members = listMembers();
  const apiKeys = listKeys();
  const connectors = listConnectorInfos();
  const currentUser = getCurrentUser();
  const canManage = hasRole("admin");

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Company profile, plan and billing, team and notifications."
      />

      <div className="space-y-6">
        {/* Plan and billing (Build Spec sections 6.7 and 10) */}
        <Card>
          <CardHeader>
            <CardTitle>Plan and billing</CardTitle>
            <span className="label-caps text-teal2">Current: {plan}</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate">
              Professional unlocks AI matching, the AI Analyzer, bid generation
              and profit analytics. Switch plans below to see server-side gating
              in action (a demo affordance - real billing arrives in Phase 4).
            </p>
            <PlanSwitcher current={plan} />
          </CardContent>
        </Card>

        {/* Company profile (read-only summary for now) */}
        <Card>
          <CardHeader>
            <CardTitle>Company profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Legal name" value={company.legalName} />
              <Field label="City" value={company.city} />
              <Field label="Province" value={company.province} />
              <Field
                label="PPRA registration"
                value={company.ppraRegistered ? "Registered" : "Not registered"}
              />
              <Field
                label="Avg turnover (3 yr)"
                value={`PKR ${(company.avgTurnoverPkr / 1_000_000).toFixed(0)}M`}
              />
              <Field
                label="Category experience"
                value={company.categoryExperience.join(", ")}
              />
              <Field
                label="Certifications"
                value={company.certifications.join(", ") || "None on file"}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Team workspace and roles (Build Spec sections 6.7, 7.1, 10) */}
        <Card>
          <CardHeader>
            <CardTitle>Team members and roles</CardTitle>
            <span className="label-caps text-teal2">Enterprise</span>
          </CardHeader>
          <CardContent>
            {enterprise ? (
              <TeamPanel
                members={members}
                currentUserId={currentUser.id}
                canManage={canManage}
              />
            ) : (
              <UpgradeGate
                plan="enterprise"
                feature="Team workspaces"
                description="Invite teammates, assign owner / admin / member roles, and manage access. Available on the Enterprise plan."
              />
            )}
          </CardContent>
        </Card>

        {/* Public API access (Build Spec sections 8, 10) */}
        <Card>
          <CardHeader>
            <CardTitle>API access</CardTitle>
            <span className="label-caps text-teal2">Enterprise</span>
          </CardHeader>
          <CardContent>
            {enterprise ? (
              <ApiKeysPanel keys={apiKeys} canManage={canManage} />
            ) : (
              <UpgradeGate
                plan="enterprise"
                feature="API access"
                description="Issue API keys and call the public REST API (/api/v1) to pull tenders and matches into your own systems. Available on the Enterprise plan."
              />
            )}
          </CardContent>
        </Card>

        {/* Integrations / connectors (Build Spec section 12, Phase 4 design) */}
        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <span className="label-caps text-teal2">Enterprise</span>
          </CardHeader>
          <CardContent>
            {enterprise ? (
              <ConnectorList connectors={connectors} canManage={canManage} />
            ) : (
              <UpgradeGate
                plan="enterprise"
                feature="Integrations"
                description="Connect EPADS/PPRA, the provincial procurement portals, FBR tax data and payment gateways to ingest tenders and automate billing. Available on the Enterprise plan."
              />
            )}
          </CardContent>
        </Card>

        <PhasePlaceholder phase="Coming soon">
          <h2 className="font-display text-lg font-bold text-ink">
            Full profile editing and notifications
          </h2>
          <p className="text-sm text-slate">
            Editable company profile fields and notification preferences are
            built out alongside the rest of the Enterprise tooling.
          </p>
        </PhasePlaceholder>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-slate">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
