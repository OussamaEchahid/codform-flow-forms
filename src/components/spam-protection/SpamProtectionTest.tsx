import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { spamProtectionService } from '@/services/SpamProtectionService';
import { checkSpamProtection } from '@/utils/spam-protection';
import { getActiveShopId } from '@/utils/shop-utils';
import { toast } from 'sonner';
import { Shield, AlertTriangle, CheckCircle, TestTube, Loader2 } from 'lucide-react';

const SpamProtectionTest: React.FC = () => {
  const { language } = useI18n();
  const [testIP, setTestIP] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingIP, setIsTestingIP] = useState(false);
  const [isTestingCurrent, setIsTestingCurrent] = useState(false);
  const [currentUserResult, setCurrentUserResult] = useState<any>(null);

  // اختبار عنوان IP محدد
  const testSpecificIP = async () => {
    if (!testIP.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال عنوان IP' : 'Please enter an IP address');
      return;
    }

    try {
      setIsTestingIP(true);
      const shopId = getActiveShopId();
      
      if (!shopId) {
        throw new Error(language === 'ar' ? 'لا يوجد متجر نشط' : 'No active shop found');
      }

      const result = await spamProtectionService.checkIPBlocked(testIP.trim(), shopId);
      setTestResult({
        ip: testIP.trim(),
        ...result,
        timestamp: new Date().toISOString()
      });

      if (result.is_blocked) {
        toast.warning(language === 'ar' ? 'عنوان IP محظور' : 'IP address is blocked');
      } else {
        toast.success(language === 'ar' ? 'عنوان IP مسموح' : 'IP address is allowed');
      }
    } catch (error) {
      console.error('Error testing IP:', error);
      toast.error(error instanceof Error ? error.message : (language === 'ar' ? 'فشل في اختبار عنوان IP' : 'Failed to test IP address'));
    } finally {
      setIsTestingIP(false);
    }
  };

  // اختبار المستخدم الحالي
  const testCurrentUser = async () => {
    try {
      setIsTestingCurrent(true);
      const shopId = getActiveShopId();
      
      if (!shopId) {
        throw new Error(language === 'ar' ? 'لا يوجد متجر نشط' : 'No active shop found');
      }

      // الحصول على IP الحالي
      const userIP = await spamProtectionService.getCurrentUserIP();
      
      if (!userIP) {
        throw new Error(language === 'ar' ? 'لا يمكن الحصول على عنوان IP الحالي' : 'Cannot get current IP address');
      }

      // التحقق من الحماية
      const protection = await checkSpamProtection(shopId);
      
      setCurrentUserResult({
        ip: userIP,
        ...protection,
        timestamp: new Date().toISOString()
      });

      if (protection.shouldBlock) {
        toast.warning(language === 'ar' ? 'أنت محظور حالياً' : 'You are currently blocked');
      } else {
        toast.success(language === 'ar' ? 'أنت مسموح حالياً' : 'You are currently allowed');
      }
    } catch (error) {
      console.error('Error testing current user:', error);
      toast.error(error instanceof Error ? error.message : (language === 'ar' ? 'فشل في اختبار المستخدم الحالي' : 'Failed to test current user'));
    } finally {
      setIsTestingCurrent(false);
    }
  };

  // تنسيق النتيجة
  const formatResult = (result: any) => {
    if (!result) return null;

    const isBlocked = result.is_blocked || result.shouldBlock;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <Badge variant={isBlocked ? 'destructive' : 'default'}>
            {isBlocked 
              ? (language === 'ar' ? 'محظور' : 'Blocked')
              : (language === 'ar' ? 'مسموح' : 'Allowed')
            }
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <span className="font-medium">
              {language === 'ar' ? 'عنوان IP: ' : 'IP Address: '}
            </span>
            <code className="bg-muted px-2 py-1 rounded">{result.ip}</code>
          </div>
          
          {result.reason && (
            <div>
              <span className="font-medium">
                {language === 'ar' ? 'السبب: ' : 'Reason: '}
              </span>
              <span>{result.reason}</span>
            </div>
          )}
          
          {result.redirectUrl && (
            <div>
              <span className="font-medium">
                {language === 'ar' ? 'رابط إعادة التوجيه: ' : 'Redirect URL: '}
              </span>
              <a 
                href={result.redirectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {result.redirectUrl}
              </a>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            {language === 'ar' ? 'وقت الاختبار: ' : 'Test time: '}
            {new Date(result.timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            {language === 'ar' ? 'اختبار حماية البريد العشوائي' : 'Spam Protection Test'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'اختبر نظام حماية البريد العشوائي للتأكد من عمله بشكل صحيح'
              : 'Test the spam protection system to ensure it works correctly'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* اختبار عنوان IP محدد */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'اختبار عنوان IP محدد' : 'Test Specific IP Address'}
            </h3>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="test-ip">
                  {language === 'ar' ? 'عنوان IP' : 'IP Address'}
                </Label>
                <Input
                  id="test-ip"
                  type="text"
                  placeholder="192.168.1.1"
                  value={testIP}
                  onChange={(e) => setTestIP(e.target.value)}
                  disabled={isTestingIP}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={testSpecificIP}
                  disabled={isTestingIP || !testIP.trim()}
                  className="flex items-center gap-2"
                >
                  {isTestingIP ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {isTestingIP 
                    ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...')
                    : (language === 'ar' ? 'اختبار' : 'Test')
                  }
                </Button>
              </div>
            </div>

            {testResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === 'ar' ? 'نتيجة الاختبار' : 'Test Result'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatResult(testResult)}
                </CardContent>
              </Card>
            )}
          </div>

          {/* اختبار المستخدم الحالي */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {language === 'ar' ? 'اختبار المستخدم الحالي' : 'Test Current User'}
            </h3>
            
            <Button 
              onClick={testCurrentUser}
              disabled={isTestingCurrent}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isTestingCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {isTestingCurrent 
                ? (language === 'ar' ? 'جاري الاختبار...' : 'Testing...')
                : (language === 'ar' ? 'اختبار عنوان IP الحالي' : 'Test Current IP')
              }
            </Button>

            {currentUserResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === 'ar' ? 'نتيجة اختبار المستخدم الحالي' : 'Current User Test Result'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formatResult(currentUserResult)}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpamProtectionTest;
