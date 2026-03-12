'use client';

import React, { useState } from 'react';

const UNIT_TITLES = {
    0: "Other",
    1: "Unit 1: Introduction",
    2: "Unit 2: Numerals",
    3: "Unit 3: Arrival",
    4: "Unit 4: Personal Info",
    5: "Unit 5: Conversation",
    6: "Extra Knowledge"
};

export default function ChapterSelector({ chapters, selectedUnit, selectedLesson, onSelectUnit, onSelectLesson }) {
    const [isOpen, setIsOpen] = useState(false);

    const unitMap = {};
    chapters.forEach(word => {
        if (!unitMap[word.unit]) {
            unitMap[word.unit] = new Set();
        }
        unitMap[word.unit].add(word.lessonStr);
    });

    const units = Object.keys(unitMap).map(Number).sort((a, b) => a - b);
    const availableLessons = selectedUnit !== null && unitMap[selectedUnit] ? Array.from(unitMap[selectedUnit]).sort() : [];

    const currentLabel = selectedUnit === 'ALL' ? 'All Units' :
        selectedUnit === 'STARRED' ? '⭐ Starred' :
            (UNIT_TITLES[selectedUnit] || `Unit ${selectedUnit}`) +
            (selectedLesson !== 'ALL' ? ` → ${selectedLesson}` : '');

    const handleUnitSelect = (unit) => {
        onSelectUnit(unit);
        onSelectLesson('ALL');
    };

    const handleLessonSelect = (lesson) => {
        onSelectLesson(lesson);
        setIsOpen(false);
    };

    return (
        <div className="chapter-selector glass-container" style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '12px' }}>
            {/* Collapsible Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                    padding: '0.25rem 0', fontSize: '1rem', fontWeight: 600
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📖 {currentLabel}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: '0.5rem' }}>
                    {isOpen ? '▲' : '▼'}
                </span>
            </button>

            {/* Expandable Content */}
            {isOpen && (
                <div style={{ marginTop: '1rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>Select Unit</h3>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => handleUnitSelect('ALL')}
                            className={`btn ${selectedUnit === 'ALL' ? '' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleUnitSelect('STARRED')}
                            className={`btn ${selectedUnit === 'STARRED' ? '' : 'btn-secondary'}`}
                            style={{ borderRadius: '20px', padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: selectedUnit === 'STARRED' ? '#fff' : '#fbbf24', borderColor: '#fbbf24', backgroundColor: selectedUnit === 'STARRED' ? '#fbbf24' : 'transparent' }}
                        >
                            ⭐
                        </button>
                        {units.map(unit => (
                            <button
                                key={unit}
                                onClick={() => handleUnitSelect(unit)}
                                className={`btn ${selectedUnit === unit ? '' : 'btn-secondary'}`}
                                style={{ borderRadius: '20px', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            >
                                {UNIT_TITLES[unit] || `Unit ${unit}`}
                            </button>
                        ))}
                    </div>

                    {selectedUnit !== 'ALL' && availableLessons.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Select Lesson</h3>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => handleLessonSelect('ALL')}
                                    className={`btn ${selectedLesson === 'ALL' ? '' : 'btn-secondary'}`}
                                    style={{ borderRadius: '12px', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                                >
                                    All
                                </button>
                                {availableLessons.map(lesson => (
                                    <button
                                        key={lesson}
                                        onClick={() => handleLessonSelect(lesson)}
                                        className={`btn ${selectedLesson === lesson ? '' : 'btn-secondary'}`}
                                        style={{ borderRadius: '12px', padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}
                                    >
                                        {lesson}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
