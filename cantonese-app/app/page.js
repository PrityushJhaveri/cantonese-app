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

  const [stats, setStats] = useState({ new: 0, learning: 0, mastered: 0 });
  const [roundFinished, setRoundFinished] = useState(false);

  useEffect(() => {
    let words = chaptersData;

    if (selectedUnit === 'STARRED') {
      words = words.filter(w => isStarred(getWordId(w)));
    } else {
      if (selectedUnit !== 'ALL') {
        words = words.filter(w => w.unit === selectedUnit);
      }
      if (selectedLesson !== 'ALL') {
        words = words.filter(w => w.lessonStr === selectedLesson);
      }
    }

    const sortedWords = sortWordsBySRS(words);
    setActiveWords(sortedWords);
    setCurrentWordIndex(0);
    setRoundFinished(false);
    calculateStats(sortedWords);
  }, [selectedUnit, selectedLesson]);

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
    const sortedWords = sortWordsBySRS(activeWords);
    setActiveWords(sortedWords);
    setCurrentWordIndex(0);
    setRoundFinished(false);
    calculateStats(sortedWords);
  };

  return (
    <div className="main-content">
      <main>
        {/* Compact header */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem', padding: '0.5rem 0' }}>
          <h1 style={{ fontSize: '1.4rem', color: 'var(--accent-color)', marginBottom: '0.25rem' }}>
            廣東話 AI Learning
          </h1>
        </div>

        {/* Chapter Selector (collapsible) */}
        <ChapterSelector
          chapters={chaptersData}
          selectedUnit={selectedUnit}
          selectedLesson={selectedLesson}
          onSelectUnit={setSelectedUnit}
          onSelectLesson={setSelectedLesson}
        />

        {/* Progress bar */}
        {activeWords.length > 0 && !roundFinished && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
              <span style={{ color: '#8b949e' }}>
                {currentWordIndex + 1} / {activeWords.length}
              </span>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#8b949e' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#8b949e', marginRight: '3px' }}></span>
                  {stats.new}
                </span>
                <span style={{ color: '#f59e0b' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', marginRight: '3px' }}></span>
                  {stats.learning}
                </span>
                <span style={{ color: '#22c55e' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', marginRight: '3px' }}></span>
                  {stats.mastered}
                </span>
              </div>
            </div>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${(stats.mastered / activeWords.length) * 100}%`, backgroundColor: '#22c55e', transition: 'width 0.3s' }}></div>
              <div style={{ width: `${(stats.learning / activeWords.length) * 100}%`, backgroundColor: '#f59e0b', transition: 'width 0.3s' }}></div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {activeWords.length > 0 ? (
          roundFinished ? (
            <div className="glass-container" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: 'var(--accent-color)' }}>Round Complete! 🎉</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                You studied {activeWords.length} words.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: '#22c55e', fontWeight: 'bold' }}>{stats.mastered}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Mastered</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: '#f59e0b', fontWeight: 'bold' }}>{stats.learning}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Learning</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', color: '#8b949e', fontWeight: 'bold' }}>{stats.new}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>New</div>
                </div>
              </div>
              <button className="btn" onClick={restartRound} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                Review & Continue
              </button>
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
          <div className="glass-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p>No vocabulary found for this selection.</p>
          </div>
        )}
      </main>
    </div>
  );
}
