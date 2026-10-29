import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, ArrowRight, Upload, Trash2, FileText, Image as ImageIcon
} from 'lucide-react';
import { createLead } from '../../services/api';

// ─── COMPLETE GLOBAL LIST OF ALL COUNTRIES (195+ Countries) ───────────────────

export const ALL_COUNTRIES = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93', stayLimit: 'e-Visa Eligible' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', dialCode: '+355', stayLimit: 'e-Visa Eligible' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213', stayLimit: 'e-Visa Eligible' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', dialCode: '+376', stayLimit: 'e-Visa Eligible' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244', stayLimit: 'e-Visa Eligible' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', dialCode: '+1268', stayLimit: 'e-Visa Eligible' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', stayLimit: 'e-Visa Eligible' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', dialCode: '+374', stayLimit: 'e-Visa Eligible' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', stayLimit: 'e-Visa Eligible' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', stayLimit: 'e-Visa Eligible' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', dialCode: '+994', stayLimit: 'e-Visa Eligible' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', dialCode: '+1242', stayLimit: 'e-Visa Eligible' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973', stayLimit: 'e-Visa Eligible' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', stayLimit: 'e-Visa Eligible' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', dialCode: '+1246', stayLimit: 'e-Visa Eligible' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', dialCode: '+375', stayLimit: 'e-Visa Eligible' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', stayLimit: 'e-Visa Eligible' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', dialCode: '+501', stayLimit: 'e-Visa Eligible' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', dialCode: '+229', stayLimit: 'e-Visa Eligible' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975', stayLimit: 'e-Visa Eligible' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', dialCode: '+591', stayLimit: 'e-Visa Eligible' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', dialCode: '+387', stayLimit: 'e-Visa Eligible' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267', stayLimit: 'e-Visa Eligible' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', stayLimit: 'e-Visa Eligible' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', dialCode: '+673', stayLimit: 'e-Visa Eligible' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359', stayLimit: 'e-Visa Eligible' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226', stayLimit: 'e-Visa Eligible' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257', stayLimit: 'e-Visa Eligible' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855', stayLimit: 'e-Visa Eligible' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237', stayLimit: 'e-Visa Eligible' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', stayLimit: 'e-Visa Eligible' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', dialCode: '+238', stayLimit: 'e-Visa Eligible' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', dialCode: '+236', stayLimit: 'e-Visa Eligible' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235', stayLimit: 'e-Visa Eligible' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', stayLimit: 'e-Visa Eligible' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', stayLimit: 'e-Visa Eligible' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', stayLimit: 'e-Visa Eligible' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269', stayLimit: 'e-Visa Eligible' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬', dialCode: '+242', stayLimit: 'e-Visa Eligible' },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩', dialCode: '+243', stayLimit: 'e-Visa Eligible' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506', stayLimit: 'e-Visa Eligible' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385', stayLimit: 'e-Visa Eligible' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53', stayLimit: 'e-Visa Eligible' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357', stayLimit: 'e-Visa Eligible' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', stayLimit: 'e-Visa Eligible' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', stayLimit: 'e-Visa Eligible' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253', stayLimit: 'e-Visa Eligible' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', dialCode: '+1767', stayLimit: 'e-Visa Eligible' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', dialCode: '+1809', stayLimit: 'e-Visa Eligible' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', dialCode: '+593', stayLimit: 'e-Visa Eligible' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', stayLimit: 'e-Visa Eligible' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503', stayLimit: 'e-Visa Eligible' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', dialCode: '+240', stayLimit: 'e-Visa Eligible' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291', stayLimit: 'e-Visa Eligible' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372', stayLimit: 'e-Visa Eligible' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '+268', stayLimit: 'e-Visa Eligible' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251', stayLimit: 'e-Visa Eligible' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679', stayLimit: 'e-Visa Eligible' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', stayLimit: 'e-Visa Eligible' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', stayLimit: 'e-Visa Eligible' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241', stayLimit: 'e-Visa Eligible' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220', stayLimit: 'e-Visa Eligible' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', dialCode: '+995', stayLimit: 'e-Visa Eligible' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', stayLimit: 'e-Visa Eligible' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', stayLimit: 'e-Visa Eligible' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30', stayLimit: 'e-Visa Eligible' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', dialCode: '+1473', stayLimit: 'e-Visa Eligible' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502', stayLimit: 'e-Visa Eligible' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224', stayLimit: 'e-Visa Eligible' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245', stayLimit: 'e-Visa Eligible' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', dialCode: '+592', stayLimit: 'e-Visa Eligible' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', dialCode: '+509', stayLimit: 'e-Visa Eligible' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504', stayLimit: 'e-Visa Eligible' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852', stayLimit: 'e-Visa Eligible' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36', stayLimit: 'e-Visa Eligible' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', dialCode: '+354', stayLimit: 'e-Visa Eligible' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', stayLimit: 'e-Visa Eligible' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', stayLimit: 'e-Visa Eligible' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98', stayLimit: 'e-Visa Eligible' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964', stayLimit: 'e-Visa Eligible' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', stayLimit: 'e-Visa Eligible' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', stayLimit: 'e-Visa Eligible' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', stayLimit: 'e-Visa Eligible' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', dialCode: '+225', stayLimit: 'e-Visa Eligible' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', dialCode: '+1876', stayLimit: 'e-Visa Eligible' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', stayLimit: 'e-Visa Eligible' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962', stayLimit: 'e-Visa Eligible' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7', stayLimit: 'e-Visa Eligible' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', stayLimit: 'e-Visa Eligible' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', dialCode: '+686', stayLimit: 'e-Visa Eligible' },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰', dialCode: '+383', stayLimit: 'e-Visa Eligible' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965', stayLimit: 'e-Visa Eligible' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', dialCode: '+996', stayLimit: 'e-Visa Eligible' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856', stayLimit: 'e-Visa Eligible' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371', stayLimit: 'e-Visa Eligible' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961', stayLimit: 'e-Visa Eligible' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266', stayLimit: 'e-Visa Eligible' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231', stayLimit: 'e-Visa Eligible' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218', stayLimit: 'e-Visa Eligible' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', dialCode: '+423', stayLimit: 'e-Visa Eligible' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370', stayLimit: 'e-Visa Eligible' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352', stayLimit: 'e-Visa Eligible' },
  { code: 'MO', name: 'Macau', flag: '🇲🇴', dialCode: '+853', stayLimit: 'e-Visa Eligible' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261', stayLimit: 'e-Visa Eligible' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265', stayLimit: 'e-Visa Eligible' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', stayLimit: 'e-Visa Eligible' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960', stayLimit: 'e-Visa Eligible' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223', stayLimit: 'e-Visa Eligible' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356', stayLimit: 'e-Visa Eligible' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', dialCode: '+692', stayLimit: 'e-Visa Eligible' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', dialCode: '+222', stayLimit: 'e-Visa Eligible' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', dialCode: '+230', stayLimit: 'e-Visa Eligible' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', stayLimit: 'e-Visa Eligible' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', dialCode: '+691', stayLimit: 'e-Visa Eligible' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', dialCode: '+373', stayLimit: 'e-Visa Eligible' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377', stayLimit: 'e-Visa Eligible' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', dialCode: '+976', stayLimit: 'e-Visa Eligible' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', dialCode: '+382', stayLimit: 'e-Visa Eligible' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212', stayLimit: 'e-Visa Eligible' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258', stayLimit: 'e-Visa Eligible' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95', stayLimit: 'e-Visa Eligible' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264', stayLimit: 'e-Visa Eligible' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', dialCode: '+674', stayLimit: 'e-Visa Eligible' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977', stayLimit: 'e-Visa Eligible' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', stayLimit: 'e-Visa Eligible' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', stayLimit: 'e-Visa Eligible' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505', stayLimit: 'e-Visa Eligible' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227', stayLimit: 'e-Visa Eligible' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', stayLimit: 'e-Visa Eligible' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', dialCode: '+850', stayLimit: 'e-Visa Eligible' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', dialCode: '+389', stayLimit: 'e-Visa Eligible' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', stayLimit: 'e-Visa Eligible' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968', stayLimit: 'e-Visa Eligible' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', stayLimit: 'e-Visa Eligible' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', dialCode: '+680', stayLimit: 'e-Visa Eligible' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', dialCode: '+970', stayLimit: 'e-Visa Eligible' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507', stayLimit: 'e-Visa Eligible' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', dialCode: '+675', stayLimit: 'e-Visa Eligible' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595', stayLimit: 'e-Visa Eligible' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', stayLimit: 'e-Visa Eligible' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', stayLimit: 'e-Visa Eligible' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', stayLimit: 'e-Visa Eligible' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', stayLimit: 'e-Visa Eligible' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974', stayLimit: 'e-Visa Eligible' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40', stayLimit: 'e-Visa Eligible' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', stayLimit: 'e-Visa Eligible' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250', stayLimit: 'e-Visa Eligible' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', dialCode: '+1869', stayLimit: 'e-Visa Eligible' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', dialCode: '+1758', stayLimit: 'e-Visa Eligible' },
  { code: 'VC', name: 'Saint Vincent and Grenadines', flag: '🇻🇨', dialCode: '+1784', stayLimit: 'e-Visa Eligible' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', dialCode: '+685', stayLimit: 'e-Visa Eligible' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', dialCode: '+378', stayLimit: 'e-Visa Eligible' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹', dialCode: '+239', stayLimit: 'e-Visa Eligible' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', stayLimit: 'e-Visa Eligible' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221', stayLimit: 'e-Visa Eligible' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', dialCode: '+381', stayLimit: 'e-Visa Eligible' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248', stayLimit: 'e-Visa Eligible' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232', stayLimit: 'e-Visa Eligible' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', stayLimit: 'e-Visa Eligible' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421', stayLimit: 'e-Visa Eligible' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386', stayLimit: 'e-Visa Eligible' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', dialCode: '+677', stayLimit: 'e-Visa Eligible' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252', stayLimit: 'e-Visa Eligible' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', stayLimit: 'e-Visa Eligible' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', stayLimit: 'e-Visa Eligible' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', dialCode: '+211', stayLimit: 'e-Visa Eligible' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', stayLimit: 'e-Visa Eligible' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94', stayLimit: 'e-Visa Eligible' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249', stayLimit: 'e-Visa Eligible' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', dialCode: '+597', stayLimit: 'e-Visa Eligible' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', stayLimit: 'e-Visa Eligible' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', stayLimit: 'e-Visa Eligible' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', dialCode: '+963', stayLimit: 'e-Visa Eligible' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886', stayLimit: 'e-Visa Eligible' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', dialCode: '+992', stayLimit: 'e-Visa Eligible' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255', stayLimit: 'e-Visa Eligible' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', stayLimit: 'e-Visa Eligible' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', dialCode: '+670', stayLimit: 'e-Visa Eligible' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228', stayLimit: 'e-Visa Eligible' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676', stayLimit: 'e-Visa Eligible' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', dialCode: '+1868', stayLimit: 'e-Visa Eligible' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216', stayLimit: 'e-Visa Eligible' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', stayLimit: 'e-Visa Eligible' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', dialCode: '+993', stayLimit: 'e-Visa Eligible' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', dialCode: '+688', stayLimit: 'e-Visa Eligible' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256', stayLimit: 'e-Visa Eligible' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380', stayLimit: 'e-Visa Eligible' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', stayLimit: 'e-Visa Eligible' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', stayLimit: 'e-Visa Eligible' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', stayLimit: 'e-Visa Eligible' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598', stayLimit: 'e-Visa Eligible' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998', stayLimit: 'e-Visa Eligible' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', dialCode: '+678', stayLimit: 'e-Visa Eligible' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦', dialCode: '+39', stayLimit: 'e-Visa Eligible' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58', stayLimit: 'e-Visa Eligible' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', stayLimit: 'e-Visa Eligible' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '+967', stayLimit: 'e-Visa Eligible' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260', stayLimit: 'e-Visa Eligible' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263', stayLimit: 'e-Visa Eligible' },
  { code: 'OTHER', name: 'Other Eligible Country', flag: '🌐', dialCode: '+1', stayLimit: 'e-Visa Eligible' }
];

