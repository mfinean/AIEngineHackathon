"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [stylingAdvice, setStylingAdvice] = useState<string[]>([]);
  const [purchaseRecommendations, setPurchaseRecommendations] = useState<{ item: string; description: string; type: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"advice" | "recommendations">("advice");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeOutfit = async () => {
    if (!preview) return;

    setLoading(true);
    setStylingAdvice([]);
    setPurchaseRecommendations([]);

    const response = await fetch("/api/analyze-outfit", {
      method: "POST",
      body: JSON.stringify({ imageBase64: preview }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    setStylingAdvice(data.styling_advice || []);
    setPurchaseRecommendations(data.purchase_recommendations || []);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-6 sm:p-12">
      {/* Left Side - Outfit Image */}
      <div className="w-1/2 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Lambda Fashion</h1>

        {/* Image Upload */}
        {!preview ? (
          <label htmlFor="upload" className="border-dashed border-2 border-gray-400 rounded-lg p-6 w-3/4 text-center cursor-pointer hover:bg-gray-50">
            <span className="text-gray-600">Click to Upload an Outfit</span>
            <input type="file" id="upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <div className="flex flex-col items-center">
            <Image src={preview} alt="Uploaded Outfit" width={350} height={450} className="rounded-md shadow-md" />
            <label htmlFor="upload" className="mt-4 text-blue-600 cursor-pointer hover:underline">
              Change Photo
            </label>
            <input type="file" id="upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        )}

        {/* Analyze Button */}
        <button
          className={`mt-6 px-6 py-2 text-white font-semibold rounded-lg ${preview ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
          onClick={analyzeOutfit}
          disabled={!preview || loading}
        >
          {loading ? "Analyzing..." : "Analyze Outfit"}
        </button>
      </div>

      {/* Right Side - Buttons & Display */}
      <div className="w-1/2 flex flex-col items-center">
        <div className="flex gap-4 mt-6">
          <button
            className={`px-6 py-2 text-white font-semibold rounded-lg ${activeTab === "advice" ? "bg-blue-600" : "bg-gray-300"}`}
            onClick={() => setActiveTab("advice")}
          >
            Styling Advice
          </button>
          <button
            className={`px-6 py-2 text-white font-semibold rounded-lg ${activeTab === "recommendations" ? "bg-blue-600" : "bg-gray-300"}`}
            onClick={() => setActiveTab("recommendations")}
          >
            Recommendations
          </button>
        </div>

        {/* Display Styling Advice */}
        {activeTab === "advice" && stylingAdvice.length > 0 && (
          <div className="mt-4 p-4 bg-gray-200 rounded-lg text-gray-700 text-center w-3/4">
            <h2 className="text-xl font-semibold mb-2">Styling Tips:</h2>
            <ul className="list-disc list-inside">
              {stylingAdvice.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Display Purchase Recommendations */}
        {activeTab === "recommendations" && purchaseRecommendations.length > 0 && (
          <div className="mt-4 p-4 bg-gray-200 rounded-lg text-gray-700 text-center w-3/4">
            <h2 className="text-xl font-semibold mb-2">Suggested Items:</h2>
            <div className="flex overflow-x-auto space-x-4">
              {purchaseRecommendations.map((rec, index) => (
                <div key={index} className="bg-white shadow-md p-4 rounded-lg">
                  <h3 className="font-bold">{rec.item}</h3>
                  <p className="text-sm">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}