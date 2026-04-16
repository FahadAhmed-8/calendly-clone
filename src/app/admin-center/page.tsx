import { ComingSoonPage } from "@/components/admin/ComingSoon";

export default function AdminCenterPage() {
  return (
    <ComingSoonPage
      title="Admin center"
      icon="admin_panel_settings"
      tagline="Manage users, billing, security, and team-wide defaults from one organizational control panel."
      features={[
        {
          icon: "group",
          title: "User management",
          description: "Invite teammates, assign roles, and remove access when people leave — all from a single roster view.",
        },
        {
          icon: "shield",
          title: "Security & SSO",
          description: "Enforce 2FA, SAML SSO for Google/Okta/Azure AD, and audit logs for every sensitive action.",
        },
        {
          icon: "receipt_long",
          title: "Billing & plans",
          description: "Review seat usage, upgrade the team plan, manage payment methods, and download invoices.",
        },
      ]}
    />
  );
}
