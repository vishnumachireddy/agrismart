# Standalone Crop Scanner Module

This folder contains the complete Crop Scanner feature extracted from the AgroSmart portal. You can integrate this into any React project.

## Directory Structure

- `frontend/`: Contains the React component (`CropScanner.tsx`).
- `supabase_function/`: Contains the backend logic for the AI scan.

## Requirements

### Frontend Dependencies:
- `lucide-react` (for icons)
- `@supabase/supabase-js` (for SDK connectivity)
- `tailwind-css` (recommended for styling, though raw classes are minimized)

### Backend Requirements:
- A Supabase project with Edge Functions enabled.
- API Key from a Vision-capable AI model (Google Gemini, GPT-4o, etc.).

## Setup Instructions

1. **Deploy Edge Function**:
   - Create a new Supabase function: `supabase functions new crop-disease-scan`
   - Copy the content from `supabase_function/index.ts` into the new function.
   - Set your API key: `supabase secrets set LOVABLE_API_KEY=your_key_here`
   - Deploy: `supabase functions deploy crop-disease-scan`

2. **Integrate Component**:
   - Copy `CropScanner.tsx` into your project.
   - Initialize your Supabase client and pass it as a prop to `<CropScanner supabase={your_client} />`.

## Key Features
- **Base64 Image Handling**: Converts images to base64 for Edge Function processing.
- **Camera Integration**: Support for mobile device cameras.
- **AI Diagnostics**: Provides Disease name, Confidence level, Treatment, and Prevention steps.
