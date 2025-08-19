import React, { useState, useEffect } from 'react';
import { Card, Page, Layout, Button, DataTable, TextField, Modal, Banner, Toast, Frame } from '@shopify/polaris';
import { DeleteIcon, PlusIcon } from '@shopify/polaris-icons';
import { shopifySupabase } from '@/lib/shopify/supabase-client';

interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  shop_id: string;
}

export default function SpamSettings() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalActive, setModalActive] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [toast, setToast] = useState<{ content: string; error?: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // جلب قائمة الـ IPs المحظورة
  const fetchBlockedIPs = async () => {
    try {
      setLoading(true);
      const { data, error } = await shopifySupabase
        .from('blocked_ips')
        .select('*')
        .order('blocked_at', { ascending: false });

      if (error) throw error;
      setBlockedIPs(data || []);
    } catch (error) {
      console.error('Error fetching blocked IPs:', error);
      setToast({ content: 'خطأ في جلب قائمة الـ IPs المحظورة', error: true });
    } finally {
      setLoading(false);
    }
  };

  // إضافة IP جديد للحظر
  const addBlockedIP = async () => {
    if (!newIP.trim()) {
      setToast({ content: 'يرجى إدخال عنوان IP', error: true });
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

      setBlockedIPs(prev => [data, ...prev]);
      setModalActive(false);
      setNewIP('');
      setNewReason('');
      setToast({ content: 'تم إضافة IP للحظر بنجاح' });
    } catch (error) {
      console.error('Error adding blocked IP:', error);
      setToast({ content: 'خطأ في إضافة IP للحظر', error: true });
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
      setToast({ content: 'تم إلغاء حظر IP بنجاح' });
    } catch (error) {
      console.error('Error removing blocked IP:', error);
      setToast({ content: 'خطأ في إلغاء حظر IP', error: true });
    }
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  // تحضير بيانات الجدول
  const tableRows = blockedIPs.map(ip => [
    ip.ip_address,
    ip.reason,
    new Date(ip.blocked_at).toLocaleString('ar-SA'),
    <Button
      key={ip.id}
      icon={DeleteIcon}
      variant="primary"
      tone="critical"
      onClick={() => removeBlockedIP(ip.id)}
      size="slim"
    >
      إلغاء الحظر
    </Button>
  ]);

  return (
    <Frame>
      <Page
        title="إعدادات حماية البريد العشوائي"
        subtitle="إدارة قائمة الـ IPs المحظورة"
        primaryAction={{
          content: 'إضافة IP للحظر',
          icon: PlusIcon,
          onAction: () => setModalActive(true)
        }}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="حماية متجر Shopify"
              status="info"
            >
              <p>
                هذه الإعدادات تتحكم في حماية متجر Shopify الخاص بك من المستخدمين المحظورين.
                المستخدمون الذين لديهم IPs محظورة لن يتمكنوا من الوصول إلى المتجر.
              </p>
            </Banner>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['عنوان IP', 'السبب', 'تاريخ الحظر', 'الإجراءات']}
                rows={tableRows}
                loading={loading}
                emptyState={
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>لا توجد IPs محظورة حالياً</p>
                    <Button
                      variant="primary"
                      onClick={() => setModalActive(true)}
                      style={{ marginTop: '1rem' }}
                    >
                      إضافة IP للحظر
                    </Button>
                  </div>
                }
              />
            </Card>
          </Layout.Section>
        </Layout>

        {/* Modal لإضافة IP جديد */}
        <Modal
          open={modalActive}
          onClose={() => setModalActive(false)}
          title="إضافة IP للحظر"
          primaryAction={{
            content: 'إضافة للحظر',
            onAction: addBlockedIP,
            loading: submitting
          }}
          secondaryActions={[
            {
              content: 'إلغاء',
              onAction: () => setModalActive(false)
            }
          ]}
        >
          <Modal.Section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <TextField
                label="عنوان IP"
                value={newIP}
                onChange={setNewIP}
                placeholder="مثال: 192.168.1.1"
                autoComplete="off"
              />
              <TextField
                label="سبب الحظر (اختياري)"
                value={newReason}
                onChange={setNewReason}
                placeholder="مثال: نشاط مشبوه، بريد عشوائي، إلخ"
                multiline={2}
                autoComplete="off"
              />
            </div>
          </Modal.Section>
        </Modal>

        {/* Toast للإشعارات */}
        {toast && (
          <Toast
            content={toast.content}
            error={toast.error}
            onDismiss={() => setToast(null)}
          />
        )}
      </Page>
    </Frame>
  );
}
