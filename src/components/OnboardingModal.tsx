import React from 'react';
import { Language, StoreType } from '../types';
import { KrowWelcomeFirstView } from './KrowWelcomeFirstView';

interface OnboardingModalProps {
  initialLanguage: Language;
  initialStoreType: StoreType;
  onComplete: (lang: Language, storeType: StoreType) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialLanguage,
  initialStoreType,
  onComplete,
}) => {
  return (
    <KrowWelcomeFirstView
      currentLanguage={initialLanguage}
      currentStoreType={initialStoreType}
      onOpenShop={(lang, storeType) => onComplete(lang, storeType)}
      isModal={false}
    />
  );
};
