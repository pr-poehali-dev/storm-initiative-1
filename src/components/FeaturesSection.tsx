import { LinkAccountsCard } from "@/components/feature-cards/LinkAccountsCard"
import { PaymentRolesCard } from "@/components/feature-cards/PaymentRolesCard"
import { SendFundsCard } from "@/components/feature-cards/SendFundsCard"

export function FeaturesSection() {
  return (
    <section className="px-4 md:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
        <LinkAccountsCard />
        <PaymentRolesCard />
        <SendFundsCard />
      </div>
    </section>
  )
}
