import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// بيانات النماذج الأربع مع الصور
const formTemplates = [
  {
    id: 1,
    type: 'arabic-quantity',
    imageSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjlGQUZCIiBzdHJva2U9IiM5Yjg3ZjUiIHN0cm9rZS13aWR0aD0iNCIgcng9IjIwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzNzM3MzciIHRleHQtYW5jaG9yPSJtaWRkbGUiPtin2LfZhNioINin2YTYotmGPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iODAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNGMEZERjQiIHN0cm9rZT0iIzIyYzU1ZSIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iMTAiLz4KPHR5cGUgeD0iMzgwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3MzczNyIgdGV4dC1hbmNob3I9ImVuZCIgZGlyZWN0aW9uPSJydGwiPtin2LTYqtixIDMg2YjYp9it2LXZhCDYudmE2YkgMSDZhdis2KfZhtin2YvYpzwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSIxMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwNTk2NjkiIHRleHQtYW5jaG9yPSJlbmQiPk1BRCAzMDAwPC90ZXh0Pgo8cmVjdCB4PSIzMDAiIHk9IjEwNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjJjNTVlIiByeD0iMTAiLz4KPHR5cGUgeD0iMzMwIiB5PSIxMTciIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+2YfYr9mK2Kkg2YXYrNin2YbZitipPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMTYwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIgcng9IjUiLz4KPHR5cGUgeD0iMzgwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9ImVuZCIgZGlyZWN0aW9uPSJydGwiPtin2YTYp9iz2YUg2KfZhNmD2KfZhdmEPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMjIwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMSIgcng9IjUiLz4KPHR5cGUgeD0iMzgwIiB5PSIyNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9ImVuZCIgZGlyZWN0aW9uPSJydGwiPtix2YLZhSDYp9mE2YfYp9iq2YE8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSIyODAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNDAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIiByeD0iNSIvPgo8dGV4dCB4PSIzODAiIHk9IjMwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0iZW5kIiBkaXJlY3Rpb249InJ0bCI+2KfZhNmF2K/ZitmG2Kk8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSIzNDAiIHdpZHRoPSIzNjAiIGhlaWdodD0iODAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIxIiByeD0iNSIvPgo8dGV4dCB4PSIzODAiIHk9IjM2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0iZW5kIiBkaXJlY3Rpb249InJ0bCI+2KfZhNi52YbZiNin2YYg2KfZhNmD2KfZhdmEPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iNDYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzNzM3MzciPtmF2KzYp9mG2YrYjDwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSI0NjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3MzczNyIgdGV4dC1hbmNob3I9ImVuZCI+TUFEIDUwMDA8L3RleHQ+Cjx0ZXh0IHg9IjIwIiB5PSI0ODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3MzczNyI+2KfZhNi02K3ZhjwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSI0ODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzIyYzU1ZSIgdGV4dC1hbmNob3I9ImVuZCI+2YXYrNin2YbZijwvdGV4dD4KPHR5cGUgeD0iMjAiIHk9IjUwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzA1OTY2OSI+2KfZhNmF2KzZhdmI2Lkg2KfZhNmD2YTZijwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSI1MDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwNTk2NjkiIHRleHQtYW5jaG9yPSJlbmQiPk1BRCA1MDAwPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iNTMwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjOWI4N2Y1IiByeD0iMTAiLz4KPHR5cGUgeD0iMjAwIiB5PSI1NTgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPtil2LHYs9in2YQg2KfZhNi32YTYqDwvdGV4dD4KPC9zdmc+',
    title: {
      ar: 'نموذج عربي مع عروض الكمية',
      en: 'Arabic Form with Quantity Offers'
    },
    description: {
      ar: 'نموذج دفع عند الاستلام باللغة العربية مع عروض الكمية الذكية',
      en: 'Arabic cash-on-delivery form with smart quantity offers'
    },
    theme: 'purple',
    features: {
      ar: ['عروض الكمية', 'واجهة عربية', 'تصميم متجاوب'],
      en: ['Quantity Offers', 'Arabic Interface', 'Responsive Design']
    }
  },
  {
    id: 2,
    type: 'blue-modern',
    imageSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZjBmOWZmIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iNCIgcng9IjIwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzNzM3MzciIHRleHQtYW5jaG9yPSJtaWRkbGUiPlVQTE9BRDwvdGV4dD4KPHR5cGUgeD0iMjAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzM3MzczNyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TE9HTzwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjEwMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0NSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjIiIHJ4PSI4Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIxMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSI+RnVsbCBOYW1lICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIxMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzNiODJmNiI+8J+RpDwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjE2MCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0NSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjIiIHJ4PSI4Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSI+UGhvbmUgTnVtYmVyICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIxOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzNiODJmNiI+8J+TnjwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjIyMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0NSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjIiIHJ4PSI4Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIyNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSI+Q2l0eSAqPC90ZXh0Pgo8dGV4dCB4PSIzMCIgeT0iMjU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMzYjgyZjYiPvCfk408L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSIyODAiIHdpZHRoPSIzNjAiIGhlaWdodD0iODAiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iOCIvPgo8dGV4dCB4PSIzMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPkFkZHJlc3MgKjwvdGV4dD4KPHR5cGUgeD0iMjAiIHk9IjM5MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzczNzM3Ij5TdWJ0b3RhbDwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSIzOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3MzczNyIgdGV4dC1hbmNob3I9ImVuZCI+MTAwIFVTRDwvdGV4dD4KPHR5cGUgeD0iMjAiIHk9IjQxMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzczNzM3Ij5TaGlwcGluZzwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSI0MTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzIyYzU1ZSIgdGV4dC1hbmNob3I9ImVuZCI+RnJlZTwvdGV4dD4KPHR5cGUgeD0iMjAiIHk9IjQzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzIyYzU1ZSI+VG90YWw8L3RleHQ+Cjx0ZXh0IHg9IjM4MCIgeT0iNDM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMjJjNTVlIiB0ZXh0LWFuY2hvcj0iZW5kIj4xMDAgVVNEPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iNDYwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjM2I4MmY2IiByeD0iMTAiLz4KPHR5cGUgeD0iMjAwIiB5PSI0ODgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPvCfm5IgU3VibWl0IE9yZGVyPC90ZXh0Pgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjU0MCIgcj0iMjAiIGZpbGw9IiNlZmY2ZmYiIHN0cm9rZT0iIzNiODJmNiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjYwIiB5PSI1NDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzNiODJmNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+aujwvdGV4dD4KPGNpcmNsZSBjeD0iMTQwIiBjeT0iNTQwIiByPSIyMCIgZmlsbD0iI2VmZjZmZiIgc3Ryb2tlPSIjM2I4MmY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPHR5cGUgeD0iMTQwIiB5PSI1NDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzNiODJmNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+boDwvdGV4dD4KPC9zdmc+',
    title: {
      ar: 'نموذج أزرق عصري',
      en: 'Blue Modern Form'
    },
    description: {
      ar: 'تصميم عصري باللون الأزرق مع شارات الثقة',
      en: 'Modern blue design with trust badges'
    },
    theme: 'blue',
    features: {
      ar: ['شارات الثقة', 'تصميم عصري', 'ألوان جذابة'],
      en: ['Trust Badges', 'Modern Design', 'Attractive Colors']
    }
  },
  {
    id: 3,
    type: 'black-white',
    imageSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iNCIgcng9IjIwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyMCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMzMzMiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlVQTE9BRDwvdGV4dD4KPHR5cGUgeD0iMjAwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TE9HTzwvdGV4dD4KPHJlY3QgeD0iMjAiIHk9IjEwMCIgd2lkdGg9IjM2MCIgaGVpZ2h0PSI0NSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjEiIHJ4PSI4Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIxMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyI+RnVsbCBOYW1lICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIxMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSI+8J+RpCBFbnRlciBmdWxsIG5hbWU8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSIxNjAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNDUiIGZpbGw9IiNmZmYiIHN0cm9rZT0iI2NjYyIgc3Ryb2tlLXdpZHRoPSIxIiByeD0iOCIvPgo8dGV4dCB4PSIzMCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlBob25lIE51bWJlciAqPC90ZXh0Pgo8dGV4dCB4PSIzMCIgeT0iMTk1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPvCfk54gRW50ZXIgcGhvbmUgbnVtYmVyPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMjIwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIgcng9IjgiLz4KPHR5cGUgeD0iMzAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5DaXR5ICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIyNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSI+8J+TjSBFbnRlciBjaXR5PC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMjgwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIgcng9IjgiLz4KPHR5cGUgeD0iMzAiIHk9IjMwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5BZGRyZXNzICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIzMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSI+RW50ZXIgZnVsbCBhZGRyZXNzPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iMzkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlN1YnRvdGFsPC90ZXh0Pgo8dGV4dCB4PSIzODAiIHk9IjM5MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0iZW5kIj4xMDAgVVNEPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iNDEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlNoaXBwaW5nPC90ZXh0Pgo8dGV4dCB4PSIzODAiIHk9IjQxMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMjJjNTVlIiB0ZXh0LWFuY2hvcj0iZW5kIj5GcmVlPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iNDM1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMjJjNTVlIj5Ub3RhbDwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSI0MzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMyMmM1NWUiIHRleHQtYW5jaG9yPSJlbmQiPjEwMCBVU0Q8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI0NjAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNTAiIGZpbGw9IiMwMDAiIHJ4PSIxMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjQ4OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+bkiBTdWJtaXQgT3JkZXI8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI1MjAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNTAiIGZpbGw9IiMyMmM1NWUiIHJ4PSIxMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjU0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+SrCBPcmRlciBieSBXaGF0c0FwcDwvdGV4dD4KPC9zdmc+',
    title: {
      ar: 'نموذج احترافي أبيض وأسود',
      en: 'Black & White Professional Form'
    },
    description: {
      ar: 'تصميم احترافي بالأبيض والأسود مع زر واتساب',
      en: 'Professional black and white design with WhatsApp button'
    },
    theme: 'monochrome',
    features: {
      ar: ['زر واتساب', 'تصميم احترافي', 'سهولة الاستخدام'],
      en: ['WhatsApp Button', 'Professional Design', 'Easy to Use']
    }
  },
  {
    id: 4,
    type: 'purple-timer',
    imageSrc: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZmFmNWZmIiBzdHJva2U9IiM5YjU5YjYiIHN0cm9rZS13aWR0aD0iNCIgcng9IjIwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM3YzNhZWQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZpbGwgb3V0IHRoZSBmb3JtIHRvIGFwcGx5PC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iNzAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNDUiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzliNTliNiIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iOCIvPgo8dGV4dCB4PSIzMCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyI+RnVsbCBOYW1lICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzliNTliNiI+8J+RpCBFbnRlciBmdWxsIG5hbWU8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSIxMzAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNDUiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzliNTliNiIgc3Ryb2tlLXdpZHRoPSIyIiByeD0iOCIvPgo8dGV4dCB4PSIzMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlBob25lIE51bWJlciAqPC90ZXh0Pgo8dGV4dCB4PSIzMCIgeT0iMTY1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5YjU5YjYiPvCfk54gRW50ZXIgcGhvbmUgbnVtYmVyPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMTkwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjZmZmIiBzdHJva2U9IiM5YjU5YjYiIHN0cm9rZS13aWR0aD0iMiIgcng9IjgiLz4KPHR5cGUgeD0iMzAiIHk9IjIxMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5DaXR5ICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIyMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzliNTliNiI+8J+TjSBFbnRlciBjaXR5PC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iMjUwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiM5YjU5YjYiIHN0cm9rZS13aWR0aD0iMiIgcng9IjgiLz4KPHR5cGUgeD0iMzAiIHk9IjI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5BZGRyZXNzICo8L3RleHQ+Cjx0ZXh0IHg9IjMwIiB5PSIyODUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzliNTliNiI+RW50ZXIgZnVsbCBhZGRyZXNzPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iMzYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlN1YnRvdGFsPC90ZXh0Pgo8dGV4dCB4PSIzODAiIHk9IjM2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0iZW5kIj4xMDAgVVNEPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iMzgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlNoaXBwaW5nPC90ZXh0Pgo8dGV4dCB4PSIzODAiIHk9IjM4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMjJjNTVlIiB0ZXh0LWFuY2hvcj0iZW5kIj5GcmVlPC90ZXh0Pgo8dGV4dCB4PSIyMCIgeT0iNDA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMjJjNTVlIj5Ub3RhbDwvdGV4dD4KPHR5cGUgeD0iMzgwIiB5PSI0MDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMyMmM1NWUiIHRleHQtYW5jaG9yPSJlbmQiPjEwMCBVU0Q8L3RleHQ+CjxyZWN0IHg9IjIwIiB5PSI0MzAiIHdpZHRoPSIzNjAiIGhlaWdodD0iNTAiIGZpbGw9IiM5YjU5YjYiIHJ4PSIxMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjQ1OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U3VibWl0IE9yZGVyPC90ZXh0Pgo8cmVjdCB4PSIyMCIgeT0iNDkwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjOWI1OWI2IiByeD0iMTAiLz4KPHR5cGUgeD0iMjAwIiB5PSI1MTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UmVtYWluaW5nIG9uIG9mZmVyIPCfkqU8L3RleHQ+CjxyZWN0IHg9IjQwIiB5PSI1MjUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2ZmZiIgcng9IjUiLz4KPHR5cGUgeD0iNzAiIHk9IjU0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzliNTliNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MDE8L3RleHQ+Cjx0ZXh0IHg9IjExNSIgeT0iNTQ4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj46PC90ZXh0Pgo8cmVjdCB4PSIxMzAiIHk9IjUyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIiByeD0iNSIvPgo8dGV4dCB4PSIxNjAiIHk9IjU0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzliNTliNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MjM8L3RleHQ+Cjx0ZXh0IHg9IjIwNSIgeT0iNTQ4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj46PC90ZXh0Pgo8cmVjdCB4PSIyMjAiIHk9IjUyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIiByeD0iNSIvPgo8dGV4dCB4PSIyNTAiIHk9IjU0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzliNTliNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+NTk8L3RleHQ+Cjx0ZXh0IHg9IjI5NSIgeT0iNTQ4IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj46PC90ZXh0Pgo8cmVjdCB4PSIzMTAiIHk9IjUyNSIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZmIiByeD0iNSIvPgo8dGV4dCB4PSIzNDAiIHk9IjU0OCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzliNTliNiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+NDA8L3RleHQ+Cjx0ZXh0IHg9IjcwIiB5PSI1NzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGF5czwvdGV4dD4KPHR5cGUgeD0iMTYwIiB5PSI1NzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SHJzPC90ZXh0Pgo8dGV4dCB4PSIyNTAiIHk9IjU3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NaW5zPC90ZXh0Pgo8dGV4dCB4PSIzNDAiIHk9IjU3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TZWM8L3RleHQ+Cjwvc3ZnPg==',
    title: {
      ar: 'نموذج بنفسجي مع مؤقت',
      en: 'Purple Form with Timer'
    },
    description: {
      ar: 'نموذج بنفسجي مع مؤقت العرض المحدود',
      en: 'Purple form with limited time offer countdown'
    },
    theme: 'gradient',
    features: {
      ar: ['مؤقت العرض', 'ألوان جذابة', 'إحساس بالعجلة'],
      en: ['Countdown Timer', 'Attractive Colors', 'Urgency Feel']
    }
  }
];

