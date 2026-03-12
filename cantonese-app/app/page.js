'use client';

import React, { useState, useEffect } from 'react';
import ChapterSelector from '../components/ChapterSelector';
import Flashcard from '../components/Flashcard';
import chaptersData from '../data/chapters.json';
import { sortWordsBySRS, getMasteryScore, getWordId, isStarred } from '../lib/srs';

export default function Home() {
  const [selectedUnit, setSelectedUnit] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState('ALL');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [activeWords, setActiveWords] = useState([]);

  // Progress tracking
  const [stats, setStats] = useState({ new: 0, learning: 0, mastered: 0 });
  const [roundFinished, setRoundFinished] = useState(false);

  // Load words for the selected unit and lesson
  useEffect(() => {
    let words = chaptersData;

    if (selectedUnit === 'STARRED') {
      // Refresh starred words filtering on load or whenever navigation happens
      words = words.filter(w => isStarred(getWordId(w)));
    } else {
      if (selectedUnit !== 'ALL') {
        words = words.filter(w => w.unit === selectedUnit);
      }
      if (selectedLesson !== 'ALL') {
        words = words.filter(w => w.lessonStr === selectedLesson);
      }
    }

    // Sort words based on SRS mastery (lowest score first)
    const sortedWords = sortWordsBySRS(words);
    setActiveWords(sortedWords);
    setCurrentWordIndex(0);
    setRoundFinished(false);

    // Calculate initial stats
    calculateStats(sortedWords);
  }, [selectedUnit, selectedLesson]);

  // Recalculate stats whenever we move to the next word (this captures updates made inside the Flashcard)
  useEffect(() => {
    if (activeWords.length > 0) {
      calculateStats(activeWords);
    }
  }, [currentWordIndex, activeWords]);

  const calculateStats = (words) => {
    let s = { new: 0, learning: 0, mastered: 0 };
    words.forEach(w => {
      const score = getMasteryScore(getWordId(w));
      if (score === 0) s.new++;
      else if (score >= 4) s.mastered++;
      else s.learning++;
    });
    setStats(s);
  };

  const handleNext = () => {
    if (currentWordIndex + 1 >= activeWords.length) {
      setRoundFinished(true);
    } else {
      setCurrentWordIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (roundFinished) {
      setRoundFinished(false);
      setCurrentWordIndex(activeWords.length - 1);
    } else {
      setCurrentWordIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const restartRound = () => {
    // Re-sort the words with updated SRS scores
    const sortedWords = sortWordsBySRS(activeWords);
    setActiveWords(sortedWords);
    setCurrentWordIndex(0);
    setRoundFinished(false);
    calculateStats(sortedWords);
  };

  return (
    <div className="main-content">
      <main style={{ marginTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--accent-color)' }}>
            大家嘅廣東話 AI Learning App
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Master Cantonese systematically with Spaced Repetition.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left Sidebar */}
          <div style={{ flex: '1 1 300px', maxWidth: '350px' }}>
            <ChapterSelector
              chapters={chaptersData}
              selectedUnit={selectedUnit}
              selectedLesson={selectedLesson}
              onSelectUnit={setSelectedUnit}
              onSelectLesson={setSelectedLesson}
            />
          </div>

          {/* Right Content - Flashcards */}
          <div style={{ flex: '2 1 500px' }}>
            {/* Progress indicator */}
            {activeWords.length > 0 && !roundFinished && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span style={{ color: '#8b949e' }}>Card {currentWordIndex + 1} of {activeWords.length}</span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span style={{ color: '#8b949e' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#8b949e', marginRight: '4px' }}></span>New {stats.new}</span>
                    <span style={{ color: '#f59e0b' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', marginRight: '4px' }}></span>Learning {stats.learning}</span>
                    <span style={{ color: '#22c55e' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', marginRight: '4px' }}></span>Mastered {stats.mastered}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(stats.mastered / activeWords.length) * 100}%`, backgroundColor: '#22c55e', transition: 'width 0.3s' }}></div>
                  <div style={{ width: `${(stats.learning / activeWords.length) * 100}%`, backgroundColor: '#f59e0b', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            )}

            {activeWords.length > 0 ? (
              roundFinished ? (
                <div className="glass-container" style={{ textAlign: 'center', padding: '4rem', height: '650px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-color)' }}>Round Complete! 🎉</h2>
                  <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    You studied {activeWords.length} words.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', color: '#22c55e', fontWeight: 'bold' }}>{stats.mastered}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Mastered</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', color: '#f59e0b', fontWeight: 'bold' }}>{stats.learning}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Learning</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', color: '#8b949e', fontWeight: 'bold' }}>{stats.new}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>New</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={restartRound} style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                      Review & Continue
                    </button>
                  </div>
                </div>
              ) : (
                <Flashcard
                  word={activeWords[currentWordIndex]}
                  onNext={handleNext}
                  onPrev={handlePrev}
                  activeWords={activeWords}
                />
              )
            ) : (
              <div className="glass-container" style={{ textAlign: 'center', padding: '4rem', height: '650px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p>No vocabulary found for this selection.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
