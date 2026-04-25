import React, { useEffect, useState } from 'react';
import { logementController } from '@algbnb/core';

export const LocationSearchInput = ({ value, onChange, onSelect, placeholder = 'Ville, adresse ou titre' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

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
      } catch (error) {
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

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}
      />

      {(loading || suggestions.length > 0) && (
        <div className="location-suggestions">
          {loading ? (
            <div className="location-suggestion-item">Recherche en cours...</div>
          ) : (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                className="location-suggestion-item"
                onClick={() => {
                  onSelect?.(suggestion);
                  setSuggestions([]);
                }}
              >
                <strong>{suggestion.display_name}</strong>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
