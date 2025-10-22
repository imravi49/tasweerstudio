import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Feedback } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import { format } from 'date-fns';

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const feedbackQuery = query(
        collection(db, 'feedback'),
        orderBy('timestamp', 'desc')
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);
      const feedbackList = feedbackSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as Feedback[];
      setFeedback(feedbackList);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-primary text-primary'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading text-gradient-gold mb-2">Feedback</h1>
        <p className="text-muted-foreground">View user feedback and ratings</p>
      </div>

      {feedback.length === 0 ? (
        <Card className="glass-effect border-border">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feedback messages yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <Card key={item.id} className="glass-effect border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {item.user_name || 'Anonymous'}
                      </span>
                    </div>
                    {item.user_contact && (
                      <p className="text-xs text-muted-foreground ml-7">
                        {item.user_contact}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderStars(item.rating)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <p className="text-foreground ml-7">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
