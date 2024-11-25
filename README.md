This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Receipt Processing App
This is a Next.js project designed to process receipt images using OCR and structure the extracted data using an LLM. It leverages Tesseract.js for OCR and OpenAI GPT for text analysis.

## Getting Started
Running Locally
To run the development server:
Clone repository:
```bash
git clone [https://github.com/sehajdhupia/receipt-scanning-app]
cd [reciept-scanning-app]
```
Install dependencies:
```bash
npm install
```
Create a .env file in the root directory and add the following environment variable:
```bash
OPENAI_API_KEY=[Your OpenAI API Key]
```
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Overview

Features: 
OCR Integration:
- Extracts text from uploaded receipt images using Tesseract.js.
LLM Analysis:
- Parses extracted text and structures it into JSON format using OpenAI GPT.
Drag-and-Drop File Upload:
- Users can drag and drop receipt images for processing.
Download Results as JSON:
- Processed data can be downloaded as a .json file.
API Choices and Rationale
- OCR: Tesseract.js
- Reason: Tesseract.js is a lightweight and widely-used JavaScript-based OCR library. It integrates easily into Node.js environments.
- LLM: OpenAI GPT
- Reason: OpenAI GPT provides robust and accurate text analysis, making it an ideal choice for structuring receipt data.

## Known Limitations
Deployment Issues on Vercel:
- Tesseract.js depends on WASM files (tesseract-core-simd.wasm), which are not fully compatible with Vercel's serverless environment. As a result, the app cannot process receipts when deployed on Vercel.
- This issue could be resolved by hosting the WASM files on a custom CDN or deploying to a different platform (e.g., AWS Lambda or a traditional server).
OCR Accuracy:
- The quality of OCR output depends heavily on the quality of uploaded receipt images. Blurry or poorly scanned images may result in errors.