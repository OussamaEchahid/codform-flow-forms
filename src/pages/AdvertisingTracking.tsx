import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Facebook, Music, Plus, Settings, Target, BarChart3, Eye, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

interface TrackingEvent {
  name: string;
  enabled: boolean;
  description: string;
}

const AdvertisingTracking = () => {
  const { toast } = useToast();
  
  const [facebookPixels, setFacebookPixels] = useState<PixelSettings[]>([]);
  const [snapchatPixels, setSnapchatPixels] = useState<PixelSettings[]>([]);
  const [tiktokPixels, setTiktokPixels] = useState<PixelSettings[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  // Sample collections and products for demonstration
  const collections = [
    { id: 'collection1', name: 'Summer Collection' },
    { id: 'collection2', name: 'Winter Collection' },
    { id: 'collection3', name: 'New Arrivals' },
  ];

  const products = [
    { id: 'product1', name: 'Product 1 - T-Shirt' },
    { id: 'product2', name: 'Product 2 - Jeans' },
    { id: 'product3', name: 'Product 3 - Jacket' },
  ];

  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([
    { name: 'Page View', enabled: true, description: 'Track when users visit your website' },
    { name: 'Add to Cart', enabled: true, description: 'Track when users add items to cart' },
    { name: 'Purchase', enabled: true, description: 'Track completed purchases' },
    { name: 'Lead', enabled: false, description: 'Track lead generation events' },
    { name: 'Complete Registration', enabled: false, description: 'Track user registrations' },
    { name: 'Contact', enabled: false, description: 'Track contact form submissions' },
  ]);

  const handleCreatePixel = () => {
    if (!newPixel.name || !newPixel.pixelId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const pixelToAdd = { ...newPixel, id: Date.now().toString() };
    
    switch (selectedPlatform) {
      case 'facebook':
        setFacebookPixels(prev => [...prev, pixelToAdd]);
        break;
      case 'snapchat':
        setSnapchatPixels(prev => [...prev, pixelToAdd]);
        break;
      case 'tiktok':
        setTiktokPixels(prev => [...prev, pixelToAdd]);
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
      description: `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} pixel has been created successfully.`,
    });
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your advertising tracking settings have been updated successfully.",
    });
  };

  const copyPixelCode = (platform: string, pixelId: string) => {
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
        code = `<!-- Facebook Pixel Code -->
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
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`;
        break;
      case 'snapchat':
        code = `<!-- Snapchat Pixel Code -->
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
</script>
<!-- End Snapchat Pixel Code -->`;
        break;
      case 'tiktok':
        code = `<!-- TikTok Pixel Code -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel Code -->`;
        break;
    }

    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} pixel code has been copied to clipboard.`,
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

  const deletePixel = (platform: string, pixelId: string) => {
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
            onClick={() => copyPixelCode(platform, pixel.pixelId)}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Code
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>🔄 sync products</span>
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

        <Tabs defaultValue="pixel-setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50">
            <TabsTrigger value="pixel-setup" className="font-medium">Pixel Setup</TabsTrigger>
            <TabsTrigger value="event-tracking" className="font-medium">Event Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="pixel-setup" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="event-tracking" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <span>Event Tracking Configuration</span>
                </CardTitle>
                <CardDescription>
                  Choose which events to track across all your advertising platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {trackingEvents.map((event) => (
                    <div key={event.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors group">
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors">{event.name}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <Switch
                        checked={event.enabled}
                        onCheckedChange={() => toggleEvent(event.name)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <CardTitle className="text-blue-900">Implementation Guide</CardTitle>
                  <CardDescription className="text-blue-700">
                    How to implement tracking events in your forms
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-900">Automatic Event Tracking</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Events are automatically tracked when users interact with your forms:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>Page View:</strong> Tracked when form is loaded</li>
                      <li>• <strong>Add to Cart:</strong> Tracked when items are added to cart</li>
                      <li>• <strong>Purchase:</strong> Tracked when form is submitted successfully</li>
                      <li>• <strong>Lead:</strong> Tracked when contact information is collected</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium mb-2 text-green-900">Custom Parameters</h4>
                    <p className="text-sm text-green-800">
                      Configure additional parameters for each event in the form builder to send more detailed tracking data.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                  <CardTitle className="text-amber-900">Privacy & Compliance</CardTitle>
                  <CardDescription className="text-amber-700">
                    Important considerations for tracking implementation
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium mb-2 text-amber-900">GDPR & CCPA Compliance</h4>
                    <p className="text-sm text-amber-800 mb-3">
                      Ensure compliance with privacy regulations:
                    </p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Obtain proper consent before tracking</li>
                      <li>• Provide clear privacy policies</li>
                      <li>• Allow users to opt-out of tracking</li>
                      <li>• Honor data deletion requests</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium mb-2 text-purple-900">Best Practices</h4>
                    <p className="text-sm text-purple-800">
                      Follow platform-specific guidelines and test your implementation thoroughly before going live.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvertisingTracking;