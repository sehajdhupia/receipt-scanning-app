import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import Tesseract from 'tesseract.js';
import JSON5 from 'json5'; // Changed to ES module import

// Create OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Disable Next.js body parser
export const config = {
  api: {
    bodyParser: false, // Disable default body parser
  },
};

// Helper function to parse the request body
async function parseRequestBody(req: NextApiRequest): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Reject if body size exceeds 5MB
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Body size exceeded 5MB limit'));
      }
    });
    req.on('end', () => resolve(JSON5.parse(body)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('--- Incoming Request to /api/parseReceipt ---');

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    // Parse the incoming request body
    const { imageBase64 } = (await parseRequestBody(req)) as {
      imageBase64: string;
    }; // Cast to ensure correct type
    if (!imageBase64) {
      res.status(400).json({ success: false, message: 'Missing imageBase64' });
      return;
    }

    console.log('Starting OCR with Tesseract.js...');
    const { data } = await Tesseract.recognize(`data:image/jpeg;base64,${imageBase64}`, 'eng', {
      logger: (info) => console.log('Tesseract progress:', info),
    });

    const rawText = data.text.trim();
    console.log('Extracted OCR Text:', rawText);

    console.log('Sending extracted text to OpenAI for analysis...');
    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an assistant extracting structured data from receipt text. Respond only with valid JSON in the following format:
          {
            "vendorName": "string",
            "lineItems": [
              {"name": "string", "value": "number"}
            ],
            "totalAmount": "number"
          }`,
        },
        { role: 'user', content: rawText },
      ],
    });

    const rawContent = openaiResponse.choices[0]?.message?.content;
    console.log('Raw OpenAI Response:', rawContent);

    // Parse and clean response
    const structuredData = JSON5.parse(rawContent) as {
      vendorName: string;
      lineItems: { name: string; value: number }[];
      totalAmount: number;
    };
    console.log('Parsed Structured Data:', structuredData);

    res.status(200).json({ success: true, data: structuredData });
  } catch (error) {
    console.error('Error during receipt processing:', error.message || error);
    res.status(500).json({ success: false, error: error.message });
  }
}
