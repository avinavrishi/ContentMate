// Language options with their display names and codes
export const LANGUAGE_OPTIONS = [
  { value: "English", label: "English", flag: "🇺🇸" },
  { value: "Hindi", label: "Hindi", flag: "🇮🇳" },
  { value: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { value: "French", label: "French", flag: "🇫🇷" },
  { value: "German", label: "German", flag: "🇩🇪" },
  { value: "Italian", label: "Italian", flag: "🇮🇹" },
  { value: "Portuguese", label: "Portuguese", flag: "🇵🇹" },
  { value: "Japanese", label: "Japanese", flag: "🇯🇵" },
  { value: "Korean", label: "Korean", flag: "🇰🇷" },
  { value: "Chinese", label: "Chinese", flag: "🇨🇳" },
  { value: "Russian", label: "Russian", flag: "🇷🇺" },
  { value: "Arabic", label: "Arabic", flag: "🇸🇦" },
  { value: "Bengali", label: "Bengali", flag: "🇧🇩" },
  { value: "Urdu", label: "Urdu", flag: "🇵🇰" },
  { value: "Turkish", label: "Turkish", flag: "🇹🇷" },
  { value: "Vietnamese", label: "Vietnamese", flag: "🇻🇳" },
  { value: "Thai", label: "Thai", flag: "🇹🇭" },
  { value: "Dutch", label: "Dutch", flag: "🇳🇱" },
  { value: "Polish", label: "Polish", flag: "🇵🇱" },
  { value: "Marathi", label: "Marathi", flag: "🇮🇳" },
] as const;

// Define the dialect option type
type DialectOption = {
  value: string;
  label: string;
  flag: string;
};

// Dialect options with their display names and flags
export const DIALECT_OPTIONS: Record<SupportedLanguage, DialectOption[]> = {
  English: [
    { value: "US", label: "United States", flag: "🇺🇸" },
    { value: "UK", label: "United Kingdom", flag: "🇬🇧" },
    { value: "India", label: "India", flag: "🇮🇳" },
    { value: "Australia", label: "Australia", flag: "🇦🇺" },
    { value: "Canada", label: "Canada", flag: "🇨🇦" },
    { value: "Ireland", label: "Ireland", flag: "🇮🇪" },
    { value: "NewZealand", label: "New Zealand", flag: "🇳🇿" },
    { value: "SouthAfrica", label: "South Africa", flag: "🇿🇦" },
    { value: "Singapore", label: "Singapore", flag: "🇸🇬" },
  ],
  Hindi: [
    { value: "India", label: "India", flag: "🇮🇳" },
    { value: "Nepal", label: "Nepal", flag: "🇳🇵" },
    { value: "Fiji", label: "Fiji", flag: "🇫🇯" },
  ],
  Spanish: [
    { value: "Spain", label: "Spain", flag: "🇪🇸" },
    { value: "Mexico", label: "Mexico", flag: "🇲🇽" },
    { value: "Argentina", label: "Argentina", flag: "🇦🇷" },
    { value: "Colombia", label: "Colombia", flag: "🇨🇴" },
    { value: "Peru", label: "Peru", flag: "🇵🇪" },
    { value: "Chile", label: "Chile", flag: "🇨🇱" },
    { value: "Venezuela", label: "Venezuela", flag: "🇻🇪" },
  ],
  French: [
    { value: "France", label: "France", flag: "🇫🇷" },
    { value: "Canada", label: "Canada", flag: "🇨🇦" },
    { value: "Belgium", label: "Belgium", flag: "🇧🇪" },
    { value: "Switzerland", label: "Switzerland", flag: "🇨🇭" },
    { value: "Morocco", label: "Morocco", flag: "🇲🇦" },
    { value: "Senegal", label: "Senegal", flag: "🇸🇳" },
  ],
  German: [
    { value: "Germany", label: "Germany", flag: "🇩🇪" },
    { value: "Austria", label: "Austria", flag: "🇦🇹" },
    { value: "Switzerland", label: "Switzerland", flag: "🇨🇭" },
    { value: "Luxembourg", label: "Luxembourg", flag: "🇱🇺" },
  ],
  Italian: [
    { value: "Italy", label: "Italy", flag: "🇮🇹" },
    { value: "Switzerland", label: "Switzerland", flag: "🇨🇭" },
    { value: "SanMarino", label: "San Marino", flag: "🇸🇲" },
  ],
  Portuguese: [
    { value: "Portugal", label: "Portugal", flag: "🇵🇹" },
    { value: "Brazil", label: "Brazil", flag: "🇧🇷" },
    { value: "Angola", label: "Angola", flag: "🇦🇴" },
    { value: "Mozambique", label: "Mozambique", flag: "🇲🇿" },
  ],
  Japanese: [
    { value: "Japan", label: "Japan", flag: "🇯🇵" },
  ],
  Korean: [
    { value: "Korea", label: "Korea", flag: "🇰🇷" },
  ],
  Chinese: [
    { value: "China", label: "China", flag: "🇨🇳" },
    { value: "Taiwan", label: "Taiwan", flag: "🇹🇼" },
    { value: "HongKong", label: "Hong Kong", flag: "🇭🇰" },
    { value: "Singapore", label: "Singapore", flag: "🇸🇬" },
    { value: "Malaysia", label: "Malaysia", flag: "🇲🇾" },
  ],
  Russian: [
    { value: "Russia", label: "Russia", flag: "🇷🇺" },
    { value: "Kazakhstan", label: "Kazakhstan", flag: "🇰🇿" },
    { value: "Belarus", label: "Belarus", flag: "🇧🇾" },
  ],
  Arabic: [
    { value: "SaudiArabia", label: "Saudi Arabia", flag: "🇸🇦" },
    { value: "Egypt", label: "Egypt", flag: "🇪🇬" },
    { value: "UAE", label: "UAE", flag: "🇦🇪" },
    { value: "Morocco", label: "Morocco", flag: "🇲🇦" },
    { value: "Lebanon", label: "Lebanon", flag: "🇱🇧" },
  ],
  Bengali: [
    { value: "Bangladesh", label: "Bangladesh", flag: "🇧🇩" },
    { value: "India", label: "India", flag: "🇮🇳" },
  ],
  Urdu: [
    { value: "Pakistan", label: "Pakistan", flag: "🇵🇰" },
    { value: "India", label: "India", flag: "🇮🇳" },
  ],
  Turkish: [
    { value: "Turkey", label: "Turkey", flag: "🇹🇷" },
    { value: "Cyprus", label: "Cyprus", flag: "🇨🇾" },
  ],
  Vietnamese: [
    { value: "Vietnam", label: "Vietnam", flag: "🇻🇳" },
  ],
  Thai: [
    { value: "Thailand", label: "Thailand", flag: "🇹🇭" },
  ],
  Dutch: [
    { value: "Netherlands", label: "Netherlands", flag: "🇳🇱" },
    { value: "Belgium", label: "Belgium", flag: "🇧🇪" },
    { value: "Suriname", label: "Suriname", flag: "🇸🇷" },
  ],
  Polish: [
    { value: "Poland", label: "Poland", flag: "🇵🇱" },
  ],
  Marathi: [
    { value: "India", label: "India", flag: "🇮🇳" },
  ],
};

// Types for type safety
export type SupportedLanguage = typeof LANGUAGE_OPTIONS[number]["value"];
export type SupportedDialect = typeof DIALECT_OPTIONS[SupportedLanguage][number]["value"]; 