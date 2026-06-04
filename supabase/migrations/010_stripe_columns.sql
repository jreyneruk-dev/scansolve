-- Add Stripe customer/subscription IDs to organisations
-- These let us look up a subscription in the Stripe dashboard and handle webhooks.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Optional: index for fast webhook lookups (though we use metadata.org_id to identify orgs)
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
