"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // For animations

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
    <div className="flex min-h-screen bg-gray-50 p-8 md:p-16">
      {/* Left Side - Outfit Image */}
      <div className="w-1/2 flex flex-col items-center bg-white shadow-lg p-6 rounded-xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">Lambda Fashion</h1>

        {/* Image Upload */}
        {!preview ? (
          <label htmlFor="upload" className="border-2 border-dashed border-gray-400 rounded-lg p-10 w-full text-center cursor-pointer hover:bg-gray-100 transition-all">
            <span className="text-gray-600 font-semibold">Click to Upload an Outfit</span>
            <input type="file" id="upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
            <Image src={preview} alt="Uploaded Outfit" width={400} height={500} className="rounded-xl shadow-md hover:scale-105 transition-transform" />
            <label htmlFor="upload" className="mt-4 text-blue-600 font-semibold cursor-pointer hover:underline">
              Change Photo
            </label>
            <input type="file" id="upload" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </motion.div>
        )}

        {/* Analyze Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`mt-6 px-6 py-3 text-white font-semibold rounded-lg ${
            preview ? "bg-blue-600 hover:bg-blue-700 shadow-md" : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={analyzeOutfit}
          disabled={!preview || loading}
        >
          {loading ? "Analyzing..." : "Analyze Outfit"}
        </motion.button>
      </div>

      {/* Right Side - Tabs & Display */}
      <div className="w-1/2 flex flex-col items-center">
        <div className="flex gap-4 mt-6">
          <button
            className={`px-6 py-2 text-white font-semibold rounded-lg shadow-lg transition-all ${
              activeTab === "advice" ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
            }`}
            onClick={() => setActiveTab("advice")}
          >
            Styling Advice
          </button>
          <button
            className={`px-6 py-2 text-white font-semibold rounded-lg shadow-lg transition-all ${
              activeTab === "recommendations" ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
            }`}
            onClick={() => setActiveTab("recommendations")}
          >
            Recommendations
          </button>
        </div>

        {/* Display Styling Advice */}
        <AnimatePresence>
          {activeTab === "advice" && stylingAdvice.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-6 bg-white shadow-lg rounded-xl w-full max-w-md text-gray-700 text-center"
            >
              <h2 className="text-xl font-semibold mb-2">Styling Tips:</h2>
              <ul className="list-disc list-inside">
                {stylingAdvice.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Display Purchase Recommendations - Horizontal Scroll */}
        <AnimatePresence>
          {activeTab === "recommendations" && purchaseRecommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-6 bg-white shadow-lg rounded-xl w-full max-w-md text-gray-700 text-center"
            >
              <h2 className="text-xl font-semibold mb-4">Suggested Items:</h2>
              <div className="flex overflow-x-auto space-x-4 scrollbar-hide">
                {purchaseRecommendations.map((rec, index) => (
                  <motion.div whileHover={{ scale: 1.05 }} key={index} className="bg-gray-100 p-4 rounded-lg min-w-[150px]">
                    <h3 className="font-bold">{rec.item}</h3>
                    <p className="text-sm">{rec.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}