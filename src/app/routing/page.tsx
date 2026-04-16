import { ComingSoonPage } from "@/components/admin/ComingSoon";

export default function RoutingPage() {
  return (
    <ComingSoonPage
      title="Routing"
      icon="route"
      tagline="Ask bookers a few questions up front and route them to the right event type, team, or teammate — without any manual triage."
      features={[
        {
          icon: "quiz",
          title: "Dynamic forms",
          description: "Build a short pre-booking form with conditional logic — what the booker answers determines what they see next.",
        },
        {
          icon: "groups",
          title: "Team round-robin",
          description: "Balance meetings across a team automatically, or hand off to the right specialist based on form answers.",
        },
        {
          icon: "analytics",
          title: "Drop-off insights",
          description: "See where bookers abandon the form and which branches convert best so you can refine your funnel.",
        },
      ]}
    />
  );
}
