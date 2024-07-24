import { useState } from 'react';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

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
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleInputChange = (event: { target: { value: string } }) => {
    const value = event.target.value;
    setInputValue(value);
    handleInput(inputValue);
    if (value.length > 0) {
      const filteredSuggestions = possibleValues.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions.length > 0 ? filteredSuggestions : ['No matches found']);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (value: string) => {
    setInputValue(value);
    setSuggestions([]);
  };

  return (
    <div className={getClasses('wrapper')}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        className={getClasses()}
        placeholder={placeholder}
        aria-autocomplete="list"
        aria-controls="autocomplete-list"
      />
      {suggestions.length > 0 && (
        <ul className={getClasses('suggestions-list')}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              onKeyDown={(event) => event.keyCode === 13 && handleSuggestionClick(suggestion)}
              role="option"
              className={getClasses('suggestion-item')}
              tabIndex={0}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
