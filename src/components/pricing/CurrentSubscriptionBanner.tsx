import React from 'react';

interface CurrentSubscriptionBannerProps {
  subscription: any;
  language: string;
}

export const CurrentSubscriptionBanner: React.FC<CurrentSubscriptionBannerProps> = ({
  subscription,
  language
}) => {
  if (!subscription) return null;

  return (
    <div className="mb-8 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">✓</span>
          </div>
          <div>
            <div className="text-sm font-medium text-emerald-800">
              <span className="capitalize">{subscription.plan_type}</span>
              <span className="mx-2">•</span>
              <span>{subscription.status}</span>
            </div>
            {subscription.next_billing_date && (
              <div className="text-xs text-emerald-600 mt-1">
                {language === 'ar' ? 'التجديد في:' : 'Renews on:'} {' '}
                {new Date(subscription.next_billing_date).toLocaleDateString(
                  language === 'ar' ? 'ar' : 'en',
                  { month: 'long', day: 'numeric', year: 'numeric' }
                )}
              </div>
            )}
          </div>
        </div>
        
        {subscription.status === 'pending' && (
          <div className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
            {language === 'ar' ? 'قيد التفعيل' : 'Activating'}
          </div>
        )}
      </div>
    </div>
  );
};