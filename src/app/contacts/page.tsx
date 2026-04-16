import { ComingSoonPage } from "@/components/admin/ComingSoon";

export default function ContactsPage() {
  return (
    <ComingSoonPage
      title="Contacts"
      icon="contacts"
      tagline="A unified address book for everyone you've scheduled with — searchable, taggable, and ready to power your follow-ups."
      features={[
        {
          icon: "person_add",
          title: "Auto-capture from bookings",
          description: "Every new booker is added to your contacts automatically with their email, timezone, and booking history.",
        },
        {
          icon: "label",
          title: "Tags & segments",
          description: "Group contacts by tag (clients, leads, candidates) and filter meetings or export segments in one click.",
        },
        {
          icon: "history",
          title: "Full meeting history",
          description: "See every past meeting, cancellation, and no-show for a contact on a single timeline.",
        },
      ]}
    />
  );
}
