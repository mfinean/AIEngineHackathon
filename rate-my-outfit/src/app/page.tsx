"use client";
import { useState } from "react";
import Image from "next/image";
import { Zap } from "lucide-react"; // Import the lightning (zap) icon

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImage(file.name);
    }
  };

  const analyzeOutfit = () => {
    alert("Analyzing outfit... (API call will go here)");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 sm:p-12">
      {/* Logo + Header */}
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800">Lambda Fashion</h1>
        <p className="text-gray-600 mt-2">Upload an outfit and get AI-powered feedback!</p>
      </header>

      {/* Upload Box */}
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center w-full max-w-md">
        <label
          htmlFor="upload"
          className="border-dashed border-2 border-gray-400 rounded-lg p-6 w-full text-center cursor-pointer hover:bg-gray-50"
        >
          <span className="text-gray-600">{image ? `📸 ${image}` : "Click to upload an outfit"}</span>
          <input
            type="file"
            id="upload"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        {/* Image Preview */}
        {preview && (
          <div className="mt-4">
            <Image
              src={preview}
              alt="Uploaded Outfit"
              width={250}
              height={250}
              className="rounded-md shadow-md"
            />
          </div>
        )}

        {/* Analyze Button */}
        <button
          className={`mt-6 px-6 py-2 text-white font-semibold rounded-lg ${
            preview ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={analyzeOutfit}
          disabled={!preview}
        >
          Analyze Outfit
        </button>
      </div>

      <footer className="mt-12 text-gray-500 text-sm flex items-center gap-2">
        Built with <Zap className="w-5 h-5 text-yellow-500" /> at AI Engine Hackathon!
      </footer>
    </div>
  );
}