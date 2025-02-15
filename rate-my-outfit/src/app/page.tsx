"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { signIn, signOut, useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [stylingAdvice, setStylingAdvice] = useState<string[]>([]);
  const [purchaseRecommendations, setPurchaseRecommendations] = useState<{ item: string; description: string; type: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"advice" | "recommendations">("advice");
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  const loadingMessages = [
    "Analyzing your outfit's style...",
    "Identifying key fashion elements...",
    "Generating personalized recommendations...",
    "Almost there! Finalizing your fashion advice..."
  ];

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
    setError(null);
    setStylingAdvice([]);
    setPurchaseRecommendations([]);
    setLoadingStep(0);

    const loadingInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 3000);

    try {
      const response = await fetch("/api/analyze-outfit", {
        method: "POST",
        body: JSON.stringify({ imageBase64: preview }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze outfit');
      }

      const data = await response.json();
      setStylingAdvice(data.styling_advice || []);
      setPurchaseRecommendations(data.purchase_recommendations || []);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      clearInterval(loadingInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const UserSection = () => {
    if (session) {
      return (
        <div className="flex items-center gap-4">
          <img 
            src={session.user?.image || ''} 
            alt={session.user?.name || ''} 
            className="w-8 h-8 rounded-full"
          />
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out
          </button>
        </div>
      )
    }

    return (
      <button
        onClick={() => signIn('google')}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <img 
          src="/google-icon.svg" 
          alt="Google" 
          className="w-5 h-5"
        />
        Sign in with Google
      </button>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E3E6E8] to-[#F9FAFB] p-8 md:p-16">
      <div className="absolute top-4 right-4">
        <UserSection />
      </div>
      <div className="flex flex-col md:flex-row w-full gap-8">
        {/* Left Side - Outfit Image */}
        <div className="w-full md:w-1/2 flex flex-col items-center bg-white shadow-lg p-8 rounded-xl border border-gray-300">
          <h1 className="text-6xl font-extrabold text-gray-900 mb-6 font-['Playfair_Display'] tracking-wide">
            Lambda Fashion
          </h1>
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
            className={`mt-6 px-6 py-3 text-white font-semibold rounded-lg shadow-md ${
              preview ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
            } transition-all`}
            onClick={() => {
              console.log("🚀 Analyze button clicked!");
              analyzeOutfit();
            }}
            disabled={!preview || loading}
          >
            {loading ? "Analyzing..." : "Analyze Outfit"}
          </motion.button>

          {/* Loading Spinner */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <motion.div
                    key={loadingStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <p className="text-lg font-semibold text-gray-800 mb-2">
                      {loadingMessages[loadingStep]}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                      ></div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Right Side - Tabs & Display */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
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

          {/* Add a wrapper div with relative positioning and min-height */}
          <div className="relative w-full min-h-[300px]">
            {/* Display Styling Advice */}
            <AnimatePresence mode="wait">
              {activeTab === "advice" && stylingAdvice.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-6 left-0 right-0 p-6 bg-white shadow-lg rounded-xl w-full max-w-md text-gray-700 text-center mx-auto"
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

            {/* Display Purchase Recommendations */}
            <AnimatePresence mode="wait">
              {activeTab === "recommendations" && purchaseRecommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-6 left-0 right-0 p-6 bg-white shadow-lg rounded-xl w-full max-w-md text-gray-700 text-center mx-auto"
                >
                  <h2 className="text-xl font-semibold mb-4">Suggested Items:</h2>
                  <div className="flex flex-col space-y-4">
                    {purchaseRecommendations.map((rec, index) => (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        key={index}
                        className="bg-gray-100 p-4 rounded-lg shadow-md"
                      >
                        <h3 className="font-bold text-lg">{rec.item}</h3>
                        <p className="text-sm">{rec.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty States */}
            <AnimatePresence mode="wait">
              {activeTab === "advice" && !loading && !error && stylingAdvice.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-6 left-0 right-0 p-6 bg-white shadow-lg rounded-xl w-full max-w-md text-gray-700 text-center mx-auto"
                >
                  <p>Upload and analyze an outfit to get styling advice!</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {activeTab === "recommendations" && !loading && !error && purchaseRecommendations.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-6 left-0 right-0 p-6 bg-white shadow-lg rounded-xl w-full max-w-md text-gray-700 text-center mx-auto"
                >
                  <p>Upload and analyze an outfit to get purchase recommendations!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}