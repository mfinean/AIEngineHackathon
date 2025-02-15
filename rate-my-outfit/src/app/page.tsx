"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; // For animations
import { Loader2 } from 'lucide-react';

interface ShoppingResult {
  title: string;
  price: string;
  seller: string;
  link: string;
  image_url: string;
}

interface PurchaseRecommendation {
  item: string;
  description: string;
  type: string;
  search_query: string;
}

interface TryOnState {
  itemId: string | null;
  status: 'idle' | 'processing' | 'completed';
  result: string | null;
}

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [stylingAdvice, setStylingAdvice] = useState<string[]>([]);
  const [purchaseRecommendations, setPurchaseRecommendations] = useState<PurchaseRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<"styling" | "recommendations">("styling");
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);
  const [recommendationResults, setRecommendationResults] = useState<{ [key: number]: ShoppingResult[] }>({});
  const [tryOnState, setTryOnState] = useState<TryOnState>({
    itemId: null,
    status: 'idle',
    result: null
  });

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze outfit');
      }

      setStylingAdvice(data.styling_advice || []);
      setPurchaseRecommendations(data.purchase_recommendations || []);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      clearInterval(loadingInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleRecommendationClick = async (index: number, recommendation: PurchaseRecommendation) => {
    if (expandedRecommendation === index) {
      setExpandedRecommendation(null);
      return;
    }

    setExpandedRecommendation(index);
    
    // Only fetch if we haven't already
    if (!recommendationResults[index]) {
      try {
        const response = await fetch('/api/shopping-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchQuery: recommendation.search_query })
        });
        
        if (!response.ok) throw new Error('Shopping search failed');
        const data = await response.json();
        setRecommendationResults(prev => ({
          ...prev,
          [index]: data.results
        }));
      } catch (err) {
        console.error('Failed to fetch shopping results:', err);
      }
    }
  };

  const handleTryOn = async (imageUrl: string, itemId: string) => {
    try {
      setTryOnState({
        itemId,
        status: 'processing',
        result: null
      });

      console.log('Sending try-on request...', {
        modelImage: preview?.substring(0, 100) + '...',
        garmentImage: imageUrl
      });

      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelImage: preview,
          garmentImage: imageUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Try-on API error:', data);
        throw new Error(data.error || 'Failed to process try-on');
      }

      setTryOnState({
        itemId,
        status: 'completed',
        result: data.result
      });
    } catch (error) {
      console.error('Try-on error:', error);
      setTryOnState({
        itemId: null,
        status: 'idle',
        result: null
      });
      setError(error instanceof Error ? error.message : 'Failed to process try-on. Please try again.');
    }
  };

  const renderShoppingItem = (item: any) => (
    <div className="relative bg-white/10 rounded-lg p-4 backdrop-blur-sm">
      {/* Existing item content */}
      <button
        onClick={() => handleTryOn(item.image_url, item.link)}
        className="absolute bottom-2 left-2 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-sm flex items-center gap-2"
        disabled={tryOnState.status === 'processing'}
      >
        {tryOnState.status === 'processing' && tryOnState.itemId === item.link ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Try On'
        )}
      </button>
      
      {/* Show try-on result if available */}
      {tryOnState.status === 'completed' && tryOnState.itemId === item.link && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl">
            <img src={tryOnState.result} alt="Try-on result" className="w-full" />
            <button 
              onClick={() => setTryOnState({ itemId: null, status: 'idle', result: null })}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 text-center">
        <h1 className="logo-text text-4xl mb-2">Lambda Fashion</h1>
        <p className="text-gray-300 text-sm">Your AI Fashion Assistant</p>
      </header>
      <div className="flex min-h-screen bg-gradient-to-br from-[#E3E6E8] to-[#F9FAFB] p-8 md:p-16">
        <div className="flex flex-col md:flex-row w-full gap-8">
          {/* Left Side - Outfit Image */}
          <div className="w-full md:w-1/2 flex flex-col items-center bg-white shadow-lg p-8 rounded-xl border border-gray-300">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6 font-['Playfair_Display'] tracking-wide">
              Photo Upload
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
                preview ? "bg-gray-800 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
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
                  activeTab === "styling" ? "bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => setActiveTab("styling")}
              >
                Styling Advice
              </button>
              <button
                className={`px-6 py-2 text-white font-semibold rounded-lg shadow-lg transition-all ${
                  activeTab === "recommendations" ? "bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
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
                {activeTab === "styling" && stylingAdvice.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-6 left-0 right-0 p-6 bg-gray-800 shadow-lg rounded-xl w-full max-w-md text-gray-200 text-center mx-auto"
                  >
                    <h2 className="text-xl font-semibold mb-4">Styling Tips:</h2>
                    <ul className="space-y-2">
                      {stylingAdvice.map((advice, index) => (
                        <li key={index}>{advice}</li>
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
                    className="absolute top-6 left-0 right-0 p-6 bg-gray-800 shadow-lg rounded-xl w-full max-w-md text-gray-200 text-center mx-auto"
                  >
                    <h2 className="text-xl font-semibold mb-4">Recommended Items:</h2>
                    <div className="space-y-4">
                      {purchaseRecommendations.map((recommendation, index) => (
                        <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => handleRecommendationClick(index, recommendation)}
                            className="w-full p-4 text-left hover:bg-gray-600 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-white">{recommendation.item}</h3>
                            <p className="text-gray-300 text-sm mt-1">{recommendation.description}</p>
                          </button>
                          
                          <AnimatePresence>
                            {expandedRecommendation === index && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-gray-800">
                                  {recommendationResults[index] ? (
                                    <div className="grid grid-cols-1 gap-4">
                                      {recommendationResults[index].map((result, resultIndex) => (
                                        <div
                                          key={resultIndex}
                                          className="flex flex-col p-4 bg-gray-700 rounded-lg relative"
                                        >
                                          <a
                                            href={result.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center hover:bg-gray-600 transition-colors rounded-lg p-2 mb-8"
                                          >
                                            <img
                                              src={result.image_url}
                                              alt={result.title}
                                              className="w-20 h-20 object-cover rounded-md mr-4"
                                            />
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-white">{result.title}</h4>
                                              <p className="text-green-400 font-bold">{result.price}</p>
                                              <p className="text-sm text-gray-300">{result.seller}</p>
                                            </div>
                                          </a>
                                          
                                          {/* Try On Button */}
                                          <button
                                            onClick={() => handleTryOn(result.image_url, result.link)}
                                            className="absolute bottom-3 right-3 bg-white hover:bg-gray-100 
                                                      text-gray-800 px-3 py-2 rounded-md text-sm font-medium
                                                      flex items-center gap-2 shadow-lg transition-all
                                                      hover:scale-105 active:scale-95 border border-gray-200"
                                            disabled={tryOnState.status === 'processing'}
                                          >
                                            {tryOnState.status === 'processing' && tryOnState.itemId === result.link ? (
                                              <>
                                                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                                                <span>Processing...</span>
                                              </>
                                            ) : (
                                              <>
                                                <svg 
                                                  className="w-4 h-4" 
                                                  fill="none" 
                                                  stroke="currentColor" 
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                    strokeWidth={2} 
                                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                                  />
                                                </svg>
                                                <span>Try On</span>
                                              </>
                                            )}
                                          </button>

                                          {/* Try-on Result Modal */}
                                          {tryOnState.status === 'completed' && tryOnState.itemId === result.link && (
                                            <div 
                                              className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
                                              onClick={() => setTryOnState({ itemId: null, status: 'idle', result: null })}
                                            >
                                              <div 
                                                className="bg-white rounded-lg p-6 max-w-2xl mx-4 relative"
                                                onClick={e => e.stopPropagation()}
                                              >
                                                <button 
                                                  onClick={() => setTryOnState({ itemId: null, status: 'idle', result: null })}
                                                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                                  aria-label="Close modal"
                                                >
                                                  <svg 
                                                    className="w-6 h-6" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path 
                                                      strokeLinecap="round" 
                                                      strokeLinejoin="round" 
                                                      strokeWidth={2} 
                                                      d="M6 18L18 6M6 6l12 12"
                                                    />
                                                  </svg>
                                                </button>
                                                
                                                <img 
                                                  src={tryOnState.result} 
                                                  alt="Try-on result" 
                                                  className="w-full rounded-lg shadow-lg"
                                                />
                                                
                                                <div className="mt-4 flex justify-end">
                                                  <button 
                                                    onClick={() => setTryOnState({ itemId: null, status: 'idle', result: null })}
                                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 
                                                              rounded-md font-medium transition-colors"
                                                  >
                                                    Close
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex justify-center items-center h-20">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty States */}
              <AnimatePresence mode="wait">
                {activeTab === "styling" && !loading && !error && stylingAdvice.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-6 left-0 right-0 p-6 bg-gray-800 shadow-lg rounded-xl w-full max-w-md text-gray-200 text-center mx-auto"
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
                    className="absolute top-6 left-0 right-0 p-6 bg-gray-800 shadow-lg rounded-xl w-full max-w-md text-gray-200 text-center mx-auto"
                  >
                    <p>Upload and analyze an outfit to get purchase recommendations!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}