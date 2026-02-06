"use client";

import { useState } from "react";
import { jsPDF } from "jspdf"; // IMPORT THE PDF TOOL

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

  // --- NEW: PDF GENERATION FUNCTION ---
  const handleDownloadPDF = () => {
    if (!seriesData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20; // Vertical cursor position

    // 1. HEADER (Title)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 255); // Blue color
    const titleLines = doc.splitTextToSize(seriesData.series_title, contentWidth);
    doc.text(titleLines, margin, yPos);
    yPos += (titleLines.length * 10) + 10;

    // 2. LOGLINE
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80); // Gray color
    const loglineLines = doc.splitTextToSize(`"${seriesData.series_logline}"`, contentWidth);
    doc.text(loglineLines, margin, yPos);
    yPos += (loglineLines.length * 7) + 15;

    // Divider Line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // 3. EPISODES LOOP
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    seriesData.episodes.forEach((ep) => {
      // Check if we need a new page (if near bottom)
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Episode Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Episode ${ep.episode_number}: ${ep.title}`, margin, yPos);
      yPos += 8;

      // Visual Concept
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100); // Gray
      doc.text("THUMBNAIL CONCEPT:", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0); // Black
      const visualLines = doc.splitTextToSize(ep.visual_concept, contentWidth);
      doc.text(visualLines, margin, yPos);
      yPos += (visualLines.length * 5) + 5;

      // Story Hook
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100); // Gray
      doc.text("STORY HOOK:", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0); // Black
      const storyLines = doc.splitTextToSize(ep.story_beat, contentWidth);
      doc.text(storyLines, margin, yPos);
      yPos += (storyLines.length * 5) + 15; // Extra space between episodes
    });

    // Save the file
    doc.save(`${seriesData.series_title.replace(/\s+/g, '_')}_Bible.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center mb-12">
        <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Series Architect
        </h1>
        <p className="text-gray-400 text-lg">Build your next viral playlist in seconds.</p>

        <div className="w-full max-w-xl mt-8 space-y-6 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          
          {/* INPUTS */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Game Name</label>
            <input
              type="text"
              placeholder="e.g. Minecraft, Elden Ring"
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

      {/* RESULTS SECTION */}
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

            {/* --- NEW DOWNLOAD BUTTON --- */}
            <button 
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-2 mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download Series Bible (PDF)
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