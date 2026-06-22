import { useId, useState } from 'react';
import { useIntl } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

// Input CSS is inlined into the consuming route's style.css via
// postcss-import.

const BLOCK = 'input-component';
const getClasses = getClassMaker(BLOCK);

export default function Autocomplete({
  possibleValues,
  placeholder,
  handleInput,
}: {
  possibleValues: string[];
  placeholder: string;
  handleInput: (value: string) => void;
}) {
  const { formatMessage } = useIntl();
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const inputId = `${reactId}-input`;
  const optionId = (i: number) => `${reactId}-option-${i}`;

  const noMatchesLabel = formatMessage({ id: 'NO_MATCHES_FOUND' });

  const updateSuggestions = (value: string) => {
    if (value.length === 0) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const filtered = possibleValues.filter((suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.length > 0 ? filtered : [noMatchesLabel]);
    setActiveIndex(-1);
  };

  const isNoMatch = (value: string) => value === noMatchesLabel;

  const handleInputChange = (event: { target: { value: string } }) => {
    const { value } = event.target;
    setInputValue(value);
    handleInput(value);
    updateSuggestions(value);
  };

  const selectSuggestion = (value: string) => {
    if (isNoMatch(value)) return;
    setInputValue(value);
    handleInput(value);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    const lastIndex = suggestions.length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Skip the placeholder "no matches" entry — it's the only suggestion in
        // that branch, so cycling lands on it once and that's fine.
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? lastIndex : i - 1));
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          event.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  const isOpen = suggestions.length > 0;

  return (
    <div className={getClasses('wrapper')}>
      <label htmlFor={inputId} className={getClasses('label')}>
        {placeholder}
      </label>
      <input
        id={inputId}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputChange}
        onKeyDown={handleKeyDown}
        className={getClasses()}
        placeholder={placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
      />
      {isOpen && (
        <ul className={getClasses('suggestions-list')} id={listboxId} role="listbox">
          {suggestions.map((suggestion, i) => {
            const isPlaceholder = isNoMatch(suggestion);
            return (
              <li
                key={suggestion}
                id={optionId(i)}
                onClick={isPlaceholder ? undefined : () => selectSuggestion(suggestion)}
                onKeyDown={
                  isPlaceholder
                    ? undefined
                    : (event) => event.key === 'Enter' && selectSuggestion(suggestion)
                }
                role="option"
                aria-selected={inputValue === suggestion || activeIndex === i}
                aria-disabled={isPlaceholder || undefined}
                className={getClasses('suggestion-item', {
                  active: activeIndex === i,
                  empty: isPlaceholder,
                })}
                tabIndex={isPlaceholder ? -1 : 0}
              >
                {suggestion}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
