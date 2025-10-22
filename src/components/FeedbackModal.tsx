import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userContact?: string;
  feedbackPrompt?: string;
  completionMessage?: string;
}

const FeedbackModal = ({ 
  open, 
  onClose, 
  userId, 
  userName, 
  userContact,
  feedbackPrompt = 'How was your experience?',
  completionMessage = 'Thank you for your feedback!'
}: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'feedback'), {
        user_id: userId,
        user_name: userName,
        user_contact: userContact,
        rating,
        message,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
      toast.success('Feedback submitted!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-border">
        {!submitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl font-heading">
                {feedbackPrompt}
              </DialogTitle>
              <DialogDescription>
                Please rate your experience and leave any comments
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts (optional)"
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-3d-gold text-primary-foreground"
              >
                Submit Feedback
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground text-2xl font-heading text-center">
                🎉 All Done!
              </DialogTitle>
            </DialogHeader>
            <div className="py-6 text-center">
              <p className="text-foreground text-lg">{completionMessage}</p>
            </div>
            <DialogFooter>
              <Button
                onClick={onClose}
                className="btn-3d-gold text-primary-foreground w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;
