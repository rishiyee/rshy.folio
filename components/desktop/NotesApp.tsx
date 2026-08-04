"use client";

import { useState } from "react";

const NOTES_STORAGE_KEY = "os-notes-content";

export default function NotesApp() {
  const [value, setValue] = useState(
    () => window.localStorage.getItem(NOTES_STORAGE_KEY) ?? ""
  );

  function handleChange(text: string) {
    setValue(text);
    window.localStorage.setItem(NOTES_STORAGE_KEY, text);
  }

  return (
    <textarea
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      spellCheck={false}
      placeholder="Type notes here — saved automatically."
      className="retro-scrollbar h-full w-full resize-none bg-transparent outline-none text-foreground placeholder:text-dimmer"
    />
  );
}
