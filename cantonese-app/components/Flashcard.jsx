'use client';

import React, { useState, useEffect } from 'react';
import { updateMastery, getWordId, toggleStar, isStarred } from '../lib/srs';

export default function Flashcard({ word, onNext, onPrev, activeWords = [] }) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [starred, setStarred] = useState(false);

    // Generative AI State
    const [examples, setExamples] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loadingExamples, setLoadingExamples] = useState(false);
    const [loadingExplanation, setLoadingExplanation] = useState(false);

    // Test Mode State
    const [testMode, setTestMode] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [grading, setGrading] = useState(false);
    const [testFeedback, setTestFeedback] = useState(null);

    // Reset state when word changes
    useEffect(() => {
        resetCard();
    }, [word.jyutping, word.english]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in the text input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                resetCard();
                onNext();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                resetCard();
                onPrev();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!isRevealed && !testMode) {
                    setIsRevealed(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRevealed, testMode, onNext, onPrev]);

    const resetCard = () => {
        setIsRevealed(false);
        setExamples(null);
        setExplanation(null);
        setUserInput('');
        setTestFeedback(null);
        setStarred(isStarred(getWordId(word)));
        if (testMode) {
            initTestData();
        }
    };

    const initTestData = () => {
        setUserInput('');
    };

    const handleReveal = () => {
        setIsRevealed(true);
    };

    const handleStar = (e) => {
        e.stopPropagation();
        setStarred(toggleStar(getWordId(word)));
    };

    const handleResult = (e, isKnown) => {
        e.stopPropagation();
        updateMastery(getWordId(word), isKnown);
        resetCard();
        onNext();
    };

    const handleSkip = (e) => {
        e.stopPropagation();
        resetCard();
        onNext();
    }

    const handlePrev = (e) => {
        e.stopPropagation();
        resetCard();
        onPrev();
    }

    const toggleTestMode = (e) => {
        e.stopPropagation();
        const nextTestMode = !testMode;
        setTestMode(nextTestMode);
        resetCard();
        if (nextTestMode) {
            initTestData();
        }
    }

    const playAudio = (e) => {
        if (e) e.stopPropagation();
        if (!('speechSynthesis' in window)) {
            alert('Your browser does not support text-to-speech.');
            return;
        }

        setIsPlaying(true);
        // Use Cantonese Text-to-Speech
        const utterance = new SpeechSynthesisUtterance(word.cantonese);
        utterance.lang = 'zh-HK';
        utterance.rate = 0.8;

        utterance.onend = () => setIsPlaying(false);

        window.speechSynthesis.cancel(); // cancel any currently playing
        window.speechSynthesis.speak(utterance);
    };

    const submitDontKnow = (e) => {
        if (e) e.stopPropagation();
        setGrading(true);

        const correctTones = word.jyutping.match(/\d/g)?.join('') || '';

        setTestFeedback({
            isCorrect: false,
            feedback: `The correct tones were: ${correctTones.split('').join(' ')}`
        });

        setIsRevealed(true);
        updateMastery(getWordId(word), false);
        setGrading(false);
    };

    const submitAnswer = (e) => {
        if (e) e.stopPropagation();
        if (!userInput.trim()) return;

        setGrading(true);

        const correctTones = word.jyutping.match(/\d/g)?.join('') || '';
        const userTones = userInput.replace(/\D/g, '');

        const isCorrect = correctTones === userTones;

        setTestFeedback({
            isCorrect,
            feedback: isCorrect ? "Perfect tones!" : `The correct tones were: ${correctTones.split('').join(' ')}`
        });

        setIsRevealed(true);
        updateMastery(getWordId(word), isCorrect);
        setGrading(false);
    }

    const generateExamples = async (e) => {
        if (e) e.stopPropagation();
        if (examples) return; // already loaded
        setLoadingExamples(true);
        try {
            const res = await fetch('/api/generate-example', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ word })
            });
            const data = await res.json();
            if (data.examples) {
                setExamples(data.examples);
            } else {
                alert(data.error || 'Failed to generate examples');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to AI service');
        } finally {
            setLoadingExamples(false);
        }
    };

    const explainNuance = async (e) => {
        if (e) e.stopPropagation();
        if (explanation) return;
        setLoadingExplanation(true);
        try {
            const res = await fetch('/api/explain-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: word })
            });
            const data = await res.json();
            if (data.explanation) {
                setExplanation(data.explanation);
            } else {
                alert(data.error || 'Failed to explain nuance');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to AI service');
        } finally {
            setLoadingExplanation(false);
        }
    };

    return (
        <div className="flashcard-container glass-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', height: '650px', overflowY: 'auto', position: 'relative' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{word.lessonStr} • Word {word.number}</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: testMode ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={testMode} onChange={toggleTestMode} style={{ width: '18px', height: '18px' }} />
                        Test Mode
                    </label>
                    <button
                        onClick={handleStar}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s', transform: starred ? 'scale(1.1)' : 'scale(1)' }}
                        title={starred ? "Unstar word" : "Star word"}
                    >
                        {starred ? '⭐' : '☆'}
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s ease' }}>

                {/* PROMPT SECTION */}
                {!testMode ? (
                    // Study Mode Prompt: Show English, ask for Jyutping internally
                    <>
                        <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-color)' }}>{word.english}</h2>
                        {word.pos && (
                            <span style={{ background: 'var(--bg-secondary)', padding: '0.35rem 1rem', borderRadius: '12px', fontSize: '1rem', color: 'var(--accent-color)', marginBottom: '2rem' }}>
                                {word.pos}
                            </span>
                        )}
                    </>
                ) : (
                    // Test Mode Prompt: Tone Testing
                    <div style={{ width: '100%', maxWidth: '600px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '1.2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span>What are the tones for:</span>
                            <strong style={{ color: 'var(--text-color)', marginTop: '0.5rem', fontSize: '1.5rem' }}>{word.english}</strong>
                        </h3>
                        <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '2px' }}>
                            {word.jyutping.replace(/\d/g, '_')}
                        </h1>

                        {!isRevealed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    placeholder="Type tones (e.g. 1 4)"
                                    onKeyDown={e => e.key === 'Enter' && submitAnswer(e)}
                                    style={{
                                        width: '100%', maxWidth: '300px', padding: '1rem', fontSize: '1.5rem', borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white',
                                        textAlign: 'center', letterSpacing: '8px'
                                    }}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                    <button className="btn btn-secondary" onClick={submitDontKnow} disabled={grading} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
                                        Don't Know (Reveal)
                                    </button>
                                    <button className="btn" onClick={submitAnswer} disabled={grading || !userInput.trim()} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
                                        {grading ? 'Grading...' : 'Submit'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* REVEALED SECTION */}
                {!isRevealed && !testMode ? (
                    <button className="btn btn-secondary" onClick={handleReveal} style={{ padding: '1rem 3rem', fontSize: '1.2rem', marginTop: '2rem' }}>
                        Show Answer
                    </button>
                ) : isRevealed && (
                    <div style={{ width: '100%', animation: 'fadeIn 0.4s ease-out' }}>
                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

                        {/* Test Feedback Area */}
                        {testFeedback && (
                            <div style={{
                                width: '100%', padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px',
                                backgroundColor: testFeedback.isCorrect ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${testFeedback.isCorrect ? '#22c55e' : '#ef4444'}`
                            }}>
                                <h3 style={{ color: testFeedback.isCorrect ? '#22c55e' : '#ef4444', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                                    {testFeedback.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                                </h3>
                                <p style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{testFeedback.feedback}</p>
                            </div>
                        )}

                        {/* Core Answer */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                {word.jyutping}
                            </h1>
                            {testMode && (
                                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                                    {word.english}
                                </h1>
                            )}

                            {word.notes && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontStyle: 'italic', marginTop: '1rem' }}>
                                    {word.notes}
                                </p>
                            )}
                        </div>

                        {/* Generative AI Features */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" onClick={generateExamples} disabled={loadingExamples} style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
                                ✨ {loadingExamples ? 'Generating...' : 'Examples'}
                            </button>
                            <button className="btn btn-secondary" onClick={explainNuance} disabled={loadingExplanation} style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                                🧠 {loadingExplanation ? 'Thinking...' : 'Nuance'}
                            </button>
                            <button className="btn btn-secondary" onClick={playAudio} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                {isPlaying ? 'Playing...' : 'Pronounce'}
                            </button>
                        </div>

                        {/* AI Output Area */}
                        <div style={{ width: '100%', textAlign: 'left', marginBottom: '2rem' }}>
                            {examples && (
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #38bdf8' }}>
                                    <h4 style={{ color: '#38bdf8', marginBottom: '1rem' }}>Example Sentences</h4>
                                    <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                        {examples.map((ex, i) => (
                                            <li key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: i < examples.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                                <div style={{ color: 'var(--accent-color)', fontSize: '1.3rem', marginBottom: '0.2rem' }}>{ex.jyutping}</div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>{ex.english}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {explanation && (
                                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', borderLeft: '4px solid #a855f7' }}>
                                    <h4 style={{ color: '#a855f7', marginBottom: '0.5rem' }}>Usage & Nuance</h4>
                                    <div style={{ color: 'var(--text-color)', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                                        {explanation}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Assessment Controls - ONLY showed in Study Mode or if explicitly revealed via test */}
                        {(!testMode || testFeedback === null) && (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                                <button className="btn btn-secondary" style={{ flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }} onClick={(e) => handleResult(e, false)}>
                                    Forgot ❌
                                </button>
                                <button className="btn" style={{ flex: 1, backgroundColor: 'rgba(34, 197, 94, 0.2)' }} onClick={(e) => handleResult(e, true)}>
                                    Got it ✅
                                </button>
                            </div>
                        )}
                        {testMode && testFeedback !== null && (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                                <button className="btn" style={{ flex: 1 }} onClick={handleSkip}>
                                    Next Word ➡️
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button className="btn btn-secondary" onClick={handlePrev} style={{ padding: '0.5rem 1rem' }}>&larr; Prev</button>
                <button className="btn btn-secondary" onClick={handleSkip} style={{ padding: '0.5rem 1rem' }}>Skip &rarr;</button>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
