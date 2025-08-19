import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  created_at: string;
  shop_id: string;
}

export default function SpamSettings() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalActive, setModalActive] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // جلب قائمة الـ IPs المحظورة
  const fetchBlockedIPs = async () => {
    try {
      setLoading(true);
      const { data, error } = await shopifySupabase
        .from('blocked_ips')
        .select('id, ip_address, reason, created_at, shop_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlockedIPs((data as unknown as BlockedIP[]) || []);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      toast.error('خطأ في جلب قائمة الـ IPs المحظورة');
    } finally {
      setLoading(false);
    }
  };

  // إضافة IP جديد للحظر
  const addBlockedIP = async () => {
    if (!newIP.trim()) {
      toast.error('يرجى إدخال عنوان IP');
      return;
    }

    try {
      setSubmitting(true);
      const { data, error } = await shopifySupabase
        .from('blocked_ips')
        .insert([
          {
            ip_address: newIP.trim(),
            reason: newReason.trim() || 'تم حظره يدوياً',
            shop_id: 'default' // يمكن تخصيصه حسب المتجر
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setBlockedIPs(prev => [(data as unknown as BlockedIP), ...prev]);
      setModalActive(false);
      setNewIP('');
      setNewReason('');
      toast.success('تم إضافة IP للحظر بنجاح');
    } catch (error) {
      console.error('Error adding blocked IP:', error);
      toast.error('خطأ في إضافة IP للحظر');
    } finally {
      setSubmitting(false);
    }
  };

  // حذف IP من الحظر
  const removeBlockedIP = async (id: string) => {
    try {
      const { error } = await shopifySupabase
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockedIPs(prev => prev.filter(ip => ip.id !== id));
      toast.success('تم إلغاء حظر IP بنجاح');
    } catch (error) {
      console.error('Error removing blocked IP:', error);
      toast.error('خطأ في إلغاء حظر IP');
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إعدادات حماية البريد العشوائي</h1>
          <p className="text-muted-foreground mt-2">إدارة قائمة الـ IPs المحظورة</p>
        </div>
        <Dialog open={modalActive} onOpenChange={setModalActive}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              إضافة IP للحظر
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة IP للحظر</DialogTitle>
              <DialogDescription>
                أدخل عنوان IP الذي تريد حظره من الوصول إلى المتجر
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ip">عنوان IP</Label>
                <Input
                  id="ip"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="مثال: 192.168.1.1"
                />
              </div>
              <div>
                <Label htmlFor="reason">سبب الحظر (اختياري)</Label>
                <Textarea
                  id="reason"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="مثال: نشاط مشبوه، بريد عشوائي، إلخ"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalActive(false)}>
                إلغاء
              </Button>
              <Button onClick={addBlockedIP} disabled={submitting}>
                {submitting ? 'جاري الإضافة...' : 'إضافة للحظر'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>حماية متجر Shopify</AlertTitle>
        <AlertDescription>
          هذه الإعدادات تتحكم في حماية متجر Shopify الخاص بك من المستخدمين المحظورين.
          المستخدمون الذين لديهم IPs محظورة لن يتمكنوا من الوصول إلى المتجر.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الـ IPs المحظورة</CardTitle>
          <CardDescription>
            {blockedIPs.length} IP محظور حالياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : blockedIPs.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">لا توجد IPs محظورة حالياً</p>
              <Button onClick={() => setModalActive(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة IP للحظر
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان IP</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>تاريخ الحظر</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedIPs.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-mono">{ip.ip_address}</TableCell>
                    <TableCell>{ip.reason}</TableCell>
                    <TableCell>
                      {new Date(ip.created_at).toLocaleString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeBlockedIP(ip.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        إلغاء الحظر
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
