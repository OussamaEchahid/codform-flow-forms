
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Desktop, Smartphone, Tablet, Save, ExternalLink, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import LandingPageTemplateSelector from '@/components/landing/LandingPageTemplateSelector';
import LandingPageSections from '@/components/landing/LandingPageSections';
import LandingPagePreview from '@/components/landing/LandingPagePreview';
import LandingPageSettings from '@/components/landing/LandingPageSettings';

interface PageTemplate {
  id: string;
  page_id: string;
  content: any;
}

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  product_id?: string;
  updated_at: string;
  created_at: string;
}

const LandingPageEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [page, setPage] = useState<LandingPage | null>(null);
  const [template, setTemplate] = useState<PageTemplate | null>(null);
  const [content, setContent] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState<boolean>(!id);
  const [activeTab, setActiveTab] = useState<string>('editor');
  
  const isNewPage = !id;

  useEffect(() => {
    if (id) {
      fetchPageData();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const fetchPageData = async () => {
    try {
      setIsLoading(true);
      
      const { data: pageData, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single();
        
      if (pageError) throw pageError;
      setPage(pageData);
      
      const { data: templateData, error: templateError } = await supabase
        .from('landing_page_templates')
        .select('*')
        .eq('page_id', id)
        .single();
        
      if (templateError && templateError.code !== 'PGRST116') throw templateError;
      
      if (templateData) {
        setTemplate(templateData);
        setContent(templateData.content);
      } else {
        // No template for this page, open the selector
        setTemplateSelectorOpen(true);
      }
    } catch (error) {
      console.error('Error fetching page data:', error);
      toast.error(language === 'ar' ? 'خطأ في تحميل بيانات الصفحة' : 'Error loading page data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/landing-pages');
  };

  const handleSelectTemplate = async (templateContent: any) => {
    setContent(templateContent);
    setTemplateSelectorOpen(false);
    
    if (isNewPage) {
      await handleCreatePage(templateContent);
    } else if (id) {
      await handleSaveTemplate(templateContent);
    }
  };

  const handleCreatePage = async (templateContent: any) => {
    try {
      setIsSaving(true);
      
      const title = language === 'ar' ? 'صفحة جديدة' : 'New Page';
      const slug = `page-${Date.now()}`;
      
      const { data: newPage, error: pageError } = await supabase
        .from('landing_pages')
        .insert({
          title,
          slug,
          is_published: false
        })
        .select()
        .single();
      
      if (pageError) throw pageError;
      
      const { error: templateError } = await supabase
        .from('landing_page_templates')
        .insert({
          page_id: newPage.id,
          content: templateContent
        });
      
      if (templateError) throw templateError;
      
      setPage(newPage);
      setTemplate({
        id: 'new',
        page_id: newPage.id,
        content: templateContent
      });
      
      // Replace URL with the new page ID without page reload
      navigate(`/landing-pages/editor/${newPage.id}`, { replace: true });
      
      toast.success(language === 'ar' ? 'تم إنشاء الصفحة بنجاح' : 'Page created successfully');
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error(language === 'ar' ? 'خطأ في إنشاء الصفحة' : 'Error creating page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async (templateContent: any = content) => {
    if (!id || !templateContent) return;
    
    try {
      setIsSaving(true);
      
      if (template) {
        // Update existing template
        const { error } = await supabase
          .from('landing_page_templates')
          .update({ content: templateContent })
          .eq('id', template.id);
          
        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('landing_page_templates')
          .insert({
            page_id: id,
            content: templateContent
          });
          
        if (error) throw error;
      }
      
      toast.success(language === 'ar' ? 'تم حفظ الصفحة بنجاح' : 'Page saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(language === 'ar' ? 'خطأ في حفظ الصفحة' : 'Error saving page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePage = async (pageData: Partial<LandingPage>) => {
    if (!page && !id) return;
    
    try {
      setIsSaving(true);
      
      const pageId = page ? page.id : id;
      
      const { data, error } = await supabase
        .from('landing_pages')
        .update(pageData)
        .eq('id', pageId)
        .select()
        .single();
        
      if (error) throw error;
      
      setPage(data);
      toast.success(language === 'ar' ? 'تم تحديث إعدادات الصفحة بنجاح' : 'Page settings updated successfully');
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error(language === 'ar' ? 'خطأ في تحديث إعدادات الصفحة' : 'Error updating page settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!page) return;
    
    try {
      setIsPublishing(true);
      
      const newPublishState = !page.is_published;
      
      await handleSavePage({
        is_published: newPublishState
      });
      
      toast.success(
        newPublishState
          ? (language === 'ar' ? 'تم نشر الصفحة بنجاح' : 'Page published successfully')
          : (language === 'ar' ? 'تم إلغاء نشر الصفحة' : 'Page unpublished')
      );
    } catch (error) {
      console.error('Error toggling publish state:', error);
      toast.error(language === 'ar' ? 'خطأ في تغيير حالة النشر' : 'Error changing publish state');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSectionUpdate = (sectionId: string, sectionContent: any) => {
    if (!content) return;
    
    const updatedContent = {
      ...content,
      sections: content.sections.map((section: any) => {
        if (section.id === sectionId) {
          return {
            ...section,
            ...sectionContent
          };
        }
        return section;
      })
    };
    
    setContent(updatedContent);
  };

  const handleAddSection = (sectionTemplate: any) => {
    if (!content) {
      setContent({
        sections: [sectionTemplate]
      });
      return;
    }
    
    const updatedContent = {
      ...content,
      sections: [...(content.sections || []), sectionTemplate]
    };
    
    setContent(updatedContent);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!content) return;
    
    const updatedContent = {
      ...content,
      sections: content.sections.filter((section: any) => section.id !== sectionId)
    };
    
    setContent(updatedContent);
    setSelectedSection(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {templateSelectorOpen && !isLoading ? (
        <LandingPageTemplateSelector 
          onSelect={handleSelectTemplate}
          onBack={handleBackToList}
        />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBackToList}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {language === 'ar' ? 'العودة إلى القائمة' : 'Back to list'}
                </Button>
                <h1 className="text-xl font-semibold">
                  {page?.title || (language === 'ar' ? 'صفحة جديدة' : 'New Page')}
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="border rounded-md flex">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                    className="rounded-r-none border-r"
                  >
                    <Desktop className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                    className="rounded-none border-r"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                    className="rounded-l-none"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setSettingsOpen(true)}
                >
                  {language === 'ar' ? 'الإعدادات' : 'Settings'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleSaveTemplate()}
                  disabled={isSaving || !content}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                    : (language === 'ar' ? 'حفظ' : 'Save')}
                </Button>
                
                <Button
                  variant={page?.is_published ? "secondary" : "default"}
                  onClick={handleTogglePublish}
                  disabled={isPublishing || !page}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isPublishing
                    ? (language === 'ar' ? 'جاري المعالجة...' : 'Processing...')
                    : page?.is_published
                      ? (language === 'ar' ? 'إلغاء النشر' : 'Unpublish')
                      : (language === 'ar' ? 'نشر' : 'Publish')}
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Layout */}
          <div className="grid grid-cols-12 min-h-[calc(100vh-4rem)]">
            {/* Left Sidebar */}
            <div className="col-span-3 bg-white border-r overflow-auto h-[calc(100vh-4rem)]">
              <LandingPageSections 
                content={content} 
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
                onUpdateSection={handleSectionUpdate}
                onAddSection={handleAddSection}
                onRemoveSection={handleRemoveSection}
              />
            </div>

            {/* Preview Area */}
            <div className="col-span-9 bg-gray-100 overflow-auto h-[calc(100vh-4rem)] p-4">
              <LandingPagePreview 
                content={content} 
                mode={previewMode}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
              />
            </div>
          </div>

          {/* Settings Modal */}
          {settingsOpen && page && (
            <LandingPageSettings 
              page={page}
              onSave={handleSavePage}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LandingPageEditor;
