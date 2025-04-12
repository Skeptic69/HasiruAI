
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, BookmarkPlus, Share2, Check, Copy } from "lucide-react";
import { Post } from "../hooks/usePosts";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PostPreviewProps {
  post?: Post;
  loading?: boolean;
  onSave?: (post: Post) => void;
  onSchedule?: (post: Post) => void;
}

export function PostPreview({ post, loading = false, onSave, onSchedule }: PostPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <Card className="content-card border border-border/40 animate-pulse">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4 bg-secondary/60" />
            <Skeleton className="h-4 w-1/2 bg-secondary/60" />
          </div>
          <Separator className="bg-border/30" />
          <div className="aspect-video relative rounded-md overflow-hidden">
            <Skeleton className="h-full w-full absolute bg-secondary/60" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-secondary/60" />
            <Skeleton className="h-4 w-full bg-secondary/60" />
            <Skeleton className="h-4 w-3/4 bg-secondary/60" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 bg-secondary/60" />
            <Skeleton className="h-9 w-24 bg-secondary/60" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!post) {
    return (
      <Card className="content-card border-dashed border-2 border-border/40">
        <CardContent className="p-6">
          <div className="text-center py-12 space-y-3">
            <div className="mx-auto rounded-full bg-secondary/20 p-3 w-12 h-12 flex items-center justify-center">
              <Copy className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No content generated yet</h3>
            <p className="text-sm text-muted-foreground">Enter a topic above and click Generate to create a LinkedIn post</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Post content has been copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!post) return;
    
    onSave?.(post);
    toast({
      title: "Post saved",
      description: "Your post has been saved successfully",
    });
  };

  const handleSchedule = () => {
    if (!post) return;
    
    onSchedule?.(post);
    toast({
      title: "Schedule post",
      description: "Choose when to post this content",
    });
  };

  return (
    <Card className="content-card overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div>
          <h3 className="text-xl font-medium text-primary">{post.topic}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI-generated content (Gemini)
          </p>
        </div>
        
        <Separator className="bg-border/30" />
        
        {post.imageUrl && (
          <div className="aspect-video relative rounded-md overflow-hidden shadow-md">
            <img 
              src={post.imageUrl} 
              alt={post.topic}
              className="object-cover w-full h-full"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-40"></div>
          </div>
        )}
        
        <div 
          className="whitespace-pre-line text-sm p-5 bg-secondary/30 rounded-md cursor-pointer border border-border/30 hover:border-border/50 transition-colors"
          onClick={handleCopyText}
        >
          {post.content}
        </div>
        
        <div className="flex flex-wrap gap-3 pt-2">
          <Button 
            variant={copied ? "default" : "secondary"} 
            size="sm"
            className={cn(
              "transition-all", 
              copied && "bg-green-600 hover:bg-green-700"
            )}
            onClick={handleCopyText}
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Text"}
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleSave}
          >
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Save
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onSchedule?.(post)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast({
                title: "Share feature",
                description: "Share functionality is not implemented in this version",
              });
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground border-t border-border/30 pt-4 mt-2">
          <p>Remember to review and personalize the content before posting on LinkedIn.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Import the missing Sparkles icon
import { Sparkles } from "lucide-react";
