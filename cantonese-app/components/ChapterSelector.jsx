'use client';

import React, { useState } from 'react';

const UNIT_TITLES = {
    0: "Other",
    1: "Unit 1: Introduction",
    2: "Unit 2: Numerals",
    3: "Unit 3: Arrival",
    4: "Unit 4: Personal Information",
    5: "Unit 5: Essential Basic Conversation",
    6: "Extra Knowledge"
};

export default function ChapterSelector({ chapters, selectedUnit, selectedLesson, onSelectUnit, onSelectLesson }) {
    // Determine unique units and their lessons
    const unitMap = {};
    chapters.forEach(word => {
        if (!unitMap[word.unit]) {
            unitMap[word.unit] = new Set();
        }
        unitMap[word.unit].add(word.lessonStr);
    });

    const units = Object.keys(unitMap).map(Number).sort((a, b) => a - b);
    const availableLessons = selectedUnit !== null && unitMap[selectedUnit] ? Array.from(unitMap[selectedUnit]).sort() : [];

    return (
        <div className="chapter-selector glass-container" style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '16px' }}>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>1. Select a Unit</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => { onSelectUnit('ALL'); onSelectLesson('ALL'); }}
                        className={`btn ${selectedUnit === 'ALL' ? '' : 'btn-secondary'}`}
                        style={{ borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                        All Units
                    </button>
                    <button
                        onClick={() => { onSelectUnit('STARRED'); onSelectLesson('ALL'); }}
                        className={`btn ${selectedUnit === 'STARRED' ? '' : 'btn-secondary'}`}
                        style={{ borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.9rem', color: selectedUnit === 'STARRED' ? '#fff' : '#fbbf24', borderColor: '#fbbf24', backgroundColor: selectedUnit === 'STARRED' ? '#fbbf24' : 'transparent' }}
                    >
                        ⭐ Starred Words
                    </button>
                    {units.map(unit => (
                        <button
                            key={unit}
                            onClick={() => { onSelectUnit(unit); onSelectLesson('ALL'); }}
                            className={`btn ${selectedUnit === unit ? '' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        >
                            {UNIT_TITLES[unit] || `Unit ${unit}`}
                        </button>
                    ))}
                </div>
            </div>

            {selectedUnit !== 'ALL' && availableLessons.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1rem' }}>2. Select a Lesson (Optional)</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onSelectLesson('ALL')}
                            className={`btn ${selectedLesson === 'ALL' ? '' : 'btn-secondary'}`}
                            style={{ borderRadius: '12px', padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: selectedLesson === 'ALL' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)' }}
                        >
                            Whole Unit
                        </button>
                        {availableLessons.map(lesson => (
                            <button
                                key={lesson}
                                onClick={() => onSelectLesson(lesson)}
                                className={`btn ${selectedLesson === lesson ? '' : 'btn-secondary'}`}
                                style={{ borderRadius: '12px', padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: selectedLesson === lesson ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)' }}
                            >
                                {lesson}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
