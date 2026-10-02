Charity
A live, gamified philanthropy leaderboard where brands and individuals bid to rank their website URL at the top of a public board. Built to align with UN Sustainable Development Goals (SDGs), the platform routes 90% of all bids directly to vetted charitable causes while retaining a 10% fee for platform sustainability.

Features
Real-Time Gamification: The leaderboard updates instantly as soon as a Stripe payment is processed.

Serverless-Optimized Database: Implements robust MongoDB Atlas connection caching to prevent connection exhaustion during cold starts.

Secure Payment Processing: Fully integrated with Stripe Checkout and webhooks to verify transactions before updating public state.

Minimalist UI: Built with Tailwind CSS and Framer Motion for smooth layout shifting when a new bid claims the top spot.

Tech Stack
Framework: Next.js 14 (App Router)

Language: TypeScript

Database: MongoDB Atlas (via Mongoose)

Payments: Stripe

Styling: Tailwind CSS & Shadcn UI

Animations: Framer Motion

Local Development
Open the repository in VS Code and follow these steps to get your local environment running.

1. Install Dependencies
Bash
npm install
2. Configure Environment Variables
Create a .env.local file in the root directory and add the following keys:

Plaintext
# Database
MONGODB_URI=mongodb+srv://<USER>:<PASS>@cluster.mongodb.net/charity?retryWrites=true&w=majority

# Stripe Keys (Development)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Local App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Webhook Secret (Generated in step 3)
STRIPE_WEBHOOK_SECRET=whsec_...
3. Setup Stripe Webhooks
To test the full payment flow locally, you need to forward Stripe events to your local server using the Stripe CLI.

Open a terminal and start the Next.js development server:

Bash
npm run dev
Open a second terminal and start the Stripe CLI listener:

Bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
The CLI will output a webhook signing secret (whsec_...). Copy this value into your .env.local file as STRIPE_WEBHOOK_SECRET and restart your Next.js server.

4. Test the Application
Navigate to http://localhost:3000. Submit a test bid using the form. You will be redirected to Stripe Checkout. Use the test card number 4242 4242 4242 4242 with any future expiry date and CVC. Once the payment succeeds, the webhook will fire, and your bid will appear at the top of the leaderboard.

Deployment
This architecture is explicitly optimized for Vercel.

Push your repository to GitHub.

Import the project into Vercel.

Add your production environment variables (MONGODB_URI, STRIPE_SECRET_KEY (live), NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (live), and NEXT_PUBLIC_APP_URL).

In your Stripe Dashboard, create a new webhook endpoint pointing to [https://your-production-url.com/api/webhooks/stripe](https://your-production-url.com/api/webhooks/stripe), select the checkout.session.completed event, and paste the generated live webhook secret into your Vercel variables as STRIPE_WEBHOOK_SECRET.

Deploy.

License
This project is licensed under the MIT License. It is designed to be easily forked and deployed by NGOs, student groups, and charitable organizations looking to host their own fundraising leaderboards.
