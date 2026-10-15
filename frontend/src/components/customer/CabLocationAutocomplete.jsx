import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Plane, Train, Compass, Check, Search, X, Navigation } from 'lucide-react';

// Comprehensive Goa Locations Database with categories and icons
export const ALL_GOA_PLACES = [
  // Airports & Transit
  { name: 'Manohar Intl Airport, Mopa (GOX)', category: 'Airports & Transit', region: 'North Goa Hub', icon: 'plane', popular: true },
  { name: 'Dabolim International Airport (GOI)', category: 'Airports & Transit', region: 'Central/South Hub', icon: 'plane', popular: true },
  { name: 'Madgaon Railway Station (MAO)', category: 'Airports & Transit', region: 'South Goa Hub', icon: 'train', popular: true },
  { name: 'Thivim Railway Station (THVM)', category: 'Airports & Transit', region: 'North Goa Hub', icon: 'train', popular: true },
  { name: 'Karmali Railway Station (KRMI)', category: 'Airports & Transit', region: 'Central Goa Hub', icon: 'train', popular: false },
  { name: 'Vasco da Gama Railway Station', category: 'Airports & Transit', region: 'Port City Hub', icon: 'train', popular: false },

  // North Goa Coast & Beaches
  { name: 'Candolim Beach', category: 'North Goa Coast', region: 'Coastal Hub', icon: 'beach', popular: true },
  { name: 'Calangute Beach', category: 'North Goa Coast', region: 'Coastal Hub', icon: 'beach', popular: true },
  { name: 'Baga Beach & Tito’s Lane', category: 'North Goa Coast', region: 'Party & Dining Hub', icon: 'beach', popular: true },
  { name: 'Anjuna Beach & Flea Market', category: 'North Goa Coast', region: 'Bohemian Coast', icon: 'beach', popular: true },
  { name: 'Vagator Beach & Chapora Fort', category: 'North Goa Coast', region: 'Cliff & Sunset Hub', icon: 'beach', popular: true },
  { name: 'Morjim Beach (Turtle Beach)', category: 'North Goa Coast', region: 'Serene North Coast', icon: 'beach', popular: true },
  { name: 'Ashvem Beach', category: 'North Goa Coast', region: 'Boutique Resorts', icon: 'beach', popular: false },
  { name: 'Mandrem Beach', category: 'North Goa Coast', region: 'Peaceful Coastal', icon: 'beach', popular: false },
  { name: 'Arambol Beach & Sweet Lake', category: 'North Goa Coast', region: 'Far North Coast', icon: 'beach', popular: true },
  { name: 'Sinquerim Beach (Fort Aguada)', category: 'North Goa Coast', region: 'Heritage Coast', icon: 'beach', popular: false },
  { name: 'Siolim Waterfront', category: 'North Goa Coast', region: 'Chapora Riverfront', icon: 'beach', popular: false },
  { name: 'Querim (Keri) Beach', category: 'North Goa Coast', region: 'Northernmost Coast', icon: 'beach', popular: false },

  // North Goa Cities & Culture
  { name: 'Panaji (Capital / Fontainhas Latin Quarter)', category: 'North Goa Cities', region: 'Capital & Heritage', icon: 'city', popular: true },
  { name: 'Porvorim', category: 'North Goa Cities', region: 'Commercial Center', icon: 'city', popular: false },
  { name: 'Mapusa Market & Bus Stand', category: 'North Goa Cities', region: 'Market Hub', icon: 'city', popular: true },
  { name: 'Old Goa (Basilica of Bom Jesus)', category: 'North Goa Cities', region: 'UNESCO Heritage Hub', icon: 'heritage', popular: true },
  { name: 'Reis Magos Fort & Nerul', category: 'North Goa Cities', region: 'Riverfront Heritage', icon: 'heritage', popular: false },
  { name: 'Aldona Village', category: 'North Goa Cities', region: 'Scenic Countryside', icon: 'city', popular: false },
  { name: 'Bicholim & Mayem Lake', category: 'North Goa Cities', region: 'Inland Hub', icon: 'city', popular: false },

  // South Goa Coast & Luxury Resorts
  { name: 'Colva Beach', category: 'South Goa Coast', region: 'Central South Coast', icon: 'beach', popular: true },
  { name: 'Benaulim Beach', category: 'South Goa Coast', region: 'Water Sports Hub', icon: 'beach', popular: true },
  { name: 'Varca Beach', category: 'South Goa Coast', region: 'Luxury Resort Belt', icon: 'beach', popular: false },
  { name: 'Cavelossim Beach', category: 'South Goa Coast', region: 'Luxury 5-Star Strip', icon: 'beach', popular: true },
  { name: 'Mobor Beach', category: 'South Goa Coast', region: 'Sal River Estuary', icon: 'beach', popular: false },
  { name: 'Majorda Beach', category: 'South Goa Coast', region: 'Resort Beach', icon: 'beach', popular: false },
  { name: 'Betalbatim Beach (Sunset Beach)', category: 'South Goa Coast', region: 'Tranquil Sands', icon: 'beach', popular: false },
  { name: 'Utorda & Arossim Beach', category: 'South Goa Coast', region: 'Resort Coast', icon: 'beach', popular: false },

  // Far South Coast
  { name: 'Palolem Beach', category: 'Far South Coast', region: 'Crescent Bay Hub', icon: 'beach', popular: true },
  { name: 'Agonda Beach', category: 'Far South Coast', region: 'Quiet Turtle Bay', icon: 'beach', popular: true },
  { name: 'Patnem Beach', category: 'Far South Coast', region: 'Scenic Bay', icon: 'beach', popular: false },
  { name: 'Cola Beach & Blue Lagoon', category: 'Far South Coast', region: 'Hidden Lagoon', icon: 'beach', popular: false },
  { name: 'Butterfly Beach', category: 'Far South Coast', region: 'Secluded Bay', icon: 'beach', popular: false },
  { name: 'Cabo de Rama Fort & Cliff', category: 'Far South Coast', region: 'Historic Cliffside', icon: 'heritage', popular: false },
  { name: 'Canacona Town', category: 'Far South Coast', region: 'Market & Transit', icon: 'city', popular: false },

  // Inland South
  { name: 'Margao City (Commercial Capital)', category: 'South Goa Inland', region: 'Commercial Hub', icon: 'city', popular: true },
  { name: 'Ponda (Temples & Spice Plantations)', category: 'South Goa Inland', region: 'Cultural & Spice Hub', icon: 'heritage', popular: true },
  { name: 'Vasco da Gama Port City', category: 'South Goa Inland', region: 'Port & Naval Hub', icon: 'city', popular: false },
  { name: 'Quepem & Sanguem', category: 'South Goa Inland', region: 'Hinterland Nature', icon: 'city', popular: false },
  { name: 'Dudhsagar Waterfalls Entry (Kulem)', category: 'South Goa Inland', region: 'Adventure Hub', icon: 'nature', popular: true }
];

