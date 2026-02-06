"use client";

import { useState } from "react";

// The specific list of genres you requested
const GENRE_LIST = [
  "Action", "Adventure", "Comedy", "Drama", 
  "Fantasy", "Horror", "Science Fiction", 
  "Thriller", "Documentary"
];

export default function Home() {
  const [game, setGame] = useState("");
  
  // CHANGED: Now an array [] to hold multiple genres
  const [selectedGenres, setSelectedGenres] = useState(["Action"]); 
  
  // CHANGED: Numeric state for easier math
  const [episodes, setEpisodes] = useState(7); 
  
  const [loading, setLoading] = useState(false);
  const [seriesData, setSeriesData] = useState(null);

  // LOGIC: Toggle Genre Selection
  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // LOGIC: Episode Counter (Min 5, Max 10)
  const increaseEpisodes = () => {
    if (episodes < 10) setEpisodes(episodes + 1);
  };

  const decreaseEpisodes = () => {
    if (episodes > 5) setEpisodes(episodes - 1);
  };

  const handleGenerate = async () => {
    // Validation: Must select at least one genre
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
        // Send the genres as a joined string (e.g., "Horror, Comedy")
        body: JSON.stringify({ 
          game, 
          genre: selectedGenres.join(", "), 
          episodes 
        }),
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center mb-12">
        <h1 className="text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Series Architect
        </h1>
        <p className="text-gray-400 text-lg">
          Build your next viral playlist in seconds.
        </p>

        <div className="w-full max-w-xl mt-8 space-y-6 bg-gray-900 p-6 rounded-2xl border border-gray-800">
          
          {/* 1. GAME NAME INPUT */}
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

          {/* 2. MULTI-SELECT GENRES */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Genres (Select Multiple)
            </label>
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

          {/* 3. EPISODE COUNTER (+/-) */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Number of Episodes (5-10)
            </label>
            <div className="flex items-center space-x-4 bg-gray-800 p-2 rounded-lg border border-gray-700 w-fit">
              <button 
                onClick={decreaseEpisodes}
                disabled={episodes <= 5}
                className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">{episodes}</span>
              <button 
                onClick={increaseEpisodes}
                disabled={episodes >= 10}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
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
            {/* Show selected genres tag */}
            <div className="mt-4 flex gap-2 justify-center">
               {selectedGenres.map(g => (
                 <span key={g} className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800">{g}</span>
               ))}
            </div>
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