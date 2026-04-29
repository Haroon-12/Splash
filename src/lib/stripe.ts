import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
// Ensure you are using the TEST key (sk_test_...) during development
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummyKeyToPreventCrashOnImport', {
  apiVersion: "2025-08-27.basil", // Use the latest API version or match your account
  appInfo: {
    name: "Splash Platform",
    version: "0.1.0",
  },
});
