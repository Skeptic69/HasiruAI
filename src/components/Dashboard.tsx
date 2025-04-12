
import { useState } from "react";
import { Navigation } from "./Navigation";
import { TopicInput } from "./TopicInput";
import { PostPreview } from "./PostPreview";
import { ScheduleSection } from "./ScheduleSection";
import { SavedPosts } from "./SavedPosts";
import { usePosts, Post } from "../hooks/usePosts";
import { toast } from "@/hooks/use-toast";
import { Settings, InfoIcon, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Tab = "create" | "schedule" | "saved" | "settings";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [currentPost, setCurrentPost] = useState<Post | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { posts, generatePost, savePost, schedulePost, deletePost } = usePosts();

  const handleGenerate = async (topic: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const post = await generatePost(topic);
      setCurrentPost(post);
      toast({
        title: "Post generated",
        description: "Your LinkedIn post has been generated successfully",
      });
    } catch (error) {
      console.error("Generation error:", error);
      setError("Failed to generate post. Please check your API key or try again later.");
      toast({
        title: "Generation failed",
        description: "Failed to generate post. Please check your API key or try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePost = (post: Post) => {
    savePost(post);
    toast({
      title: "Post saved",
      description: "Your post has been saved to your collection",
    });
  };

  const handleSchedulePost = (postId: string, scheduledTime: string) => {
    schedulePost(postId, scheduledTime);
    setActiveTab("saved");
    toast({
      title: "Post scheduled",
      description: "Your post has been scheduled successfully",
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "create":
        return (
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <TopicInput onGenerate={handleGenerate} isGenerating={isGenerating} />
            <PostPreview 
              post={currentPost} 
              loading={isGenerating} 
              onSave={handleSavePost}
              onSchedule={() => setActiveTab("schedule")}
            />
          </div>
        );
      case "schedule":
        return (
          <div className="space-y-6">
            <ScheduleSection 
              currentPost={currentPost}
              onSchedule={handleSchedulePost}
            />
            <PostPreview 
              post={currentPost}
              onSave={handleSavePost}
            />
          </div>
        );
      case "saved":
        return (
          <SavedPosts posts={posts} onDelete={deletePost} />
        );
      case "settings":
        return (
          <Card className="content-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure your LinkElevate experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertTitle>API Integration</AlertTitle>
                <AlertDescription>
                  LinkElevate is now connected to the Google Gemini API. In a production environment, API keys should be stored securely on a backend server.
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Google Gemini API: Connected and working</li>
                    <li>Unsplash API: Connected via URL parameters</li>
                    <li>Local Storage: Being used for saving posts</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Navigation activeTab={activeTab} onChange={setActiveTab} />
      
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
