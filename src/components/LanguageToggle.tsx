import { Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ja' ? 'en' : 'ja';
    i18n.changeLanguage(newLang);
  };

  return (
    <Group>
      <Button
        variant="light"
        size="sm"
        onClick={toggleLanguage}
        color="primary"
        style={{ 
          borderRadius: '20px',
          fontSize: '12px',
          height: '32px',
          paddingLeft: '12px',
          paddingRight: '12px'
        }}
      >
        {i18n.language === 'ja' ? 'English' : '日本語'}
      </Button>
    </Group>
  );
}