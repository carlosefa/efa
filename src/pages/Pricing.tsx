import { Link } from "react-router-dom";
import {
  Check,
  Zap,
  Star,
  Crown,
  Diamond,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    price: "USD 0",
    period: "/month",
    description: "To get started competing",
    features: [
      "Up to 2 active tournaments",
      "Basic formats (league, knockout)",
      "Public rankings",
      "Team and player pages",
      "Basic match room",
      "Community support",
    ],
    cta: "Get Started Free",
    variant: "outline" as const,
    gradient: "from-muted/50 to-muted/30",
    iconColor: "text-muted-foreground",
  },
  {
    name: "Silver",
    icon: Star,
    price: "USD 10",
    period: "/month",
    description: "For serious organizers",
    features: [
      "Up to 10 active tournaments",
      "Advanced formats (groups + playoffs)",
      "Staff and basic permissions",
      "Email notifications",
      "Detailed statistics",
      "48h support",
    ],
    cta: "Subscribe to Silver",
    variant: "outline" as const,
    gradient: "from-rank-silver/20 to-rank-silver/5",
    iconColor: "text-rank-silver",
    borderColor: "border-rank-silver/30",
  },
  {
    name: "Gold",
    icon: Crown,
    price: "USD 30",
    period: "/month",
    description: "For professional leagues",
    popular: true,
    features: [
      "Unlimited tournaments",
      "All formats (Swiss, double elimination)",
      "Automations and calendar planner",
      "Reports and analytics",
      "Integrations (Discord, WhatsApp)",
      "24h support",
    ],
    cta: "Subscribe to Gold",
    variant: "default" as const,
    gradient: "from-rank-gold/20 to-rank-gold/5",
    iconColor: "text-rank-gold",
    borderColor: "border-rank-gold/50",
    glowColor: "shadow-[0_0_40px_-10px_hsl(var(--rank-gold)/0.5)]",
  },
  {
    name: "Diamond",
    icon: Diamond,
    price: "USD 100",
    period: "/month",
    description: "For federations and companies",
    features: [
      "Everything in Gold +",
      "Premium SLA (6–12h)",
      "Organization verification",
      "API and webhooks",
      "Multi-country and white-label",
      "Dedicated account manager",
    ],
    cta: "Talk to Sales",
    variant: "outline" as const,
    gradient: "from-rank-diamond/20 to-rank-diamond/5",
    iconColor: "text-rank-diamond",
    borderColor: "border-rank-diamond/30",
  },
];

const faqs = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes! You can upgrade or downgrade at any time. Billing is prorated.",
  },
  {
    question: "Do I need a credit card for the Free plan?",
    answer:
      "No! The Free plan is 100% free and does not require a credit card.",
  },
  {
    question: "What is the cancellation policy?",
    answer:
      "Cancel anytime, no penalties. You keep access until the end of the paid period.",
  },
];

export default function Pricing() {
  return (
    <div className="relative">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative py-20">
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wider uppercase">
              Plans
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold">
            Choose the ideal plan for{" "}
            <span className="text-gradient-cyber">you</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From casual to professional, we have the perfect plan for your
            esports journey.
            <span className="block text-sm mt-2 text-muted-foreground/70">
              All plans include free updates and no hidden fees.
            </span>
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative glass-card p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 animate-slide-up",
                  plan.popular && "ring-2 ring-rank-gold/50",
                  plan.glowColor
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rank-gold to-warning text-background text-xs font-semibold tracking-wider px-4">
                    MOST POPULAR
                  </Badge>
                )}

                {/* Plan header */}
                <div className="text-center mb-6 pt-2">
                  <div
                    className={cn(
                      "inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br mb-4",
                      plan.gradient
                    )}
                  >
                    <Icon className={cn("h-7 w-7", plan.iconColor)} />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-6 pb-6 border-b border-border/50">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          plan.popular
                            ? "bg-rank-gold/20"
                            : "bg-primary/10"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3",
                            plan.popular
                              ? "text-rank-gold"
                              : "text-primary"
                          )}
                        />
                      </div>
                      <span className="text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={cn(
                    "w-full cyber-btn group",
                    plan.popular
                      ? "bg-gradient-to-r from-rank-gold to-warning text-background hover:opacity-90"
                      : plan.variant === "default"
                      ? "bg-primary text-primary-foreground"
                      : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                  )}
                  variant={plan.popular ? "default" : plan.variant}
                  asChild
                >
                  <Link to="/auth">
                    <span className="text-xs font-semibold tracking-wider">
                      {plan.cta}
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div
          className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-20 animate-slide-up"
          style={{ animationDelay: "400ms" }}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-1/50">
            <Check className="h-4 w-4 text-success" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-1/50">
            <Check className="h-4 w-4 text-success" />
            <span>No hidden fees</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-1/50">
            <Check className="h-4 w-4 text-success" />
            <span>English support</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-1/50">
            <Check className="h-4 w-4 text-success" />
            <span>Secure data (LGPD)</span>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 mb-4">
              <HelpCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent tracking-wider uppercase">
                FAQ
              </span>
            </div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="glass-card p-5 animate-slide-up"
                style={{ animationDelay: `${(i + 5) * 100}ms` }}
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Support link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <Link
                to="/support"
                className="text-primary hover:underline font-medium"
              >
                Talk to our team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
