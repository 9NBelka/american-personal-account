import React from 'react';
import scss from './PlayListLoadingIndicator.module.scss';

export default function PlayListLoadingIndicator() {
  return (
    <div className={scss.loadingContainer}>
      <div className={scss.loading}></div>
    </div>
  );
}
