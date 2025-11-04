"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  User
} from "lucide-react";

interface LinkedInProfile {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
  id?: string;
  given_name?: string;
  family_name?: string;
}

interface LinkedInConnectionStatusProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function LinkedInConnectionStatus({ 
  onConnect, 
  onDisconnect, 
  showActions = true,
  compact = false 
}: LinkedInConnectionStatusProps) {
  const [linkedinToken, setLinkedinToken] = useState<string | null>(null);
  const [isLinkedinConnected, setIsLinkedinConnected] = useState(false);
  const [linkedinProfile, setLinkedinProfile] = useState<LinkedInProfile | null>(null);

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
    if (onConnect) {
      onConnect();
    } else {
      window.location.href = '/api/auth/linkedin/authorize';
    }
  };

  const disconnectLinkedin = () => {
    localStorage.removeItem('linkedin_access_token');
    localStorage.removeItem('linkedin_profile');
    setLinkedinToken(null);
    setLinkedinProfile(null);
    setIsLinkedinConnected(false);
    
    if (onDisconnect) {
      onDisconnect();
    }
  };

  if (!isLinkedinConnected) {
    return (
      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800`}>
        <AlertCircle className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-orange-600 flex-shrink-0`} />
        <div className="flex-1">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-orange-700 dark:text-orange-400`}>
            LinkedIn Not Connected
          </p>
          {!compact && (
            <p className="text-xs text-orange-600 dark:text-orange-500">
              Connect to pull your posts
            </p>
          )}
        </div>
        {showActions && (
          <Button 
            onClick={handleLinkedinLogin}
            variant="outline" 
            size={compact ? "sm" : "sm"}
            className="text-orange-700 border-orange-300 hover:bg-orange-100"
          >
            <Share2 className="h-3 w-3 mr-1" />
            Connect
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800`}>
      <CheckCircle className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-green-600 flex-shrink-0`} />
      <div className="flex items-center gap-2 flex-1">
        {linkedinProfile?.picture && !compact && (
          <img 
            src={linkedinProfile.picture} 
            alt="LinkedIn Profile" 
            className="w-6 h-6 rounded-full border border-green-200"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-green-700 dark:text-green-400`}>
            {linkedinProfile?.name || linkedinProfile?.given_name + ' ' + linkedinProfile?.family_name || 'LinkedIn User'}
          </p>
          {!compact && linkedinProfile?.email && (
            <p className="text-xs text-green-600 dark:text-green-500">
              {linkedinProfile.email}
            </p>
          )}
          {compact && (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 h-4">
              <User className="w-2 h-2 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </div>
      {showActions && (
        <Button 
          onClick={disconnectLinkedin}
          variant="ghost" 
          size="sm"
          className="text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
        >
          Disconnect
        </Button>
      )}
    </div>
  );
}