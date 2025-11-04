"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Upload,
  Sparkles,
  Brain,
  Target,
  Palette,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface UserProfile {
  name: string;
  profileCompletion: number;
  onboardingCompleted: boolean;
  writingStyle: {
    tone: string;
    personality: string;
    formalityLevel: string;
    humorStyle: string;
  };
  brandVoice: {
    adjectives: string[];
    values: string[];
    targetAudience: string;
    industry: string;
    brandType: string;
  };
  contentPreferences: {
    topics: string[];
    contentPillars: string[];
    preferredFormats: string[];
    avoidTopics: string[];
  };
  platformStyles: {
    [key: string]: {
      tone?: string;
      style?: string;
      hashtagStyle?: string;
    };
  };
  sampleContent: {
    originalPosts: string[];
    analyzedPatterns?: {
      vocabularyLevel: string;
      styleNotes: string;
      commonPhrases: string[];
    };
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [newSamplePost, setNewSamplePost] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local input state for array fields to preserve typing experience
  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile(false); // Don't show success toast on initial load
  }, []);

  const fetchProfile = async (showSuccessToast = true) => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const loadedProfile = data.data.profile;
        setProfile(loadedProfile);
        
        // Initialize local inputs for array fields
        if (loadedProfile) {
          setLocalInputs({
            'brandVoice.adjectives': loadedProfile.brandVoice?.adjectives?.join(', ') || '',
            'brandVoice.values': loadedProfile.brandVoice?.values?.join(', ') || '',
            'contentPreferences.topics': loadedProfile.contentPreferences?.topics?.join(', ') || '',
            'contentPreferences.contentPillars': loadedProfile.contentPreferences?.contentPillars?.join(', ') || '',
            'contentPreferences.preferredFormats': loadedProfile.contentPreferences?.preferredFormats?.join(', ') || '',
            'contentPreferences.avoidTopics': loadedProfile.contentPreferences?.avoidTopics?.join(', ') || '',
          });
        }
        
        if (showSuccessToast) {
          toast({
            title: "Profile loaded",
            description: "Your profile has been successfully loaded.",
            variant: "success",
          });
        }
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    setSaving(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.profile);
        toast({
          title: "Profile updated",
          description: "Your changes have been saved successfully.",
          variant: "success",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const debouncedUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      updateProfile(updates);
    }, 1500); // 1.5 second delay
  }, []);

  const updateProfileField = (field: string, value: any) => {
    if (!profile) return;
    
    // Update local state immediately for responsive UI
    const updatedProfile = { ...profile };
    const fieldParts = field.split('.');
    
    if (fieldParts.length === 1) {
      (updatedProfile as any)[field as keyof UserProfile] = value;
    } else if (fieldParts.length === 2) {
      (updatedProfile as any)[fieldParts[0]][fieldParts[1]] = value;
    }
    
    setProfile(updatedProfile);
    
    // Debounce the API call
    const updates: any = {};
    if (fieldParts.length === 1) {
      updates[field] = value;
    } else if (fieldParts.length === 2) {
      updates[fieldParts[0]] = { ...(profile as any)[fieldParts[0] as keyof UserProfile], [fieldParts[1]]: value };
    }
    
    debouncedUpdateProfile(updates);
  };

  const updateProfileArrayField = (field: string, inputValue: string) => {
    if (!profile) return;
    
    // Store the raw input value locally for immediate display
    setLocalInputs(prev => ({ ...prev, [field]: inputValue }));
    
    // Only debounce the API call, don't update profile state immediately
    // This prevents interference with typing
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout for API call
    debounceTimeoutRef.current = setTimeout(() => {
      const arrayValue = inputValue.split(',').map(s => s.trim()).filter(Boolean);
      const fieldParts = field.split('.');
      
      if (fieldParts.length === 2) {
        // Update profile state
        const updatedProfile = { ...profile };
        (updatedProfile as any)[fieldParts[0]][fieldParts[1]] = arrayValue;
        setProfile(updatedProfile);
        
        // Make API call
        const updates: any = {};
        updates[fieldParts[0]] = { ...(profile as any)[fieldParts[0] as keyof UserProfile], [fieldParts[1]]: arrayValue };
        updateProfile(updates);
      }
    }, 1500);
  };

  const getArrayFieldValue = (field: string): string => {
    // Use local input if available, otherwise join the array from profile
    if (localInputs[field] !== undefined) {
      return localInputs[field];
    }
    
    const fieldParts = field.split('.');
    if (fieldParts.length === 2 && profile) {
      const arrayValue = (profile as any)[fieldParts[0]]?.[fieldParts[1]];
      return Array.isArray(arrayValue) ? arrayValue.join(', ') : '';
    }
    
    return '';
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const analyzeSampleContent = async () => {
    if (!profile?.sampleContent?.originalPosts?.length) return;
    
    setAnalyzing(true);
    toast({
      title: "Analyzing your content",
      description: "AI is analyzing your writing style...",
    });
    
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user/analyze-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          samplePosts: profile.sampleContent.originalPosts
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data.profile);
        toast({
          title: "Analysis complete",
          description: "Your writing style has been analyzed and your profile updated.",
          variant: "success",
        });
      } else {
        throw new Error('Failed to analyze content');
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const addSamplePost = () => {
    if (!newSamplePost.trim() || !profile) return;
    
    const updatedPosts = [...(profile.sampleContent.originalPosts || []), newSamplePost];
    updateProfile({
      sampleContent: {
        ...profile.sampleContent,
        originalPosts: updatedPosts
      }
    });
    setNewSamplePost("");
  };

  const removeSamplePost = (index: number) => {
    if (!profile) return;
    
    const updatedPosts = profile.sampleContent.originalPosts.filter((_, i) => i !== index);
    updateProfile({
      sampleContent: {
        ...profile.sampleContent,
        originalPosts: updatedPosts
      }
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Profile" subtitle="Manage your AI writing preferences">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout title="Profile" subtitle="Manage your AI writing preferences">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load profile. Please try again.</span>
              </div>
              <Button onClick={() => fetchProfile(false)} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? "Loading..." : "Reload Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile" subtitle="Manage your AI writing preferences">
      <div className="space-y-6">
        {/* Profile Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Completion
            </CardTitle>
            <CardDescription>
              Complete your profile to get better AI-generated content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{profile.profileCompletion}%</span>
              </div>
              <Progress value={profile.profileCompletion} className="w-full" />
              {profile.onboardingCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Profile setup complete!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Complete your profile for better personalization</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="style">Writing Style</TabsTrigger>
            <TabsTrigger value="brand">Brand Voice</TabsTrigger>
            <TabsTrigger value="content">Content Preferences</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profile.name || ""}
                    onChange={(e) => updateProfileField('name', e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={profile.brandVoice.industry}
                      onValueChange={(value) => updateProfileField('brandVoice.industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="brandType">Brand Type</Label>
                    <Select
                      value={profile.brandVoice.brandType}
                      onValueChange={(value) => updateProfileField('brandVoice.brandType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal Brand</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={profile.brandVoice.targetAudience || ""}
                    onChange={(e) => updateProfileField('brandVoice.targetAudience', e.target.value)}
                    placeholder="e.g., young professionals, small business owners"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Writing Style Tab */}
          <TabsContent value="style" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Writing Style Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Select
                      value={profile.writingStyle.tone}
                      onValueChange={(value) => updateProfileField('writingStyle.tone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="authoritative">Authoritative</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Personality</Label>
                    <Select
                      value={profile.writingStyle.personality}
                      onValueChange={(value) => updateProfile({
                        writingStyle: { ...profile.writingStyle, personality: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="witty">Witty</SelectItem>
                        <SelectItem value="inspiring">Inspiring</SelectItem>
                        <SelectItem value="analytical">Analytical</SelectItem>
                        <SelectItem value="storyteller">Storyteller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Formality Level</Label>
                    <Select
                      value={profile.writingStyle.formalityLevel}
                      onValueChange={(value) => updateProfile({
                        writingStyle: { ...profile.writingStyle, formalityLevel: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-formal">Very Formal</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="semi-formal">Semi-formal</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="very-casual">Very Casual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Humor Style</Label>
                    <Select
                      value={profile.writingStyle.humorStyle}
                      onValueChange={(value) => updateProfile({
                        writingStyle: { ...profile.writingStyle, humorStyle: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="subtle">Subtle</SelectItem>
                        <SelectItem value="witty">Witty</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="sarcastic">Sarcastic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sample Content Analysis */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Sample Content for AI Analysis</h4>
                    <Button 
                      onClick={analyzeSampleContent}
                      disabled={analyzing || !profile.sampleContent.originalPosts?.length}
                      size="sm"
                    >
                      {analyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Analyze Style
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        value={newSamplePost}
                        onChange={(e) => setNewSamplePost(e.target.value)}
                        placeholder="Paste a sample of your writing here..."
                        className="flex-1"
                        rows={3}
                      />
                      <Button onClick={addSamplePost} disabled={!newSamplePost.trim()}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {profile.sampleContent.originalPosts?.map((post, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm line-clamp-2">{post}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSamplePost(index)}
                          className="mt-1 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  {profile.sampleContent.analyzedPatterns && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Analysis Results
                      </h5>
                      <div className="space-y-1 text-sm">
                        <p><strong>Vocabulary Level:</strong> {profile.sampleContent.analyzedPatterns.vocabularyLevel}</p>
                        <p><strong>Style Notes:</strong> {profile.sampleContent.analyzedPatterns.styleNotes}</p>
                        {profile.sampleContent.analyzedPatterns.commonPhrases?.length > 0 && (
                          <p><strong>Common Phrases:</strong> {profile.sampleContent.analyzedPatterns.commonPhrases.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brand Voice Tab */}
          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Brand Voice & Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand Adjectives</Label>
                  <Input
                    value={getArrayFieldValue('brandVoice.adjectives')}
                    onChange={(e) => updateProfileArrayField('brandVoice.adjectives', e.target.value)}
                    placeholder="e.g., innovative, trustworthy, bold (comma-separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Core Values</Label>
                  <Input
                    value={getArrayFieldValue('brandVoice.values')}
                    onChange={(e) => updateProfileArrayField('brandVoice.values', e.target.value)}
                    placeholder="e.g., sustainability, transparency, excellence (comma-separated)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Preferences Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred Topics</Label>
                  <Input
                    value={getArrayFieldValue('contentPreferences.topics')}
                    onChange={(e) => updateProfileArrayField('contentPreferences.topics', e.target.value)}
                    placeholder="e.g., AI, entrepreneurship, marketing (comma-separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content Pillars</Label>
                  <Input
                    value={getArrayFieldValue('contentPreferences.contentPillars')}
                    onChange={(e) => updateProfileArrayField('contentPreferences.contentPillars', e.target.value)}
                    placeholder="e.g., education, inspiration, behind-the-scenes (comma-separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preferred Formats</Label>
                  <Input
                    value={getArrayFieldValue('contentPreferences.preferredFormats')}
                    onChange={(e) => updateProfileArrayField('contentPreferences.preferredFormats', e.target.value)}
                    placeholder="e.g., tips, stories, questions, quotes (comma-separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Topics to Avoid</Label>
                  <Input
                    value={getArrayFieldValue('contentPreferences.avoidTopics')}
                    onChange={(e) => updateProfileArrayField('contentPreferences.avoidTopics', e.target.value)}
                    placeholder="e.g., politics, religion (comma-separated)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {saving && (
          <div className="fixed bottom-4 right-4 bg-background border border-border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Saving changes...</span>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </DashboardLayout>
  );
}