import React from 'react';
import { AppProviders } from './app/AppProviders';
import { ExampleRouter } from './app/ExampleRouter';

export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <ExampleRouter />
    </AppProviders>
  );
}
