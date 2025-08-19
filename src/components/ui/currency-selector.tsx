import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// قائمة العملات الشائعة
const currencies = [
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', nameAr: 'ريال سعودي' },
  { code: 'USD', name: 'US Dollar', symbol: '$', nameAr: 'دولار أمريكي' },
  { code: 'EUR', name: 'Euro', symbol: '€', nameAr: 'يورو' },
  { code: 'GBP', name: 'British Pound', symbol: '£', nameAr: 'جنيه إسترليني' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', nameAr: 'درهم إماراتي' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', nameAr: 'دينار كويتي' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', nameAr: 'ريال قطري' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', nameAr: 'دينار بحريني' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', nameAr: 'ريال عماني' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ', nameAr: 'دينار أردني' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', nameAr: 'جنيه مصري' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', nameAr: 'ليرة لبنانية' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع', nameAr: 'دينار عراقي' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'ل.س', nameAr: 'ليرة سورية' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م', nameAr: 'درهم مغربي' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', nameAr: 'دينار تونسي' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', nameAr: 'دينار جزائري' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'د.ل', nameAr: 'دينار ليبي' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س', nameAr: 'جنيه سوداني' },
  { code: 'YER', name: 'Yemeni Rial', symbol: 'ر.ي', nameAr: 'ريال يمني' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', nameAr: 'ين ياباني' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', nameAr: 'يوان صيني' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', nameAr: 'روبية هندية' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', nameAr: 'وون كوري جنوبي' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', nameAr: 'ليرة تركية' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', nameAr: 'دولار كندي' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', nameAr: 'دولار أسترالي' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', nameAr: 'فرنك سويسري' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', nameAr: 'كرونة سويدية' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', nameAr: 'كرونة نرويجية' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', nameAr: 'كرونة دنماركية' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', nameAr: 'زلوتي بولندي' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', nameAr: 'كرونة تشيكية' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', nameAr: 'فورنت مجري' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', nameAr: 'ليو روماني' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', nameAr: 'ليف بلغاري' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', nameAr: 'كونا كرواتية' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', nameAr: 'دينار صربي' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', nameAr: 'روبل روسي' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', nameAr: 'هريفنيا أوكرانية' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', nameAr: 'روبل بيلاروسي' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', nameAr: 'تنغة كازاخستانية' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'soʻm', nameAr: 'سوم أوزبكستاني' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', nameAr: 'ريال برازيلي' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', nameAr: 'بيزو مكسيكي' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', nameAr: 'بيزو أرجنتيني' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', nameAr: 'بيزو تشيلي' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', nameAr: 'بيزو كولومبي' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', nameAr: 'سول بيروفي' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', nameAr: 'راند جنوب أفريقي' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', nameAr: 'نايرا نيجيرية' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', nameAr: 'شلن كيني' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', nameAr: 'سيدي غاني' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', nameAr: 'بير إثيوبي' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', nameAr: 'شلن أوغندي' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', nameAr: 'شلن تنزاني' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', nameAr: 'متيكال موزمبيقي' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', nameAr: 'بولا بوتسوانية' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', nameAr: 'دولار ناميبي' },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', nameAr: 'ليلانغيني سوازي' },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', nameAr: 'لوتي ليسوتو' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', nameAr: 'كواشا مالاوية' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', nameAr: 'كواشا زامبية' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$', nameAr: 'دولار زيمبابوي' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', nameAr: 'روبية موريشيوسية' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', nameAr: 'روبية سيشيلية' },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', nameAr: 'أرياري مدغشقري' },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'CF', nameAr: 'فرنك قمري' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', nameAr: 'فرنك جيبوتي' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', nameAr: 'ناكفا إريترية' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'S', nameAr: 'شلن صومالي' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'R₣', nameAr: 'فرنك رواندي' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu', nameAr: 'فرنك بوروندي' },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', nameAr: 'فرنك كونغولي' },
  { code: 'CAF', name: 'Central African CFA Franc', symbol: 'FCFA', nameAr: 'فرنك وسط أفريقيا' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', nameAr: 'فرنك غرب أفريقيا' },
  { code: 'XPF', name: 'CFP Franc', symbol: '₣', nameAr: 'فرنك المحيط الهادئ' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', nameAr: 'دولار نيوزيلندي' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', nameAr: 'دولار فيجي' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', nameAr: 'كينا بابوا غينيا الجديدة' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', nameAr: 'دولار جزر سليمان' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT', nameAr: 'فاتو فانواتو' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', nameAr: 'تالا ساموي' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', nameAr: 'بانغا تونغي' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', nameAr: 'بيزو فلبيني' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', nameAr: 'روبية إندونيسية' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', nameAr: 'رينغيت ماليزي' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', nameAr: 'دولار سنغافوري' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', nameAr: 'بات تايلندي' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', nameAr: 'دونغ فيتنامي' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭', nameAr: 'كيب لاوسي' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', nameAr: 'ريال كمبودي' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', nameAr: 'كيات ميانماري' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', nameAr: 'دولار بروناي' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', nameAr: 'باتاكا ماكاوية' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', nameAr: 'دولار هونغ كونغ' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', nameAr: 'دولار تايواني' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', nameAr: 'توغريك منغولي' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'лв', nameAr: 'سوم قيرغيزستاني' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', nameAr: 'سوموني طاجيكستاني' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T', nameAr: 'مانات تركمانستاني' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', nameAr: 'أفغاني أفغانستاني' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', nameAr: 'روبية باكستانية' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', nameAr: 'روبية سريلانكية' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', nameAr: 'روبية نيبالية' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', nameAr: 'نغولتروم بوتاني' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: '.ރ', nameAr: 'روفيا مالديفية' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', nameAr: 'تاكا بنغلاديشية' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', nameAr: 'ريال إيراني' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', nameAr: 'درام أرميني' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', nameAr: 'مانات أذربيجاني' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', nameAr: 'لاري جورجي' },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', nameAr: 'شيكل إسرائيلي جديد' },
  { code: 'CYP', name: 'Cypriot Pound', symbol: '£', nameAr: 'جنيه قبرصي' },
  { code: 'MTL', name: 'Maltese Lira', symbol: 'Lm', nameAr: 'ليرة مالطية' }
];

interface CurrencySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  language?: 'ar' | 'en';
  className?: string;
}

export function CurrencySelector({
  value,
  onValueChange,
  placeholder,
  language = 'ar',
  className
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedCurrency = currencies.find(currency => currency.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCurrency ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{selectedCurrency.symbol}</span>
              <span className="text-sm">{selectedCurrency.code}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || (language === 'ar' ? 'اختر العملة...' : 'Select currency...')}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={language === 'ar' ? 'البحث عن عملة...' : 'Search currency...'}
          />
          <CommandEmpty>
            {language === 'ar' ? 'لم يتم العثور على عملة.' : 'No currency found.'}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {currencies.map((currency) => (
              <CommandItem
                key={currency.code}
                value={currency.code}
                onSelect={(currentValue) => {
                  onValueChange?.(currentValue === value ? '' : currentValue);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
              >
                <span className="font-mono text-sm w-8">{currency.symbol}</span>
                <span className="font-medium text-sm w-12">{currency.code}</span>
                <span className="flex-1 text-sm">
                  {language === 'ar' ? currency.nameAr : currency.name}
                </span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === currency.code ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
