'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function MentionTextarea({ value, onChange, projects = [], placeholder, rows = 3, id, onImagePaste }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);
  const mentionStartRef = useRef(-1);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const insertMention = useCallback((project) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = mentionStartRef.current;
    const cursorPos = textarea.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(cursorPos);
    const newValue = `${before}@${project.name} ${after}`;

    onChange(newValue);
    setShowDropdown(false);
    setFilter('');

    // Restore cursor position
    setTimeout(() => {
      const newPos = start + project.name.length + 2;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  }, [value, onChange]);

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.min(prev + 1, filteredProjects.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && showDropdown) {
      e.preventDefault();
      if (filteredProjects[highlightedIdx]) {
        insertMention(filteredProjects[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleInput = (e) => {
    const newValue = e.target.value;
    onChange(newValue);

    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const textBefore = newValue.substring(0, cursorPos);

    // Check for @ trigger
    const lastAt = textBefore.lastIndexOf('@');
    if (lastAt >= 0) {
      const afterAt = textBefore.substring(lastAt + 1);
      // Only trigger if @ is at start or preceded by whitespace/newline
      const charBefore = lastAt > 0 ? textBefore[lastAt - 1] : ' ';
      if (/[\s\n]/.test(charBefore) || lastAt === 0) {
        if (!afterAt.includes(' ') || afterAt.split(' ').length <= 3) {
          mentionStartRef.current = lastAt;
          setFilter(afterAt);
          setShowDropdown(true);
          setHighlightedIdx(0);

          // Calculate dropdown position
          const lineHeight = 24;
          const lines = textBefore.split('\n');
          const currentLine = lines.length;
          const top = currentLine * lineHeight + 8;
          setDropdownPos({ top, left: 16 });
          return;
        }
      }
    }
    setShowDropdown(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e) => {
      if (!e.target.closest('.mention-wrapper')) setShowDropdown(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showDropdown]);

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default text paste if it's an image
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          if (onImagePaste) onImagePaste(event.target.result);
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
  };

  return (
    <div className="mention-wrapper">
      <textarea
        ref={textareaRef}
        className="mention-textarea"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        id={id}
      />

      {showDropdown && filteredProjects.length > 0 && (
        <div className="mention-dropdown" style={{ top: dropdownPos.top, left: dropdownPos.left }}>
          {filteredProjects.map((project, idx) => (
            <div
              key={project.id}
              className={`mention-item ${idx === highlightedIdx ? 'highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(project);
              }}
              onMouseEnter={() => setHighlightedIdx(idx)}
            >
              <span className="mention-dot" style={{ background: project.color }} />
              <span>{project.name}</span>
              <span className="mention-team">{project.teamName || ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
