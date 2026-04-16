import { ComingSoonPage } from "@/components/admin/ComingSoon";

export default function IntegrationsPage() {
  return (
    <ComingSoonPage
      title="Integrations & apps"
      icon="apps"
      tagline="Connect Scheduler to the tools you already use — your calendar, your video platform, your CRM — so bookings flow everywhere in real time."
      features={[
        {
          icon: "calendar_month",
          title: "Calendar sync",
          description: "Two-way sync with Google Calendar, Outlook, and iCloud so you never double-book and existing events block availability.",
        },
        {
          icon: "videocam",
          title: "Conferencing",
          description: "Auto-generate Zoom, Google Meet, or Microsoft Teams links for every confirmed booking.",
        },
        {
          icon: "hub",
          title: "CRM pipelines",
          description: "Push new bookings into Salesforce, HubSpot, or Pipedrive as activities or leads without lifting a finger.",
        },
      ]}
    />
  );
}
