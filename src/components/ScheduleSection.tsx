
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Clock } from "lucide-react";
import { Post } from "../hooks/usePosts";
import { toast } from "@/hooks/use-toast";

interface ScheduleSectionProps {
  currentPost?: Post;
  onSchedule?: (postId: string, scheduledTime: string) => void;
}

export function ScheduleSection({ currentPost, onSchedule }: ScheduleSectionProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Generate suggested times - in a real app, these would come from Google Calendar API
  const suggestedTimes = [
    { value: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), label: "Tomorrow at 9:00 AM" },
    { value: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), label: "In 2 days at 10:30 AM" },
    { value: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), label: "In 3 days at 8:00 AM" },
    { value: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), label: "Next Monday at 9:15 AM" },
  ];

  const handleSchedule = () => {
    if (!currentPost || !selectedTime) {
      toast({
        title: "Cannot schedule",
        description: "Please generate a post and select a time first",
        variant: "destructive",
      });
      return;
    }

    onSchedule?.(currentPost.id, selectedTime);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Schedule Post
        </CardTitle>
        <CardDescription>
          Select a suggested time or pick your own
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!currentPost ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              Generate a post first to schedule it
            </div>
            <Button variant="secondary" disabled>
              Select Time
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Suggested posting times</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedTimes.map((time, index) => (
                  <Button
                    key={index}
                    variant={selectedTime === time.value ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setSelectedTime(time.value)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {time.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button 
              className="w-full mt-4" 
              onClick={handleSchedule}
              disabled={!selectedTime}
            >
              Schedule Post
            </Button>
            
            <p className="text-xs text-muted-foreground mt-2">
              In this demo version, scheduling is simulated. In a complete version, this would connect to Google Calendar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
