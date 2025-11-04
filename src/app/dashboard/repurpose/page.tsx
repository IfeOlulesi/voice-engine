"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Image as ImageIcon, 
  Share2, 
  Copy, 
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Linkedin
} from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api, ApiError } from "@/lib/api-client";
import { Toggle } from "@/components/ui/toggle";

interface GeneratedContent {
  platform: 'facebook' | 'instagram' | 'twitter';
  content: string;
  hashtags: string[];
  characterCount: number;
  estimatedEngagement: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface RepurposeResult {
  original: string;
  results: GeneratedContent[];
  metadata: {
    generatedAt: string;
    platformsProcessed: number;
    totalCharacters: number;
  };
}

const platformInfo = {
  facebook: { name: 'Facebook', color: 'bg-blue-100 text-blue-800' },
  instagram: { name: 'Instagram', color: 'bg-pink-100 text-pink-800' },
  twitter: { name: 'X (Twitter)', color: 'bg-gray-100 text-gray-800' }
};

export default function RepurposePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('manual');
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<('facebook' | 'instagram' | 'twitter')[]>(['facebook', 'instagram', 'twitter']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RepurposeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePlatformToggle = (platform: 'facebook' | 'instagram' | 'twitter') => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleRepurpose = async () => {
    if (!text.trim()) {
      setError('Please enter some content to repurpose');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await api.post('/api/repurpose', {
        text,
        images,
        platforms: selectedPlatforms,
        targetAudience: targetAudience.trim() || undefined,
        brandVoice: brandVoice.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
      });

      if (data.success) {
        setResults(data.data);
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Repurpose error:', err);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleLinkedinPull = () => {
    // Navigate to LinkedIn pull page with return URL
    window.location.href = `/dashboard/pull-linkedin?return=${encodeURIComponent('/dashboard/repurpose')}`;
  };

  const getEngagementBadge = (engagement: string) => {
    switch (engagement) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High Engagement</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Engagement</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800">Low Engagement</Badge>;
      default:
        return <Badge variant="outline">{engagement}</Badge>;
    }
  };

  return (
    <DashboardLayout 
      title="Repurpose Content" 
      subtitle="Transform your content for multiple social platforms"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
            <TabsTrigger value="linkedin">Pull from LinkedIn</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Input
                </CardTitle>
                <CardDescription>
                  Enter your content below to repurpose for different social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Original Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your content here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Images (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Images
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience (Optional)</Label>
                    <Input
                      id="audience"
                      placeholder="e.g., Software developers, Tech enthusiasts"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="voice">Brand Voice (Optional)</Label>
                    <Input
                      id="voice"
                      placeholder="e.g., Professional, Casual, Inspirational"
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="context">Additional Context (Optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Any additional context or instructions for content generation..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(platformInfo).map(([key, platform]) => (
                        <Toggle
                          key={key}
                          size="sm"
                          variant="outline"
                          pressed={selectedPlatforms.includes(key as any)}
                          onPressedChange={() => handlePlatformToggle(key as any)}
                          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                        >
                          {platform.name} 
                        </Toggle>
                      ))}
                    </div>
                    {selectedPlatforms.length === 0 && (
                      <p className="text-xs text-red-500">Please select at least one platform</p>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleRepurpose}
                  disabled={isLoading || !text.trim() || selectedPlatforms.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Repurposing Content...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Repurpose Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5" />
                  Pull from LinkedIn
                </CardTitle>
                <CardDescription>
                  Import your LinkedIn posts to repurpose for other platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLinkedinPull}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  Go to LinkedIn Posts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Generated Content</h3>
            
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
              {results.results.filter(result => selectedPlatforms.includes(result.platform)).map((result) => (
                <Card key={result.platform} className="h-fit">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        {platformInfo[result.platform].name}
                      </CardTitle>
                      {getEngagementBadge(result.estimatedEngagement)}
                    </div>
                    <CardDescription>
                      {result.characterCount} characters • {result.hashtags.length} hashtags
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                    </div>
                    
                    {result.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.hashtags.map((hashtag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Suggestions:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {result.suggestions.map((suggestion, index) => (
                          <li key={index}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={() => copyToClipboard(result.content)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Content
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {results.metadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Generated At</p>
                      <p className="font-medium">
                        {new Date(results.metadata.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Platforms</p>
                      <p className="font-medium">{results.metadata.platformsProcessed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Characters</p>
                      <p className="font-medium">{results.metadata.totalCharacters}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Original Length</p>
                      <p className="font-medium">{results.original.length} chars</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}