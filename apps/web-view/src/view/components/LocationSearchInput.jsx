import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { logementController } from '@algbnb/core';

export const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const getSuggestionSearchValue = (suggestion) => {
  const address = suggestion?.address || {};
  return normalizeSearchText(
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.city_district ||
    suggestion?.display_name?.split(',')?.[0] ||
    address.county ||
    address.state ||
    ''
  );
};

export const LocationSearchInput = ({ value, onChange, onSelect, placeholder = 'Ville, adresse ou titre' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const rootRef = useRef(null);
  const dropdownRef = useRef(null);
  const isOpen = loading || suggestions.length > 0;

  const updateDropdownPosition = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDropdownPosition({
      top: rect.bottom + 10,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const query = value.trim();
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await logementController.rechercherLieux(query);
        if (!cancelled) {
          setSuggestions(Array.isArray(results) ? results : []);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(run, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target) || dropdownRef.current?.contains(event.target)) {
        return;
      }
      setSuggestions([]);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  const dropdown = isOpen && dropdownPosition && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={dropdownRef}
          className="location-suggestions"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {loading ? (
            <div className="location-suggestion-item">Recherche en cours...</div>
          ) : (
            suggestions.map((suggestion) => {
              const searchValue = getSuggestionSearchValue(suggestion);
              const displayLabel = suggestion.display_name || searchValue;
              return (
                <button
                  key={suggestion.place_id}
                  type="button"
                  className="location-suggestion-item"
                  onClick={() => {
                    onSelect?.({ ...suggestion, searchValue, displayLabel });
                    setSuggestions([]);
                  }}
                >
                  <strong>{searchValue || displayLabel}</strong>
                  {displayLabel && displayLabel !== searchValue ? <span>{displayLabel}</span> : null}
                </button>
              );
            })
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={rootRef} className={isOpen ? 'location-search-root location-search-root-open' : 'location-search-root'}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={updateDropdownPosition}
        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}
      />
      {dropdown}
    </div>
  );
};
