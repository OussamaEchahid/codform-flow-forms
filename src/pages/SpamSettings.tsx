import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, Plus, Trash2, Shield } from "lucide-react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { useI18n } from "@/lib/i18n";

interface BlockedIP {
  id: number;
  ip: string;
  date: string;
}

const SpamSettings = () => {
  const { t } = useI18n();
  const [newIP, setNewIP] = useState("");
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([
    { id: 1, ip: "192.168.1.100", date: "2024-01-15" },
    { id: 2, ip: "10.0.0.50", date: "2024-01-20" },
  ]);

  const addBlockedIP = () => {
    if (newIP && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(newIP)) {
      const blockedIP: BlockedIP = {
        id: Date.now(),
        ip: newIP,
        date: new Date().toISOString().split('T')[0],
      };
      setBlockedIPs([...blockedIPs, blockedIP]);
      setNewIP("");
    }
  };

  const removeBlockedIP = (id: number) => {
    setBlockedIPs(blockedIPs.filter(ip => ip.id !== id));
  };

  const handleSave = () => {
    console.log("Saving spam settings...");
  };

  return (
    <SettingsLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              {t('spamSettings')}
            </h1>
            <p className="text-muted-foreground">{t('spamSettingsDescription')}</p>
          </div>
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {t('saveSettings')}
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('blockIP')}</CardTitle>
              <CardDescription>{t('blockIP')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="new-ip">{t('ipAddress')}</Label>
                  <Input
                    id="new-ip"
                    type="text"
                    placeholder="192.168.1.1"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addBlockedIP} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t('blockIP')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('blockedIPsList')}</CardTitle>
              <CardDescription>{t('blockedIPsList')}</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('noBlockedIPs')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('blockDate')}</TableHead>
                      <TableHead>{t('ipAddress')}</TableHead>
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((blockedIP) => (
                      <TableRow key={blockedIP.id}>
                        <TableCell>{blockedIP.date}</TableCell>
                        <TableCell className="font-mono">{blockedIP.ip}</TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeBlockedIP(blockedIP.id)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            {t('removeBlock')}
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
      </div>
    </SettingsLayout>
  );
};

export default SpamSettings;