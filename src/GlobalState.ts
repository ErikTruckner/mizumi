// GlobalState.js
import { atom } from "jotai";

// Atom for scroll progress (0-1)
export const scrollProgressAtom = atom(0);

// Atom for current section index (0,1,2 for colors)
export const currentSectionAtom = atom(0);
