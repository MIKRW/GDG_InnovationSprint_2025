
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { PromptContent } from '@/lib/types';
import { getPromptContentForSystem, publishNewPromptContent } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface PromptContentManagerProps {
    systemId: string | null;
}

export function PromptContentManager({ systemId }: PromptContentManagerProps) {
  const [contentByCategory, setContentByCategory] = useState<Map<string, PromptContent[]>>(new Map());
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<PromptContent | null>(null);
  const [editText, setEditText] = useState('');
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [saveType, setSaveType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');


  const fetchData = useCallback(async () => {
    if (!systemId) {
      setLoading(false);
      setContentByCategory(new Map());
      setCategories([]);
      setSelectedCategory(null);
      return;
    }
    setLoading(true);
    try {
        const content = await getPromptContentForSystem(systemId);
        
        const newContentByCategory = new Map<string, PromptContent[]>();
        content.forEach(c => {
            if (!newContentByCategory.has(c.categoryId)) {
                newContentByCategory.set(c.categoryId, []);
            }
            newContentByCategory.get(c.categoryId)!.push(c);
        });
        
        setContentByCategory(newContentByCategory);
        const newCategories = Array.from(newContentByCategory.keys());
        setCategories(newCategories);

        if (newCategories.length > 0) {
            const currentSelectedCategory = newCategories.includes(selectedCategory || '') ? selectedCategory : newCategories[0];
            setSelectedCategory(currentSelectedCategory);
            const contentForCategory = newContentByCategory.get(currentSelectedCategory || newCategories[0]);
            if (contentForCategory && contentForCategory.length > 0) {
              setSelectedContent(contentForCategory[0]); // Select latest
              setEditText(contentForCategory[0].promptText);
            } else {
              setSelectedContent(null);
              setEditText('');
            }
        } else {
            setSelectedCategory(null);
            setSelectedContent(null);
            setEditText('');
        }

    } catch (error) {
      console.error('Failed to fetch prompt content data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load prompt content data from Firestore.',
      });
    } finally {
      setLoading(false);
    }
  }, [systemId, toast, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset when systemId changes
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedContent(null);
    setEditText('');
  }, [systemId]);


  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'create-new-category') {
        setIsCategoryDialogOpen(true);
        return;
    }

    setSelectedCategory(categoryId);
    const contentForCategory = contentByCategory.get(categoryId);
    if (contentForCategory && contentForCategory.length > 0) {
      const latestContent = contentForCategory[0]; // Already sorted by action
      setSelectedContent(latestContent);
      setEditText(latestContent.promptText);
    } else {
      setSelectedContent(null);
      setEditText('');
    }
  };

  const handleCreateNewCategory = () => {
    if (!newCategoryName.trim()) {
        toast({ variant: 'destructive', title: 'Invalid Name', description: 'Category name cannot be empty.' });
        return;
    }
    // Convert to snake_case for consistency
    const formattedCategoryName = newCategoryName.trim().replace(/\s+/g, '_').toLowerCase();

    if (categories.includes(formattedCategoryName)) {
        toast({ variant: 'destructive', title: 'Category Exists', description: 'A category with this name already exists.' });
        return;
    }

    setCategories(prev => [...prev, formattedCategoryName].sort());
    setSelectedCategory(formattedCategoryName);
    setSelectedContent(null);
    setEditText('');
    
    setIsCategoryDialogOpen(false);
    setNewCategoryName('');
    toast({ title: 'Category Created', description: `Now writing the first version for "${formattedCategoryName}".` });
  };


  const handleContentVersionChange = (contentId: string) => {
    if (!selectedCategory) return;
    const contentList = contentByCategory.get(selectedCategory);
    const content = contentList?.find(c => c.id === contentId);
    if (content) {
      setSelectedContent(content);
      setEditText(content.promptText);
    }
  };

  const handlePublish = async () => {
    if (!systemId || !selectedCategory || !nextVersionString || editText.trim() === '') {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please select a system, category, and ensure the prompt text is not empty.' });
        return;
    }

    setIsSubmitting(true);
    try {
        await publishNewPromptContent({
            systemId,
            categoryId: selectedCategory,
            version: nextVersionString,
            promptText: editText,
            previousVersionId: selectedContent?.id
        });
        
        toast({ title: 'Published!', description: `Prompt content ${nextVersionString} for '${selectedCategory}' is now saved.` });
        
        await fetchData(); // Refresh data

    } catch (error) {
        console.error('Failed to publish prompt content:', error);
        toast({ variant: 'destructive', title: 'Publish Failed', description: 'Could not save the new prompt content.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const nextVersionString = useMemo(() => {
    if (!selectedCategory) return "v1.0.0";
    const versionsForCategory = contentByCategory.get(selectedCategory);
    const latestVersion = versionsForCategory?.[0]; // Assumes sorted
    if (!latestVersion || !latestVersion.version) return "v1.0.0";

    const [major, minor, patch] = latestVersion.version.replace('v', '').split('.').map(Number);
    if (saveType === 'major') return `v${major + 1}.0.0`;
    if (saveType === 'minor') return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
  }, [selectedCategory, contentByCategory, saveType]);


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-2/3" />
           <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }
  
  if (!systemId) {
    // This state is handled by the PromptSystemVersionManager above, so this should not be visible.
    // Kept as a safeguard.
    return null;
  }

  return (
    <Card>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="p-6 hover:no-underline">
            <div className="flex-1 text-center">
              <CardTitle>Prompt Editor</CardTitle>
              <CardDescription>
                Edit and version the raw text for each prompt component. A new version is saved each time you publish.
              </CardDescription>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="category-select">Prompt Category</Label>
                      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                          <Select value={selectedCategory || ''} onValueChange={handleCategoryChange}>
                              <SelectTrigger id="category-select">
                                  <SelectValue placeholder="Select a category..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {categories.map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</SelectItem>
                                  ))}
                                  <Separator className="my-1" />
                                  <SelectItem value="create-new-category" className="font-semibold text-primary">
                                      Create New Category...
                                  </SelectItem>
                              </SelectContent>
                          </Select>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>Create New Prompt Category</DialogTitle>
                                  <DialogDescription>
                                      Enter a name for the new category. It will be converted to snake_case (e.g., "My Category" becomes "my_category").
                                  </DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center space-x-2">
                                <Input 
                                      placeholder="e.g., Image Analysis" 
                                      value={newCategoryName}
                                      onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <Button onClick={handleCreateNewCategory}>Create</Button>
                              </div>
                          </DialogContent>
                      </Dialog>
                  </div>
                  <div>
                      <Label htmlFor="content-version-select">Content Version</Label>
                      <Select value={selectedContent?.id || ''} onValueChange={handleContentVersionChange} disabled={!selectedCategory}>
                          <SelectTrigger id="content-version-select">
                              <SelectValue placeholder="Select a version..." />
                          </SelectTrigger>
                          <SelectContent>
                              {selectedCategory && contentByCategory.get(selectedCategory)?.map(c => (
                                  <SelectItem key={c.id} value={c.id}>
                                      {c.version} - {new Date(c.timestamp).toLocaleDateString()}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              <div>
                  <Label htmlFor="prompt-editor">Prompt Text</Label>
                  <ScrollArea className="h-72 w-full rounded-md border">
                    <Textarea 
                      id="prompt-editor"
                      className="h-full min-h-[inherit] w-full resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Enter or load prompt text here..."
                    />
                  </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-8">
                      <div className="space-y-2">
                          <Label>New Version Type</Label>
                          <RadioGroup
                              defaultValue="patch"
                              className="flex gap-4"
                              onValueChange={(v) => setSaveType(v as any)}
                          >
                              <div className="flex items-center space-x-2"><RadioGroupItem value="major" id="content-major" /><Label htmlFor="content-major">Major</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="minor" id="content-minor" /><Label htmlFor="content-minor">Minor</Label></div>
                              <div className="flex items-center space-x-2"><RadioGroupItem value="patch" id="content-patch" /><Label htmlFor="content-patch">Patch</Label></div>
                          </RadioGroup>
                      </div>
                      <div className="flex items-center gap-2">
                          <Label className="text-muted-foreground">Next Version:</Label>
                          <Badge variant="outline">{nextVersionString}</Badge>
                      </div>
                  </div>
                  <Button onClick={handlePublish} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish New Content Version
                  </Button>
              </div>
            </CardFooter>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
