"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  Calendar, 
  FileText, 
  Zap, 
  TrendingUp, 
  Users, 
  Share2,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";

const stats = [
  {
    title: "Total Posts",
    value: "24",
    change: "+4 this week",
    icon: FileText,
    trend: "up"
  },
  {
    title: "Scheduled Posts",
    value: "8",
    change: "Next: Today 7PM",
    icon: Calendar,
    trend: "neutral"
  },
  {
    title: "Platforms",
    value: "4",
    change: "LinkedIn, X, IG, FB",
    icon: Share2,
    trend: "neutral"
  },
  {
    title: "Success Rate",
    value: "96%",
    change: "+2% this month",
    icon: TrendingUp,
    trend: "up"
  }
];

const recentPosts = [
  {
    id: "1",
    original: "How AI is transforming software engineering workflows...",
    platforms: ["LinkedIn", "X", "Instagram"],
    status: "posted",
    scheduledAt: "2025-01-15 08:00",
    engagement: "142 likes, 23 comments"
  },
  {
    id: "2", 
    original: "5 key principles for building scalable AI applications...",
    platforms: ["LinkedIn", "X", "Facebook"],
    status: "scheduled",
    scheduledAt: "2025-01-16 19:00",
    engagement: "-"
  },
  {
    id: "3",
    original: "The future of developer tools: AI-powered coding assistants...",
    platforms: ["LinkedIn", "Instagram"],
    status: "failed",
    scheduledAt: "2025-01-14 08:30",
    engagement: "Retry needed"
  },
  {
    id: "4",
    original: "Building better user experiences with AI insights...",
    platforms: ["X", "Facebook", "Instagram"],
    status: "queued",
    scheduledAt: "2025-01-17 08:00",
    engagement: "-"
  }
];

const upcomingSchedule = [
  { platform: "X (Twitter)", time: "Today, 7:00 PM", content: "Thread about AI engineering best practices" },
  { platform: "Instagram", time: "Tomorrow, 8:30 AM", content: "Carousel: 5 AI tools for developers" },
  { platform: "Facebook", time: "Tomorrow, 7:00 PM", content: "Discussion: The future of AI in tech" },
  { platform: "LinkedIn", time: "Friday, 8:00 AM", content: "Article: Building AI-powered applications" }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [linkedinToken, setLinkedinToken] = useState<string | null>(null);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [linkedinProfile, setLinkedinProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPulledPost, setLastPulledPost] = useState<any>(null);

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
        // If we have a token but no profile, try to fetch it
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
    // Redirect to LinkedIn OAuth
    window.location.href = '/api/auth/linkedin/authorize';
  };

  const handlePullLinkedinPost = () => {
    if (!linkedinToken) {
      handleLinkedinLogin();
      return;
    }
    // Redirect to dedicated pull LinkedIn page
    window.location.href = '/dashboard/pull-linkedin';
  };

  const disconnectLinkedin = () => {
    localStorage.removeItem('linkedin_access_token');
    localStorage.removeItem('linkedin_profile');
    setLinkedinToken(null);
    setLinkedinProfile(null);
    setIsLinkedinConnected(false);
    setLastPulledPost(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Posted
        </Badge>;
      case "scheduled":
        return <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Scheduled
        </Badge>;
      case "failed":
        return <Badge variant="destructive">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case "queued":
        return <Badge variant="outline">
          <Play className="w-3 h-3 mr-1" />
          Queued
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle={`Welcome back, ${user?.displayName || user?.email?.split('@')[0] || 'there'}!`}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Automate your content workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isLinkedinConnected ? (
                <Button 
                  onClick={handleLinkedinLogin}
                  className="w-full justify-start" 
                  size="lg"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Connect LinkedIn Account
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {linkedinProfile?.picture && (
                            <img 
                              src={linkedinProfile.picture} 
                              alt="LinkedIn Profile" 
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400">
                              {linkedinProfile?.name || 'LinkedIn User'}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500">
                              {linkedinProfile?.email || 'Connected to LinkedIn'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={disconnectLinkedin}
                      variant="ghost" 
                      size="sm"
                      className="text-xs text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Disconnect
                    </Button>
                  </div>
                  <Button 
                    onClick={handlePullLinkedinPost}
                    disabled={isLoading}
                    className="w-full justify-start" 
                    size="lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    {isLoading ? 'Loading...' : 'Manage LinkedIn Posts'}
                  </Button>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="lg"
                onClick={() => window.location.href = '/dashboard/repurpose'}
              >
                <FileText className="h-4 w-4 mr-2" />
                Repurpose Existing Content
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Manual Post
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Posts
              </CardTitle>
              <CardDescription>
                Next 4 scheduled publications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSchedule.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{item.platform}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Posts
            </CardTitle>
            <CardDescription>
              Your latest content across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-xs">
                      <p className="truncate font-medium">{post.original}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(post.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.scheduledAt}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.engagement}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}