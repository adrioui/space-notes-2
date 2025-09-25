import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PublishModalProps {
  isOpen: boolean;
  contentType: 'note' | 'lesson';
  onPublish: (notify: boolean) => void;
  onClose: () => void;
}

export default function PublishModal({ isOpen, contentType, onPublish, onClose }: PublishModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-bullhorn text-accent text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground">Publish {contentType}</h3>
            <p className="text-muted-foreground">How would you like to share this?</p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => onPublish(true)}
              data-testid="button-publish-notify"
            >
              <i className="fas fa-bell mr-2"></i>
              Notify All Members
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onPublish(false)}
              data-testid="button-publish-quiet"
            >
              <i className="fas fa-bell-slash mr-2"></i>
              Publish Quietly
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={onClose}
              data-testid="button-cancel-publish"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
