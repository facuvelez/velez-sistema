/**
 * Capitalizes the first letter of each word in a string
 * Useful for names and proper nouns
 * Properly handles Spanish characters including Ñ
 */
export const capitalizeWords = (text: string): string => {
  return text.replace(/(?:^|\s)([a-zA-ZáéíóúüÁÉÍÓÚÜñÑ])/g, (match, letter) => {
    return match.replace(letter, letter.toUpperCase());
  });
};

/**
 * Capitalizes only the first letter of a string
 * Useful for single names or when only first letter should be capitalized
 */
export const capitalizeFirst = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Handles input change with automatic capitalization for names
 * Can be used in onChange handlers for name fields
 */
export const handleNameInput = (
  value: string, 
  onChange: (value: string) => void,
  capitalizeEachWord: boolean = true
) => {
  const formattedValue = capitalizeEachWord 
    ? capitalizeWords(value)
    : capitalizeFirst(value);
  onChange(formattedValue);
};