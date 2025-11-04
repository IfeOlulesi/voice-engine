"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  Loader2, 
  RefreshCw, 
  User,
  Calendar,
  Eye,
  Download,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api-client";

interface LinkedInPost {
  id: string;
  text: string;
  timestamp: string;
  authorName: string;
  authorId: string;
}

export default function PullLinkedInPage() {
  const { user } = useAuth();
  const [linkedinToken, setLinkedinToken] = useState<string | null>(null);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [linkedinProfile, setLinkedinProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [linkedinPosts, setLinkedinPosts] = useState<LinkedInPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null);
  const [lastProcessedPost, setLastProcessedPost] = useState<any>(null);

  // Check for LinkedIn token in localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem('linkedin_access_token');
    const storedProfile = localStorage.getItem('linkedin_profile');
    
    if (token) {
      setLinkedinToken(token);
      setIsLinkedinConnected(true);
      
      if (storedProfile) {
        try {
          setLinkedinProfile(JSON.parse(storedProfile));
        } catch (error) {
          console.error('Error parsing stored LinkedIn profile:', error);
        }
      } else {
        fetchLinkedinProfile(token);
      }
    }

    // Check if we're coming back from LinkedIn OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const profileData = urlParams.get('profile');
    
    if (accessToken) {
      localStorage.setItem('linkedin_access_token', accessToken);
      setLinkedinToken(accessToken);
      setIsLinkedinConnected(true);
      
      if (profileData) {
        try {
          const profile = JSON.parse(decodeURIComponent(profileData));
          localStorage.setItem('linkedin_profile', JSON.stringify(profile));
          setLinkedinProfile(profile);
        } catch (error) {
          console.error('Error parsing profile data from URL:', error);
        }
      }
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchLinkedinProfile = async (token: string) => {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'cache-control': 'no-cache'
        }
      });

      if (response.ok) {
        const profile = await response.json();
        localStorage.setItem('linkedin_profile', JSON.stringify(profile));
        setLinkedinProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching LinkedIn profile:', error);
    }
  };

  const handleLinkedinLogin = () => {
    window.location.href = '/api/auth/linkedin/authorize';
  };

  const disconnectLinkedin = () => {
    localStorage.removeItem('linkedin_access_token');
    localStorage.removeItem('linkedin_profile');
    setLinkedinToken(null);
    setLinkedinProfile(null);
    setIsLinkedinConnected(false);
    setLinkedinPosts([]);
    setSelectedPost(null);
    setLastProcessedPost(null);
  };

  const pullLinkedinPosts = async () => {
    if (!linkedinToken) {
      handleLinkedinLogin();
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.get(`/api/pull-linkedin?access_token=${linkedinToken}&limit=10`);
      
      if (result.success) {
        setLinkedinPosts(result.data.posts);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error pulling LinkedIn posts:', error);
      if (error instanceof ApiError && (error.status === 401 || error.message.includes('token'))) {
        localStorage.removeItem('linkedin_access_token');
        setLinkedinToken(null);
        setIsLinkedinConnected(false);
        alert('LinkedIn token expired. Please reconnect.');
      } else {
        alert('Failed to pull LinkedIn posts. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processPost = async (post: LinkedInPost) => {
    setIsProcessing(true);
    try {
      const result = await api.post('/api/process-post', {
        post: post,
        platforms: ['linkedin', 'x', 'instagram', 'facebook']
      });
      
      if (result.success) {
        setLastProcessedPost(result.data);
        alert('Post successfully processed and scheduled!');
      } else {
        alert(`Error processing post: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing post:', error);
      if (error instanceof ApiError) {
        alert(`Failed to process post: ${error.message}`);
      } else {
        alert('Failed to process post. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout 
      title="Pull LinkedIn Content" 
      subtitle="Connect to LinkedIn and import your posts for repurposing"
    >
      <div className="space-y-6">
        {/* LinkedIn Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              LinkedIn Connection Status
            </CardTitle>
            <CardDescription>
              Connect your LinkedIn account to pull and repurpose your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isLinkedinConnected ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">LinkedIn Not Connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your LinkedIn account to start pulling your posts for repurposing across platforms.
                </p>
                <Button 
                  onClick={handleLinkedinLogin}
                  size="lg"
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Connect LinkedIn Account
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                    <div className="flex items-center gap-3">
                      {linkedinProfile?.picture && (
                        <img 
                          src={linkedinProfile.picture} 
                          alt="LinkedIn Profile" 
                          className="w-12 h-12 rounded-full border-2 border-green-200"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-green-700 dark:text-green-400">
                          {linkedinProfile?.name || 'LinkedIn User'}
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          {linkedinProfile?.email || 'Connected to LinkedIn'}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs border-green-300 text-green-700">
                          <User className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={pullLinkedinPosts}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      {isLoading ? 'Loading...' : 'Pull Posts'}
                    </Button>
                    <Button 
                      onClick={disconnectLinkedin}
                      variant="ghost" 
                      size="sm"
                      className="text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LinkedIn Posts */}
        {linkedinPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Your LinkedIn Posts
              </CardTitle>
              <CardDescription>
                Select a post to repurpose across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {linkedinPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                      selectedPost?.id === post.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{post.authorName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(post.timestamp)}
                            </Badge>
                            {selectedPost?.id === post.id && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  processPost(post);
                                }}
                                disabled={isProcessing}
                                size="sm"
                                className="gap-2"
                              >
                                {isProcessing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Zap className="h-3 w-3" />
                                )}
                                {isProcessing ? 'Processing...' : 'Repurpose'}
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {post.text}
                        </p>
                        {selectedPost?.id === post.id && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                              <Eye className="h-4 w-4" />
                              <span className="text-sm font-medium">Full Content Preview</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{post.text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Processed Post */}
        {lastProcessedPost && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recently Processed
              </CardTitle>
              <CardDescription>
                Your last processed post and its scheduled variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Original Post</h4>
                  <p className="text-sm text-muted-foreground">{lastProcessedPost.original.text}</p>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {lastProcessedPost.variants.map((variant: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {variant.platform}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {variant.characterCount} chars
                        </Badge>
                      </div>
                      <p className="text-sm">{variant.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Scheduled for: {lastProcessedPost.scheduledAt.map((date: string) => 
                      formatDate(date)
                    ).join(', ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {isLinkedinConnected && linkedinPosts.length === 0 && !isLoading && (
          <Card>
            <CardContent className="text-center py-12">
              <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Posts Found</h3>
              <p className="text-muted-foreground mb-6">
                Click "Pull Posts" to fetch your latest LinkedIn content.
              </p>
              <Button 
                onClick={pullLinkedinPosts}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Pull Posts
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}