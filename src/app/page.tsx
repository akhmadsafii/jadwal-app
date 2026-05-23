import TopAppBar from "@/components/TopAppBar";
import LeaveBalanceCards from "@/components/LeaveBalanceCards";
import RequestForm from "@/components/RequestForm";
import UrgentNeedsSection from "@/components/UrgentNeedsSection";
import RecentRequests from "@/components/RecentRequests";
import BottomNavBar from "@/components/BottomNavBar";

export default function Home() {
  return (
    <div className="min-h-screen pb-24">
      <TopAppBar />

      <main className="px-container-margin py-4 space-y-4">
        {/* Leave Balance Cards */}
        <LeaveBalanceCards />

        {/* Request Form */}
        <RequestForm />

        {/* Urgent Needs Section */}
        <UrgentNeedsSection />

        {/* Recent Requests */}
        <RecentRequests />
      </main>

      <BottomNavBar />
    </div>
  );
}