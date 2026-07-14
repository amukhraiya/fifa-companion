'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields State
  const [language, setLanguage] = useState('en');
  const [favoriteTeam, setFavoriteTeam] = useState('');
  const [favoritePlayers, setFavoritePlayers] = useState('');
  const [budget, setBudget] = useState('2000');
  const [travelStyle, setTravelStyle] = useState('Balanced');
  const [foodPreference, setFoodPreference] = useState('No restrictions');
  const [seatPreference, setSeatPreference] = useState('Category 2');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState('None');
  const [matchInterests, setMatchInterests] = useState<string[]>([]);
  const [groupType, setGroupType] = useState('Balanced');

  // Accessibility Focus Reference
  const containerRef = useRef<HTMLDivElement>(null);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  // Manage focus between wizard slide movements
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [step]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleMatchInterest = (interest: string) => {
    if (matchInterests.includes(interest)) {
      setMatchInterests(matchInterests.filter((i) => i !== interest));
    } else {
      setMatchInterests([...matchInterests, interest]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Session expired. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      const playersArray = favoritePlayers
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const payload = {
        language,
        favoriteTeam: favoriteTeam || null,
        favoritePlayers: playersArray.length > 0 ? playersArray : null,
        budget: parseFloat(budget) || 0,
        travelStyle,
        foodPreference,
        seatPreference,
        accessibilityNeeds,
        matchInterests: matchInterests.length > 0 ? matchInterests : null,
        groupType,
      };

      const res = await fetch(`${getApiUrl()}/api/v1/users/me/fan-memory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save preferences');
      }

      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = Math.round((step / 4) * 100);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div
        ref={containerRef}
        tabIndex={-1}
        className="w-full max-w-lg p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl focus:outline-none"
        aria-label={`Onboarding Form Step ${step} of 4`}
      >
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Step {step} of 4</span>
            <span className="font-bold">{progressPercentage}% Complete</span>
          </div>
          <div
            className="w-full h-2 bg-slate-850 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Identity & Language */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                Tell us about yourself
              </h2>
              <div>
                <label
                  htmlFor="language-select"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Preferred Language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Select preferred communication language"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="fav-team"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Favorite Team
                </label>
                <input
                  type="text"
                  id="fav-team"
                  value={favoriteTeam}
                  onChange={(e) => setFavoriteTeam(e.target.value)}
                  placeholder="e.g. Argentina, Germany"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Enter your favorite soccer team name"
                />
              </div>

              <div>
                <label
                  htmlFor="fav-players"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Favorite Players (Comma-separated)
                </label>
                <input
                  type="text"
                  id="fav-players"
                  value={favoritePlayers}
                  onChange={(e) => setFavoritePlayers(e.target.value)}
                  placeholder="e.g. Lionel Messi, Jude Bellingham"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Enter comma-separated names of your favorite soccer players"
                />
              </div>
            </div>
          )}

          {/* Step 2: Budget & Travel Style */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                Trip Style & Budget
              </h2>
              <div>
                <label
                  htmlFor="budget-input"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Estimated Trip Budget (USD)
                </label>
                <input
                  type="range"
                  id="budget-input"
                  min="500"
                  max="10000"
                  step="500"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  aria-label="Select trip budget range in USD"
                />
                <span className="block text-sm text-slate-300 mt-2 font-bold">${budget} USD</span>
              </div>

              <div>
                <label
                  htmlFor="travel-style-select"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Travel Style
                </label>
                <select
                  id="travel-style-select"
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Select preferred travel style"
                >
                  <option value="Backpacker">Backpacker (Budget-first)</option>
                  <option value="Balanced">Balanced (Comfort & Value)</option>
                  <option value="Luxury">Luxury (Premium stays)</option>
                  <option value="Family">Family Oriented</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="group-type-select"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Who are you traveling with?
                </label>
                <select
                  id="group-type-select"
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Select travel group arrangement"
                >
                  <option value="Solo">Solo Traveler</option>
                  <option value="Balanced">Friends / Group</option>
                  <option value="Family">Family / Kids</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Match Tickets & Dining */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                Seat & Dining Preferences
              </h2>
              <div>
                <label
                  htmlFor="seat-select"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Preferred Seating Category
                </label>
                <select
                  id="seat-select"
                  value={seatPreference}
                  onChange={(e) => setSeatPreference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Select match seating category"
                >
                  <option value="Category 3">Category 3 (Behind the goals)</option>
                  <option value="Category 2">Category 2 (Corners)</option>
                  <option value="Category 1">Category 1 (Sides / Center)</option>
                  <option value="VIP">VIP Hospitality suites</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="food-select"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Food Preference
                </label>
                <select
                  id="food-select"
                  value={foodPreference}
                  onChange={(e) => setFoodPreference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Select catering or food preference"
                >
                  <option value="No restrictions">No restrictions</option>
                  <option value="Halal">Halal</option>
                  <option value="Kosher">Kosher</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Logistics & Accessibility */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent">
                Match Interests & Accessibility
              </h2>
              <div>
                <label
                  htmlFor="accessibility-select"
                  className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >
                  Accessibility Requirements
                </label>
                <select
                  id="accessibility-select"
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
                  aria-label="Select accessibility assistance needs"
                >
                  <option value="None">None</option>
                  <option value="Wheelchair">Wheelchair assistance / seating</option>
                  <option value="Audio Description">Audio match description headset</option>
                  <option value="Easy Access">Easy access seating (limited stairs)</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Match Stages of Interest
                </span>
                <div className="grid grid-cols-2 gap-3" role="group" aria-label="Select match stages of interest">
                  {['GroupStage', 'Knockouts', 'Finals'].map((stage) => {
                    const isSelected = matchInterests.includes(stage);
                    return (
                      <button
                        type="button"
                        key={stage}
                        onClick={() => toggleMatchInterest(stage)}
                        aria-pressed={isSelected}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isSelected
                            ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        {stage}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex space-x-4 pt-4 border-t border-slate-800">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-850 font-bold transition-all text-slate-300"
                aria-label="Return to previous onboarding step"
              >
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-all"
                aria-label="Advance to next onboarding step"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold transition-all disabled:opacity-50"
                aria-label="Submit onboarding form and save Fan DNA preferences"
              >
                {isLoading ? 'Saving Fan DNA...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
