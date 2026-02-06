"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";

const GENRE_LIST = [
  "Action", "Adventure", "Comedy", "Drama", 
  "Fantasy", "Horror", "Science Fiction", 
  "Thriller", "Documentary"
];

export default function Home() {
  const [game, setGame] = useState("");
  const [selectedGenres, setSelectedGenres] = useState(["Action"]); 
  const [episodes, setEpisodes] = useState(7); 
  const [loading, setLoading] = useState(false);
  const [seriesData, setSeriesData] = useState(null);

  // --- PAYMENT & EMAIL STATES ---
  const [showPaywall, setShowPaywall] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [email, setEmail] = useState(""); // NEW: Holds the user's email

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const increaseEpisodes = () => { if (episodes < 10) setEpisodes(episodes + 1); };
  const decreaseEpisodes = () => { if (episodes > 5) setEpisodes(episodes - 1); };

  const handleGenerate = async () => {
    if (selectedGenres.length === 0) {
      alert("Please select at least one genre!");
      return;
    }
    setLoading(true);
    setSeriesData(null);
    setIsUnlocked(false);
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game, genre: selectedGenres.join(", "), episodes }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSeriesData(data);

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: HANDLE EMAIL & FAKE PAYMENT ---
  const handleFakePayment = async () => {
    // 1. Validate Email
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address to unlock.");
      return;
    }

    setProcessingPayment(true);
    
    // 2. Send Email to your "Recorder" API (Background)
    try {
      await fetch("/api/record-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, game }),
      });
    } catch (err) {
      console.error("Failed to record email", err);
    }

    // 3. Simulate Payment Delay
    setTimeout(() => {
      setProcessingPayment(false);
      setIsUnlocked(true);
      setShowPaywall(false);
      
      generatePDF(); 
      
      alert(`Success! sent to ${email}. (Test Mode: No charge made)`);
    }, 2000);
  };

  const handleDownloadClick = () => {
    if (isUnlocked) {
      generatePDF();
    } else {
      setShowPaywall(true);
    }
  };

  const generatePDF = () => {
    if (!seriesData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 255);
    const titleLines = doc.splitTextToSize(seriesData.series_title, contentWidth);
    doc.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 10) + 10;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    const loglineLines = doc.splitTextToSize(`"${seriesData.series_logline}"`, contentWidth);
    doc.text(loglineLines, margin, yPos);
    yPos += (loglineLines.length * 7) + 15;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    seriesData.episodes.forEach((ep) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Episode ${ep.episode_number}: ${ep.title}`, margin, yPos);
      yPos += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("THUMBNAIL CONCEPT:", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const visualLines = doc.splitTextToSize(ep.visual_concept, contentWidth);
      doc.text(visualLines, margin, yPos);
      yPos += (visualLines.length * 5) + 5;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("STORY HOOK:", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const storyLines = doc.splitTextToSize(ep.story_beat, contentWidth);
      doc.text(storyLines, margin, yPos);
      yPos += (storyLines.length * 5) + 15;
    });

    doc.save(`${seriesData.series_title.replace(/\s+/g, '_')}_Bible.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 relative">
      
      {/* --- EMAIL & PAYWALL MODAL --- */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up">
            
            <button 
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Unlock Series Bible</h3>
              <p className="text-gray-400 mb-6">
                Enter your email to download the full blueprint.
              </p>

              <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                {/* --- NEW: EMAIL INPUT --- */}
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Price</span>
                  <span className="text-white font-bold">$2.99</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-400">Beta Discount</span>
                  <span className="text-green-400">-$2.99</span>
                </div>
                <div className="h-px bg-gray-700 my-3"></div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>$0.00</span> 
                </div>
              </div>

              <button
                onClick={handleFakePayment}
                disabled={processingPayment}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg transition-all flex justify-center items-center"
              >
                {processingPayment ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                ) : (
                  "Unlock Now"
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-4">
                We'll email you the PDF instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN APP CONTENT --- */}
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center mb-12">
        <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Series Architect
        </h1>
        <p className="text-gray-400 text-lg">Build your next viral playlist in seconds.</p>

        <div className="w-full max-w-xl mt-8 space-y-6 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Game Name</label>
            <input
              type="text"
              placeholder="e.g. Minecraft, Elden Ring, GTA"
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={game}
              onChange={(e) => setGame(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Genres (Select Multiple)</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_LIST.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    selectedGenres.includes(g)
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Number of Episodes (5-10)</label>
            <div className="flex items-center space-x-4 bg-gray-800 p-2 rounded-lg border border-gray-700 w-fit">
              <button onClick={decreaseEpisodes} disabled={episodes <= 5} className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-xl font-bold disabled:opacity-30">-</button>
              <span className="text-2xl font-bold w-12 text-center">{episodes}</span>
              <button onClick={increaseEpisodes} disabled={episodes >= 10} className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-xl font-bold disabled:opacity-30">+</button>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !game || selectedGenres.length === 0}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-bold text-lg transition-all disabled:opacity-50 mt-4 shadow-lg"
          >
            {loading ? "Architecting Unique Story..." : "Generate Series Blueprint"}
          </button>
        </div>
      </div>

      {seriesData && (
        <div className="max-w-5xl mx-auto animate-fade-in-up pb-20">
          <div className="mb-10 text-center p-8 bg-gradient-to-br from-gray-900 to-blue-900/20 rounded-3xl border border-blue-500/30">
            <h2 className="text-4xl font-bold text-white mb-4">{seriesData.series_title}</h2>
            <p className="text-xl text-blue-200 italic">"{seriesData.series_logline}"</p>
            
            <div className="mt-4 flex gap-2 justify-center mb-6">
               {selectedGenres.map(g => (
                 <span key={g} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800">{g}</span>
               ))}
            </div>

            <button 
              onClick={handleDownloadClick}
              className={`px-6 py-2 ${isUnlocked ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"} text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2 mx-auto`}
            >
              {isUnlocked ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download Series Bible (PDF)
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Unlock Series Bible
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {seriesData.episodes.map((ep, index) => (
              <div key={index} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all duration-300">
                <div className="aspect-video w-full bg-gray-800 relative overflow-hidden group">
                  <img 
                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(ep.visual_concept.slice(0, 100))}?width=800&height=450&nologo=true&seed=${index}${Date.now()}`}
                    alt={ep.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy" 
                  />
                  <div className="absolute top-2 left-2 bg-black/70 px-3 py-1 rounded text-xs font-bold text-white backdrop-blur-sm">
                    EP {ep.episode_number}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 leading-tight">{ep.title}</h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-blue-400 font-semibold uppercase text-xs tracking-wider">Visual Concept</span>
                      <p className="text-gray-400 mt-1 text-sm">{ep.visual_concept}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-purple-400 font-semibold uppercase text-xs tracking-wider">The Hook</span>
                      <p className="text-gray-300 mt-1 leading-relaxed">{ep.story_beat}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
