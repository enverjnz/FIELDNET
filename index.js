import { registerRootComponent } from 'expo';
import React from 'react';

import App from './App';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';

function Root() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <App />
      </FilterProvider>
    </ThemeProvider>
  );
}

registerRootComponent(Root);
