import React from 'react';
import scss from './AccountLoadingIndicator.module.scss';

export default function AccountLoadingIndicator() {
  return (
    <div className={scss.loadingContainer}>
      <div className={scss.loading}></div>
    </div>
  );
}
