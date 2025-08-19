import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// قائمة الدول مع الأعلام
const countries = [
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', nameAr: 'أندورا' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', nameAr: 'الإمارات العربية المتحدة' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', nameAr: 'أفغانستان' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', nameAr: 'أنتيغوا وبربودا' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮', nameAr: 'أنغويلا' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', nameAr: 'ألبانيا' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', nameAr: 'أرمينيا' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', nameAr: 'أنغولا' },
  { code: 'AQ', name: 'Antarctica', flag: '🇦🇶', nameAr: 'القارة القطبية الجنوبية' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', nameAr: 'الأرجنتين' },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸', nameAr: 'ساموا الأمريكية' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', nameAr: 'النمسا' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', nameAr: 'أستراليا' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼', nameAr: 'أروبا' },
  { code: 'AX', name: 'Åland Islands', flag: '🇦🇽', nameAr: 'جزر آلاند' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', nameAr: 'أذربيجان' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', nameAr: 'البوسنة والهرسك' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', nameAr: 'بربادوس' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', nameAr: 'بنغلاديش' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', nameAr: 'بلجيكا' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', nameAr: 'بوركينا فاسو' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', nameAr: 'بلغاريا' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', nameAr: 'البحرين' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', nameAr: 'بوروندي' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', nameAr: 'بنين' },
  { code: 'BL', name: 'Saint Barthélemy', flag: '🇧🇱', nameAr: 'سان بارتيليمي' },
  { code: 'BM', name: 'Bermuda', flag: '🇧🇲', nameAr: 'برمودا' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', nameAr: 'بروناي' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', nameAr: 'بوليفيا' },
  { code: 'BQ', name: 'Caribbean Netherlands', flag: '🇧🇶', nameAr: 'هولندا الكاريبية' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', nameAr: 'البرازيل' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', nameAr: 'الباهاما' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', nameAr: 'بوتان' },
  { code: 'BV', name: 'Bouvet Island', flag: '🇧🇻', nameAr: 'جزيرة بوفيت' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', nameAr: 'بوتسوانا' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', nameAr: 'بيلاروسيا' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', nameAr: 'بليز' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', nameAr: 'كندا' },
  { code: 'CC', name: 'Cocos Islands', flag: '🇨🇨', nameAr: 'جزر كوكوس' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩', nameAr: 'جمهورية الكونغو الديمقراطية' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', nameAr: 'جمهورية أفريقيا الوسطى' },
  { code: 'CG', name: 'Republic of the Congo', flag: '🇨🇬', nameAr: 'جمهورية الكونغو' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', nameAr: 'سويسرا' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', nameAr: 'ساحل العاج' },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰', nameAr: 'جزر كوك' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', nameAr: 'تشيلي' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', nameAr: 'الكاميرون' },
  { code: 'CN', name: 'China', flag: '🇨🇳', nameAr: 'الصين' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', nameAr: 'كولومبيا' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', nameAr: 'كوستاريكا' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', nameAr: 'كوبا' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', nameAr: 'الرأس الأخضر' },
  { code: 'CW', name: 'Curaçao', flag: '🇨🇼', nameAr: 'كوراساو' },
  { code: 'CX', name: 'Christmas Island', flag: '🇨🇽', nameAr: 'جزيرة الكريسماس' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', nameAr: 'قبرص' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', nameAr: 'جمهورية التشيك' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', nameAr: 'ألمانيا' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', nameAr: 'جيبوتي' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', nameAr: 'الدنمارك' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', nameAr: 'دومينيكا' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', nameAr: 'جمهورية الدومينيكان' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', nameAr: 'الجزائر' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', nameAr: 'الإكوادور' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', nameAr: 'إستونيا' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', nameAr: 'مصر' },
  { code: 'EH', name: 'Western Sahara', flag: '🇪🇭', nameAr: 'الصحراء الغربية' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', nameAr: 'إريتريا' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', nameAr: 'إسبانيا' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', nameAr: 'إثيوبيا' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', nameAr: 'فنلندا' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', nameAr: 'فيجي' },
  { code: 'FK', name: 'Falkland Islands', flag: '🇫🇰', nameAr: 'جزر فوكلاند' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', nameAr: 'ميكرونيزيا' },
  { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴', nameAr: 'جزر فارو' },
  { code: 'FR', name: 'France', flag: '🇫🇷', nameAr: 'فرنسا' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', nameAr: 'الغابون' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', nameAr: 'المملكة المتحدة' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', nameAr: 'غرينادا' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', nameAr: 'جورجيا' },
  { code: 'GF', name: 'French Guiana', flag: '🇬🇫', nameAr: 'غويانا الفرنسية' },
  { code: 'GG', name: 'Guernsey', flag: '🇬🇬', nameAr: 'غيرنزي' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', nameAr: 'غانا' },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮', nameAr: 'جبل طارق' },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱', nameAr: 'غرينلاند' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', nameAr: 'غامبيا' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', nameAr: 'غينيا' },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵', nameAr: 'غوادلوب' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', nameAr: 'غينيا الاستوائية' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', nameAr: 'اليونان' },
  { code: 'GS', name: 'South Georgia', flag: '🇬🇸', nameAr: 'جورجيا الجنوبية' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', nameAr: 'غواتيمالا' },
  { code: 'GU', name: 'Guam', flag: '🇬🇺', nameAr: 'غوام' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', nameAr: 'غينيا بيساو' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', nameAr: 'غيانا' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', nameAr: 'هونغ كونغ' },
  { code: 'HM', name: 'Heard Island', flag: '🇭🇲', nameAr: 'جزيرة هيرد' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', nameAr: 'هندوراس' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', nameAr: 'كرواتيا' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', nameAr: 'هايتي' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', nameAr: 'المجر' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', nameAr: 'إندونيسيا' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', nameAr: 'أيرلندا' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', nameAr: 'إسرائيل' },
  { code: 'IM', name: 'Isle of Man', flag: '🇮🇲', nameAr: 'جزيرة مان' },
  { code: 'IN', name: 'India', flag: '🇮🇳', nameAr: 'الهند' },
  { code: 'IO', name: 'British Indian Ocean Territory', flag: '🇮🇴', nameAr: 'إقليم المحيط الهندي البريطاني' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', nameAr: 'العراق' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', nameAr: 'إيران' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', nameAr: 'أيسلندا' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', nameAr: 'إيطاليا' },
  { code: 'JE', name: 'Jersey', flag: '🇯🇪', nameAr: 'جيرزي' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', nameAr: 'جامايكا' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', nameAr: 'الأردن' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', nameAr: 'اليابان' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', nameAr: 'كينيا' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', nameAr: 'قيرغيزستان' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', nameAr: 'كمبوديا' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', nameAr: 'كيريباتي' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', nameAr: 'جزر القمر' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', nameAr: 'سانت كيتس ونيفيس' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', nameAr: 'كوريا الشمالية' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', nameAr: 'كوريا الجنوبية' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', nameAr: 'الكويت' },
  { code: 'KY', name: 'Cayman Islands', flag: '🇰🇾', nameAr: 'جزر كايمان' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', nameAr: 'كازاخستان' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', nameAr: 'لاوس' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', nameAr: 'لبنان' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', nameAr: 'سانت لوسيا' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', nameAr: 'ليختنشتاين' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', nameAr: 'سريلانكا' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', nameAr: 'ليبيريا' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', nameAr: 'ليسوتو' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', nameAr: 'ليتوانيا' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', nameAr: 'لوكسمبورغ' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', nameAr: 'لاتفيا' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', nameAr: 'ليبيا' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', nameAr: 'المغرب' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', nameAr: 'موناكو' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', nameAr: 'مولدوفا' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', nameAr: 'الجبل الأسود' },
  { code: 'MF', name: 'Saint Martin', flag: '🇲🇫', nameAr: 'سان مارتن' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', nameAr: 'مدغشقر' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', nameAr: 'جزر مارشال' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', nameAr: 'مقدونيا الشمالية' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', nameAr: 'مالي' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', nameAr: 'ميانمار' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', nameAr: 'منغوليا' },
  { code: 'MO', name: 'Macao', flag: '🇲🇴', nameAr: 'ماكاو' },
  { code: 'MP', name: 'Northern Mariana Islands', flag: '🇲🇵', nameAr: 'جزر ماريانا الشمالية' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶', nameAr: 'مارتينيك' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', nameAr: 'موريتانيا' },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸', nameAr: 'مونتسرات' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', nameAr: 'مالطا' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', nameAr: 'موريشيوس' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', nameAr: 'المالديف' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', nameAr: 'ملاوي' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', nameAr: 'المكسيك' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', nameAr: 'ماليزيا' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', nameAr: 'موزمبيق' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', nameAr: 'ناميبيا' },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨', nameAr: 'كاليدونيا الجديدة' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', nameAr: 'النيجر' },
  { code: 'NF', name: 'Norfolk Island', flag: '🇳🇫', nameAr: 'جزيرة نورفولك' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', nameAr: 'نيجيريا' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', nameAr: 'نيكاراغوا' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', nameAr: 'هولندا' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', nameAr: 'النرويج' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', nameAr: 'نيبال' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', nameAr: 'ناورو' },
  { code: 'NU', name: 'Niue', flag: '🇳🇺', nameAr: 'نيوي' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', nameAr: 'نيوزيلندا' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', nameAr: 'عُمان' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', nameAr: 'بنما' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', nameAr: 'بيرو' },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫', nameAr: 'بولينيزيا الفرنسية' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', nameAr: 'بابوا غينيا الجديدة' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', nameAr: 'الفلبين' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', nameAr: 'باكستان' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', nameAr: 'بولندا' },
  { code: 'PM', name: 'Saint Pierre and Miquelon', flag: '🇵🇲', nameAr: 'سان بيير وميكلون' },
  { code: 'PN', name: 'Pitcairn Islands', flag: '🇵🇳', nameAr: 'جزر بيتكيرن' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', nameAr: 'بورتوريكو' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', nameAr: 'فلسطين' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', nameAr: 'البرتغال' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', nameAr: 'بالاو' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', nameAr: 'باراغواي' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', nameAr: 'قطر' },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪', nameAr: 'ريونيون' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', nameAr: 'رومانيا' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', nameAr: 'صربيا' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', nameAr: 'روسيا' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', nameAr: 'رواندا' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', nameAr: 'السعودية' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', nameAr: 'جزر سليمان' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', nameAr: 'سيشل' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', nameAr: 'السودان' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', nameAr: 'السويد' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', nameAr: 'سنغافورة' },
  { code: 'SH', name: 'Saint Helena', flag: '🇸🇭', nameAr: 'سانت هيلينا' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', nameAr: 'سلوفينيا' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', flag: '🇸🇯', nameAr: 'سفالبارد وجان ماين' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', nameAr: 'سلوفاكيا' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', nameAr: 'سيراليون' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', nameAr: 'سان مارينو' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', nameAr: 'السنغال' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', nameAr: 'الصومال' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', nameAr: 'سورينام' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', nameAr: 'جنوب السودان' },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹', nameAr: 'ساو تومي وبرينسيبي' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', nameAr: 'السلفادور' },
  { code: 'SX', name: 'Sint Maarten', flag: '🇸🇽', nameAr: 'سينت مارتن' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', nameAr: 'سوريا' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', nameAr: 'إسواتيني' },
  { code: 'TC', name: 'Turks and Caicos Islands', flag: '🇹🇨', nameAr: 'جزر تركس وكايكوس' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', nameAr: 'تشاد' },
  { code: 'TF', name: 'French Southern Territories', flag: '🇹🇫', nameAr: 'الأقاليم الجنوبية الفرنسية' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', nameAr: 'توغو' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', nameAr: 'تايلاند' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', nameAr: 'طاجيكستان' },
  { code: 'TK', name: 'Tokelau', flag: '🇹🇰', nameAr: 'توكيلاو' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', nameAr: 'تيمور الشرقية' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', nameAr: 'تركمانستان' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', nameAr: 'تونس' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', nameAr: 'تونغا' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', nameAr: 'تركيا' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', nameAr: 'ترينيداد وتوباغو' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', nameAr: 'توفالو' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', nameAr: 'تايوان' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', nameAr: 'تنزانيا' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', nameAr: 'أوكرانيا' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', nameAr: 'أوغندا' },
  { code: 'UM', name: 'U.S. Outlying Islands', flag: '🇺🇲', nameAr: 'الجزر النائية الأمريكية' },
  { code: 'US', name: 'United States', flag: '🇺🇸', nameAr: 'الولايات المتحدة' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', nameAr: 'أوروغواي' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', nameAr: 'أوزبكستان' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦', nameAr: 'الفاتيكان' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', nameAr: 'سانت فنسنت والغرينادين' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', nameAr: 'فنزويلا' },
  { code: 'VG', name: 'British Virgin Islands', flag: '🇻🇬', nameAr: 'جزر العذراء البريطانية' },
  { code: 'VI', name: 'U.S. Virgin Islands', flag: '🇻🇮', nameAr: 'جزر العذراء الأمريكية' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', nameAr: 'فيتنام' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', nameAr: 'فانواتو' },
  { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫', nameAr: 'واليس وفوتونا' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', nameAr: 'ساموا' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', nameAr: 'اليمن' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹', nameAr: 'مايوت' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', nameAr: 'جنوب أفريقيا' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', nameAr: 'زامبيا' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', nameAr: 'زيمبابوي' },
];

interface CountrySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  language?: 'ar' | 'en';
  className?: string;
}

export function CountrySelector({
  value,
  onValueChange,
  placeholder,
  language = 'ar',
  className
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedCountry = countries.find(country => country.code === value);

  const filteredCountries = countries.filter(country => {
    const searchTerm = searchValue.toLowerCase();
    const countryName = language === 'ar' ? country.nameAr : country.name;
    return countryName.toLowerCase().includes(searchTerm) || 
           country.code.toLowerCase().includes(searchTerm);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span>{language === 'ar' ? selectedCountry.nameAr : selectedCountry.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || (language === 'ar' ? 'اختر الدولة...' : 'Select country...')}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder={language === 'ar' ? 'البحث عن دولة...' : 'Search country...'}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>
            {language === 'ar' ? 'لم يتم العثور على دولة.' : 'No country found.'}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredCountries.map((country) => (
              <CommandItem
                key={country.code}
                value={country.code}
                onSelect={(currentValue) => {
                  onValueChange?.(currentValue === value ? '' : currentValue);
                  setOpen(false);
                  setSearchValue('');
                }}
                className="flex items-center gap-2"
              >
                <span className="text-lg">{country.flag}</span>
                <span className="flex-1">
                  {language === 'ar' ? country.nameAr : country.name}
                </span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === country.code ? "opacity-100" : "opacity-0"
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
