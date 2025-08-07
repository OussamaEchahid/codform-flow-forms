import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Facebook, Music, Plus, Settings, Target, BarChart3, Eye, Code, Play, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppSidebar from '@/components/layout/AppSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useShopifyStores } from '@/hooks/useShopifyStores';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';

interface PixelSettings {
  id: string;
  enabled: boolean;
  pixelId: string;
  name: string;
  eventType: 'Lead' | 'Purchase';
  target: 'All' | 'Collection' | 'Product';
  targetId?: string;
  conversionApiEnabled: boolean;
  accessToken?: string;
  platform?: string;
  shop_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface TrackingEvent {
  name: string;
  enabled: boolean;
  description: string;
}

const AdvertisingTracking = () => {
  const { toast } = useToast();
  const { stores, activeStore } = useShopifyStores();
  const { products, loading: productsLoading, loadProducts } = useShopifyProducts();
  
  const [facebookPixels, setFacebookPixels] = useState<PixelSettings[]>([]);
  const [snapchatPixels, setSnapchatPixels] = useState<PixelSettings[]>([]);
  const [tiktokPixels, setTiktokPixels] = useState<PixelSettings[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'snapchat' | 'tiktok'>('facebook');
  
  const [newPixel, setNewPixel] = useState<PixelSettings>({
    id: '',
    enabled: true,
    pixelId: '',
    name: '',
    eventType: 'Lead',
    target: 'All',
    conversionApiEnabled: false,
  });

  // Load data on component mount
  useEffect(() => {
    if (activeStore) {
      loadPixelsAndForms();
      loadProducts(activeStore);
    }
  }, [activeStore]);

  const loadPixelsAndForms = async () => {
    if (!activeStore) return;
    
    setIsLoading(true);
    try {
      // Load pixels from Supabase database using direct API call
      const response = await fetch(
        `https://trlklwixfeaexhydzaue.supabase.co/rest/v1/advertising_pixels?shop_id=eq.${activeStore}`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const pixelsData = await response.json();
        console.log('✅ Raw pixels data from database:', pixelsData);
        
        // Transform data to match component interface
        const transformedPixels = pixelsData.map((p: any) => ({
          id: p.id,
          enabled: p.enabled,
          pixelId: p.pixel_id,
          name: p.name,
          eventType: p.event_type,
          target: p.target_type,
          targetId: p.target_id,
          conversionApiEnabled: p.conversion_api_enabled,
          accessToken: p.access_token,
          platform: p.platform,
          shop_id: p.shop_id,
          created_at: p.created_at,
          updated_at: p.updated_at
        }));

        const facebook = transformedPixels.filter((p: any) => p.platform === 'facebook');
        const snapchat = transformedPixels.filter((p: any) => p.platform === 'snapchat');
        const tiktok = transformedPixels.filter((p: any) => p.platform === 'tiktok');
        
        setFacebookPixels(facebook);
        setSnapchatPixels(snapchat);
        setTiktokPixels(tiktok);
        
        console.log('✅ Loaded pixels from database:', { facebook: facebook.length, snapchat: snapchat.length, tiktok: tiktok.length });
        
        // Migrate data from localStorage if database is empty and localStorage has data
        if (pixelsData.length === 0) {
          await migrateFromLocalStorage();
        }
      } else {
        console.error('Error loading pixels:', response.statusText);
        // Fallback to localStorage
        await migrateFromLocalStorage();
      }

      // Load forms for tracking
      const { data: formsData } = await supabase
        .from('forms')
        .select('*')
        .eq('shop_id', activeStore);

      if (formsData) {
        setForms(formsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      await migrateFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const migrateFromLocalStorage = async () => {
    if (!activeStore) return;
    
    try {
      const savedPixels = localStorage.getItem(`advertising_pixels_${activeStore}`);
      if (savedPixels) {
        const pixels = JSON.parse(savedPixels);
        console.log('🔄 Migrating pixels from localStorage to database:', pixels.length);
        
        for (const pixel of pixels) {
          await addPixelToDatabase({
            platform: pixel.platform,
            name: pixel.name,
            pixel_id: pixel.pixelId,
            event_type: pixel.eventType,
            target_type: pixel.target,
            target_id: pixel.targetId || null,
            conversion_api_enabled: pixel.conversionApiEnabled || false,
            access_token: pixel.accessToken || null,
            enabled: pixel.enabled,
            shop_id: activeStore
          });
        }
        
        // Clear localStorage after successful migration
        localStorage.removeItem(`advertising_pixels_${activeStore}`);
        console.log('✅ Migration completed successfully');
        
        // Reload data after migration
        await loadPixelsAndForms();
      }
    } catch (error) {
      console.error('❌ Error during migration:', error);
    }
  };

  const addPixelToDatabase = async (pixelData: any) => {
    const response = await fetch(
      'https://trlklwixfeaexhydzaue.supabase.co/rest/v1/advertising_pixels',
      {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixelData)
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error adding pixel to database:', error);
      throw new Error(error);
    }
  };

  // Collections (static for now, can be enhanced to load from Shopify)
  const collections = [
    { id: 'collection1', name: 'Summer Collection' },
    { id: 'collection2', name: 'Winter Collection' },
    { id: 'collection3', name: 'New Arrivals' },
  ];

  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([
    { name: 'Page View', enabled: true, description: 'Track when users visit your website' },
    { name: 'Add to Cart', enabled: true, description: 'Track when users add items to cart' },
    { name: 'Purchase', enabled: true, description: 'Track completed purchases' },
    { name: 'Lead', enabled: false, description: 'Track lead generation events' },
    { name: 'Complete Registration', enabled: false, description: 'Track user registrations' },
    { name: 'Contact', enabled: false, description: 'Track contact form submissions' },
  ]);

  const handleCreatePixel = async () => {
    if (!newPixel.name || !newPixel.pixelId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!activeStore) {
      toast({
        title: "Error",
        description: "No active store connected.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pixelData = {
        platform: selectedPlatform,
        name: newPixel.name,
        pixel_id: newPixel.pixelId,
        event_type: newPixel.eventType,
        target_type: newPixel.target,
        target_id: newPixel.targetId || null,
        conversion_api_enabled: newPixel.conversionApiEnabled,
        access_token: newPixel.accessToken || null,
        enabled: newPixel.enabled,
        shop_id: activeStore
      };

      // Save to Supabase database
      const response = await fetch(
        'https://trlklwixfeaexhydzaue.supabase.co/rest/v1/advertising_pixels',
        {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(pixelData)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const [data] = await response.json();

      // Update local state
      const createdPixel = { 
        ...data, 
        pixelId: data.pixel_id, 
        eventType: data.event_type, 
        target: data.target_type,
        conversionApiEnabled: data.conversion_api_enabled,
        targetId: data.target_id,
        accessToken: data.access_token
      };
      switch (selectedPlatform) {
        case 'facebook':
          setFacebookPixels(prev => [...prev, createdPixel]);
          break;
        case 'snapchat':
          setSnapchatPixels(prev => [...prev, createdPixel]);
          break;
        case 'tiktok':
          setTiktokPixels(prev => [...prev, createdPixel]);
          break;
      }

      setNewPixel({
        id: '',
        enabled: true,
        pixelId: '',
        name: '',
        eventType: 'Lead',
        target: 'All',
        conversionApiEnabled: false,
      });
      
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Pixel Created",
        description: `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} pixel has been created and saved successfully.`,
      });
    } catch (error) {
      console.error('Error creating pixel:', error);
      toast({
        title: "Error",
        description: "Failed to create pixel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      // Save tracking events settings
      localStorage.setItem(`tracking_events_${activeStore}`, JSON.stringify(trackingEvents));

      toast({
        title: "Settings Saved",
        description: "Your advertising tracking settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testPixelEvent = (platform: string, pixelId: string, eventType: string) => {
    // Generate test event code
    let testCode = '';
    switch (platform) {
      case 'facebook':
        testCode = `fbq('track', '${eventType}', { test_event_code: 'TEST123' });`;
        break;
      case 'snapchat':
        testCode = `snaptr('track', '${eventType.toUpperCase()}', { test_mode: true });`;
        break;
      case 'tiktok':
        testCode = `ttq.track('${eventType}', { test_event_code: 'TEST123' });`;
        break;
    }

    // For testing, we'll show the code to copy to browser console
    navigator.clipboard.writeText(testCode);
    toast({
      title: "Test Code Copied",
      description: `Test code for ${platform} pixel has been copied. Paste it in browser console to test.`,
    });
  };

  const copyPixelCode = (platform: string, pixelId: string, eventType: string = 'Lead') => {
    if (!pixelId) {
      toast({
        title: "Error",
        description: "Please enter a pixel ID first.",
        variant: "destructive",
      });
      return;
    }

    let code = '';
    switch (platform) {
      case 'facebook':
        code = `<!-- Facebook Pixel Code with Form Integration -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');

// Form submission tracking
document.addEventListener('formSubmitted', function(e) {
  fbq('track', '${eventType}', {
    content_name: e.detail.formName || 'Lead Form',
    content_category: 'form_submission',
    value: 1.00,
    currency: 'USD'
  });
});
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`;
        break;
      case 'snapchat':
        code = `<!-- Snapchat Pixel Code with Form Integration -->
<script type='text/javascript'>
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
{a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
r.src=n;var u=t.getElementsByTagName(s)[0];
u.parentNode.insertBefore(r,u);})(window,document,
'https://sc-static.net/scevent.min.js');
snaptr('init', '${pixelId}', {
'user_email': '__INSERT_USER_EMAIL__'
});
snaptr('track', 'PAGE_VIEW');

// Form submission tracking
document.addEventListener('formSubmitted', function(e) {
  snaptr('track', '${eventType.toUpperCase()}', {
    'item_category': 'form_submission',
    'currency': 'USD',
    'price': '1.00'
  });
});
</script>
<!-- End Snapchat Pixel Code -->`;
        break;
      case 'tiktok':
        code = `<!-- TikTok Pixel Code with Form Integration -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixelId}');
  ttq.page();
  
  // Form submission tracking
  document.addEventListener('formSubmitted', function(e) {
    ttq.track('${eventType}', {
      'content_type': 'form_submission',
      'content_name': e.detail.formName || 'Lead Form',
      'value': 1.00,
      'currency': 'USD'
    });
  });
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`;
        break;
    }

    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} pixel code with form tracking has been copied to clipboard.`,
    });
  };

  const toggleEvent = (eventName: string) => {
    setTrackingEvents(prev => 
      prev.map(event => 
        event.name === eventName 
          ? { ...event, enabled: !event.enabled }
          : event
      )
    );
  };

  const deletePixel = async (platform: string, pixelId: string) => {
    try {
      // Remove from Supabase database
      const response = await fetch(
        `https://trlklwixfeaexhydzaue.supabase.co/rest/v1/advertising_pixels?id=eq.${pixelId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M',
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Update local state
      switch (platform) {
        case 'facebook':
          setFacebookPixels(prev => prev.filter(p => p.id !== pixelId));
          break;
        case 'snapchat':
          setSnapchatPixels(prev => prev.filter(p => p.id !== pixelId));
          break;
        case 'tiktok':
          setTiktokPixels(prev => prev.filter(p => p.id !== pixelId));
          break;
      }
      
      toast({
        title: "Pixel Deleted",
        description: "Pixel has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting pixel:', error);
      toast({
        title: "Error",
        description: "Failed to delete pixel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'snapchat':
        return (
          <div className="h-5 w-5 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-black">S</span>
          </div>
        );
      case 'tiktok':
        return <Music className="h-5 w-5 text-black" />;
      default:
        return null;
    }
  };

  const renderPixelCard = (pixel: PixelSettings, platform: string) => (
    <Card key={pixel.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPlatformIcon(platform)}
            <div>
              <CardTitle className="text-base font-semibold">{pixel.name}</CardTitle>
              <CardDescription className="text-sm">
                ID: {pixel.pixelId}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={pixel.enabled ? "default" : "secondary"} className="text-xs">
              {pixel.enabled ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Event:</span>
            <Badge variant="outline" className="text-xs">{pixel.eventType}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Target:</span>
            <Badge variant="outline" className="text-xs">{pixel.target}</Badge>
          </div>
        </div>
        
        {pixel.conversionApiEnabled && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600">Conversion API Enabled</span>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => copyPixelCode(platform, pixel.pixelId, pixel.eventType)}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => testPixelEvent(platform, pixel.pixelId, pixel.eventType)}
            className="px-2"
          >
            <TestTube className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => deletePixel(platform, pixel.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const totalActivePixels = facebookPixels.length + snapchatPixels.length + tiktokPixels.length;
  const activeEvents = trackingEvents.filter(e => e.enabled).length;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex-1 bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Advertising Tracking</h1>
                <p className="text-muted-foreground">
                  Set up and manage advertising tracking pixels to optimize your marketing campaigns
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Pixel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Create Pixel</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Platform</Label>
                    <Select value={selectedPlatform} onValueChange={(value: 'facebook' | 'snapchat' | 'tiktok') => setSelectedPlatform(value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">
                          <div className="flex items-center space-x-2">
                            <Facebook className="h-4 w-4 text-blue-600" />
                            <span>Facebook</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="snapchat">
                          <div className="flex items-center space-x-2">
                            <div className="h-4 w-4 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-black">S</span>
                            </div>
                            <span>Snapchat</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="tiktok">
                          <div className="flex items-center space-x-2">
                            <Music className="h-4 w-4 text-black" />
                            <span>TikTok</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Name</Label>
                    <Input
                      placeholder="This name will help you recognize your pixel"
                      value={newPixel.name}
                      onChange={(e) => setNewPixel(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Pixel ID
                    </Label>
                    <Input
                      placeholder={`Enter your ${selectedPlatform} pixel ID here`}
                      value={newPixel.pixelId}
                      onChange={(e) => setNewPixel(prev => ({ ...prev, pixelId: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type event</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={newPixel.eventType === 'Lead' ? 'default' : 'outline'}
                        onClick={() => setNewPixel(prev => ({ ...prev, eventType: 'Lead' }))}
                        className="w-full"
                        size="sm"
                      >
                        Lead
                      </Button>
                      <Button
                        variant={newPixel.eventType === 'Purchase' ? 'default' : 'outline'}
                        onClick={() => setNewPixel(prev => ({ ...prev, eventType: 'Purchase' }))}
                        className="w-full"
                        size="sm"
                      >
                        Purchase
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['All', 'Collection', 'Product'].map((target) => (
                        <Button
                          key={target}
                          variant={newPixel.target === target ? 'default' : 'outline'}
                          onClick={() => setNewPixel(prev => ({ ...prev, target: target as any }))}
                          className="w-full"
                          size="sm"
                        >
                          {target}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {newPixel.target === 'Collection' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select Collection</Label>
                      <Select value={newPixel.targetId} onValueChange={(value) => setNewPixel(prev => ({ ...prev, targetId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select / Search collection" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {newPixel.target === 'Product' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select Product</Label>
                      <Select value={newPixel.targetId} onValueChange={(value) => setNewPixel(prev => ({ ...prev, targetId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select / Search product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading products...
                            </SelectItem>
                          ) : products.length === 0 ? (
                            <SelectItem value="no-products" disabled>
                              No products found
                            </SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>🔄 {productsLoading ? 'Loading...' : `${products.length} products available`}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => loadProducts(activeStore)}
                          disabled={productsLoading}
                        >
                          Sync Products
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Conversion API status (optional)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newPixel.conversionApiEnabled}
                        onCheckedChange={(checked) => 
                          setNewPixel(prev => ({ ...prev, conversionApiEnabled: checked }))
                        }
                      />
                      <Label className="text-sm">Enable Conversion API</Label>
                    </div>
                  </div>
                  
                  <Button onClick={handleCreatePixel} className="w-full" size="lg">
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSave} size="lg">
              Save Settings
            </Button>
          </div>
        </div>

        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
                <CardContent className="flex items-center p-4">
                  <Facebook className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Facebook Pixels</p>
                    <p className="text-2xl font-bold text-blue-800">{facebookPixels.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
                <CardContent className="flex items-center p-4">
                  <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold text-black">S</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Snapchat Pixels</p>
                    <p className="text-2xl font-bold text-yellow-800">{snapchatPixels.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="flex items-center p-4">
                  <Music className="h-8 w-8 text-black mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">TikTok Pixels</p>
                    <p className="text-2xl font-bold text-gray-800">{tiktokPixels.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="flex items-center p-4">
                  <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Active Events</p>
                    <p className="text-2xl font-bold text-green-800">{activeEvents}/{trackingEvents.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pixels Grid */}
            {totalActivePixels === 0 ? (
              <Card className="text-center py-12 bg-gradient-to-br from-background to-muted/10">
                <CardContent>
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Pixels Created Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first advertising pixel to start tracking your campaigns and optimize your marketing performance
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Pixel
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {facebookPixels.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                      <Facebook className="h-6 w-6 text-blue-600" />
                      <span>Facebook Pixels</span>
                      <Badge variant="secondary">{facebookPixels.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {facebookPixels.map((pixel) => renderPixelCard(pixel, 'facebook'))}
                    </div>
                  </div>
                )}

                {snapchatPixels.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                      <div className="h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-black">S</span>
                      </div>
                      <span>Snapchat Pixels</span>
                      <Badge variant="secondary">{snapchatPixels.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {snapchatPixels.map((pixel) => renderPixelCard(pixel, 'snapchat'))}
                    </div>
                  </div>
                )}

                {tiktokPixels.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                      <Music className="h-6 w-6 text-black" />
                      <span>TikTok Pixels</span>
                      <Badge variant="secondary">{tiktokPixels.length}</Badge>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {tiktokPixels.map((pixel) => renderPixelCard(pixel, 'tiktok'))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisingTracking;