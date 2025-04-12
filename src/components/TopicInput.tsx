
import { useState, useRef, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp, Trophy } from "lucide-react";
import { Label } from "@/components/ui/label";
import { trendingTopics } from "../utils/dummyData";
import { toast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopicInputProps {
  onGenerate: (topic: string) => Promise<void>;
  isGenerating: boolean;
}

export function TopicInput({ onGenerate, isGenerating }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate content",
        variant: "destructive",
      });
      inputRef.current?.focus();
      return;
    }
    
    try {
      await onGenerate(topic);
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate content. Please check your API key or try again later.",
        variant: "destructive",
      });
      console.error("Error in topic submission:", error);
    }
  };

  const handleTrendingTopicClick = (topic: string) => {
    setTopic(topic);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Card className="content-card">
      <CardHeader className="pb-4 border-b border-border/20">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Create LinkedIn Post
        </CardTitle>
        <CardDescription>
          Enter a topic to generate an engaging LinkedIn post with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic or keyword</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  ref={inputRef}
                  id="topic"
                  placeholder="E.g., AI jobs, Data Science, Leadership"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full"
                  disabled={isGenerating}
                />
                <Button 
                  type="submit" 
                  disabled={isGenerating}
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Trending topics</Label>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {trendingTopics.slice(0, 6).map((topic) => (
                  <Badge 
                    key={topic} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                    onClick={() => handleTrendingTopicClick(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground border-t border-border/20 mt-4">
        Posts are generated using Google's Gemini AI and may need review before sharing.
      </CardFooter>
    </Card>
  );
}