export default function CabLocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search location in Goa...',
  type = 'pickup', // 'pickup' | 'dropoff'
  rightElement = null,
  inputStyle = {},
  className = ''
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync prop changes into internal state
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter recommendations
  const filteredSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      // Return top popular recommendations
      return ALL_GOA_PLACES.filter(p => p.popular).slice(0, 8);
    }

    // Exact and substring search across name, region, and category
    return ALL_GOA_PLACES.filter(place => {
      const name = place.name.toLowerCase();
      const region = place.region.toLowerCase();
      const cat = place.category.toLowerCase();
      return name.includes(q) || region.includes(q) || cat.includes(q);
    }).slice(0, 8);
  }, [inputValue]);

  const handleSelect = (place) => {
    setInputValue(place.name);
    onChange(place.name);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && filteredSuggestions[highlightIndex]) {
        handleSelect(filteredSuggestions[highlightIndex]);
      } else if (filteredSuggestions.length > 0) {
        handleSelect(filteredSuggestions[0]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getPlaceIcon = (item) => {
    if (item.icon === 'plane') return '✈️';
    if (item.icon === 'train') return '🚂';
    if (item.icon === 'beach') return '🏖️';
    if (item.icon === 'heritage') return '🏛️';
    if (item.icon === 'nature') return '🌊';
    return '📍';
  };

  return (
    <div ref={containerRef} className={`position-relative w-100 ${className}`}>
      {/* Input Field */}
      <div className="position-relative d-flex align-items-center">
        <input
          ref={inputRef}
          type="text"
          className="form-control rounded-3 py-2.5 ps-5 pe-4 border-0 text-dark fw-medium"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          style={{
            background: '#f3f4f6',
            fontSize: '14px',
            color: '#111',
            boxShadow: isOpen ? '0 0 0 2px #000' : 'none',
            transition: 'box-shadow 0.15s ease',
            ...inputStyle
          }}
          required
        />

        {/* Clear or right element */}
        {inputValue && (
          <button
            type="button"
            className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted hover-dark p-0 me-3 border-0"
            style={{ textDecoration: 'none', background: 'transparent' }}
            onClick={() => {
              setInputValue('');
              onChange('');
              inputRef.current?.focus();
            }}
            title="Clear"
          >
            <X size={14} color="#6b7280" />
          </button>
        )}

        {rightElement && !inputValue && (
          <div className="position-absolute end-0 top-50 translate-middle-y me-3">
            {rightElement}
          </div>
        )}
      </div>

      {/* Floating Recommendations Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 14px 35px -4px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 9999,
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '6px 0'
          }}
        >
          {/* Header Tag */}
          <div
            style={{
              padding: '6px 14px 4px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#9ca3af',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{inputValue.trim() ? `Recommended for "${inputValue}"` : 'Popular Locations in Goa'}</span>
            <span style={{ fontSize: '10px', fontWeight: 500 }}>{filteredSuggestions.length} places</span>
          </div>

          {/* List of places */}
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((place, idx) => {
              const isSelected = place.name.toLowerCase() === value.toLowerCase();
              const isHighlighted = idx === highlightIndex;

              return (
                <div
                  key={place.name}
                  onClick={() => handleSelect(place)}
                  onMouseEnter={() => setHighlightIndex(idx)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: isHighlighted ? '#f3f4f6' : isSelected ? '#f8fafc' : '#ffffff',
                    borderLeft: isSelected ? '3px solid #000' : '3px solid transparent',
                    transition: 'background 0.1s'
                  }}
                >
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>
                    {getPlaceIcon(place)}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: isSelected ? 700 : 600,
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {place.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginTop: '1px'
                    }}>
                      {place.category} · {place.region}
                    </div>
                  </div>

                  {isSelected && (
                    <Check size={15} color="#10b981" style={{ flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '16px 14px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
              <Compass size={20} className="mb-1 text-muted" />
              <div>No Goa location found matching "{inputValue}"</div>
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                You can still press Enter to use this custom location
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
