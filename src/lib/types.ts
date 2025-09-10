// This file can be used to define shared types and interfaces.

export type ThemeColor = {
  h: number;
  s: number;
  l: number;
};

export type Theme = {
  id: string;
  words: {
    background: string;
    foreground: string;
    primary: string;
  };
  colors: {
    background: ThemeColor;
    foreground: ThemeColor;
    primary: ThemeColor;
  };
  isActive: boolean;
};
