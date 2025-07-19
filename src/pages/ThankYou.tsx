import { CheckCircle, Phone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ThankYou = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تم إرسال طلبكم بنجاح!
            </h1>
            <p className="text-muted-foreground">
              شكراً لكم على ثقتكم. سيتم التواصل معكم قريباً لتأكيد الطلب.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>سيتم التواصل معكم خلال 24 ساعة</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>تحقق من بريدكم الإلكتروني للحصول على تفاصيل الطلب</span>
            </div>
          </div>

          <Button 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            العودة للمتجر
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYou;