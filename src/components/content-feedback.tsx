"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  Edit3,
  Brain,
  Loader2,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface ContentFeedbackProps {
  generatedContent: string;
  platform: string;
  contentType?: string;
  onFeedbackSubmitted?: () => void;
}

export function ContentFeedback({ 
  generatedContent, 
  platform, 
  contentType = "post",
  onFeedbackSubmitted 
}: ContentFeedbackProps) {
  const { user } = useAuth();
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [userEdit, setUserEdit] = useState(generatedContent);
  const [showEditMode, setShowEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitFeedback = async () => {
    if (satisfaction === null) return;
    
    setIsSubmitting(true);
    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          generatedContent,
          userEdit: showEditMode ? userEdit : undefined,
          satisfaction,
          platform,
          contentType
        })
      });
      
      if (response.ok) {
        setIsSubmitted(true);
        onFeedbackSubmitted?.();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Thank you! Your feedback helps improve AI personalization.
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4" />
          Help Improve Your AI Writing Style
        </CardTitle>
        <CardDescription>
          Your feedback trains the AI to better match your voice and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Generated for {platform}</span>
            <Badge variant="secondary" className="text-xs">{contentType}</Badge>
          </div>
          <div className="p-3 bg-muted rounded-lg text-sm">
            {showEditMode ? (
              <div className="space-y-2">
                <Textarea
                  value={userEdit}
                  onChange={(e) => setUserEdit(e.target.value)}
                  placeholder="Edit the content as you prefer..."
                  className="min-h-24"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowEditMode(false)}
                  >
                    Save Edit
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p>{generatedContent}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEditMode(true)}
                  className="mt-2 text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit Content
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Satisfaction Rating */}
        <div className="space-y-2">
          <span className="text-sm font-medium">How well does this match your style?</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                size="sm"
                variant={satisfaction === rating ? "default" : "outline"}
                onClick={() => setSatisfaction(rating)}
                className="p-2"
              >
                <Star className={`h-4 w-4 ${satisfaction !== null && satisfaction >= rating ? 'fill-current' : ''}`} />
              </Button>
            ))}
          </div>
          {satisfaction !== null && (
            <p className="text-xs text-muted-foreground">
              {satisfaction === 1 && "Needs significant improvement"}
              {satisfaction === 2 && "Somewhat off-brand"}
              {satisfaction === 3 && "Decent, but could be better"}
              {satisfaction === 4 && "Good match to my style"}
              {satisfaction === 5 && "Perfect! Sounds exactly like me"}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSatisfaction(satisfaction === 5 ? null : 5)}
            className={satisfaction === 5 ? "bg-green-50 border-green-300" : ""}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            Love it
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSatisfaction(satisfaction === 1 ? null : 1)}
            className={satisfaction === 1 ? "bg-red-50 border-red-300" : ""}
          >
            <ThumbsDown className="h-3 w-3 mr-1" />
            Not my style
          </Button>
        </div>

        {/* Submit Feedback */}
        <Button 
          onClick={submitFeedback}
          disabled={satisfaction === null || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          Submit Feedback
        </Button>
      </CardContent>
    </Card>
  );
}