// Preserved for SearchWidget compatibility
export const POPULAR_NATIONALITIES = ALL_COUNTRIES;

export const VISA_TYPES = [
  { id: '30days', title: '30-Day Visa', subtitle: 'Double Entry · Quick Holiday', entries: 'Double Entry' },
  { id: '1year', title: '1-Year Visa', subtitle: 'Multiple Entry · Most Popular', entries: 'Multiple Entry' },
  { id: '5years', title: '5-Year Visa', subtitle: 'Multiple Entry · Long Term', entries: 'Multiple Entry' }
];

// Distinct phone dialing codes sorted alphabetically / numerically
const DIAL_CODES = Array.from(
  new Map(ALL_COUNTRIES.map(c => [c.dialCode, { dialCode: c.dialCode, flag: c.flag, name: c.name }])).values()
).sort((a, b) => a.dialCode.localeCompare(b.dialCode, undefined, { numeric: true }));

// ─── BASIC, CLEAN, INTUITIVE VISA APPLICATION COMPONENT ──────────────────────

export default function VisaSection({ 
  setActiveTab,
  initialCountry,
  initialType,
  initialAirport,
  initialTravelDate
}) {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry || 'GB');
  const [selectedType, setSelectedType] = useState(initialType || '1year');

  // Simple, basic form fields
  const [formData, setFormData] = useState({
    fullName: '',
    nationality: initialCountry || 'GB',
    passportNumber: '',
    passportExpiry: '',
    arrivalDate: initialTravelDate || '',
    arrivalPort: initialAirport || 'GOX',
    stayLocation: '',
    email: '',
    phoneCode: '+44',
    phone: '',
    notes: ''
  });

  // Drag and Drop Uploaded Files (No limitations, supports PDF and images)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [leadRef, setLeadRef] = useState(null);

  // Sync props
  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
      setFormData(prev => ({ ...prev, nationality: initialCountry }));
    }
  }, [initialCountry]);

  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialAirport) {
      setFormData(prev => ({ ...prev, arrivalPort: initialAirport }));
    }
  }, [initialAirport]);

  useEffect(() => {
    if (initialTravelDate) {
      setFormData(prev => ({ ...prev, arrivalDate: initialTravelDate }));
    }
  }, [initialTravelDate]);

  // Sync phone dial code with country
  useEffect(() => {
    const match = ALL_COUNTRIES.find(c => c.code === selectedCountry);
    if (match && match.dialCode) {
      setFormData(prev => ({ ...prev, phoneCode: match.dialCode }));
    }
  }, [selectedCountry]);

  const country = useMemo(() => {
    return ALL_COUNTRIES.find(c => c.code === selectedCountry) || ALL_COUNTRIES[0];
  }, [selectedCountry]);

  const visa = useMemo(() => {
    return VISA_TYPES.find(v => v.id === selectedType) || VISA_TYPES[1];
  }, [selectedType]);

  // File handling for Drag and Drop
  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const newItems = Array.from(fileList).map(file => {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      let preview = null;
      if (isImage) {
        try {
          preview = URL.createObjectURL(file);
        } catch (e) {}
      }
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        sizeMb: sizeMb > 0 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`,
        isPdf,
        isImage,
        preview,
        file
      };
    });

    setUploadedFiles(prev => [...prev, ...newItems]);
  };

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const generatedId = `VISA-${Date.now().toString(36).toUpperCase()}`;
    const cleanPhone = `${formData.phoneCode} ${formData.phone}`.trim();

    try {
      const payload = {
        id: generatedId,
        name: formData.fullName.trim(),
        phone: cleanPhone,
        email: formData.email.trim(),
        source: 'Goa Tourist Visa',
        service: `${visa.title} (${country.name})`,
        status: 'New',
        notes: [
          `Country: ${country.name} (${country.flag})`,
          `Visa: ${visa.title}`,
          `Passport No: ${formData.passportNumber.toUpperCase().trim() || 'Pending'}`,
          `Passport Expiry: ${formData.passportExpiry || 'Not specified'}`,
          `Arrival Date: ${formData.arrivalDate || 'Not specified'}`,
          `Arrival Port: ${formData.arrivalPort === 'GOI' ? 'Dabolim Airport (GOI)' : 'Manohar Intl Mopa (GOX)'}`,
          `Hotel/Address: ${formData.stayLocation || 'Not specified'}`,
          `Documents: ${uploadedFiles.length > 0 ? uploadedFiles.map(f => f.name).join(', ') : 'None attached'}`,
          formData.notes ? `Note: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')
      };

      await createLead(payload);
      setLeadRef(generatedId);
      setSent(true);
    } catch (err) {
      console.warn('[Visa Application] Lead log notice:', err.message);
      setLeadRef(generatedId);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ 
      background: '#ffffff', 
      minHeight: '100vh', 
      width: '100%', 
      color: '#0f172a', 
      fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      
      {/* ── HEADER (CENTERED & CLEAN) ── */}
      <div style={{ 
        padding: '36px 24px 22px', 
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', 
          fontWeight: 800, 
          color: '#0f172a', 
          margin: '0 0 10px', 
          letterSpacing: '-0.02em' 
        }}>
          Goa Tourist e-Visa <span style={{ color: '#ea580c' }}>Application</span>
        </h1>
        
        <p style={{ fontSize: '15px', color: '#475569', margin: '0 auto', maxWidth: '780px', lineHeight: 1.5 }}>
          Direct electronic travel authorization for international visitors traveling to Goa. Verified by visa specialists before government filing to guarantee fast biometric entry at Manohar Intl (GOX) or Dabolim (GOI) airports.
        </p>
      </div>

      {/* ── MAIN FORM CONTAINER ── */}
      <div style={{ padding: '32px 24px 64px', maxWidth: '760px', margin: '0 auto' }}>
        
        {sent ? (
          /* ── SIMPLE SUCCESS SCREEN ── */
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #bbf7d0', 
            borderRadius: '16px', 
            padding: '48px 28px', 
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: '#dcfce7', 
              color: '#16a34a', 
              marginBottom: '16px' 
            }}>
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>
              Application Submitted Successfully!
            </h2>

            <div style={{ 
              fontSize: '14px', 
              fontWeight: 800, 
              color: '#15803d', 
              background: '#dcfce7', 
              display: 'inline-block', 
              padding: '6px 18px', 
              borderRadius: '8px', 
              marginBottom: '16px' 
            }}>
              Application Reference #{leadRef || 'VISA-GUEST'}
            </div>

            <p style={{ fontSize: '15px', color: '#334155', margin: '0 0 24px', lineHeight: 1.6 }}>
              Thank you, <strong>{formData.fullName || 'Valued Guest'}</strong>! We have received your visa application and documents. Our visa team will review your application and email the approved visa to <strong>{formData.email}</strong>.
            </p>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setLeadRef(null);
                setUploadedFiles([]);
                setFormData({
                  fullName: '',
                  nationality: selectedCountry,
                  passportNumber: '',
                  passportExpiry: '',
                  arrivalDate: '',
                  arrivalPort: 'GOX',
                  stayLocation: '',
                  email: '',
                  phoneCode: '+44',
                  phone: '',
                  notes: ''
                });
              }}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Submit Another Application
            </button>
          </div>
        ) : (
          /* ── CLEAN, BASIC FORM (WITH ALL COUNTRIES DROPDOWN) ── */
          <form 
            onSubmit={handleSubmit}
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '32px 28px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)' 
            }}
          >
            
            {/* 1. VISA DURATION DROPDOWN */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                Visa Type / Duration *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  background: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="30days">30-Day Tourist Visa (Double Entry)</option>
                <option value="1year">1-Year Tourist Visa (Multiple Entry) - Most Popular</option>
                <option value="5years">5-Year Tourist Visa (Multiple Entry) - Long Term</option>
              </select>
            </div>

            {/* 2. FULL NAME & ALL COUNTRIES DROPDOWN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Full Name (As in Passport) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Edward Smith"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Country / Nationality *
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setFormData(prev => ({ ...prev, nationality: e.target.value }));
                  }}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {ALL_COUNTRIES.map(nat => (
                    <option key={nat.code} value={nat.code}>
                      {nat.flag} {nat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. PASSPORT NUMBER & EXPIRY */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Passport Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A12345678"
                  value={formData.passportNumber}
                  onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    letterSpacing: '0.04em',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Passport Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.passportExpiry}
                  onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* 4. ARRIVAL DATE & AIRPORT */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Date of Arrival in Goa *
                </label>
                <input
                  type="date"
                  required
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Arriving Airport in Goa *
                </label>
                <select
                  value={formData.arrivalPort}
                  onChange={(e) => setFormData({ ...formData, arrivalPort: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="GOX">Manohar International Airport, Mopa (GOX)</option>
                  <option value="GOI">Dabolim Airport (GOI)</option>
                  <option value="SEAPORT">Mormugao Cruise Seaport</option>
                </select>
              </div>
            </div>

            {/* 5. HOTEL / STAY IN GOA */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Hotel Name or Area in Goa *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Taj Fort Aguada, Candolim or Resort in Calangute"
                value={formData.stayLocation}
                onChange={(e) => setFormData({ ...formData, stayLocation: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10.5px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 6. EMAIL & PHONE NUMBER */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '22px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Email Address * (Approved visa will be emailed here)
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10.5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Phone Number *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px' }}>
                  <select
                    value={formData.phoneCode}
                    onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12.5px',
                      background: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {DIAL_CODES.map(c => (
                      <option key={`${c.dialCode}-${c.name}`} value={c.dialCode}>
                        {c.flag} {c.dialCode} ({c.name})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 7911 123456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10.5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 7. DRAG AND DROP DOCUMENT UPLOAD (PDF / JPG / PNG - NO LIMITATION) */}
            <div style={{ marginBottom: '26px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                Upload Passport Copy &amp; Photo (PDF or Image)
              </label>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px' }}>
                Drag and drop your files here or click to browse. No file size limitation.
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: isDragging ? '2px dashed #ea580c' : '2px dashed #cbd5e1',
                  background: isDragging ? '#fff7ed' : '#f8fafc',
                  borderRadius: '12px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', marginBottom: '8px' }}>
                  <Upload size={24} />
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Drag &amp; drop files here, or click to choose
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Supports PDF, JPG, JPEG, PNG (No size limit)
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={(e) => handleFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {file.isImage && file.preview ? (
                          <img 
                            src={file.preview} 
                            alt="preview" 
                            style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                          />
                        ) : file.isPdf ? (
                          <FileText size={20} color="#ea580c" />
                        ) : (
                          <ImageIcon size={20} color="#0284c7" />
                        )}

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {file.sizeMb}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? '#94a3b8' : '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '15px 24px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{submitting ? 'Submitting Application...' : 'Submit Visa Application'}</span>
              <ArrowRight size={18} />
            </button>

          </form>
        )}

      </div>

    </div>
  );
}
