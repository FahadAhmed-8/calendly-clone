import { ComingSoonPage } from "@/components/admin/ComingSoon";

export default function WorkflowsPage() {
  return (
    <ComingSoonPage
      title="Workflows"
      icon="alt_route"
      tagline="Automate the repetitive follow-ups around every meeting — reminders, thank-yous, feedback requests, no-show checks, all on autopilot."
      features={[
        {
          icon: "mark_email_read",
          title: "Email reminders",
          description: "Send a branded confirmation the moment a meeting is booked and a reminder 24h before it starts.",
        },
        {
          icon: "sms",
          title: "SMS nudges",
          description: "Drop a text 15 minutes before a meeting to cut no-shows. Optional and configurable per event type.",
        },
        {
          icon: "rule",
          title: "Conditional triggers",
          description: "Only fire a workflow for certain event types, or only for first-time bookers, or only outside business hours.",
        },
      ]}
    />
  );
}
