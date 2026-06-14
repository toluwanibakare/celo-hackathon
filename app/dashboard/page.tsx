import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "Paycon - AI Financial Dashboard",
  description: "Manage your Celo stablecoins, track savings goals, schedule bills, and get AI-powered financial coaching.",
};

export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const isMock =
    !dbUrl ||
    dbUrl === "****" ||
    dbUrl.includes("placeholder") ||
    dbUrl.includes("your_postgres");

  return <DashboardClient user={session.user} isMock={isMock} />;
}
