# AgroAI

AgroAI is an AI-powered agricultural assistant designed specifically for small farmers. Built utilizing a modern Next.js App Router architecture, it brings advanced crop disease detection and remedies directly to the farmer without the need for extensive technical knowledge.

## Features

- **Live Camera Disease Detection:** Open your device's camera, snap a picture of a crop, and instantly analyze it for diseases.
- **AI-Based Remedy Suggestions:** Gives specific, easy-to-understand chemical and organic treatments, categorized by disease severity.
- **Market Price Prediction:** (Planned) Predict the best selling time and price forecasting.
- **Offline PWA Support:** (Planned) Store captures while offline, automatically run analysis when internet access is restored.

## Setup Instructions

Make sure you have Node.js and npm installed.

```bash
# Clone the repository
git clone https://github.com/Gopi606/agroai.git
cd agroai/next-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to test the application locally.

## Deployment Instructions

The project is configured out-of-the-box for seamless deployment on Vercel.

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and create a new project.
3. Import your `agroai` repository.
4. Set the Root Directory to `next-app`.
5. Add your `.env` variables (e.g., your Groq or AI API keys).
6. Click Deploy. Vercel will automatically build and publish the live Next.js app.
