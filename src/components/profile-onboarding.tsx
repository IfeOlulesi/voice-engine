"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Palette, 
  Target, 
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";

interface ProfileOnboardingProps {
  onComplete: (profileData: any) => void;
  onSkip?: () => void;
}

export function ProfileOnboarding({ onComplete, onSkip }: ProfileOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    name: "",
    industry: "",
    brandType: "personal",
    targetAudience: "",
    tone: "professional",
    personality: "calm",
    formalityLevel: "semi-formal",
    humorStyle: "subtle",
    adjectives: "",
    values: "",
    topics: "",
    contentPillars: "",
    samplePosts: ["", "", ""]
  });

  const steps = [
    {
      title: "Basic Information",
      description: "Tell us about yourself and your brand",
      icon: User
    },
    {
      title: "Writing Style",
      description: "Define your preferred tone and personality",
      icon: Palette
    },
    {
      title: "Brand Voice",
      description: "Describe your brand identity and values",
      icon: Target
    },
    {
      title: "Sample Content",
      description: "Share examples of your writing for AI analysis",
      icon: FileText
    }
  ];

  const updateProfileData = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const updateSamplePost = (index: number, value: string) => {
    const newSamplePosts = [...profileData.samplePosts];
    newSamplePosts[index] = value;
    setProfileData(prev => ({ ...prev, samplePosts: newSamplePosts }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const formattedData = {
      name: profileData.name,
      writingStyle: {
        tone: profileData.tone,
        personality: profileData.personality,
        formalityLevel: profileData.formalityLevel,
        humorStyle: profileData.humorStyle
      },
      brandVoice: {
        industry: profileData.industry,
        brandType: profileData.brandType,
        targetAudience: profileData.targetAudience,
        adjectives: profileData.adjectives.split(',').map(s => s.trim()).filter(Boolean),
        values: profileData.values.split(',').map(s => s.trim()).filter(Boolean)
      },
      contentPreferences: {
        topics: profileData.topics.split(',').map(s => s.trim()).filter(Boolean),
        contentPillars: profileData.contentPillars.split(',').map(s => s.trim()).filter(Boolean),
        preferredFormats: [],
        avoidTopics: []
      },
      sampleContent: {
        originalPosts: profileData.samplePosts.filter(post => post.trim() !== "")
      }
    };
    
    onComplete(formattedData);
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep].icon && (() => {
                  const IconComponent = steps[currentStep].icon;
                  return <IconComponent className="h-5 w-5" />;
                })()}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full" />
            <div className="text-xs text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => updateProfileData("name", e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={profileData.industry}
                    onValueChange={(value) => updateProfileData("industry", value)}
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
                    value={profileData.brandType}
                    onValueChange={(value) => updateProfileData("brandType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  value={profileData.targetAudience}
                  onChange={(e) => updateProfileData("targetAudience", e.target.value)}
                  placeholder="e.g., young professionals, small business owners"
                />
              </div>
            </div>
          )}

          {/* Step 1: Writing Style */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={profileData.tone}
                    onValueChange={(value) => updateProfileData("tone", value)}
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
                    value={profileData.personality}
                    onValueChange={(value) => updateProfileData("personality", value)}
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
                    value={profileData.formalityLevel}
                    onValueChange={(value) => updateProfileData("formalityLevel", value)}
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
                    value={profileData.humorStyle}
                    onValueChange={(value) => updateProfileData("humorStyle", value)}
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
            </div>
          )}

          {/* Step 2: Brand Voice */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Brand Adjectives</Label>
                <Input
                  value={profileData.adjectives}
                  onChange={(e) => updateProfileData("adjectives", e.target.value)}
                  placeholder="e.g., innovative, trustworthy, bold (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <Label>Core Values</Label>
                <Input
                  value={profileData.values}
                  onChange={(e) => updateProfileData("values", e.target.value)}
                  placeholder="e.g., sustainability, transparency, excellence (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Topics</Label>
                <Input
                  value={profileData.topics}
                  onChange={(e) => updateProfileData("topics", e.target.value)}
                  placeholder="e.g., AI, entrepreneurship, marketing (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <Label>Content Pillars</Label>
                <Input
                  value={profileData.contentPillars}
                  onChange={(e) => updateProfileData("contentPillars", e.target.value)}
                  placeholder="e.g., education, inspiration, behind-the-scenes (comma-separated)"
                />
              </div>
            </div>
          )}

          {/* Step 3: Sample Content */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Sparkles className="h-4 w-4" />
                <span>
                  Provide 2-3 examples of your writing so our AI can learn your unique style and voice.
                </span>
              </div>

              {profileData.samplePosts.map((post, index) => (
                <div key={index} className="space-y-2">
                  <Label>Sample Post {index + 1} {index === 0 ? "(Required)" : "(Optional)"}</Label>
                  <Textarea
                    value={post}
                    onChange={(e) => updateSamplePost(index, e.target.value)}
                    placeholder={`Paste a sample of your writing here...`}
                    rows={4}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {onSkip && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip for now
                </Button>
              )}
            </div>

            <div>
              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}