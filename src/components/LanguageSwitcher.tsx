import { useTranslation } from 'react-i18next';
import { languages, changeLanguage } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language);

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto gap-2 border-none bg-transparent">
        <Globe className="h-4 w-4" />
        <SelectValue>
          {currentLanguage?.nativeName || 'English'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="font-medium">{lang.nativeName}</span>
            <span className="ml-2 text-muted-foreground">({lang.name})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
