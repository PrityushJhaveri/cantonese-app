'use client';

import React, { useState, useEffect } from 'react';
import { updateMastery, getWordId, toggleStar, isStarred } from '../lib/srs';

export default function Flashcard({ word, onNext, onPrev, activeWords = [] }) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [starred, setStarred] = useState(false);

    const [examples, setExamples] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loadingExamples, setLoadingExamples] = useState(false);
    const [loadingExplanation, setLoadingExplanation] = useState(false);

    const [testMode, setTestMode] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [grading, setGrading] = useState(false);
    const [testFeedback, setTestFeedback] = useState(null);

    useEffect(() => {
        resetCard();
    }, [word.jyutping, word.english]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight') { e.preventDefault(); resetCard(); onNext(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); resetCard(); onPrev(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (!isRevealed && !testMode) setIsRevealed(true); }
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
    };

    const handleReveal = () => setIsRevealed(true);
    const handleStar = (e) => { e.stopPropagation(); setStarred(toggleStar(getWordId(word))); };
    const handleResult = (e, isKnown) => { e.stopPropagation(); updateMastery(getWordId(word), isKnown); resetCard(); onNext(); };
    const handleSkip = (e) => { e.stopPropagation(); resetCard(); onNext(); };
    const handlePrev = (e) => { e.stopPropagation(); resetCard(); onPrev(); };

    const toggleTestMode = (e) => {
        e.stopPropagation();
        const next = !testMode;
        setTestMode(next);
        resetCard();
    };

    const playAudio = (e) => {
        if (e) e.stopPropagation();
        if (!('speechSynthesis' in window)) return;
        setIsPlaying(true);
        const utterance = new SpeechSynthesisUtterance(word.cantonese);
        utterance.lang = 'zh-HK';
        utterance.rate = 0.8;
        utterance.onend = () => setIsPlaying(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const submitDontKnow = (e) => {
        if (e) e.stopPropagation();
        const correctTones = word.jyutping.match(/\d/g)?.join('') || '';
        setTestFeedback({ isCorrect: false, feedback: `Correct tones: ${correctTones.split('').join(' ')}` });
        setIsRevealed(true);
        updateMastery(getWordId(word), false);
    };

    const submitAnswer = (e) => {
        if (e) e.stopPropagation();
        if (!userInput.trim()) return;
        const correctTones = word.jyutping.match(/\d/g)?.join('') || '';
        const userTones = userInput.replace(/\D/g, '');
        const isCorrect = correctTones === userTones;
        setTestFeedback({
            isCorrect,
            feedback: isCorrect ? "Perfect tones!" : `Correct tones: ${correctTones.split('').join(' ')}`
        });
        setIsRevealed(true);
        updateMastery(getWordId(word), isCorrect);
    };

    const generateExamples = async (e) => {
        if (e) e.stopPropagation();
        if (examples) return;
        setLoadingExamples(true);
        try {
            const res = await fetch('/api/generate-example', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word }) });
            const data = await res.json();
            if (data.examples) setExamples(data.examples);
        } catch (err) { console.error(err); }
        finally { setLoadingExamples(false); }
    };

    const explainNuance = async (e) => {
        if (e) e.stopPropagation();
        if (explanation) return;
        setLoadingExplanation(true);
        try {
            const res = await fetch('/api/explain-usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: word }) });
            const data = await res.json();
            if (data.explanation) setExplanation(data.explanation);
        } catch (err) { console.error(err); }
        finally { setLoadingExplanation(false); }
    };

    return (
        <div className="glass-container" style={{
            width: '100%', display: 'flex', flexDirection: 'column',
            minHeight: '0', overflowY: 'auto', position: 'relative'
        }}>
            {/* Top bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{word.lessonStr} • #{word.number}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: testMode ? 'var(--accent-color)' : 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <input type="checkbox" checked={testMode} onChange={toggleTestMode} style={{ width: '16px', height: '16px' }} />
                        Tones
                    </label>
                    <button onClick={handleStar} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0' }}>
                        {starred ? '⭐' : '☆'}
                    </button>
                </div>
            </div>

            {/* Card Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                {!testMode ? (
                    <>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>{word.english}</h2>
                        {word.pos && (
                            <span style={{ background: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--accent-color)' }}>
                                {word.pos}
                            </span>
                        )}
                    </>
                ) : (
                    <div style={{ width: '100%' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>What are the tones for:</p>
                        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>{word.english}</p>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '2px' }}>
                            {word.jyutping.replace(/\d/g, '_')}
                        </h1>

                        {!isRevealed && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    placeholder="e.g. 14"
                                    onKeyDown={e => e.key === 'Enter' && submitAnswer(e)}
                                    style={{
                                        width: '100%', maxWidth: '200px', padding: '0.75rem', fontSize: '1.3rem', borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white',
                                        textAlign: 'center', letterSpacing: '6px'
                                    }}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                    <button className="btn btn-secondary" onClick={submitDontKnow} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                                        Reveal
                                    </button>
                                    <button className="btn" onClick={submitAnswer} disabled={!userInput.trim()} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>
                                        Submit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Show Answer button (study mode only) */}
                {!isRevealed && !testMode && (
                    <button className="btn btn-secondary" onClick={handleReveal} style={{ padding: '0.75rem 2rem', fontSize: '1rem', marginTop: '1.5rem' }}>
                        Show Answer
                    </button>
                )}

                {/* Revealed section */}
                {isRevealed && (
                    <div style={{ width: '100%', animation: 'fadeIn 0.3s ease-out' }}>
                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />

                        {testFeedback && (
                            <div style={{
                                width: '100%', padding: '0.75rem', marginBottom: '0.75rem', borderRadius: '10px',
                                backgroundColor: testFeedback.isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                border: `1px solid ${testFeedback.isCorrect ? '#22c55e' : '#ef4444'}`
                            }}>
                                <p style={{ color: testFeedback.isCorrect ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                                    {testFeedback.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                                </p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{testFeedback.feedback}</p>
                            </div>
                        )}

                        <div style={{ marginBottom: '0.75rem' }}>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                                {word.jyutping}
                            </h1>
                            {testMode && (
                                <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{word.english}</p>
                            )}
                        </div>

                        {/* AI + Audio buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" onClick={generateExamples} disabled={loadingExamples} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                ✨ {loadingExamples ? '...' : 'Examples'}
                            </button>
                            <button className="btn btn-secondary" onClick={explainNuance} disabled={loadingExplanation} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                🧠 {loadingExplanation ? '...' : 'Nuance'}
                            </button>
                            <button className="btn btn-secondary" onClick={playAudio} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                🔊 {isPlaying ? '...' : 'Listen'}
                            </button>
                        </div>

                        {/* AI Output */}
                        {examples && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px', marginBottom: '0.5rem', borderLeft: '3px solid #38bdf8', textAlign: 'left' }}>
                                <h4 style={{ color: '#38bdf8', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Examples</h4>
                                {examples.map((ex, i) => (
                                    <div key={i} style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: i < examples.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                        <div style={{ color: 'var(--accent-color)', fontSize: '1rem' }}>{ex.jyutping}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{ex.english}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {explanation && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px', marginBottom: '0.5rem', borderLeft: '3px solid #a855f7', textAlign: 'left' }}>
                                <h4 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Nuance</h4>
                                <div style={{ color: 'var(--text-primary)', lineHeight: '1.5', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{explanation}</div>
                            </div>
                        )}

                        {/* Action buttons */}
                        {(!testMode || testFeedback === null) && (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                                <button className="btn btn-secondary" style={{ flex: 1, backgroundColor: 'rgba(239,68,68,0.2)', padding: '0.6rem' }} onClick={(e) => handleResult(e, false)}>
                                    Forgot ❌
                                </button>
                                <button className="btn" style={{ flex: 1, backgroundColor: 'rgba(34,197,94,0.2)', padding: '0.6rem' }} onClick={(e) => handleResult(e, true)}>
                                    Got it ✅
                                </button>
                            </div>
                        )}
                        {testMode && testFeedback !== null && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button className="btn" style={{ padding: '0.6rem 2rem' }} onClick={handleSkip}>
                                    Next ➡️
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', flexShrink: 0 }}>
                <button className="btn btn-secondary" onClick={handlePrev} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>&larr; Prev</button>
                <button className="btn btn-secondary" onClick={handleSkip} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Skip &rarr;</button>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
