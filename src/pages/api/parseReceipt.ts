import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import Tesseract from 'tesseract.js';
import JSON5 from 'json5'; // ES module import

// Initialize OpenAI with the provided API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Disable the default body parser for this API route to handle raw requests
export const config = {
  api: {
    bodyParser: false, // Required for handling raw body input
  },
};

/**
 * Helper function to parse the request body.
 * This function reads the incoming request stream and parses it as JSON.
 * It also ensures that the request body does not exceed the 5MB limit.
 */
async function parseRequestBody(req: NextApiRequest): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;

      // Reject if the body exceeds 5MB
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Request body size exceeded 5MB limit'));
      }
    });

    req.on('end', () => {
      try {
        // Attempt to parse the body as JSON
        const parsed = JSON5.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', (err) => {
      reject(new Error(`Error reading request body: ${err instanceof Error ? err.message : String(err)}`));
    });
  });
}

/**
 * Main handler function for the API route.
 * Processes a POST request to extract receipt text using OCR and analyze it with OpenAI.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('--- Received Request on /api/parseReceipt ---');

  // Allow only POST requests
  if (req.method !== 'POST') {
    console.warn('Invalid request method:', req.method);
    res.status(405).json({ success: false, message: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    // Parse the request body
    const parsedBody = (await parseRequestBody(req)) as { imageBase64?: string };
    const imageBase64 = parsedBody.imageBase64;

    if (!imageBase64) {
      console.error('Request body is missing "imageBase64" field');
      res.status(400).json({ success: false, message: 'Missing "imageBase64" in request body' });
      return;
    }

    console.log('Starting OCR with Tesseract.js...');
    const tesseractOptions = {
      logger: (info: { status: string; progress: number }) => console.log('Tesseract progress:', info), // Specified logger type
    };

    // Perform OCR to extract text from the base64 image
    const { data } = await Tesseract.recognize(`data:image/jpeg;base64,${imageBase64}`, 'eng', tesseractOptions);
    const rawText = data.text.trim();

    console.log('OCR Extraction Complete. Extracted Text:');
    console.log(rawText);

    // Use OpenAI to process the extracted text
    console.log('Sending extracted text to OpenAI for further analysis...');
    const openaiResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an assistant that extracts structured data from receipt text. Respond only with valid JSON in the format:
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

    const rawContent = openaiResponse.choices[0]?.message?.content ?? '';
    if (!rawContent) {
      console.error('OpenAI response is empty or invalid');
      throw new Error('OpenAI did not return a valid response');
    }

    console.log('Raw Response from OpenAI:', rawContent);

    // Parse OpenAI's response as JSON
    const structuredData = JSON5.parse(rawContent) as {
      vendorName: string;
      lineItems: { name: string; value: number }[];
      totalAmount: number;
    };

    console.log('Parsed Structured Data:', structuredData);

    // Send the structured data as the API response
    res.status(200).json({ success: true, data: structuredData });
  } catch (err) {
    // Handle errors and log them
    if (err instanceof Error) {
      console.error('Error during receipt processing:', err.message);
      res.status(500).json({ success: false, error: err.message });
    } else {
      console.error('Unexpected error during receipt processing:', err);
      res.status(500).json({ success: false, error: 'An unknown error occurred' });
    }
  }
}
