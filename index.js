import { registerRootComponent } from 'expo';
import React from 'react';

import App from './App';
import { FilterProvider } from './context/FilterContext';

function Root() {
  return (
    <FilterProvider>
      <App />
    </FilterProvider>
  );
}

registerRootComponent(Root);