// مكون عرض النموذج بالصورة
const FormPreview = ({ template }: { template: typeof formTemplates[0] }) => {
  const { language } = useI18n();

  return (
    <div className="flex-shrink-0 w-full flex justify-center">
      <div className="relative max-w-sm mx-auto">
        <img
          src={template.imageSrc}
          alt={template.title[language]}
          className="w-full h-auto rounded-3xl shadow-lg border-4 border-opacity-20"
          style={{
            borderColor: template.theme === 'purple' ? '#9b87f5' :
                        template.theme === 'blue' ? '#3b82f6' :
                        template.theme === 'monochrome' ? '#333' :
                        '#9b59b6'
          }}
        />
        {/* طبقة تفاعلية شفافة */}
        <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-5 transition-all duration-300 rounded-3xl cursor-pointer" />
      </div>
    </div>
  );
};



const FormSlideshow: React.FC = () => {
  const { language } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // التبديل التلقائي كل 4 ثوانٍ
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % formTemplates.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // إعادة تشغيل التبديل التلقائي بعد 10 ثوانٍ
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + formTemplates.length) % formTemplates.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % formTemplates.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const currentTemplate = formTemplates[currentSlide];

  // دالة لعرض النموذج المناسب
  const renderCurrentForm = () => {
    return <FormPreview template={currentTemplate} />;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* الحاوية الرئيسية للعرض */}
      <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-purple-200">
        {/* النموذج الحالي */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {renderCurrentForm()}

          {/* تأثير الإضاءة */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* أزرار التنقل */}
        <button
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20"
          aria-label={language === 'ar' ? 'السابق' : 'Previous'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full p-3 shadow-xl transition-all duration-300 hover:scale-110 z-20"
          aria-label={language === 'ar' ? 'التالي' : 'Next'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* مؤشرات الشرائح */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
          {formTemplates.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white scale-125 shadow-lg'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`${language === 'ar' ? 'الانتقال للشريحة' : 'Go to slide'} ${index + 1}`}
            />
          ))}
        </div>

        {/* شارة "مباشر" للتبديل التلقائي */}
        {isAutoPlaying && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-medium">{language === 'ar' ? 'مباشر' : 'LIVE'}</span>
          </div>
        )}

        {/* رقم الشريحة */}
        <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full">
          {currentSlide + 1} / {formTemplates.length}
        </div>
      </div>

      {/* معلومات النموذج الحالي */}
      <div className="mt-6 text-center">
        <h4 className="text-lg font-bold text-gray-800 mb-2">
          {currentTemplate.title[language]}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {currentTemplate.description[language]}
        </p>

        {/* ميزات النموذج */}
        <div className="flex justify-center flex-wrap gap-2 mb-4">
          {currentTemplate.features[language].map((feature, index) => (
            <span key={index} className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full">
              {feature}
            </span>
          ))}
        </div>

        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span>✨ {language === 'ar' ? 'تصميم متجاوب' : 'Responsive'}</span>
          <span>🎨 {language === 'ar' ? 'قابل للتخصيص' : 'Customizable'}</span>
          <span>⚡ {language === 'ar' ? 'سريع التحميل' : 'Fast Loading'}</span>
        </div>
      </div>
    </div>
  );
};

export default FormSlideshow;
