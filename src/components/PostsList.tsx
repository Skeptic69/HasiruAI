
import { Post } from "../hooks/usePosts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Clock, Trash2, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface PostsListProps {
  posts: Post[];
  onDelete?: (postId: string) => void;
  emptyMessage?: string;
}

export function PostsList({ posts, onDelete, emptyMessage = "No posts found" }: PostsListProps) {
  if (posts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="w-full card-hover">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{post.topic}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {post.scheduledFor ? (
                <>
                  <CalendarClock className="h-4 w-4" />
                  <span>Scheduled for {formatDate(post.scheduledFor)}</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  <span>Saved on {formatDate(post.savedAt)}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <div className="aspect-video rounded-md overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.topic}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <div className="w-full md:w-2/3">
                <p className="text-sm whitespace-pre-line line-clamp-4">
                  {post.content}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => {
                onDelete?.(post.id);
                toast({
                  title: "Post deleted",
                  description: "The post has been deleted successfully",
                });
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(post.content);
                toast({
                  title: "Copied to clipboard",
                  description: "Post content has been copied to clipboard",
                });
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
