"use client";

import { useState } from "react";
import axios from "axios";

interface ReceiptData {
  vendorName: string;
  lineItems: { name: string; value: number }[];
  totalAmount: number;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReceiptData | null>(null); // Changed 'any' to 'ReceiptData'
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (file: File) => {
    console.log("--- Uploading File ---");
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        console.log("FileReader result:", reader.result);

        if (!reader.result) {
          throw new Error("FileReader result is null or undefined");
        }

        const base64Image = (reader.result as string).split(",")[1];
        if (!base64Image) {
          throw new Error("Failed to extract Base64 from FileReader result");
        }

        console.log("Sending Base64 image to API...");
        const response = await axios.post("/api/parseReceipt", { imageBase64: base64Image });
        console.log("API response:", response.data);

        setResult(response.data.data);
      } catch (error) {
        console.error("Error during receipt processing:", error);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      console.error("Error reading file:", reader.error);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      handleUpload(e.target.files[0]);
    }
  };

  const downloadJSON = () => {
    if (result) {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "receipt.json";
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#c1e6c8] text-black flex flex-col items-center py-8">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">Receipt Scanning App</h1>

      <div className="relative w-full max-w-md px-6 py-4 bg-white border-2 border-dashed border-blue-400 rounded-lg text-center hover:border-blue-600 hover:bg-blue-50 transition-all duration-200">
        <input
          type="file"
          accept="image/jpeg, image/png"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center">
          <svg
            className="w-12 h-12 text-blue-400 mb-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16v-4a4 4 0 114 4h4a4 4 0 11-4-4V6a4 4 0 114 4h-4"
            />
          </svg>
          <p className="text-gray-700 font-medium">Drag & drop or click to upload a receipt</p>
          <p className="text-sm text-gray-500">(JPG or PNG)</p>
        </div>
        {selectedFile && (
          <p className="mt-4 text-sm text-gray-700 font-medium">
            Selected File: {selectedFile.name}
          </p>
        )}
      </div>

      {loading && (
        <p className="text-center mt-4 text-blue-500 animate-pulse">
          Processing your receipt, please wait...
        </p>
      )}

      {result && (
        <div className="mt-10 w-full max-w-4xl">
          <h2 className="text-2xl font-bold text-blue-700 mb-4">Parsed Receipt</h2>
          <div className="bg-white shadow-md rounded p-6">
            <p className="text-lg font-semibold mb-2">
              <span className="text-gray-600">Vendor Name:</span>{" "}
              <span className="text-black">{result.vendorName}</span>
            </p>
            <p className="text-lg font-semibold mb-4">
              <span className="text-gray-600">Total Amount:</span>{" "}
              <span className="text-black">${result.totalAmount.toFixed(2)}</span>
            </p>

            <h3 className="text-xl font-semibold mb-3 text-gray-800">Line Items</h3>
            <table className="table-auto w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2 text-left text-gray-600">Item</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-gray-600">Price</th>
                </tr>
              </thead>
              <tbody>
                {result.lineItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 text-black">{item.name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">${item.value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={downloadJSON}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 shadow-md"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}
