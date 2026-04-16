import { ComingSoonPage } from "@/components/admin/ComingSoon";

export default function AnalyticsPage() {
  return (
    <ComingSoonPage
      title="Analytics"
      icon="bar_chart"
      tagline="See which event types convert, when your week gets crushed, and which follow-ups actually lead to booked time."
      features={[
        {
          icon: "insights",
          title: "Booking funnel",
          description: "Track page views, started bookings, completed bookings, and cancellations for every event type over any date range.",
        },
        {
          icon: "schedule",
          title: "Time analysis",
          description: "Heatmaps of when meetings land across the week, your busiest days, and how much of your calendar is booked solid.",
        },
        {
          icon: "file_download",
          title: "CSV export",
          description: "Pull raw booking data out to BI tools, CRMs, or your own spreadsheets for custom reporting.",
        },
      ]}
    />
  );
}
